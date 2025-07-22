import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userService"

export async function POST(request: NextRequest) {
  try {
    const { username, email, profile } = await request.json()

    if (!username || !email) {
      return NextResponse.json({ success: false, message: "Username and email are required" }, { status: 400 })
    }

    // Validate email format
    if (!email.includes("@")) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 })
    }

    const user = await UserService.createUser({
      username,
      email,
      profile,
    })

    // Remove sensitive data before sending to client
    const { _id, ...userResponse } = user

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
      })
    } catch (emailError) {
      console.error("Welcome email failed:", emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful! Welcome to CelebrateWith.me!",
      user: userResponse,
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof Error) {
      if (error.message.includes("Username already exists")) {
        return NextResponse.json(
          { success: false, message: "Username already exists. Please choose a different one." },
          { status: 409 },
        )
      }
      if (error.message.includes("Email already exists")) {
        return NextResponse.json(
          { success: false, message: "Email already exists. Please use a different email or login." },
          { status: 409 },
        )
      }
    }

    return NextResponse.json({ success: false, message: "Registration failed. Please try again." }, { status: 500 })
  }
}
