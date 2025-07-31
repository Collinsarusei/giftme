// lib/services/platformFeeService.ts
import clientPromise from "@/lib/mongodb";

export interface PlatformFee {
  eventId: string;
  amount: number;
  currency: string;
  timestamp: Date;
  relatedTransactionId: string;
}

export class PlatformFeeService {
  /**
   * Records a new platform fee in the database.
   * This is typically called after a successful withdrawal payout.
   * @param fee - The platform fee object to record.
   */
  static async recordFee(fee: PlatformFee): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection("platform_fees");

      const result = await collection.insertOne(fee);
      
      console.log(`Platform fee of ${fee.amount} ${fee.currency} recorded for event ${fee.eventId}.`);
      return result.acknowledged;

    } catch (error) {
      console.error("Error recording platform fee:", error);
      return false;
    }
  }

  /**
   * Retrieves all recorded platform fees.
   * Intended for use in the admin dashboard.
   */
  static async getAllFees(): Promise<PlatformFee[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection("platform_fees");

      const fees = await collection.find({}).sort({ timestamp: -1 }).toArray();
      
      // The MongoDB driver returns _id, which we don't need to send to the client.
      // The data is safe, but this is good practice.
      return fees.map(({ _id, ...fee }) => fee) as PlatformFee[];

    } catch (error) {
      console.error("Error fetching platform fees:", error);
      return [];
    }
  }
}
