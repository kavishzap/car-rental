export type ID = string
export type Currency = number

export type Car = {
  id: string
  name: string
  brand: string
  model: string
  year: number
  plateNumber: string
  pricePerDay: number
  status: "available" | "maintenance" | "unavailable"
  notes?: string | null
  imageBase64?: string | null
  createdAt: string
  updatedAt: string
}

export type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nicOrPassport: string
  address?: string | null
  photoBase64?: string | null
  createdAt: string
  updatedAt: string
}

export type Contract = {
  id: string
  contractNumber: string
  customerId: string
  carId: string
  startDate: string
  endDate: string
  dailyRate: number
  days: number
  subtotal: number
  discount?: number
  taxRate?: number
  total: number
  status: "draft" | "active" | "completed" | "cancelled" | "overdue"
  notes?: string
  // NEW:
  licenseNumber?: string
  clientSignatureBase64?: string
  ownerSignatureBase64?: string

  createdAt: string
  updatedAt: string
}

export type ContractInsert = Omit<
  Contract,
  "id" | "createdAt" | "updatedAt"
> & { id?: string }

export type ContractUpdate = Partial<Contract> & { id: string }


export type AuthData = {
  token: string
  user: {
    name: string
    email: string
  }
}
export type ContractImage = {
  id: string
  contractId: string
  imageBase64: string
  caption?: string
  createdAt: string
}