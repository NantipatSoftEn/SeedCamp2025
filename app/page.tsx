"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Upload, FileText } from "lucide-react"
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
import { AuthTestButton } from "@/components/auth-test-button"
import { RLSDebugPanel } from "@/components/rls-debug-panel"
import { useAuth } from "@/contexts/auth-context"

export default function Page() {
  const [currentView, setCurrentView] = useState<"people" | "analytics">("people")
  const { user } = useAuth()

  // Check if user is admin
  const isAdmin = user?.email === "admin@seedbkk.org"

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

                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // เปิดเอกสารการใช้งานในแท็บใหม่
                    window.open("/docs", "_blank")
                  }}
                  title="เอกสารการใช้งาน - อ่านก่อนใช้ระบบ"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">เอกสารการใช้งาน</span>
                  <span className="sm:hidden">คู่มือ</span>
                </Button>

                {/* Admin-only buttons */}
                {isAdmin && (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/import" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Import Data</span>
                        <span className="sm:hidden">Import</span>
                      </Link>
                    </Button>
                    <SupabaseTestButton />
                    <StorageTestButton />
                    <AuthTestButton />
                    <DataSourceToggle />
                  </>
                )}

                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {currentView === "people" ? <PeopleDashboard /> : <AnalyticsDashboard />}

        {/* Debug Panels - แสดงเฉพาะใน development */}
        <DebugPanel />
        <EditDebugPanel />
        <RLSDebugPanel />
      </div>
    </ProtectedRoute>
  )
}
