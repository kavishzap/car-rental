"use server";

import { supabase } from "../supabase";
import type {
  Contract,
  ContractCreateInput,
  ContractUpdateInput,
} from "@/lib/types";

// NOTE: calculateContractTotal removed from here.
// It will live in a separate utils file.

// DB row type (snake_case)
type ContractRow = {
  id: string;
  contract_number: string;

  customer_id: string;
  car_id: string;

  start_date: string;
  end_date: string;

  daily_rate: string | number | null;
  days: number;

  subtotal: string | number | null;
  tax_rate: string | number | null;
  total: string | number | null;

  status: string;

  license_number: string | null;
  client_signature_base64: string | null;

  fuel_amount: number | null;
  pre_authorization: string | null;

  pickup_date: string | null;
  pickup_time: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  siege_bb_amount: string | number | null; // 👈 NEW
  rehausseur_amount: string | number | null; // 👈 NEW

  payment_mode: string | null;

  sim_amount: string | number | null;
  delivery_amount: string | number | null;

  card_payment_percent: string | number | null;
  card_payment_amount: string | number | null;

  second_driver_name: string | null;
  second_driver_license: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
};

const normalizeImageDataUrl = (
  raw?: string | null
): string | undefined => {
  const value = (raw ?? "").trim();
  if (!value) return undefined;
  if (value.startsWith("data:")) return value;
  const cleaned = value.startsWith(":") ? value.slice(1) : value;
  const mime = cleaned.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${cleaned}`;
};

function toNum(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

function mapRowToContract(row: ContractRow): Contract {
  return {
    id: row.id,
    contractNumber: row.contract_number,

    customerId: row.customer_id,
    carId: row.car_id,

    startDate: row.start_date,
    endDate: row.end_date,

    dailyRate: toNum(row.daily_rate),
    days: row.days,

    subtotal: toNum(row.subtotal),
    taxRate: toNum(row.tax_rate),
    total: toNum(row.total),

    status: row.status as Contract["status"],

    licenseNumber: row.license_number ?? undefined,
    clientSignatureBase64: normalizeImageDataUrl(
      row.client_signature_base64
    ),

    fuelAmount: row.fuel_amount ?? undefined,
    preAuthorization: row.pre_authorization ?? undefined,
    siegeBBAmount: toNum(row.siege_bb_amount), // 👈 NEW
    rehausseurAmount: toNum(row.rehausseur_amount), // 👈 NEW
    pickupDate: row.pickup_date ?? undefined,
    pickupTime: row.pickup_time ?? undefined,
    deliveryDate: row.delivery_date ?? undefined,
    deliveryTime: row.delivery_time ?? undefined,

    paymentMode: (row.payment_mode as Contract["paymentMode"]) ?? undefined,

    simAmount: toNum(row.sim_amount),
    deliveryAmount: toNum(row.delivery_amount),

    cardPaymentPercent: toNum(row.card_payment_percent),
    cardPaymentAmount: toNum(row.card_payment_amount),

    secondDriverName: row.second_driver_name ?? undefined,
    secondDriverLicense: row.second_driver_license ?? undefined,

    notes: row.notes ?? undefined,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function payloadToRow(
  payload: Partial<ContractCreateInput>
): Partial<ContractRow> {
  return {

    customer_id: payload.customerId,
    car_id: payload.carId,

    start_date: payload.startDate,
    end_date: payload.endDate,

    daily_rate: payload.dailyRate !== undefined ? payload.dailyRate : undefined,
    days: payload.days !== undefined ? payload.days : undefined,

    subtotal: payload.subtotal !== undefined ? payload.subtotal : undefined,
    tax_rate: payload.taxRate !== undefined ? payload.taxRate : undefined,
    total: payload.total !== undefined ? payload.total : undefined,

    status: payload.status,

    license_number: payload.licenseNumber ?? null,
    client_signature_base64: payload.clientSignatureBase64 ?? null,
    siege_bb_amount: payload.siegeBBAmount ?? null, // 👈 NEW
    rehausseur_amount: payload.rehausseurAmount ?? null, // 👈 NEW
    fuel_amount: payload.fuelAmount !== undefined ? payload.fuelAmount : null,
    pre_authorization: payload.preAuthorization ?? null,

    pickup_date: payload.pickupDate ?? null,
    pickup_time: payload.pickupTime ?? null,
    delivery_date: payload.deliveryDate ?? null,
    delivery_time: payload.deliveryTime ?? null,

    payment_mode: payload.paymentMode ?? null,

    sim_amount: payload.simAmount ?? null,
    delivery_amount: payload.deliveryAmount ?? null,

    card_payment_percent: payload.cardPaymentPercent ?? null,
    card_payment_amount: payload.cardPaymentAmount ?? null,

    second_driver_name: payload.secondDriverName ?? null,
    second_driver_license: payload.secondDriverLicense ?? null,

    notes: payload.notes ?? null,
  };
}

// LIST
export async function getContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts_details")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getContracts error", error);
    throw new Error(error.message);
  }

  return (data as ContractRow[]).map(mapRowToContract);
}

// GET ONE
export async function getContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from("contracts_details")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("getContractById error", error);
    throw new Error(error.message);
  }

  return mapRowToContract(data as ContractRow);
}

// CREATE
export async function createContract(
  payload: ContractCreateInput
): Promise<Contract> {
  const row = payloadToRow(payload);

  const { data, error } = await supabase
    .from("contracts_details")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("createContract error", error);
    throw new Error(error.message);
  }

  return mapRowToContract(data as ContractRow);
}

// UPDATE
export async function updateContract(
  id: string,
  updates: ContractUpdateInput
): Promise<Contract> {
  const row = payloadToRow(updates);

  const { data, error } = await supabase
    .from("contracts_details")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateContract error", error);
    throw new Error(error.message);
  }

  return mapRowToContract(data as ContractRow);
}

// DELETE
export async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase
    .from("contracts_details")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteContract error", error);
    throw new Error(error.message);
  }
}
/**
 * Get all contracts for a specific car.
 */
export async function getContractsByCar(carId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts_details")
    .select("*")
    .eq("car_id", carId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getContractsByCar error", error);
    throw new Error(error.message);
  }

  return (data as ContractRow[]).map(mapRowToContract);
}

/**
 * Get all contracts for a specific customer.
 */
export async function getContractsByCustomer(
  customerId: string
): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts_details")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getContractsByCustomer error", error);
    throw new Error(error.message);
  }

  return (data as ContractRow[]).map(mapRowToContract);
}
