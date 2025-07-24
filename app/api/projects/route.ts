// app/api/projects/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import type { Project } from "@/lib/models/Project"

const COLLECTION_NAME = "projects"

// GET all projects
export async function GET() {
  try {
    const collection = await getCollection(COLLECTION_NAME)
    const projects = await collection.find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ success: true, projects })
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}

// POST a new project
export async function POST(request: NextRequest) {
  try {
    // A simple security check (in a real app, use proper auth)
    const adminUser = JSON.parse(request.headers.get('x-user') || '{}');
    if (adminUser.username !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { name, url } = await request.json()
    if (!name || !url) {
      return NextResponse.json({ success: false, message: "Name and URL are required" }, { status: 400 })
    }

    const collection = await getCollection(COLLECTION_NAME)
    const newProject: Omit<Project, '_id'> = {
      name,
      url,
      createdAt: new Date().toISOString(),
    }
    const result = await collection.insertOne(newProject)

    return NextResponse.json({ success: true, project: { ...newProject, _id: result.insertedId } }, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
