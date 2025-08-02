// app/api/admin/gifts/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export async function GET(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');

        if (userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const collection = await getCollection('developerGifts'); // Corrected collection name
        const gifts = await collection.find({ status: 'completed' }).sort({ timestamp: -1 }).toArray();

        return NextResponse.json({ success: true, gifts });

    } catch (error) {
        console.error("Failed to fetch admin gifts:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
