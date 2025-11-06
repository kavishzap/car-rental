import { createClient } from "@supabase/supabase-js";
import type { Contract, ContractInsert, ContractUpdate } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const table = "contracts";

// Reuse the same selection everywhere
const selectCols = `
  id, contract_number, customer_id, car_id,
  start_date, end_date, daily_rate, days, subtotal, discount, tax_rate, total,
  status, notes,
  license_number, client_signature_base64, owner_signature_base64,
  created_at, updated_at
`;

export async function getContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from(table)
    .select(selectCols)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from(table)
    .select(selectCols)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createContract(payload: ContractInsert): Promise<Contract> {
  const row = toRow(payload);
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select(selectCols)
    .single();

  if (error) throw error;
  return mapRow(data!);
}

// What the function actually accepts when updating
export type ContractChanges = Omit<ContractUpdate, "id">;

export async function updateContract(id: string, changes: ContractChanges): Promise<Contract> {
  const row = toRow({ id, ...changes });
  const { data, error } = await supabase
    .from(table)
    .update(row)
    .eq("id", id)
    .select(selectCols)
    .single();

  if (error) throw error;
  return mapRow(data!);
}

export async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

/** Totals helper (unchanged) */
export function calculateContractTotal(dailyRate: number, days: number, discount = 0, taxRate = 0) {
  const subtotal = Math.max(0, dailyRate * days - discount);
  const tax = (subtotal * (taxRate || 0)) / 100;
  const total = subtotal + tax;
  return { subtotal, total };
}

/** Derived helpers — always async so TS knows the types */
export async function getContractsByCar(carId: string): Promise<Contract[]> {
  const contracts = await getContracts();
  return contracts.filter((c) => c.carId === carId);
}

export async function getContractsByCustomer(customerId: string): Promise<Contract[]> {
  const contracts = await getContracts();
  return contracts.filter((c) => c.customerId === customerId);
}

/** Row mapping helpers */
function mapRow(row: any): Contract {
  return {
    id: row.id,
    contractNumber: row.contract_number,
    customerId: row.customer_id,
    carId: row.car_id,
    startDate: row.start_date,
    endDate: row.end_date,
    dailyRate: Number(row.daily_rate),
    days: Number(row.days),
    subtotal: Number(row.subtotal),
    discount: row.discount != null ? Number(row.discount) : undefined,
    taxRate: row.tax_rate != null ? Number(row.tax_rate) : undefined,
    total: Number(row.total),
    status: row.status,
    notes: row.notes ?? undefined,
    licenseNumber: row.license_number ?? undefined,
    clientSignatureBase64: row.client_signature_base64 ?? undefined,
    ownerSignatureBase64: row.owner_signature_base64 ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(payload: Partial<Contract>): Record<string, unknown> {
  return {
    contract_number: payload.contractNumber,
    customer_id: payload.customerId,
    car_id: payload.carId,
    start_date: payload.startDate,
    end_date: payload.endDate,
    daily_rate: payload.dailyRate,
    days: payload.days,
    subtotal: payload.subtotal,
    discount: payload.discount,
    tax_rate: payload.taxRate,
    total: payload.total,
    status: payload.status,
    notes: payload.notes,
    license_number: payload.licenseNumber,
    client_signature_base64: payload.clientSignatureBase64,
    owner_signature_base64: payload.ownerSignatureBase64,
  };
}
