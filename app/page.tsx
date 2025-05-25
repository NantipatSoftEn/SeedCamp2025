"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Upload } from "lucide-react"
import Link from "next/link"

import PeopleDashboard from "../dashboard"
import AnalyticsDashboard from "../analytics-dashboard"
import { DataSourceToggle } from "@/components/data-source-toggle"
import { DebugPanel } from "@/components/debug-panel"
// เพิ่ม import
import { SupabaseTestButton } from "@/components/supabase-test-button"
import { EditDebugPanel } from "@/components/edit-debug-panel"
// เพิ่ม import
import { StorageTestButton } from "@/components/storage-test-button"

export default function Page() {
  const [currentView, setCurrentView] = useState<"people" | "analytics">("people")

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="container mx-auto p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl font-bold">SeedCamp Management</h1>
            {/* เพิ่มปุ่มทดสอบใน navigation */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentView === "people" ? "default" : "outline"}
                onClick={() => setCurrentView("people")}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">People Dashboard</span>
                <span className="sm:hidden">People</span>
              </Button>
              <Button
                variant={currentView === "analytics" ? "default" : "outline"}
                onClick={() => setCurrentView("analytics")}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics Dashboard</span>
                <span className="sm:hidden">Analytics</span>
              </Button>
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href="/import" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Import Data</span>
                  <span className="sm:hidden">Import</span>
                </Link>
              </Button>
              <div className="flex gap-2 flex-wrap">
                <SupabaseTestButton />
                <StorageTestButton />
                <DataSourceToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentView === "people" ? <PeopleDashboard /> : <AnalyticsDashboard />}

      {/* Debug Panel - แสดงเฉพาะใน development */}
      <DebugPanel />
      <EditDebugPanel />
    </div>
  )
}
