import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Helper function to verify developer token (re-used from other developer routes)
const verifyDeveloperToken = (req: NextRequest) => {
  const cookieStore = cookies();
  const token = cookieStore.get("dev_token");

  if (!token) {
    return { authenticated: false, message: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(token.value, JWT_SECRET) as { role: string };
    if (decoded.role === "developer") {
      return { authenticated: true };
    } else {
      return { authenticated: false, message: "Forbidden" };
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return { authenticated: false, message: "Invalid or expired token" };
  }
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = verifyDeveloperToken(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.message }, { status: 401 });
  }

  try {
    const eventId = params.id;

    if (!eventId) {
      return NextResponse.json({ success: false, message: "Event ID is required" }, { status: 400 });
    }

    // Update the event status to 'deleted' instead of physically removing it
    const success = await EventService.updateEventStatus(eventId, "deleted");

    if (success) {
      return NextResponse.json({ success: true, message: "Event marked as deleted" });
    } else {
      return NextResponse.json({ success: false, message: "Failed to mark event as deleted" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error soft deleting event:", error);
    return NextResponse.json({ success: false, message: "Failed to soft delete event." }, { status: 500 });
  }
}
