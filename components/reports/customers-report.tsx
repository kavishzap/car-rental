"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCustomers } from "@/lib/services/customers";
import { getContractsByCustomer } from "@/lib/services/contracts";
import { formatCurrency } from "@/lib/utils/format";
import type { Customer, Contract } from "@/lib/types";

type CustomerReportRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalContracts: number;
  totalSpent: number;
  averageSpent: number;
};

export function CustomersReport() {
  const [rows, setRows] = useState<CustomerReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async function loadCustomersData() {
      setLoading(true);
      try {
        const customers: Customer[] = await getCustomers();

        // Build rows in parallel
        const enriched: CustomerReportRow[] = await Promise.all(
          customers.map(async (customer) => {
            const contracts: Contract[] = await getContractsByCustomer(customer.id);

            const completed = contracts.filter(
              (c) => c.status === "completed" || c.status === "active"
            );

            const totalSpent = completed.reduce<number>((sum, c) => sum + (c.total ?? 0), 0);
            const averageSpent = completed.length > 0 ? totalSpent / completed.length : 0;

            return {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              totalContracts: contracts.length,
              totalSpent,
              averageSpent,
            };
          })
        );

        // Sort by total spent desc
        enriched.sort((a, b) => b.totalSpent - a.totalSpent);
        setRows(enriched);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Analytics</CardTitle>
        <CardDescription>Spending and rental patterns for each customer</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No customer data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Contracts</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Average Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.firstName} {r.lastName}
                  </TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.totalContracts}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(r.totalSpent)}</TableCell>
                  <TableCell>{formatCurrency(r.averageSpent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
