// lib/services/eventService.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import type { Gift, Event } from '@/lib/models/Event'; // Import the main Event type

export class EventService {
  /**
   * Creates a new event.
   * @param event The event object to create.
   * @returns A promise that resolves to the newly created Event object.
   */
  static async createEvent(event: Event): Promise<Event | null> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");
      const result = await collection.insertOne(event);
      if (result.acknowledged) {
        return { ...event, _id: result.insertedId };
      }
      return null;
    } catch (error) {
      console.error("Error creating event:", error);
      return null;
    }
  }

  /**
   * Fetches a single event by its ID.
   * @param eventId The ID of the event to fetch.
   * @returns A promise that resolves to an Event object or null if not found.
   */
  static async getEventById(eventId: string): Promise<Event | null> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");
      // Find an event by its 'id' field
      const event = await collection.findOne({ id: eventId });
      return event;
    } catch (error) {
      console.error("Error fetching event by ID:", error);
      return null;
    }
  }

  /**
   * Increments the view count for a specific event.
   * @param eventId The ID of the event to increment views for.
   * @returns A promise that resolves to true if the view count was incremented, false otherwise.
   */
  static async incrementViews(eventId: string): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      const result = await collection.updateOne(
        { id: eventId },
        { $inc: { views: 1 } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error incrementing event views:", error);
      return false;
    }
  }

  /**
   * Toggles the like status of an event.
   * @param eventId The ID of the event to like/unlike.
   * @param liked Boolean indicating whether the event is being liked (true) or unliked (false).
   * @returns A promise that resolves to true if the like count was updated, false otherwise.
   */
  static async toggleLikeEvent(eventId: string, liked: boolean): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      const updateValue = liked ? 1 : -1;
      const result = await collection.updateOne(
        { id: eventId },
        { $inc: { likes: updateValue } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error toggling event like:", error);
      return false;
    }
  }

  /**
   * Adds a new gift to an event and updates the total raised amount.
   * @param eventId The ID of the event to add the gift to.
   * @param gift The gift object to add.
   * @param amountToRaise The amount to increment the event's 'raised' field by.
   */
  static async addGiftToEvent(eventId: string, gift: Gift, amountToRaise: number): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      // By specifying <Event>, we make TypeScript aware of the document structure.
      const collection = db.collection<Event>("events");

      const result = await collection.updateOne(
        { id: eventId },
        {
          $push: { gifts: gift }, // This is now type-safe and no longer causes an error.
          $inc: {
            raised: amountToRaise,
            giftCount: 1,
          },
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error adding gift to event:", error);
      return false;
    }
  }

  /**
   * Updates the status of multiple gifts within a single event.
   * @param eventId The ID of the event containing the gifts.
   * @param giftIds An array of gift IDs to update.
   * @param newStatus The new status to set for the gifts.
   */
  static async updateGiftStatuses(eventId: string, giftIds: string[], newStatus: 'withdrawn' | 'pending_withdrawal' | 'completed'): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      const result = await collection.updateOne(
        { id: eventId },
        { $set: { "gifts.$[elem].status": newStatus } },
        { arrayFilters: [{ "elem.id": { $in: giftIds } }] }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating gift statuses:", error);
      return false;
    }
  }

  /**
   * Updates an event with a new Paystack recipient code for future withdrawals.
   * @param eventId The ID of the event to update.
   * @param recipientCode The new Paystack recipient code.
   */
  static async updateEventRecipientCode(eventId: string, recipientCode: string): Promise<boolean> {
      try {
          const client = await clientPromise;
          const db = client.db();
          const collection = db.collection<Event>("events");

          const result = await collection.updateOne(
              { id: eventId },
              { $set: { recipientCode: recipientCode } }
          );

          console.log(`Updated event ${eventId} with new recipient code.`);
          return result.modifiedCount > 0;

      } catch (error) {
          console.error("Error updating event recipient code:", error);
          return false;
      }
  }

  /**
   * Fetches all events created by a specific user, regardless of their status.
   * Used for the creator's dashboard.
   * @param createdBy The username of the creator.
   * @returns A promise that resolves to an array of Event objects.
   */
  static async getEventsByCreator(createdBy: string): Promise<Event[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");
      // Find all events where 'createdBy' matches the provided username
      const events = await collection.find({ createdBy: createdBy }).toArray();
      return events;
    } catch (error) {
      console.error("Error fetching events by creator:", error);
      return [];
    }
  }

  /**
   * Fetches events suitable for the public homepage (active and expired, but not cancelled).
   * @param limit The maximum number of events to return.
   * @returns A promise that resolves to an array of Event objects.
   */
  static async getPublicEvents(limit?: number): Promise<Event[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      // Find events that are 'active' or 'expired', and not 'cancelled'
      let query: { status: { $in: Array<Event['status']> } } = {
        status: { $in: ["active", "expired"] }
      };

      let cursor = collection.find(query);

      if (limit) {
        cursor = cursor.limit(limit);
      }

      const events = await cursor.toArray();
      return events;
    } catch (error) {
      console.error("Error fetching public events:", error);
      return [];
    }
  }

    /**
   * Searches events based on a query string.
   * Returns events that are 'active' or 'expired'.
   * @param query The search string.
   * @returns A promise that resolves to an array of matching Event objects.
   */
  static async searchEvents(query: string): Promise<Event[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

      // Search in name, description, creatorName, or type fields
      const events = await collection.find({
        status: { $in: ["active", "expired"] }, // Only search active/expired events
        $or: [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { creatorName: { $regex: searchRegex } },
          { type: { $regex: searchRegex } },
        ],
      }).toArray();
      return events;
    } catch (error) {
      console.error("Error searching events:", error);
      return [];
    }
  }

  /**
   * Fetches all events from the database, regardless of status.
   * @returns A promise that resolves to an array of Event objects.
   */
  static async getAllEvents(): Promise<Event[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");
      const events = await collection.find({}).toArray();
      return events;
    } catch (error) {
      console.error("Error fetching all events:", error);
      return [];
    }
  }

    /**
   * Updates the status of an event.
   * @param eventId The ID of the event to update.
   * @param newStatus The new status to set for the event.
   * @returns A promise that resolves to true if the event was updated, false otherwise.
   */
  static async updateEventStatus(eventId: string, newStatus: "active" | "completed" | "cancelled" | "expired" | "deleted"): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      const result = await collection.updateOne(
        { id: eventId },
        { $set: { status: newStatus } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating event status:", error);
      return false;
    }
  }

  /**
   * Soft deletes an event by updating its status to "deleted".
   * @param eventId The ID of the event to delete.
   * @returns A promise that resolves to true if the event was deleted, false otherwise.
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      const result = await collection.updateOne(
        { id: eventId },
        { $set: { status: "deleted" } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  }

  /**
   * Marks events that have passed their `expiresAt` date as "expired".
   * @returns A promise that resolves to an array of the newly expired Event objects.
   */
  static async expirePastEvents(): Promise<Event[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<Event>("events");

      const now = new Date().toISOString();

      const result = await collection.updateMany(
        {
          status: "active", // Only active events can expire
          expiresAt: { $lt: now },
        },
        {
          $set: { status: "expired" },
        }
      );

      // Fetch the events that were just expired to return them
      if (result.modifiedCount > 0) {
        const newlyExpiredEvents = await collection.find({
          status: "expired",
          expiresAt: { $lt: now }, // Re-query with the same condition to get the updated docs
        }).toArray();
        return newlyExpiredEvents;
      }

      return [];
    } catch (error) {
      console.error("Error expiring past events:", error);
      return [];
    }
  }
}
