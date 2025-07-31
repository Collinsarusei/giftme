"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Gift, Calendar, DollarSign, Users, Trash2, Download, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation";

// Interfaces (kept as is, assuming they match backend responses)
interface Project {
    _id: string;
    name: string;
    url: string;
}
  
interface AdminGift {
    _id: string;
    id: string; // Added id property
    from: string;
    amount: number;
    message: string;
    timestamp: string;
    status: 'completed' | 'withdrawn';
}

interface Event {
  id: string;
  name: string;
  status: string;
  // Add other event properties if needed for display
}

interface User {
  id: string;
  username: string;
  email: string;
  // Add other user properties if needed for display
}

export default function DeveloperPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [deletedEvents, setDeletedEvents] = useState<Event[]>([]) // Events with status 'deleted'
  const [developerGifts, setDeveloperGifts] = useState<AdminGift[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalGifts: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
  })
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoadData() {
      setIsLoading(true);
      try {
        const authRes = await fetch("/api/developer/me");
        if (authRes.ok) {
          setIsAuthenticated(true);
          await loadDeveloperData();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking developer auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthAndLoadData();
  }, []);

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      const res = await fetch("/api/developer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        await loadDeveloperData(); // Load data after successful login
      } else {
        alert(data.message || "Invalid password");
      }
    } catch (error) {
      console.error("Developer login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const loadDeveloperData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, giftsRes, usersRes, statsRes] = await Promise.all([
        fetch("/api/developer/events"),
        fetch("/api/developer/gifts"),
        fetch("/api/developer/users"),
        fetch("/api/developer/stats"),
      ]);

      const eventsData = await eventsRes.json();
      if (eventsData.success) {
        setAllEvents(eventsData.events.filter((e: Event) => e.status !== 'deleted'));
        setDeletedEvents(eventsData.events.filter((e: Event) => e.status === 'deleted'));
      }

      const giftsData = await giftsRes.json();
      if (giftsData.success) setDeveloperGifts(giftsData.gifts);

      const usersData = await usersRes.json();
      if (usersData.success) setUsers(usersData.users);

      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

    } catch (error) {
      console.error("Error loading developer data:", error);
      alert("Failed to load developer data. Please try again.");
      setIsAuthenticated(false); // Force re-authentication on data load failure
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to soft delete this event? It will be marked as 'deleted'.")) {
      try {
        const res = await fetch(`/api/developer/events/${eventId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          await loadDeveloperData(); // Refresh data
        } else {
          alert(data.message || "Failed to delete event.");
        }
      } catch (error) {
        console.error("Error soft deleting event:", error);
        alert("An error occurred while deleting the event.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/developer/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(false); // Clear authentication state
        setPassword(""); // Clear password field
        router.push("/developer"); // Redirect to login page
      } else {
        alert(data.message || "Logout failed.");
      }
    } catch (error) {
      console.error("Developer logout error:", error);
      alert("An error occurred during logout.");
    }
  };

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-green-500 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white"/>
      </div>
    );
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
              <Button onClick={handleLogin} disabled={isLoginLoading}>
                {isLoginLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Login"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-green-500 p-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" onClick={handleLogout}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Logout
        </Button>
        <Button onClick={() => alert("Export functionality to be implemented: Data will be fetched from DB and compiled for download.")}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events ({allEvents.length})</TabsTrigger>
          <TabsTrigger value="deletedEvents">Deleted Events ({deletedEvents.length})</TabsTrigger>
          <TabsTrigger value="gifts">Gifts ({developerGifts.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEvents.length > 0 ? (
              allEvents.map((event) => (
                <Card key={event.id} className="p-4">
                  <CardHeader>
                    <CardTitle>{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{event.status}</Badge>
                      <Button variant="destructive" onClick={() => deleteEvent(event.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Soft Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No active/expired events found.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="deletedEvents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deletedEvents.length > 0 ? (
              deletedEvents.map((event) => (
                <Card key={event.id} className="p-4">
                  <CardHeader>
                    <CardTitle>{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Deleted</Badge>
                      {/* You might add an option to restore here if needed */}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No deleted events found.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="gifts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {developerGifts.length > 0 ? (
              developerGifts.map((gift) => (
                <Card key={gift._id} className="p-4"> {/* Changed key to gift._id */}
                  <CardHeader>
                    <CardTitle>{gift.from} - KES {gift.amount}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{gift.status}</Badge>
                      <span className="text-sm text-muted-foreground">{gift.message}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No developer gifts found.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.length > 0 ? (
              users.map((user) => (
                <Card key={user.id} className="p-4">
                  <CardHeader>
                    <CardTitle>{user.username}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {/* Display other user details as needed */}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No users found.</p>
            )}
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
                  <span className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                  <span className="text-2xl font-bold">KES {stats.pendingWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
