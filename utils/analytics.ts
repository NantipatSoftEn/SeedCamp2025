import type { Person } from "../types/person"

export interface AnalyticsData {
  totalPeople: number
  paymentStats: {
    paid: number
    pending: number
    unpaid: number
    paidPercentage: number
  }
  moneyStats: {
    totalExpected: number
    totalCollected: number
    totalPending: number
    totalUnpaid: number
    collectionRate: number
  }
  attendanceStats: {
    canGo: number
    cannotGo: number
    attendanceRate: number
  }
  groupDistribution: Array<{
    group: string
    count: number
    percentage: number
  }>
  genderDistribution: Array<{
    gender: string
    count: number
    percentage: number
  }>
  shirtSizeDistribution: Array<{
    size: string
    count: number
    percentage: number
  }>
  groupAnalysis: Array<{
    group: string
    total: number
    paid: number
    canGo: number
    paidRate: number
    attendanceRate: number
    totalMoney: number
    collectedMoney: number
  }>
  groupPaymentAnalysis: Array<{
    group_care: string
    total_extracted_amount: number
    payment_slip_count: number
  }>
}

export function calculateAnalytics(people: Person[], groupPaymentAnalysis: Array<{group_care: string; total_extracted_amount: number; payment_slip_count: number}> = []): AnalyticsData {
  const totalPeople = people.length

  // Payment Statistics
  const paidCount = people.filter((p) => p.payment_status === "Paid").length
  const pendingCount = people.filter((p) => p.payment_status === "Pending").length
  const unpaidCount = people.filter((p) => p.payment_status === "Unpaid").length

  // Money Statistics
  const totalExpected = people.reduce((sum, person) => sum + person.payment_amount, 0)
  const totalCollected = people
    .filter((p) => p.payment_status === "Paid")
    .reduce((sum, person) => sum + person.payment_amount, 0)
  const totalPending = people
    .filter((p) => p.payment_status === "Pending")
    .reduce((sum, person) => sum + person.payment_amount, 0)
  const totalUnpaid = people
    .filter((p) => p.payment_status === "Unpaid")
    .reduce((sum, person) => sum + person.payment_amount, 0)

  // Attendance Statistics
  const canGoCount = people.filter((p) => p.can_go).length
  const cannotGoCount = totalPeople - canGoCount

  // Group Distribution
  const groupCounts = people.reduce(
    (acc, person) => {
      acc[person.group_care] = (acc[person.group_care] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const groupDistribution = Object.entries(groupCounts)
    .map(([group, count]) => ({
      group,
      count,
      percentage: (count / totalPeople) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  // Gender Distribution
  const genderCounts = people.reduce(
    (acc, person) => {
      acc[person.gender] = (acc[person.gender] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({
    gender,
    count,
    percentage: (count / totalPeople) * 100,
  }))

  // Shirt Size Distribution
  const shirtSizeCounts = people.reduce(
    (acc, person) => {
      acc[person.shirt_size] = (acc[person.shirt_size] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const shirtSizeOrder = ["XS", "S", "M", "L", "XL", "XXL"]
  const shirtSizeDistribution = shirtSizeOrder.map((size) => ({
    size,
    count: shirtSizeCounts[size] || 0,
    percentage: ((shirtSizeCounts[size] || 0) / totalPeople) * 100,
  }))

  // Group Analysis
  const groupAnalysis = Object.entries(groupCounts)
    .map(([group, total]) => {
      const groupPeople = people.filter((p) => p.group_care === group)
      const paid = groupPeople.filter((p) => p.payment_status === "Paid").length
      const canGo = groupPeople.filter((p) => p.can_go).length
      const totalMoney = groupPeople.reduce((sum, person) => sum + person.payment_amount, 0)
      const collectedMoney = groupPeople
        .filter((p) => p.payment_status === "Paid")
        .reduce((sum, person) => sum + person.payment_amount, 0)

      return {
        group,
        total,
        paid,
        canGo,
        paidRate: (paid / total) * 100,
        attendanceRate: (canGo / total) * 100,
        totalMoney,
        collectedMoney,
      }
    })
    .sort((a, b) => b.total - a.total)

  return {
    totalPeople,
    paymentStats: {
      paid: paidCount,
      pending: pendingCount,
      unpaid: unpaidCount,
      paidPercentage: (paidCount / totalPeople) * 100,
    },
    moneyStats: {
      totalExpected,
      totalCollected,
      totalPending,
      totalUnpaid,
      collectionRate: (totalCollected / totalExpected) * 100,
    },
    attendanceStats: {
      canGo: canGoCount,
      cannotGo: cannotGoCount,
      attendanceRate: (canGoCount / totalPeople) * 100,
    },
    groupDistribution,
    genderDistribution,
    shirtSizeDistribution,
    groupAnalysis,
    groupPaymentAnalysis,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Paid":
      return "bg-green-500"
    case "Pending":
      return "bg-yellow-500"
    case "Unpaid":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function getGenderColor(gender: string): string {
  switch (gender) {
    case "Male":
      return "bg-blue-500"
    case "Female":
      return "bg-pink-500"
    case "Other":
      return "bg-purple-500"
    default:
      return "bg-gray-500"
  }
}
