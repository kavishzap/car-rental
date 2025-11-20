import { supabase } from "@/lib/supabase";

export async function generateContractNumber() {
  const { data } = await supabase
    .from("contracts")
    .select("contract_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let last = 0;

  if (data?.contract_number) {
    const parsed = parseInt(data.contract_number, 10);
    if (!Number.isNaN(parsed)) last = parsed;
  }

  return (last + 1).toString().padStart(6, "0");
}
