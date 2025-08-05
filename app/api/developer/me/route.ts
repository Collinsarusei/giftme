import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("dev_token");

    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated as developer" }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token.value, JWT_SECRET) as { role: string };
      if (decoded.role === "developer") {
        return NextResponse.json({ success: true, user: { role: "developer" } }); // Return minimal info, just enough to confirm auth
      } else {
        return NextResponse.json({ success: false, message: "Forbidden: Not a developer" }, { status: 403 });
      }
    } catch (error) {
      console.error("Developer token verification error:", error);
      return NextResponse.json({ success: false, message: "Invalid or expired developer token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Developer /me error:", error);
    return NextResponse.json({ success: false, message: "Failed to authenticate developer" }, { status: 500 });
  }
}
