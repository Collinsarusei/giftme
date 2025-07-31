import { type NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/userService";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // Use environment variable in production

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, message: "Username/email and password are required" }, { status: 400 });
    }

    const user = await UserService.verifyUserCredentials(identifier, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please check your username/email and password." },
        { status: 401 },
      );
    }

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

    // Remove sensitive data before sending to client (though client won't directly access user object anymore)
    const { _id, password: _pw, ...userResponse } = user;

    return new NextResponse(JSON.stringify({
      success: true,
      message: "Login successful",
      user: userResponse, // Still send user data for initial client-side setup if needed, but not for persistence
    }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "Login failed. Please try again." }, { status: 500 });
  }
}
