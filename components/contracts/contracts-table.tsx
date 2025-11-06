// src/components/contracts/contracts-table.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Download, Images } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { getCustomerById } from "@/lib/services/customers";
import { getCarById } from "@/lib/services/cars";
import { downloadContractPDF } from "@/lib/utils/pdf-generator";
import type { Contract } from "@/lib/types";
import { ContractImagesDialog } from "@/components/contracts/contract-images-dialog";
import Swal from "sweetalert2";

type ContractsTableProps = {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void | Promise<void>;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
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

export function ContractsTable({ contracts, onEdit, onDelete }: ContractsTableProps) {
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(false);

  const [imagesOpen, setImagesOpen] = useState(false);
  const [imagesContractId, setImagesContractId] = useState<string | null>(null);

  const inputContracts = useMemo(() => contracts, [contracts]);

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
              customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Unknown",
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
    const [customer, car] = await Promise.all([getCustomerById(contract.customerId), getCarById(contract.carId)]);
    if (!customer || !car) {
      alert("Unable to generate PDF: Customer or car information not found");
      return;
    }
    await downloadContractPDF(contract, customer, car);
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
          <p className="text-lg font-medium">{loading ? "Loading contracts…" : "No contracts found"}</p>
          {!loading && <p className="text-sm text-muted-foreground">Create your first contract to get started</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border ml-5 mr-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>License #</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Client Sig.</TableHead>
              <TableHead>Owner Sig.</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((contract) => {
              const isCompleted = contract.status === "completed";
              return (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                  <TableCell>{contract.customerName}</TableCell>
                  <TableCell>{contract.carName}</TableCell>
                  <TableCell>{contract.licenseNumber || "—"}</TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell>{contract.days}</TableCell>
                  <TableCell>{formatCurrency(contract.total)}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[contract.status]}>{contract.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {contract.clientSignatureBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contract.clientSignatureBase64}
                        alt="Client signature"
                        className="h-10 w-20 object-contain rounded border bg-white p-1"
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {contract.ownerSignatureBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contract.ownerSignatureBase64}
                        alt="Owner signature"
                        className="h-10 w-20 object-contain rounded border bg-white p-1"
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownloadPDF(contract)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => openImages(contract.id)}>
                          <Images className="mr-2 h-4 w-4" />
                          Show / Attach Images
                        </DropdownMenuItem>

                        {!isCompleted && (
                          <DropdownMenuItem onClick={() => onEdit(contract)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}

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
