// app/api/admin/withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

// A helper to format the M-Pesa number robustly for Paystack
const formatMpesaNumber = (number: string): string => {
    // Remove all non-digit characters
    let cleanNumber = number.replace(/\D/g, '');

    // If it starts with 254 and is 12 digits, it's likely correct
    if (cleanNumber.startsWith('254') && cleanNumber.length === 12) {
        return cleanNumber;
    }

    // If it starts with 07, 01, remove the leading 0 and add 254
    if ((cleanNumber.startsWith('07') || cleanNumber.startsWith('01')) && cleanNumber.length === 10) {
        return `254${cleanNumber.substring(1)}`;
    }
    
    // If it starts with 7 or 1, and is 9 digits, add 254
    if ((cleanNumber.startsWith('7') || cleanNumber.startsWith('1')) && cleanNumber.length === 9) {
        return `254${cleanNumber}`;
    }

    // Fallback for numbers that are already almost correct, e.g. '25407...'
    if (cleanNumber.startsWith('2540')) {
        return `254${cleanNumber.substring(4)}`;
    }

    console.warn(`Could not format M-Pesa number: ${number}. Returning cleaned number as is.`);
    return cleanNumber; // Return cleaned number and let Paystack validate
};

export async function POST(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            console.warn("Admin withdraw: Unauthorized access attempt.");
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const { amount, mpesaNumber, reason, giftIds } = await request.json();

        console.log("Admin withdraw request received:", { amount, mpesaNumber, reason, giftIds });

        if (!amount || !mpesaNumber || !Array.isArray(giftIds) || giftIds.length === 0) {
            console.error("Admin withdraw: Missing required fields.", { amount, mpesaNumber, giftIds });
            return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
        }
        
        const formattedMpesa = formatMpesaNumber(mpesaNumber);
        console.log(`Original M-Pesa: ${mpesaNumber}, Formatted: ${formattedMpesa}`);

        // Convert giftIds to ObjectId, robustly handling potential errors
        const objectIdGiftIds = giftIds.map(id => {
            try {
                return new ObjectId(id);
            } catch (e) {
                console.warn(`Admin withdraw: Invalid ObjectId format for gift ID: ${id}. This gift will be skipped from withdrawal update.`);
                return null; // Return null for invalid ObjectIds
            }
        }).filter(id => id !== null); // Filter out any nulls

        if (objectIdGiftIds.length === 0 && giftIds.length > 0) {
             console.error("Admin withdraw: No valid MongoDB ObjectIds found for withdrawal.", giftIds);
             return NextResponse.json({ success: false, message: "Invalid gift IDs provided. Please check data consistency." }, { status: 400 });
        }

        // 1. Create Paystack Recipient
        console.log("Admin withdraw: Creating Paystack recipient...");
        const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "mobile_money",
                name: "Developer/Admin",
                account_number: formattedMpesa, // Use the formatted number
                bank_code: "MPESA",
                currency: "KES",
            }),
        });
        const recipientData = await recipientRes.json();
        console.log("Paystack recipient response:", recipientData);

        if (!recipientData.status || !recipientData.data?.recipient_code) {
            throw new Error(`Failed to create Paystack recipient: ${recipientData.message || "Unknown error"}`);
        }

        // 2. Initiate Paystack Transfer
        console.log("Admin withdraw: Initiating Paystack transfer...");
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
        console.log("Paystack transfer response:", transferData);

        if (!transferData.status) {
            throw new Error(`Paystack transfer failed: ${transferData.message || "Unknown error"}`);
        }

        // 3. Update gift statuses in the database
        console.log("Admin withdraw: Updating developer gift statuses...");
        const collection = await getCollection('developerGifts');
        
        const updateResult = await collection.updateMany(
            { _id: { $in: objectIdGiftIds } },
            { $set: { status: 'withdrawn', withdrawnAt: new Date().toISOString() } }
        );
        console.log("MongoDB updateMany result:", updateResult);

        return NextResponse.json({ success: true, data: transferData.data, updateResult: updateResult });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An internal error occurred.";
        console.error("Admin withdrawal error:", errorMessage, error);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
