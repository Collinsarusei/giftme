import { type NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/userService";
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
    const users = await UserService.getAllUsers();
    // Remove sensitive data before sending to client
    const usersResponse = users.map(({ password, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      users: usersResponse,
    });
  } catch (error) {
    console.error("Error fetching developer users:", error);
    return NextResponse.json({ success: false, message: "Failed to load users" }, { status: 500 });
  }
}
