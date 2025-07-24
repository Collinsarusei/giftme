// lib/services/eventService.ts
import { getCollection } from "../mongodb"
import type { Event, CreateEventData, Gift, Comment } from "../models/Event" // Import Comment

export class EventService {
  private static collectionName = "events"

  static async createEvent(eventData: CreateEventData): Promise<Event> {
    const collection = await getCollection(this.collectionName)
    const eventId = `${eventData.createdBy.toLowerCase().replace(/\s+/g, "-")}-${eventData.type.toLowerCase()}-${Date.now()}`
    const eventDate = new Date(eventData.date)
    const expiresAt = new Date(eventDate)
    expiresAt.setDate(eventDate.getDate() + 1)

    const newEvent: Event = {
      id: eventId,
      name: eventData.name,
      type: eventData.type,
      date: eventData.date,
      mpesaNumber: eventData.mpesaNumber,
      description: eventData.description,
      images: eventData.images,
      raised: 0,
      goal: eventData.goal,
      currency: eventData.currency,
      giftCount: 0,
      views: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
      creatorName: eventData.creatorName,
      createdBy: eventData.createdBy,
      gifts: [],
      status: "active",
      expiresAt: expiresAt.toISOString(),
      likes: 0, // Initialize likes
      comments: [], // Initialize comments
    }

    const result = await collection.insertOne(newEvent)
    return { ...newEvent, _id: result.insertedId }
  }

  // ... (getEventById, getEventsByCreator, etc. remain the same)
  static async getEventById(eventId: string): Promise<Event | null> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.findOne({ id: eventId })
    if (!result) return null
    const { _id, ...event } = result
    return event as Event
  }

  static async getEventsByCreator(createdBy: string): Promise<Event[]> {
    const collection = await getCollection(this.collectionName)
    const results = await collection.find({ createdBy }).sort({ createdAt: -1 }).toArray()
    return results.map(({ _id, ...event }) => event as Event)
  }

  static async getAllActiveEvents(limit = 10): Promise<Event[]> {
    const collection = await getCollection(this.collectionName)
    const now = new Date().toISOString()
    const results = await collection.find({ status: "active", expiresAt: { $gte: now } }).sort({ createdAt: -1 }).limit(limit).toArray()
    return results.map(({ _id, ...event }) => event as Event)
  }

  static async incrementViews(eventId: string): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateOne({ id: eventId }, { $inc: { views: 1 } })
    return result.modifiedCount > 0
  }

  static async addGiftToEvent(eventId: string, gift: Gift, netAmount: number): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    // Check if the gift already exists to prevent duplicates from webhook retries
    const event = await collection.findOne({ id: eventId, "gifts.transactionId": gift.transactionId })
    if (event) {
      console.warn(`Attempted to add a duplicate gift with transaction ID ${gift.transactionId}. Ignoring.`)
      return false
    }

    const result = await collection.updateOne(
      { id: eventId },
      {
        $push: { gifts: gift as any },
        $inc: {
          raised: netAmount, // Use the netAmount for the 'raised' field
          giftCount: 1,
        },
      }
    )
    return result.modifiedCount > 0
  }

  static async updateManyGiftStatuses(
    eventId: string,
    giftIds: string[],
    status: "completed" | "pending" | "pending_withdrawal" | "withdrawn",
  ): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateMany(
      { id: eventId, "gifts.id": { $in: giftIds } },
      { $set: { "gifts.$.status": status, "gifts.$.withdrawnAt": new Date().toISOString() } }
    )
    return result.modifiedCount > 0
  }
  static async deleteEvent(eventId: string): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateOne({ id: eventId }, { $set: { status: "cancelled" } })
    return result.modifiedCount > 0
  }


  // New methods for likes and comments
  static async toggleLikeEvent(eventId: string, liked: boolean): Promise<boolean> {
    const collection = await getCollection(this.collectionName);
    const increment = liked ? 1 : -1;
    const result = await collection.updateOne({ id: eventId }, { $inc: { likes: increment } });
    return result.modifiedCount > 0;
  }

  static async addCommentToEvent(eventId: string, comment: Comment): Promise<boolean> {
    const collection = await getCollection(this.collectionName);
    const result = await collection.updateOne({ id: eventId }, { $push: { comments: comment as any } });
    return result.modifiedCount > 0;
  }
}
