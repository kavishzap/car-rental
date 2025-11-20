// lib/services/cars.ts
import { supabase } from "@/lib/supabase";
import type { Car } from "@/lib/types";

const mapFromDb = (r: any): Car => ({
  id: r.id,
  name: r.name,
  brand: r.brand,
  model: r.model,
  year: r.year,
  plateNumber: r.plate_number,
  pricePerDay: r.price_per_day,
  status: r.status,
  km: r.km,
  servicing: r.servicing,
  nta: r.nta,
  psv: r.psv,
  notes: r.notes,
  imageBase64: r.image_base64,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapToDb = (c: Partial<Car>) => ({
  name: c.name,
  brand: c.brand,
  model: c.model,
  year: c.year,
  plate_number: c.plateNumber,
  price_per_day: c.pricePerDay,
  status: c.status,
  km: c.km,
  servicing: c.servicing ?? null,
  nta: c.nta ?? null,
  psv: c.psv ?? null,
  notes: c.notes ?? null,
  image_base64: c.imageBase64 ?? null,
});

export async function getCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFromDb);
}

export async function getCarById(id: string): Promise<Car | null> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if ((error as any).code === "PGRST116") return null;
    throw error;
  }
  return data ? mapFromDb(data) : null;
}

export async function createCar(
  payload: Omit<Car, "id" | "createdAt" | "updatedAt">
): Promise<Car> {
  const { data, error } = await supabase
    .from("cars")
    .insert(mapToDb(payload))
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function updateCar(
  id: string,
  payload: Partial<Car>
): Promise<Car> {
  const { data, error } = await supabase
    .from("cars")
    .update(mapToDb(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function deleteCar(id: string): Promise<void> {
  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) throw error;
}
