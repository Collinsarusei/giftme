import { type NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/userService";
import { getDatabase } from "@/lib/mongodb"; // Import getDatabase
import nodemailer from "nodemailer"; // Import nodemailer

// Removed crypto import as we'll use Math.random for numeric OTP

const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
const EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT;
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, message: "Username/email and password are required" }, { status: 400 });
    }

    await getDatabase(); // Ensure DB connection

    const user = await UserService.verifyUserCredentials(identifier, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please check your username/email and password." },
        { status: 401 },
      );
    }

    // Generate a 6-digit NUMERIC OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
    const otpExpires = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

    // Update user with OTP and expiry
    if (user._id) { // Ensure _id is present for database operations
      await UserService.updateUserOtp(user._id, otp, otpExpires);
    } else {
        // This case should ideally not happen if verifyUserCredentials returns a valid user
        return NextResponse.json({ success: false, message: "User found but missing _id. Cannot set OTP." }, { status: 500 });
    }

    // Send OTP to user's email
    const transporter = nodemailer.createTransport({
      host: EMAIL_SERVER_HOST,
      port: parseInt(EMAIL_SERVER_PORT || "465"),
      secure: true,
      auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: EMAIL_SERVER_USER,
      subject: "Your OTP for Login",
      html: `
        <p>Dear ${user.username},</p>
        <p>Your One-Time Password (OTP) for logging into CelebrateWith.me is:</p>
        <h3><b>${otp}</b></h3>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email. Please verify to complete login.",
      otpRequired: true, // Indicate to the frontend that OTP is required
      email: user.email, // Send email back to frontend for OTP verification step
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "Login failed. Please try again." }, { status: 500 });
  }
}
