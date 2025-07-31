import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { UserService } from "@/lib/services/userService"
import { v4 as uuidv4 } from 'uuid' // Import uuid
import { Event } from "@/lib/models/Event" // Import the Event interface

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

    // Calculate expiresAt: for simplicity, let's set it to one year from the eventDate
    // In a real application, you might want more sophisticated date handling.
    const eventDateObj = new Date(eventDate);
    const expiresAtDate = new Date(eventDateObj.setFullYear(eventDateObj.getFullYear() + 1));
    const expiresAt = expiresAtDate.toISOString();

    const newEvent: Event = {
      id: uuidv4(), // Generate a unique ID
      name: `${userName}'s ${eventTypeMap[eventType] || "Celebration"}`,
      type: eventTypeMap[eventType] || "Other",
      date: eventDate,
      mpesaNumber,
      description,
      images: images || [],
      raised: 0, // Initialize raised amount
      goal: fundraisingGoal ? Number.parseInt(fundraisingGoal) : undefined,
      currency: "KES",
      giftCount: 0, // Initialize gift count
      views: 0, // Initialize views
      shares: 0, // Initialize shares
      createdAt: new Date().toISOString(), // Set creation timestamp
      creatorName: userName,
      createdBy,
      gifts: [], // Initialize gifts as an empty array
      status: "active", // Set initial status to active
      expiresAt: expiresAt, // Set expiration date
      likes: 0, // Initialize likes
      comments: [], // Initialize comments
    }

    const event = await EventService.createEvent(newEvent)

    if (!event) {
        return NextResponse.json({ success: false, message: "Failed to create event in database." }, { status: 500 })
    }

    // Add event to user's events list
    // Ensure event.id exists before calling addEventToUser
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
