"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Gift, Link as LinkIcon, ShieldCheck, TrendingUp } from "lucide-react"

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            About CelebrateWith.me
          </h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold mb-2">Simplify Your Celebrations</CardTitle>
              <p className="text-gray-600">Making gift collection seamless, secure, and stylish.</p>
            </CardHeader>
            <CardContent className="space-y-6 text-lg text-gray-800 leading-relaxed">
              <p>
                At <strong>CelebrateWith.me</strong>, we believe every special occasion deserves to be celebrated without the hassle. We provide a modern, elegant, and secure platform for individuals to easily collect monetary gifts for birthdays, weddings, graduations, baby showers, and any other milestone worth commemorating.
              </p>
              <p>
                Gone are the days of sharing personal M-Pesa numbers or bank details individually with every guest. Our service allows you to create a personalized event page, share a single, convenient link, and let your friends and family contribute directly and securely. This not only streamlines the gifting process for your guests but also offers you a clear overview of all contributions in one place.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Why Choose CelebrateWith.me?</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-center">
              <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
                <LinkIcon className="h-12 w-12 text-purple-600 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Effortless Sharing</h3>
                <p className="text-gray-700">
                  Share one elegant link across all your invitations, social media, and direct messages. No more scattered payment details.
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-pink-50 rounded-lg">
                <ShieldCheck className="h-12 w-12 text-pink-600 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
                <p className="text-gray-700">
                  All contributions are processed securely through trusted payment gateways, ensuring peace of mind for both you and your guests.
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
                <TrendingUp className="h-12 w-12 text-yellow-600 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Track Your Gifts</h3>
                <p className="text-gray-700">
                  Our intuitive dashboard allows you to see all gifts received in real-time, helping you manage your celebration finances with ease.
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg">
                <Gift className="h-12 w-12 text-indigo-600 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Focus on Celebrating</h3>
                <p className="text-gray-700">
                  By simplifying gift collection, we free you up to focus on what truly matters: enjoying your special moments with loved ones.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
