"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Gift, Calendar, DollarSign, Users, Trash2, Download, AlertTriangle, ArrowLeft } from "lucide-react"

const DEVELOPER_PASSWORD = "dev123" // In production, use environment variable

export default function DeveloperPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [deletedEvents, setDeletedEvents] = useState<any[]>([])
  const [developerGifts, setDeveloperGifts] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalGifts: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadDeveloperData()
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    if (password === DEVELOPER_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      alert("Invalid password")
    }
  }

  const loadDeveloperData = () => {
    try {
      // Load all events
      const events = JSON.parse(localStorage.getItem("allEvents") || "[]")
      setAllEvents(events)

      // Load deleted events
      const deleted = JSON.parse(localStorage.getItem("deletedEvents") || "[]")
      setDeletedEvents(deleted)

      // Load developer gifts
      const gifts = JSON.parse(localStorage.getItem("developerGifts") || "[]")
      setDeveloperGifts(gifts)

      // Load users
      const users = JSON.parse(localStorage.getItem("users") || "[]")

      // Calculate stats
      const totalGifts = events.reduce((sum: number, event: any) => sum + (event.giftCount || 0), 0)
      const totalRevenue = events.reduce((sum: number, event: any) => sum + (event.raised || 0), 0)
      const pendingWithdrawals = events.reduce((sum: number, event: any) => {
        const paystackGifts = (event.gifts || []).filter(
          (gift: any) => gift.paymentMethod === "paystack" && gift.status === "pending_withdrawal",
        )
        return sum + paystackGifts.reduce((giftSum: number, gift: any) => giftSum + gift.amount, 0)
      }, 0)

      setStats({
        totalEvents: events.length,
        totalUsers: users.length,
        totalGifts,
        totalRevenue,
        pendingWithdrawals,
      })
    } catch (error) {
      console.error("Error loading developer data:", error)
    }
  }

  const deleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      const events = JSON.parse(localStorage.getItem("allEvents") || "[]")
      const eventToDelete = events.find((e: any) => e.id === eventId)

      if (eventToDelete) {
        // Move to deleted events
        const deleted = JSON.parse(localStorage.getItem("deletedEvents") || "[]")
        deleted.push({ ...eventToDelete, deletedAt: new Date().toISOString() })
        localStorage.setItem("deletedEvents", JSON.stringify(deleted))

        // Remove from active events
        const updatedEvents = events.filter((e: any) => e.id !== eventId)
        localStorage.setItem("allEvents", JSON.stringify(updatedEvents))

        loadDeveloperData()
      }
    }
  }

  const exportData = () => {
    const data = {
      events: allEvents,
      deletedEvents,
      developerGifts,
      stats,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `celebratewithme-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-green-500 flex items-center justify-center">
        <Card className="p-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Developer Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-green-500 p-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={exportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="deletedEvents">Deleted Events</TabsTrigger>
          <TabsTrigger value="gifts">Gifts</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEvents.map((event) => (
              <Card key={event.id} className="p-4">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{event.status}</Badge>
                    <Button variant="destructive" onClick={() => deleteEvent(event.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="deletedEvents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deletedEvents.map((event) => (
              <Card key={event.id} className="p-4">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Deleted</Badge>
                    <span className="text-sm text-muted-foreground">
                      Deleted at: {new Date(event.deletedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="gifts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {developerGifts.map((gift) => (
              <Card key={gift.id} className="p-4">
                <CardHeader>
                  <CardTitle>{gift.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{gift.status}</Badge>
                    <span className="text-sm text-muted-foreground">Amount: ${gift.amount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.totalEvents}</span>
                  <Badge variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.totalUsers}</span>
                  <Badge variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Total Gifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.totalGifts}</span>
                  <Badge variant="outline">
                    <Gift className="mr-2 h-4 w-4" />
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${stats.totalRevenue}</span>
                  <Badge variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${stats.pendingWithdrawals}</span>
                  <Badge variant="outline">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
