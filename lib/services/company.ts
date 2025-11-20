import { supabase } from "@/lib/supabase";

export type CompanyDetails = {
  id: string;
  name: string;
  email: string;
  brn: string;
  whatsapp_num: string | null;
  tel: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
  logo?: string | null;
};

const mapFromDb = (r: any): CompanyDetails => ({
  id: r.id,
  name: r.name,
  email: r.email,
  brn: r.brn,
  whatsapp_num: r.whatsapp_num,
  tel: r.tel,
  terms: r.terms,
  created_at: r.created_at,
  updated_at: r.updated_at,
  logo: r.logo || null,
});

export async function getCompanyDetails(): Promise<CompanyDetails | null> {
  const { data, error } = await supabase
    .from("company_details")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapFromDb(data) : null;
}

export async function createCompanyDetails(payload: Partial<CompanyDetails>) {
  const { data, error } = await supabase
    .from("company_details")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function updateCompanyDetails(
  id: string,
  payload: Partial<CompanyDetails>
) {
  const { data, error } = await supabase
    .from("company_details")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapFromDb(data);
}
