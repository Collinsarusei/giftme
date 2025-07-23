// app/api/payments/paystack-initialize/route.ts
import { type NextRequest, NextResponse } from "next/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

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

    const reference = `CWM_${eventId}_${Date.now()}`
    const callback_url = `${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?payment=success&ref=${reference}`

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
        custom_fields: [
          {
            display_name: "Event Name",
            variable_name: "event_name",
            value: eventName,
          },
          {
            display_name: "Sent From",
            variable_name: "sent_from",
            value: giftData.from,
          },
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
        message: "Payment initialization successful",
        data: {
          authorization_url: result.data.authorization_url,
          access_code: result.data.access_code,
          reference: result.data.reference,
        },
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
