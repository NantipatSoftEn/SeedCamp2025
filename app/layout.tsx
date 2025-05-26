import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { DataSourceProvider } from "@/contexts/data-source-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "SeedCamp 2025 Management",
  description: "Management system for SeedCamp 2025",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DataSourceProvider>
            {children}
            <Toaster />
          </DataSourceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
