// app/api/admin/platform-withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { PlatformFeeService } from "@/lib/services/platformFeeService"
import { getCollection } from "@/lib/mongodb"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

// Use the same robust M-Pesa number formatter
const formatMpesaNumber = (number: string): string => {
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
        return `254${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 9 && (cleanNumber.startsWith('7') || cleanNumber.startsWith('1'))) {
        return `254${cleanNumber}`;
    } else if (cleanNumber.startsWith('254') && cleanNumber.length === 12) {
        return cleanNumber;
    }
    return cleanNumber;
};

export async function POST(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const { amount, mpesaNumber, reason } = await request.json();

        if (!amount || !mpesaNumber) {
            return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
        }

        const formattedMpesa = formatMpesaNumber(mpesaNumber);

        // **CRITICAL VALIDATION** before sending to Paystack
        if (!formattedMpesa.startsWith('254') || formattedMpesa.length !== 12) {
            return NextResponse.json({ success: false, message: "Invalid M-Pesa number format. Please use a valid Kenyan number (e.g., 07...)." }, { status: 400 });
        }

        const platformFeesCollection = await getCollection('platform_fees');
        const feesToWithdraw = await platformFeesCollection.find({ withdrawn: { $ne: true } }).toArray();

        if (feesToWithdraw.length === 0) {
            return NextResponse.json({ success: false, message: 'No platform fees available for withdrawal.' }, { status: 400 });
        }
        
        const totalFeeAmount = feesToWithdraw.reduce((sum, fee) => sum + fee.amount, 0);

        // Paystack fee should be subtracted from the total to be withdrawn
        const netAmount = totalFeeAmount - 20; // 20 KES Paystack fee
        if (netAmount <= 0) {
            return NextResponse.json({ success: false, message: "Net payout is too low after Paystack fee." }, { status: 400 });
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
                name: "Platform Fee Withdrawal",
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
                amount: Math.round(netAmount * 100),
                recipient: recipientData.data.recipient_code,
                reason: reason || "Platform fee withdrawal",
            }),
        });
        const transferData = await transferRes.json();
        if (!transferData.status) {
            throw new Error(`Paystack transfer failed: ${transferData.message}`);
        }

        // 3. Mark fees as withdrawn
        const feeIdsToUpdate = feesToWithdraw.map(fee => fee._id);
        await platformFeesCollection.updateMany(
            { _id: { $in: feeIdsToUpdate } },
            { $set: { withdrawn: true, withdrawnAt: new Date().toISOString() } }
        );

        return NextResponse.json({ success: true, data: transferData.data });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
        console.error("Platform fee withdrawal error:", errorMessage);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
