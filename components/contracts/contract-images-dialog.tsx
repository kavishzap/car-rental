// src/components/contracts/contract-images-dialog.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { addContractImage, deleteContractImage, getContractImages, updateContractImage } from "@/lib/services/contractImages"
import type { ContractImage } from "@/lib/types"
import { Trash2, UploadCloud, Pencil } from "lucide-react"

type Props = {
  open: boolean
  contractId: string
  onClose: () => void
}

export function ContractImagesDialog({ open, contractId, onClose }: Props) {
  const { toast } = useToast()
  const [images, setImages] = useState<ContractImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState("")
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      setLoading(true)
      try {
        const data = await getContractImages(contractId)
        setImages(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [open, contractId])

  const canAddMore = images.length < 6

  async function handleFileToBase64(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!canAddMore) {
      toast({ title: "Limit reached", description: "Maximum of 6 images allowed per contract.", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const b64 = await handleFileToBase64(file)
      await addContractImage({ contractId, imageBase64: b64, caption: caption || undefined })
      const data = await getContractImages(contractId)
      setImages(data)
      setCaption("")
      toast({ title: "Image added" })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message ?? "Please try again.", variant: "destructive" })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function onReplace(image: ContractImage, file: File) {
    const b64 = await handleFileToBase64(file)
    await updateContractImage(image.id, { imageBase64: b64 })
    setImages(await getContractImages(contractId))
    toast({ title: "Image replaced" })
  }

  async function onDelete(id: string) {
    await deleteContractImage(id)
    setImages(await getContractImages(contractId))
    toast({ title: "Image deleted" })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-5xl">
        <DialogHeader>
          <DialogTitle>Contract Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Uploader */}
          <div className="grid gap-3 md:grid-cols-[1fr,2fr] items-end">
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. pre-delivery photo" />
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="upload">Attach image {canAddMore ? `(you can add ${6 - images.length} more)` : "(limit reached)"}</Label>
                <Input id="upload" ref={fileRef} type="file" accept="image/*" disabled={!canAddMore || uploading} onChange={onUpload} />
              </div>
              <Button type="button" variant="secondary" disabled>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>

          {/* Gallery */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : images.length === 0 ? (
              <div className="text-sm text-muted-foreground">No images yet. Add one above.</div>
            ) : (
              images.map((img) => (
                <div key={img.id} className="rounded border p-3 space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageBase64} alt={img.caption || "Contract image"} className="h-48 w-full object-contain bg-white rounded border" />
                  <Textarea
                    placeholder="Caption"
                    value={img.caption ?? ""}
                    onChange={async (e) => {
                      await updateContractImage(img.id, { caption: e.target.value })
                      setImages(await getContractImages(contractId))
                    }}
                    rows={2}
                  />
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <Pencil className="h-4 w-4" />
                      <span>Replace</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (f) await onReplace(img, f)
                        }}
                      />
                    </label>
                    <Button variant="ghost" className="text-destructive" onClick={() => onDelete(img.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
