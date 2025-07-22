import { getCollection } from "../mongodb"
import type { Event, CreateEventData, Gift } from "../models/Event"

export class EventService {
  private static collectionName = "events"

  static async createEvent(eventData: CreateEventData): Promise<Event> {
    const collection = await getCollection(this.collectionName)

    const eventId = `${eventData.createdBy.toLowerCase().replace(/\s+/g, "-")}-${eventData.type.toLowerCase()}-${Date.now()}`

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
    }

    const result = await collection.insertOne(newEvent)
    return { ...newEvent, _id: result.insertedId }
  }

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
    const results = await collection.find({ status: "active" }).sort({ createdAt: -1 }).limit(limit).toArray()
    return results.map(({ _id, ...event }) => event as Event)
  }

  static async incrementViews(eventId: string): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateOne({ id: eventId }, { $inc: { views: 1 } })
    return result.modifiedCount > 0
  }

  static async addGiftToEvent(eventId: string, gift: Gift): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateOne(
      { id: eventId },
      {
        $push: { gifts: gift as any },
        $inc: {
          raised: gift.amount,
          giftCount: 1,
        },
      },
    )
    return result.modifiedCount > 0
  }

  static async updateGiftStatus(
    eventId: string,
    giftId: string,
    status: string,
    withdrawnAt?: string,
  ): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const updateData: any = { "gifts.$.status": status }
    if (withdrawnAt) {
      updateData["gifts.$.withdrawnAt"] = withdrawnAt
    }

    const result = await collection.updateOne({ id: eventId, "gifts.id": giftId }, { $set: updateData })
    return result.modifiedCount > 0
  }

  static async searchEvents(query: string): Promise<Event[]> {
    const collection = await getCollection(this.collectionName)
    const results = await collection
      .find({
        status: "active",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { type: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()
    return results.map(({ _id, ...event }) => event as Event)
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    const collection = await getCollection(this.collectionName)
    const result = await collection.updateOne({ id: eventId }, { $set: { status: "cancelled" } })
    return result.modifiedCount > 0
  }

  static async expirePastEvents(): Promise<Event[]> {
    const collection = await getCollection(this.collectionName)
    // Calculate the date string for (today - 1 day)
    const now = new Date()
    const graceDate = new Date(now)
    graceDate.setDate(now.getDate() - 1)
    const graceDateStr = graceDate.toISOString().split('T')[0]
    // Find all active events with date before graceDateStr
    const expiredEvents = await collection.find({ status: "active", date: { $lt: graceDateStr } }).toArray()
    if (expiredEvents.length > 0) {
      await collection.updateMany({ status: "active", date: { $lt: graceDateStr } }, { $set: { status: "cancelled" } })
    }
    // Remove _id from each event for type safety
    return expiredEvents.map(({ _id, ...rest }) => rest as Event)
  }
}
