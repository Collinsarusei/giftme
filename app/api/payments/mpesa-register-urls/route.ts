import { type NextRequest, NextResponse } from "next/server"

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ""
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ""
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || ""
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// Get M-Pesa access token
async function getMpesaToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64")

  try {
    console.log("🔑 Getting OAuth token for URL registration...")

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
    console.log("=== M-Pesa URL Registration ===")

    // Validate required environment variables
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing M-Pesa environment variables",
        },
        { status: 400 },
      )
    }

    // Get access token
    const accessToken = await getMpesaToken()

    // Register URLs payload
    const registerData = {
      ShortCode: MPESA_SHORTCODE,
      ResponseType: "Completed", // or "Cancelled"
      ConfirmationURL: `${BASE_URL}/api/payments/mpesa-confirmation`,
      ValidationURL: `${BASE_URL}/api/payments/mpesa-validation`,
    }

    console.log("📤 Registering URLs:", registerData)

    const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    })

    const result = await response.json()

    console.log("📥 URL Registration response:", result)

    if (result.ResponseCode === "0") {
      console.log("✅ URLs registered successfully!")
      return NextResponse.json({
        success: true,
        message: "URLs registered successfully",
        data: result,
      })
    } else {
      console.error("❌ URL registration failed:", result)
      return NextResponse.json(
        {
          success: false,
          message: result.ResponseDescription || "URL registration failed",
          error: result,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ URL registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "URL registration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
