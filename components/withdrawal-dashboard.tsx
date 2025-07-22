"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Download, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WithdrawalDashboardProps {
  paystackGifts: any[]
  onWithdraw: (giftId: string) => void
  isWithdrawing: string
}

export function WithdrawalDashboard({ paystackGifts, onWithdraw, isWithdrawing }: WithdrawalDashboardProps) {
  const [showFeeInfo, setShowFeeInfo] = useState(false)

  const calculateFee = (amount: number, currency = "NGN") => {
    if (currency === "NGN") {
      if (amount <= 5000) return 10
      if (amount <= 50000) return 25
      return 50
    }
    return Math.max(amount * 0.015, 1)
  }

  const totalWithdrawable = paystackGifts.reduce((sum, gift) => sum + gift.amount, 0)
  const totalFees = paystackGifts.reduce((sum, gift) => sum + calculateFee(gift.amount, gift.currency), 0)
  const netAmount = totalWithdrawable - totalFees

  if (paystackGifts.length === 0) return null

  return (
    <div className="mb-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Download className="h-5 w-5" />
            Paystack Withdrawals Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sandbox Warning */}
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>Sandbox Mode Active:</strong> Real withdrawals require production Paystack credentials and
              verified recipient accounts.
            </AlertDescription>
          </Alert>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Total Available</p>
              <p className="text-lg font-bold text-green-600">₦{totalWithdrawable.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Transfer Fees</p>
              <p className="text-lg font-bold text-red-600">₦{totalFees.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Net Amount</p>
              <p className="text-lg font-bold text-blue-600">₦{netAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Fee Information */}
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={() => setShowFeeInfo(!showFeeInfo)} className="gap-2">
              <Info className="h-4 w-4" />
              {showFeeInfo ? "Hide" : "Show"} Fee Structure
            </Button>

            {showFeeInfo && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-semibold text-blue-800 mb-2">Paystack Transfer Fees (NGN):</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• ≤ ₦5,000: ₦10 flat fee</li>
                  <li>• ₦5,001 - ₦50,000: ₦25 flat fee</li>
                  <li>• &gt; ₦50,000: ₦50 flat fee</li>
                  <li>• Other currencies: 1.5% (min 1 unit)</li>
                </ul>
              </div>
            )}
          </div>

          {/* Individual Gifts */}
          <div className="space-y-3">
            <p className="text-sm text-orange-700 mb-4">
              You have {paystackGifts.length} gift(s) ready for withdrawal:
            </p>

            {paystackGifts.map((gift) => {
              const fee = calculateFee(gift.amount, gift.currency)
              const net = gift.amount - fee

              return (
                <div key={gift.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{gift.from}</p>
                      <Badge variant="outline">₦{gift.amount.toLocaleString()}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        Fee: ₦{fee} | Net: ₦{net}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">From: {gift.eventName}</p>
                    <p className="text-xs text-gray-500">{new Date(gift.timestamp).toLocaleDateString()}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onWithdraw(gift.id)}
                    disabled={isWithdrawing === gift.id || net <= 0}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isWithdrawing === gift.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Withdraw ₦{net}
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Bulk Withdrawal */}
          {paystackGifts.length > 1 && (
            <div className="mt-4 pt-4 border-t border-orange-200">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isWithdrawing !== "" || netAmount <= 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Withdraw All (₦{netAmount.toLocaleString()} after fees)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
