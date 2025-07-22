import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "CelebrateWith.me - Turn Every Celebration Into a Gift-Giving Experience",
  description:
    "Create beautiful event pages for birthdays, graduations, weddings, and more. Let friends and family celebrate with you by sending monetary gifts via M-Pesa or card payments.",
  keywords: "events, celebrations, gifts, m-pesa, payments, birthdays, weddings",
  authors: [{ name: "CelebrateWith.me" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="frame-src 'self' https://checkout.paystack.com https://js.paystack.co https://*.paystack.com http://localhost:* https://*.vusercontent.net/ https://*.lite.vusercontent.net/ https://generated.vusercontent.net/ https://*.vercel.run/ https://vercel.live/ https://vercel.com https://vercel.fides-cdn.ethyca.com/ https://js.stripe.com/ https://*.accounts.dev https://api.stack-auth.com/api/v1/auth/oauth/*;"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
