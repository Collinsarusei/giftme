// lib/services/platformFeeService.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // Make sure ObjectId is imported

export interface PlatformFee {
  _id?: ObjectId; // Make _id optional
  eventId: string;
  amount: number;
  currency: string;
  timestamp: Date;
  relatedTransactionId: string;
  withdrawn?: boolean;
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

      // Ensure 'withdrawn' is explicitly set to false when recording a new fee
      // Destructure _id to ensure it's not passed to insertOne if undefined
      const { _id, ...feeToRecord } = { ...fee, withdrawn: false };

      const result = await collection.insertOne(feeToRecord);
      
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

      // Filter to only show fees that have not been withdrawn
      const fees = await collection.find({ withdrawn: { $ne: true } }).sort({ timestamp: -1 }).toArray();
      
      // Return fees as PlatformFee[], which now includes _id as optional
      return fees as PlatformFee[];

    } catch (error) {
      console.error("Error fetching platform fees:", error);
      return [];
    }
  }
}
