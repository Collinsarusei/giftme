"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, CreditCard, Loader2 } from "lucide-react"

interface PaymentIntegrationProps {
  amount: number
  currency: string
  eventName: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function PaymentIntegration({ amount, currency, eventName, onSuccess, onError }: PaymentIntegrationProps) {
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  })

  const handleMpesaPayment = async () => {
    setIsProcessing(true)
    try {
      // Simulate Daraja API integration
      const response = await fetch("/api/payments/mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          phoneNumber,
          eventName,
          // In real implementation, include other required Daraja parameters
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        throw new Error("Payment failed")
      }
    } catch (error) {
      onError("M-Pesa payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardPayment = async () => {
    setIsProcessing(true)
    try {
      // Simple mock payment without Stripe
      await new Promise((resolve) => setTimeout(resolve, 2000))
      onSuccess()
    } catch (error) {
      onError("Card payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!paymentMethod) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Choose Payment Method</h3>
        <div className="grid grid-cols-1 gap-3">
          {currency === "KES" && (
            <Button
              variant="outline"
              className="h-16 flex items-center justify-center gap-3 bg-transparent"
              onClick={() => setPaymentMethod("mpesa")}
            >
              <Smartphone className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">M-Pesa</div>
                <div className="text-sm text-gray-600">Pay with your phone</div>
              </div>
            </Button>
          )}
          <Button
            variant="outline"
            className="h-16 flex items-center justify-center gap-3 bg-transparent"
            onClick={() => setPaymentMethod("card")}
          >
            <CreditCard className="h-6 w-6 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold">Card Payment</div>
              <div className="text-sm text-gray-600">Visa, Mastercard, etc.</div>
            </div>
          </Button>
        </div>
      </div>
    )
  }

  if (paymentMethod === "mpesa") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            M-Pesa Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="font-semibold">Amount: KES {amount}</p>
            <p className="text-sm text-gray-600">for {eventName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">M-Pesa Phone Number</Label>
            <Input
              id="phone"
              placeholder="254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleMpesaPayment}
              disabled={!phoneNumber || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Send M-Pesa Prompt"
              )}
            </Button>
            <Button variant="outline" onClick={() => setPaymentMethod(null)}>
              Back
            </Button>
          </div>

          {isProcessing && (
            <div className="text-center text-sm text-gray-600 p-4 bg-yellow-50 rounded-lg">
              Please check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (paymentMethod === "card") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Card Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold">
              Amount: {currency} {amount}
            </p>
            <p className="text-sm text-gray-600">for {eventName}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) => setCardDetails((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails((prev) => ({ ...prev, number: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails((prev) => ({ ...prev, expiry: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails((prev) => ({ ...prev, cvv: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleCardPayment}
              disabled={
                !cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || isProcessing
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${currency} ${amount}`
              )}
            </Button>
            <Button variant="outline" onClick={() => setPaymentMethod(null)}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
