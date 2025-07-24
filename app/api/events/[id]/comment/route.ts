// app/api/events/[id]/comment/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import type { Comment } from "@/lib/models/Event";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id;
        const { from, message } = await request.json();

        if (!eventId || !from || !message) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const newComment: Comment = {
            id: `comment_${Date.now()}`,
            from,
            message,
            timestamp: new Date().toISOString(),
        };

        const success = await EventService.addCommentToEvent(eventId, newComment);

        if (success) {
            return NextResponse.json({ success: true, comment: newComment });
        } else {
            return NextResponse.json({ success: false, message: "Failed to add comment" }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
