// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gift, Eye, Calendar, DollarSign, Wallet, Download, Trash2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const withdrawalEventId = searchParams?.get("withdrawal")

  const [userEvents, setUserEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalReceived, setTotalReceived] = useState(0)
  const [totalGifts, setTotalGifts] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [withdrawalMessage, setWithdrawalMessage] = useState("")

  const DEV_FEE_PERCENTAGE = 0.03 // 3%
  const PAYSTACK_TRANSFER_FEE_KES = 20 // KES

  // ... (useEffect and other functions remain the same)
  useEffect(() => {
    async function fetchUserEvents() {
      setIsLoading(true)
      let currentUser = null
      if (typeof window !== "undefined") {
        currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      }

      if (!currentUser || !currentUser.username) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/events?createdBy=${currentUser.username}`)
        const data = await res.json()
        if (data.success) {
          const myEvents = data.events.filter((event: any) => event.status !== 'cancelled')
          setUserEvents(myEvents)

          let initialSelectedEvent = null
          if (withdrawalEventId) {
            initialSelectedEvent = myEvents.find((e: any) => e.id === withdrawalEventId)
          } else if (myEvents.length > 0) {
            initialSelectedEvent = myEvents[0]
          }

          if (initialSelectedEvent) {
            setSelectedEventId(initialSelectedEvent.id)
            setSelectedEvent(initialSelectedEvent)
          }

          const earnings = myEvents.reduce((sum: number, event: any) => sum + (event.raised || 0), 0)
          const gifts = myEvents.reduce((sum: number, event: any) => sum + (event.giftCount || 0), 0)
          const views = myEvents.reduce((sum: number, event: any) => sum + (event.views || 0), 0)
          setTotalReceived(earnings)
          setTotalGifts(gifts)
          setTotalViews(views)
        }
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserEvents()
  }, [withdrawalEventId])

  useEffect(() => {
    if (selectedEvent) {
      const eventPendingGifts = selectedEvent.gifts.filter(
        (gift: any) => gift.paymentMethod === "paystack" && gift.status === "pending_withdrawal"
      )
      const balance = eventPendingGifts.reduce((sum: number, gift: any) => sum + gift.amount, 0)
      setAvailableBalance(balance)
    } else {
      setAvailableBalance(0)
    }
  }, [selectedEvent])

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId)
    const event = userEvents.find((e) => e.id === eventId)
    setSelectedEvent(event)
  }

  const handleDeleteEvent = async (eventId: string) => {
    setIsDeleting(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}/delete`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setUserEvents(prevEvents => prevEvents.filter(e => e.id !== eventId))
        if(selectedEventId === eventId) {
            setSelectedEvent(null)
            setSelectedEventId("")
        }
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("An error occurred while deleting the event.")
    } finally {
      setIsDeleting(null)
    }
  }

  const handlePaystackWithdrawal = async () => {
    if (!selectedEvent || availableBalance <= 0) return

    setIsWithdrawing(true)
    setWithdrawalMessage("Initiating withdrawal...")

    const netAmountAfterDevFee = availableBalance * (1 - DEV_FEE_PERCENTAGE)
    const finalPayout = netAmountAfterDevFee - PAYSTACK_TRANSFER_FEE_KES

    if (finalPayout <= 0) {
      setWithdrawalMessage("❌ Net withdrawal amount is too low after fees.")
      setIsWithdrawing(false)
      return
    }

    try {
        const giftIdsToWithdraw = selectedEvent.gifts
            .filter((g: any) => g.status === 'pending_withdrawal')
            .map((g: any) => g.id);

      const res = await fetch("/api/payments/paystack-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPayout,
          name: selectedEvent.creatorName,
          mpesaNumber: selectedEvent.mpesaNumber,
          reason: `Withdrawal for ${selectedEvent.name}`,
          giftIds: giftIdsToWithdraw,
          eventId: selectedEvent.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setWithdrawalMessage("✅ Withdrawal successful! Check your M-Pesa.")
        // Refresh data
        const updatedEvents = userEvents.map(event => 
            event.id === selectedEvent.id 
                ? { ...event, gifts: event.gifts.map((g: any) => giftIdsToWithdraw.includes(g.id) ? {...g, status: 'withdrawn'} : g) }
                : event
        );
        setUserEvents(updatedEvents);
        setSelectedEvent(updatedEvents.find(e => e.id === selectedEvent.id));

      } else {
        setWithdrawalMessage(`❌ Withdrawal failed: ${data.message}`)
      }
    } catch (error) {
      setWithdrawalMessage("❌ An unexpected error occurred.")
    } finally {
      setIsWithdrawing(false)
      setTimeout(() => setWithdrawalMessage(""), 5000)
    }
  }


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'withdrawn':
        return 'default'; // Or another variant that looks like success
      case 'pending_withdrawal':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const developerFee = availableBalance * DEV_FEE_PERCENTAGE
  const finalPayout = availableBalance - developerFee - PAYSTACK_TRANSFER_FEE_KES

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Creator Dashboard
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {userEvents.length > 0 ? (
          <>
            <div className="mb-6">
              <Select value={selectedEventId} onValueChange={handleEventChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event to manage" />
                </SelectTrigger>
                <SelectContent>
                  {userEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Event Stats */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedEvent.name}</CardTitle>
                            <CardDescription>Event Status: <Badge>{selectedEvent.status}</Badge></CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center"><DollarSign className="mx-auto h-6 w-6 text-green-500"/><p className="font-bold text-lg">{selectedEvent.raised.toLocaleString()}</p><p className="text-sm text-gray-500">Raised</p></div>
                            <div className="text-center"><Gift className="mx-auto h-6 w-6 text-blue-500"/><p className="font-bold text-lg">{selectedEvent.giftCount}</p><p className="text-sm text-gray-500">Gifts</p></div>
                            <div className="text-center"><Eye className="mx-auto h-6 w-6 text-purple-500"/><p className="font-bold text-lg">{selectedEvent.views}</p><p className="text-sm text-gray-500">Views</p></div>
                            <div className="text-center"><Calendar className="mx-auto h-6 w-6 text-orange-500"/><p className="font-bold text-lg">{new Date(selectedEvent.date).toLocaleDateString()}</p><p className="text-sm text-gray-500">Date</p></div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Link href={`/event/${selectedEvent.id}`} passHref>
                                <Button variant="outline">View Event Page</Button>
                            </Link>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting === selectedEvent.id}>
                                    {isDeleting === selectedEvent.id ? 'Deleting...' : <><Trash2 className="mr-2 h-4 w-4"/> Delete Event</>}
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the event and all its data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteEvent(selectedEvent.id)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                    
                    {/* Gift List */}
                    <Card>
                        <CardHeader><CardTitle>Gifts Received</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {selectedEvent.gifts.length > 0 ? selectedEvent.gifts.map((gift: any) => (
                                    <div key={gift.id} className="p-2 border rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{gift.from} - KES {gift.amount}</p>
                                            <p className="text-sm text-gray-500">{gift.message}</p>
                                        </div>
                                        <Badge variant={getStatusVariant(gift.status)}>{gift.status.replace('_', ' ')}</Badge>
                                    </div>
                                )) : <p>No gifts received for this event yet.</p>}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Withdrawal Card */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center"><Wallet className="mr-2"/> Withdrawal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Available Balance</p>
                                <p className="text-2xl font-bold">KES {availableBalance.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-md text-sm space-y-1">
                                <div className="flex justify-between"><span>3% Developer Fee:</span><span>- KES {developerFee.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Paystack Transfer Fee:</span><span>- KES {PAYSTACK_TRANSFER_FEE_KES.toFixed(2)}</span></div>
                                <hr/>
                                <div className="flex justify-between font-bold"><span>Final Payout:</span><span>KES {finalPayout > 0 ? finalPayout.toFixed(2) : '0.00'}</span></div>
                            </div>
                            <Button onClick={handlePaystackWithdrawal} disabled={isWithdrawing || finalPayout <= 0} className="w-full">
                                {isWithdrawing ? 'Withdrawing...' : <><Download className="mr-2 h-4 w-4"/> Withdraw Funds</>}
                            </Button>
                            {withdrawalMessage && <p className="text-center text-sm font-semibold mt-2">{withdrawalMessage}</p>}
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold">No events found.</h2>
            <p className="text-gray-600">Create an event to get started.</p>
            <Link href="/create" passHref>
                <Button className="mt-4">Create Event</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
