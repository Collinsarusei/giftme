import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    const emailHost = process.env.EMAIL_SERVER_HOST;
    const emailPort = process.env.EMAIL_SERVER_PORT;
    const emailUser = process.env.EMAIL_SERVER_USER;
    const emailPassword = process.env.EMAIL_SERVER_PASSWORD;

    if (!emailHost || !emailPort || !emailUser || !emailPassword) {
      throw new Error("Missing one or more Nodemailer environment variables (EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD)");
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort), // Ensure port is a number
      secure: true, // Use TLS, true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    const mailOptions = {
      from: emailUser,
      to,
      subject,
      html: `<div>${message}</div>`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 });
  }
}
