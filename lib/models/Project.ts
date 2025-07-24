// lib/models/Project.ts
import type { ObjectId } from "mongodb"

export interface Project {
  _id?: ObjectId
  name: string
  url: string
  createdAt: string
}
