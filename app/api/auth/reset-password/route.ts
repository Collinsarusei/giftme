import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { UserService } from "@/lib/services/userService"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { token, newPassword } = await req.json()

  try {
    // Connect to the database by simply calling getDatabase, which ensures the connection is established
    await getDatabase()

    const user = await UserService.findUserByResetToken(token, Date.now())

    if (!user) {
      return NextResponse.json({ message: "Password reset token is invalid or has expired." }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user's password and clear the reset token fields
    if (user._id) {
      await UserService.updateUserPasswordAndClearToken(user._id, hashedPassword)
    } else {
      // This case should ideally not happen if findUserByResetToken returns a valid user
      return NextResponse.json({ message: "User found but missing _id. Cannot reset password." }, { status: 500 })
    }

    return NextResponse.json({ message: "Password has been reset successfully." }, { status: 200 })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ message: "An error occurred. Please try again." }, { status: 500 })
  }
}
