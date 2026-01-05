export type ID = string;
export type Currency = number;

export type Car = {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  color?: string | null;
  pricePerDay: number;
  status: "available" | "maintenance" | "unavailable";
  km: string | null; // NEW
  servicing: string | null; // NEW (e.g. "Next service in June 2026")
  nta: string | null; // NEW (e.g. NTA permit/expiry)
  psv: string | null; // NEW (e.g. PSV permit/expiry)
  notes?: string | null;
  imageBase64?: string | null;
  createdAt: string;
  updatedAt: string; // fixed "strin" typo
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nicOrPassport: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  license?: string | null;
  notes?: string | null;
  photoBase64?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContractInsert = Omit<
  Contract,
  "id" | "createdAt" | "updatedAt" | "contractNumber"
> & { id?: string; contractNumber?: string };

export type ContractUpdate = Partial<Contract> & { id: string };

export type AuthData = {
  token: string;
  user: {
    name: string;
    email: string;
  };
};
export type ContractImage = {
  id: string;
  contractId: string;
  imageBase64: string;
  caption?: string;
  createdAt: string;
};

export type ContractStatus = "draft" | "completed" | "cancelled";

export interface Contract {
  id: string;
  contractNumber: string;

  customerId: string;
  carId: string;

  startDate: string; // ISO string
  endDate: string; // ISO string

  dailyRate: number;
  days: number;

  subtotal: number;
  taxRate: number;
  total: number;

  status: ContractStatus;

  licenseNumber?: string | null;
  customerNicOrPassport?: string | null;
  clientSignatureBase64?: string | null;

  fuelAmount?: number | null;
  preAuthorization?: string | null;

  pickupDate?: string | null;
  pickupTime?: string | null;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  deliveryPlace?: string | null;

  paymentMode?: "cash" | "card" | "bank_transfer" | "other" | null;

  simAmount?: number | null;
  deliveryAmount?: number | null;
  siegeBBAmount?: number | null;
  rehausseurAmount?: number | null;

  cardPaymentPercent?: number | null;
  cardPaymentAmount?: number | null;

  secondDriverName?: string | null;
  secondDriverLicense?: string | null;

  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;

  // keep this if you still use it in table (optional, not in DB)
  ownerSignatureBase64?: string | null;
}

export type ContractCreateInput = Omit<
  Contract,
  "id" | "createdAt" | "updatedAt" | "contractNumber"
> & {
  contractNumber?: string; // optional, usually not sent
};

export type ContractUpdateInput = Partial<ContractCreateInput>;
