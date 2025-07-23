// app/page.tsx (Updated Features Section)
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Heart, PartyPopper, Sparkles, Search, User, CreditCard } from "lucide-react" // Added CreditCard
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

// ... (rest of the component is the same)

const HomePage = () => {
  const [sampleEvents, setSampleEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // ... (useEffect and other functions remain the same)
  
  // Filter events based on search query and expiration
  const filteredEvents = sampleEvents.filter(
    (event: any) =>
      (event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.type?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      event.status === "active" &&
      new Date(event.expiresAt) >= new Date()
  )

  useEffect(() => {
    // Check for current user from localStorage
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      if (user) {
        setCurrentUser(JSON.parse(user))
      }
    }

    async function fetchEvents() {
      setIsLoading(true)
      try {
        // Fetch events from API
        const res = await fetch(`/api/events`)
        const data = await res.json()
        if (data.success) {
          setSampleEvents(data.events)
        } else {
          setSampleEvents([])
        }
      } catch (error) {
        console.error("Error loading events:", error)
        setSampleEvents([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header, Hero, Search, Sample Events... (Keep as is) */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Gift className="h-8 w-8 text-purple-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            CelebrateWith.me
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/support-developer">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Heart className="h-4 w-4" />
              Support Developer
            </Button>
          </Link>
          {currentUser ? (
            <Link href="/dashboard">
              <Button size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {currentUser.username}
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="animate-bounce mb-4 sm:mb-6">
            <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
            Turn Every Celebration Into a Gift-Giving Experience
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Create beautiful event pages for birthdays, graduations, weddings, and more. Let friends and family
            celebrate with you by sending monetary gifts securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href={currentUser ? "/create" : "/auth"}>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
              >
                <PartyPopper className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Create Your Event
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-transparent"
            >
              View Sample Events
            </Button>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Input
              placeholder="Search events by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </section>

      {/* Sample Events Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Inspire Others with Your Celebration</h2>
          <p className="text-gray-600 max-w-2xl mx-auto px-4">
            See how others are using CelebrateWith.me to make their special moments even more memorable
          </p>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {filteredEvents.map((event: any) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                <div className="relative">
                    <Image
                      src={event.images?.[0] || "/placeholder.svg?height=200&width=300"}
                      alt={event.name || "Event"}
                      width={300}
                      height={200}
                      unoptimized
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-purple-500 p-1.5 sm:p-2 rounded-full">
                    <PartyPopper className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <Badge className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/90 text-gray-800 text-xs sm:text-sm">
                    {event.type}
                  </Badge>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{event.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">{new Date(event.date).toLocaleDateString()}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>
                        Raised: {event.currency} {(event.raised || 0).toLocaleString()}
                      </span>
                      {event.goal && (
                        <span>
                          Goal: {event.currency} {event.goal.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {event.goal && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${Math.min(((event.raised || 0) / event.goal) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <Link href={`/event/${event.id}`}
                    className={event.status === "expired" ? "pointer-events-none opacity-50" : ""}
                  >
                    <Button className="w-full mt-4 bg-transparent text-sm sm:text-base" variant="outline" disabled={event.status === "expired"}>
                      {event.status === "expired" ? "Event Expired" : "View Event Page"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <PartyPopper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Events Yet</h3>
            <p className="text-gray-500 mb-6">Be the first to create an event and inspire others!</p>
            <Link href={currentUser ? "/create" : "/auth"}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Create First Event
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose CelebrateWith.me?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Setup</h3>
              <p className="text-gray-600">Create your event page in minutes with our simple form.</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">Accept gifts via credit/debit card, powered by Paystack.</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Anywhere</h3>
              <p className="text-gray-600">Easily share your event link on WhatsApp, Facebook, and Instagram.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA and Footer... (Keep as is) */}
       {/* CTA Section */}
       <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Event?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of people who are making their celebrations more meaningful
          </p>
          <Link href={currentUser ? "/create" : "/auth"}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg"
            >
              <PartyPopper className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
          </Link>
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

export default HomePage
