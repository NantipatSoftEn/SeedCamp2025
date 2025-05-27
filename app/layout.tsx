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
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sarabun">
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
