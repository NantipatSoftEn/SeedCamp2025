"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function TestConnectionPage() {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setStatus("testing")
    setMessage("กำลังทดสอบการเชื่อมต่อกับ Supabase...")

    try {
      const supabase = getSupabaseBrowserClient()

      // ทดสอบการเชื่อมต่อโดยการดึงข้อมูลจำนวนแถวในตาราง
      const { count, error } = await supabase.from("seedcamp_people").select("*", { count: "exact", head: true })

      if (error) {
        throw error
      }

      setStatus("success")
      setMessage(`เชื่อมต่อสำเร็จ! พบข้อมูลในตาราง seedcamp_people จำนวน ${count} รายการ`)
    } catch (error) {
      console.error("Connection test failed:", error)
      setStatus("error")
      setMessage(`เชื่อมต่อล้มเหลว: ${(error as Error).message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ทดสอบการเชื่อมต่อ Supabase</CardTitle>
          <CardDescription>ตรวจสอบว่าแอปพลิเคชันสามารถเชื่อมต่อกับ Supabase ได้หรือไม่</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "testing" && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="font-medium">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            กลับไปหน้าหลัก
          </Button>
          <Button onClick={testConnection} disabled={status === "testing"}>
            {status === "testing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังทดสอบ...
              </>
            ) : (
              "ทดสอบอีกครั้ง"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
