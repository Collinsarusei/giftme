// app/api/events/[id]/like/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id;
        const { liked } = await request.json(); // liked will be true or false

        if (!eventId) {
            return NextResponse.json({ success: false, message: "Event ID is required" }, { status: 400 });
        }

        const success = await EventService.toggleLikeEvent(eventId, liked);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: "Failed to update like status" }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
