import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")
    // Optionally, you can verify the transaction with Paystack here using the reference
    // For now, assume success for demonstration
    // In production, call Paystack's verify endpoint

    // Extract eventId from reference (format: CWM_eventId_timestamp)
    let eventId = ""
    if (reference && reference.startsWith("CWM_")) {
      const parts = reference.split("_")
      if (parts.length >= 3) {
        eventId = parts[1]
      }
    }

    // Optionally, you can get more details from Paystack metadata if needed

    // Record the gift in the event (call /api/events/gift)
    if (eventId) {
      // You may want to fetch the giftData from your own DB or Paystack metadata
      // For now, just record a generic gift
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events/gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          giftData: {
            from: "Paystack User",
            email: "paystack@user.com",
            amount: 0, // You should fetch the actual amount from Paystack verify API
            currency: "KES",
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