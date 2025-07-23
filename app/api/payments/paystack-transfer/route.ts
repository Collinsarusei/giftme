import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_302d1221c06cb6c10f842bc4883282c684c52dee"

export async function POST(request: NextRequest) {
  try {
    const { amount, name, mpesaNumber, reason, giftIds, eventId } = await request.json()

    if (!Array.isArray(giftIds) || giftIds.length === 0) {
      return NextResponse.json({ success: false, message: "No gift IDs provided for withdrawal." }, { status: 400 });
    }

    // 1. Create recipient
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "mobile_money",
        name: name || "Event Creator",
        account_number: mpesaNumber,
        bank_code: "MPESA",
        currency: "KES",
      }),
    })
    const recipientData = await recipientRes.json()
    if (!recipientData.status || !recipientData.data?.recipient_code) {
      throw new Error("Failed to create Paystack recipient: " + (recipientData.message || "Unknown error"))
    }
    const recipient_code = recipientData.data.recipient_code

    // 2. Initiate transfer
    const transferData = {
      source: "balance",
      amount: amount * 100, // Amount in kobo
      recipient: recipient_code,
      reason: reason || "Event gift withdrawal",
    }

    const response = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    })

    const result = await response.json()

    if (result.status) {
      // Update gift statuses to 'withdrawn' in the database
      const updateSuccess = await EventService.updateManyGiftStatuses(
        eventId,
        giftIds,
        "withdrawn"
      );

      if (!updateSuccess) {
        console.warn("Failed to update gift statuses in DB after successful Paystack transfer.");
        // Potentially log this for manual review or implement a retry mechanism
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    } else {
      throw new Error(result.message || "Paystack transfer failed")
    }
  } catch (error) {
    console.error("Paystack transfer error:", error)
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : "Transfer failed") }, { status: 500 })
  }
}
