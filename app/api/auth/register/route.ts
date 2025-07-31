import { type NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/userService";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // Use environment variable in production

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, profile } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, message: "Username, email, and password are required" }, { status: 400 });
    }

    // Validate email format
    if (!email.includes("@")) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 });
    }

    const user = await UserService.createUser({
      username,
      email,
      password,
      profile,
    });

    // Create a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Set the token as an HTTP-only cookie
    const cookie = serialize("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production (HTTPS)
      sameSite: "strict", // CSRF protection
      maxAge: 60 * 60, // 1 hour
      path: "/", // Available across the whole site
    });

    // Remove sensitive data before sending to client
    const { _id, ...userResponse } = user;

    // Send welcome email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Welcome to CelebrateWith.me! 🎉",
          message: `Hi ${username}! Welcome to CelebrateWith.me. You can now create beautiful event pages and receive gifts from friends and family. Good luck with your celebrations!`,
        }),
      });
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
      // Don't fail registration if email fails
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: "Registration successful! Welcome to CelebrateWith.me!",
      user: userResponse, // Still send user data for initial client-side setup if needed, but not for persistence
    }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Username already exists")) {
        return NextResponse.json(
          { success: false, message: "Username already exists. Please choose a different one." },
          { status: 409 },
        );
      }
      if (error.message.includes("Email already exists")) {
        return NextResponse.json(
          { success: false, message: "Email already exists. Please use a different email or login." },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({ success: false, message: "Registration failed. Please try again." }, { status: 500 });
  }
}
