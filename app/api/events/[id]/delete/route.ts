// app/api/events/[id]/delete/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    if (!eventId) {
      return NextResponse.json({ success: false, message: "Event ID is required" }, { status: 400 })
    }

    const wasDeleted = await EventService.deleteEvent(eventId)

    if (wasDeleted) {
      return NextResponse.json({ success: true, message: "Event deleted successfully" })
    } else {
      return NextResponse.json({ success: false, message: "Event not found or could not be deleted" }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete event" }, { status: 500 })
  }
}
