import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { UserService } from "@/lib/services/userService"
import crypto from "crypto"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  const { email } = await req.json()

  try {
    // Connect to the database by simply calling getDatabase, which ensures the connection is established
    await getDatabase()

    const user = await UserService.findUserByEmail(email)

    if (!user) {
      // Even if no user is found, we send a success message to prevent email enumeration
      return NextResponse.json({ message: "If an account with that email exists, a password reset link has been sent." }, { status: 200 })
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = Date.now() + 3600000 // 1 hour from now

    // Update user with reset token and expiry
    if (user._id) {
      await UserService.updateUserResetToken(user._id, resetToken, resetTokenExpires)
    } else {
      // This case should ideally not happen if findUserByEmail returns a valid user
      return NextResponse.json({ message: "User found but missing _id. Cannot set reset token." }, { status: 500 })
    }

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "465"), // Use parseInt for port
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_SERVER_USER, // Use the configured sender email
      subject: "Password Reset Request",
      html: `
        <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: "If an account with that email exists, a password reset link has been sent." }, { status: 200 })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "An error occurred. Please try again." }, { status: 500 })
  }
}
