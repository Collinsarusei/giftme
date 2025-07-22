import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const timeoutData = await request.json()

    console.log("=== M-Pesa B2C Timeout Received ===")
    console.log("B2C timeout:", JSON.stringify(timeoutData, null, 2))

    // Handle timeout scenario
    // This means the B2C request timed out and you should:
    // 1. Mark the transaction as failed/timeout
    // 2. Notify the user
    // 3. Possibly retry later

    console.log("⏰ B2C transfer timed out")

    return NextResponse.json({
      success: true,
      message: "Timeout processed successfully",
    })
  } catch (error) {
    console.error("❌ B2C timeout processing error:", error)

    return NextResponse.json({
      success: true,
      message: "Timeout received",
    })
  }
}
