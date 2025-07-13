"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Users, Phone, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

import type { Person, PersonFormData } from "./types/person"
import { EditPersonForm } from "./components/edit-person-form"
import { formatCurrency } from "./utils/analytics"
import { useDataSource } from "@/contexts/data-source-context"
import { DataService } from "@/services/data-service"
import { EditButton } from "./components/edit-button"

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "Unpaid":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export default function PeopleDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("")
  const [people, setPeople] = useState<Person[]>([])
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingPersonId, setUpdatingPersonId] = useState<string | null>(null)
  const { toast } = useToast()
  const { dataSource } = useDataSource()

  // Fetch people data
  useEffect(() => {
    async function loadPeople() {
      setIsLoading(true)
      try {
        const dataService = new DataService(dataSource === "mock")
        const data = await dataService.fetchPeople()
        setPeople(data)

        // Set initial active tab if we have data
        if (data.length > 0) {
          const groups = Array.from(new Set(data.map((p) => p.group_care)))
          setActiveTab(groups[0] || "")
        }
      } catch (error) {
        console.error("Failed to load people:", error)
        toast({
          title: "Error loading data",
          description:
            dataSource === "mock"
              ? "There was a problem loading the mock data."
              : "There was a problem loading the people data from Supabase.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPeople()
  }, [toast, dataSource])

  // Get unique group_care values
  const groupCareValues = useMemo(() => {
    const values = Array.from(new Set(people.map((person) => person.group_care)))
    return values.sort((a, b) => {
      if (a === "ungroup") return 1
      if (b === "ungroup") return -1
      return a.localeCompare(b, "th")
    })
  }, [people])

  // Group people by group_care
  const groupedPeople = useMemo(() => {
    return groupCareValues.reduce(
      (acc, groupCare) => {
        acc[groupCare] = people.filter((person) => person.group_care === groupCare)
        return acc
      },
      {} as Record<string, Person[]>,
    )
  }, [groupCareValues, people])

  // Filter people based on search term
  const getFilteredPeople = (people: Person[]) => {
    if (!searchTerm) return people

    return people.filter(
      (person) =>
        person.nick_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone.includes(searchTerm) ||
        person.remark.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const handleEditPerson = (person: Person) => {
    console.log("Opening edit form for:", person)
    setEditingPerson(person)
    setIsEditFormOpen(true)
  }

  const handleSavePerson = async (personId: string, formData: PersonFormData): Promise<void> => {
    console.log("🔄 Starting save operation for person:", personId)
    setUpdatingPersonId(personId)

    try {
      console.log("🔄 Saving person:", { personId, formData, dataSource })

      const dataService = new DataService(dataSource === "mock")
      const updatedPerson = await dataService.updatePerson(personId, formData)

      if (updatedPerson) {
        // Update local state immediately for better UX
        setPeople((prevPeople) =>
          prevPeople.map((person) => (person.id === personId ? { ...person, ...formData } : person)),
        )

        toast({
          title: "✅ Person updated successfully",
          description: `${formData.nick_name}'s information has been updated in ${
            dataSource === "mock" ? "mock data" : "Supabase database"
          }.`,
        })

        console.log("✅ Person updated successfully:", updatedPerson)

        // Close the edit form and reset states
        setIsEditFormOpen(false)
        setEditingPerson(null)
        setUpdatingPersonId(null)
      } else {
        throw new Error("No updated person returned")
      }
    } catch (error) {
      console.error("❌ Failed to update person:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      toast({
        title: "❌ Update failed",
        description: `Failed to update ${formData.nick_name}: ${errorMessage}`,
        variant: "destructive",
      })

      // Reset updating state on error
      setUpdatingPersonId(null)

      // Re-throw the error so the form can handle it
      throw error
    }
  }

  const handleCloseEditForm = () => {
    console.log("🔄 Closing edit form and resetting states")
    setIsEditFormOpen(false)
    setEditingPerson(null)
    setUpdatingPersonId(null)
  }

  // Calculate total statistics
  const totalPeople = people.length
  const paidCount = people.filter((p) => p.payment_status === "Paid").length
  const canGoCount = people.filter((p) => p.can_go).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading people data...</p>
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
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total People</p>
                  <p className="text-2xl font-bold">{totalPeople}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-green-600 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
                  <p className="text-2xl font-bold">{paidCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-blue-600 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">สามารถไปค่ายได้</p>
                  <p className="text-2xl font-bold">{canGoCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">People Dashboard</CardTitle>
            <CardDescription>
              Manage and view people organized by their group care assignments
              <Badge variant="outline" className="ml-2">
                Data Source: {dataSource === "mock" ? "Mock Data" : "Supabase Database"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {people.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium mb-4">No people found in the database</p>
                <p className="text-gray-500">You need to import data or add people to get started.</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col space-y-4">
                  {/* Tab Navigation - Responsive */}
                  <div className="overflow-x-auto">
                    <TabsList className="inline-flex h-auto min-w-full">
                      {groupCareValues.map((groupCare) => (
                        <TabsTrigger
                          key={groupCare}
                          value={groupCare}
                          className="flex items-center gap-2 p-3 whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">{groupCare}</span>
                          <span className="sm:hidden">{groupCare.slice(0, 3)}</span>
                          <Badge variant="secondary" className="ml-1">
                            {groupedPeople[groupCare]?.length || 0}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, phone, or remark..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Tab Content */}
                  {groupCareValues.map((groupCare) => {
                    const filteredPeople = getFilteredPeople(groupedPeople[groupCare] || [])

                    return (
                      <TabsContent key={groupCare} value={groupCare} className="mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span>Group: {groupCare}</span>
                              <Badge variant="outline">
                                {filteredPeople.length} of {groupedPeople[groupCare]?.length || 0} people
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {/* Mobile Card View */}
                            <div className="block lg:hidden space-y-4">
                              {filteredPeople.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  {searchTerm ? "No people found matching your search." : "No people in this group."}
                                </div>
                              ) : (
                                filteredPeople.map((person) => (
                                  <Card key={person.id} className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-semibold text-lg">{person.nick_name}</h3>
                                          <Link href={`/person/${person.id}`}>
                                            <Button size="sm" variant="ghost">
                                              <ExternalLink className="h-3 w-3" />
                                            </Button>
                                          </Link>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {person.first_name} {person.last_name}
                                        </p>
                                      </div>
                                      <EditButton
                                        onClick={() => handleEditPerson(person)}
                                        isLoading={updatingPersonId === person.id}
                                        disabled={updatingPersonId !== null}
                                      />
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{person.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Amount:</span>
                                        <span className="font-medium">{formatCurrency(person.payment_amount)}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{person.shirt_size}</Badge>
                                        <Badge className={getPaymentStatusColor(person.payment_status)}>
                                          {person.payment_status}
                                        </Badge>
                                        <Badge variant={person.can_go ? "default" : "destructive"}>
                                          {person.can_go ? "สามารถไปค่ายได้" : "Cannot Go"}
                                        </Badge>
                                      </div>
                                      {person.remark && <p className="text-gray-600 text-xs mt-2">{person.remark}</p>}
                                    </div>
                                  </Card>
                                ))
                              )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block rounded-md border overflow-hidden">
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="min-w-[80px]">Nickname</TableHead>
                                      <TableHead className="min-w-[100px]">First Name</TableHead>
                                      <TableHead className="min-w-[100px]">Last Name</TableHead>
                                      <TableHead className="min-w-[80px]">Gender</TableHead>
                                      <TableHead className="min-w-[120px]">Phone</TableHead>
                                      <TableHead className="min-w-[100px]">Amount</TableHead>
                                      <TableHead className="min-w-[80px]">Shirt Size</TableHead>
                                      <TableHead className="min-w-[100px]">Payment</TableHead>
                                      <TableHead className="min-w-[80px]">สามารถไปค่ายได้</TableHead>
                                      <TableHead className="min-w-[150px]">Remark</TableHead>
                                      <TableHead className="min-w-[100px] text-center sticky right-0 bg-white dark:bg-gray-800">
                                        Actions
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredPeople.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                                          {searchTerm
                                            ? "No people found matching your search."
                                            : "No people in this group."}
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      filteredPeople.map((person) => (
                                        <TableRow key={person.id}>
                                          <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                              {person.nick_name}
                                              <Link href={`/person/${person.id}`}>
                                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                                  <ExternalLink className="h-3 w-3" />
                                                </Button>
                                              </Link>
                                            </div>
                                          </TableCell>
                                          <TableCell>{person.first_name}</TableCell>
                                          <TableCell>{person.last_name}</TableCell>
                                          <TableCell>{person.gender}</TableCell>
                                          <TableCell className="font-mono text-sm">{person.phone}</TableCell>
                                          <TableCell className="font-mono text-sm">
                                            {formatCurrency(person.payment_amount)}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline">{person.shirt_size}</Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Badge className={getPaymentStatusColor(person.payment_status)}>
                                              {person.payment_status}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={person.can_go ? "default" : "destructive"}>
                                              {person.can_go ? "Yes" : "No"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="max-w-[200px]">
                                            <div className="truncate" title={person.remark}>
                                              {person.remark || "-"}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center sticky right-0 bg-white dark:bg-gray-800">
                                            <EditButton
                                              onClick={() => handleEditPerson(person)}
                                              isLoading={updatingPersonId === person.id}
                                              disabled={updatingPersonId !== null}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  })}
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Edit Form Modal */}
        <EditPersonForm
          person={editingPerson}
          isOpen={isEditFormOpen}
          onClose={handleCloseEditForm}
          onSave={handleSavePerson}
        />
      </div>
    </div>
  )
}
