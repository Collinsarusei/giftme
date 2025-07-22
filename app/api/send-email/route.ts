import { type NextRequest, NextResponse } from "next/server"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_DOMAIN = process.env.RESEND_DOMAIN || "celebratewith.me"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable")
    }

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `CelebrateWith.me <noreply@${RESEND_DOMAIN}>`,
        to,
        subject,
        html: `<div>${message}</div>`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Resend API error: ${errorText}`)
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 })
  }
}
