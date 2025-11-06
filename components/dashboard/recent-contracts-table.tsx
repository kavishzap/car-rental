"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { getCustomerById } from "@/lib/services/customers";
import { getCarById } from "@/lib/services/cars";
import type { Contract } from "@/lib/types";

type RecentContractsTableProps = {
  contracts: Contract[];
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

export function RecentContractsTable({ contracts }: RecentContractsTableProps) {
  const [enrichedContracts, setEnrichedContracts] = useState<
    Array<Contract & { customerName?: string; carName?: string }>
  >([]);

  useEffect(() => {
    async function enrich() {
      const enriched = await Promise.all(
        contracts.map(async (contract) => {
          const [customer, car] = await Promise.all([
            getCustomerById(contract.customerId),
            getCarById(contract.carId),
          ]);

          return {
            ...contract,
            customerName: customer
              ? `${customer.firstName} ${customer.lastName}`
              : "Unknown",
            carName: car?.name || "Unknown",
          };
        })
      );

      setEnrichedContracts(enriched);
    }

    enrich();
  }, [contracts]);

  if (enrichedContracts.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        No contracts found. Create your first contract to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contract #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Car</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {enrichedContracts.map((contract) => (
          <TableRow key={contract.id}>
            <TableCell className="font-medium">
              {contract.contractNumber}
            </TableCell>
            <TableCell>{contract.customerName}</TableCell>
            <TableCell>{contract.carName}</TableCell>
            <TableCell>{formatDate(contract.startDate)}</TableCell>
            <TableCell>{formatCurrency(contract.total)}</TableCell>
            <TableCell>
              <Badge variant={statusColors[contract.status]}>
                {contract.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
