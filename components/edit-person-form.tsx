"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { PaymentSlipUpload } from "./payment-slip-upload"
import { Loader2, Save, Database, FileJson } from "lucide-react"

import type { Person, PersonFormData } from "../types/person"
import { useDataSource } from "@/contexts/data-source-context"

interface EditPersonFormProps {
  person: Person | null
  isOpen: boolean
  onClose: () => void
  onSave: (personId: string, data: PersonFormData) => void
}

const groupCareOptions = ["รังสิต", "มศว.", "จันทรเกษม", "เกษตร", "ungroup"]

export function EditPersonForm({ person, isOpen, onClose, onSave }: EditPersonFormProps) {
  const [formData, setFormData] = useState<PersonFormData>({
    id: person?.id || "",
    nick_name: "",
    first_name: "",
    last_name: "",
    gender: "Male",
    phone: "",
    shirt_size: "M",
    payment_status: "Pending",
    payment_amount: 1500,
    payment_slip: undefined,
    can_go: true,
    remark: "",
    group_care: "รังสิต",
  })

  const [errors, setErrors] = useState<Partial<PersonFormData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { dataSource } = useDataSource()

  useEffect(() => {
    if (person) {
      setFormData({
        id: person.id,
        nick_name: person.nick_name,
        first_name: person.first_name,
        last_name: person.last_name,
        gender: person.gender,
        phone: person.phone,
        shirt_size: person.shirt_size,
        payment_status: person.payment_status,
        payment_amount: person.payment_amount,
        payment_slip: person.payment_slip,
        can_go: person.can_go,
        remark: person.remark,
        group_care: person.group_care,
      })
    }
  }, [person])

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonFormData> = {}

    if (!formData.nick_name.trim()) {
      newErrors.nick_name = "Nickname is required"
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required"
    } else if (!/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format"
    }
    if (formData.payment_amount <= 0) {
      newErrors.payment_amount = Number.POSITIVE_INFINITY
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("📝 Form submitted with data:", formData)
    e.preventDefault()
    if (person && validateForm()) {
      setIsSaving(true)
      try {
        console.log("📝 Submitting form:", { personId: person.id, formData })
        await onSave(person.id, formData)
        // Form will be closed by parent component after successful save
      } catch (error) {
        console.error("❌ Error in form submission:", error)
        setIsSaving(false) // Reset saving state on error
      }
      // Don't reset isSaving here - let parent handle it
    }
  }

  const handleInputChange = (field: keyof PersonFormData, value: string | boolean | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Person
            {dataSource === "mock" ? (
              <div className="flex items-center gap-1">
                <FileJson className="h-4 w-4" />
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Mock Data</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Live Database</span>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Update the information for {person?.nick_name}. All fields marked with * are required.
            {dataSource === "supabase" && (
              <span className="block text-sm text-green-600 mt-1">
                ✅ Changes will be saved to Supabase database
                <br />📁 Payment slips will be stored in Supabase Storage with person identification
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="nick_name">Nickname *</Label>
                  <Input
                    id="nick_name"
                    value={formData.nick_name}
                    onChange={(e) => handleInputChange("nick_name", e.target.value)}
                    className={errors.nick_name ? "border-red-500" : ""}
                    disabled={isSaving}
                  />
                  {errors.nick_name && <p className="text-sm text-red-500">{errors.nick_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    className={errors.first_name ? "border-red-500" : ""}
                    disabled={isSaving}
                  />
                  {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    className={errors.last_name ? "border-red-500" : ""}
                    disabled={isSaving}
                  />
                  {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: "Male" | "Female" | "Other") => handleInputChange("gender", value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Details */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Contact & Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="081-234-5678"
                    className={errors.phone ? "border-red-500" : ""}
                    disabled={isSaving}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shirt_size">Shirt Size</Label>
                  <Select
                    value={formData.shirt_size}
                    onValueChange={(value: "XS" | "S" | "M" | "L" | "XL" | "XXL") =>
                      handleInputChange("shirt_size", value)
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value: "Paid" | "Pending" | "Unpaid") => handleInputChange("payment_status", value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Payment Amount (THB) *</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    value={formData.payment_amount}
                    onChange={(e) => handleInputChange("payment_amount", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    step="50"
                    className={errors.payment_amount ? "border-red-500" : ""}
                    disabled={isSaving}
                  />
                  {errors.payment_amount && <p className="text-sm text-red-500">{errors.payment_amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group_care">Group Care</Label>
                  <Select
                    value={formData.group_care}
                    onValueChange={(value) => handleInputChange("group_care", value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupCareOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full width sections */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Additional Information</h3>

              <div className="flex items-center space-x-2">
                <Switch
                  id="can_go"
                  checked={formData.can_go}
                  onCheckedChange={(checked) => handleInputChange("can_go", checked)}
                  disabled={isSaving}
                />
                <Label htmlFor="can_go">Can go to the event</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remark">Remark</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => handleInputChange("remark", e.target.value)}
                  placeholder="Additional notes or comments..."
                  rows={3}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Slip Upload */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                Payment Slip Upload
                {dataSource === "supabase" && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📁 Supabase Storage</span>
                )}
              </h3>

              <PaymentSlipUpload
                currentSlip={formData.payment_slip}
                onSlipChange={(slip) => handleInputChange("payment_slip", slip)}
                personInfo={{
                  nickname: formData.nick_name,
                  firstName: formData.first_name,
                  lastName: formData.last_name,
                  id: formData.id,
                }}
              />
              {dataSource === "supabase" && (
                <p className="text-xs text-blue-600">
                  💡 Files will be saved with format: {formData.nick_name}_{formData.first_name}_{formData.last_name}
                  _[timestamp]
                </p>
              )}
            </CardContent>
          </Card>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving to {dataSource === "mock" ? "Mock Data" : "Database"}...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
