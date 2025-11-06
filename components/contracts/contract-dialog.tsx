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
import {
  createContract,
  updateContract,
  calculateContractTotal,
} from "@/lib/services/contracts";
import { getCustomers } from "@/lib/services/customers";
import { getCars } from "@/lib/services/cars";
import type { Contract } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/format";
import { generateContractNumber } from "@/lib/utils/contracts";

type ContractDialogProps = {
  open: boolean;
  contract: Contract | null;
  onClose: (shouldRefresh?: boolean) => void;
};

export function ContractDialog({
  open,
  contract,
  onClose,
}: ContractDialogProps) {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [cars, setCars] = useState<
    Array<{ id: string; name: string; pricePerDay: number }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    carId: "",
    startDate: "",
    endDate: "",
    dailyRate: 0,
    days: 0,
    subtotal: 0,
    discount: 0,
    taxRate: 0,
    total: 0,
    status: "draft" as
      | "draft"
      | "active"
      | "completed"
      | "cancelled"
      | "overdue",
    notes: "",
    licenseNumber: "",
    clientSignatureBase64: "",
    ownerSignatureBase64: "",
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [customersList, carsList] = await Promise.all([
          getCustomers(),
          getCars(),
        ]);
        setCustomers(
          customersList.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
          }))
        );
        setCars(
          carsList.map((c) => ({
            id: c.id,
            name: c.name,
            pricePerDay: c.pricePerDay,
          }))
        );
      } catch (err: any) {
        toast({
          title: "Failed to load data",
          description: err?.message ?? "Please try again.",
          variant: "destructive",
        });
      }
    })();
  }, [open, toast]);

  useEffect(() => {
    if (contract) {
      setFormData({
        customerId: contract.customerId,
        carId: contract.carId,
        startDate: contract.startDate.split("T")[0],
        endDate: contract.endDate.split("T")[0],
        dailyRate: contract.dailyRate,
        days: contract.days,
        subtotal: contract.subtotal,
        discount: contract.discount || 0,
        taxRate: contract.taxRate || 0,
        total: contract.total,
        status: contract.status,
        notes: contract.notes || "",
        licenseNumber: contract.licenseNumber || "",
        clientSignatureBase64: contract.clientSignatureBase64 || "",
        ownerSignatureBase64: contract.ownerSignatureBase64 || "",
      });
    } else {
      setFormData({
        customerId: "",
        carId: "",
        startDate: "",
        endDate: "",
        dailyRate: 0,
        days: 0,
        subtotal: 0,
        discount: 0,
        taxRate: 0,
        total: 0,
        status: "draft",
        notes: "",
        licenseNumber: "",
        clientSignatureBase64: "",
        ownerSignatureBase64: "",
      });
    }
  }, [contract, open]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const ms = end.getTime() - start.getTime();
      const diffDays = ms <= 0 ? 0 : Math.ceil(ms / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({ ...prev, days: diffDays }));
    } else {
      setFormData((prev) => ({ ...prev, days: 0 }));
    }
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    const { dailyRate, days } = formData;
    const valid =
      Number.isFinite(dailyRate) &&
      dailyRate > 0 &&
      Number.isFinite(days) &&
      days > 0;
    if (valid) {
      const { subtotal, total } = calculateContractTotal(
        formData.dailyRate,
        formData.days,
        formData.discount,
        formData.taxRate
      );
      setFormData((prev) => ({ ...prev, subtotal, total }));
    } else {
      setFormData((prev) => ({ ...prev, subtotal: 0, total: 0 }));
    }
  }, [formData.dailyRate, formData.days, formData.discount, formData.taxRate]);

  const handleCarChange = (carId: string) => {
    const selectedCar = cars.find((c) => c.id === carId);
    setFormData((prev) => ({
      ...prev,
      carId,
      dailyRate: selectedCar ? selectedCar.pricePerDay : 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.carId) {
      toast({
        title: "Error",
        description: "Please select both a customer and a car.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);

      const base = {
        customerId: formData.customerId,
        carId: formData.carId,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        dailyRate: formData.dailyRate,
        days: formData.days,
        subtotal: formData.subtotal,
        discount: formData.discount,
        taxRate: formData.taxRate,
        total: formData.total,
        status: formData.status,
        notes: formData.notes,
        licenseNumber: formData.licenseNumber,
        clientSignatureBase64: formData.clientSignatureBase64 || undefined,
        ownerSignatureBase64: formData.ownerSignatureBase64 || undefined,
      };

      if (contract) {
        await updateContract(contract.id, {
          contractNumber: contract.contractNumber,
          ...base,
        });
        toast({
          title: "Contract updated",
          description: `Contract ${contract.contractNumber} updated.`,
        });
      } else {
        const contractNumber = generateContractNumber();
        await createContract({ contractNumber, ...base });
        toast({
          title: "Contract created",
          description: "A new contract has been created successfully.",
        });
      }

      onClose(true);
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      {/* Wider dialog for desktop, no forced vertical scroll */}
      <DialogContent className="max-h-[85vh] w-[70vw] max-w-2xl xl:max-w-5xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {contract ? "Edit Contract" : "Create New Contract"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] pr-2"
        >
          {/* 3 columns on XL for minimal scrolling */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, customerId: value })
                }
              >
                <SelectTrigger id="customerId">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carId">Car</Label>
              <Select value={formData.carId} onValueChange={handleCarChange}>
                <SelectTrigger id="carId">
                  <SelectValue placeholder="Select car" />
                </SelectTrigger>
                <SelectContent>
                  {cars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - {formatCurrency(c.pricePerDay)}/day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status dropdown (added back) */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyRate">Daily Rate</Label>
              <Input
                id="dailyRate"
                type="number"
                step="0.01"
                value={formData.dailyRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyRate: Number.parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="days">Days</Label>
              <Input id="days" type="number" value={formData.days} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input
                id="subtotal"
                value={formatCurrency(formData.subtotal)}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                value={formatCurrency(formData.total)}
                disabled
              />
            </div>

            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="e.g. B123456789"
                value={formData.licenseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, licenseNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Signatures (read-only) */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Signatures (read-only)</div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Client Signature</Label>
                {formData.clientSignatureBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.clientSignatureBase64}
                    alt="Client signature"
                    className="h-28 w-full max-w-sm rounded border bg-white object-contain p-2"
                  />
                ) : (
                  <div className="h-28 w-full max-w-sm rounded border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                    No signature
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Owner Signature</Label>
                {formData.ownerSignatureBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.ownerSignatureBase64}
                    alt="Owner signature"
                    className="h-28 w-full max-w-sm rounded border bg-white object-contain p-2"
                  />
                ) : (
                  <div className="h-28 w-full max-w-sm rounded border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                    No signature
                  </div>
                )}
              </div>
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
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {contract
                ? submitting
                  ? "Updating…"
                  : "Update"
                : submitting
                ? "Creating…"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
