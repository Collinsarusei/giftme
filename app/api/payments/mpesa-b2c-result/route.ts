import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const resultData = await request.json()

    console.log("=== M-Pesa B2C Result Received ===")
    console.log("B2C result:", JSON.stringify(resultData, null, 2))

    const { Result } = resultData
    const { ResultCode, ResultDesc, ResultParameters } = Result

    if (ResultCode === 0) {
      // Transfer successful
      console.log("✅ B2C transfer successful!")

      // Extract result parameters
      const parameters = ResultParameters?.ResultParameter || []
      const transactionId = parameters.find((p: any) => p.Key === "TransactionID")?.Value
      const transactionAmount = parameters.find((p: any) => p.Key === "TransactionAmount")?.Value
      const recipientNumber = parameters.find((p: any) => p.Key === "ReceiverPartyPublicName")?.Value

      console.log("💰 Transfer details:", {
        transactionId,
        amount: transactionAmount,
        recipient: recipientNumber,
      })

      // Here you would typically:
      // 1. Update your database to mark the withdrawal as completed
      // 2. Send confirmation to the user
      // 3. Update any relevant records
    } else {
      // Transfer failed
      console.log("❌ B2C transfer failed:", ResultDesc)

      // Here you would typically:
      // 1. Update your database to mark the withdrawal as failed
      // 2. Notify the user of the failure
      // 3. Possibly retry or refund
    }

    // Always return success to acknowledge receipt
    return NextResponse.json({
      success: true,
      message: "Result processed successfully",
    })
  } catch (error) {
    console.error("❌ B2C result processing error:", error)

    // Still return success to avoid M-Pesa retrying
    return NextResponse.json({
      success: true,
      message: "Result received",
    })
  }
}
