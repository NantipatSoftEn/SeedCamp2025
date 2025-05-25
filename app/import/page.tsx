"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Person } from "@/types/person"

type ImportStatus = "idle" | "uploading" | "processing" | "success" | "error"

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ImportStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 })
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) return

    setStatus("uploading")
    setProgress(10)
    setMessage("Reading CSV file...")

    try {
      // Read the file
      const text = await file.text()
      const rows = text.split("\n")
      const headers = rows[0].split(",").map((h) => h.trim())

      // Parse CSV data
      const people: Partial<Person>[] = []
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue

        const values = rows[i].split(",").map((v) => v.trim())
        const person: any = {}

        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            // Map CSV headers to database columns
            switch (header) {
              case "nick_name":
                person.nick_name = values[index]
                break
              case "first_name":
                person.first_name = values[index]
                break
              case "last_name":
                person.last_name = values[index]
                break
              case "gender":
                person.gender = values[index].toLowerCase()
                break
              case "group_care":
                person.group_care = values[index] || "ungroup"
                break
              case "phone":
                person.phone = values[index]
                break
              case "congenital_disease":
                person.congenital_disease = values[index]
                break
              case "shirt_size":
                person.shirt_size = values[index].toUpperCase()
                break
              case "payment_status":
                person.payment_status = values[index] ? values[index].toLowerCase() : "unpaid"
                break
              case "can_go":
                person.can_go = values[index]?.toLowerCase() === "true"
                break
              case "remark":
                person.remark = values[index]
                break
              default:
                // Handle any other columns
                person[header] = values[index]
            }
          }
        })

        // Set default values for required fields
        if (!person.payment_amount) person.payment_amount = 1500
        if (person.payment_status === undefined) person.payment_status = "unpaid"

        people.push(person)
      }

      setProgress(30)
      setMessage(`Parsed ${people.length} records, uploading to database...`)

      // Insert data in batches
      const supabase = getSupabaseBrowserClient()
      const batchSize = 50
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < people.length; i += batchSize) {
        const batch = people.slice(i, i + batchSize)

        const { data, error } = await supabase.from("seedcamp_people").insert(batch)

        if (error) {
          console.error("Error inserting batch:", error)
          errorCount += batch.length
        } else {
          successCount += batch.length
        }

        // Update progress
        const currentProgress = Math.min(30 + (70 * (i + batch.length)) / people.length, 95)
        setProgress(currentProgress)
        setMessage(`Imported ${i + batch.length} of ${people.length} records...`)
        setStats({
          total: people.length,
          success: successCount,
          error: errorCount,
        })
      }

      setProgress(100)
      setStatus("success")
      setMessage(`Import completed. ${successCount} records imported successfully, ${errorCount} errors.`)
    } catch (error) {
      console.error("Import error:", error)
      setStatus("error")
      setMessage(`Error importing data: ${(error as Error).message}`)
    }
  }

  const handleGoToDashboard = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Import People Data</CardTitle>
          <CardDescription>Upload a CSV file to import people data into the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "idle" && (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">CSV files only</p>

              {file && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-left">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          )}

          {(status === "uploading" || status === "processing") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm font-medium">{message}</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Import completed successfully</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm">{message}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-medium">{stats.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Imported</p>
                    <p className="font-medium text-green-600">{stats.success}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Errors</p>
                    <p className="font-medium text-red-600">{stats.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Import failed</p>
              </div>
              <p className="text-sm bg-red-50 p-3 rounded-md">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleGoToDashboard}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file}>
                Import Data
              </Button>
            </>
          )}

          {(status === "uploading" || status === "processing") && (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Button>
          )}

          {(status === "success" || status === "error") && (
            <Button onClick={handleGoToDashboard} className="w-full">
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
