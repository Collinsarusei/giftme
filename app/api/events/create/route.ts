import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { UserService } from "@/lib/services/userService"

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()

    const { eventType, userName, eventDate, mpesaNumber, fundraisingGoal, description, images, createdBy } = eventData

    // Validate required fields
    if (!eventType || !userName || !eventDate || !mpesaNumber || !createdBy) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Map event type to display name
    const eventTypeMap: { [key: string]: string } = {
      birthday: "Birthday",
      graduation: "Graduation",
      wedding: "Wedding",
      "baby-shower": "Baby Shower",
      anniversary: "Anniversary",
      other: "Other Celebration",
    }

    const event = await EventService.createEvent({
      name: `${userName}'s ${eventTypeMap[eventType] || "Celebration"}`,
      type: eventTypeMap[eventType] || "Other",
      date: eventDate,
      mpesaNumber,
      description,
      images: images || [],
      goal: fundraisingGoal ? Number.parseInt(fundraisingGoal) : undefined,
      currency: "KES",
      creatorName: userName,
      createdBy,
    })

    // Add event to user's events list
    await UserService.addEventToUser(createdBy, event.id)

    return NextResponse.json({
      success: true,
      message: "Event created successfully!",
      event: {
        id: event.id,
        name: event.name,
        type: event.type,
        date: event.date,
      },
    })
  } catch (error) {
    console.error("Event creation error:", error)
    return NextResponse.json({ success: false, message: "Failed to create event. Please try again." }, { status: 500 })
  }
}
