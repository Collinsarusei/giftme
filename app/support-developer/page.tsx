"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Coffee, Gift, Sparkles, ArrowLeft, Smartphone, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"

const supportPackages = [
  { amount: 100, currency: "KES", emoji: "☕", label: "Buy me a coffee", description: "Support with a small tip" },
  { amount: 500, currency: "KES", emoji: "🍕", label: "Buy me lunch", description: "Help fuel development" },
  { amount: 1000, currency: "KES", emoji: "🎁", label: "Nice gesture", description: "Show your appreciation" },
  { amount: 2500, currency: "KES", emoji: "💝", label: "Generous support", description: "Really help the project" },
  { amount: 5000, currency: "KES", emoji: "🌟", label: "Amazing support", description: "Make a big difference" },
]

export default function SupportDeveloperPage() {
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [supporterName, setSupporterName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [mpesaNumber, setMpesaNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSupportPayment = async () => {
    if (!selectedPackage || !paymentMethod) return

    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Save developer gift (in production, this would go to your account)
      const developerGift = {
        id: Date.now().toString(),
        from: supporterName || "Anonymous Supporter",
        amount: selectedPackage.amount,
        currency: "KES",
        message: supportMessage,
        timestamp: new Date().toISOString(),
        paymentMethod,
        type: "developer_support",
      }

      // Store developer gifts separately
      const developerGifts = JSON.parse(localStorage.getItem("developerGifts") || "[]")
      developerGifts.push(developerGift)
      localStorage.setItem("developerGifts", JSON.stringify(developerGifts))

      alert("Thank you so much for your support! 🙏❤️ Your contribution helps keep CelebrateWith.me running!")

      // Reset form
      setSelectedPackage(null)
      setCustomAmount("")
      setSupportMessage("")
      setSupporterName("")
      setPaymentMethod("")
      setMpesaNumber("")
    } catch (error) {
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            💖 Support the Developer
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="animate-bounce mb-6">
              <Heart className="h-16 w-16 text-red-500 mx-auto" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Help Keep CelebrateWith.me Running
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your support helps maintain the platform, add new features, and keep the service free for everyone. Every
              contribution, no matter how small, makes a difference! 🙏
            </p>
          </div>

          {/* Support Packages */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center mb-6">Choose Your Support Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {supportPackages.map((pkg, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedPackage?.amount === pkg.amount ? "ring-2 ring-purple-500 bg-purple-50" : ""
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{pkg.emoji}</div>
                    <div className="text-lg font-bold text-purple-600 mb-1">KES {pkg.amount}</div>
                    <div className="text-sm font-semibold mb-1">{pkg.label}</div>
                    <div className="text-xs text-gray-600">{pkg.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Or Enter Custom Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customAmount">Custom Amount (KES)</Label>
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    if (e.target.value) {
                      setSelectedPackage({
                        amount: Number.parseInt(e.target.value),
                        currency: "KES",
                        emoji: "💖",
                        label: "Custom Support",
                      })
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Support Message */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Leave a Message (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supporterName">Your Name (Optional)</Label>
                <Input
                  id="supporterName"
                  placeholder="Enter your name"
                  value={supporterName}
                  onChange={(e) => setSupporterName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportMessage">Message</Label>
                <Textarea
                  id="supportMessage"
                  placeholder="Leave a kind message for the developer..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Dialog */}
          <div className="text-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                  disabled={!selectedPackage}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Support with KES {selectedPackage?.amount || 0}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Support the Developer</DialogTitle>
                  <DialogDescription>
                    Choose your payment method to support the development of CelebrateWith.me
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedPackage && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl mb-2">{selectedPackage.emoji}</div>
                      <div className="text-lg font-bold">
                        KES {selectedPackage.amount} - {selectedPackage.label}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            M-Pesa
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Credit/Debit Card
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === "mpesa" && (
                    <div className="space-y-2">
                      <Label>M-Pesa Number</Label>
                      <Input
                        placeholder="254712345678"
                        value={mpesaNumber}
                        onChange={(e) => setMpesaNumber(e.target.value)}
                      />
                    </div>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={handleSupportPayment}
                    disabled={!paymentMethod || isProcessing || (paymentMethod === "mpesa" && !mpesaNumber)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Send Support
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Why Support Section */}
          <div className="mt-16 bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Why Your Support Matters</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">New Features</h3>
                <p className="text-gray-600">Help fund development of exciting new features and improvements</p>
              </div>
              <div className="text-center">
                <Gift className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keep it Free</h3>
                <p className="text-gray-600">Your support helps keep the platform free for everyone to use</p>
              </div>
              <div className="text-center">
                <Coffee className="h-12 w-12 text-brown-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fuel Development</h3>
                <p className="text-gray-600">Buy the developer coffee and snacks to keep coding through the night</p>
              </div>
            </div>
          </div>

          {/* Developer Dashboard Info */}
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">For the Developer</h3>
            <p className="text-gray-600 mb-4">
              As the developer, you can track your support gifts by checking localStorage for 'developerGifts'. In
              production, implement a proper admin dashboard to view and withdraw your support funds.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const gifts = JSON.parse(localStorage.getItem("developerGifts") || "[]")
                const total = gifts.reduce((sum: number, gift: any) => sum + gift.amount, 0)
                alert(`Total developer support received: KES ${total.toLocaleString()}`)
              }}
            >
              Check Developer Gifts
            </Button>
          </div>

          {/* Thank You Section */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Thank You! 🙏</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every contribution, whether big or small, is deeply appreciated. Your support motivates me to keep
              improving CelebrateWith.me and building features that help people celebrate life's special moments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
