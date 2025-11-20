// src/lib/services/contractAvailability.ts
"use server";

import { supabase } from "../supabase";

/**
 * Adjust these field names if your DB columns differ,
 * e.g. start_date -> startDate, car_id -> carId, etc.
 */
type ContractRow = {
  id: string;
  car_id: string;
  start_date: string; // ISO string
  end_date: string;   // ISO string
};

/**
 * Range in YYYY-MM-DD for easier date-only handling.
 */
export type DateRange = {
  start: string;
  end: string;
};

export async function getCarBookedDateRanges(
  carId: string
): Promise<DateRange[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, car_id, start_date, end_date") // 🔁 adjust if needed
    .eq("car_id", carId); // whatever the status → no .neq()

  if (error) {
    console.error("getCarBookedDateRanges error", error);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ContractRow[];

  return rows.map((row) => ({
    start: row.start_date.slice(0, 10),
    end: row.end_date.slice(0, 10),
  }));
}
