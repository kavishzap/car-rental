// src/lib/services/contractImagesSite.ts
"use server";

import { supabase } from "../supabase";
import type { ContractImage } from "@/lib/types";

type ContractImageRow = {
  id: string;
  contract_id: string;
  image_base64: string;
  caption: string | null;
  created_at: string;
};

function mapRow(row: ContractImageRow): ContractImage {
  return {
    id: row.id,
    contractId: row.contract_id,
    imageBase64: row.image_base64,
    caption: row.caption ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getContractImages(
  contractId: string
): Promise<ContractImage[]> {
  console.log("📥 getContractImages() for contractId:", contractId);

  const { data, error } = await supabase
    .from("contract_images_sites") // ✅ FIXED: correct table name
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getContractImages error", error);
    throw new Error(error.message);
  }

  return (data as ContractImageRow[]).map(mapRow);
}

export async function addContractImage(input: {
  contractId: string;
  imageBase64: string;
  caption?: string;
}): Promise<ContractImage> {
  const { data, error } = await supabase
    .from("contract_images_sites") // ✅ FIXED here too
    .insert({
      contract_id: input.contractId,
      image_base64: input.imageBase64,
      caption: input.caption ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("addContractImage error", error);
    throw new Error(error.message);
  }

  return mapRow(data as ContractImageRow);
}

export async function updateContractImage(
  id: string,
  updates: { imageBase64?: string; caption?: string }
): Promise<ContractImage> {
  const patch: Partial<ContractImageRow> = {};

  if (updates.imageBase64 !== undefined) {
    patch.image_base64 = updates.imageBase64;
  }
  if (updates.caption !== undefined) {
    patch.caption = updates.caption ?? null;
  }

  const { data, error } = await supabase
    .from("contract_images_sites") // ✅ FIXED
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateContractImage error", error);
    throw new Error(error.message);
  }

  return mapRow(data as ContractImageRow);
}

export async function deleteContractImage(id: string): Promise<void> {
  const { error } = await supabase
    .from("contract_images_sites") // ✅ FIXED
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteContractImage error", error);
    throw new Error(error.message);
  }
}
