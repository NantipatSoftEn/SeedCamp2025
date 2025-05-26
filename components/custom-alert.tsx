"use client"

import type React from "react"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomAlertProps {
  variant?: "default" | "destructive" | "success" | "warning"
  children: React.ReactNode
  className?: string
}

export function CustomAlert({ variant = "default", children, className }: CustomAlertProps) {
  const variants = {
    default: "border-blue-200 bg-blue-50 text-blue-800",
    destructive: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  }

  const icons = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
  }

  const Icon = icons[variant]

  return (
    <div className={cn("rounded-lg border p-3", variants[variant], className)}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

interface CustomAlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function CustomAlertDescription({ children, className }: CustomAlertDescriptionProps) {
  return <div className={cn("text-sm", className)}>{children}</div>
}
