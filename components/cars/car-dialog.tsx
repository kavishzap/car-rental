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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type CarDialogProps = {
  open: boolean;
  car: Car | null;
  onClose: (shouldRefresh?: boolean) => void;
};

/**
 * Parse "YYYY-MM-DD" into Date at local midnight.
 */
const parseDateOnly = (dateStr: string) => {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  // Check if date is valid
  if (isNaN(date.getTime())) return undefined;
  return date;
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
    km: "",                // NEW
    servicing: "",        // NEW
    nta: "",              // NEW
    psv: "",              // NEW
    notes: "",
    imageBase64: "" as string,
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
        km: car.km ?? "",
        servicing: car.servicing ?? "",
        nta: car.nta ?? "",
        psv: car.psv ?? "",
        notes: car.notes || "",
        imageBase64: car.imageBase64 || "",
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
        km: "",
        servicing: "",
        nta: "",
        psv: "",
        notes: "",
        imageBase64: "",
      });
    }
  }, [car, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      year: Number(formData.year),
      pricePerDay: Number(formData.pricePerDay),
      km: formData.km.trim() || null,
      // servicing / nta / psv can stay as strings or be converted to null if empty
      servicing: formData.servicing.trim() || null,
      nta: formData.nta.trim() || null,
      psv: formData.psv.trim() || null,
      notes: formData.notes.trim() || null,
    };

    if (car) {
      await updateCar(car.id, payload);
      toast({
        title: "Car updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      await createCar(payload as any);
      toast({
        title: "Car created",
        description: `${formData.name} has been added to the system.`,
      });
    }

    onClose(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
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
              <Label htmlFor="brand">Color</Label>
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
                    year: Number.parseInt(e.target.value || "0", 10),
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
                    pricePerDay: Number.parseFloat(e.target.value || "0"),
                  })
                }
                required
              />
            </div>

            {/* NEW FIELDS ROW 1 */}
            <div className="space-y-2">
              <Label htmlFor="km">KM</Label>
              <Input
                id="km"
                type="text"
                value={formData.km}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    km: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Servicing</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.servicing && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.servicing ? (
                      (() => {
                        const date = parseDateOnly(formData.servicing);
                        return date ? format(date, "PPP") : formData.servicing;
                      })()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.servicing
                        ? parseDateOnly(formData.servicing)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (!date) return;
                      const value = format(date, "yyyy-MM-dd");
                      setFormData({ ...formData, servicing: value });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* NEW FIELDS ROW 2 */}
            <div className="space-y-2">
              <Label>MVL Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.nta && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.nta ? (
                      (() => {
                        const date = parseDateOnly(formData.nta);
                        return date ? format(date, "PPP") : formData.nta;
                      })()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.nta ? parseDateOnly(formData.nta) || undefined : undefined
                    }
                    onSelect={(date) => {
                      if (!date) return;
                      const value = format(date, "yyyy-MM-dd");
                      setFormData({ ...formData, nta: value });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>PSV</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.psv && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.psv ? (
                      (() => {
                        const date = parseDateOnly(formData.psv);
                        return date ? format(date, "PPP") : formData.psv;
                      })()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.psv ? parseDateOnly(formData.psv) || undefined : undefined
                    }
                    onSelect={(date) => {
                      if (!date) return;
                      const value = format(date, "yyyy-MM-dd");
                      setFormData({ ...formData, psv: value });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "available" | "maintenance" | "unavailable") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="image">Car Image</Label>
            <div className="flex items-center gap-4">
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
