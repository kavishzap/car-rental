import { supabase } from "@/lib/supabase";
import type { Customer } from "@/lib/types";

const mapFromDb = (r: any): Customer => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email,
  phone: r.phone,
  nicOrPassport: r.nic_or_passport,
  address: r.address,
  photoBase64: r.photo_base64,
  notes: r.notes,          // NEW
  license: r.license,      // NEW
  city: r.city,            // NEW
  country: r.country,      // NEW
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapToDb = (c: Partial<Customer>) => ({
  first_name: c.firstName,
  last_name: c.lastName,
  email: c.email,
  phone: c.phone,
  nic_or_passport: c.nicOrPassport,
  address: c.address ?? null,
  photo_base64: c.photoBase64 ?? null,
  notes: c.notes ?? null,        // NEW
  license: c.license ?? null,    // NEW
  city: c.city ?? null,          // NEW
  country: c.country ?? null,    // NEW
});

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFromDb);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if ((error as any).code === "PGRST116") return null;
    throw error;
  }
  return data ? mapFromDb(data) : null;
}

export async function createCustomer(
  payload: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert(mapToDb(payload))
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function updateCustomer(
  id: string,
  payload: Partial<Customer>
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update(mapToDb(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}
