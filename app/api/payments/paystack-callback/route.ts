// app/api/payments/paystack-callback/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import type { Gift } from "@/lib/models/Event";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/`);
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const result = await response.json();

    if (result.data && result.data.status === 'success') {
      const { metadata, amount, currency, customer } = result.data;
      const eventId = metadata.eventId;

      const grossAmount = amount / 100;
      const platformFee = grossAmount * 0.03;
      const netAmount = grossAmount - platformFee;

      const newGift: Gift = {
        id: `gift_${reference}`,
        from: metadata.from || customer.name || "Anonymous",
        email: customer.email,
        amount: grossAmount,
        developerFee: platformFee,
        currency: currency,
        message: metadata.message || "",
        timestamp: new Date().toISOString(),
        paymentMethod: "paystack",
        status: "pending_withdrawal",
        transactionId: reference,
      };

      const wasGiftAdded = await EventService.addGiftToEvent(eventId, newGift, netAmount);

      if (wasGiftAdded) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?payment=success`);
      } else {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?payment=failed`);
      }
    } else {
      const eventId = result.data?.metadata?.eventId;
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?payment=failed`);
    }
  } catch (error) {
    console.error("Paystack callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/`);
  }
}
