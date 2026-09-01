"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getContracts } from "@/lib/services/contracts";
import type { Contract } from "@/lib/types";
import {
  FISCAL_MONTH_SHORT,
  buildMonthlyRevenueForYear,
  formatFiscalYearRange,
  getFiscalYearStartYear,
} from "@/lib/utils/revenue-by-month";

export function RevenueReport() {
  const fiscalStartYear = getFiscalYearStartYear();
  const fiscalRangeLabel = formatFiscalYearRange(fiscalStartYear);
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
  }, [fiscalStartYear]);

  const chartData = useMemo(() => {
    const totals = buildMonthlyRevenueForYear(contracts, fiscalStartYear);
    return FISCAL_MONTH_SHORT.map((month, i) => ({
      month,
      revenue: Math.round((totals[i] ?? 0) * 100) / 100,
    }));
  }, [contracts, fiscalStartYear]);

  const hasRevenue = chartData.some((row) => row.revenue > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monthly revenue ({fiscalRangeLabel})</CardTitle>
          <CardDescription>
            Revenue for {fiscalRangeLabel} (active and completed contracts only), spread across rental
            days by calendar month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">Loading…</div>
          ) : !hasRevenue ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No revenue data for {fiscalRangeLabel} yet
            </div>
          ) : (
            <RevenueChart data={chartData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
