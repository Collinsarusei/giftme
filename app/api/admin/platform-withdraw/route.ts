// app/api/admin/platform-withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { PlatformFeeService } from "@/lib/services/platformFeeService"
import { getCollection } from "@/lib/mongodb"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

// Re-using the robust M-Pesa number formatter
const formatMpesaNumber = (number: string): string => {
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('0') && cleanNumber.length === 10) return `254${cleanNumber.substring(1)}`;
    if ((cleanNumber.startsWith('7') || cleanNumber.startsWith('1')) && cleanNumber.length === 9) return `254${cleanNumber}`;
    if (cleanNumber.startsWith('254') && cleanNumber.length === 12) return cleanNumber;
    if (cleanNumber.startsWith('+254') && cleanNumber.length === 13) return cleanNumber.substring(1);
    console.warn(`M-Pesa number formatting failed for input: ${number}. Result: ${cleanNumber}. Expected 254XXXXXXXXX (12 digits)`);
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

        // Fetch all platform fees and mark them for withdrawal
        const platformFeesCollection = await getCollection('platform_fees');
        const feesToWithdraw = await platformFeesCollection.find({ withdrawn: { $ne: true } }).toArray();

        if (feesToWithdraw.length === 0) {
            return NextResponse.json({ success: false, message: 'No platform fees available for withdrawal.' }, { status: 400 });
        }
        
        const totalFeeAmount = feesToWithdraw.reduce((sum, fee) => sum + fee.amount, 0);

        if (Math.abs(totalFeeAmount - amount) > 0.01) { // Check for amount mismatch with a small tolerance
            return NextResponse.json({ success: false, message: `Amount mismatch. Frontend: ${amount}, Backend: ${totalFeeAmount}` }, { status: 400 });
        }

        // Create Paystack Recipient
        const recipientRes = await fetch("https://api.paystack.co/transferrecipient", { /* ... recipient creation ... */ });
        const recipientData = await recipientRes.json();
        if (!recipientData.status || !recipientData.data?.recipient_code) {
            throw new Error(`Failed to create Paystack recipient: ${recipientData.message}`);
        }

        // Initiate Paystack Transfer
        const transferRes = await fetch("https://api.paystack.co/transfer", { /* ... transfer initiation ... */ });
        const transferData = await transferRes.json();
        if (!transferData.status) {
            throw new Error(`Paystack transfer failed: ${transferData.message}`);
        }

        // Mark fees as withdrawn
        const feeIdsToUpdate = feesToWithdraw.map(fee => fee._id);
        await platformFeesCollection.updateMany(
            { _id: { $in: feeIdsToUpdate } },
            { $set: { withdrawn: true, withdrawnAt: new Date().toISOString() } }
        );

        return NextResponse.json({ success: true, data: transferData.data });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal error occurred.";
        console.error("Platform fee withdrawal error:", errorMessage);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
