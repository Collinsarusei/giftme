"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gift, Eye, Calendar, DollarSign, Copy, CheckCircle, ExternalLink, Download } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [totalGifts, setTotalGifts] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [recentGifts, setRecentGifts] = useState<any[]>([])
  const [copied, setCopied] = useState("")
  const [paystackGifts, setPaystackGifts] = useState<any[]>([])
  const [isWithdrawing, setIsWithdrawing] = useState<string>("")

  useEffect(() => {
    async function fetchUserEvents() {
      setIsLoading(true)
      try {
        // Get current user from localStorage (can be migrated to context/auth later)
        let currentUser = null
        if (typeof window !== "undefined") {
          currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
        }
        if (!currentUser || !currentUser.username) {
          setIsAuthorized(false)
          setIsLoading(false)
          return
        }
        setIsAuthorized(true)
        // Fetch user's events from API
        const res = await fetch(`/api/events?createdBy=${currentUser.username}`)
        const data = await res.json()
        if (data.success) {
          const myEvents = data.events
          setUserEvents(myEvents)
          // Set the first event as selected by default
          if (myEvents.length > 0) {
            setSelectedEventId(myEvents[0].id)
            setSelectedEvent(myEvents[0])
          }
          // Calculate totals for all events
          const earnings = myEvents.reduce((sum, event) => sum + (event.raised || 0), 0)
          const gifts = myEvents.reduce((sum, event) => sum + (event.giftCount || 0), 0)
          const views = myEvents.reduce((sum, event) => sum + (event.views || 0), 0)
          setTotalEarnings(earnings)
          setTotalGifts(gifts)
          setTotalViews(views)
          // Get recent gifts from all events
          const allGifts = myEvents
            .flatMap((event) =>
              (event.gifts || []).map((gift) => ({
                ...gift,
                eventName: event.name,
                eventId: event.id,
              }))
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          setRecentGifts(allGifts.slice(0, 10))
          // Get Paystack gifts that need withdrawal
          const paystackPendingGifts = allGifts.filter(
            (gift) => gift.paymentMethod === "paystack" && gift.status === "pending_withdrawal"
          )
          setPaystackGifts(paystackPendingGifts)
        } else {
          setUserEvents([])
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error("Error loading dashboard:", error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserEvents()
  }, [])

  // Handle event selection change
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId)
    const event = userEvents.find((e) => e.id === eventId)
    setSelectedEvent(event)
  }

  const copyEventLink = (eventId: string) => {
    if (typeof window === "undefined") return

    const link = `${window.location.origin}/event/${eventId}`
    navigator.clipboard.writeText(link)
    setCopied(eventId)
    setTimeout(() => setCopied(""), 2000)
  }

  // Update withdrawal to use API
  const handlePaystackWithdrawal = async (giftId: string, eventId?: string) => {
    setIsWithdrawing(giftId)
    try {
      // Call API to update gift status to withdrawn
      const res = await fetch("/api/events/gift", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventId,
          giftId: giftId,
          status: "withdrawn",
          withdrawnAt: new Date().toISOString(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh events
        if (selectedEventId) {
          const eventRes = await fetch(`/api/events?createdBy=${selectedEvent?.createdBy}`)
          const eventData = await eventRes.json()
          if (eventData.success) setUserEvents(eventData.events)
        }
        window.location.reload()
        alert("✅ Withdrawal successful! Money has been sent to your bank account.")
      } else {
        alert("❌ Withdrawal failed. Please try again.")
      }
    } catch (error) {
      alert("❌ Withdrawal failed. Please try again.")
    } finally {
      setIsWithdrawing("")
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Show unauthorized message
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to create an event first to access the dashboard</p>
          <Link href="/create">
            <Button>Create Your Event</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your events and track your gifts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Link href="/create">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm sm:text-base">
                  Create New Event
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base bg-transparent">
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Paystack Withdrawal Section */}
        {paystackGifts.length > 0 && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Download className="h-5 w-5" />
                  Paystack Withdrawals Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-orange-700 mb-4">
                    You have {paystackGifts.length} gift(s) from Paystack that can be withdrawn to your bank account.
                  </p>
                  {paystackGifts.map((gift) => (
                    <div key={gift.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-semibold">
                          {gift.from} - KES {gift.amount}
                        </p>
                        <p className="text-sm text-gray-600">From: {gift.eventName}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(gift.timestamp)}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePaystackWithdrawal(gift.id, gift.eventId)}
                        disabled={isWithdrawing === gift.id}
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
                            Withdraw
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Event Selector - Show even with one event for consistency */}
        {userEvents.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {userEvents.length === 1 ? "Your Event" : "Switch Between Your Events"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedEventId} onValueChange={handleEventChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an event to view details" />
                  </SelectTrigger>
                  <SelectContent>
                    {userEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{event.name}</span>
                          <Badge variant="outline" className="ml-2">
                            KES {(event.raised || 0).toLocaleString()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Overview - Show overall stats or selected event stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedEvent ? "Event" : "Total"} Received</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    KES {(selectedEvent ? selectedEvent.raised || 0 : totalEarnings).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 hidden sm:block">Sent directly to your M-Pesa</p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedEvent ? "Event" : "Total"} Gifts</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">
                    {selectedEvent ? selectedEvent.giftCount || 0 : totalGifts}
                  </p>
                </div>
                <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedEvent ? "Event" : "Total"} Views</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">
                    {selectedEvent ? selectedEvent.views || 0 : totalViews}
                  </p>
                </div>
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active Events</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{userEvents.length}</p>
                </div>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="gifts">Recent Gifts</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="space-y-6">
              {userEvents.length > 0 ? (
                userEvents.map((event) => (
                  <Card key={event.id} className={selectedEvent?.id === event.id ? "ring-2 ring-purple-500" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {event.name}
                            <Badge variant="default">Active</Badge>
                            {selectedEvent?.id === event.id && <Badge variant="secondary">Currently Viewing</Badge>}
                          </CardTitle>
                          <p className="text-gray-600">
                            {event.type} • {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/event/${event.id}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Page
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => copyEventLink(event.id)}>
                            {copied === event.id ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2" />
                            )}
                            {copied === event.id ? "Copied!" : "Copy Link"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            KES {(event.raised || 0).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Raised</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{event.giftCount || 0}</p>
                          <p className="text-sm text-gray-600">Gifts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{event.views || 0}</p>
                          <p className="text-sm text-gray-600">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{event.shares || 0}</p>
                          <p className="text-sm text-gray-600">Shares</p>
                        </div>
                      </div>

                      {/* Progress Bar - Only show if goal exists */}
                      {event.goal && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress to Goal</span>
                            <span>{Math.round(((event.raised || 0) / event.goal) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                              style={{ width: `${Math.min(((event.raised || 0) / event.goal) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">Goal: KES {event.goal.toLocaleString()}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Events Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first event to start receiving gifts</p>
                    <Link href="/create">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Create Your First Event
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Gifts Tab */}
          <TabsContent value="gifts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Gifts {selectedEvent && `for ${selectedEvent.name}`}</CardTitle>
              </CardHeader>
              <CardContent>
                {recentGifts.length > 0 ? (
                  <div className="space-y-4">
                    {recentGifts
                      .filter((gift) => !selectedEvent || gift.eventName === selectedEvent.name)
                      .map((gift, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{gift.from}</p>
                              <Badge variant="outline" className="text-xs">
                                KES {gift.amount}
                              </Badge>
                              {gift.paymentMethod === "paystack" && (
                                <Badge variant="secondary" className="text-xs">
                                  {gift.status === "pending_withdrawal" ? "Pending Withdrawal" : gift.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">For: {gift.eventName}</p>
                            {gift.message && <p className="text-sm text-gray-600 mb-1">"{gift.message}"</p>}
                            <p className="text-xs text-gray-500">{formatTimeAgo(gift.timestamp)}</p>
                          </div>
                          <Gift className="h-5 w-5 text-purple-500" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No gifts received yet</p>
                    <p className="text-sm">Share your event links to start receiving gifts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
