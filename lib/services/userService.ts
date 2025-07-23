// lib/services/userService.ts
import { getCollection } from "../mongodb"
import type { User, CreateUserData } from "../models/User"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export class UserService {
  private static collectionName = "users"

  static async createUser(userData: CreateUserData): Promise<User> {
    const collection = await getCollection(this.collectionName)

    const existingUser = await collection.findOne({ username: userData.username })
    if (existingUser) {
      throw new Error("Username already exists")
    }

    const existingEmail = await collection.findOne({ email: userData.email })
    if (existingEmail) {
      throw new Error("Email already exists")
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const newUser: User = {
      id: new ObjectId().toString(),
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      events: [],
      profile: userData.profile || {},
    }

    const result = await collection.insertOne(newUser)
    return { ...newUser, _id: result.insertedId }
  }

  static async verifyUserCredentials(identifier: string, password_candidate: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const user = await collection.findOne({
      $or: [{ username: { $regex: `^${identifier}$`, $options: "i" } }, { email: { $regex: `^${identifier}$`, $options: "i" } }],
    })

    if (!user) {
      return null
    }

    const isMatch = await bcrypt.compare(password_candidate, user.password)
    if (!isMatch) {
      return null
    }

    const { _id, password, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  static async findUserByUsername(username: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({ username: { $regex: `^${username}$`, $options: "i" } })
    if (!result) {
        return null
    }
    const { _id, ...user } = result
    return user as User
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({ email: { $regex: `^${email}$`, $options: "i" } })
    if (!result) {
        return null
    }
    const { _id, ...user } = result
    return user as User
  }

  static async updateUser(username: string, updateData: Partial<User>): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateOne({ username }, { $set: updateData })
    return result.modifiedCount > 0
  }

  static async addEventToUser(username: string, eventId: string): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateOne({ username }, { $push: { events: eventId as any } })
    return result.modifiedCount > 0
  }

  static async getAllUsers(): Promise<User[]> {
    const collection = await getCollection(this.collectionName)
    const results = await collection.find({}).toArray()
    return results.map(({ _id, ...user }) => user as User)
  }
}
