"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function PhoneInput({ value, onChange, label = "Phone Number", placeholder, required }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [formattedPreview, setFormattedPreview] = useState("")

  // Format phone number for preview
  const formatPhonePreview = (phone: string) => {
    if (!phone) return ""

    const cleaned = phone.replace(/\D/g, "")

    if (cleaned.startsWith("0")) {
      return `${phone} → 254${cleaned.slice(1)}`
    } else if (cleaned.startsWith("7") && cleaned.length === 9) {
      return `${phone} → 254${cleaned}`
    } else if (cleaned.startsWith("1") && cleaned.length === 9) {
      return `${phone} → 2547${cleaned}`
    } else if (cleaned.startsWith("254")) {
      return phone // Already formatted
    } else if (cleaned.length === 9) {
      return `${phone} → 254${cleaned}`
    }

    return phone
  }

  useEffect(() => {
    setFormattedPreview(formatPhonePreview(displayValue))
  }, [displayValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">
        {label} {required && "*"}
      </Label>
      <Input
        id="phone"
        type="tel"
        placeholder={placeholder || "0712345678 or 254712345678"}
        value={displayValue}
        onChange={handleChange}
        required={required}
      />
      {formattedPreview && displayValue && <p className="text-xs text-gray-500">Format: {formattedPreview}</p>}
      <p className="text-xs text-gray-400">Accepts: 0712345678, 712345678, 254712345678</p>
    </div>
  )
}
