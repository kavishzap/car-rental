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

function toDataUrl(raw: string): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (value.startsWith("data:")) return value;

  // Rows are stored as bare base64 (sometimes with a leading colon).
  const cleaned = value.startsWith(":") ? value.slice(1) : value;
  const mime = cleaned.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${cleaned}`;
}

function mapRow(row: ContractImageRow): ContractImage {
  return {
    id: row.id,
    contractId: row.contract_id,
    imageBase64: toDataUrl(row.image_base64),
    caption: row.caption ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getContractImages(
  contractId: string
): Promise<ContractImage[]> {
  console.log("getContractImages() for contractId:", contractId);

  const { data, error } = await supabase
    .from("contract_images_sites")
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
    .from("contract_images_sites")
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
    .from("contract_images_sites")
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
    .from("contract_images_sites")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteContractImage error", error);
    throw new Error(error.message);
  }
}


