"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Phone } from "lucide-react"

export default function ContactUsPage() {
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
            Contact Us
          </h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold mb-2">Get in Touch</CardTitle>
              <p className="text-gray-600">We're here to help and answer any question you might have.</p>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="flex flex-col items-center">
                <Mail className="h-10 w-10 text-purple-600 mb-2" />
                <h3 className="text-xl font-semibold">Email Us</h3>
                <p className="text-gray-700">For general inquiries and support, send us an email.</p>
                <a 
                  href="mailto:gift.celebrate.me@gmail.com"
                  className="text-purple-600 hover:underline font-medium mt-1"
                >
                  gift.celebrate.me@gmail.com
                </a>
              </div>

              <div className="flex flex-col items-center">
                <Phone className="h-10 w-10 text-pink-600 mb-2" />
                <h3 className="text-xl font-semibold">WhatsApp Us</h3>
                <p className="text-gray-700">Connect with us directly on WhatsApp for quick assistance.</p>
                <a 
                  href="https://wa.me/254743299688"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:underline font-medium mt-1"
                >
                  +254 743 299 688
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer can go here if it's not a shared component across all pages */}
    </div>
  )
}
