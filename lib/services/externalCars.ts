// lib/services/externalCars.ts
"use server";

import { supabase } from "@/lib/supabase";
import type { ExternalCar } from "@/lib/types";

// DB row type (snake_case)
type ExternalCarRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate_number: string | null;
  price_per_day: number;
};

function mapFromDb(row: ExternalCarRow): ExternalCar {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    year: row.year ?? undefined,
    plateNumber: row.plate_number ?? undefined,
    pricePerDay: row.price_per_day,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToDb(car: Partial<ExternalCar>): Partial<ExternalCarRow> {
  return {
    name: car.name,
    brand: car.brand ?? null,
    model: car.model ?? null,
    year: car.year ?? null,
    plate_number: car.plateNumber ?? null,
    price_per_day: car.pricePerDay,
  };
}

export async function getExternalCars(): Promise<ExternalCar[]> {
  const { data, error } = await supabase
    .from("external_cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFromDb);
}

export async function getExternalCarById(id: string): Promise<ExternalCar | null> {
  const { data, error } = await supabase
    .from("external_cars")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if ((error as any).code === "PGRST116") return null;
    throw error;
  }
  return data ? mapFromDb(data) : null;
}

export async function createExternalCar(
  payload: Omit<ExternalCar, "id" | "createdAt" | "updatedAt">
): Promise<ExternalCar> {
  const { data, error } = await supabase
    .from("external_cars")
    .insert(mapToDb(payload))
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function updateExternalCar(
  id: string,
  payload: Partial<ExternalCar>
): Promise<ExternalCar> {
  const { data, error } = await supabase
    .from("external_cars")
    .update(mapToDb(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function deleteExternalCar(id: string): Promise<void> {
  const { error } = await supabase.from("external_cars").delete().eq("id", id);
  if (error) throw error;
}

