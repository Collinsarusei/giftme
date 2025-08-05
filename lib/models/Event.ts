// lib/models/Event.ts
import type { ObjectId } from "mongodb"

export interface Gift {
  id: string
  from: string
  email: string
  amount: number
  currency: string
  message?: string
  timestamp: string
  paymentMethod: "mpesa" | "paystack"
  status: "completed" | "pending" | "pending_withdrawal" | "withdrawn"
  transactionId?: string
  withdrawnAt?: string
  developerFee?: number
}

export interface Comment {
    id: string;
    from: string;
    message: string;
    timestamp: string;
}

export interface Event {
  _id?: ObjectId
  id: string
  name: string
  type: string
  date: string
  mpesaNumber: string
  description?: string
  images: string[]
  raised: number
  goal?: number
  currency: string
  giftCount: number
  views: number
  shares: number
  createdAt: string
  creatorName: string
  createdBy: string
  creatorEmail?: string; // Added this field
  gifts: Gift[]
  status: "active" | "completed" | "cancelled" | "expired" | "deleted"
  expiresAt: string
  likes: number; // New field for likes
  comments: Comment[]; // New field for comments
}

export interface CreateEventData {
  name: string
  type: string
  date: string
  mpesaNumber: string
  description?: string
  images: string[]
  goal?: number
  currency: string
  creatorName: string
  createdBy: string
  creatorEmail?: string; // Added this field
}
