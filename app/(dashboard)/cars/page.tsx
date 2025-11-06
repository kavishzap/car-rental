"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getCars, deleteCar } from "@/lib/services/cars"
import type { Car } from "@/lib/types"
import { CarsTable } from "@/components/cars/cars-table"
import { CarDialog } from "@/components/cars/car-dialog"
import { useToast } from "@/hooks/use-toast"

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    void loadCars()
  }, [])

  const loadCars = async () => {
    try {
      setIsLoading(true)
      const list = await getCars()
      setCars(list)
    } catch (err: any) {
      toast({
        title: "Failed to load cars",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => setSearchQuery(query)

  const filteredCars = cars.filter((car) => {
    const q = searchQuery.toLowerCase()
    return (
      car.name.toLowerCase().includes(q) ||
      car.brand.toLowerCase().includes(q) ||
      car.model.toLowerCase().includes(q) ||
      car.plateNumber.toLowerCase().includes(q)
    )
  })

  const handleAddCar = () => {
    setEditingCar(null)
    setIsDialogOpen(true)
  }

  const handleEditCar = (car: Car) => {
    setEditingCar(car)
    setIsDialogOpen(true)
  }

  const handleDeleteCar = async (car: Car) => {
    const ok = confirm(`Are you sure you want to delete ${car.name}?`)
    if (!ok) return
    try {
      await deleteCar(car.id)
      toast({
        title: "Car deleted",
        description: `${car.name} has been removed from the system.`,
      })
      await loadCars()
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = async (shouldRefresh?: boolean) => {
    setIsDialogOpen(false)
    setEditingCar(null)
    if (shouldRefresh) {
      await loadCars()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cars"
        showSearch
        onSearch={handleSearch}
        actions={
          <Button onClick={handleAddCar}>
            <Plus className="mr-2 h-4 w-4" />
            Add Car
          </Button>
        }
      />

      {/* Optional loading placeholder */}
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border">
          <p className="text-sm text-muted-foreground">Loading cars…</p>
        </div>
      ) : (
        <CarsTable cars={filteredCars} onEdit={handleEditCar} onDelete={handleDeleteCar} />
      )}

      <CarDialog open={isDialogOpen} car={editingCar} onClose={handleDialogClose} />
    </div>
  )
}
