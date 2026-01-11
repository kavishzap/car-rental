"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  getExternalCars,
  deleteExternalCar,
} from "@/lib/services/externalCars";
import type { ExternalCar } from "@/lib/types";
import { ExternalCarsTable } from "@/components/external-cars/external-cars-table";
import { ExternalCarDialog } from "@/components/external-cars/external-car-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ExternalCarsPage() {
  const [cars, setCars] = useState<ExternalCar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<ExternalCar | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    void loadCars();
  }, []);

  const loadCars = async () => {
    try {
      setIsLoading(true);
      const list = await getExternalCars();
      setCars(list);
    } catch (err: any) {
      toast({
        title: "Failed to load external cars",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => setSearchQuery(query);

  const filteredCars = cars.filter((car) => {
    const q = searchQuery.toLowerCase();
    return (
      car.name.toLowerCase().includes(q) ||
      (car.brand && car.brand.toLowerCase().includes(q)) ||
      (car.model && car.model.toLowerCase().includes(q)) ||
      (car.plateNumber && car.plateNumber.toLowerCase().includes(q))
    );
  });

  const handleAddCar = () => {
    setEditingCar(null);
    setIsDialogOpen(true);
  };

  const handleEditCar = (car: ExternalCar) => {
    setEditingCar(car);
    setIsDialogOpen(true);
  };

  const handleDeleteCar = async (car: ExternalCar) => {
    try {
      await deleteExternalCar(car.id);
      toast({
        title: "External car deleted",
        description: `${car.name} has been removed from the system.`,
      });
      await loadCars();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = async (shouldRefresh?: boolean) => {
    setIsDialogOpen(false);
    setEditingCar(null);
    if (shouldRefresh) {
      await loadCars();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="External Cars"
        showSearch
        onSearch={handleSearch}
        actions={
          <Button onClick={handleAddCar}>
            <Plus className="mr-2 h-4 w-4" />
            Add External Car
          </Button>
        }
      />

      {/* Optional loading placeholder */}
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border ml-5 mr-5">
          <p className="text-sm text-muted-foreground">
            Loading external cars…
          </p>
        </div>
      ) : (
        <ExternalCarsTable
          cars={filteredCars}
          onEdit={handleEditCar}
          onDelete={handleDeleteCar}
        />
      )}

      <ExternalCarDialog
        open={isDialogOpen}
        car={editingCar}
        onClose={handleDialogClose}
      />
    </div>
  );
}

