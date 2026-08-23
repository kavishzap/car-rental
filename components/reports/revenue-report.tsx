"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getContracts } from "@/lib/services/contracts";
import type { Contract } from "@/lib/types";
import {
  buildMonthlyRevenueForYear,
  countYearRevenueContracts,
  sumYearRevenueFromContracts,
} from "@/lib/utils/revenue-by-month";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function RevenueReport() {
  const reportYear = new Date().getFullYear();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async function load() {
      setLoading(true);
      try {
        const allContracts: Contract[] = await getContracts();
        setContracts(allContracts);
      } finally {
        setLoading(false);
      }
    })();
  }, [reportYear]);

  const chartData = useMemo(() => {
    const totals = buildMonthlyRevenueForYear(contracts, reportYear);
    return MONTH_SHORT.map((month, i) => ({
      month,
      revenue: Math.round((totals[i] ?? 0) * 100) / 100,
    }));
  }, [contracts, reportYear]);

  const hasRevenue = chartData.some((row) => row.revenue > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monthly revenue ({reportYear})</CardTitle>
          <CardDescription>
            Revenue for {reportYear} (active and completed contracts only), spread across rental days by
            calendar month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">Loading…</div>
          ) : !hasRevenue ? (
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
