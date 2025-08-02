// app/api/admin/withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { formatMpesaNumber } from "@/lib/utils"; // Import the robust formatter

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export async function POST(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const { amount, mpesaNumber, reason, giftIds } = await request.json();

        if (!amount || !mpesaNumber || !Array.isArray(giftIds) || giftIds.length === 0) {
            return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
        }
        
        const formattedMpesa = formatMpesaNumber(mpesaNumber);

        if (!formattedMpesa) {
            return NextResponse.json({ success: false, message: "Invalid M-Pesa number format. Please use a valid Kenyan number (e.g., 07...)." }, { status: 400 });
        }

        const objectIdGiftIds = giftIds.map(id => {
            if (id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
                return new ObjectId(id);
            }
            return null;
        }).filter(id => id !== null);

        if (objectIdGiftIds.length !== giftIds.length) {
             return NextResponse.json({ success: false, message: "Some gift IDs were invalid." }, { status: 400 });
        }

        // 1. Create Paystack Recipient
        const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "mobile_money",
                name: "Developer/Admin",
                account_number: formattedMpesa,
                bank_code: "MPESA",
                currency: "KES",
            }),
        });
        const recipientData = await recipientRes.json();
        if (!recipientData.status || !recipientData.data?.recipient_code) {
             // Return Paystack's error message directly
             return NextResponse.json({ success: false, message: `Failed to create Paystack recipient: ${recipientData.message}` }, { status: 400 });
        }

        // 2. Initiate Paystack Transfer
        const transferRes = await fetch("https://api.paystack.co/transfer", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source: "balance",
                amount: Math.round(amount * 100),
                recipient: recipientData.data.recipient_code,
                reason: reason || "Developer support withdrawal",
            }),
        });
        const transferData = await transferRes.json();
        if (!transferData.status) {
             // Return Paystack's error message directly
             return NextResponse.json({ success: false, message: `Paystack transfer failed: ${transferData.message}` }, { status: 400 });
        }

        // 3. Update gift statuses in the database
        const collection = await getCollection('developerGifts');
        await collection.updateMany(
            { _id: { $in: objectIdGiftIds } },
            { $set: { status: 'withdrawn', withdrawnAt: new Date().toISOString() } }
        );

        return NextResponse.json({ success: true, data: transferData.data });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
        console.error("Admin withdrawal error:", errorMessage, error);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
