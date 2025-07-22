import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const validationData = await request.json()

    console.log("=== M-Pesa Validation Request ===")
    console.log("Validation data:", JSON.stringify(validationData, null, 2))

    // Extract validation details
    const {
      TransactionType,
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      InvoiceNumber,
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
    } = validationData

    // Here you would typically validate:
    // 1. Is the amount correct?
    // 2. Is the account reference valid?
    // 3. Is the customer allowed to make this payment?
    // 4. Any business logic validation

    console.log("🔍 Validating payment:", {
      amount: TransAmount,
      from: `${FirstName} ${MiddleName} ${LastName}`,
      phone: MSISDN,
      reference: BillRefNumber,
    })

    // For now, we'll accept all payments
    // In production, you might reject some based on business rules

    // Return success to accept the payment
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Validation successful",
    })

    // To reject a payment, you would return:
    // return NextResponse.json({
    //   ResultCode: "C2B00011",
    //   ResultDesc: "Invalid account number"
    // })
  } catch (error) {
    console.error("❌ Validation error:", error)

    // Return success to avoid blocking payments
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Validation successful",
    })
  }
}
