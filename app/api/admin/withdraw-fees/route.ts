// app/api/admin/withdraw-fees/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const formatMpesaNumber = (number: string): string => {
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('254') && cleanNumber.length === 12) return cleanNumber;
    if ((cleanNumber.startsWith('07') || cleanNumber.startsWith('01')) && cleanNumber.length === 10) return `254${cleanNumber.substring(1)}`;
    if ((cleanNumber.startsWith('7') || cleanNumber.startsWith('1')) && cleanNumber.length === 9) return `254${cleanNumber}`;
    if (cleanNumber.startsWith('2540')) return `254${cleanNumber.substring(4)}`;
    console.warn(`Could not format M-Pesa number: ${number}.`);
    return cleanNumber;
};

export async function POST(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const { amount, mpesaNumber, reason, feeIds } = await request.json();

        if (!amount || !mpesaNumber || !Array.isArray(feeIds) || feeIds.length === 0) {
            return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
        }
        
        const formattedMpesa = formatMpesaNumber(mpesaNumber);

        const objectIdFeeIds = feeIds.map(id => {
            try {
                return new ObjectId(id);
            } catch {
                return null;
            }
        }).filter(id => id !== null);

        if (objectIdFeeIds.length !== feeIds.length) {
            return NextResponse.json({ success: false, message: 'Invalid fee IDs provided.' }, { status: 400 });
        }

        const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "mobile_money",
                name: "Admin Fee Withdrawal",
                account_number: formattedMpesa,
                bank_code: "MPESA",
                currency: "KES",
            }),
        });
        const recipientData = await recipientRes.json();

        if (!recipientData.status || !recipientData.data?.recipient_code) {
            throw new Error(`Failed to create Paystack recipient: ${recipientData.message}`);
        }

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
                reason: reason || "Platform fee withdrawal",
            }),
        });
        const transferData = await transferRes.json();

        if (!transferData.status) {
            throw new Error(`Paystack transfer failed: ${transferData.message}`);
        }

        const collection = await getCollection('platform_fees');
        const updateResult = await collection.updateMany(
            { _id: { $in: objectIdFeeIds } },
            { $set: { status: 'withdrawn', withdrawnAt: new Date().toISOString() } }
        );

        return NextResponse.json({ success: true, data: transferData.data, updateResult });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal error occurred.";
        console.error("Platform fee withdrawal error:", errorMessage, error);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
