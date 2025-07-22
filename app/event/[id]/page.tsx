"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PhoneInput } from "@/components/phone-input"
import {
  Gift,
  Heart,
  Calendar,
  PartyPopper,
  Sparkles,
  CreditCard,
  Smartphone,
  Copy,
  CheckCircle,
  Plus,
  Settings,
  Home,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"

const giftPackages = {
  KES: [
    { amount: 200, emoji: "☕", label: "Coffee Treat" },
    { amount: 500, emoji: "🍰", label: "Cake Slice" },
    { amount: 1000, emoji: "🎁", label: "Nice Gift" },
    { amount: 2000, emoji: "🎉", label: "Party Fund" },
    { amount: 5000, emoji: "💝", label: "Special Gift" },
    { amount: 10000, emoji: "🌟", label: "Amazing Gift" },
  ],
  USD: [
    { amount: 2, emoji: "☕", label: "Coffee Treat" },
    { amount: 5, emoji: "🍰", label: "Cake Slice" },
    { amount: 10, emoji: "🎁", label: "Nice Gift" },
    { amount: 25, emoji: "🎉", label: "Party Fund" },
    { amount: 50, emoji: "💝", label: "Special Gift" },
    { amount: 100, emoji: "🌟", label: "Amazing Gift" },
  ],
}

export default function EventPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isNewEvent = searchParams?.get("new") === "true"
  const [event, setEvent] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [giftMessage, setGiftMessage] = useState("")
  const [giftFrom, setGiftFrom] = useState("")
  const [giftEmail, setGiftEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventStatus, setEventStatus] = useState<"upcoming" | "today" | "past" | "expired" | "grace">("upcoming")
  const [daysUntilEvent, setDaysUntilEvent] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)

  // Image gallery states
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(false)

  // Calculate event status and expiry
  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/events/${params?.id}`)
        const data = await res.json()
        if (data.success) {
          setEvent(data.event)
          // Check if current user is the event owner (from localStorage for now)
          if (typeof window !== "undefined") {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
            setIsOwner(currentUser.username === data.event.createdBy)
          }
        // Calculate event status based on date
          const eventDate = new Date(data.event.date)
        const today = new Date()
        const todayStr = today.toDateString()
        const eventStr = eventDate.toDateString()
          // Add 1 day grace period
          const graceDate = new Date(eventDate)
          graceDate.setDate(graceDate.getDate() + 1)
          if (todayStr === eventStr) {
          setEventStatus("today")
          setDaysUntilEvent(0)
          } else if (today < eventDate) {
          setEventStatus("upcoming")
          const diffTime = eventDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          setDaysUntilEvent(diffDays)
          } else if (today > graceDate) {
            setEventStatus("expired")
            setDaysUntilEvent(-2) // more than 1 day after event
          } else {
            setEventStatus("grace") // 1 day after event
            setDaysUntilEvent(1)
          }
        } else {
          setEvent(null)
      }
    } catch (error) {
      console.error("Error loading event:", error)
        setEvent(null)
    } finally {
      setIsLoading(false)
    }
    }
    fetchEvent()
  }, [params?.id])

  const copyLink = () => {
    if (typeof window === "undefined") return
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // utility to safely parse JSON
  async function safeJson(res: Response) {
    try {
      const data = await res.clone().json()
      return { ok: true, data }
    } catch {
      const text = await res.text()
      return { ok: false, data: { success: false, message: text || "Unexpected non-JSON response" } }
    }
  }

  const handleGiftSubmit = async () => {
    if (!selectedPackage || !paymentMethod) return

    setIsProcessing(true)
    setPaymentStatus("Initiating payment...")

    try {
      if (paymentMethod === "mpesa") {
        setPaymentStatus("Sending STK Push to your phone...")

        // M-Pesa STK Push
        const response = await fetch("/api/payments/mpesa-stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: selectedPackage.amount,
            phoneNumber: phoneNumber,
            eventName: event.name,
            description: `Gift from ${giftFrom || "Anonymous"} for ${event.name}`,
          }),
        })

        const { ok: jsonOk, data } = await safeJson(response)

        if (!jsonOk && !response.ok) {
          throw new Error(data.message || "Payment service error")
        }

        if (data.success) {
          setPaymentStatus(
            data.isTestMode
              ? "⚠️ Test mode: Gift recorded successfully!"
              : "📱 STK Push sent! Check your phone and enter your M-Pesa PIN",
          )

          // Show phone formatting info if available
          if (data.phoneFormatted) {
            setPaymentStatus((prev) => prev + `\n📱 Phone: ${data.phoneFormatted}`)
          }

          updateEventWithGift("mpesa", "completed")
          setShowSuccess(true)
          setDialogOpen(false)
          resetForm()
          setTimeout(() => setShowSuccess(false), 5000)
        } else {
          throw new Error(data.message || "M-Pesa payment failed")
        }
      } else if (paymentMethod === "card") {
        setPaymentStatus("Initializing card payment...")

        // Paystack payment
        const response = await fetch("/api/payments/paystack-initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: selectedPackage.amount,
            email: giftEmail,
            eventName: event.name,
            currency: event.currency === "KES" ? "KES" : "USD",
            eventId: event.id,
            giftData: {
              from: giftFrom,
              message: giftMessage,
              amount: selectedPackage.amount,
            },
          }),
        })

        const { ok: jsonOk, data } = await safeJson(response)

        if (!jsonOk && !response.ok) {
          throw new Error(data.message || "Payment service error")
        }

        if (data.success && !data.isTestMode) {
          setPaymentStatus("🔄 Redirecting to payment page...")
          // Redirect to Paystack payment page
          window.location.href = data.data.authorization_url

          // For Paystack, money stays in Paystack balance until withdrawn
          updateEventWithGift("paystack", "pending_withdrawal")
          setShowSuccess(true)
          setDialogOpen(false)
          resetForm()
        } else if (data.isTestMode) {
          setPaymentStatus("⚠️ Test mode: Gift recorded successfully!")
          // In test mode, simulate the gift recording
          updateEventWithGift("paystack", "completed")
          setShowSuccess(true)
          setDialogOpen(false)
          resetForm()
          setTimeout(() => setShowSuccess(false), 5000)
        } else {
          throw new Error(data.message || "Card payment initialization failed")
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Payment failed. Please try again."
      setPaymentStatus(`❌ ${errorMessage}`)
      // Don't update gift count on error
      setTimeout(() => setPaymentStatus(""), 5000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Replace updateEventWithGift to use API
  const updateEventWithGift = async (method: string, status: string) => {
    if (!event) return
    try {
      const giftData = {
        from: giftFrom || "Anonymous",
        email: giftEmail,
        amount: selectedPackage.amount,
        currency: event.currency,
        message: giftMessage,
      }
      const res = await fetch("/api/events/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          giftData,
        paymentMethod: method,
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Refetch event to update UI
        const eventRes = await fetch(`/api/events/${event.id}`)
        const eventData = await eventRes.json()
        if (eventData.success) setEvent(eventData.event)
      }
    } catch (error) {
      console.error("Error updating event with gift:", error)
    }
  }

  const resetForm = () => {
    setSelectedPackage(null)
    setGiftMessage("")
    setGiftFrom("")
    setGiftEmail("")
    setPhoneNumber("")
    setPaymentMethod("")
    setPaymentStatus("")
  }

  // Image gallery functions
  const openImageGallery = (index: number) => {
    setSelectedImageIndex(index)
    setShowImageGallery(true)
  }

  const closeImageGallery = () => {
    setShowImageGallery(false)
    setSelectedImageIndex(null)
  }

  const nextImage = () => {
    if (event.images && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % event.images.length)
    }
  }

  const prevImage = () => {
    if (event.images && selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? event.images.length - 1 : selectedImageIndex - 1)
    }
  }

  // Prevent right-click context menu on images
  const handleImageContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Only show unavailable if event is cancelled or expired (more than 1 day after event date)
  if (!event || event.status !== "active" || eventStatus === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Unavailable or Expired</h1>
          <p className="text-gray-600 mb-4">This event is no longer available. It may have expired or been deleted by the creator.</p>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const getEventStatusMessage = () => {
    if (eventStatus === "today") {
      return `🎉 Today is ${event.name}!`
    } else if (eventStatus === "upcoming") {
      return `This day will be ${event.name} in ${daysUntilEvent} day${daysUntilEvent !== 1 ? "s" : ""}!`
    } else {
      return `${event.name} was ${Math.abs(daysUntilEvent)} day${Math.abs(daysUntilEvent) !== 1 ? "s" : ""} ago`
    }
  }

  const isDonationActive = eventStatus !== "past"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          {isOwner && (
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Event
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Gift sent successfully! 🎉
        </div>
      )}

      {/* Payment Status Notification */}
      {paymentStatus && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg text-center">
          <p className="font-semibold whitespace-pre-line">{paymentStatus}</p>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && selectedImageIndex !== null && event.images && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={closeImageGallery}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Previous button */}
            {event.images.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 text-white hover:bg-white/20 z-10"
                onClick={prevImage}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            <img
              src={event.images[selectedImageIndex] || "/placeholder.svg"}
              alt={`${event.name} photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              onContextMenu={handleImageContextMenu}
              onDragStart={(e) => e.preventDefault()}
              style={{ userSelect: "none", pointerEvents: "none" }}
            />

            {/* Next button */}
            {event.images.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 text-white hover:bg-white/20 z-10"
                onClick={nextImage}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {event.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Event Status Banner */}
      <div
        className={`p-4 text-center ${
          eventStatus === "today"
            ? "bg-gradient-to-r from-green-500 to-emerald-500"
            : eventStatus === "upcoming"
              ? "bg-gradient-to-r from-blue-500 to-purple-500"
              : "bg-gradient-to-r from-gray-500 to-gray-600"
        } text-white`}
      >
        <div className="flex items-center justify-center gap-2">
          {eventStatus === "today" && <PartyPopper className="h-5 w-5" />}
          {eventStatus === "upcoming" && <Clock className="h-5 w-5" />}
          {eventStatus === "past" && <AlertCircle className="h-5 w-5" />}
          <p className="font-semibold">{getEventStatusMessage()}</p>
        </div>
        {eventStatus === "past" && <p className="text-sm mt-1">Donations are no longer active for this event</p>}
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-8">
            <div className="animate-bounce mb-4">
              <PartyPopper className="h-12 w-12 text-yellow-500 mx-auto" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {getEventStatusMessage()}
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              {isDonationActive
                ? `Celebrate with ${event.creatorName} by sending a gift!`
                : `Thank you for celebrating with ${event.creatorName}!`}
            </p>
            <div className="flex items-center justify-center gap-4 text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {new Date(event.date).toLocaleDateString()}
              </div>
              <Badge variant="secondary">{event.type}</Badge>
            </div>
          </div>

          {/* Event Images with Gallery */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.images && event.images.length > 0 ? (
                event.images.map((image: string, index: number) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-xl shadow-lg group cursor-pointer"
                    onClick={() => openImageGallery(index)}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${event.name} photo ${index + 1}`}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                      onContextMenu={handleImageContextMenu}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ userSelect: "none" }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold">
                        Click to view full size
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex items-center justify-center h-64 bg-gray-100 rounded-xl">
                  <PartyPopper className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="max-w-2xl mx-auto text-center mb-8">
              <p className="text-lg text-gray-700 bg-white/50 backdrop-blur-sm rounded-lg p-6">{event.description}</p>
            </div>
          )}

          {/* Progress Bar */}
          {event.goal && (
            <div className="max-w-md mx-auto mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-2xl font-bold text-purple-600">
                      {event.currency} {(event.raised || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      raised of {event.currency} {event.goal.toLocaleString()} goal 🎯
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((event.raised || 0) / event.goal) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-sm text-gray-600">{event.giftCount || 0} people have contributed</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Share Button */}
          <div className="text-center mb-8">
            <Button onClick={copyLink} variant="outline" className="gap-2 bg-transparent">
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Link to Share"}
            </Button>
          </div>
        </div>
      </section>

      {/* Gift Packages - Only show if donations are active */}
      {isDonationActive && (
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Choose Your Gift</h2>
            <p className="text-gray-600">Select a gift package to celebrate with {event.creatorName}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto mb-8">
            {giftPackages[event.currency as keyof typeof giftPackages]?.map((pkg, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPackage?.amount === pkg.amount ? "ring-2 ring-purple-500 bg-purple-50" : ""
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="text-2xl sm:text-3xl mb-2">{pkg.emoji}</div>
                  <div className="text-sm sm:text-lg font-bold text-purple-600">
                    {event.currency} {pkg.amount}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">{pkg.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Dialog */}
          <div className="text-center">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                  disabled={!selectedPackage}
                >
                  <Gift className="mr-2 h-5 w-5" />
                  Send Gift {selectedPackage && `(${event.currency} ${selectedPackage.amount})`}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Send Your Gift</DialogTitle>
                  <DialogDescription>
                    Choose your payment method and complete your gift to {event.creatorName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pb-4">
                  {selectedPackage && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl mb-2">{selectedPackage.emoji}</div>
                      <div className="text-lg font-bold">
                        {event.currency} {selectedPackage.amount} - {selectedPackage.label}
                      </div>
                    </div>
                  )}

                  {/* Payment Configuration Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm font-semibold">Payment Setup Info</p>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Sandbox mode active. Real payments require production credentials.
                    </p>
                  </div>

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
                            M-Pesa (Direct to recipient)
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Credit/Debit Card (Via Paystack)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Name (Optional)</Label>
                    <Input
                      placeholder="Enter your name"
                      value={giftFrom}
                      onChange={(e) => setGiftFrom(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Your Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={giftEmail}
                      onChange={(e) => setGiftEmail(e.target.value)}
                      required
                    />
                  </div>

                  {paymentMethod === "mpesa" && (
                    <PhoneInput
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      label="Your M-Pesa Number"
                      placeholder="0708374149 (test) or your number"
                      required
                    />
                  )}

                  <div className="space-y-2">
                    <Label>Gift Message (Optional)</Label>
                    <Textarea
                      placeholder="Write a special message..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={handleGiftSubmit}
                    disabled={
                      !paymentMethod || !giftEmail || isProcessing || (paymentMethod === "mpesa" && !phoneNumber)
                    }
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Gift className="mr-2 h-4 w-4" />
                        Complete Gift Payment
                      </div>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      )}

      {/* Create Your Own Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Want Your Own Celebration Page?</h2>
            <p className="text-gray-600 mb-8">
              Create your own event page and start receiving gifts from friends and family
            </p>
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
              >
                <Plus className="mr-2 h-5 w-5" />✨ Create Yours Here!
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="h-6 w-6" />
            <span className="text-xl font-bold">CelebrateWith.me</span>
          </div>
          <p className="text-gray-400 mb-4">Making celebrations more meaningful, one gift at a time</p>
          <Link href="/support-developer">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              <Heart className="h-4 w-4" />💖 Support the Developer
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  )
}
