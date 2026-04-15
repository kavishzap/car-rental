"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getContracts } from "@/lib/services/contracts";
import { getCars } from "@/lib/services/cars";
import { getCustomers, getCustomerById } from "@/lib/services/customers";
import type { Contract, Car } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const WINDOW_DAYS = 14;

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  active: "default",
  completed: "success",
  draft: "warning",
  cancelled: "destructive",
  overdue: "destructive",
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseContractDay(iso: string): Date {
  return startOfDay(new Date(iso));
}

function overlapsWindow(c: Contract, winStart: Date, winEnd: Date): boolean {
  if (c.status === "cancelled") return false;
  const a = parseContractDay(c.startDate).getTime();
  const b = parseContractDay(c.endDate).getTime();
  const w0 = winStart.getTime();
  const w1 = winEnd.getTime();
  return a <= w1 && b >= w0;
}

function carLabel(car: Car | undefined): string {
  if (!car) return "Unknown car";
  return car.plateNumber ? `${car.plateNumber} · ${car.name}` : car.name;
}

export default function Planner2Page() {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState<string | "all">("all");
  const [viewStart, setViewStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<{ email: string; phone: string } | null>(null);

  const viewEnd = useMemo(() => {
    const e = addDays(viewStart, WINDOW_DAYS - 1);
    return startOfDay(e);
  }, [viewStart]);

  const dayStrip = useMemo(() => {
    return Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(viewStart, i));
  }, [viewStart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cList, carList, custList] = await Promise.all([
          getContracts(),
          getCars(),
          getCustomers(),
        ]);
        if (cancelled) return;
        setContracts(cList);
        setCars(carList);
        setCustomers(
          custList.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
          }))
        );
      } catch (err: unknown) {
        if (!cancelled) {
          toast({
            title: "Failed to load planner",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const inWindow = useMemo(() => {
    const ws = startOfDay(viewStart);
    const we = viewEnd;
    return contracts.filter((c) => overlapsWindow(c, ws, we));
  }, [contracts, viewStart, viewEnd]);

  const filtered = useMemo(() => {
    if (selectedCarId === "all") return inWindow;
    return inWindow.filter((c) => c.carId === selectedCarId);
  }, [inWindow, selectedCarId]);

  const byCar = useMemo(() => {
    const map = new Map<string, Contract[]>();
    for (const c of filtered) {
      const list = map.get(c.carId) ?? [];
      list.push(c);
      map.set(c.carId, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          parseContractDay(a.endDate).getTime() - parseContractDay(b.endDate).getTime()
      );
    }
    const orderedCars = [...cars].sort((a, b) =>
      (a.plateNumber || a.name).localeCompare(b.plateNumber || b.name)
    );
    return orderedCars.map((car) => ({
      car,
      rows: map.get(car.id) ?? [],
    }));
  }, [filtered, cars]);

  const endingInWindow = useMemo(() => {
    const ws = startOfDay(viewStart).getTime();
    const we = viewEnd.getTime();
    return filtered
      .filter((c) => {
        const end = parseContractDay(c.endDate).getTime();
        return end >= ws && end <= we;
      })
      .sort((a, b) => parseContractDay(a.endDate).getTime() - parseContractDay(b.endDate).getTime());
  }, [filtered, viewStart, viewEnd]);

  useEffect(() => {
    if (!selectedContract) {
      setDetailCustomer(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cust = await getCustomerById(selectedContract.customerId);
        if (cancelled) return;
        if (cust) {
          setDetailCustomer({
            email: cust.email || "",
            phone: cust.phone || "",
          });
        } else setDetailCustomer(null);
      } catch {
        if (!cancelled) setDetailCustomer(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedContract]);

  const selectedCar = selectedContract ? cars.find((c) => c.id === selectedContract.carId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Planner 2"
        actions={
          <div className="min-w-[180px]">
            <Select
              value={selectedCarId}
              onValueChange={(val) => setSelectedCarId(val === "all" ? "all" : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by car" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cars</SelectItem>
                {cars.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.plateNumber ? `${c.plateNumber} – ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="space-y-2 px-4 sm:px-6">
        <p className="text-sm text-muted-foreground max-w-3xl">
          Two-week lane view: each rental shows <strong>return (end) date</strong> first so it is easy to
          scan. Use the strip to see how bookings sit across days. Original calendar planner stays under{" "}
          <span className="font-medium text-foreground">Planner</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous two weeks"
            onClick={() => setViewStart((d) => addDays(d, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next two weeks"
            onClick={() => setViewStart((d) => addDays(d, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setViewStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            This week
          </Button>
        </div>
        <p className="text-sm font-medium text-foreground">
          {format(viewStart, "MMM d")} – {format(viewEnd, "MMM d, yyyy")}
        </p>
      </div>

      {/* Day strip */}
      <Card className="mx-4 sm:mx-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">14-day overview</CardTitle>
          <CardDescription>Each column is one day; today is highlighted.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex min-w-[720px] gap-1">
            {dayStrip.map((day) => {
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-md border px-1 py-2 text-center text-[11px] sm:text-xs",
                    today ? "border-primary bg-primary/10 font-semibold text-primary" : "bg-muted/40"
                  )}
                >
                  <span className="text-muted-foreground">{format(day, "EEE")}</span>
                  <span>{format(day, "d")}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="px-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-8 px-4 pb-8 sm:px-6">
          {endingInWindow.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">Returns in this window</h2>
              <p className="text-sm text-muted-foreground">
                Rentals whose <strong>end date</strong> falls inside the dates above (sorted by return
                date).
              </p>
              <ul className="space-y-2">
                {endingInWindow.map((c) => {
                  const car = cars.find((x) => x.id === c.carId);
                  const cust = customers.find((x) => x.id === c.customerId)?.name ?? "Customer";
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedContract(c)}
                        className="flex w-full flex-col gap-2 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">{c.contractNumber}</div>
                          <div className="font-medium">{cust}</div>
                          <div className="text-sm text-muted-foreground">{carLabel(car)}</div>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <div className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
                            Pickup {format(parseContractDay(c.startDate), "MMM d, yyyy")}
                          </div>
                          <div className="rounded-md bg-emerald-600 px-4 py-2 text-base font-bold text-white shadow-sm dark:bg-emerald-700">
                            Return {format(parseContractDay(c.endDate), "MMM d, yyyy")}
                          </div>
                          <Badge variant={statusBadgeVariant[c.status] ?? "outline"} className="capitalize">
                            {c.status}
                          </Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">By vehicle</h2>
            <p className="text-sm text-muted-foreground">
              All rentals that overlap this period, grouped by car. <strong>Return</strong> is always the
              large green label.
            </p>
            <div className="space-y-6">
              {byCar.every((g) => g.rows.length === 0) ? (
                <p className="text-sm text-muted-foreground">No bookings in this period for the selected filter.</p>
              ) : (
                byCar.map(({ car, rows }) => {
                  if (rows.length === 0) return null;
                  return (
                    <Card key={car.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{carLabel(car)}</CardTitle>
                        <CardDescription>
                          {rows.length} rental{rows.length === 1 ? "" : "s"} overlapping this window
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {rows.map((c) => {
                          const cust = customers.find((x) => x.id === c.customerId)?.name ?? "Customer";
                          const s = parseContractDay(c.startDate);
                          const e = parseContractDay(c.endDate);

                          return (
                            <div key={c.id} className="space-y-2 rounded-lg border bg-muted/20 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <div className="text-xs text-muted-foreground">{c.contractNumber}</div>
                                  <div className="font-medium">{cust}</div>
                                </div>
                                <Badge variant={statusBadgeVariant[c.status] ?? "outline"} className="capitalize">
                                  {c.status}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground sm:text-xs">
                                Shaded days are inside this rental for the 14-day window (each square is one day).
                              </p>
                              <div className="grid grid-cols-7 gap-0.5 sm:grid-cols-14">
                                {dayStrip.map((day) => {
                                  const t = startOfDay(day).getTime();
                                  const active = t >= s.getTime() && t <= e.getTime();
                                  return (
                                    <div
                                      key={`${c.id}-${t}`}
                                      title={format(day, "EEEE, MMMM d, yyyy")}
                                      className={cn(
                                        "flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm border border-border/60 px-0.5 py-1 text-center leading-tight",
                                        active
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted/50 text-muted-foreground"
                                      )}
                                    >
                                      <span className="text-[9px] font-medium uppercase opacity-90 sm:text-[10px]">
                                        {format(day, "EEE")}
                                      </span>
                                      <span className="text-sm font-bold tabular-nums sm:text-base">
                                        {format(day, "d")}
                                      </span>
                                      <span className="text-[9px] opacity-90 sm:text-[10px]">
                                        {format(day, "MMM")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm">
                                <span className="rounded bg-amber-100 px-2 py-1 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50">
                                  Start <strong>{format(s, "MMM d, yyyy")}</strong>
                                </span>
                                <span className="rounded bg-emerald-600 px-3 py-1.5 font-bold text-white dark:bg-emerald-700">
                                  Return <strong>{format(e, "MMM d, yyyy")}</strong>
                                </span>
                                <span className="text-muted-foreground">{c.days} days</span>
                                <span className="text-muted-foreground">{formatCurrency(c.total)}</span>
                              </div>
                              <Button variant="link" className="h-auto p-0 text-sm" onClick={() => setSelectedContract(c)}>
                                View details
                              </Button>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      <Dialog open={!!selectedContract} onOpenChange={(o) => !o && setSelectedContract(null)}>
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{selectedContract?.contractNumber}</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Return (end)</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {format(parseContractDay(selectedContract.endDate), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pickup (start)</p>
                <p className="font-medium">
                  {format(parseContractDay(selectedContract.startDate), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <p className="font-medium">
                    {customers.find((x) => x.id === selectedContract.customerId)?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Vehicle</span>
                  <p className="font-medium">{carLabel(selectedCar)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total</span>
                  <p className="font-medium">{formatCurrency(selectedContract.total)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p>
                    <Badge variant={statusBadgeVariant[selectedContract.status] ?? "outline"} className="capitalize">
                      {selectedContract.status}
                    </Badge>
                  </p>
                </div>
              </div>
              {(detailCustomer?.email || detailCustomer?.phone) && (
                <div className="grid gap-2 sm:grid-cols-2 border-t pt-3">
                  {detailCustomer.email ? (
                    <div>
                      <span className="text-xs text-muted-foreground">Email</span>
                      <p>{detailCustomer.email}</p>
                    </div>
                  ) : null}
                  {detailCustomer.phone ? (
                    <div>
                      <span className="text-xs text-muted-foreground">Phone</span>
                      <p>{detailCustomer.phone}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedContract(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
