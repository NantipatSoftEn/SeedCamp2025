"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BarChartProps {
  data: Array<{
    label: string
    value: number
    percentage: number
    color?: string
  }>
  title: string
  showPercentage?: boolean
}

export function BarChart({ data, title, showPercentage = true }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{item.value}</span>
                  {showPercentage && (
                    <Badge variant="outline" className="text-xs">
                      {item.percentage.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${item.color || "bg-blue-500"}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface PieChartProps {
  data: Array<{
    label: string
    value: number
    percentage: number
    color: string
  }>
  title: string
}

export function PieChart({ data, title }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Simple CSS Pie Chart */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden">
            {data.map((item, index) => {
              const startAngle = cumulativePercentage * 3.6
              const endAngle = (cumulativePercentage + item.percentage) * 3.6
              cumulativePercentage += item.percentage

              return (
                <div
                  key={index}
                  className={`absolute w-full h-full ${item.color}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(((startAngle - 90) * Math.PI) / 180)}% ${
                      50 + 50 * Math.sin(((startAngle - 90) * Math.PI) / 180)
                    }%, ${50 + 50 * Math.cos(((endAngle - 90) * Math.PI) / 180)}% ${
                      50 + 50 * Math.sin(((endAngle - 90) * Math.PI) / 180)
                    }%)`,
                  }}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 flex-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${item.color}`} />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-sm">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.value}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  color?: string
}

export function MetricCard({ title, value, subtitle, trend, icon, color = "bg-blue-500" }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {icon && (
            <div className={`p-3 rounded-full ${color}`}>
              <div className="text-white">{icon}</div>
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
              {trend.isPositive ? "+" : ""}
              {trend.value.toFixed(1)}%
            </Badge>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
