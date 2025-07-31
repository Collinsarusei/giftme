import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import { UserService } from "@/lib/services/userService";
import { DeveloperGiftService } from "@/lib/services/developerGiftService";
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
    const allEvents = await EventService.getAllEvents();
    const allUsers = await UserService.getAllUsers();
    const allDeveloperGifts = await DeveloperGiftService.getAllDeveloperGifts();

    // Calculate stats dynamically
    const totalEvents = allEvents.length;
    const totalUsers = allUsers.length;
    const totalGifts = allEvents.reduce((sum, event) => sum + (event.giftCount || 0), 0);
    const totalRevenue = allEvents.reduce((sum, event) => sum + (event.raised || 0), 0);
    
    const pendingWithdrawals = allEvents.reduce((sum, event) => {
      const paystackGifts = (event.gifts || []).filter(
        (gift: any) => gift.paymentMethod === "paystack" && gift.status === "pending_withdrawal",
      );
      return sum + paystackGifts.reduce((giftSum: number, gift: any) => giftSum + gift.amount, 0);
    }, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents,
        totalUsers,
        totalGifts,
        totalRevenue,
        pendingWithdrawals,
      },
    });
  } catch (error) {
    console.error("Error fetching developer stats:", error);
    return NextResponse.json({ success: false, message: "Failed to load developer stats" }, { status: 500 });
  }
}
