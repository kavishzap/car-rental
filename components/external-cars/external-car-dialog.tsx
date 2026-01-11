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
import { createExternalCar, updateExternalCar } from "@/lib/services/externalCars";
import type { ExternalCar } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type ExternalCarDialogProps = {
  open: boolean;
  car: ExternalCar | null;
  onClose: (shouldRefresh?: boolean) => void;
};

export function ExternalCarDialog({
  open,
  car,
  onClose,
}: ExternalCarDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plateNumber: "",
    pricePerDay: 0,
  });

  useEffect(() => {
    if (car) {
      setFormData({
        name: car.name,
        brand: car.brand || "",
        model: car.model || "",
        year: car.year || new Date().getFullYear(),
        plateNumber: car.plateNumber || "",
        pricePerDay: car.pricePerDay,
      });
    } else {
      setFormData({
        name: "",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        plateNumber: "",
        pricePerDay: 0,
      });
    }
  }, [car, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (car) {
        await updateExternalCar(car.id, {
          name: formData.name,
          brand: formData.brand || null,
          model: formData.model || null,
          year: formData.year || null,
          plateNumber: formData.plateNumber || null,
          pricePerDay: formData.pricePerDay,
        });
        toast({
          title: "External car updated",
          description: `${formData.name} has been updated.`,
        });
      } else {
        await createExternalCar({
          name: formData.name,
          brand: formData.brand || null,
          model: formData.model || null,
          year: formData.year || null,
          plateNumber: formData.plateNumber || null,
          pricePerDay: formData.pricePerDay,
        });
        toast({
          title: "External car created",
          description: `${formData.name} has been added.`,
        });
      }
      onClose(true);
    } catch (err: any) {
      toast({
        title: car ? "Update failed" : "Create failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {car ? "Edit External Car" : "Add External Car"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="brand">Color</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
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
                    year: Number.parseInt(e.target.value || "0", 10),
                  })
                }
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerDay">
                Price per Day <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pricePerDay"
                type="number"
                step="0.01"
                value={formData.pricePerDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerDay: Number.parseFloat(e.target.value || "0"),
                  })
                }
                required
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

