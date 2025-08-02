// app/api/payments/paystack-callback/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import { DeveloperGiftService } from "@/lib/services/developerGiftService"; // Assuming this service exists or will be created
import type { Gift } from "@/lib/models/Event";
import type { DeveloperGift } from "@/lib/models/DeveloperGift"; // Assuming this model exists or will be created

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper function to dynamically determine the base URL
const getBaseUrl = (req: NextRequest): string => {
    const forwardedHost = req.headers.get('x-forwarded-host');
    if (forwardedHost) {
        return `https://${forwardedHost}`;
    }
    const host = req.headers.get('host');
    if (host) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        return `${protocol}://${host}`;
    }
    return new URL(req.url).origin;
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  const eventIdQuery = searchParams.get("eventId"); // Get eventId from query params

  const baseUrl = getBaseUrl(request);
  
  // Determine the redirect URL based on eventIdQuery
  let redirectUrl = new URL("/", baseUrl); // Default to homepage
  if (eventIdQuery === 'dev-support') {
    redirectUrl = new URL("/support-developer", baseUrl);
  } else if (eventIdQuery) {
    redirectUrl = new URL(`/event/${eventIdQuery}`, baseUrl);
  }
  redirectUrl.searchParams.set("payment", "failed"); // Default to failed, update on success


  if (!reference || !eventIdQuery) {
    // If essential parameters are missing, redirect with a failed status
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const result = await response.json();

    // Check for a successful payment status from Paystack
    if (result.data && result.data.status === 'success') {
      const { metadata, amount, currency, customer } = result.data;
      
      const eventId = metadata.eventId || eventIdQuery;
      const grossAmount = amount / 100;

      if (eventId === 'dev-support') {
        // Handle developer gift
        const newDeveloperGift: DeveloperGift = {
          id: `dev_gift_${reference}`,
          from: metadata.from || customer.name || "Anonymous",
          email: customer.email,
          amount: grossAmount,
          currency: currency,
          message: metadata.message || "",
          timestamp: new Date().toISOString(),
          transactionId: reference,
          status: "completed",
          paymentMethod: "paystack"
        };
        const wasGiftAdded = await DeveloperGiftService.addDeveloperGift(newDeveloperGift);
        redirectUrl.searchParams.set("payment", wasGiftAdded ? "success" : "failed");

      } else {
        // Handle event gift
        const newGift: Gift = {
          id: `gift_${reference}`,
          from: metadata.from || customer.name || "Anonymous",
          email: customer.email,
          amount: grossAmount, // Store the full amount given by the donor
          developerFee: 0, // Fee is not calculated here
          currency: currency,
          message: metadata.message || "",
          timestamp: new Date().toISOString(),
          paymentMethod: "paystack",
          status: "pending_withdrawal", 
          transactionId: reference,
        };
        // Add the gift to the event, and increment the "raised" counter by the full amount.
        const wasGiftAdded = await EventService.addGiftToEvent(eventId, newGift, 0); // Changed grossAmount to 0
        redirectUrl.searchParams.set("payment", wasGiftAdded ? "success" : "failed");
      }
      return NextResponse.redirect(redirectUrl);

    } else {
      // Paystack status is not success
      return NextResponse.redirect(redirectUrl);
    }

  } catch (error) {
    console.error("Paystack callback error:", error);
    return NextResponse.redirect(redirectUrl);
  }
}
