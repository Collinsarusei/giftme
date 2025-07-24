// app/api/admin/platform-fees/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export async function GET(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const eventsCollection = await getCollection('events');
        
        // Use aggregation pipeline to calculate the sum of developerFee for withdrawn gifts
        const result = await eventsCollection.aggregate([
            // 1. Unwind the gifts array to process each gift individually
            { $unwind: "$gifts" },
            // 2. Filter for gifts that have been successfully withdrawn
            { $match: { "gifts.status": "withdrawn" } },
            // 3. Group and sum the developerFee for all matched gifts
            { $group: {
                _id: null,
                totalPlatformFee: { $sum: "$gifts.developerFee" }
            }}
        ]).toArray();

        const totalFees = result.length > 0 ? result[0].totalPlatformFee : 0;

        return NextResponse.json({ success: true, totalPlatformFee: totalFees });

    } catch (error) {
        console.error("Failed to fetch platform fees:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
