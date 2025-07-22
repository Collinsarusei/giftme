import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing MongoDB connection...")

    // Test the connection
    const db = await getDatabase()

    // Try to ping the database
    await db.admin().ping()

    console.log("✅ MongoDB connection successful!")

    // Get database stats
    const stats = await db.stats()

    return NextResponse.json({
      success: true,
      message: "✅ MongoDB connection successful!",
      database: db.databaseName,
      collections: stats.collections || 0,
      dataSize: stats.dataSize || 0,
    })
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "❌ MongoDB connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        troubleshooting: {
          checkConnectionString: "Verify MONGODB_URI in environment variables",
          checkNetworkAccess: "Ensure IP address is whitelisted in MongoDB Atlas",
          checkCredentials: "Verify username and password in connection string",
        },
      },
      { status: 500 },
    )
  }
}
