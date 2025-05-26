"use client"

import { useState } from "react"
import { Database, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useDataSource } from "@/contexts/data-source-context"

export function RLSDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const { user } = useAuth()
  const { isDevelopment } = useDataSource()
  const supabase = getSupabaseBrowserClient()

  // แสดงเฉพาะใน development mode
  if (!isDevelopment) {
    return null
  }

  const runRLSTests = async () => {
    setTesting(true)
    const results: any = {
      authentication: null,
      session: null,
      policies: null,
      permissions: null,
      insertTest: null,
    }

    try {
      // Test 1: Authentication
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()
      results.authentication = {
        success: !userError && !!currentUser,
        data: currentUser ? { id: currentUser.id, email: currentUser.email } : null,
        error: userError?.message,
      }

      // Test 2: Session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      results.session = {
        success: !sessionError && !!session,
        data: session
          ? {
              expires_at: session.expires_at,
              access_token: session.access_token ? "Present" : "Missing",
            }
          : null,
        error: sessionError?.message,
      }

      // Test 3: Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .rpc("get_table_policies", { table_name: "payment_slips" })
        .then(() => ({ data: "RPC not available", error: null }))
        .catch(() => ({ data: null, error: "Could not fetch policies" }))

      results.policies = {
        success: !policiesError,
        data: policies,
        error: policiesError,
      }

      // Test 4: Try to insert a test record
      if (currentUser) {
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

        results.insertTest = {
          success: !insertError,
          data: insertData ? { id: insertData.id } : null,
          error: insertError?.message,
        }

        // Clean up if successful
        if (insertData) {
          await supabase.from("payment_slips").delete().eq("id", insertData.id)
        }
      }
    } catch (error) {
      results.error = error instanceof Error ? error.message : "Unknown error"
    }

    setTestResults(results)
    setTesting(false)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-96">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              RLS Debug Panel
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="h-6 w-6 p-0">
              {isOpen ? "−" : "+"}
            </Button>
          </CardTitle>
        </CardHeader>
        {isOpen && (
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current User:</span>
              <Badge variant={user ? "default" : "destructive"}>{user ? user.email : "Not logged in"}</Badge>
            </div>

            <Button onClick={runRLSTests} disabled={testing || !user} size="sm" className="w-full">
              {testing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Testing...
                </>
              ) : (
                <>
                  <Database className="h-3 w-3 mr-1" />
                  Test RLS & Auth
                </>
              )}
            </Button>

            {testResults && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex justify-between">
                    <span>Authentication:</span>
                    <Badge
                      variant={testResults.authentication?.success ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {testResults.authentication?.success ? "✅" : "❌"}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>Session:</span>
                    <Badge variant={testResults.session?.success ? "default" : "destructive"} className="text-xs">
                      {testResults.session?.success ? "✅" : "❌"}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>Insert Test:</span>
                    <Badge variant={testResults.insertTest?.success ? "default" : "destructive"} className="text-xs">
                      {testResults.insertTest?.success ? "✅" : "❌"}
                    </Badge>
                  </div>
                </div>

                {testResults.insertTest?.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription className="text-xs">
                      <strong>Insert Error:</strong>
                      <br />
                      {testResults.insertTest.error}
                    </AlertDescription>
                  </Alert>
                )}

                {testResults.authentication?.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription className="text-xs">
                      <strong>Auth Error:</strong>
                      <br />
                      {testResults.authentication.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
