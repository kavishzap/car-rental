"use client";

import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer } from "@/lib/types";
import Swal from "sweetalert2";

type CustomersTableProps = {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void | Promise<void>;
};

export function CustomersTable({ customers, onEdit, onDelete }: CustomersTableProps) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const total = customers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  const pageItems = useMemo(() => customers.slice(startIdx, endIdx), [customers, startIdx, endIdx]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const confirmDelete = async (customer: Customer) => {
    const res = await Swal.fire({
      title: "Delete customer?",
      html: `This will permanently remove <b>${customer.firstName} ${customer.lastName}</b><br/><span style="font-size:12px;color:#6b7280">${customer.email ?? ""}</span>`,
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
        await onDelete(customer);
        await Swal.fire({
          title: "Deleted",
          text: "The customer has been removed.",
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
      } catch {
        await Swal.fire({
          title: "Delete failed",
          text: "We couldn't remove this customer. Please try again.",
          icon: "error",
        });
      }
    }
  };

  if (customers.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-lg font-medium">No customers found</p>
          <p className="text-sm text-muted-foreground">Add your first customer to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border ml-5 mr-5">
      {/* Top bar: rows per page + count */}
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
              setPageSize(Number(v));
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>NIC/Passport</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                {customer.firstName} {customer.lastName}
              </TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.nicOrPassport}</TableCell>
              <TableCell>{customer.address || "-"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => confirmDelete(customer)}
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
