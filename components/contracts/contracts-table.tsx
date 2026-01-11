// src/components/contracts/contracts-table.tsx
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  Images,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { getCustomerById } from "@/lib/services/customers";
import { getCarById } from "@/lib/services/cars";
import { getCompanyDetails } from "@/lib/services/company"; // 👈 NEW
import { buildContractHtml } from "@/lib/utils/pdf-generator"; // 👈 now used
import type { Contract } from "@/lib/types";
import { ContractImagesDialog } from "@/components/contracts/contract-images-dialog";
import Swal from "sweetalert2";

type ContractsTableProps = {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void | Promise<void>;
};

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  completed: "secondary",
  draft: "outline",
  cancelled: "destructive",
  overdue: "destructive",
};

type Enriched = Contract & {
  customerName?: string;
  carName?: string;
  licenseNumber?: string;
  clientSignatureBase64?: string;
  ownerSignatureBase64?: string;
};

export function ContractsTable({
  contracts,
  onEdit,
  onDelete,
}: ContractsTableProps) {
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(false);

  const [imagesOpen, setImagesOpen] = useState(false);
  const [imagesContractId, setImagesContractId] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const inputContracts = useMemo(() => contracts, [contracts]);

  // Pagination calculations
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = useMemo(
    () => rows.slice(startIdx, endIdx),
    [rows, startIdx, endIdx]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const enriched = await Promise.all(
          inputContracts.map(async (contract) => {
            const [customer, car] = await Promise.all([
              getCustomerById(contract.customerId),
              getCarById(contract.carId),
            ]);

            return {
              ...contract,
              customerName: customer
                ? `${customer.firstName} ${customer.lastName}`
                : "Unknown",
              carName: car?.name ?? "Unknown",
            } as Enriched;
          })
        );
        if (!cancelled) setRows(enriched);
      } catch {
        if (!cancelled) setRows(inputContracts as Enriched[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inputContracts]);

  const handleDownloadPDF = async (contract: Contract) => {
    const [customer, car, company] = await Promise.all([
      getCustomerById(contract.customerId),
      getCarById(contract.carId),
      getCompanyDetails(), // 👈 pulls the single row you showed
    ]);

    if (!customer || !car || !company) {
      alert(
        "Unable to generate PDF: missing customer, car, or company details."
      );
      return;
    }

    await buildContractHtml({
      contract,
      customer,
      car,
      company,
    });
  };

  const openImages = (contractId: string) => {
    setImagesContractId(contractId);
    setImagesOpen(true);
  };

  const confirmDelete = async (contract: Enriched) => {
    const res = await Swal.fire({
      title: "Delete contract?",
      html: `This will permanently delete <b>${contract.contractNumber}</b>${
        contract.customerName ? ` for <b>${contract.customerName}</b>` : ""
      }.`,
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
        await onDelete(contract);
        await Swal.fire({
          title: "Deleted",
          text: "The contract has been removed.",
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
      } catch {
        await Swal.fire({
          title: "Delete failed",
          text: "We couldn't delete this contract. Please try again.",
          icon: "error",
        });
      }
    }
  };

  if (!rows.length) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed ml-5 mr-5">
        <div className="text-center">
          <p className="text-lg font-medium">
            {loading ? "Loading contracts…" : "No contracts found"}
          </p>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              Create your first contract to get started
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border ml-5 mr-5 overflow-x-auto">
        {/* Top bar: page size + count */}
        <div className="flex items-center justify-between gap-3 p-3 border-b">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {total === 0 ? 0 : startIdx + 1}
            </span>
            –<span className="font-medium">{endIdx}</span> of{" "}
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
              <TableHead>Contract #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageItems.map((contract) => {
              const isCompleted = contract.status === "completed";
              return (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.contractNumber}
                  </TableCell>
                  <TableCell>{contract.customerName}</TableCell>
                  <TableCell>{contract.carName}</TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell>{contract.days}</TableCell>
                  <TableCell>{formatCurrency(contract.total)}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[contract.status]}>
                      {contract.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDownloadPDF(contract)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => openImages(contract.id)}
                        >
                          <Images className="mr-2 h-4 w-4" />
                          Show Images
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onEdit(contract)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => confirmDelete(contract)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
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

      {imagesContractId && (
        <ContractImagesDialog
          open={imagesOpen}
          contractId={imagesContractId}
          onClose={() => {
            setImagesOpen(false);
            setImagesContractId(null);
          }}
        />
      )}
    </>
  );
}
