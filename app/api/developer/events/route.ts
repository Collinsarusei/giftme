import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Helper function to verify developer token
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

export async function GET(request: NextRequest) {
  const auth = verifyDeveloperToken(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, message: auth.message }, { status: 401 });
  }

  try {
    // In EventService, you'll need a method to get ALL events, not just active ones.
    // Assuming EventService.getAllEvents() exists or can be created.
    const events = await EventService.getAllEvents();

    const eventsResponse = events.map(({ _id, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      events: eventsResponse,
    });
  } catch (error) {
    console.error("Error fetching developer events:", error);
    return NextResponse.json({ success: false, message: "Failed to load events" }, { status: 500 });
  }
}
