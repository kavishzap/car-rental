"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getContracts } from "@/lib/services/contracts";
import type { Contract } from "@/lib/types";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function contractBasisDate(c: Contract): Date {
  return new Date(c.createdAt ?? c.startDate);
}

function isInCalendarYear(d: Date, year: number): boolean {
  return d.getFullYear() === year;
}

export function RevenueReport() {
  const reportYear = new Date().getFullYear();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async function load() {
      setLoading(true);
      try {
        const allContracts: Contract[] = await getContracts();

        const filtered = allContracts.filter((c) => {
          const basis = contractBasisDate(c);
          return (
            isInCalendarYear(basis, reportYear) &&
            (c.status === "active" || c.status === "completed")
          );
        });

        setContracts(filtered);
      } finally {
        setLoading(false);
      }
    })();
  }, [reportYear]);

  const chartData = useMemo(() => {
    const totals = new Array(12).fill(0) as number[];
    for (const c of contracts) {
      const m = contractBasisDate(c).getMonth();
      totals[m] += c.total ?? 0;
    }
    return MONTH_SHORT.map((month, i) => ({ month, revenue: totals[i] }));
  }, [contracts]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monthly revenue ({reportYear})</CardTitle>
          <CardDescription>
            Revenue by calendar month for {reportYear} (active and completed contracts only), based on contract
            creation date (or start date if creation date is missing).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">Loading…</div>
          ) : contracts.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No revenue data for {reportYear} yet
            </div>
          ) : (
            <RevenueChart data={chartData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
