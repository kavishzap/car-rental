"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  addContractImages,
  deleteContractImage,
  getContractImages,
} from "@/lib/services/contractImagesSite";
import { fileToBase64 } from "@/lib/utils/fileToBase64";
import { Trash2, Upload } from "lucide-react";

const MAX_IMAGES = 4;

type Props = {
  open: boolean;
  contractId: string;
  onClose: () => void;
};

export function ContractImagesDialog({ open, contractId, onClose }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ContractImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<ContractImage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContractImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remainingSlots = MAX_IMAGES - images.length;
  const atMax = images.length >= MAX_IMAGES;

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContractImages(contractId);
      setImages(data);
    } catch (err: unknown) {
      toast({
        title: "Failed to load images",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [contractId, toast]);

  useEffect(() => {
    if (!open) {
      setPendingDelete(null);
      setPreviewImage(null);
      return;
    }
    void loadImages();
  }, [open, loadImages]);

  const handleUploadClick = () => {
    if (atMax) {
      toast({
        title: "Maximum reached",
        description: `You can attach up to ${MAX_IMAGES} images per contract.`,
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (files.length === 0) return;

    if (atMax) {
      toast({
        title: "Maximum reached",
        description: `You can attach up to ${MAX_IMAGES} images per contract.`,
        variant: "destructive",
      });
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please select image files only.",
        variant: "destructive",
      });
      return;
    }

    const allowedCount = Math.min(imageFiles.length, remainingSlots);
    const filesToUpload = imageFiles.slice(0, allowedCount);

    if (imageFiles.length > remainingSlots) {
      toast({
        title: "Upload limit",
        description: `Only ${remainingSlots} more image(s) can be added (maximum ${MAX_IMAGES} per contract).`,
      });
    }

    setUploading(true);
    try {
      const payload = await Promise.all(
        filesToUpload.map(async (file) => ({
          imageBase64: await fileToBase64(file),
        }))
      );

      const saved = await addContractImages({
        contractId,
        images: payload,
      });

      setImages((prev) => [...prev, ...saved]);
      toast({
        title: "Images saved",
        description:
          saved.length === 1
            ? "1 image attached to this contract."
            : `${saved.length} images attached to this contract.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img: ContractImage) => {
    setDeletingId(img.id);
    try {
      await deleteContractImage(img.id);
      setImages((prev) => prev.filter((item) => item.id !== img.id));
      setPendingDelete((current) => (current?.id === img.id ? null : current));
      if (previewImage?.id === img.id) setPreviewImage(null);
      toast({
        title: "Image deleted",
        description: "The photograph has been removed from this contract.",
      });
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[96vw] max-w-5xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Show/Attach Images</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {atMax
                  ? `Maximum of ${MAX_IMAGES} images reached for this contract.`
                  : `${images.length} of ${MAX_IMAGES} images attached. You can add ${remainingSlots} more.`}
              </p>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={atMax || uploading}
                  onChange={handleFilesSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  disabled={atMax || uploading || loading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading
                    ? "Uploading…"
                    : atMax
                      ? `Max ${MAX_IMAGES} images`
                      : "Upload images"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : images.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No images yet. Upload up to {MAX_IMAGES} images for this contract.
                </div>
              ) : (
                images.map((img) => (
                  <div
                    key={img.id}
                    className="rounded border p-3 space-y-2 bg-muted/20"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewImage(img)}
                      className="w-full text-left hover:opacity-90 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.imageBase64}
                        alt={img.caption || "Contract image"}
                        className="h-48 w-full object-contain bg-white rounded border"
                      />
                    </button>
                    {img.caption && (
                      <Textarea
                        value={img.caption}
                        readOnly
                        rows={2}
                        className="resize-none bg-muted/40 cursor-default"
                      />
                    )}
                    {pendingDelete?.id === img.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Delete this photograph? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={deletingId === img.id}
                            onClick={() => setPendingDelete(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            disabled={deletingId === img.id}
                            onClick={() => void handleDelete(img)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            {deletingId === img.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive"
                        disabled={!!deletingId || uploading}
                        onClick={() => setPendingDelete(img)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
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

          <DialogFooter className="gap-2 sm:justify-between">
            {previewImage && (
              pendingDelete?.id === previewImage.id ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Delete this photograph? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deletingId === previewImage.id}
                      onClick={() => setPendingDelete(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deletingId === previewImage.id}
                      onClick={() => void handleDelete(previewImage)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === previewImage.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={!!deletingId}
                    onClick={() => setPendingDelete(previewImage)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button type="button" onClick={() => setPreviewImage(null)}>
                    Close
                  </Button>
                </>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
