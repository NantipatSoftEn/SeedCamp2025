import type { Person } from "@/types/person"
import { mockPeople } from "@/data/mock-data"
import { fetchPeople as fetchSupabasePeople, updatePerson as updateSupabasePerson, fetchGroupPaymentAnalysis } from "@/lib/supabase"

export class DataService {
  private useMockData: boolean
  private static mockDataCache: Person[] = [...mockPeople]

  constructor(useMockData = false) {
    this.useMockData = useMockData
  }

  async fetchPeople(): Promise<Person[]> {
    if (this.useMockData) {
      console.log("Fetching mock data...")
      // Return cached mock data to maintain state
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...DataService.mockDataCache])
        }, 500)
      })
    }

    console.log("Fetching data from Supabase...")
    return fetchSupabasePeople()
  }

  async updatePerson(id: string, personData: Partial<Person>): Promise<Person | null> {
    if (this.useMockData) {
      console.log("Updating mock data for person:", id, personData)
      // Update mock data cache
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const personIndex = DataService.mockDataCache.findIndex((p) => p.id === id)
          if (personIndex === -1) {
            reject(new Error("Person not found in mock data"))
            return
          }

          // Update the person in cache
          DataService.mockDataCache[personIndex] = {
            ...DataService.mockDataCache[personIndex],
            ...personData,
          }

          console.log("Mock data updated successfully:", DataService.mockDataCache[personIndex])
          resolve(DataService.mockDataCache[personIndex])
        }, 300)
      })
    }

    console.log("Updating person in Supabase:", id, personData)
    // Use Supabase for real data
    const result = await updateSupabasePerson(id, personData)
    console.log("Supabase update result:", result)
    return result
  }

  async fetchGroupPaymentAnalysis(): Promise<Array<{group_care: string; total_extracted_amount: number; payment_slip_count: number}>> {
    if (this.useMockData) {
      // Return mock data for group payment analysis
      return [
        { group_care: "ungroup", total_extracted_amount: 7200, payment_slip_count: 3 },
        { group_care: "พก.", total_extracted_amount: 5360, payment_slip_count: 5 },
        { group_care: "จันทรเทียม", total_extracted_amount: 4800, payment_slip_count: 2 },
        { group_care: "รังสิต", total_extracted_amount: 3840, payment_slip_count: 3 },
      ];
    }

    return fetchGroupPaymentAnalysis();
  }

  // Method to reset mock data cache
  static resetMockData() {
    DataService.mockDataCache = [...mockPeople]
    console.log("Mock data cache reset")
  }

  // Method to get current mock data (for debugging)
  static getMockData() {
    return [...DataService.mockDataCache]
  }
}
