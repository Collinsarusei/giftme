import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  id?: string
  username: string
  email: string
  password: string // Hashed password
  createdAt: string
  events: string[] // Array of event IDs
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    bio?: string
  }
}

export interface CreateUserData {
  username: string
  email: string
  password: string // Hashed password
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    bio?: string
  }
}
