import { NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { getDatabase } from "@/lib/mongodb"
import { headers } from 'next/headers'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const eventId = params.id
  const headersList = headers()
  const userEmail = headersList.get('x-user-email') // Assuming you pass the admin's email for auth

  // Basic authorization check: Only allow if the request comes from the admin email
  if (!userEmail || userEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
  }

  if (!eventId) {
    return NextResponse.json({ success: false, message: "Event ID is required." }, { status: 400 })
  }

  try {
    await getDatabase() // Ensure DB connection

    const success = await EventService.hardDeleteEvent(eventId)

    if (success) {
      return NextResponse.json({ success: true, message: "Event permanently deleted." }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: "Failed to delete event. Event not found." }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting event (admin):"), error
    return NextResponse.json({ success: false, message: "An error occurred while deleting the event." }, { status: 500 })
  }
}
