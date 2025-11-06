"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCars } from "@/lib/services/cars";
import { getContractsByCar } from "@/lib/services/contracts";
import { formatCurrency } from "@/lib/utils/format";

export function CarsReport() {
  const [carsData, setCarsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarsData();
  }, []);

  const loadCarsData = async () => {
    try {
      setLoading(true);

      const cars = await getCars(); // ✅ await cars
      const enriched = await Promise.all(
        cars.map(async (car) => {
          const contracts = await getContractsByCar(car.id); // ✅ await contracts

          const completedContracts = contracts.filter(
            (c) => c.status === "completed" || c.status === "active"
          );

          const totalRevenue = completedContracts.reduce(
            (sum, c) => sum + (c.total || 0),
            0
          );
          const totalDays = completedContracts.reduce(
            (sum, c) => sum + (c.days || 0),
            0
          );

          return {
            ...car,
            totalContracts: contracts.length,
            totalRevenue,
            totalDays,
            utilizationRate:
              totalDays > 0 ? ((totalDays / 365) * 100).toFixed(1) : "0.0",
          };
        })
      );

      enriched.sort((a, b) => b.totalRevenue - a.totalRevenue);
      setCarsData(enriched);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive"> =
    {
      available: "default",
      maintenance: "secondary",
      unavailable: "destructive",
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cars Performance</CardTitle>
        <CardDescription>
          Revenue and utilization metrics for each car
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Loading…
          </div>
        ) : carsData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No cars data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Contracts</TableHead>
                <TableHead>Total Days Rented</TableHead>
                <TableHead>Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carsData.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-medium">{car.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[car.status]}>
                      {car.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{car.totalContracts}</TableCell>
                  <TableCell>{car.totalDays}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(car.totalRevenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
