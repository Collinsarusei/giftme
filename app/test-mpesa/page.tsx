"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertTriangle, Smartphone, ArrowLeft, TestTube } from "lucide-react"
import Link from "next/link"

export default function TestMpesaPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [amount, setAmount] = useState("10")
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string>("")
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null)

  const testMpesaSTK = async () => {
    if (!phoneNumber || !amount) {
      alert("Please enter phone number and amount")
      return
    }

    setIsTesting(true)
    setTestResult("Testing M-Pesa STK Push...")

    try {
      const response = await fetch("/api/payments/mpesa-stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseInt(amount),
          phoneNumber: phoneNumber,
          eventName: "Test Event",
          description: "Test STK Push",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult(`✅ ${data.message}`)
        setTestSuccess(true)

        if (data.guidance) {
          setTestResult((prev) => prev + `\n\n💡 ${data.guidance}`)
        }
      } else {
        setTestResult(`❌ ${data.message}`)
        setTestSuccess(false)
      }
    } catch (error) {
      setTestResult(`❌ Test failed: ${error}`)
      setTestSuccess(false)
    } finally {
      setIsTesting(false)
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
            Test M-Pesa STK Push
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Test Instructions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                M-Pesa STK Push Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Testing Guidelines:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • <strong>254708374149</strong> - Official test number (always works in sandbox)
                  </li>
                  <li>
                    • <strong>Your Safaricom number</strong> - May work but sandbox is unreliable
                  </li>
                  <li>
                    • <strong>Non-Safaricom numbers</strong> - Will not work in sandbox
                  </li>
                  <li>
                    • <strong>Invalid Access Token</strong> - Common sandbox issue, app handles gracefully
                  </li>
                </ul>
              </div>

              {/* Test Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="254708374149 or 254743299688"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Use 254708374149 for guaranteed testing, or try your own Safaricom number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <Button
                  onClick={testMpesaSTK}
                  disabled={isTesting || !phoneNumber || !amount}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testing STK Push...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Test STK Push
                    </>
                  )}
                </Button>
              </div>

              {/* Test Results */}
              {testResult && (
                <div
                  className={`p-4 rounded-lg whitespace-pre-line ${
                    testSuccess
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : testSuccess === false
                        ? "bg-red-50 border border-red-200 text-red-800"
                        : "bg-blue-50 border border-blue-200 text-blue-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testSuccess ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : testSuccess === false ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <TestTube className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm">{testResult}</div>
                  </div>
                </div>
              )}

              {/* Troubleshooting */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Why Your Number Might Not Work:</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Common Issues:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>
                      • <strong>Invalid Access Token</strong> - Sandbox API is unstable
                    </li>
                    <li>
                      • <strong>Number not registered</strong> - Your number may not be linked to the test shortcode
                    </li>
                    <li>
                      • <strong>Network issues</strong> - Safaricom sandbox has frequent downtime
                    </li>
                    <li>
                      • <strong>Rate limiting</strong> - Too many requests in short time
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Solutions:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>
                      • <strong>Use 254708374149</strong> - Official test number always works
                    </li>
                    <li>
                      • <strong>Try multiple times</strong> - Sandbox is inconsistent
                    </li>
                    <li>
                      • <strong>Check phone signal</strong> - Ensure good network connection
                    </li>
                    <li>
                      • <strong>Wait between tests</strong> - Avoid rate limiting
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">For Production:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Get your own credentials from developer.safaricom.co.ke</li>
                    <li>• Use production API endpoints</li>
                    <li>• Register your callback URLs properly</li>
                    <li>• Your real number will work with your own credentials</li>
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
