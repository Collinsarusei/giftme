import { type NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(request: NextRequest) {
  try {
    // Clear the developer authentication cookie by setting it to expire immediately
    const cookie = serialize("dev_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Set maxAge to 0 to expire the cookie immediately
      path: "/",
    });

    return new NextResponse(JSON.stringify({ success: true, message: "Developer logged out successfully" }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Developer logout error:", error);
    return NextResponse.json({ success: false, message: "Developer logout failed. Please try again." }, { status: 500 });
  }
}
