"use client"

import type React from "react"
import { useState } from "react"

interface FormData {
  name: string
  email: string
  payment_amount: number
}

interface FormErrors {
  name: number
  email: number
  payment_amount: number
}

const EditPersonForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    payment_amount: 0,
  })

  const [errors, setErrors] = useState<FormErrors>({
    name: 0,
    email: 0,
    payment_amount: 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {
      name: 0,
      email: 0,
      payment_amount: 0,
    }

    if (!formData.name) {
      newErrors.name = Number.POSITIVE_INFINITY
    }

    if (!formData.email) {
      newErrors.email = Number.POSITIVE_INFINITY
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = Number.POSITIVE_INFINITY
    }

    if (formData.payment_amount < 0) {
      newErrors.payment_amount = Number.POSITIVE_INFINITY
    }

    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()
    setErrors(newErrors)

    if (Object.values(newErrors).every((x) => x === 0)) {
      alert("Form is valid and submitted!")
    } else {
      alert("Form has errors. Please correct them.")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
        {errors.name !== 0 && <p style={{ color: "red" }}>Name is required</p>}
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
        {errors.email !== 0 && <p style={{ color: "red" }}>Valid email is required</p>}
      </div>

      <div>
        <label htmlFor="payment_amount">Payment Amount:</label>
        <input
          type="number"
          id="payment_amount"
          name="payment_amount"
          value={formData.payment_amount}
          onChange={handleChange}
        />
        {errors.payment_amount !== 0 && <p style={{ color: "red" }}>Payment amount must be non-negative</p>}
      </div>

      <button type="submit">Submit</button>
    </form>
  )
}

export default EditPersonForm
