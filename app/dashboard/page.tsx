// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Gift, Eye, Calendar, DollarSign, Wallet, Download, Trash2, Home, LogOut, Heart, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const withdrawalEventId = searchParams?.get("withdrawal")

  const [userEvents, setUserEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null) // State for current user
  const [availableBalance, setAvailableBalance] = useState(0)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [withdrawalMessage, setWithdrawalMessage] = useState("")

  const PLATFORM_FEE_PERCENTAGE = 0.03 // 3%
  const PAYSTACK_TRANSFER_FEE_KES = 20 // KES

  // Effect to fetch current user and then events
  useEffect(() => {
    async function authenticateUserAndFetchEvents() {
      setIsLoading(true);
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (authData.success && authData.user) {
          setCurrentUser(authData.user);
          // Fetch user events only after successful authentication
          const res = await fetch(`/api/events?createdBy=${authData.user.username}`);
          const data = await res.json();
          if (data.success) {
            const myEvents = data.events.filter((event: any) => event.status !== 'cancelled' && event.status !== 'deleted'); // Filter out 'deleted' events
            setUserEvents(myEvents);

            let initialSelectedEvent = null;
            if (withdrawalEventId) {
              initialSelectedEvent = myEvents.find((e: any) => e.id === withdrawalEventId);
            } else if (myEvents.length > 0) {
              initialSelectedEvent = myEvents[0];
            }

            if (initialSelectedEvent) {
              setSelectedEventId(initialSelectedEvent.id);
              setSelectedEvent(initialSelectedEvent);
            }
          }
        } else {
          router.push("/auth"); // Redirect to login if not authenticated
        }
      } catch (error) {
        console.error("Error during authentication or fetching dashboard data:", error);
        router.push("/auth"); // Redirect on any auth/fetch error
      } finally {
        setIsLoading(false);
      }
    }
    authenticateUserAndFetchEvents();
  }, [withdrawalEventId, router]);

  useEffect(() => {
    if (selectedEvent) {
      const eventPendingGifts = (selectedEvent.gifts || []).filter(
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
  
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(null); // Clear user state
        router.push('/'); // Redirect to homepage
      } else {
        alert(data.message || "Logout failed.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred during logout.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Safety Check: Prevent deletion if there are pending withdrawals
    const hasPendingWithdrawals = selectedEvent?.gifts?.some((gift: any) => gift.status === 'pending_withdrawal') || false;
    if (hasPendingWithdrawals) {
        alert("This event cannot be deleted because there are pending withdrawals. Please withdraw all available funds first.");
        return;
    }

    setIsDeleting(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}/delete`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setUserEvents(prevEvents => {
            const newEvents = prevEvents.filter(e => e.id !== eventId)
            if (selectedEventId === eventId) {
                if (newEvents.length > 0) {
                    setSelectedEvent(newEvents[0])
                    setSelectedEventId(newEvents[0].id)
                } else {
                    setSelectedEvent(null)
                    setSelectedEventId("")
                }
            }
            return newEvents
        })
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

  // ... (handlePaystackWithdrawal and other functions remain the same)
  const handlePaystackWithdrawal = async () => {
    if (!selectedEvent || availableBalance <= 0) return

    setIsWithdrawing(true)
    setWithdrawalMessage("Initiating withdrawal...")

    // The front-end should just send the gross amount and identifiers.
    // The server will handle all fee calculations.
    try {
        const giftIdsToWithdraw = (selectedEvent.gifts || [])
            .filter((g: any) => g.status === 'pending_withdrawal')
            .map((g: any) => g.id);

      // Call the new, more secure withdrawal endpoint
      const res = await fetch("/api/payments/paystack-withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: availableBalance, // Send the full amount as 'amount'
          name: selectedEvent.name, // Add the event name
          mpesaNumber: selectedEvent.mpesaNumber, // Use mpesaNumber as requested
          reason: `Withdrawal for ${selectedEvent.name}`,
          giftIds: giftIdsToWithdraw,
          eventId: selectedEvent.id,
          currency: selectedEvent.currency || "KES",
        }),
      })

      const data = await res.json()

      if (data.success) {
        setWithdrawalMessage("✅ Withdrawal successfully initiated!")
        // Refresh data by re-fetching or updating the local state accurately
        const updatedEvents = userEvents.map(event => 
            event.id === selectedEvent.id 
                ? { ...event, gifts: (event.gifts || []).map((g: any) => giftIdsToWithdraw.includes(g.id) ? {...g, status: 'withdrawn'} : g) }
                : event
        );
        setUserEvents(updatedEvents);
        setSelectedEvent(updatedEvents.find(e => e.id === selectedEvent.id));

      } else {
        setWithdrawalMessage(`❌ Withdrawal failed: ${data.message}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setWithdrawalMessage(`❌ ${errorMessage}`)
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

  // UI display calculations can remain for user clarity, but aren't used for the API call
  const platformFee = availableBalance * PLATFORM_FEE_PERCENTAGE
  const finalPayout = availableBalance - platformFee - PAYSTACK_TRANSFER_FEE_KES
  const hasPendingWithdrawals = selectedEvent?.gifts?.some((gift: any) => gift.status === 'pending_withdrawal') || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Creator Dashboard
          </h1>
          <div className="flex gap-2">
            <Link href="/" passHref>
                <Button variant="outline"><Home className="mr-2 h-4 w-4"/> Home</Button>
            </Link>
            <Button onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Logout</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {currentUser && userEvents.length > 0 ? (
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
                        <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="text-center"><DollarSign className="mx-auto h-6 w-6 text-green-500"/><p className="font-bold text-lg">{(selectedEvent.raised || 0).toLocaleString()}</p><p className="text-sm text-gray-500">Raised</p></div>
                            <div className="text-center"><Gift className="mx-auto h-6 w-6 text-blue-500"/><p className="font-bold text-lg">{selectedEvent.giftCount}</p><p className="text-sm text-gray-500">Gifts</p></div>
                            <div className="text-center"><Eye className="mx-auto h-6 w-6 text-purple-500"/><p className="font-bold text-lg">{selectedEvent.views}</p><p className="text-sm text-gray-500">Views</p></div>
                            <div className="text-center"><Heart className="mx-auto h-6 w-6 text-red-500"/><p className="font-bold text-lg">{selectedEvent.likes || 0}</p><p className="text-sm text-gray-500">Likes</p></div>
                            <div className="text-center"><Calendar className="mx-auto h-6 w-6 text-orange-500"/><p className="font-bold text-lg">{new Date(selectedEvent.date).toLocaleDateString()}</p><p className="text-sm text-gray-500">Date</p></div>
                        </CardContent>
                        <CardFooter className="flex justify-between flex-wrap gap-2">
                            <Link href={`/event/${selectedEvent.id}`} passHref>
                                <Button variant="outline">View Event Page</Button>
                            </Link>
                            <Link href={`/event/${selectedEvent.id}/manage-images`} passHref>
                                <Button variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white">
                                    <ImageIcon className="mr-2 h-4 w-4"/> Change Images
                                </Button>
                            </Link>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting === selectedEvent.id || hasPendingWithdrawals} title={hasPendingWithdrawals ? "You must withdraw pending funds before deleting." : ""}>
                                    {isDeleting === selectedEvent.id ? 'Deleting...' : <><Trash2 className="mr-2 h-4 w-4"/> Delete Event</>}
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will mark the event as cancelled and it will no longer be publicly accessible. This action cannot be undone.
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
                    
                    {/* ... (Gift List card remains the same) ... */}
                    <Card>
                        <CardHeader><CardTitle>Gifts Received</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {((selectedEvent?.gifts || []).length > 0) ? (selectedEvent.gifts || []).sort((a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((gift: any) => (
                                    <div key={gift.id} className="p-2 border rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{gift.from} - KES {gift.amount}</p>
                                            <p className="text-sm text-gray-500">{(new Date(gift.timestamp)).toLocaleString()}</p>
                                        </div>
                                        <Badge variant={getStatusVariant(gift.status)}>{gift.status.replace(/_/g, ' ')}</Badge>
                                    </div>
                                )) : <p>No gifts received for this event yet.</p>}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* ... (Withdrawal Card remains the same) ... */}
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
                                <div className="flex justify-between"><span>3% Platform Fee:</span><span>- KES {platformFee.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Paystack Transfer Fee:</span><span>- KES {PAYSTACK_TRANSFER_FEE_KES.toFixed(2)}</span></div>
                                <hr/>
                                <div className="flex justify-between font-bold"><span>Final Payout:</span><span>KES {finalPayout > 0 ? finalPayout.toFixed(2) : '0.00'}</span></div>
                            </div>
                            <Button onClick={handlePaystackWithdrawal} disabled={isWithdrawing || finalPayout <= 0} className="w-full">
                                {isWithdrawing ? 'Withdrawing...' : <><Download className="mr-2 h-4 w-4"/> Withdraw Funds</>}
                            </Button>
                            {withdrawalMessage && <p className="text-center text-sm font-semibold mt-2">{
                                withdrawalMessage === "✅ Withdrawal successfully initiated!" ? 
                                    <span className="text-green-600">{withdrawalMessage}</span> : 
                                    <span className="text-red-600">{withdrawalMessage}</span>
                            }</p>}
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">No events found.</h2>
            <p className="text-gray-600">Create an event to get started.</p>
            <Link href="/create" passHref>
                <Button className="mt-4">Create Your First Event</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
