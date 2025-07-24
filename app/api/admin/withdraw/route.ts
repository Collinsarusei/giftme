// app/api/admin/withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

// A helper to format the M-Pesa number
const formatMpesaNumber = (number: string): string => {
    if (number.startsWith('0')) {
        return `254${number.substring(1)}`;
    }
    if (number.startsWith('+')) {
        return number.substring(1);
    }
    return number;
}

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
            throw new Error(`Failed to create Paystack recipient: ${recipientData.message}`);
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
                amount: Math.round(amount * 100), // Amount in kobo
                recipient: recipientData.data.recipient_code,
                reason: reason || "Developer support withdrawal",
            }),
        });
        const transferData = await transferRes.json();

        if (!transferData.status) {
            throw new Error(`Paystack transfer failed: ${transferData.message}`);
        }

        // 3. Update gift statuses in the database
        const collection = await getCollection('developer_gifts');
        const objectIdGiftIds = giftIds.map(id => new ObjectId(id));

        await collection.updateMany(
            { _id: { $in: objectIdGiftIds } },
            { $set: { status: 'withdrawn', withdrawnAt: new Date().toISOString() } }
        );

        return NextResponse.json({ success: true, data: transferData.data });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal error occurred.";
        console.error("Admin withdrawal error:", errorMessage);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
