// src/components/contracts/contract-images-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ContractImage } from "@/lib/types";
import { getContractImages } from "@/lib/services/contractImagesSite";

type Props = {
  open: boolean;
  contractId: string;
  onClose: () => void;
};

export function ContractImagesDialog({ open, contractId, onClose }: Props) {
  const { toast } = useToast();
  const [images, setImages] = useState<ContractImage[]>([]);
  const [loading, setLoading] = useState(false);

  // 🆕 preview state
  const [previewImage, setPreviewImage] = useState<ContractImage | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getContractImages(contractId);
        setImages(data);
      } catch (err: any) {
        toast({
          title: "Failed to load images",
          description: err?.message ?? "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, contractId, toast]);

  return (
    <>
      {/* Main gallery dialog */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="w-[96vw] max-w-5xl"
          showCloseButton={false} // ✅ no "X" here, we use footer Close
        >
          <DialogHeader>
            <DialogTitle>Contract Images</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : images.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No images available for this contract.
                </div>
              ) : (
                images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setPreviewImage(img)}
                    className="rounded border p-3 space-y-2 bg-muted/20 text-left hover:bg-muted/40 transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageBase64}
                      alt={img.caption || "Contract image"}
                      className="h-48 w-full object-contain bg-white rounded border"
                    />
                    {img.caption && (
                      <Textarea
                        value={img.caption}
                        readOnly
                        rows={2}
                        className="resize-none bg-muted/40 cursor-default"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-4xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>

          {previewImage && (
            <div className="flex flex-col gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.imageBase64}
                alt={previewImage.caption || "Contract image"}
                className="max-h-[70vh] w-full object-contain bg-black/90 rounded"
              />
              {previewImage.caption && (
                <Textarea
                  value={previewImage.caption}
                  readOnly
                  rows={2}
                  className="resize-none bg-muted/40 cursor-default"
                />
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
