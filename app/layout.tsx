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
          href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
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
