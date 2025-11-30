"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getContracts } from "@/lib/services/contracts";
import { getCars } from "@/lib/services/cars";
import { getCustomers } from "@/lib/services/customers";
import { formatCurrency } from "@/lib/utils/format";
import { RevenueReport } from "@/components/reports/revenue-report";
import { CarsReport } from "@/components/reports/cars-report";
import { CustomersReport } from "@/components/reports/customers-report";
import type { Contract, Customer, Car } from "@/lib/types";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalContracts: 0,
    averageContractValue: 0,
    totalCars: 0,
    utilizationRate: 0,
    totalCustomers: 0,
    repeatCustomers: 0,
  });

  useEffect(() => {
    (async function loadReportData() {
      setLoading(true);
      try {
        const [contracts, cars, customers]: [Contract[], Car[], Customer[]] = await Promise.all([
          getContracts(),
          getCars(),
          getCustomers(),
        ]);

        const daysAgo = Number.parseInt(dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

        // Filter by period on creation (fallback to startDate if createdAt missing)
        const filteredContracts = contracts.filter((c) => {
          const basis = c.createdAt ?? c.startDate;
          return new Date(basis) >= cutoffDate;
        });

        // Revenue = only active/completed within period
        const totalRevenue = filteredContracts
          .filter((c) => c.status === "active" || c.status === "completed")
          .reduce((sum, c) => sum + (c.total ?? 0), 0);

        const totalContracts = filteredContracts.length;
        const averageContractValue = totalContracts > 0 ? totalRevenue / totalContracts : 0;

        const totalCars = cars.length;

        // Utilization: distinct cars that currently have an ACTIVE contract / total cars
        const activeCarIds = new Set(
          contracts.filter((c) => c.status === "active").map((c) => c.carId)
        );
        const utilizationRate = totalCars > 0 ? (activeCarIds.size / totalCars) * 100 : 0;

        const totalCustomers = customers.length;

        // Repeat customers (overall, not only in period): customers with >1 contracts
        const counts = new Map<string, number>();
        contracts.forEach((c) => counts.set(c.customerId, (counts.get(c.customerId) ?? 0) + 1));
        const repeatCustomers = Array.from(counts.values()).filter((n) => n > 1).length;

        setReportData({
          totalRevenue,
          totalContracts,
          averageContractValue,
          totalCars,
          utilizationRate,
          totalCustomers,
          repeatCustomers,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [dateRange]);

  const handleExport = () => {
    // TODO: implement CSV/PDF export
    alert("Export functionality would be implemented here");
  };

  return (
   <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ml-5 mr-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : formatCurrency(reportData.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "…" : reportData.totalContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Contract Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : formatCurrency(reportData.averageContractValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="revenue" className="space-y-4 ml-5 mr-5">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="cars">Cars</TabsTrigger>
          {/*
            <TabsTrigger value="customers">Customers</TabsTrigger>
          */}
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueReport dateRange={Number.parseInt(dateRange)} />
        </TabsContent>

        <TabsContent value="cars" className="space-y-4">
          <CarsReport />
        </TabsContent>

        {/*
          <TabsContent value="customers" className="space-y-4">
            <CustomersReport />
          </TabsContent>
        */}
      </Tabs>
    </div>
  );
}
