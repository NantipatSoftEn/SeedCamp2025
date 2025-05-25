"use client"

import { useState } from "react"
import { Bug, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDataSource } from "@/contexts/data-source-context"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { dataSource, isDevelopment, isClient } = useDataSource()

  // แสดงเฉพาะใน development mode
  if (!isDevelopment) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Panel
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="h-6 w-6 p-0">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {isOpen && (
          <CardContent className="pt-0 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Environment:</span>
                <Badge variant={isDevelopment ? "default" : "secondary"} className="ml-1">
                  {isDevelopment ? "DEV" : "PROD"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Client:</span>
                <Badge variant={isClient ? "default" : "secondary"} className="ml-1">
                  {isClient ? "Ready" : "Loading"}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Data Source:</span>
                <Badge variant={dataSource === "mock" ? "outline" : "default"} className="ml-1">
                  {dataSource === "mock" ? "Mock Data" : "Supabase"}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">URL:</span>
                <div className="text-xs text-gray-400 break-all">
                  {isClient ? window.location.hostname : "Loading..."}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
