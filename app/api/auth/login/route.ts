import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userService"

export async function POST(request: NextRequest) {
  try {
    const { username, email } = await request.json()

    if (!username || !email) {
      return NextResponse.json({ success: false, message: "Username and email are required" }, { status: 400 })
    }

    const user = await UserService.getUserByCredentials(username, email)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found. Please check your credentials or register first." },
        { status: 404 },
      )
    }

    // Remove sensitive data before sending to client
    const { _id, ...userResponse } = user

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userResponse,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Login failed. Please try again." }, { status: 500 })
  }
}
