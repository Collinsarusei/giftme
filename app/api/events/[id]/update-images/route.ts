import { NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { getDatabase } from "@/lib/mongodb"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const eventId = params.id
  const { images } = await req.json()

  if (!eventId || !images) {
    return NextResponse.json({ success: false, message: "Event ID and images are required." }, { status: 400 })
  }

  try {
    await getDatabase() // Ensure DB connection

    const success = await EventService.updateEventImages(eventId, images)

    if (success) {
      return NextResponse.json({ success: true, message: "Event images updated successfully." }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: "Failed to update event images. Event not found or no changes." }, { status: 404 })
    }
  } catch (error) {
    console.error("Error updating event images:", error)
    return NextResponse.json({ success: false, message: "An error occurred while updating event images." }, { status: 500 })
  }
}
