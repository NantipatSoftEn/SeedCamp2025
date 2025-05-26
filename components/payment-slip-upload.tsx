"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Eye, Loader2, TestTube } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { supabaseStorage } from "@/lib/supabase-storage"
import { useDataSource } from "@/contexts/data-source-context"
import { useAuth } from "@/contexts/auth-context"
import { CustomAlert, CustomAlertDescription } from "./custom-alert"

interface PaymentSlipUploadProps {
  currentSlip?: string
  onSlipChange: (slip: string | undefined) => void
  personInfo: {
    nickname: string
    firstName: string
    lastName: string
    id: string
  }
}

export function PaymentSlipUpload({ currentSlip, onSlipChange, personInfo }: PaymentSlipUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [storageTest, setStorageTest] = useState<{ success: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [paymentSlips, setPaymentSlips] = useState<
    Array<{
      id: string
      url: string
      path: string
      originalName: string
      uploadedAt: string
    }>
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { dataSource } = useDataSource()
  const { user } = useAuth() // Add this line

  // ทดสอบ Storage connection และโหลดข้อมูล payment slips เมื่อ component mount
  useEffect(() => {
    if (dataSource === "supabase") {
      testStorageConnection()
      loadPaymentSlips()
    }
  }, [dataSource, personInfo.id])

  const testStorageConnection = async () => {
    setTesting(true)
    try {
      const result = await supabaseStorage.testConnection()
      setStorageTest(result)
      console.log("🧪 Storage test result:", result)
    } catch (error) {
      setStorageTest({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setTesting(false)
    }
  }

  const loadPaymentSlips = async () => {
    if (dataSource === "supabase" && personInfo.id) {
      try {
        const slips = await supabaseStorage.getPersonPaymentSlips(personInfo.id)
        setPaymentSlips(slips)

        // ถ้ามี payment slip ล่าสุด ให้ใช้เป็น current slip
        if (slips.length > 0 && !currentSlip) {
          onSlipChange(slips[0].url)
        }
      } catch (error) {
        console.error("Failed to load payment slips:", error)
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10MB")
      return
    }

    setUploadError(null)
    setUploadSuccess(false)

    if (dataSource === "mock") {
      // Mock mode - convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onSlipChange(result)
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)
      }
      reader.readAsDataURL(file)
      return
    }

    // Supabase mode - upload to storage และบันทึกใน database
    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Delete old file if exists
      if (currentSlip && currentSlip.includes("supabase")) {
        console.log("🗑️ Deleting old file before upload...")
        await supabaseStorage.deletePaymentSlip(currentSlip, personInfo.id)
      }

      // Upload new file
      console.log("📤 Starting upload for:", personInfo)
      const result = await supabaseStorage.uploadPaymentSlip(
        file,
        personInfo.nickname,
        personInfo.firstName,
        personInfo.lastName,
        personInfo.id,
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result) {
        onSlipChange(result.url)
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)

        // โหลดข้อมูล payment slips ใหม่
        await loadPaymentSlips()

        console.log("✅ Payment slip uploaded successfully:", result)
        console.log("💰 Payment status automatically updated to 'Paid'")
      } else {
        throw new Error("Upload failed - no result returned")
      }
    } catch (error) {
      console.error("❌ Upload failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Upload failed"

      // Handle specific authentication errors
      if (errorMessage.includes("Authentication required") || errorMessage.includes("logged in")) {
        setUploadError(`${errorMessage}\n\nPlease make sure you are logged in and try again.`)
      } else if (errorMessage.includes("bucket")) {
        setUploadError(
          `${errorMessage}\n\nTip: Try clicking the "Test Storage" button to check your Supabase Storage setup.`,
        )
      } else {
        setUploadError(errorMessage)
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeSlip = async () => {
    if (currentSlip && dataSource === "supabase" && currentSlip.includes("supabase")) {
      try {
        await supabaseStorage.deletePaymentSlip(currentSlip, personInfo.id)
        await loadPaymentSlips() // โหลดข้อมูลใหม่
      } catch (error) {
        console.warn("Could not delete file from storage:", error)
      }
    }

    onSlipChange(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setUploadError(null)
    setUploadSuccess(false)
  }

  // ใช้ URL ที่ถูกต้องสำหรับแสดงรูป
  const getDisplayUrl = (url?: string) => {
    if (!url) return "/placeholder.svg"

    if (dataSource === "mock" || url.startsWith("data:")) {
      return url
    }

    // ถ้าเป็น Supabase URL ที่มี path ให้ใช้ getPublicUrl
    if (url.includes("supabase") && url.includes("payment-slips")) {
      return url
    }

    return url
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Payment Slip Upload</Label>
        {dataSource === "supabase" && (
          <Button variant="outline" size="sm" onClick={testStorageConnection} disabled={testing} className="text-xs">
            {testing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TestTube className="h-3 w-3 mr-1" />}
            Test Storage
          </Button>
        )}
      </div>

      {/* Storage Test Result */}
      {dataSource === "supabase" && storageTest && (
        <CustomAlert variant={storageTest.success ? "success" : "destructive"}>
          <CustomAlertDescription>{storageTest.message}</CustomAlertDescription>
        </CustomAlert>
      )}

      {/* Upload Status Messages */}
      {uploadError && (
        <CustomAlert variant="destructive">
          <CustomAlertDescription className="whitespace-pre-line">{uploadError}</CustomAlertDescription>
        </CustomAlert>
      )}

      {uploadSuccess && (
        <CustomAlert variant="success">
          <CustomAlertDescription>
            Payment slip uploaded successfully! Payment status updated to "Paid".
            {dataSource === "supabase" && " File saved to Supabase Storage and database."}
          </CustomAlertDescription>
        </CustomAlert>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Uploading to Supabase Storage...</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-gray-500">
            Uploading as: {personInfo.nickname}_{personInfo.firstName}_{personInfo.lastName}
          </p>
        </div>
      )}

      {currentSlip && !uploading ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getDisplayUrl(currentSlip) || "/placeholder.svg"}
                  alt="Payment slip"
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    console.warn("Image failed to load:", currentSlip)
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                <div>
                  <p className="text-sm font-medium">Payment slip uploaded</p>
                  <p className="text-xs text-gray-500">
                    {dataSource === "supabase" ? "Stored in Supabase Storage & Database" : "Mock data"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Owner: {personInfo.nickname} ({personInfo.firstName} {personInfo.lastName})
                  </p>
                  {dataSource === "supabase" && paymentSlips.length > 0 && (
                    <p className="text-xs text-blue-600">📁 {paymentSlips.length} file(s) in database</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Payment Slip Preview</DialogTitle>
                      <DialogDescription>
                        Payment slip for {personInfo.nickname} ({personInfo.firstName} {personInfo.lastName})
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <img
                        src={getDisplayUrl(currentSlip) || "/placeholder.svg"}
                        alt="Payment slip"
                        className="max-w-full max-h-96 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" onClick={removeSlip} disabled={uploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !uploading ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          } ${dataSource === "supabase" && storageTest && !storageTest.success ? "opacity-50" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || (dataSource === "supabase" && !!storageTest && !storageTest.success)}
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          <p className="text-xs text-blue-600 mt-2">
            {dataSource === "supabase"
              ? `Will be saved to database and payment status will be updated to "Paid"`
              : "Using mock data mode"}
          </p>
          {dataSource === "supabase" && storageTest && !storageTest.success && (
            <p className="text-xs text-red-600 mt-2">⚠️ Storage not ready - please test connection first</p>
          )}
        </div>
      ) : null}

      {dataSource === "supabase" && !user && (
        <CustomAlert variant="destructive" className="mt-2">
          <CustomAlertDescription>
            You must be logged in to upload payment slips to Supabase Storage.
          </CustomAlertDescription>
        </CustomAlert>
      )}

      {/* Payment Slips History (for Supabase mode) */}
      {dataSource === "supabase" && paymentSlips.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Payment Slip History</h4>
            <div className="space-y-2">
              {paymentSlips.slice(1).map((slip) => (
                <div key={slip.id} className="flex items-center gap-2 text-xs text-gray-500">
                  <img
                    src={slip.url || "/placeholder.svg"}
                    alt="Previous slip"
                    className="w-8 h-8 object-cover rounded"
                  />
                  <span>{slip.originalName}</span>
                  <span>({new Date(slip.uploadedAt).toLocaleDateString()})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
