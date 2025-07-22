import { type NextRequest, NextResponse } from "next/server"

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ""
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ""
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || ""
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || ""
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// Enhanced phone number formatting function
function formatPhoneNumber(phoneNumber: string): { formatted: string; isValid: boolean; originalFormat: string } {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, "")
  const originalFormat = phoneNumber

  console.log("📱 Original phone input:", phoneNumber)
  console.log("📱 Cleaned digits:", cleaned)

  // Handle different input formats
  if (cleaned.startsWith("0")) {
    // Convert 0712345678 -> 254712345678
    cleaned = "254" + cleaned.slice(1)
    console.log("📱 Converted from 0x format:", cleaned)
  } else if (cleaned.startsWith("1") && cleaned.length === 9) {
    // Convert 112345678 -> 254712345678 (assuming 1 is a typo for 01)
    cleaned = "2547" + cleaned
    console.log("📱 Converted from 1x format (assumed 07x):", cleaned)
  } else if (cleaned.startsWith("7") && cleaned.length === 9) {
    // Convert 712345678 -> 254712345678
    cleaned = "254" + cleaned
    console.log("📱 Converted from 7x format:", cleaned)
  } else if (cleaned.startsWith("1") && cleaned.length === 10) {
    // Convert 1012345678 -> 254012345678 (01x format without leading 0)
    cleaned = "254" + cleaned
    console.log("📱 Converted from 1x format (10 digits):", cleaned)
  } else if (!cleaned.startsWith("254")) {
    // If it doesn't start with 254, assume it's missing
    if (cleaned.length === 9) {
      // Assume it's a 7x or 1x number
      cleaned = "254" + cleaned
      console.log("📱 Added 254 prefix to 9-digit number:", cleaned)
    } else if (cleaned.length === 10 && (cleaned.startsWith("07") || cleaned.startsWith("01"))) {
      // Handle 0712345678 case that wasn't caught above
      cleaned = "254" + cleaned.slice(1)
      console.log("📱 Converted 10-digit 0x format:", cleaned)
    }
  }

  // Validate final format
  const isValid = cleaned.length === 12 && cleaned.startsWith("254")

  console.log("📱 Final formatted number:", cleaned)
  console.log("📱 Is valid:", isValid)

  return {
    formatted: cleaned,
    isValid,
    originalFormat,
  }
}

// Get M-Pesa access token with retry logic
async function getMpesaToken(retryCount = 0) {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64")

  try {
    console.log(`🔑 Requesting M-Pesa OAuth token... (attempt ${retryCount + 1})`)

    const response = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    })

    const data = await response.json()

    if (!response.ok || !data.access_token) {
      throw new Error(`OAuth failed: ${response.status} - ${JSON.stringify(data)}`)
    }

    console.log("✅ OAuth token obtained successfully")
    return data.access_token
  } catch (error) {
    console.error(`❌ OAuth token error (attempt ${retryCount + 1}):`, error)

    // Retry once if first attempt fails
    if (retryCount === 0) {
      console.log("🔄 Retrying OAuth token request...")
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return getMpesaToken(1)
    }

    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, phoneNumber, eventName, description } = await request.json()

    console.log("=== M-Pesa STK Push Request ===")

    // Validate required environment variables
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY) {
      console.log("⚠️ M-Pesa environment variables not configured")
      return NextResponse.json(
        {
          success: true,
          message: "⚠️ M-Pesa not configured. Using test mode.",
          isTestMode: true,
        },
        { status: 200 },
      )
    }

    // Format phone number with enhanced logic
    const phoneResult = formatPhoneNumber(phoneNumber)

    if (!phoneResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid phone number format. You entered: "${phoneResult.originalFormat}". Please use format: 0712345678 or 254712345678`,
        },
        { status: 400 },
      )
    }

    const cleanPhoneNumber = phoneResult.formatted

    // Check if it's the official test number - always simulate for test number
    if (cleanPhoneNumber === "254708374149") {
      console.log("✅ Using official test number - simulating success")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return NextResponse.json({
        success: true,
        message: "📱 Test STK Push successful! (Official test number - simulated)",
        isTestMode: true,
        phoneFormatted: `${phoneResult.originalFormat} → ${cleanPhoneNumber}`,
        data: {
          MerchantRequestID: `test_${Date.now()}`,
          CheckoutRequestID: `test_checkout_${Date.now()}`,
          ResponseCode: "0",
          ResponseDescription: "Success. Request accepted for processing",
          CustomerMessage: "Success. Request accepted for processing",
        },
      })
    }

    // For real numbers, try the actual API
    try {
      console.log("🚀 Attempting real M-Pesa STK Push for number:", cleanPhoneNumber)

      const accessToken = await getMpesaToken()

      // Generate timestamp
      const now = new Date()
      const timestamp =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0")

      // Generate password
      const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64")

      // STK Push request payload
      const stkPushData = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: cleanPhoneNumber,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: cleanPhoneNumber,
        CallBackURL: `${BASE_URL}/api/payments/mpesa-callback`,
        AccountReference: eventName.substring(0, 12).replace(/[^a-zA-Z0-9]/g, ""),
        TransactionDesc: (description || `Gift for ${eventName}`).substring(0, 13).replace(/[^a-zA-Z0-9 ]/g, ""),
      }

      console.log("📤 STK Push payload:", {
        ...stkPushData,
        Password: "***HIDDEN***",
        PhoneNumber: cleanPhoneNumber.substring(0, 6) + "...",
      })

      const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(stkPushData),
      })

      const result = await response.json()
      console.log("📥 STK Push response:", result)

      if (result.ResponseCode === "0") {
        console.log("✅ Real STK Push successful!")

        const isLocalhost = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1")

        return NextResponse.json({
          success: true,
          message: isLocalhost
            ? "📱 STK Push sent! Check your phone for M-Pesa prompt. (Callbacks won't reach localhost)"
            : "📱 STK Push sent successfully! Check your phone for M-Pesa prompt.",
          phoneFormatted: `${phoneResult.originalFormat} → ${cleanPhoneNumber}`,
          data: result,
          callbackNote: isLocalhost ? "Running on localhost - callbacks disabled" : "Callbacks enabled",
        })
      } else {
        throw new Error(
          `STK Push failed: ${result.ResponseDescription || result.errorMessage || JSON.stringify(result)}`,
        )
      }
    } catch (error) {
      console.log("⚠️ Real API failed, falling back to test mode:", error)

      // Provide specific guidance based on the number
      let guidance = "Sandbox API is unreliable. "
      if (cleanPhoneNumber.startsWith("25470")) {
        guidance += "For guaranteed testing, use 254708374149. "
      } else if (cleanPhoneNumber.startsWith("25474")) {
        guidance += "Your number may work sometimes - sandbox is inconsistent. "
      }
      guidance += "Gift recorded in test mode."

      return NextResponse.json({
        success: true,
        message: `⚠️ ${guidance}`,
        isTestMode: true,
        phoneFormatted: `${phoneResult.originalFormat} → ${cleanPhoneNumber}`,
        data: {
          MerchantRequestID: `fallback_${Date.now()}`,
          CheckoutRequestID: `fallback_checkout_${Date.now()}`,
          ResponseCode: "0",
          ResponseDescription: "Test mode - Success",
          CustomerMessage: "Test mode - Success",
        },
      })
    }
  } catch (error) {
    console.error("❌ M-Pesa STK Push error:", error)
    return NextResponse.json(
      {
        success: true, // Don't block user
        message: "⚠️ Payment service temporarily unavailable. Using test mode.",
        isTestMode: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    )
  }
}
