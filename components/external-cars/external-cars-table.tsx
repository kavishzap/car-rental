"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/format";
import type { ExternalCar } from "@/lib/types";
import Swal from "sweetalert2";

type ExternalCarsTableProps = {
  cars: ExternalCar[];
  onEdit: (car: ExternalCar) => void;
  onDelete: (car: ExternalCar) => void;
};

export function ExternalCarsTable({
  cars,
  onEdit,
  onDelete,
}: ExternalCarsTableProps) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const total = cars.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  const pageItems = useMemo(
    () => cars.slice(startIdx, endIdx),
    [cars, startIdx, endIdx]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const confirmDelete = async (car: ExternalCar) => {
    const res = await Swal.fire({
      title: "Delete external car?",
      html: `This will permanently remove <b>${car.name}</b>${car.plateNumber ? ` (${car.plateNumber})` : ""}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      reverseButtons: true,
      focusCancel: true,
    });

    if (res.isConfirmed) {
      try {
        await onDelete(car);
        await Swal.fire({
          title: "Deleted",
          text: `${car.name} has been removed.`,
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (e) {
        await Swal.fire({
          title: "Delete failed",
          text: "We couldn't remove this car. Please try again.",
          icon: "error",
        });
      }
    }
  };

  if (cars.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed ml-5 mr-5">
        <div className="text-center">
          <p className="text-lg font-medium">No external cars found</p>
          <p className="text-sm text-muted-foreground">
            Add your first external car to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border ml-5 mr-5">
      {/* Top bar: page size + count */}
      <div className="flex items-center justify-between gap-3 p-3 border-b">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{total === 0 ? 0 : startIdx + 1}</span>–
          <span className="font-medium">{endIdx}</span> of{" "}
          <span className="font-medium">{total}</span> cars
        </div>
        <Select
          value={pageSize.toString()}
          onValueChange={(v) => {
            setPageSize(Number.parseInt(v, 10));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Plate Number</TableHead>
            <TableHead>Price/Day</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((car) => (
            <TableRow key={car.id}>
              <TableCell className="font-medium">{car.name}</TableCell>
              <TableCell>{car.brand || "-"}</TableCell>
              <TableCell>{car.model || "-"}</TableCell>
              <TableCell>{car.year || "-"}</TableCell>
              <TableCell>{car.plateNumber || "-"}</TableCell>
              <TableCell>{formatCurrency(car.pricePerDay)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(car)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => confirmDelete(car)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Bottom pager */}
      <div className="flex items-center justify-between p-3 border-t">
        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium">{clampedPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(1)}
            disabled={clampedPage === 1}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={clampedPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={clampedPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages)}
            disabled={clampedPage === totalPages}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

