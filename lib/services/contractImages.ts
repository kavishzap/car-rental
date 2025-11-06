// src/lib/services/contractImages.ts
import type { ContractImage } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

const KEY = "contract_images"

function readAll(): ContractImage[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as ContractImage[]) : []
}

function writeAll(items: ContractImage[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(items))
}

export async function getContractImages(contractId: string): Promise<ContractImage[]> {
  const all = readAll()
  return all.filter((x) => x.contractId === contractId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

export async function addContractImage(params: { contractId: string; imageBase64: string; caption?: string }): Promise<ContractImage> {
  const item: ContractImage = {
    id: uuidv4(),
    contractId: params.contractId,
    imageBase64: params.imageBase64,
    caption: params.caption,
    createdAt: new Date().toISOString(),
  }
  const all = readAll()
  all.push(item)
  writeAll(all)
  return item
}

export async function updateContractImage(id: string, patch: Partial<Pick<ContractImage, "imageBase64" | "caption">>) {
  const all = readAll()
  const idx = all.findIndex((x) => x.id === id)
  if (idx === -1) return false
  all[idx] = { ...all[idx], ...patch }
  writeAll(all)
  return true
}

export async function deleteContractImage(id: string) {
  const all = readAll()
  const next = all.filter((x) => x.id !== id)
  writeAll(next)
  return true
}
