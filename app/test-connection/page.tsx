"use client"

import { DatabaseStatus } from "@/components/database-status"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TestConnectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Database Connection Test
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <DatabaseStatus />
        </div>
      </div>
    </div>
  )
}
