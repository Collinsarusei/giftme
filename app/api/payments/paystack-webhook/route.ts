// app/api/payments/paystack-webhook/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { getCollection } from "@/lib/mongodb"
import type { Gift } from "@/lib/models/Event"
import type { DeveloperGift } from "@/lib/models/DeveloperGift"
import crypto from "crypto"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_302d1221c06cb6c10f842bc4883282c684c52dee"

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-paystack-signature")
  const body = await request.text()

  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(body).digest("hex")
  if (hash !== signature) {
    return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === "charge.success") {
    const { metadata, amount, currency, reference, customer } = event.data

    if (!metadata || !metadata.eventId) {
      return NextResponse.json({ success: true, message: "Missing metadata" })
    }

    // Handle Developer Support Gift
    if (metadata.eventId === 'dev-support') {
        const devGiftCollection = await getCollection('developer_gifts');
        const newDevGift: Omit<DeveloperGift, '_id'> = {
            id: `dev-gift_${reference}`,
            from: metadata.from || customer.name || "Anonymous",
            email: customer.email,
            amount: amount / 100, // Store gross amount
            currency: currency,
            message: metadata.message || "",
            timestamp: new Date().toISOString(),
            paymentMethod: "paystack",
            status: "completed", // Directly available for withdrawal
            transactionId: reference,
        };
        await devGiftCollection.insertOne(newDevGift);
        console.log(`Developer gift ${newDevGift.id} recorded successfully.`);

    } else {
        // Handle Regular Event Gift
        const grossAmount = amount / 100;
        const platformFee = grossAmount * 0.03;
        const netAmount = grossAmount - platformFee;

        const newGift: Gift = {
            id: `gift_${reference}`,
            from: metadata.from || customer.name || "Anonymous",
            email: customer.email,
            amount: grossAmount,
            developerFee: platformFee,
            currency: currency,
            message: metadata.message || "",
            timestamp: new Date().toISOString(),
            paymentMethod: "paystack",
            status: "pending_withdrawal",
            transactionId: reference,
        };

        const wasGiftAdded = await EventService.addGiftToEvent(metadata.eventId, newGift, netAmount);
        if (wasGiftAdded) {
            console.log(`Successfully added gift ${newGift.id} to event ${metadata.eventId}`);
        } else {
            console.error(`Failed to add gift for event ${metadata.eventId}`);
        }
    }
  }

  return NextResponse.json({ success: true })
}
