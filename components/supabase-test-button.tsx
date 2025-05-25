"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Loader2, CheckCircle, XCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function SupabaseTestButton() {
  const [testing, setTesting] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<"success" | "error" | null>(null)
  const { toast } = useToast()

  const testConnection = async () => {
    setTesting(true)
    try {
      const supabase = getSupabaseBrowserClient()

      // Test basic connection
      const { count, error } = await supabase.from("seedcamp_people").select("*", { count: "exact", head: true })

      if (error) {
        throw error
      }

      setLastTestResult("success")
      toast({
        title: "Supabase connection successful",
        description: `Found ${count} records in database`,
      })
    } catch (error) {
      console.error("Supabase test failed:", error)
      setLastTestResult("error")
      toast({
        title: "Supabase connection failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={testConnection} disabled={testing} className="gap-2">
      {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
      Test Supabase
      {lastTestResult && (
        <Badge variant={lastTestResult === "success" ? "default" : "destructive"}>
          {lastTestResult === "success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        </Badge>
      )}
    </Button>
  )
}
