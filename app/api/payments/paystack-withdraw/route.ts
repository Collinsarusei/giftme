// app/api/payments/paystack-withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { PlatformFeeService } from "@/lib/services/platformFeeService"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PLATFORM_FEE_PERCENTAGE = 0.03 // 3%
const PAYSTACK_TRANSFER_FEE_KES = 20 // KES

async function getOrCreateRecipient(
  name: string,
  mpesaNumber: string,
  currency: string
): Promise<string> {
  // 1. Create a Transfer Recipient with Paystack
  const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "mobile_money",
      name: name,
      account_number: mpesaNumber,
      bank_code: "MPESA", // Changed from MTN to MPESA
      currency: currency.toUpperCase(),
    }),
  })

  const recipientResult = await recipientResponse.json()

  if (!recipientResult.status || !recipientResult.data.recipient_code) {
    throw new Error(recipientResult.message || "Failed to create transfer recipient.")
  }

  return recipientResult.data.recipient_code
}

export async function POST(request: NextRequest) {
  try {
    let {
      eventId,
      giftIds,
      recipientCode, // This might be null on the first withdrawal
      amount, // Changed from grossAmount to amount
      currency = "KES",
      reason,
      // We now accept these fields to create a recipient if one doesn't exist
      name,
      mpesaNumber,
    } = await request.json()

    // --- Validation ---
    if (!eventId || !giftIds || !amount || (!recipientCode && !mpesaNumber)) { // Changed grossAmount to amount
      return NextResponse.json({ success: false, message: "Missing required fields for withdrawal." }, { status: 400 })
    }

    // --- Recipient Handling ---
    if (!recipientCode && mpesaNumber && name) {
      console.log("No recipient code found, creating a new one...");
      recipientCode = await getOrCreateRecipient(name, mpesaNumber, currency);
      // Save the new recipient code back to the event for future use
      await EventService.updateEventRecipientCode(eventId, recipientCode);
      console.log(`New recipient code ${recipientCode} saved for event ${eventId}.`);
    } else if (!recipientCode) {
        return NextResponse.json({ success: false, message: "A valid recipient or M-Pesa number is required." }, { status: 400 });
    }

    // --- Fee Calculation ---
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE // Changed grossAmount to amount
    const transactionFee = currency.toUpperCase() === "KES" ? PAYSTACK_TRANSFER_FEE_KES : 0
    const netAmount = amount - platformFee - transactionFee // Changed grossAmount to amount

    if (netAmount <= 0) {
      return NextResponse.json({ success: false, message: "Net withdrawal amount is too low after fees." }, { status: 400 })
    }

    // --- Paystack Transfer ---
    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(netAmount * 100),
        recipient: recipientCode,
        reason: reason || `Withdrawal for event ${eventId}`,
        currency: currency.toUpperCase(),
      }),
    })

    const transferResult = await transferResponse.json()

    if (!transferResult.status || (transferResult.data.status !== 'pending' && transferResult.data.status !== 'success')) {
      return NextResponse.json( { success: false, message: transferResult.message || "Failed to initiate transfer." }, { status: 500 } )
    }

    // --- Database Updates ---
    await EventService.updateGiftStatuses(eventId, giftIds, "withdrawn")
    await PlatformFeeService.recordFee({
      eventId: eventId,
      amount: platformFee,
      currency: currency,
      timestamp: new Date(),
      relatedTransactionId: transferResult.data.transfer_code,
    })

    return NextResponse.json({
      success: true,
      message: "Withdrawal initiated successfully!",
      data: transferResult.data,
    })
  } catch (error) {
    console.error("Paystack withdrawal error:", error)
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred."
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
  }
}
