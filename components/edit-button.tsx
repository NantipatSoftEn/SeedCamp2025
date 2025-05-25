"use client"

import { Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "secondary"
}

export function EditButton({
  onClick,
  isLoading = false,
  disabled = false,
  size = "sm",
  variant = "outline",
}: EditButtonProps) {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={disabled || isLoading}
      className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 min-w-[70px] relative z-10 pointer-events-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
          <span className="text-xs">Saving...</span>
        </>
      ) : (
        <>
          <Edit className="h-4 w-4 mr-1" />
          <span className="text-xs">Edit</span>
        </>
      )}
    </Button>
  )
}
