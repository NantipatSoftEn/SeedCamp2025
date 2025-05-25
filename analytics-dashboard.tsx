"use client"

import { useMemo, useState, useEffect } from "react"
import { Users, CheckCircle, XCircle, Target, DollarSign, TrendingUp, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

import { calculateAnalytics, getGenderColor, formatCurrency } from "./utils/analytics"
import { BarChart, MetricCard } from "./components/charts"
import type { Person } from "./types/person"
import { useDataSource } from "@/contexts/data-source-context"
import { DataService } from "@/services/data-service"

export default function AnalyticsDashboard() {
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { dataSource } = useDataSource()

  // Fetch people data from Supabase
  useEffect(() => {
    async function loadPeople() {
      setIsLoading(true)
      try {
        const dataService = new DataService(dataSource === "mock")
        const data = await dataService.fetchPeople()
        setPeople(data)
      } catch (error) {
        console.error("Failed to load people:", error)
        toast({
          title: "Error loading data",
          description:
            dataSource === "mock"
              ? "There was a problem loading the mock data for analytics."
              : "There was a problem loading the people data from Supabase for analytics.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPeople()
  }, [toast, dataSource])

  const analytics = useMemo(() => calculateAnalytics(people), [people])

  const paymentChartData = [
    {
      label: "Paid",
      value: analytics.paymentStats.paid,
      percentage: (analytics.paymentStats.paid / analytics.totalPeople) * 100,
      color: "bg-green-500",
    },
    {
      label: "Pending",
      value: analytics.paymentStats.pending,
      percentage: (analytics.paymentStats.pending / analytics.totalPeople) * 100,
      color: "bg-yellow-500",
    },
    {
      label: "Unpaid",
      value: analytics.paymentStats.unpaid,
      percentage: (analytics.paymentStats.unpaid / analytics.totalPeople) * 100,
      color: "bg-red-500",
    },
  ]

  const genderChartData = analytics.genderDistribution.map((item) => ({
    label: item.gender,
    value: item.count,
    percentage: item.percentage,
    color: getGenderColor(item.gender),
  }))

  const groupChartData = analytics.groupDistribution.map((item) => ({
    label: item.group,
    value: item.count,
    percentage: item.percentage,
    color: "bg-blue-500",
  }))

  const shirtSizeChartData = analytics.shirtSizeDistribution.map((item) => ({
    label: item.size,
    value: item.count,
    percentage: item.percentage,
    color: "bg-purple-500",
  }))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading analytics data...</p>
          <p className="text-sm text-gray-500">
            {dataSource === "mock" ? "Using mock data" : "Connecting to Supabase..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive analysis and insights of people data</p>
          </div>
          <Badge variant="outline" className="w-fit">
            Total: {analytics.totalPeople} people
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total People"
            value={analytics.totalPeople}
            subtitle="Registered participants"
            icon={<Users className="h-6 w-6" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Total Expected"
            value={formatCurrency(analytics.moneyStats.totalExpected)}
            subtitle="Expected revenue"
            icon={<Target className="h-6 w-6" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Total Collected"
            value={formatCurrency(analytics.moneyStats.totalCollected)}
            subtitle={`${analytics.paymentStats.paid} payments`}
            icon={<DollarSign className="h-6 w-6" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Collection Rate"
            value={`${analytics.moneyStats.collectionRate.toFixed(1)}%`}
            subtitle="Money collected"
            icon={<TrendingUp className="h-6 w-6" />}
            color="bg-emerald-500"
          />
          <MetricCard
            title="Attendance Rate"
            value={`${analytics.attendanceStats.attendanceRate.toFixed(1)}%`}
            subtitle={`${analytics.attendanceStats.canGo} can attend`}
            icon={<CheckCircle className="h-6 w-6" />}
            color="bg-orange-500"
          />
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={groupChartData} title="Group Distribution" />
            </div>

            {/* Payment Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Payment Collection Progress</span>
                    <span className="font-medium">
                      {analytics.paymentStats.paid}/{analytics.totalPeople}
                    </span>
                  </div>
                  <Progress value={analytics.paymentStats.paidPercentage} className="h-3" />
                  <p className="text-sm text-gray-600">{analytics.paymentStats.paidPercentage.toFixed(1)}% completed</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Attendance Confirmation</span>
                    <span className="font-medium">
                      {analytics.attendanceStats.canGo}/{analytics.totalPeople}
                    </span>
                  </div>
                  <Progress value={analytics.attendanceStats.attendanceRate} className="h-3" />
                  <p className="text-sm text-gray-600">
                    {analytics.attendanceStats.attendanceRate.toFixed(1)}% confirmed
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Money Collection Progress</span>
                    <span className="font-medium">
                      {formatCurrency(analytics.moneyStats.totalCollected)} /{" "}
                      {formatCurrency(analytics.moneyStats.totalExpected)}
                    </span>
                  </div>
                  <Progress value={analytics.moneyStats.collectionRate} className="h-3" />
                  <p className="text-sm text-gray-600">{analytics.moneyStats.collectionRate.toFixed(1)}% collected</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Group Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Group</th>
                          <th className="text-center p-2">Total</th>
                          <th className="text-center p-2">Paid</th>
                          <th className="text-center p-2">Can Go</th>
                          <th className="text-center p-2">Expected Money</th>
                          <th className="text-center p-2">Collected Money</th>
                          <th className="text-center p-2">Payment Rate</th>
                          <th className="text-center p-2">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.groupAnalysis.map((group, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium">{group.group}</td>
                            <td className="text-center p-2">{group.total}</td>
                            <td className="text-center p-2">{group.paid}</td>
                            <td className="text-center p-2">{group.canGo}</td>
                            <td className="text-center p-2 text-sm">{formatCurrency(group.totalMoney)}</td>
                            <td className="text-center p-2 text-sm font-medium text-green-600">
                              {formatCurrency(group.collectedMoney)}
                            </td>
                            <td className="text-center p-2">
                              <div className="flex items-center justify-center gap-2">
                                <Progress value={group.paidRate} className="w-16 h-2" />
                                <span className="text-sm">{group.paidRate.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <div className="flex items-center justify-center gap-2">
                                <Progress value={group.attendanceRate} className="w-16 h-2" />
                                <span className="text-sm">{group.attendanceRate.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={shirtSizeChartData} title="Shirt Size Distribution" />
            </div>

            {/* Demographics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.genderDistribution.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-full ${getGenderColor(item.gender)} mx-auto mb-2`} />
                    <h3 className="font-semibold">{item.gender}</h3>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Payment Status Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paymentChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${item.color}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.value}</p>
                        <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Attendance Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Can Go</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{analytics.attendanceStats.canGo}</p>
                      <p className="text-xs text-gray-500">{analytics.attendanceStats.attendanceRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Cannot Go</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{analytics.attendanceStats.cannotGo}</p>
                      <p className="text-xs text-gray-500">
                        {(100 - analytics.attendanceStats.attendanceRate).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.groupDistribution.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm">{item.group}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.count}</p>
                        <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Money Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Money Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Collected</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(analytics.moneyStats.totalCollected)}</p>
                      <p className="text-xs text-gray-500">{analytics.moneyStats.collectionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(analytics.moneyStats.totalPending)}</p>
                      <p className="text-xs text-gray-500">{analytics.paymentStats.pending} people</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded" />
                      <span className="text-sm">Unpaid</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(analytics.moneyStats.totalUnpaid)}</p>
                      <p className="text-xs text-gray-500">{analytics.paymentStats.unpaid} people</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.moneyStats.totalCollected)}
                    </p>
                    <p className="text-sm text-gray-600">Collected</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(analytics.moneyStats.totalPending)}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(analytics.moneyStats.totalUnpaid)}
                    </p>
                    <p className="text-sm text-gray-600">Unpaid</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{analytics.attendanceStats.canGo}</p>
                    <p className="text-sm text-gray-600">Confirmed Attendance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{analytics.groupDistribution.length}</p>
                    <p className="text-sm text-gray-600">Active Groups</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
