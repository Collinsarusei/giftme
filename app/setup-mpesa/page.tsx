"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SetupMpesaPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<string>("")
  const [isRegistered, setIsRegistered] = useState(false)

  const registerUrls = async () => {
    setIsRegistering(true)
    setRegistrationStatus("Registering callback URLs with Safaricom...")

    try {
      const response = await fetch("/api/payments/mpesa-register-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (data.success) {
        setRegistrationStatus("✅ URLs registered successfully!")
        setIsRegistered(true)
      } else {
        setRegistrationStatus(`❌ Registration failed: ${data.message}`)
      }
    } catch (error) {
      setRegistrationStatus("❌ Registration failed. Please try again.")
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            M-Pesa Setup
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Setup Instructions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                M-Pesa Integration Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="font-semibold">Important Setup Steps</p>
                </div>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>To use M-Pesa payments, you need to complete these steps:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Register your callback URLs with Safaricom (use button below)</li>
                    <li>Ensure your environment variables are correctly set</li>
                    <li>Test with the official test number: 254708374149</li>
                  </ol>
                </div>
              </div>

              {/* Environment Variables Check */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Environment Variables Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">MPESA_CONSUMER_KEY</span>
                      <Badge variant={process.env.MPESA_CONSUMER_KEY ? "default" : "destructive"}>
                        {process.env.MPESA_CONSUMER_KEY ? "Set" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">MPESA_CONSUMER_SECRET</span>
                      <Badge variant={process.env.MPESA_CONSUMER_SECRET ? "default" : "destructive"}>
                        {process.env.MPESA_CONSUMER_SECRET ? "Set" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">MPESA_SHORTCODE</span>
                      <Badge variant={process.env.MPESA_SHORTCODE ? "default" : "destructive"}>
                        {process.env.MPESA_SHORTCODE ? "Set" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">MPESA_PASSKEY</span>
                      <Badge variant={process.env.MPESA_PASSKEY ? "default" : "destructive"}>
                        {process.env.MPESA_PASSKEY ? "Set" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Registration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Callback URL Registration</h3>
                <p className="text-sm text-gray-600">
                  Before M-Pesa STK Push can work, you need to register your callback URLs with Safaricom.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">URLs that will be registered:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • <strong>Confirmation URL:</strong>{" "}
                      {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}
                      /api/payments/mpesa-confirmation
                    </li>
                    <li>
                      • <strong>Validation URL:</strong>{" "}
                      {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}
                      /api/payments/mpesa-validation
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={registerUrls}
                  disabled={isRegistering}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isRegistering ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering URLs...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Register Callback URLs
                    </>
                  )}
                </Button>

                {registrationStatus && (
                  <div
                    className={`p-4 rounded-lg ${
                      isRegistered
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isRegistered ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      <p className="font-semibold">{registrationStatus}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Testing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Testing Information</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Sandbox Test Numbers:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>
                      • <strong>254708374149</strong> - Official Safaricom test number (recommended)
                    </li>
                    <li>• Your own Safaricom number - Should work if it's a valid Safaricom line</li>
                  </ul>
                  <p className="text-xs text-green-600 mt-2">
                    Note: Sandbox environment can be unreliable. The app will fall back to test mode if needed.
                  </p>
                </div>
              </div>

              {/* ngrok Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Do I Need ngrok?</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Short Answer: NO (for basic testing)</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>
                      <strong>Without ngrok:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>✅ STK Push works (payment prompts sent)</li>
                      <li>✅ Payments recorded in your app</li>
                      <li>❌ Real callbacks won't reach localhost</li>
                      <li>✅ App gracefully falls back to test mode</li>
                    </ul>
                    <p className="mt-2">
                      <strong>With ngrok (advanced):</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>✅ Real callbacks from Safaricom</li>
                      <li>✅ Complete production-like testing</li>
                      <li>⚠️ Requires additional setup</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    <strong>Recommendation:</strong> Start without ngrok. The app will work fine for testing and
                    development. Only use ngrok if you need to test the complete callback flow.
                  </p>
                </div>
              </div>

              {/* Production Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Production Deployment</h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">For Production:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Get production credentials from developer.safaricom.co.ke</li>
                    <li>• Change API endpoints from sandbox to production</li>
                    <li>• Re-register URLs with production credentials</li>
                    <li>• Test thoroughly with real transactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
