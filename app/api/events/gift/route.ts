import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import type { Gift } from "@/lib/models/Event"

export async function POST(request: NextRequest) {
  try {
    const { eventId, giftData, paymentMethod, transactionId } = await request.json()

    if (!eventId || !giftData) {
      return NextResponse.json({ success: false, message: "Missing required data" }, { status: 400 })
    }

    const grossAmount = giftData.amount;
    const platformFee = grossAmount * 0.03; // 3% fee
    const netAmount = grossAmount - platformFee;

    const gift: Gift = {
      id: Date.now().toString(),
      from: giftData.from || "Anonymous",
      email: giftData.email,
      amount: grossAmount,
      developerFee: platformFee,
      currency: giftData.currency || "KES",
      message: giftData.message,
      timestamp: new Date().toISOString(),
      paymentMethod: paymentMethod,
      status: paymentMethod === "mpesa" ? "completed" : "pending_withdrawal",
      transactionId,
    }

    const success = await EventService.addGiftToEvent(eventId, gift, netAmount);

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to record gift" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Gift recorded successfully!",
      gift: {
        id: gift.id,
        amount: gift.amount,
        from: gift.from,
      },
    })
  } catch (error) {
    console.error("Gift recording error:", error)
    return NextResponse.json({ success: false, message: "Failed to record gift" }, { status: 500 })
  }
}
