"use client"

import type React from "react"
import { useState } from "react"

interface EditPersonFormProps {
  initialValues: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    paymentSlip?: File | null
  }
  onSubmit: (values: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    paymentSlip?: File | null
  }) => void
  onCancel: () => void
}

const EditPersonForm: React.FC<EditPersonFormProps> = ({ initialValues, onSubmit, onCancel }) => {
  const [firstName, setFirstName] = useState(initialValues.firstName)
  const [lastName, setLastName] = useState(initialValues.lastName)
  const [email, setEmail] = useState(initialValues.email)
  const [phone, setPhone] = useState(initialValues.phone)
  const [address, setAddress] = useState(initialValues.address)
  const [paymentSlip, setPaymentSlip] = useState<File | null>(initialValues.paymentSlip || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ firstName, lastName, email, phone, address, paymentSlip })
  }

  const handlePaymentSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPaymentSlip(file)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-md">
      <div className="mb-4">
        <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">
          First Name:
        </label>
        <input
          type="text"
          id="firstName"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">
          Last Name:
        </label>
        <input
          type="text"
          id="lastName"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
          Email:
        </label>
        <input
          type="email"
          id="email"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
          Phone:
        </label>
        <input
          type="tel"
          id="phone"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">
          Address:
        </label>
        <input
          type="text"
          id="address"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="paymentSlip" className="block text-gray-700 text-sm font-bold mb-2">
          Payment Slip:
        </label>
        <input
          type="file"
          id="paymentSlip"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          onChange={handlePaymentSlipChange}
        />
        {paymentSlip && <p className="text-green-500 text-sm mt-1">File selected: {paymentSlip.name}</p>}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default EditPersonForm
