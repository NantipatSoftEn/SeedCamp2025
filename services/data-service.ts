import type { Person } from "@/types/person"
import { mockPeople } from "@/data/mock-data"
import { fetchPeople as fetchSupabasePeople, updatePerson as updateSupabasePerson } from "@/lib/supabase"

export class DataService {
  private useMockData: boolean

  constructor(useMockData = false) {
    this.useMockData = useMockData
  }

  async fetchPeople(): Promise<Person[]> {
    if (this.useMockData) {
      // Simulate async behavior for mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockPeople)
        }, 500)
      })
    }
    return fetchSupabasePeople()
  }

  async updatePerson(id: string, person: Partial<Person>): Promise<Person | null> {
    if (this.useMockData) {
      // For mock data, just return the updated person
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedPerson = { ...mockPeople.find((p) => p.id === id), ...person } as Person
          resolve(updatedPerson)
        }, 300)
      })
    }
    return updateSupabasePerson(id, person)
  }
}
