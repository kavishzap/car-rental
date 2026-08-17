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
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, updateCustomer } from "@/lib/services/customers";
import type { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type CustomerDialogProps = {
  open: boolean;
  customer: Customer | null;
  onClose: (shouldRefresh?: boolean) => void;
};

export function CustomerDialog({ open, customer, onClose }: CustomerDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nicOrPassport: "",
    address: "",
    city: "",        // NEW
    country: "",     // NEW
    license: "",
    age: "",
    drivingExp: "",
    notes: "",
    photoBase64: "",
    flightNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        nicOrPassport: customer.nicOrPassport,
        address: customer.address || "",
        city: customer.city || "",
        country: customer.country || "",
        license: customer.license || "",
        age: customer.age != null ? String(customer.age) : "",
        drivingExp: customer.drivingExp != null ? String(customer.drivingExp) : "",
        notes: customer.notes || "",
        photoBase64: customer.photoBase64 || "",
        flightNumber: customer.flightNumber || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nicOrPassport: "",
        address: "",
        city: "",
        country: "",
        license: "",
        age: "",
        drivingExp: "",
        notes: "",
        photoBase64: "",
        flightNumber: "",
      });
    }
  }, [customer, open]);

  const ageNum = formData.age.trim() !== "" ? Number(formData.age) : null;
  const drivingExpNum =
    formData.drivingExp.trim() !== "" ? Number(formData.drivingExp) : null;
  const showAgeWarning = ageNum != null && !Number.isNaN(ageNum) && ageNum < 25;
  const showDrivingExpWarning =
    drivingExpNum != null && !Number.isNaN(drivingExpNum) && drivingExpNum < 2;

  const buildPayload = () => ({
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    nicOrPassport: formData.nicOrPassport,
    address: formData.address,
    city: formData.city,
    country: formData.country,
    license: formData.license,
    notes: formData.notes,
    photoBase64: formData.photoBase64,
    flightNumber: formData.flightNumber.trim() || null,
    age: ageNum,
    drivingExp: drivingExpNum,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (customer) {
        await updateCustomer(customer.id, payload);
        toast({
          title: "Customer updated",
          description: `${formData.firstName} ${formData.lastName} has been updated successfully.`,
        });
      } else {
        await createCustomer(payload);
        toast({
          title: "Customer created",
          description: `${formData.firstName} ${formData.lastName} has been added to the system.`,
        });
      }
      onClose(true);
    } catch (err: any) {
      // Check for duplicate email error
      const errorMessage = err?.message || "";
      const isDuplicateEmail = 
        errorMessage.includes("duplicate key") ||
        errorMessage.includes("unique constraint") ||
        err?.code === "23505";

      toast({
        title: "Save failed",
        description: isDuplicateEmail
          ? "A customer with this email address already exists. Please use a different email."
          : err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nicOrPassport">NIC/Passport</Label>
              <Input
                id="nicOrPassport"
                value={formData.nicOrPassport}
                onChange={(e) => setFormData({ ...formData, nicOrPassport: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">License</Label>
              <Input
                id="license"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                placeholder="Driving license / ref"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Driver&apos;s Age (optional)</Label>
              <Input
                id="age"
                type="number"
                min={0}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Years"
              />
              {showAgeWarning && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle />
                  <AlertDescription>
                    Driver is under 25 years old. Additional charges or restrictions may apply.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="drivingExp">Driving Experience (optional)</Label>
              <Input
                id="drivingExp"
                type="number"
                min={0}
                value={formData.drivingExp}
                onChange={(e) =>
                  setFormData({ ...formData, drivingExp: e.target.value })
                }
                placeholder="Years"
              />
              {showDrivingExpWarning && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle />
                  <AlertDescription>
                    Driver has less than 2 years of experience. Additional charges or restrictions may apply.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flightNumber">Flight Number</Label>
              <Input
                id="flightNumber"
                value={formData.flightNumber}
                onChange={(e) =>
                  setFormData({ ...formData, flightNumber: e.target.value })
                }
                placeholder="e.g. MK123"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Extra info about the customer"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {customer ? (submitting ? "Updating…" : "Update") : submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
