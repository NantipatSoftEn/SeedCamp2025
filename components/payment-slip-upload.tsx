"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Eye, Loader2, CheckCircle, AlertCircle, TestTube } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { dataSource } = useDataSource()

  // ทดสอบ Storage connection เมื่อ component mount
  useEffect(() => {
    if (dataSource === "supabase") {
      testStorageConnection()
    }
  }, [dataSource])

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

    // Supabase mode - upload to storage
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
        await supabaseStorage.deletePaymentSlip(currentSlip)
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
        console.log("✅ Payment slip uploaded successfully:", result)
      } else {
        throw new Error("Upload failed - no result returned")
      }
    } catch (error) {
      console.error("❌ Upload failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Upload failed"
      setUploadError(errorMessage)

      // ถ้าเป็น error เกี่ยวกับ bucket ให้แนะนำการแก้ไข
      if (errorMessage.includes("bucket")) {
        setUploadError(
          `${errorMessage}\n\nTip: Try clicking the "Test Storage" button to check your Supabase Storage setup.`,
        )
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeSlip = async () => {
    if (currentSlip && dataSource === "supabase" && currentSlip.includes("supabase")) {
      try {
        await supabaseStorage.deletePaymentSlip(currentSlip)
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
        <Alert variant={storageTest.success ? "default" : "destructive"}>
          {storageTest.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className={storageTest.success ? "text-green-800" : ""}>
            {storageTest.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Status Messages */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{uploadError}</AlertDescription>
        </Alert>
      )}

      {uploadSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment slip uploaded successfully!
            {dataSource === "supabase" && " File saved to Supabase Storage."}
          </AlertDescription>
        </Alert>
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
            Uploading as: {personInfo.nickname}_{personInfo.firstName}_{personInfo.lastName}_[timestamp]
          </p>
        </div>
      )}

      {currentSlip && !uploading ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentSlip || "/placeholder.svg"}
                  alt="Payment slip"
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="text-sm font-medium">Payment slip uploaded</p>
                  <p className="text-xs text-gray-500">
                    {dataSource === "supabase" ? "Stored in Supabase Storage" : "Mock data"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Owner: {personInfo.nickname} ({personInfo.firstName} {personInfo.lastName})
                  </p>
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
                        src={currentSlip || "/placeholder.svg"}
                        alt="Payment slip"
                        className="max-w-full max-h-96 object-contain"
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
              ? `Will be saved as: ${personInfo.nickname}_${personInfo.firstName}_${personInfo.lastName}_[timestamp]`
              : "Using mock data mode"}
          </p>
          {dataSource === "supabase" && storageTest && !storageTest.success && (
            <p className="text-xs text-red-600 mt-2">⚠️ Storage not ready - please test connection first</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
