import { type NextRequest, NextResponse } from "next/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")
    let eventId = ""
    if (reference && reference.startsWith("CWM_")) {
      const parts = reference.split("_")
      if (parts.length >= 3) {
        eventId = parts[1]
      }
    }

    // Verify transaction with Paystack
    let verified = false
    let paymentData = null
    if (reference && PAYSTACK_SECRET_KEY) {
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      })
      const verifyJson = await verifyRes.json()
      if (verifyJson.status && verifyJson.data.status === "success") {
        verified = true
        paymentData = verifyJson.data
      }
    }

    // Only record the gift if payment is verified
    if (eventId && verified && paymentData) {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events/gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          giftData: {
            from: paymentData.customer?.name || paymentData.customer?.email || "Paystack User",
            email: paymentData.customer?.email || "paystack@user.com",
            amount: paymentData.amount / 100, // Paystack returns amount in kobo/cents
            currency: paymentData.currency,
            message: `Gift via Paystack, reference: ${reference}`,
          },
          paymentMethod: "paystack",
          transactionId: reference,
        }),
      })
    }
    // Redirect user back to event page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}`)
  } catch (error) {
    console.error("Paystack callback error:", error)
    return NextResponse.json({ success: false, message: "Callback error" }, { status: 500 })
  }
} 