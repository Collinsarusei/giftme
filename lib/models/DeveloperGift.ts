// lib/models/DeveloperGift.ts
import type { ObjectId } from "mongodb"

// This interface is very similar to the regular Gift,
// but it's kept separate to avoid mixing user funds with developer funds.
export interface DeveloperGift {
  _id?: ObjectId
  id: string
  from: string
  email: string
  amount: number
  currency: string
  message?: string
  timestamp: string
  paymentMethod: "paystack"
  status: "completed" | "withdrawn"
  transactionId?: string
  withdrawnAt?: string
}
