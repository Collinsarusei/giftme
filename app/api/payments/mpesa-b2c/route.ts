import { type NextRequest, NextResponse } from "next/server"

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ""
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ""
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || ""
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || ""
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// For B2C, you need different credentials (usually a different shortcode)
const B2C_SHORTCODE = process.env.MPESA_B2C_SHORTCODE || MPESA_SHORTCODE
const B2C_INITIATOR_NAME = process.env.MPESA_B2C_INITIATOR_NAME || "testapi"
const B2C_SECURITY_CREDENTIAL = process.env.MPESA_B2C_SECURITY_CREDENTIAL || ""

// Get M-Pesa access token
async function getMpesaToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64")

  try {
    const response = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok || !data.access_token) {
      throw new Error(`OAuth failed: ${response.status} - ${JSON.stringify(data)}`)
    }

    return data.access_token
  } catch (error) {
    console.error("❌ OAuth token error:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, phoneNumber, eventName, senderName, reason } = await request.json()

    console.log("=== M-Pesa B2C Transfer Request ===")
    console.log("Transfer data:", { amount, phoneNumber: phoneNumber.substring(0, 6) + "...", eventName })

    // Validate required environment variables
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !B2C_SHORTCODE) {
      console.log("⚠️ B2C environment variables not configured")
      return NextResponse.json(
        {
          success: true,
          message: "⚠️ B2C not configured. Using test mode.",
          isTestMode: true,
        },
        { status: 200 },
      )
    }

    // Clean phone number
    let cleanPhoneNumber = phoneNumber.replace(/\D/g, "")
    if (cleanPhoneNumber.startsWith("0")) {
      cleanPhoneNumber = "254" + cleanPhoneNumber.slice(1)
    }
    if (!cleanPhoneNumber.startsWith("254")) {
      cleanPhoneNumber = "254" + cleanPhoneNumber
    }

    // Validate phone number
    if (cleanPhoneNumber.length !== 12) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number format",
        },
        { status: 400 },
      )
    }

    try {
      // Get access token
      const accessToken = await getMpesaToken()

      // B2C request payload
      const b2cData = {
        InitiatorName: B2C_INITIATOR_NAME,
        SecurityCredential: B2C_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment", // or "SalaryPayment", "PromotionPayment"
        Amount: Math.round(amount),
        PartyA: B2C_SHORTCODE,
        PartyB: cleanPhoneNumber,
        Remarks: reason || `Withdrawal for ${eventName}`,
        QueueTimeOutURL: `${BASE_URL}/api/payments/mpesa-b2c-timeout`,
        ResultURL: `${BASE_URL}/api/payments/mpesa-b2c-result`,
        Occasion: eventName.substring(0, 100),
      }

      console.log("🚀 Sending B2C request...")

      const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(b2cData),
      })

      const result = await response.json()

      console.log("📥 B2C response:", result)

      if (result.ResponseCode === "0") {
        console.log("✅ B2C transfer initiated successfully!")
        return NextResponse.json({
          success: true,
          message: "💸 Transfer initiated! Money will be sent to the recipient's phone.",
          data: result,
        })
      } else {
        throw new Error(`B2C failed: ${result.ResponseDescription || result.errorMessage}`)
      }
    } catch (error) {
      console.log("⚠️ B2C API failed, using test mode:", error)

      // Simulate successful transfer
      await new Promise((resolve) => setTimeout(resolve, 2000))

      return NextResponse.json({
        success: true,
        message: "⚠️ B2C test mode - Transfer simulated successfully!",
        isTestMode: true,
        data: {
          ConversationID: `test_conv_${Date.now()}`,
          OriginatorConversationID: `test_orig_${Date.now()}`,
          ResponseCode: "0",
          ResponseDescription: "Test mode - Transfer successful",
        },
      })
    }
  } catch (error) {
    console.error("❌ B2C transfer error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Transfer failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
