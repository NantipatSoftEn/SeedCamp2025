"use client"

import { Database, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDataSource } from "@/contexts/data-source-context"

export function SimpleDataToggle() {
  const { dataSource, setDataSource } = useDataSource()

  const toggleDataSource = () => {
    setDataSource(dataSource === "mock" ? "supabase" : "mock")
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleDataSource} className="gap-2">
      {dataSource === "mock" ? (
        <>
          <FileJson className="h-4 w-4" />
          Switch to Live Data
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Switch to Mock Data
        </>
      )}
    </Button>
  )
}
