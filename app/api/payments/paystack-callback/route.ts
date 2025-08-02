// app/api/payments/paystack-callback/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import { DeveloperGiftService } from "@/lib/services/developerGiftService";
import type { Gift } from "@/lib/models/Event";
import type { DeveloperGift } from "@/lib/models/DeveloperGift";
import clientPromise from "@/lib/mongodb"; // Import clientPromise

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
  const reference = searchParams.get("reference"); // This is our transactionId
  const eventIdQuery = searchParams.get("eventId");

  const baseUrl = getBaseUrl(request);
  
  let redirectUrl = new URL("/", baseUrl); 
  if (eventIdQuery === 'dev-support') {
    redirectUrl = new URL("/support-developer", baseUrl);
  } else if (eventIdQuery) {
    redirectUrl = new URL(`/event/${eventIdQuery}`, baseUrl);
  }
  redirectUrl.searchParams.set("payment", "failed"); // Default to failed

  if (!reference || !eventIdQuery) {
    return NextResponse.redirect(redirectUrl);
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
      const eventId = metadata.eventId || eventIdQuery;
      const grossAmount = amount / 100;

      const client = await clientPromise; // Get MongoDB client
      const db = client.db();
      let wasGiftAdded = false; // Flag to track if gift was added/already exists

      if (eventId === 'dev-support') {
        const devGiftsCollection = db.collection<DeveloperGift>("developerGifts");
        const existingDeveloperGift = await devGiftsCollection.findOne({ transactionId: reference });

        if (existingDeveloperGift) {
          console.log(`Developer gift with transaction ID ${reference} already recorded. Skipping.`);
          wasGiftAdded = true; // Treat as success for redirection
        } else {
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
          wasGiftAdded = await DeveloperGiftService.addDeveloperGift(newDeveloperGift);
        }

      } else {
        const eventsCollection = db.collection<Gift>("events"); // Use Gift type for events collection query
        const existingEventGift = await eventsCollection.findOne({
            "gifts.transactionId": reference, 
            id: eventId // Ensure it's for the specific event
        });

        if (existingEventGift) {
          console.log(`Event gift with transaction ID ${reference} for event ${eventId} already recorded. Skipping.`);
          wasGiftAdded = true; // Treat as success for redirection
        } else {
          const newGift: Gift = {
            id: `gift_${reference}`,
            from: metadata.from || customer.name || "Anonymous",
            email: customer.email,
            amount: grossAmount,
            developerFee: 0,
            currency: currency,
            message: metadata.message || "",
            timestamp: new Date().toISOString(),
            paymentMethod: "paystack",
            status: "pending_withdrawal", 
            transactionId: reference,
          };
          // Add the gift to the event, and increment the "raised" counter by the full amount.
          // The amount is already included in newGift.amount, so no separate increment is needed here.
          wasGiftAdded = await EventService.addGiftToEvent(eventId, newGift, 0); 
        }
      }
      redirectUrl.searchParams.set("payment", wasGiftAdded ? "success" : "failed");
      return NextResponse.redirect(redirectUrl);

    } else {
      return NextResponse.redirect(redirectUrl);
    }

  } catch (error) {
    console.error("Paystack callback error:", error);
    return NextResponse.redirect(redirectUrl);
  }
}
