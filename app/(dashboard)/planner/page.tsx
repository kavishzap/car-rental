"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getContracts } from "@/lib/services/contracts";
import { getCars } from "@/lib/services/cars";
import { getCustomers } from "@/lib/services/customers";
import type { Contract } from "@/lib/types";
import type { Car } from "@/lib/types";
import {
  Calendar as BigCalendar,
  type Event as RBCEvent,
  Views,
} from "react-big-calendar";
import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

const locales = {
  "en-GB": enGB,
};

const localizer = dateFnsLocalizer({
  format,
  parse: (str, fmt, refDate) => parse(str, fmt, refDate, { locale: enGB }),
  startOfWeek: () => startOfWeek(new Date(), { locale: enGB }),
  getDay,
  locales,
});

type PlannerEvent = RBCEvent & {
  contractId: string;
  carId: string;
  customerId: string;
  status: Contract["status"];
  carName?: string;
  customerName?: string;
};

export default function ContractsPlannerPage() {
  const { toast } = useToast();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const [selectedCarId, setSelectedCarId] = useState<string | "all">("all");

  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);

  const [view, setView] = useState<(typeof Views)[keyof typeof Views]>(
    Views.MONTH
  );
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Load all contracts + cars + customers
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [contractsRes, carsRes, customersRes] = await Promise.all([
          getContracts(), // you already have this service
          getCars(),
          getCustomers(),
        ]);

        if (cancelled) return;

        setContracts(contractsRes);
        setCars(carsRes);
        setCustomers(
          customersRes.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
          }))
        );
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to load planner data", err);
        toast({
          title: "Failed to load planner data",
          description: err?.message ?? "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Helper to get labels
  const getCarLabel = (id: string) => {
    const car = cars.find((c) => c.id === id);
    if (!car) return "Unknown car";

    // main label = plate number
    if ("plate_number" in car && car.plate_number) {
      return `${car.plate_number} – ${car.name}`;
    }

    return car.plateNumber ?? "Unknown car";
  };
  const getCustomerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? "Unknown customer";

  // Build calendar events
  const events: PlannerEvent[] = useMemo(() => {
    return contracts.map((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      // react-big-calendar treats end as exclusive, so +1 day for all-day style
      end.setDate(end.getDate());

       const carLabel = getCarLabel(c.carId);
      const customerName = getCustomerName(c.customerId);

      return {
        contractId: c.id,
        carId: c.carId,
        customerId: c.customerId,
        status: c.status,
        carLabel,
        customerName,
        title: `${carLabel} – ${customerName}`,
        start,
        end,
        allDay: true,
      };
    });
  }, [contracts, cars, customers]);

  // Apply filters (by car)
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedCarId !== "all" && ev.carId !== selectedCarId) return false;
      return true;
    });
  }, [events, selectedCarId]);

  // Event styling
  const eventPropGetter = (event: PlannerEvent) => {
    return {
      style: {
        backgroundColor: "#0f172a",
        borderRadius: "6px",
        border: "none",
        color: "white",
        fontSize: "0.75rem",
        padding: "2px 4px",
      },
    };
  };
  const selectedCar = selectedEvent
    ? cars.find((c) => c.id === selectedEvent.carId)
    : undefined;
  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Contracts Planner</CardTitle>

          <div className="flex flex-wrap gap-3">
            {/* Car filter */}
            <div className="min-w-[180px]">
              <Select
                value={selectedCarId}
                onValueChange={(val) =>
                  setSelectedCarId(val === "all" ? "all" : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by car" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cars</SelectItem>
                  {cars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.plateNumber
                        ? `${c.plateNumber} – ${c.name}`
                        : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading planner…</p>
          ) : (
            <div className="h-[700px] rounded-md border bg-background p-2">
              <BigCalendar
                localizer={localizer}
                events={filteredEvents}
                view={view}
                onView={(nextView) => setView(nextView)}
                date={currentDate}
                onNavigate={(nextDate) => setCurrentDate(nextDate)}
                defaultView={Views.MONTH}
                views={[Views.MONTH]}
                startAccessor="start"
                endAccessor="end"
                popup
                onSelectEvent={(event) =>
                  setSelectedEvent(event as PlannerEvent)
                }
                eventPropGetter={eventPropGetter}
                tooltipAccessor={undefined}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Booking details</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
            {/* 🔹 Car block with full details */}
            <div className="space-y-1">
              <div>
                <span className="font-medium">Car:</span>{" "}
                {selectedCar?.name ?? "Unknown car"}
              </div>
              {selectedCar?.brand && (
                <div>
                  <span className="font-medium">Brand:</span>{" "}
                  {selectedCar.brand}
                </div>
              )}
              {selectedCar?.model && (
                <div>
                  <span className="font-medium">Model:</span>{" "}
                  {selectedCar.model}
                </div>
              )}
              {selectedCar?.pricePerDay && (
                <div>
                  <span className="font-medium">Rate per day:</span>{" "}
                  {selectedCar.pricePerDay}
                </div>
              )}
            </div>

            {/* Existing fields stay the same */}
            <div>
              <span className="font-medium">Customer:</span>{" "}
              {selectedEvent.customerName}
            </div>
            <div>
              <span className="font-medium">Start:</span>{" "}
              {format(selectedEvent.start as Date, "PPP")}
            </div>
            <div>
              <span className="font-medium">End:</span>{" "}
              {format(selectedEvent.end as Date, "PPP")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
