import { getCollection } from "../mongodb"
import type { User, CreateUserData } from "../models/User"
import { ObjectId } from "mongodb"

export class UserService {
  private static collectionName = "users"

  static async createUser(userData: CreateUserData): Promise<User> {
    const collection = await getCollection(this.collectionName)

    // Check if username already exists
    const existingUser = await collection.findOne({ username: userData.username })
    if (existingUser) {
      throw new Error("Username already exists")
    }

    // Check if email already exists
    const existingEmail = await collection.findOne({ email: userData.email })
    if (existingEmail) {
      throw new Error("Email already exists")
    }

    const newUser: User = {
      id: new ObjectId().toString(),
      username: userData.username,
      email: userData.email,
      createdAt: new Date().toISOString(),
      events: [],
      profile: userData.profile || {},
    }

    const result = await collection.insertOne(newUser)
    return { ...newUser, _id: result.insertedId }
  }

  static async getUserByCredentials(username: string, email: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({ username, email })
    if (!result) return null
    const { _id, ...user } = result
    return user as User
  }

  static async findUserByUsername(username: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({ username: { $regex: `^${username}$`, $options: "i" } })
    if (!result) return null
    const { _id, ...user } = result
    return user as User
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({ email: { $regex: `^${email}$`, $options: "i" } })
    if (!result) return null
    const { _id, ...user } = result
    return user as User
  }

  static async findUserByUsernameOrEmail(username: string, email: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({
      $or: [
        { username: { $regex: `^${username}$`, $options: "i" } },
        { email: { $regex: `^${email}$`, $options: "i" } },
      ],
    })
    if (!result) return null
    const { _id, ...user } = result
    return user as User
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({ username })
    if (!result) return null
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
