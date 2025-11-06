"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCar, updateCar } from "@/lib/services/cars";
import type { Car } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { fileToBase64 } from "@/lib/utils/fileToBase64";

type CarDialogProps = {
  open: boolean;
  car: Car | null;
  onClose: (shouldRefresh?: boolean) => void;
};

export function CarDialog({ open, car, onClose }: CarDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plateNumber: "",
    pricePerDay: 0,
    status: "available" as "available" | "maintenance" | "unavailable",
    notes: "",
    imageBase64: "" as string, // <-- new
  });

  useEffect(() => {
    if (car) {
      setFormData({
        name: car.name,
        brand: car.brand,
        model: car.model,
        year: car.year,
        plateNumber: car.plateNumber,
        pricePerDay: car.pricePerDay,
        status: car.status,
        notes: car.notes || "",
        imageBase64: car.imageBase64 || "", // <-- new
      });
    } else {
      setFormData({
        name: "",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        plateNumber: "",
        pricePerDay: 0,
        status: "available",
        notes: "",
        imageBase64: "", // <-- new
      });
    }
  }, [car, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (car) {
      await updateCar(car.id, formData); // includes imageBase64
      toast({
        title: "Car updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      await createCar(formData as any);
      toast({
        title: "Car created",
        description: `${formData.name} has been added to the system.`,
      });
    }

    onClose(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{car ? "Edit Car" : "Add New Car"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    year: Number.parseInt(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number</Label>
              <Input
                id="plateNumber"
                value={formData.plateNumber}
                onChange={(e) =>
                  setFormData({ ...formData, plateNumber: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerDay">Price per Day</Label>
              <Input
                id="pricePerDay"
                type="number"
                step="0.01"
                value={formData.pricePerDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerDay: Number.parseFloat(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="image">Car Image</Label>
            <div className="flex items-center gap-4">
              {/* preview */}
              {formData.imageBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.imageBase64}
                  alt="preview"
                  className="h-16 w-24 rounded border object-cover"
                />
              ) : (
                <div className="h-16 w-24 rounded border bg-muted" />
              )}

              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const b64 = await fileToBase64(file);
                  setFormData({ ...formData, imageBase64: b64 });
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit">{car ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
