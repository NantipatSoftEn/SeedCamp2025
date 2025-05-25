"use client"

import { useState } from "react"
import { Bug, ChevronDown, ChevronUp, Database, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDataSource } from "@/contexts/data-source-context"

export function EditDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { dataSource, isDevelopment } = useDataSource()

  // แสดงเฉพาะใน development mode
  if (!isDevelopment) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Edit Debug Panel
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="h-6 w-6 p-0">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {isOpen && (
          <CardContent className="pt-0 space-y-2">
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Data Source:</span>
                <div className="flex items-center gap-1">
                  {dataSource === "mock" ? <FileJson className="h-3 w-3" /> : <Database className="h-3 w-3" />}
                  <Badge variant={dataSource === "mock" ? "outline" : "default"} className="text-xs">
                    {dataSource === "mock" ? "Mock Data" : "Supabase"}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                💡 Tips:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check console (F12) for update logs</li>
                  <li>Look for ✅ success or ❌ error messages</li>
                  <li>Toast notifications show update status</li>
                  {dataSource === "supabase" && <li>Check Supabase dashboard for real updates</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
