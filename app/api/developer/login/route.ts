import { type NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/eventService";
import { UserService } from "@/lib/services/userService";
import { DeveloperGiftService } from "@/lib/services/developerGiftService"; // Assuming you'll create this service
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const DEVELOPER_PASSWORD_HASH = process.env.DEVELOPER_PASSWORD_HASH; // Store hashed password in env
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!DEVELOPER_PASSWORD_HASH) {
        console.error("DEVELOPER_PASSWORD_HASH is not set in environment variables.");
        return NextResponse.json({ success: false, message: "Server configuration error." }, { status: 500 });
    }

    const isMatch = await bcrypt.compare(password, DEVELOPER_PASSWORD_HASH);

    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid developer password" }, { status: 401 });
    }

    // Create a JWT token for developer access
    const token = jwt.sign(
      { role: "developer" },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    const cookie = serialize("dev_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return new NextResponse(JSON.stringify({ success: true, message: "Developer login successful" }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Developer login error:", error);
    return NextResponse.json({ success: false, message: "Developer login failed." }, { status: 500 });
  }
}
