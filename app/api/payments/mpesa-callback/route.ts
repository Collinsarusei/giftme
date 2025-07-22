import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json()

    console.log("M-Pesa Callback received:", JSON.stringify(callbackData, null, 2))

    // Process the callback data
    const { Body } = callbackData
    const { stkCallback } = Body

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      console.log("✅ Payment successful:", stkCallback)

      // Extract payment details
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      const paymentDetails = {
        amount: callbackMetadata.find((item: any) => item.Name === "Amount")?.Value,
        mpesaReceiptNumber: callbackMetadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value,
        transactionDate: callbackMetadata.find((item: any) => item.Name === "TransactionDate")?.Value,
        phoneNumber: callbackMetadata.find((item: any) => item.Name === "PhoneNumber")?.Value,
      }

      // Extract event reference (assume AccountReference is eventId)
      const eventId = stkCallback.AccountReference
      // Optionally, extract gifter email/name from TransactionDesc or other metadata if you store it

      // Record the gift in the event (call /api/events/gift)
      if (eventId && paymentDetails.amount) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events/gift`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            giftData: {
              from: paymentDetails.phoneNumber || "M-Pesa User",
              email: "mpesa@user.com",
              amount: paymentDetails.amount,
              currency: "KES",
              message: `Gift via M-Pesa, receipt: ${paymentDetails.mpesaReceiptNumber}`,
            },
            paymentMethod: "mpesa",
            transactionId: paymentDetails.mpesaReceiptNumber,
          }),
        })
      }
    } else {
      // Payment failed or cancelled
      console.log("❌ Payment failed:", stkCallback.ResultDesc)
    }

    // Always return success to M-Pesa to acknowledge receipt
    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
    })
  } catch (error) {
    console.error("M-Pesa callback error:", error)
    // Still return success to avoid M-Pesa retrying
    return NextResponse.json({
      success: true,
      message: "Callback received",
    })
  }
}
