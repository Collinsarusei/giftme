// app/api/payments/paystack-withdraw/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { PlatformFeeService } from "@/lib/services/platformFeeService"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PLATFORM_FEE_PERCENTAGE = 0.03 // 3%
const PAYSTACK_TRANSFER_FEE_KES = 20 // KES

// Helper function to format M-Pesa number for Paystack
function formatMpesaNumberForPaystack(number: string): string {
  // Remove any non-digit characters
  let cleanedNumber = number.replace(/\D/g, '');
  
  // If it starts with 254, replace it with 0
  if (cleanedNumber.startsWith('254') && cleanedNumber.length === 12) {
    cleanedNumber = '0' + cleanedNumber.substring(3);
  }
  // If it starts with +254, remove + and replace 254 with 0
  else if (cleanedNumber.startsWith('+' + '254') && cleanedNumber.length === 13) {
    cleanedNumber = '0' + cleanedNumber.substring(4);
  }
  // If it's already in 07... or 01... format, leave as is (e.g., 0712345678)
  // If it's short (e.g., 712345678), assume it needs a 0 prefix if no 254
  else if (cleanedNumber.length === 9 && (cleanedNumber.startsWith('7') || cleanedNumber.startsWith('1'))) {
    cleanedNumber = '0' + cleanedNumber;
  }

  // Basic validation for common Kenyan mobile numbers format (07... or 01... followed by 8 digits)
  if (!/^(07|01)\d{8}$/.test(cleanedNumber)) {
    console.warn(`Formatted M-Pesa number ${cleanedNumber} does not match expected pattern.`);
    // As a fallback, return the original cleaned number if it's not strictly valid but a common case like 07...
    // Paystack will ultimately validate if it's a real number.
  }

  return cleanedNumber;
}

async function getOrCreateRecipient(
  name: string,
  mpesaNumber: string,
  currency: string
): Promise<string> {
  // Format the M-Pesa number before sending to Paystack
  const formattedMpesaNumber = formatMpesaNumberForPaystack(mpesaNumber);
  console.log(`Original M-Pesa: ${mpesaNumber}, Formatted for Paystack: ${formattedMpesaNumber}`);

  // 1. Create a Transfer Recipient with Paystack
  const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "mobile_money",
      name: name,
      account_number: formattedMpesaNumber, // Use the formatted number
      bank_code: "MPESA",
      currency: currency.toUpperCase(),
    }),
  })

  const recipientResult = await recipientResponse.json()

  if (!recipientResult.status || !recipientResult.data.recipient_code) {
    throw new Error(recipientResult.message || "Failed to create transfer recipient.")
  }

  return recipientResult.data.recipient_code
}

export async function POST(request: NextRequest) {
  try {
    let {
      eventId,
      giftIds,
      recipientCode, // This might be null on the first withdrawal
      amount,
      currency = "KES",
      reason,
      name,
      mpesaNumber,
    } = await request.json()

    // --- Validation ---
    if (!eventId || !giftIds || !amount || (!recipientCode && !mpesaNumber)) {
      return NextResponse.json({ success: false, message: "Missing required fields for withdrawal." }, { status: 400 })
    }

    // --- Recipient Handling ---
    if (!recipientCode && mpesaNumber && name) {
      console.log("No recipient code found, creating a new one...");
      // Pass the original mpesaNumber to the recipient creation, formatting happens inside
      recipientCode = await getOrCreateRecipient(name, mpesaNumber, currency);
      // Save the new recipient code back to the event for future use
      await EventService.updateEventRecipientCode(eventId, recipientCode);
      console.log(`New recipient code ${recipientCode} saved for event ${eventId}.`);
    } else if (!recipientCode) {
        return NextResponse.json({ success: false, message: "A valid recipient or M-Pesa number is required." }, { status: 400 });
    }

    // --- Fee Calculation ---
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE
    const transactionFee = currency.toUpperCase() === "KES" ? PAYSTACK_TRANSFER_FEE_KES : 0
    const netAmount = amount - platformFee - transactionFee

    if (netAmount <= 0) {
      return NextResponse.json({ success: false, message: "Net withdrawal amount is too low after fees." }, { status: 400 })
    }

    // --- Paystack Transfer ---
    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(netAmount * 100),
        recipient: recipientCode,
        reason: reason || `Withdrawal for event ${eventId}`,
        currency: currency.toUpperCase(),
      }),
    })

    const transferResult = await transferResponse.json()

    if (!transferResult.status || (transferResult.data.status !== 'pending' && transferResult.data.status !== 'success')) {
      return NextResponse.json( { success: false, message: transferResult.message || "Failed to initiate transfer." }, { status: 500 } )
    }

    // --- Database Updates ---
    await EventService.updateGiftStatuses(eventId, giftIds, "withdrawn")
    await PlatformFeeService.recordFee({
      eventId: eventId,
      amount: platformFee,
      currency: currency,
      timestamp: new Date(),
      relatedTransactionId: transferResult.data.transfer_code,
    })

    return NextResponse.json({
      success: true,
      message: "Withdrawal initiated successfully!",
      data: transferResult.data,
    })
  } catch (error) {
    console.error("Paystack withdrawal error:", error)
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred."
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
  }
}
