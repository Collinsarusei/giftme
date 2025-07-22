import type { ObjectId } from "mongodb"

export interface DeveloperGift {
  _id?: ObjectId
  id: string
  from: string
  amount: number
  currency: string
  message?: string
  timestamp: string
  paymentMethod: "mpesa" | "paystack"
  type: "developer_support"
  status: "completed" | "pending"
}
