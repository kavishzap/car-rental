// src/components/contracts/contract-dialog.tsx
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
import { createContract, updateContract } from "@/lib/services/contracts";
import { calculateContractTotal } from "@/lib/utils/contract-calculation";
import { getCustomers } from "@/lib/services/customers";
import { getCars } from "@/lib/services/cars";
import type { Contract } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/format";

// 🆕 for calendar UI + utils
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// 🆕 booked dates service
import { getCarBookedDateRanges } from "@/lib/services/contractAvailability";

type ContractDialogProps = {
  open: boolean;
  contract: Contract | null;
  onClose: (shouldRefresh?: boolean) => void;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Parse "YYYY-MM-DD" into Date at local midnight.
 */
const parseDateOnly = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function ContractDialog({
  open,
  contract,
  onClose,
}: ContractDialogProps) {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; license?: string | null; nicOrPassport?: string | null }>
  >([]);
  const [cars, setCars] = useState<
    Array<{
      id: string;
      name: string;
      pricePerDay: number;
      brand?: string | null;
      model?: string | null;
      plateNumber?: string;
    }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  // 🆕 disabled dates for the selected car (create mode only)
  const [bookedRanges, setBookedRanges] = useState<
    { start: string; end: string }[]
  >([]);

  const [formData, setFormData] = useState({
    customerId: "",
    carId: "",
    startDate: "",
    endDate: "",
    dailyRate: 0,
    days: 0,
    subtotal: 0,
    taxRate: 0,
    total: 0,
    status: "draft" as "draft" | "completed" | "cancelled",
    notes: "",
    licenseNumber: "",
    customerNicOrPassport: "",
    clientSignatureBase64: "",

    fuelAmount: 0,
    preAuthorization: "",
    pickupDate: "",
    pickupTime: "",
    deliveryDate: "",
    deliveryTime: "",
    deliveryPlace: "",
    paymentMode: "",
    simAmount: 0,
    deliveryAmount: 0,
    cardPaymentPercent: 0,
    cardPaymentAmount: 0,
    secondDriverId: "",
    secondDriverName: "",
    secondDriverLicense: "",
  });

  const isEditMode = !!contract;
  const rangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
    aStart <= bEnd && bStart <= aEnd;

  // Load customers + cars when dialog opens
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
            license: c.license,
            nicOrPassport: c.nicOrPassport,
          }))
        );
        setCars(
          carsList.map((c) => ({
            id: c.id,
            name: c.name,
            brand: c.brand,
            model: c.model,
            plateNumber: c.plateNumber,
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

  // Prefill on edit / reset on create
  useEffect(() => {
    if (contract) {
      const secondDriverName = (contract as any).secondDriverName ?? "";
      // Try to match second driver by name
      const matchedSecondDriver = customers.find((c) => c.name === secondDriverName);
      
      setFormData({
        customerId: contract.customerId,
        carId: contract.carId,
        startDate: contract.startDate.split("T")[0],
        endDate: contract.endDate.split("T")[0],
        dailyRate: contract.dailyRate,
        days: contract.days,
        subtotal: contract.subtotal,
        taxRate: contract.taxRate || 0,
        total: contract.total,
        status: contract.status,
        notes: contract.notes || "",
        licenseNumber: contract.licenseNumber || "",
        customerNicOrPassport: contract.customerNicOrPassport || "",
        clientSignatureBase64: contract.clientSignatureBase64 || "",

        fuelAmount: (contract as any).fuelAmount ?? 0,
        preAuthorization: (contract as any).preAuthorization ?? "",
        pickupDate: (contract as any).pickupDate
          ? (contract as any).pickupDate.split("T")[0]
          : "",
        pickupTime: (contract as any).pickupTime ?? "",
        deliveryDate: (contract as any).deliveryDate
          ? (contract as any).deliveryDate.split("T")[0]
          : "",
        deliveryTime: (contract as any).deliveryTime ?? "",
        deliveryPlace: contract.deliveryPlace || "",
        paymentMode: (contract as any).paymentMode ?? "",

        simAmount: (contract as any).simAmount ?? 0,
        deliveryAmount: (contract as any).deliveryAmount ?? 0,
        cardPaymentPercent: (contract as any).cardPaymentPercent ?? 0,
        cardPaymentAmount: (contract as any).cardPaymentAmount ?? 0,

        secondDriverId: matchedSecondDriver?.id ?? "",
        secondDriverName: secondDriverName,
        secondDriverLicense: (contract as any).secondDriverLicense ?? "",
      });
      // In edit mode, we don't enforce disabling existing dates
      setBookedRanges([]);
    } else {
      setFormData({
        customerId: "",
        carId: "",
        startDate: "",
        endDate: "",
        dailyRate: 0,
        days: 0,
        subtotal: 0,
        taxRate: 0,
        total: 0,
        status: "draft",
        notes: "",
        licenseNumber: "",
        customerNicOrPassport: "",
        clientSignatureBase64: "",
        fuelAmount: 0,
        preAuthorization: "",
        pickupDate: "",
        pickupTime: "",
        deliveryDate: "",
        deliveryTime: "",
        deliveryPlace: "",
        paymentMode: "",
        simAmount: 0,
        deliveryAmount: 0,
        cardPaymentPercent: 0,
        cardPaymentAmount: 0,
        secondDriverId: "",
        secondDriverName: "",
        secondDriverLicense: "",
      });
      setBookedRanges([]);
    }
  }, [contract, open]);

  // Match second driver by name when customers are loaded (for edit mode)
  useEffect(() => {
    if (contract && customers.length > 0 && formData.secondDriverName && !formData.secondDriverId) {
      const matchedSecondDriver = customers.find((c) => c.name === formData.secondDriverName);
      if (matchedSecondDriver) {
        setFormData((prev) => ({
          ...prev,
          secondDriverId: matchedSecondDriver.id,
        }));
      }
    }
  }, [customers, contract, formData.secondDriverName, formData.secondDriverId]);

  // 🆕 Load booked dates when creating a new contract & car changes
  // 🆕 Load booked dates when creating a new contract & car changes
  useEffect(() => {
    if (!open) return;
    if (isEditMode) return; // only create mode
    if (!formData.carId) {
      setBookedRanges([]);
      return;
    }

    (async () => {
      try {
        const ranges = await getCarBookedDateRanges(formData.carId);
        // expected: [{ start: "2025-11-20", end: "2025-11-23" }, ...]
        setBookedRanges(ranges);
      } catch (err: any) {
        console.error("Failed to load booked dates:", err);
        toast({
          title: "Could not load availability",
          description: err?.message ?? "Dates may not be correctly disabled.",
          variant: "destructive",
        });
        setBookedRanges([]);
      }
    })();
  }, [open, formData.carId, isEditMode, toast]);

  // Auto-calc days from start/end
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      // Normalize to midnight to avoid time-of-day issues
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const ms = end.getTime() - start.getTime();
      // Add 1 to make it inclusive (Dec 1 to Dec 8 = 8 days)
      const diffDays = ms < 0 ? 0 : Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
      setFormData((prev) => ({ ...prev, days: diffDays }));
    } else {
      setFormData((prev) => ({ ...prev, days: 0 }));
    }
  }, [formData.startDate, formData.endDate]);

  // Recalculate totals when rate/days/tax or extra charges change
  useEffect(() => {
    const {
      dailyRate,
      days,
      taxRate,
      simAmount,
      deliveryAmount,
      cardPaymentPercent,
    } = formData;

    const valid =
      Number.isFinite(dailyRate) &&
      dailyRate > 0 &&
      Number.isFinite(days) &&
      days > 0;

    if (valid) {
      const { subtotal, total: baseTotal } = calculateContractTotal(
        dailyRate,
        days,
        0,
        taxRate
      );

      const safeSim = Number.isFinite(simAmount) ? simAmount : 0;
      const safeDelivery = Number.isFinite(deliveryAmount) ? deliveryAmount : 0;
      const safePercent = Number.isFinite(cardPaymentPercent)
        ? cardPaymentPercent
        : 0;

      const cardPaymentAmount =
        safePercent > 0 ? (baseTotal * safePercent) / 100 : 0;

      const finalTotal =
        baseTotal +
        safeSim +
        safeDelivery +
        cardPaymentAmount;

      setFormData((prev) => ({
        ...prev,
        subtotal,
        cardPaymentAmount,
        total: finalTotal,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subtotal: 0,
        cardPaymentAmount: 0,
        total: 0,
      }));
    }
  }, [
    formData.dailyRate,
    formData.days,
    formData.taxRate,
    formData.simAmount,
    formData.deliveryAmount,
    formData.cardPaymentPercent,
  ]);

  const handleCarChange = (carId: string) => {
    const selectedCar = cars.find((c) => c.id === carId);
    setFormData((prev) => ({
      ...prev,
      carId,
      dailyRate: selectedCar ? selectedCar.pricePerDay : 0,
    }));
    // bookedDates will be loaded by the effect that watches formData.carId
  };

  const handleCustomerChange = (customerId: string) => {
    const selectedCustomer = customers.find((c) => c.id === customerId);
    const licenseValue = selectedCustomer?.license?.trim();
    const nicOrPassportValue = selectedCustomer?.nicOrPassport?.trim();

    setFormData((prev) => ({
      ...prev,
      customerId,
      licenseNumber: licenseValue ? licenseValue : prev.licenseNumber,
      customerNicOrPassport: nicOrPassportValue ? nicOrPassportValue : prev.customerNicOrPassport,
    }));
  };

  const handleSecondDriverChange = (customerId: string) => {
    const selectedCustomer = customers.find((c) => c.id === customerId);
    const licenseValue = selectedCustomer?.license?.trim();
    const customerName = selectedCustomer?.name ?? "";

    setFormData((prev) => ({
      ...prev,
      secondDriverId: customerId,
      secondDriverName: customerName,
      secondDriverLicense: licenseValue ? licenseValue : prev.secondDriverLicense,
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
    if (!isEditMode && formData.startDate && formData.endDate) {
      const newStart = parseDateOnly(formData.startDate);
      const newEnd = parseDateOnly(formData.endDate);

      const conflict = bookedRanges.some((r) => {
        const bStart = parseDateOnly(r.start);
        const bEnd = parseDateOnly(r.end);
        return rangesOverlap(newStart, newEnd, bStart, bEnd);
      });

      if (conflict) {
        toast({
          title: "Date conflict",
          description:
            "This car is already booked during the selected dates. Please choose a different period.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!formData.paymentMode) {
      toast({
        title: "Payment mode required",
        description: "Please select a payment mode before saving the contract.",
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
        discount: 0,
        taxRate: formData.taxRate,
        total: formData.total,
        status: formData.status,
        notes: formData.notes,
        licenseNumber: formData.licenseNumber,
        customerNicOrPassport: formData.customerNicOrPassport || "",
        clientSignatureBase64: formData.clientSignatureBase64 || undefined,

        fuelAmount: formData.fuelAmount || 0,
        preAuthorization: formData.preAuthorization || "",
        pickupDate: formData.pickupDate
          ? new Date(formData.pickupDate).toISOString()
          : null,
        pickupTime: formData.pickupTime || "",
        deliveryDate: formData.deliveryDate
          ? new Date(formData.deliveryDate).toISOString()
          : null,
        deliveryTime: formData.deliveryTime || "",
        deliveryPlace: formData.deliveryPlace || "",
        paymentMode: formData.paymentMode || "",
        simAmount: formData.simAmount || 0,
        deliveryAmount: formData.deliveryAmount || 0,
        cardPaymentPercent: formData.cardPaymentPercent || 0,
        cardPaymentAmount: formData.cardPaymentAmount || 0,
        secondDriverName: formData.secondDriverName || "",
        secondDriverLicense: formData.secondDriverLicense || "",
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
        await createContract(base);
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

  const disabledIntervals = bookedRanges.map((r) => ({
    from: parseDateOnly(r.start),
    to: parseDateOnly(r.end),
  }));

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-h-[85vh] w-[70vw] max-w-2xl xl:max-w-5xl overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {contract ? "Edit Contract" : "Create New Contract"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] pr-2"
        >
          {/* Main contract info */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select
                value={formData.customerId}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger id="customerId" className="w-full">
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
                <SelectTrigger id="carId" className="w-full">
                  <SelectValue placeholder="Select car" />
                </SelectTrigger>
                <SelectContent>
                  {cars.map((c) => {
                    const details = [
                      c.brand,
                      c.model,
                      c.plateNumber,
                    ].filter(Boolean);
                    const label = details.length
                      ? `${c.name} • ${details.join(" • ")}`
                      : c.name;
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 🆕 Start Date (calendar with disabled booked dates) */}
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(parseDateOnly(formData.startDate), "PPP")
                    ) : (
                      <span>Pick a start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.startDate
                        ? parseDateOnly(formData.startDate)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (!date) return;
                      // store as local date string, NOT ISO
                      const value = format(date, "yyyy-MM-dd");
                      setFormData((prev) => ({ ...prev, startDate: value }));
                    }}
                    disabled={disabledIntervals}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 🆕 End Date (calendar with disabled booked dates) */}
            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(parseDateOnly(formData.endDate), "PPP")
                    ) : (
                      <span>Pick an end date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.endDate
                        ? parseDateOnly(formData.endDate)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (!date) return;
                      const value = format(date, "yyyy-MM-dd");
                      setFormData((prev) => ({ ...prev, endDate: value }));
                    }}
                    disabled={disabledIntervals}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              <Label htmlFor="pickupTime">Pickup Time</Label>
              <Input
                id="pickupTime"
                type="time"
                value={formData.pickupTime}
                onChange={(e) =>
                  setFormData({ ...formData, pickupTime: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Delivery Time</Label>
              <Input
                id="deliveryTime"
                type="time"
                value={formData.deliveryTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryTime: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryPlace">Delivery Place</Label>
              <Input
                id="deliveryPlace"
                placeholder="Delivery location"
                value={formData.deliveryPlace}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryPlace: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="days">Days</Label>
              <Input
                id="days"
                type="number"
                step="1"
                min="0"
                value={formData.days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    days: Number.parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal (before extras)</Label>
              <Input
                id="subtotal"
                value={formatCurrency(formData.subtotal)}
                disabled
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="customerNicOrPassport">Customer NIC/Passport</Label>
              <Input
                id="customerNicOrPassport"
                placeholder="Customer NIC/Passport number"
                value={formData.customerNicOrPassport}
                onChange={(e) =>
                  setFormData({ ...formData, customerNicOrPassport: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelAmount">Fuel Amount (bars)</Label>
              <Select
                value={formData.fuelAmount ? String(formData.fuelAmount) : ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    fuelAmount: Number.parseInt(value, 10) || 0,
                  })
                }
              >
                <SelectTrigger id="fuelAmount" className="w-full">
                  <SelectValue placeholder="Select fuel amount" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const v = idx + 1;
                    return (
                      <SelectItem key={v} value={String(v)}>
                        {v}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preAuthorization">Pre-authorization</Label>
              <Input
                id="preAuthorization"
                placeholder="Reference / note"
                value={formData.preAuthorization}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preAuthorization: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="simAmount">SIM + Internet</Label>
              <Input
                id="simAmount"
                type="number"
                step="0.01"
                value={formData.simAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    simAmount: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAmount">Delivery (amount)</Label>
              <Input
                id="deliveryAmount"
                type="number"
                step="0.01"
                value={formData.deliveryAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryAmount: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMode: value })
                }
              >
                <SelectTrigger id="paymentMode" className="w-full">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardPaymentPercent">Card payment %</Label>
              <Input
                id="cardPaymentPercent"
                type="number"
                step="0.01"
                value={formData.cardPaymentPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cardPaymentPercent: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
              {formData.cardPaymentAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Card fee: {formatCurrency(formData.cardPaymentAmount)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondDriverId">Second driver</Label>
              <Select
                value={formData.secondDriverId}
                onValueChange={handleSecondDriverChange}
              >
                <SelectTrigger id="secondDriverId" className="w-full">
                  <SelectValue placeholder="Select second driver" />
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
              <Label htmlFor="secondDriverLicense">Second driver license</Label>
              <Input
                id="secondDriverLicense"
                value={formData.secondDriverLicense}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secondDriverLicense: e.target.value,
                  })
                }
                placeholder="License number"
              />
            </div>
          </div>

          {/* Payment + extras */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="total">Total (incl. extras)</Label>
              <Input
                id="total"
                value={formatCurrency(formData.total)}
                disabled
              />
            </div>

            <div className="space-y-2 md:col-span-1 xl:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2 md:col-span-2 xl:col-span-1">
              <Label>Client Signature</Label>
              {formData.clientSignatureBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.clientSignatureBase64}
                  alt="Client signature"
                  className="h-28 w-full rounded border bg-white object-contain p-2"
                />
              ) : (
                <div className="h-28 w-full rounded border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                  No signature
                </div>
              )}
            </div>
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
