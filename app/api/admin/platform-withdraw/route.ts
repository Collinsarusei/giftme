// app/api/admin/platform-withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { formatMpesaNumber } from "@/lib/utils"; // Import the robust formatter
import { ObjectId } from "mongodb";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const PAYSTACK_TRANSFER_FEE_KES = 20;

export async function POST(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            console.log("Unauthorized access attempt to /api/admin/platform-withdraw from:", userEmail);
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const { amount, mpesaNumber, reason } = await request.json();

        console.log("Platform Fee Withdrawal Request:", { amount, mpesaNumber, reason });

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            console.log("Validation failed: Invalid amount provided.", { amount });
            return NextResponse.json({ success: false, message: 'A valid positive amount is required.' }, { status: 400 });
        }
        if (!mpesaNumber) {
            console.log("Validation failed: M-Pesa number is missing.");
            return NextResponse.json({ success: false, message: 'M-Pesa number is required.' }, { status: 400 });
        }

        const formattedMpesa = formatMpesaNumber(mpesaNumber);

        if (!formattedMpesa) {
            console.log("Validation failed: Invalid M-Pesa number format.", { mpesaNumber });
            return NextResponse.json({ success: false, message: "Invalid M-Pesa number format. Please use a valid Kenyan number (e.g., 07...)." }, { status: 400 });
        }

        const platformFeesCollection = await getCollection('platform_fees');
        // Modified query: Include documents where 'withdrawn' field doesn't exist or is false
        const unwithdrawnFees = await platformFeesCollection.find({ 
            $or: [
                { withdrawn: { $exists: false } },
                { withdrawn: false }
            ]
        }).toArray();
        
        const totalAvailableFees = unwithdrawnFees.reduce((sum, fee) => sum + fee.amount, 0);
        console.log("Available platform fees balance (backend):", totalAvailableFees);

        if (amount > totalAvailableFees) {
            console.log("Withdrawal denied: Requested amount exceeds available platform fees.", { requested: amount, available: totalAvailableFees });
            return NextResponse.json({ success: false, message: `Requested amount (${amount}) exceeds available platform fees (${totalAvailableFees}).` }, { status: 400 });
        }

        const netAmount = amount - PAYSTACK_TRANSFER_FEE_KES;
        if (netAmount <= 0) {
            console.log("Withdrawal denied: Net amount is too low after transaction fee.", { netAmount });
            return NextResponse.json({ success: false, message: "Amount is too low after transaction fee." }, { status: 400 });
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
            console.error("Paystack recipient creation failed:", recipientData);
            return NextResponse.json({ success: false, message: `Failed to create Paystack recipient: ${recipientData.message || 'Unknown error'}` }, { status: 400 });
        }
        console.log("Paystack recipient created.", recipientData.data.recipient_code);

        // 2. Initiate Paystack Transfer
        const transferRes = await fetch("https://api.paystack.co/transfer", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source: "balance",
                amount: Math.round(netAmount * 100), // Paystack expects amount in kobo/cents
                recipient: recipientData.data.recipient_code,
                reason: reason || "Platform fee withdrawal",
            }),
        });
        const transferData = await transferRes.json();
        if (!transferData.status) {
            console.error("Paystack transfer initiation failed:", transferData);
            return NextResponse.json({ success: false, message: `Paystack transfer failed: ${transferData.message || 'Unknown error'}` }, { status: 400 });
        }
        console.log("Paystack transfer initiated.", transferData.data);

        // 3. Mark fees as withdrawn based on the requested amount
        let remainingAmountToMark = amount;
        const feeIdsToUpdate = [];

        // Sort fees by timestamp (oldest first) to mark them as withdrawn
        unwithdrawnFees.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        for (const fee of unwithdrawnFees) {
            if (remainingAmountToMark > 0) {
                const amountFromFee = Math.min(remainingAmountToMark, fee.amount);
                feeIdsToUpdate.push(fee._id);
                remainingAmountToMark -= amountFromFee;
            } else {
                break;
            }
        }
        console.log("Platform fees to mark as withdrawn:", feeIdsToUpdate.length, "IDs");
        
        if (feeIdsToUpdate.length > 0) {
            await platformFeesCollection.updateMany(
                { _id: { $in: feeIdsToUpdate } },
                { $set: { withdrawn: true, withdrawnAt: new Date().toISOString() } }
            );
            console.log("Platform fees updated to withdrawn status.");
        }

        return NextResponse.json({ success: true, data: transferData.data });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
        console.error("Platform fee withdrawal error:", errorMessage);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
