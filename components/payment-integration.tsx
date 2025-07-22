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
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  })

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
          </div>
        </CardContent>
      </Card>
    )
}
