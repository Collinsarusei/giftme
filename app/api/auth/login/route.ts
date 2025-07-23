import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/userService"

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json()

    if (!identifier || !password) {
      return NextResponse.json({ success: false, message: "Username/email and password are required" }, { status: 400 })
    }

    const user = await UserService.verifyUserCredentials(identifier, password)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please check your username/email and password." },
        { status: 401 },
      )
    }

    // Remove sensitive data before sending to client
    const { _id, password: _pw, ...userResponse } = user

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
