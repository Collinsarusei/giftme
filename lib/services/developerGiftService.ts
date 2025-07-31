// lib/services/developerGiftService.ts
import clientPromise from "@/lib/mongodb";
import type { DeveloperGift } from '@/lib/models/DeveloperGift';

export class DeveloperGiftService {
  /**
   * Adds a new developer gift to the database.
   * @param gift The developer gift object to add.
   * @returns A promise that resolves to true if the gift was added, false otherwise.
   */
  static async addDeveloperGift(gift: DeveloperGift): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<DeveloperGift>("developerGifts");
      const result = await collection.insertOne(gift);
      return result.acknowledged;
    } catch (error) {
      console.error("Error adding developer gift:", error);
      return false;
    }
  }

  /**
   * Fetches all developer gifts from the database.
   * @returns A promise that resolves to an array of DeveloperGift objects.
   */
  static async getAllDeveloperGifts(): Promise<DeveloperGift[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection<DeveloperGift>("developerGifts");
      const gifts = await collection.find({}).toArray();
      return gifts;
    } catch (error) {
      console.error("Error fetching developer gifts:", error);
      return [];
    }
  }
}
