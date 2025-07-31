import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token");

    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token.value, JWT_SECRET);
      // In a real application, you might want to fetch the user from the DB
      // to ensure the user still exists and their data is up-to-date.
      // For this example, we'll trust the JWT payload for simplicity.
      return NextResponse.json({ success: true, user: decoded });
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ success: false, message: "Failed to authenticate" }, { status: 500 });
  }
}
