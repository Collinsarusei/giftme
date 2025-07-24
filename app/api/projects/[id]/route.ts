// app/api/projects/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const COLLECTION_NAME = "projects"

// DELETE a project by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // A simple security check (in a real app, use proper auth)
    const adminUser = JSON.parse(request.headers.get('x-user') || '{}');
    if (adminUser.username !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 })
    }

    const collection = await getCollection(COLLECTION_NAME)
    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true, message: "Project deleted" })
    } else {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Failed to delete project:", error)
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
