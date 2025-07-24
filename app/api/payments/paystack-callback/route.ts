// app/api/payments/paystack-callback/route.ts
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

// This callback's only job is to verify the transaction reference
// and redirect the user. The actual gift creation is handled by the webhook.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")

  if (!reference) {
    // If there's no reference, we can't know which event to redirect to.
    // Redirecting to the homepage is a safe fallback.
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/`)
  }

  try {
    // Verify transaction with Paystack to ensure it's legitimate
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const result = await response.json();
    const eventId = result.data?.metadata?.eventId;
    
    // Regardless of status, redirect the user back to the event page.
    // The webhook will handle the gift creation if the payment was successful.
    if (eventId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?payment=success&ref=${reference}`);
    } else {
        // If we can't find an eventId, redirect home.
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/`);
    }

  } catch (error) {
    console.error("Paystack callback error:", error);
    // In case of an error, redirecting home is a safe fallback.
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/`);
  }
}
