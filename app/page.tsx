"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Users } from "lucide-react"

import PeopleDashboard from "../dashboard"
import AnalyticsDashboard from "../analytics-dashboard"

export default function Page() {
  const [currentView, setCurrentView] = useState<"people" | "analytics">("people")

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Management System</h1>
            <div className="flex gap-2">
              <Button
                variant={currentView === "people" ? "default" : "outline"}
                onClick={() => setCurrentView("people")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                People Dashboard
              </Button>
              <Button
                variant={currentView === "analytics" ? "default" : "outline"}
                onClick={() => setCurrentView("analytics")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentView === "people" ? <PeopleDashboard /> : <AnalyticsDashboard />}
    </div>
  )
}
