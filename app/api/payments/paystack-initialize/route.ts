// app/api/payments/paystack-initialize/route.ts
import { type NextRequest, NextResponse } from "next/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

// Helper function to dynamically determine the base URL
const getBaseUrl = (req: NextRequest): string => {
    // Prefer the x-forwarded-host header if available (common in proxies)
    const forwardedHost = req.headers.get('x-forwarded-host');
    if (forwardedHost) {
        return `https://${forwardedHost}`;
    }
    // Fallback to the host header
    const host = req.headers.get('host');
    if (host) {
        // For localhost, we need to ensure it's http
        const protocol = host.includes('localhost') ? 'http' : 'https';
        return `${protocol}://${host}`;
    }
    // Final fallback to the request's URL origin
    return new URL(req.url).origin;
}


export async function POST(request: NextRequest) {
  try {
    const { amount, email, eventName, currency = "KES", eventId, giftData } = await request.json()

    if (!PAYSTACK_SECRET_KEY) {
      console.warn("PAYSTACK_SECRET_KEY is not set. Payments will not be processed.")
      return NextResponse.json(
        { success: false, message: "Payment gateway is not configured." },
        { status: 500 }
      )
    }

    if (!amount || !email || !eventName || !eventId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: amount, email, eventName, or eventId" },
        { status: 400 }
      )
    }

    if (!email.includes("@")) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 })
    }

    const baseUrl = getBaseUrl(request);
    const reference = `CWM_${eventId}_${Date.now()}`
    
    // **FIX:** Point the callback to our single, reliable API route
    const callback_url = `${baseUrl}/api/payments/paystack-callback?reference=${reference}&eventId=${eventId}`

    const paystackData = {
      amount: Math.round(amount * 100), // Amount in kobo/cents
      email: email.trim(),
      currency: currency.toUpperCase(),
      reference,
      callback_url,
      metadata: {
        eventId,
        eventName,
        from: giftData.from,
        message: giftData.message,
        // Pass eventId in metadata as a fallback
        custom_fields: [
          {
            display_name: "Event ID",
            variable_name: "event_id",
            value: eventId,
          }
        ],
      },
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackData),
    })

    const result = await response.json()

    if (result.status) {
      return NextResponse.json({
        success: true,
        data: result.data,
      })
    } else {
      console.error("Paystack initialization failed:", result)
      return NextResponse.json(
        { success: false, message: result.message || "Failed to initialize payment." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Paystack initialization error:", error)
    return NextResponse.json(
      { success: false, message: "An internal error occurred." },
      { status: 500 }
    )
  }
}
