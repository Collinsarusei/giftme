"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ArrowLeft, PartyPopper, GraduationCap, Heart, Baby, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const eventTypes = [
  { value: "birthday", label: "Birthday", icon: PartyPopper },
  { value: "graduation", label: "Graduation", icon: GraduationCap },
  { value: "wedding", label: "Wedding", icon: Heart },
  { value: "baby-shower", label: "Baby Shower", icon: Baby },
  { value: "anniversary", label: "Anniversary", icon: Heart },
  { value: "other", label: "Other Celebration", icon: Calendar },
]

export default function CreateEventPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    eventType: "",
    userName: "",
    eventDate: "",
    mpesaNumber: "",
    fundraisingGoal: "",
    description: "",
    images: [] as File[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (authData.success && authData.user) {
          setCurrentUser(authData.user);
          setFormData((prev) => ({ ...prev, userName: authData.user.username }));
        } else {
          router.push("/auth"); // Redirect to login if not authenticated
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        router.push("/auth"); // Redirect on any auth error
      }
    }
    fetchCurrentUser();
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = 3 - formData.images.length
    const filesToAdd = files.slice(0, remainingSlots)

    if (filesToAdd.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...filesToAdd],
      }))
    }

    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`)
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convert images to base64 for storage
      const imageUrls = await Promise.all(
        formData.images.map(async (file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
        }),
      )

      const eventData = {
        eventType: formData.eventType,
        userName: formData.userName,
        eventDate: formData.eventDate,
        mpesaNumber: formData.mpesaNumber,
        fundraisingGoal: formData.fundraisingGoal,
        description: formData.description,
        images: imageUrls,
        createdBy: currentUser.username,
      }

      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to the created event page
        router.push(`/event/${data.event.id}?new=true`)
      } else {
        alert(data.message || "Failed to create event")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Failed to create event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading if user not authenticated yet
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Your Event
          </h1>
        </div>
      </header>

      {/* Form */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-center text-lg sm:text-xl">Let's Create Your Celebration Page</CardTitle>
              <p className="text-center text-gray-600 text-sm sm:text-base">
                Fill in the details below to create your personalized event page
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Event Type */}
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* User Name */}
                <div className="space-y-2">
                  <Label htmlFor="userName">Your Name *</Label>
                  <Input
                    id="userName"
                    placeholder="e.g., John Doe"
                    value={formData.userName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, userName: e.target.value }))}
                    required
                  />
                </div>

                {/* Event Date */}
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eventDate: e.target.value }))}
                    required
                  />
                </div>

                {/* M-Pesa Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="mpesaNumber">Your M-Pesa Phone Number *</Label>
                  <Input
                    id="mpesaNumber"
                    placeholder="254712345678"
                    value={formData.mpesaNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mpesaNumber: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-gray-500">M-Pesa gifts will be sent directly to this number</p>
                  <p className="text-xs text-red-500">This must be a Safaricom number, e.g., 2547XXXXXXXX</p>
                </div>

                {/* Fundraising Goal (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="fundraisingGoal">Fundraising Goal (Optional)</Label>
                  <Input
                    id="fundraisingGoal"
                    type="number"
                    placeholder="25000"
                    value={formData.fundraisingGoal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fundraisingGoal: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Leave empty if you don't want to show a goal</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Share a special message about your celebration..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Upload Pictures (1-3 images)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop your celebration photos
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span className="text-xs sm:text-sm">Choose Photos</span>
                      </Button>
                    </Label>
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-16 sm:h-20 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 text-xs"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">{formData.images.length}/3 images selected</p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-sm sm:text-base"
                  disabled={
                    isSubmitting ||
                    !formData.eventType ||
                    !formData.userName ||
                    !formData.eventDate ||
                    !formData.mpesaNumber
                  }
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Your Event...
                    </>
                  ) : (
                    <>
                      <PartyPopper className="mr-2 h-4 w-4" />
                      Create Event Page
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
