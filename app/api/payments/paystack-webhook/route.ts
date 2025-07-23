// app/api/payments/paystack-webhook/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import type { Gift } from "@/lib/models/Event"
import crypto from "crypto"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_302d1221c06cb6c10f842bc4883282c684c52dee"

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-paystack-signature")
  const body = await request.text()

  // 1. Verify the webhook signature
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(body).digest("hex")
  if (hash !== signature) {
    console.error("Invalid Paystack webhook signature.")
    return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(body)

  // 2. Handle the 'charge.success' event
  if (event.event === "charge.success") {
    const { metadata, amount, currency, reference, customer } = event.data

    // Metadata should contain eventId and other gift details
    if (!metadata || !metadata.eventId) {
      console.warn("Webhook received for charge.success with no eventId in metadata.")
      return NextResponse.json({ success: true, message: "Missing metadata" })
    }

    try {
      // 3. Calculate Developer Fee (3%)
      const grossAmount = amount / 100 // Amount is in kobo/cents
      const developerFee = grossAmount * 0.03
      const netAmount = grossAmount - developerFee // This is the amount the event creator 'raises'

      // 4. Create the Gift object
      const newGift: Gift = {
        id: `gift_${reference}`, // Use Paystack reference as a unique ID
        from: metadata.from || customer.name || "Anonymous",
        email: customer.email,
        amount: grossAmount, // Store the original gross amount
        developerFee: developerFee, // Store the calculated fee
        currency: currency,
        message: metadata.message || "",
        timestamp: new Date().toISOString(),
        paymentMethod: "paystack",
        status: "pending_withdrawal", // Ready for the creator to withdraw
        transactionId: reference,
      }

      // 5. Add the gift to the event, updating the raised amount with the net value
      const wasGiftAdded = await EventService.addGiftToEvent(metadata.eventId, newGift, netAmount)

      if (wasGiftAdded) {
        console.log(`Successfully added gift ${newGift.id} to event ${metadata.eventId}`)
      } else {
        console.error(`Failed to add gift for event ${metadata.eventId} after successful payment.`)
        // This might require manual intervention or a retry mechanism
      }
    } catch (error) {
      console.error("Error processing Paystack webhook:", error)
      return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
    }
  }

  // Acknowledge receipt of the event
  return NextResponse.json({ success: true })
}
