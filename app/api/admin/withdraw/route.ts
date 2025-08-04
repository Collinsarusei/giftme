// app/api/admin/withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { formatMpesaNumber } from "@/lib/utils"; // Import the robust formatter

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const PAYSTACK_TRANSFER_FEE_KES = 20;

export async function POST(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            console.log("Unauthorized access attempt to /api/admin/withdraw from:", userEmail);
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const { amount, mpesaNumber, reason } = await request.json();

        console.log("Admin Gift Withdrawal Request:", { amount, mpesaNumber, reason });

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

        const developerGiftsCollection = await getCollection('developerGifts');
        // Modified query: Include documents where 'status' field doesn't exist or is 'completed'
        const completedGifts = await developerGiftsCollection.find({ 
            $or: [
                { status: { $exists: false } },
                { status: 'completed' }
            ]
        }).toArray();

        const availableBalance = completedGifts.reduce((sum, g) => sum + g.amount, 0);
        console.log("Available developer gift balance (backend):", availableBalance);

        if (amount > availableBalance) {
            console.log("Withdrawal denied: Requested amount exceeds available balance.", { requested: amount, available: availableBalance });
            return NextResponse.json({ success: false, message: `Requested amount (${amount}) exceeds available balance (${availableBalance}).` }, { status: 400 });
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
                name: "Developer/Admin", // Or a more specific name if possible
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
                reason: reason || "Developer support withdrawal",
            }),
        });
        const transferData = await transferRes.json();
        if (!transferData.status) {
             console.error("Paystack transfer initiation failed:", transferData);
             return NextResponse.json({ success: false, message: `Paystack transfer failed: ${transferData.message || 'Unknown error'}` }, { status: 400 });
        }
        console.log("Paystack transfer initiated.", transferData.data);

        // 3. Update gift statuses in the database
        let remainingAmountToMark = amount;
        const giftIdsToUpdate = [];

        // Sort gifts by timestamp (oldest first) to mark them as withdrawn
        completedGifts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        for (const gift of completedGifts) {
            if (remainingAmountToMark > 0) {
                const amountFromGift = Math.min(remainingAmountToMark, gift.amount);
                giftIdsToUpdate.push(gift._id);
                remainingAmountToMark -= amountFromGift;
            } else {
                break;
            }
        }
        console.log("Gifts to mark as withdrawn:", giftIdsToUpdate.length, "IDs");

        if (giftIdsToUpdate.length > 0) {
            await developerGiftsCollection.updateMany(
                { _id: { $in: giftIdsToUpdate } },
                { $set: { status: 'withdrawn', withdrawnAt: new Date().toISOString() } }
            );
            console.log("Developer gifts updated to withdrawn status.");
        }

        return NextResponse.json({ success: true, data: transferData.data });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
        console.error("Admin gift withdrawal error:", errorMessage, error);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
