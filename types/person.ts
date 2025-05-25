export interface Person {
  id: string
  nick_name: string
  first_name: string
  last_name: string
  gender: "Male" | "Female" | "Other"
  phone: string
  shirt_size: "XS" | "S" | "M" | "L" | "XL" | "XXL"
  payment_status: "Paid" | "Pending" | "Unpaid"
  payment_amount: number // เพิ่มจำนวนเงิน
  payment_slip?: string // URL ของสลิปการโอนเงิน
  can_go: boolean
  remark: string
  group_care: string
}

// Add form data type for editing
export interface PersonFormData {
  nick_name: string
  first_name: string
  last_name: string
  gender: "Male" | "Female" | "Other"
  phone: string
  shirt_size: "XS" | "S" | "M" | "L" | "XL" | "XXL"
  payment_status: "Paid" | "Pending" | "Unpaid"
  payment_amount: number
  payment_slip?: string
  can_go: boolean
  remark: string
  group_care: string
}
