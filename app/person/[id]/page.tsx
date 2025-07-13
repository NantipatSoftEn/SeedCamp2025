"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Phone, User, CreditCard, FileImage, Eye, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

import type { Person } from "@/types/person"
import { useDataSource } from "@/contexts/data-source-context"
import { DataService } from "@/services/data-service"
import { supabaseStorage } from "@/lib/supabase-storage"
import { formatCurrency } from "@/utils/analytics"
import { CustomAlert, CustomAlertDescription } from "@/components/custom-alert"

interface PaymentSlip {
  id: string
  url: string
  path: string
  originalName: string
  uploadedAt: string
  fileSize: number
  mimeType: string
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "Unpaid":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export default function PersonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { dataSource } = useDataSource()

  const [person, setPerson] = useState<Person | null>(null)
  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewSlip, setPreviewSlip] = useState<PaymentSlip | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deletingSlipId, setDeletingSlipId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const personId = params.id as string

  // Load person data and payment slips
  useEffect(() => {
    async function loadPersonData() {
      if (!personId) return

      setIsLoading(true)
      setError(null)

      try {
        // Load person data
        const dataService = new DataService(dataSource === "mock")
        const people = await dataService.fetchPeople()
        const foundPerson = people.find((p) => p.id === personId)

        if (!foundPerson) {
          setError("Person not found")
          return
        }

        setPerson(foundPerson)

        // Load payment slips if using Supabase
        if (dataSource === "supabase") {
          const slips = await supabaseStorage.getPersonPaymentSlips(personId)
          setPaymentSlips(slips)
        }
      } catch (error) {
        console.error("Failed to load person data:", error)
        setError(`Failed to load person data: ${error instanceof Error ? error.message : "Unknown error"}`)
        toast({
          title: "Error loading data",
          description: "There was a problem loading the person's information.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPersonData()
  }, [personId, dataSource, toast])

  const handleDeleteSlip = async (slip: PaymentSlip) => {
    if (!person) return

    setDeletingSlipId(slip.id)
    try {
      const success = await supabaseStorage.deletePaymentSlip(slip.path, person.id)

      if (success) {
        // Remove from local state
        setPaymentSlips((prev) => prev.filter((s) => s.id !== slip.id))

        // Update person's payment status if this was the last slip
        const remainingSlips = paymentSlips.filter((s) => s.id !== slip.id)
        if (remainingSlips.length === 0) {
          setPerson((prev) => (prev ? { ...prev, payment_status: "Unpaid", payment_slip: undefined } : null))
        }

        toast({
          title: "Payment slip deleted",
          description: "The payment slip has been successfully deleted.",
        })
      } else {
        throw new Error("Failed to delete payment slip")
      }
    } catch (error) {
      console.error("Failed to delete slip:", error)
      toast({
        title: "Delete failed",
        description: `Failed to delete payment slip: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setDeletingSlipId(null)
    }
  }

  const openPreview = (slip: PaymentSlip) => {
    setPreviewSlip(slip)
    setPreviewOpen(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Calculate total amount from all slips (for display purposes)
  const totalSlipAmount = paymentSlips.length * (person?.payment_amount || 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading person details...</p>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Person Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The requested person could not be found."}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{person.nick_name}</h1>
            <p className="text-gray-600">
              {person.first_name} {person.last_name}
            </p>
          </div>
        </div>

        {/* Person Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Full Name</span>
                </div>
                <p className="font-medium">
                  {person.first_name} {person.last_name}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Phone</span>
                </div>
                <p className="font-medium font-mono">{person.phone}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Gender</span>
                </div>
                <Badge variant="outline">{person.gender}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Shirt Size</span>
                </div>
                <Badge variant="outline">{person.shirt_size}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Payment Status</span>
                </div>
                <Badge className={getPaymentStatusColor(person.payment_status)}>{person.payment_status}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Can Go to Camp</span>
                </div>
                <Badge variant={person.can_go ? "default" : "destructive"}>{person.can_go ? "Yes" : "No"}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Group Care</span>
                </div>
                <Badge variant="secondary">{person.group_care}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Payment Amount</span>
                </div>
                <p className="font-medium text-lg">{formatCurrency(person.payment_amount)}</p>
              </div>

              {person.congenital_disease && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Congenital Disease</span>
                  </div>
                  <p className="text-sm">{person.congenital_disease}</p>
                </div>
              )}
            </div>

            {person.remark && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">Remarks</span>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{person.remark}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Slips Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Payment Slips Summary
            </CardTitle>
            <CardDescription>All payment slips uploaded for {person.nick_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{paymentSlips.length}</p>
                    <p className="text-sm text-gray-600">Total Slips</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(person.payment_amount)}</p>
                    <p className="text-sm text-gray-600">Amount per Slip</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalSlipAmount)}</p>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ({paymentSlips.length} × {formatCurrency(person.payment_amount)})
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {dataSource === "mock" && (
              <CustomAlert>
                <CustomAlertDescription>
                  Payment slip history is only available when using Supabase data source. Currently using mock data
                  mode.
                </CustomAlertDescription>
              </CustomAlert>
            )}

            {dataSource === "supabase" && paymentSlips.length === 0 && (
              <CustomAlert>
                <CustomAlertDescription>
                  No payment slips found for {person.nick_name}. Payment slips can be uploaded from the main dashboard.
                </CustomAlertDescription>
              </CustomAlert>
            )}

            {/* Payment Slips Grid */}
            {paymentSlips.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentSlips.map((slip, index) => (
                  <Card key={slip.id} className="overflow-hidden">
                    <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                      <img
                        src={slip.url || "/placeholder.svg"}
                        alt={slip.originalName}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openPreview(slip)}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Latest
                        </Badge>
                      )}
                      {person.payment_slip === slip.path && (
                        <Badge className="absolute top-2 right-2" variant="default">
                          Current
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm truncate" title={slip.originalName}>
                          {slip.originalName}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatFileSize(slip.fileSize)}</span>
                          <span>{new Date(slip.uploadedAt).toLocaleDateString("th-TH")}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(slip.uploadedAt).toLocaleTimeString("th-TH")}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => openPreview(slip)} className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSlip(slip)}
                            disabled={deletingSlipId === slip.id}
                          >
                            {deletingSlipId === slip.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        {person.created_at && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Person Created</p>
                    <p className="text-sm text-gray-600">{new Date(person.created_at).toLocaleString("th-TH")}</p>
                  </div>
                </div>

                {person.updated_at && person.updated_at !== person.created_at && (
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-gray-600">{new Date(person.updated_at).toLocaleString("th-TH")}</p>
                    </div>
                  </div>
                )}

                {paymentSlips.map((slip, index) => (
                  <div key={slip.id} className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Payment Slip Uploaded</p>
                      <p className="text-sm text-gray-600">
                        {slip.originalName} - {new Date(slip.uploadedAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Payment Slip Preview</DialogTitle>
              <DialogDescription>
                {previewSlip?.originalName} for {person.nick_name} ({person.first_name} {person.last_name})
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={previewSlip?.url || "/placeholder.svg"}
                alt="Payment slip preview"
                className="max-w-full max-h-96 object-contain border rounded"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            </div>
            {previewSlip && (
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <div>
                  <strong>File:</strong> {previewSlip.originalName}
                </div>
                <div>
                  <strong>Size:</strong> {formatFileSize(previewSlip.fileSize)}
                </div>
                <div>
                  <strong>Type:</strong> {previewSlip.mimeType}
                </div>
                <div>
                  <strong>Uploaded:</strong> {new Date(previewSlip.uploadedAt).toLocaleString("th-TH")}
                </div>
                <div>
                  <strong>Path:</strong> {previewSlip.path}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
