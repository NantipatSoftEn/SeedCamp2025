export interface Person {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: Address
  company?: Company
}

export interface Address {
  street: string
  city: string
  state: string
  zip: string
}

export interface Company {
  name: string
  catchPhrase: string
  bs: string
}
