// lib/services/cars.ts
import { supabase } from "@/lib/supabase";
import type { Car } from "@/lib/types";

/** All car columns except `image_base64` (large); keeps list/detail responses small. */
const CAR_ROW_SELECT =
  "id,name,brand,model,year,plate_number,price_per_day,status,km,servicing,nta,psv,notes,created_at,updated_at";

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
  ...(r.image_base64 != null && r.image_base64 !== ""
    ? { imageBase64: r.image_base64 as string }
    : {}),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapToDb = (c: Partial<Car>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (c.name !== undefined) row.name = c.name;
  if (c.brand !== undefined) row.brand = c.brand;
  if (c.model !== undefined) row.model = c.model;
  if (c.year !== undefined) row.year = c.year;
  if (c.plateNumber !== undefined) row.plate_number = c.plateNumber;
  if (c.pricePerDay !== undefined) row.price_per_day = c.pricePerDay;
  if (c.status !== undefined) row.status = c.status;
  if (c.km !== undefined) row.km = c.km ?? null;
  if (c.servicing !== undefined) row.servicing = c.servicing ?? null;
  if (c.nta !== undefined) row.nta = c.nta ?? null;
  if (c.psv !== undefined) row.psv = c.psv ?? null;
  if (c.notes !== undefined) row.notes = c.notes ?? null;
  if (c.imageBase64 !== undefined) row.image_base64 = c.imageBase64 ?? null;
  return row;
};

export async function getCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_ROW_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFromDb);
}

export async function getCarById(id: string): Promise<Car | null> {
  if (id == null || String(id).trim() === "") return null;

  const { data, error } = await supabase
    .from("cars")
    .select(CAR_ROW_SELECT)
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
    .select(CAR_ROW_SELECT)
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
    .select(CAR_ROW_SELECT)
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function deleteCar(id: string): Promise<void> {
  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) throw error;
}
