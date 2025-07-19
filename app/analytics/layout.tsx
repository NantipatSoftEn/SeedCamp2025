import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics Dashboard - SeedCamp 2025",
  description: "Analytics and insights for SeedCamp 2025 participants",
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>{children}</>
  )
}
