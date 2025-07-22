import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json()
    console.log("=== Enhanced M-Pesa Callback ===")
    console.log("Callback data:", JSON.stringify(callbackData, null, 2))

    const { Body } = callbackData
    const { stkCallback } = Body

    if (stkCallback.ResultCode === 0) {
      // Payment successful - trigger B2C transfer
      console.log("✅ Payment successful, initiating B2C transfer...")

      const checkoutRequestId = stkCallback.CheckoutRequestID

      // Get stored transaction data
      const pendingTransactions = global.pendingTransactions || new Map()
      const transactionData = pendingTransactions.get(checkoutRequestId)

      if (transactionData) {
        // Extract payment details
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
        const paymentDetails = {
          amount: callbackMetadata.find((item: any) => item.Name === "Amount")?.Value,
          mpesaReceiptNumber: callbackMetadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value,
          transactionDate: callbackMetadata.find((item: any) => item.Name === "TransactionDate")?.Value,
          phoneNumber: callbackMetadata.find((item: any) => item.Name === "PhoneNumber")?.Value,
        }

        console.log("💰 Payment details:", paymentDetails)

        // Initiate B2C transfer to event creator
        try {
          const b2cResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/mpesa-b2c`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: paymentDetails.amount,
              phoneNumber: transactionData.creatorMpesaNumber,
              eventName: transactionData.eventName,
              reason: `Gift payment for ${transactionData.eventName}`,
              originalTransactionId: paymentDetails.mpesaReceiptNumber,
            }),
          })

          const b2cResult = await b2cResponse.json()
          console.log("💸 B2C transfer result:", b2cResult)

          // Update event with successful gift
          // In production, update your database here
          console.log("📝 Updating event with successful gift...")
        } catch (b2cError) {
          console.error("❌ B2C transfer failed:", b2cError)
          // In production, you might want to retry or handle this differently
        }

        // Clean up pending transaction
        pendingTransactions.delete(checkoutRequestId)
      }
    } else {
      console.log("❌ Payment failed:", stkCallback.ResultDesc)
    }

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
    })
  } catch (error) {
    console.error("❌ Enhanced callback error:", error)
    return NextResponse.json({
      success: true,
      message: "Callback received",
    })
  }
}
