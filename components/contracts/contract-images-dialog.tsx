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
import { getContractImages } from "@/lib/services/contractImagesSite"; // 👈 NEW
type Props = {
  open: boolean;
  contractId: string;
  onClose: () => void;
};

export function ContractImagesDialog({ open, contractId, onClose }: Props) {
  const { toast } = useToast();
  const [images, setImages] = useState<ContractImage[]>([]);
  const [loading, setLoading] = useState(false);

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-5xl">
        <DialogHeader>
          <DialogTitle>Contract Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Gallery only – read-only */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : images.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No images available for this contract.
              </div>
            ) : (
              images.map((img) => (
                <div
                  key={img.id}
                  className="rounded border p-3 space-y-2 bg-muted/20"
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
                </div>
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
  );
}
