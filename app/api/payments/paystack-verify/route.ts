// app/api/payments/paystack-verify/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Gift } from "@/lib/models/Event"; // Import the Gift interface

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
    if (!PAYSTACK_SECRET_KEY) {
        console.warn("PAYSTACK_SECRET_KEY is not set.");
        return NextResponse.json({ success: false, message: "Payment gateway is not configured." }, { status: 500 });
    }

    try {
        const { reference } = await request.json();

        if (!reference) {
            return NextResponse.json({ success: false, message: "Missing required field: reference" }, { status: 400 });
        }

        // 1. Verify transaction with Paystack
        const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const verifyResult = await verifyResponse.json();

        if (!verifyResult.status || verifyResult.data.status !== 'success') {
            return NextResponse.json({ success: false, message: "Payment verification failed or payment not successful." }, { status: 400 });
        }

        // 2. Extract metadata and update database
        const { metadata, amount, id: transactionId, customer, currency } = verifyResult.data;
        const { eventId, from, message } = metadata;

        if (!eventId) {
            return NextResponse.json({ success: false, message: "Event ID missing from transaction metadata." }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db();
        const eventsCollection = db.collection('events');

        // Check if this transaction has already been processed to prevent duplicates
        const existingGift = await eventsCollection.findOne({ "gifts.transactionId": transactionId });
        if (existingGift) {
            return NextResponse.json({ success: true, message: "Gift already recorded." });
        }

        const newGift: Gift = {
            id: new ObjectId().toString(),
            from: from || "Anonymous",
            email: customer.email,
            amount: amount / 100, // Convert from kobo/cents
            currency: currency,
            message: message || "",
            timestamp: new Date().toISOString(),
            paymentMethod: "paystack",
            status: "completed",
            transactionId: transactionId.toString(),
        };

        const updateResult = await eventsCollection.updateOne(
            { id: eventId },
            {
                $inc: {
                    raised: newGift.amount,
                    giftCount: 1,
                },
                $push: {
                    gifts: newGift as any, // Use type assertion as a safeguard if types are complex
                },
            }
        );

        if (updateResult.modifiedCount === 0) {
             return NextResponse.json({ success: false, message: "Could not find event to update." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Payment verified and gift recorded." });

    } catch (error) {
        console.error("Paystack verification error:", error);
        return NextResponse.json({ success: false, message: "An internal error occurred." }, { status: 500 });
    }
}