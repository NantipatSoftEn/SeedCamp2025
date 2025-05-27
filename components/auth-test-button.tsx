"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

export function AuthTestButton() {
  const [testing, setTesting] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<"success" | "error" | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Check if user is admin
  const isAdmin = user?.email === "admin@seedbkk.org"

  if (!isAdmin) {
    return null
  }

  const testAuthAndRLS = async () => {
    setTesting(true)
    try {
      const supabase = getSupabaseBrowserClient()

      // Test 1: Check if user is authenticated
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !currentUser) {
        throw new Error("User not authenticated")
      }

      // Test 2: Try to insert a test record (should work with RLS)
      const testRecord = {
        user_id: currentUser.id,
        person_id: "test-person-id",
        path: "test/path.jpg",
        original_name: "test.jpg",
        file_size: 1024,
        mime_type: "image/jpeg",
      }

      const { data: insertData, error: insertError } = await supabase
        .from("payment_slips")
        .insert(testRecord)
        .select()
        .single()

      if (insertError) {
        throw new Error(`Insert test failed: ${insertError.message}`)
      }

      // Test 3: Try to read the record back
      const { data: selectData, error: selectError } = await supabase
        .from("payment_slips")
        .select("*")
        .eq("id", insertData.id)
        .single()

      if (selectError) {
        throw new Error(`Select test failed: ${selectError.message}`)
      }

      // Test 4: Clean up - delete the test record
      const { error: deleteError } = await supabase.from("payment_slips").delete().eq("id", insertData.id)

      if (deleteError) {
        console.warn("Could not clean up test record:", deleteError.message)
      }

      setLastTestResult("success")
      toast({
        title: "Authentication & RLS Test Successful",
        description: `All tests passed for user: ${currentUser.email}`,
      })
    } catch (error) {
      console.error("Auth/RLS test failed:", error)
      setLastTestResult("error")
      toast({
        title: "Authentication & RLS Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Shield className="h-4 w-4" />
        Auth Test
        <Badge variant="destructive">Not Logged In</Badge>
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={testAuthAndRLS} disabled={testing} className="gap-2">
      {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
      Auth Test
      {lastTestResult && (
        <Badge variant={lastTestResult === "success" ? "default" : "destructive"}>
          {lastTestResult === "success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        </Badge>
      )}
    </Button>
  )
}
