"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, Loader2 } from "lucide-react"

export function DatabaseStatus() {
  const [status, setStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        success: false,
        message: "Failed to test connection",
        error: "Network error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          MongoDB Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Test MongoDB Connection
            </>
          )}
        </Button>

        {status && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {status.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={status.success ? "default" : "destructive"}>
                {status.success ? "Connected" : "Failed"}
              </Badge>
            </div>

            <p className="text-sm font-medium">{status.message}</p>

            {status.success && (
              <div className="text-xs text-gray-600 space-y-1">
                <p>Database: {status.database}</p>
                <p>Collections: {status.collections}</p>
                <p>Data Size: {status.dataSize} bytes</p>
              </div>
            )}

            {!status.success && status.troubleshooting && (
              <div className="text-xs text-red-600 space-y-1">
                <p className="font-semibold">Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{status.troubleshooting.checkConnectionString}</li>
                  <li>{status.troubleshooting.checkNetworkAccess}</li>
                  <li>{status.troubleshooting.checkCredentials}</li>
                </ul>
              </div>
            )}

            {status.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <p className="font-semibold">Error Details:</p>
                <p>{status.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
