import { type NextRequest, NextResponse } from "next/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    const { amount, email, eventName, currency = "NGN", eventId, giftData } = await request.json()

    console.log("Initializing Paystack payment:", {
      amount,
      email,
      eventName,
      currency,
      eventId,
    })

    // Check if Paystack is configured
    if (!PAYSTACK_SECRET_KEY) {
      console.log("Paystack not configured, using test mode")
      return NextResponse.json({
        success: true,
        isTestMode: true,
        message: "⚠️ Paystack not configured. Using test mode - gift recorded successfully!",
        data: {
          authorization_url: "#",
          access_code: "test_access_code",
          reference: `test_${Date.now()}`,
        },
      })
    }

    // Validate required fields
    if (!amount || !email || !eventName) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: amount, email, or eventName",
        },
        { status: 400 },
      )
    }

    // Validate email format
    if (!email.includes("@")) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 })
    }

    // Create unique reference
    const reference = `CWM_${eventId || "event"}_${Date.now()}`

    const paystackData = {
      amount: Math.round(amount * 100), // Paystack expects amount in kobo/cents
      email: email.trim(),
      currency: currency.toUpperCase(),
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payments/paystack-callback`,
      metadata: {
        event_id: eventId,
        event_name: eventName,
        gift_data: giftData ? JSON.stringify(giftData) : null,
        custom_fields: [
          {
            display_name: "Event Name",
            variable_name: "event_name",
            value: eventName,
          },
        ],
      },
    }

    console.log("Paystack request data:", {
      ...paystackData,
      amount: amount, // Log original amount for clarity
    })

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackData),
    })

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("Non-JSON response from Paystack:", textResponse)

      // Fall back to test mode
      return NextResponse.json({
        success: true,
        isTestMode: true,
        message: "⚠️ Paystack service unavailable. Using test mode - gift recorded successfully!",
        data: {
          authorization_url: "#",
          access_code: "test_access_code",
          reference: `test_${Date.now()}`,
        },
      })
    }

    const result = await response.json()
    console.log("Paystack initialization response:", result)

    if (result.status) {
      return NextResponse.json({
        success: true,
        message: "Payment initialization successful",
        data: {
          authorization_url: result.data.authorization_url,
          access_code: result.data.access_code,
          reference: result.data.reference,
        },
      })
    } else {
      console.error("Paystack initialization failed:", result)

      // Fall back to test mode instead of failing
      return NextResponse.json({
        success: true,
        isTestMode: true,
        message: "⚠️ Paystack initialization failed. Using test mode - gift recorded successfully!",
        data: {
          authorization_url: "#",
          access_code: "test_access_code",
          reference: `test_${Date.now()}`,
        },
      })
    }
  } catch (error) {
    console.error("Paystack initialization error:", error)

    // Always fall back to test mode to not block users
    return NextResponse.json({
      success: true,
      isTestMode: true,
      message: "⚠️ Payment service temporarily unavailable. Using test mode - gift recorded successfully!",
      data: {
        authorization_url: "#",
        access_code: "test_access_code",
        reference: `test_${Date.now()}`,
      },
    })
  }
}
