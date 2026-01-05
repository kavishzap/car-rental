"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { VehicleRegisterTable } from "@/components/vehicle-registration/vehicle-register-table";
import {
  getVehicleRegisters,
  createVehicleRegister,
  updateVehicleRegister,
  deleteVehicleRegister,
} from "@/lib/services/vehicleRegister";
import type { VehicleRegister } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function VehicleRegistrationPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<VehicleRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getVehicleRegisters();
      setVehicles(data);
    } catch (err: any) {
      toast({
        title: "Failed to load vehicle registrations",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleSave = async (vehicle: VehicleRegister) => {
    try {
      // Check if it's a new row (temporary ID starts with "new-")
      if (vehicle.id.startsWith("new-")) {
        const { id, createdAt, updatedAt, ...createData } = vehicle;
        await createVehicleRegister(createData);
        toast({
          title: "Created",
          description: "Vehicle registration has been created.",
        });
      } else {
        await updateVehicleRegister(vehicle.id, vehicle);
        toast({
          title: "Updated",
          description: "Vehicle registration has been updated.",
        });
      }
      await loadVehicles();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDelete = async (vehicle: VehicleRegister) => {
    try {
      await deleteVehicleRegister(vehicle.id);
      toast({
        title: "Deleted",
        description: "Vehicle registration has been removed.",
      });
      await loadVehicles();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Vehicle Registration" />
      <VehicleRegisterTable
        vehicles={vehicles}
        loading={loading}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

