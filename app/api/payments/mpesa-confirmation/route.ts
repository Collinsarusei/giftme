import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const confirmationData = await request.json()

    console.log("=== M-Pesa Confirmation Received ===")
    console.log("Confirmation data:", JSON.stringify(confirmationData, null, 2))

    // Extract payment details
    const {
      TransactionType,
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      InvoiceNumber,
      OrgAccountBalance,
      ThirdPartyTransID,
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
    } = confirmationData

    // Here you would typically:
    // 1. Validate the transaction
    // 2. Update your database with the payment
    // 3. Send confirmation to the user
    // 4. Update the event's raised amount

    console.log("💰 Payment confirmed:", {
      amount: TransAmount,
      from: `${FirstName} ${MiddleName} ${LastName}`,
      phone: MSISDN,
      reference: BillRefNumber,
      transactionId: TransID,
    })

    // For now, we'll just log it
    // In production, you'd update your database here

    // Always return success to acknowledge receipt
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Confirmation received successfully",
    })
  } catch (error) {
    console.error("❌ Confirmation processing error:", error)

    // Still return success to avoid M-Pesa retrying
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Confirmation received",
    })
  }
}
