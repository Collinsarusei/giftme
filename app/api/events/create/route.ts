import { type NextRequest, NextResponse } from "next/server"
import { EventService } from "@/lib/services/eventService"
import { UserService } from "@/lib/services/userService"
import { v4 as uuidv4 } from 'uuid' // Import uuid
import { Event } from "@/lib/models/Event" // Import the Event interface

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()

    const { eventType, otherEventType, userName, eventDate, mpesaNumber, fundraisingGoal, description, images, createdBy } = eventData

    console.log("Received event creation request:", { eventType, userName, eventDate, mpesaNumber, imagesCount: images ? images.length : 0, createdBy });

    // Validate required fields
    if (!eventType || !userName || !eventDate || !mpesaNumber || !createdBy) {
      console.error("Missing required fields for event creation.", { eventType, userName, eventDate, mpesaNumber, createdBy });
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Handle 'other' event type specification
    let finalEventType = eventType;
    let finalEventNameSuffix = "Celebration";
    if (eventType === "other") {
      if (!otherEventType) {
        console.error("'Other' event type selected but not specified.");
        return NextResponse.json({ success: false, message: "Please specify the event type when 'Other Celebration' is selected." }, { status: 400 });
      }
      finalEventType = otherEventType;
      finalEventNameSuffix = otherEventType; // Use the specified type for name
    } else {
      // Map event type to display name if not 'other'
      const eventTypeMap: { [key: string]: string } = {
        birthday: "Birthday",
        graduation: "Graduation",
        wedding: "Wedding",
        "baby-shower": "Baby Shower",
        anniversary: "Anniversary",
        // 'other' is handled above
      };
      finalEventNameSuffix = eventTypeMap[eventType] || "Celebration";
    }

    // Basic validation for image data size
    const MAX_IMAGE_PAYLOAD_SIZE_MB = 8; // Set a reasonable limit, e.g., 8MB total for images
    const maxBytes = MAX_IMAGE_PAYLOAD_SIZE_MB * 1024 * 1024; // Convert MB to bytes
    let totalImageBytes = 0;

    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) { // Changed to traditional for loop
        const img = images[i];
        if (typeof img === 'string') {
          const imgBytes = Buffer.byteLength(img, 'utf8');
          totalImageBytes += imgBytes;
          console.log(`Image ${i + 1} size: ${(imgBytes / 1024).toFixed(2)} KB`);
        }
      }
    }
    console.log(`Total image payload size: ${(totalImageBytes / (1024 * 1024)).toFixed(2)} MB`);

    if (totalImageBytes > maxBytes) {
      console.warn(`Image payload size (${(totalImageBytes / (1024 * 1024)).toFixed(2)} MB) exceeds limit of ${MAX_IMAGE_PAYLOAD_SIZE_MB} MB. Event created by: ${createdBy}`);
      return NextResponse.json(
        { success: false, message: `Image uploads are too large. Please try with smaller images or fewer images (max ${MAX_IMAGE_PAYLOAD_SIZE_MB}MB total).` },
        { status: 413 } // 413 Payload Too Large
      );
    }

    // Calculate expiresAt: for simplicity, let's set it to one year from the eventDate
    const eventDateObj = new Date(eventDate);
    const expiresAtDate = new Date(eventDateObj.setFullYear(eventDateObj.getFullYear() + 1));
    const expiresAt = expiresAtDate.toISOString();

    const newEvent: Event = {
      id: uuidv4(), // Generate a unique ID
      name: `${userName}'s ${finalEventNameSuffix}`,
      type: finalEventType,
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
      comments: [],
      creatorEmail: ""
    }

    const event = await EventService.createEvent(newEvent)

    if (!event) {
        console.error("Failed to create event in database via EventService.", newEvent);
        return NextResponse.json({ success: false, message: "Failed to create event in database." }, { status: 500 })
    }

    // Add event to user's events list
    await UserService.addEventToUser(createdBy, event.id)
    console.log(`Event ${event.id} created successfully and linked to user ${createdBy}.`);

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
    console.error("Unhandled error during event creation:", error)
    return NextResponse.json({ success: false, message: "Failed to create event. An unexpected error occurred." }, { status: 500 })
  }
}
