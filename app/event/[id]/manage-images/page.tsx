"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ArrowLeft, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import type { Event } from "@/lib/models/Event"

export default function ManageImagesPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/events/${eventId}`)
        const data = await res.json()

        if (data.success && data.event) {
          setEvent(data.event)
          setCurrentImages(data.event.images || [])
        } else {
          setFormError(data.message || "Failed to load event.")
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        setFormError("Error loading event. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const MAX_WIDTH = 800; // Max width for resized image
          const MAX_HEIGHT = 600; // Max height for resized image
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert canvas to base64 with a lower quality for further compression
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Adjust quality (0.0 to 1.0)
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleNewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setFormSuccess(null);
    const files = Array.from(e.target.files || [])
    const totalImages = currentImages.length + newImages.length + files.length;

    if (totalImages > 3) {
      alert(`You can only have a maximum of 3 images. You are trying to add ${files.length}, which would result in ${totalImages} images.`);
      return;
    }

    if (files.length > 0) {
      setIsSubmitting(true); 
      const resizedImagePromises = files.map(file => resizeImage(file));
      try {
        const resizedBase64Images = await Promise.all(resizedImagePromises);
        // Convert Base64 back to File objects for consistent state management
        const resizedFiles = resizedBase64Images.map((base64String, index) => {
          const byteString = atob(base64String.split(',')[1]);
          const mimeString = base64String.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
          }
          return new File([ab], `new_image_${Date.now()}_${index}.jpeg`, { type: mimeString });
        });

        setNewImages((prev) => [...prev, ...resizedFiles]);
      } catch (error) {
        console.error("Error resizing new images:", error);
        setFormError("Failed to process new images. Please try smaller files.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const removeCurrentImage = (index: number) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const newImageUrls = await Promise.all(
        newImages.map(async (file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (error) => reject("Failed to read file: " + error);
            reader.readAsDataURL(file);
          });
        })
      );

      const updatedImages = [...currentImages, ...newImageUrls];

      if (updatedImages.length === 0) {
        setFormError("An event must have at least one image.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/events/${eventId}/update-images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: updatedImages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setFormSuccess("Images updated successfully!");
        // Optionally, refresh event data or redirect
        setNewImages([]); // Clear new images after successful upload
        // Re-fetch event to get the latest images from DB, or update state directly
        // For simplicity, let's re-fetch to ensure consistency
        const res = await fetch(`/api/events/${eventId}`);
        const updatedEventData = await res.json();
        if (updatedEventData.success && updatedEventData.event) {
          setEvent(updatedEventData.event);
          setCurrentImages(updatedEventData.event.images || []);
        }
      } else {
        setFormError(data.message || "Failed to update images.");
      }
    } catch (error) {
      console.error("Error updating images:", error);
      setFormError(`Failed to update images: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Event Not Found</h2>
        <p className="text-gray-700 mb-6">The event you are looking for does not exist or an error occurred.</p>
        <Link href="/dashboard" passHref>
          <Button><ArrowLeft className="mr-2 h-4 w-4"/> Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Manage Images for {event.name}
          </h1>
        </div>
      </header>

      {/* Form */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-center text-lg sm:text-xl">Update Event Images</CardTitle>
              <p className="text-center text-gray-600 text-sm sm:text-base">
                Add or remove images for your event. Maximum 3 images.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Current Images Display */}
                {(currentImages.length > 0 || newImages.length > 0) && (
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Current & New Images ({currentImages.length + newImages.length}/3)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {currentImages.map((imageSrc, index) => (
                        <div key={`current-${index}`} className="relative">
                          <img
                            src={imageSrc}
                            alt={`Current Image ${index + 1}`}
                            className="w-full h-16 sm:h-20 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 text-xs"
                            onClick={() => removeCurrentImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      {newImages.map((file, index) => (
                        <div key={`new-${index}`} className="relative">
                          <img
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={`New Upload ${index + 1}`}
                            className="w-full h-16 sm:h-20 object-cover rounded border-2 border-blue-400"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 text-xs"
                            onClick={() => removeNewImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Blue border indicates newly added images.</p>
                  </div>
                )}

                {/* Image Upload Input for New Images */}
                {(currentImages.length + newImages.length < 3) && (
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Upload More Pictures (Up to {3 - (currentImages.length + newImages.length)} more)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          Click to upload or drag and drop your celebration photos
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleNewImageUpload}
                          className="hidden"
                          id="new-image-upload"
                        />
                        <Label htmlFor="new-image-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span className="text-xs sm:text-sm">Choose Photos</span>
                          </Button>
                        </Label>
                      </div>
                    </div>
                )}
                
                {formError && (
                  <div className="text-red-500 text-sm text-center p-2 border border-red-300 bg-red-50 rounded">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="text-green-600 text-sm text-center p-2 border border-green-300 bg-green-50 rounded">
                    {formSuccess}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-sm sm:text-base"
                  disabled={isSubmitting || (currentImages.length + newImages.length === 0)}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating Images...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Save Images
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
