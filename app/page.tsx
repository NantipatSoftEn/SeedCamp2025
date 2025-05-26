"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Upload } from "lucide-react"
import Link from "next/link"

import PeopleDashboard from "../dashboard"
import AnalyticsDashboard from "../analytics-dashboard"
import { DataSourceToggle } from "@/components/data-source-toggle"
import { DebugPanel } from "@/components/debug-panel"
import { SupabaseTestButton } from "@/components/supabase-test-button"
import { EditDebugPanel } from "@/components/edit-debug-panel"
import { StorageTestButton } from "@/components/storage-test-button"
import { ProtectedRoute } from "@/components/protected-route"
import { UserMenu } from "@/components/user-menu"

export default function Page() {
  const [currentView, setCurrentView] = useState<"people" | "analytics">("people")

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        {/* Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">SeedCamp Management</h1>
              <div className="flex gap-2 items-center">
                <Button
                  variant={currentView === "people" ? "default" : "outline"}
                  onClick={() => setCurrentView("people")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">People Dashboard</span>
                  <span className="sm:hidden">People</span>
                </Button>
                <Button
                  variant={currentView === "analytics" ? "default" : "outline"}
                  onClick={() => setCurrentView("analytics")}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics Dashboard</span>
                  <span className="sm:hidden">Analytics</span>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/import" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Import Data</span>
                    <span className="sm:hidden">Import</span>
                  </Link>
                </Button>
                <SupabaseTestButton />
                <StorageTestButton />
                <DataSourceToggle />
                <UserMenu />
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
    </ProtectedRoute>
  )
}
