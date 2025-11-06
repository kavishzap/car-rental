"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getContracts } from "@/lib/services/contracts";
import { getCustomerById } from "@/lib/services/customers";
import { getCarById } from "@/lib/services/cars";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Contract, Customer, Car } from "@/lib/types";

type RevenueReportProps = {
  dateRange: number; // last N days
};

type RevenueRow = Contract & {
  customerName: string;
  carName: string;
};

export function RevenueReport({ dateRange }: RevenueReportProps) {
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async function load() {
      setLoading(true);
      try {
        const allContracts: Contract[] = await getContracts();

        // cutoff by createdAt (fallback to startDate if needed)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - dateRange);

        const filtered = allContracts.filter((c) => {
          const basis = c.createdAt ?? c.startDate;
          return new Date(basis) >= cutoff && (c.status === "active" || c.status === "completed");
        });

        // enrich with names in parallel
        const enriched: RevenueRow[] = await Promise.all(
          filtered
            .sort(
              (a, b) =>
                new Date(b.createdAt ?? b.startDate).getTime() -
                new Date(a.createdAt ?? a.startDate).getTime()
            )
            .map(async (contract) => {
              const [customer, car]: [Customer | null, Car | null] = await Promise.all([
                getCustomerById(contract.customerId),
                getCarById(contract.carId),
              ]);

              return {
                ...contract,
                customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Unknown",
                carName: car?.name ?? "Unknown",
              };
            })
        );

        setRows(enriched);
      } finally {
        setLoading(false);
      }
    })();
  }, [dateRange]);

  const totalRevenue = useMemo(
    () => rows.reduce((sum, c) => sum + (c.total ?? 0), 0),
    [rows]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Detailed revenue from all contracts in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
          </div>

          {loading ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No revenue data for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.contractNumber}</TableCell>
                    <TableCell>{c.customerName}</TableCell>
                    <TableCell>{c.carName}</TableCell>
                    <TableCell>{formatDate(c.startDate)}</TableCell>
                    <TableCell>{c.days}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(c.total)}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "completed" ? "secondary" : "default"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
