import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    const event = await EventService.getEventById(eventId)

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Increment view count
    await EventService.incrementViews(eventId)

    // Remove MongoDB _id before sending to client
    const { _id, ...eventResponse } = event

    return NextResponse.json({
      success: true,
      event: eventResponse,
    })
  } catch (error) {
    console.error("Get event error:", error)
    return NextResponse.json({ success: false, message: "Failed to load event" }, { status: 500 })
  }
}
