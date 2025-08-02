// app/api/admin/platform-fees/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { PlatformFeeService } from "@/lib/services/platformFeeService";

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export async function GET(request: NextRequest) {
    try {
        const userEmail = request.headers.get('x-user-email');
        if (userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        // Use the PlatformFeeService to get all fees
        const allFees = await PlatformFeeService.getAllFees();
        
        // Sum the amounts to get the total platform fee
        const totalPlatformFee = allFees.reduce((sum, fee) => sum + fee.amount, 0);

        return NextResponse.json({ success: true, totalPlatformFee: totalPlatformFee });

    } catch (error) {
        console.error("Failed to fetch platform fees:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
