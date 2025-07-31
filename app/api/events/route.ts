import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const createdBy = searchParams.get("createdBy")
    const query = searchParams.get("query")
    let events

    if (createdBy) {
      // For creator dashboard, show all events (active, completed, cancelled, expired)
      events = await EventService.getEventsByCreator(createdBy)
    } else if (query) {
      // For search, only show active events (already handled in EventService.searchEvents) - Assuming searchEvents only returns active ones.
      // If searchEvents needs to include expired events, that logic should be updated in eventService.
      events = await EventService.searchEvents(query) // Keep original search behavior for now
    } else {
      // For homepage, show active and expired events
      events = await EventService.getPublicEvents(6) // Limit to 6 for homepage as before
    }

    // Remove MongoDB _id from each event
    const eventsResponse = events.map(({ _id, ...rest }) => rest)

    return NextResponse.json({
      success: true,
      events: eventsResponse,
    })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ success: false, message: "Failed to load events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Expire past events
    const expiredEvents = await EventService.expirePastEvents()
    // For each expired event, check for pending withdrawals and notify creator
    for (const event of expiredEvents) {
      const pendingGifts = (event.gifts || []).filter(
        (gift) => gift.paymentMethod === "paystack" && gift.status === "pending_withdrawal"
      )
      if (pendingGifts.length > 0) {
        // Send email to event creator with private withdrawal link
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: event.createdBy,
            subject: `Your event '${event.name}' has expired - Withdraw your pending gifts`,
            message: `Hi,

Your event '${event.name}' has expired. You have pending Paystack withdrawals. Please use the following private link to access your withdrawal page:

${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?withdrawal=${event.id}

Thank you for using CelebrateWith.me!`,
          }),
        })
      }
    }
    return NextResponse.json({ success: true, expiredCount: expiredEvents.length })
  } catch (error) {
    console.error("Expire events error:", error)
    return NextResponse.json({ success: false, message: "Failed to expire events" }, { status: 500 })
  }
}
