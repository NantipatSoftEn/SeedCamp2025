"use client"

import { Database, FileJson, Settings } from "lucide-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDataSource } from "@/contexts/data-source-context"
import { useAuth } from "@/contexts/auth-context"

export function DataSourceToggle() {
  const { dataSource, setDataSource, isDevelopment } = useDataSource()
  const { user } = useAuth()

  // Check if user is admin
  const isAdmin = user?.email === "admin@seedbkk.org"

  // Don't render if not admin
  if (!isAdmin) {
    return null
  }

  // แสดงปุ่มเสมอ แต่จะมี badge แตกต่างกัน
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          {dataSource === "mock" ? (
            <>
              <FileJson className="h-4 w-4" />
              <span className="hidden sm:inline">Mock</span>
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Live</span>
            </>
          )}
          <Badge variant={isDevelopment ? "default" : "secondary"} className="ml-1 text-xs">
            {isDevelopment ? "DEV" : "PROD"}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Data Source Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-xs text-gray-500">
          Environment: {isDevelopment ? "Development" : "Production"}
        </div>
        <div className="px-2 py-1 text-xs text-gray-500 mb-2">
          Current: {dataSource === "mock" ? "Mock Data" : "Supabase Database"}
        </div>

        <DropdownMenuItem onClick={() => setDataSource("mock")} className={dataSource === "mock" ? "bg-accent" : ""}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Use Mock Data</span>
          {dataSource === "mock" && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setDataSource("supabase")}
          className={dataSource === "supabase" ? "bg-accent" : ""}
        >
          <Database className="mr-2 h-4 w-4" />
          <span>Use Supabase</span>
          {dataSource === "supabase" && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs text-gray-400">
          {isDevelopment ? "Switch freely in development mode" : "Limited switching in production"}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
