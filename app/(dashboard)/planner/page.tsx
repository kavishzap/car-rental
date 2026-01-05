"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { getCustomers, getCustomerById } from "@/lib/services/customers";
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
        backgroundColor: "#3b82f6",
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
  
  const [selectedCustomer, setSelectedCustomer] = useState<{ email: string; phone: string } | null>(null);

  useEffect(() => {
    if (selectedEvent) {
      (async () => {
        try {
          const customer = await getCustomerById(selectedEvent.customerId);
          if (customer) {
            setSelectedCustomer({
              email: customer.email || "",
              phone: customer.phone || "",
            });
          } else {
            setSelectedCustomer(null);
          }
        } catch {
          setSelectedCustomer(null);
        }
      })();
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedEvent]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contracts Planner"
        actions={
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
        }
      />

      <div className="px-6 space-y-4">
        <Card>

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

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent 
          className="max-w-3xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Car Information Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">
                Car Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">Car Name</span>
                    <span className="text-sm font-medium">{selectedCar?.name ?? "Unknown car"}</span>
                  </div>
                  {selectedCar?.plateNumber && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Plate Number</span>
                      <span className="text-sm">{selectedCar.plateNumber}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedCar?.brand && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Brand</span>
                      <span className="text-sm">{selectedCar.brand}</span>
                    </div>
                  )}
                  {selectedCar?.model && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Model</span>
                      <span className="text-sm">{selectedCar.model}</span>
                    </div>
                  )}
                  {selectedCar?.pricePerDay && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Rate per Day</span>
                      <span className="text-sm font-medium">{selectedCar.pricePerDay} MUR</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Customer Information Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">
                Customer Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">Customer Name</span>
                    <span className="text-sm font-medium">{selectedEvent?.customerName ?? "Unknown customer"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedCustomer?.email && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Email</span>
                      <span className="text-sm">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer?.phone && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Phone</span>
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Rental Period Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground border-b pb-2">
                Rental Period
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">Start Date</span>
                  <span className="text-sm font-medium">
                    {selectedEvent && format(selectedEvent.start as Date, "PPP")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">End Date</span>
                  <span className="text-sm font-medium">
                    {selectedEvent && format(selectedEvent.end as Date, "PPP")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
