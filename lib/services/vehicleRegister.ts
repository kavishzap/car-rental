"use server";

import { supabase } from "@/lib/supabase";
import type { VehicleRegister } from "@/lib/types";

type VehicleRegisterRow = {
  id: string;
  plate_no: string;
  vehicle_name: string | null;
  model: string | null;
  color: string | null;
  psv_license_no: string | null;
  psv_expiry: string | null;
  fitness_expiry: string | null;
  disc_no: string | null;
  mvl_expiry: string | null;
  insurance_policy_no: string | null;
  insurance_start_date: string | null;
  insurance_end_date: string | null;
  created_at: string;
  updated_at: string;
};

function mapRowToVehicleRegister(row: VehicleRegisterRow): VehicleRegister {
  return {
    id: row.id,
    plateNo: row.plate_no,
    vehicleName: row.vehicle_name ?? undefined,
    model: row.model ?? undefined,
    color: row.color ?? undefined,
    psvLicenseNo: row.psv_license_no ?? undefined,
    psvExpiry: row.psv_expiry ?? undefined,
    fitnessExpiry: row.fitness_expiry ?? undefined,
    discNo: row.disc_no ?? undefined,
    mvlExpiry: row.mvl_expiry ?? undefined,
    insurancePolicyNo: row.insurance_policy_no ?? undefined,
    insuranceStartDate: row.insurance_start_date ?? undefined,
    insuranceEndDate: row.insurance_end_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function vehicleRegisterToRow(
  v: Partial<VehicleRegister>
): Partial<VehicleRegisterRow> {
  return {
    plate_no: v.plateNo,
    vehicle_name: v.vehicleName ?? null,
    model: v.model ?? null,
    color: v.color ?? null,
    psv_license_no: v.psvLicenseNo ?? null,
    psv_expiry: v.psvExpiry ?? null,
    fitness_expiry: v.fitnessExpiry ?? null,
    disc_no: v.discNo ?? null,
    mvl_expiry: v.mvlExpiry ?? null,
    insurance_policy_no: v.insurancePolicyNo ?? null,
    insurance_start_date: v.insuranceStartDate ?? null,
    insurance_end_date: v.insuranceEndDate ?? null,
  };
}

export async function getVehicleRegisters(): Promise<VehicleRegister[]> {
  const { data, error } = await supabase
    .from("vehicle_register")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRowToVehicleRegister);
}

export async function createVehicleRegister(
  payload: Omit<VehicleRegister, "id" | "createdAt" | "updatedAt">
): Promise<VehicleRegister> {
  const { data, error } = await supabase
    .from("vehicle_register")
    .insert(vehicleRegisterToRow(payload))
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToVehicleRegister(data);
}

export async function updateVehicleRegister(
  id: string,
  payload: Partial<VehicleRegister>
): Promise<VehicleRegister> {
  const { data, error } = await supabase
    .from("vehicle_register")
    .update(vehicleRegisterToRow(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToVehicleRegister(data);
}

export async function deleteVehicleRegister(id: string): Promise<void> {
  const { error } = await supabase
    .from("vehicle_register")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

