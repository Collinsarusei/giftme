import { type NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/userService";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required." }, { status: 400 });
    }

    await getDatabase(); // Ensure DB connection

    // Verify the OTP using the UserService method
    const user = await UserService.verifyUserOtp(email, otp);

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP." }, { status: 401 });
    }

    // If OTP is valid, proceed with login (create and set JWT token)
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    const cookie = serialize("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60,
      path: "/",
    });

    // Remove sensitive data (like _id) before sending to client
    const { _id, ...userResponse } = user;

    return new NextResponse(JSON.stringify({
      success: true,
      message: "Login successful!",
      user: userResponse,
    }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ success: false, message: "OTP verification failed. Please try again." }, { status: 500 });
  }
}
