"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal, Pencil, Trash2,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/format";
import type { Car } from "@/lib/types";
import Swal from "sweetalert2";

type CarsTableProps = {
  cars: Car[];
  onEdit: (car: Car) => void;
  onDelete: (car: Car) => void;
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  available: "default",
  maintenance: "secondary",
  unavailable: "destructive",
};

export function CarsTable({ cars, onEdit, onDelete }: CarsTableProps) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const total = cars.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  const pageItems = useMemo(() => cars.slice(startIdx, endIdx), [cars, startIdx, endIdx]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const confirmDelete = async (car: Car) => {
    const res = await Swal.fire({
      title: "Delete car?",
      html: `This will permanently remove <b>${car.name}</b> (${car.plateNumber}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444", // tailwind red-500 (optional)
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
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-lg font-medium">No cars found</p>
          <p className="text-sm text-muted-foreground">Add your first car to get started</p>
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
          <span className="font-medium">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              const next = Number(v);
              setPageSize(next);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Plate Number</TableHead>
            <TableHead>Price/Day</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((car) => (
            <TableRow key={car.id}>
              <TableCell>
                {car.imageBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={car.imageBase64}
                    alt={car.name}
                    className="h-10 w-16 object-cover rounded border"
                  />
                ) : (
                  <div className="h-10 w-16 rounded border bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-medium">{car.name}</TableCell>
              <TableCell>{car.brand}</TableCell>
              <TableCell>{car.model}</TableCell>
              <TableCell>{car.year}</TableCell>
              <TableCell>{car.plateNumber}</TableCell>
              <TableCell>{formatCurrency(car.pricePerDay)}</TableCell>
              <TableCell>
                <Badge variant={statusColors[car.status]}>{car.status}</Badge>
              </TableCell>
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
