"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TestTube, Loader2, CheckCircle, XCircle } from "lucide-react"
import { supabaseStorage } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

export function StorageTestButton() {
  const [testing, setTesting] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<"success" | "error" | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Check if user is admin
  const isAdmin = user?.email === "admin@seedbkk.org"

  // Don't render if not admin
  if (!isAdmin) {
    return null
  }

  const testStorage = async () => {
    setTesting(true)
    try {
      const result = await supabaseStorage.testConnection()

      setLastTestResult(result.success ? "success" : "error")
      toast({
        title: result.success ? "Storage connection successful" : "Storage connection failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Storage test failed:", error)
      setLastTestResult("error")
      toast({
        title: "Storage test failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={testStorage} disabled={testing} className="gap-2">
      {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
      Test Storage
      {lastTestResult && (
        <Badge variant={lastTestResult === "success" ? "default" : "destructive"}>
          {lastTestResult === "success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        </Badge>
      )}
    </Button>
  )
}
