import { type NextRequest, NextResponse } from "next/server"
import { DeveloperGiftService } from "@/lib/services/developerGiftService";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic'; // Ensure dynamic fetching

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Helper function to verify developer token (re-used from events route)
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
    // Fetch gifts with status 'completed' or 'withdrawn'
    const gifts = await DeveloperGiftService.getAllDeveloperGifts(); // This service method already fetches all, filtering will be done on frontend if needed or we update service
    
    // Filtering for completed or withdrawn status as per admin dashboard requirement
    const filteredGifts = gifts.filter(gift => gift.status === 'completed' || gift.status === 'withdrawn');

    return NextResponse.json({
      success: true,
      gifts: filteredGifts,
    });
  } catch (error) {
    console.error("Error fetching developer gifts:", error);
    return NextResponse.json({ success: false, message: "Failed to load developer gifts" }, { status: 500 });
  }
}
