// app/event/[id]/page.tsx
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Gift,
  Calendar,
  PartyPopper,
  Copy,
  CheckCircle,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Plus,
  Heart,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from "@/components/ui/social-icons"

const giftPackages = {
    KES: [
      { amount: 100, emoji: "👍", label: "Nice One" },
      { amount: 200, emoji: "☕", label: "Coffee Treat" },
      { amount: 500, emoji: "🍰", label: "Cake Slice" },
      { amount: 1000, emoji: "🎁", label: "Nice Gift" },
      { amount: 2000, emoji: "🎉", label: "Party Fund" },
      { amount: 5000, emoji: "💝", label: "Special Gift" },
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
  
  const ShareButtons = ({ eventLink, eventName }: { eventLink: string; eventName: string }) => {
      const text = `Celebrate with me for my ${eventName}! Check out the event and send a gift here: ${eventLink}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventLink)}`;
      const instagramUrl = `https://www.instagram.com`;
  
      return (
        <div className="flex items-center justify-center gap-4 my-4">
          <Button variant="outline" size="icon" asChild className="bg-green-500 text-white hover:bg-green-600">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
            </a>
          </Button>
          <Button variant="outline" size="icon" asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
              <FacebookIcon />
            </a>
          </Button>
          <Button variant="outline" size="icon" asChild className="bg-pink-600 text-white hover:bg-pink-700">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" title="Share on Instagram">
                  <InstagramIcon />
              </a>
          </Button>
        </div>
      );
    };

export default function EventPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const paymentStatusParam = searchParams?.get("payment")
  const paymentRefParam = searchParams?.get("ref");
  
  const [event, setEvent] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [customAmount, setCustomAmount] = useState<string>("");
  const [giftMessage, setGiftMessage] = useState("")
  const [giftFrom, setGiftFrom] = useState("")
  const [giftEmail, setGiftEmail] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventStatus, setEventStatus] = useState<"upcoming" | "today" | "expired" | "cancelled">("upcoming")
  const [daysUntilEvent, setDaysUntilEvent] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchEventData = useCallback(async (id: string | string[] | undefined) => {
    if(!id) return;
    try {
      const res = await fetch(`/api/events/${id}`)
      const data = await res.json()
      if (data.success && data.event) {
        setEvent(data.event)
        setLikeCount(data.event.likes || 0);

        if (data.event.status === 'cancelled') {
          setEventStatus('cancelled');
          return;
        }

        if (typeof window !== "undefined") {
          const likedEvents = JSON.parse(localStorage.getItem('likedEvents') || '{}');
          if (likedEvents[data.event.id]) {
            setLiked(true);
          }
        }

        const eventDate = new Date(data.event.date)
        const today = new Date()
        const expires = new Date(data.event.expiresAt)

        if (today > expires) {
          setEventStatus("expired")
        } else if (today.toDateString() === eventDate.toDateString()) {
          setEventStatus("today")
        } else {
          const diffTime = eventDate.getTime() - today.getTime();
          setDaysUntilEvent(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          setEventStatus("upcoming");
        }
      } else {
        setEvent(null)
      }
    } catch (error) {
      console.error("Error loading event:", error)
      setEvent(null)
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchEventData(params?.id);
    
    if (paymentStatusParam) {
      if (paymentStatusParam === 'success') {
          setPaymentStatus("🎉 Thank you! Your gift has been recorded.");
          setShowSuccess(true);
          // Refetch to show updated data immediately
          fetchEventData(params?.id); // Re-fetch to update raised amount and gift count
      } else {
          setPaymentStatus("⚠️ Payment failed or was cancelled.");
      }
      setTimeout(() => setPaymentStatus(""), 6000);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [params?.id, paymentStatusParam, fetchEventData]);


  const copyLink = () => {
    if (typeof window === "undefined") return
    const url = window.location.href.split('?')[0]; // Clean the URL
    navigator.clipboard.writeText(url);
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGiftSubmit = async () => {
    let amountToSend: number;
    if (selectedPackage?.type === 'custom') {
      amountToSend = parseFloat(customAmount);
      if (isNaN(amountToSend) || amountToSend <= 0) {
        setPaymentStatus("❌ Please enter a valid custom amount.")
        setTimeout(() => setPaymentStatus(""), 3000)
        return;
      }
    } else if (selectedPackage) {
      amountToSend = selectedPackage.amount;
    } else {
      setPaymentStatus("❌ Please select a gift package or enter a custom amount.")
      setTimeout(() => setPaymentStatus(""), 3000)
      return;
    }

    if (!giftEmail) {
      setPaymentStatus("❌ Please provide your email.")
      setTimeout(() => setPaymentStatus(""), 3000)
      return
    }

    setIsProcessing(true)
    setPaymentStatus("🔄 Initializing payment...")

    try {
      const response = await fetch("/api/payments/paystack-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountToSend,
          email: giftEmail,
          eventName: event.name,
          currency: event.currency,
          eventId: event.id,
          giftData: {
            from: giftFrom || "Anonymous",
            message: giftMessage,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentStatus("Redirecting to secure payment page...")
        window.location.href = data.data.authorization_url
      } else {
        throw new Error(data.message || "Payment initialization failed.")
      }
    } catch (error) {
      console.error("Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      setPaymentStatus(`❌ ${errorMessage}`)
      setTimeout(() => setPaymentStatus(""), 5000)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setSelectedPackage(null)
    setCustomAmount("")
    setGiftMessage("")
    setGiftFrom("")
    setGiftEmail("")
    setPaymentStatus("")
  }

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

  const handleImageContextMenu = (e: React.MouseEvent) => e.preventDefault()


  if (isLoading && !event) { // Only show full-page loader on initial load
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!event || eventStatus === "expired" || eventStatus === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center p-4">
          <h1 className="text-2xl font-bold mb-4">Event Unavailable</h1>
          <p className="text-gray-600 mb-4">This event may have expired or been cancelled by the creator.</p>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" /> Go Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  const getEventStatusMessage = () => {
    if (eventStatus === "today") return `🎉 Today is the day!`
    if (eventStatus === "upcoming") return `Just ${daysUntilEvent} day${daysUntilEvent !== 1 ? "s" : "" } to go!`
    return "This event has passed."
  }
  
  const handleLike = async () => {
    if (!event) return;

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    if (typeof window !== "undefined") {
        const likedEvents = JSON.parse(localStorage.getItem('likedEvents') || '{}');
        if (newLikedState) {
            likedEvents[event.id] = true;
        } else {
            delete likedEvents[event.id];
        }
        localStorage.setItem('likedEvents', JSON.stringify(likedEvents));
    }

    try {
        await fetch(`/api/events/${event.id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ liked: newLikedState }),
        });
    } catch (error) {
        console.error("Failed to update like status:", error);
        setLiked(!newLikedState);
        setLikeCount(prev => !newLikedState ? prev + 1 : prev - 1);
    }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
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

      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Gift sent successfully! 🎉 Thank you!
        </div>
      )}

       {(paymentStatus || isProcessing) && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg text-center">
                <p className="font-semibold whitespace-pre-line">{isProcessing && !paymentStatus ? "Processing..." : paymentStatus}</p>
            </div>
        )}

      {showImageGallery && selectedImageIndex !== null && event.images && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={closeImageGallery}
            >
              <X className="h-6 w-6" />
            </Button>
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
            <img
              src={event.images[selectedImageIndex] || "/placeholder.svg"}
              alt={`${event.name} photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              onContextMenu={handleImageContextMenu}
              onDragStart={(e) => e.preventDefault()}
              style={{ userSelect: "none" }}
            />
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {event.images.length}
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {event.name}
                </h1>
                <p className="text-xl text-gray-700 mb-6">
                Celebrate with {event.creatorName} by sending a gift!
                </p>
                <div className="flex items-center justify-center gap-4 text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date(event.date).toLocaleDateString()}
                </div>
                <Badge variant="secondary">{event.type}</Badge>
                </div>
                 <div className={`p-2 text-center rounded-lg ${
                    eventStatus === 'today' ? 'bg-green-100 text-green-800' :
                    eventStatus === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                    }`}>
                    <p className="font-semibold">{getEventStatusMessage()}</p>
                </div>
          </div>

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

           {event.description && (
            <div className="max-w-2xl mx-auto text-center mb-8">
              <p className="text-lg text-gray-700 bg-white/50 backdrop-blur-sm rounded-lg p-6">{event.description}</p>
            </div>
          )}
          <div className="max-w-md mx-auto mb-8">
            <Card>
                <CardContent className="p-6">
                    <div className="text-center mb-4">
                    <p className="text-2xl font-bold text-purple-600">
                        {event.currency} {(event.raised || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                        {event.goal ? `raised of ${event.currency} ${event.goal.toLocaleString()} goal` : 'raised'}
                    </p>
                    </div>
                    {event.goal && (
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((event.raised || 0) / event.goal) * 100, 100)}%` }}
                        ></div>
                    </div>
                    )}
                    <p className="text-center text-sm text-gray-600">{event.giftCount || 0} people have contributed</p>
                </CardContent>
            </Card>
            </div>


          <div className="text-center mb-8">
            <h3 className="font-semibold mb-2">Share this event!</h3>
            <div className="flex items-center justify-center gap-2">
                <Button onClick={copyLink} variant="outline" className="gap-2 bg-transparent flex-grow">
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Link"}
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleLike}>
                        <Heart className={`h-6 w-6 transition-colors ${liked ? 'text-red-500 fill-current' : 'text-gray-500'}`}/>
                    </Button>
                    <span className="font-bold">{likeCount}</span>
                </div>
            </div>
            <ShareButtons eventLink={typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''} eventName={event.name} />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-black">Choose Your Gift</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto mb-8">
          {(giftPackages[event.currency as keyof typeof giftPackages] || []).map((pkg) => (
            <Card
              key={pkg.amount}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedPackage?.amount === pkg.amount && selectedPackage?.type !== 'custom' ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-100' : 'bg-purple-50'}`}
              onClick={() => {
                setSelectedPackage(pkg);
                setCustomAmount("");
              }}
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
          {/* Custom Amount Input */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedPackage?.type === 'custom' ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-100' : 'bg-purple-50'}`}
            onClick={() => setSelectedPackage({ type: 'custom' })}
          >
            <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
              <Label htmlFor="custom-amount" className="text-sm sm:text-base mb-2">Other Amount</Label>
              <Input
                id="custom-amount"
                type="number"
                placeholder="e.g., 750"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPackage({ type: 'custom' });
                }}
                className="text-center"
              />
              <p className="text-xs text-gray-500 mt-1">Enter any amount</p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                disabled={!selectedPackage && !customAmount}
              >
                <Gift className="mr-2 h-5 w-5" />
                Send Gift {selectedPackage && selectedPackage.type !== 'custom' && `(${event.currency} ${selectedPackage.amount})`}
                {selectedPackage?.type === 'custom' && customAmount && `(${event.currency} ${customAmount})`}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Almost there!</DialogTitle>
                <DialogDescription>Provide your details to complete the gift.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Your Name (Optional)</Label>
                  <Input placeholder="Enter your name" value={giftFrom} onChange={(e) => setGiftFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email for receipt" value={giftEmail} onChange={(e) => setGiftEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Gift Message (Optional)</Label>
                  <Textarea placeholder="Write a special message..." value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleGiftSubmit} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Proceed with Gifting"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-6 w-6" />
                      Gift Messages
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {event.gifts && event.gifts.length > 0 ? (
                           [...event.gifts].reverse().map((gift: any) => (
                            gift.message && (
                              <div key={gift.id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                                  <p className="font-bold text-purple-700">{gift.from}</p>
                                  <p className="text-gray-700 pt-1">"{gift.message}"</p>
                                  <p className="text-xs text-gray-500 pt-2">
                                      Sent {new Date(gift.timestamp).toLocaleString()}
                                  </p>
                              </div>
                            )
                           ))
                        ) : (
                          <p className="text-center text-gray-500 py-4">Be the first to leave a message!</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

        <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Want Your Own Celebration Page?</h2>
            <p className="text-gray-600 mb-8">
              Create your own event page and start receiving gifts from friends and family.
            </p>
            <Link href="/create">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
              >
                <Plus className="mr-2 h-5 w-5" /> Create Your Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
