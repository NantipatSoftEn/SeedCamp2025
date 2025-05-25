import type { Person } from "@/types/person"
import { mockPeople } from "@/data/mock-data"
import { fetchPeople as fetchSupabasePeople, updatePerson as updateSupabasePerson } from "@/lib/supabase"

export class DataService {
  private useMockData: boolean
  private static mockDataCache: Person[] = [...mockPeople]

  constructor(useMockData = false) {
    this.useMockData = useMockData
  }

  async fetchPeople(): Promise<Person[]> {
    if (this.useMockData) {
      // Return cached mock data to maintain state
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...DataService.mockDataCache])
        }, 500)
      })
    }
    return fetchSupabasePeople()
  }

  async updatePerson(id: string, personData: Partial<Person>): Promise<Person | null> {
    if (this.useMockData) {
      // Update mock data cache
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const personIndex = DataService.mockDataCache.findIndex((p) => p.id === id)
          if (personIndex === -1) {
            reject(new Error("Person not found"))
            return
          }

          // Update the person in cache
          DataService.mockDataCache[personIndex] = {
            ...DataService.mockDataCache[personIndex],
            ...personData,
          }

          resolve(DataService.mockDataCache[personIndex])
        }, 300)
      })
    }

    // Use Supabase for real data
    return updateSupabasePerson(id, personData)
  }

  // Method to reset mock data cache
  static resetMockData() {
    DataService.mockDataCache = [...mockPeople]
  }
}
