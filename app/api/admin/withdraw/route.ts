// app/api/admin/withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

// A more robust helper to format the M-Pesa number to the required 254XXXXXXXXX format
const formatMpesaNumber = (number: string): string => {
    let cleanNumber = number.replace(/\D/g, ''); // Remove all non-digit characters

    if (cleanNumber.startsWith('0')) {
        // e.g., 0712345678 -> 254712345678
        return `254${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 9 && (cleanNumber.startsWith('7') || cleanNumber.startsWith('1'))) {
        // e.g., 712345678 -> 254712345678
        return `254${cleanNumber}`;
    } else if (cleanNumber.startsWith('254') && cleanNumber.length === 12) {
        // Already in the correct format
        return cleanNumber;
    }
    
    // Return the cleaned number for the validation check to catch it
    return cleanNumber;
};

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

        // **CRITICAL VALIDATION** before sending to Paystack
        if (!formattedMpesa.startsWith('254') || formattedMpesa.length !== 12) {
            return NextResponse.json({ success: false, message: "Invalid M-Pesa number format. Please use a valid Kenyan number (e.g., 07...)." }, { status: 400 });
        }

        const objectIdGiftIds = giftIds.map(id => {
            if (id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
                return new ObjectId(id);
            }
            return null;
        }).filter(id => id !== null);

        if (objectIdGiftIds.length !== giftIds.length) {
             return NextResponse.json({ success: false, message: "Some gift IDs were invalid. Please check data consistency." }, { status: 400 });
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
            throw new Error(`Failed to create Paystack recipient: ${recipientData.message || "Unknown error"}`);
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
            throw new Error(`Paystack transfer failed: ${transferData.message || "Unknown error"}`);
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
