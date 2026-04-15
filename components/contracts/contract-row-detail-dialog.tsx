"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getContractById, updateContract } from "@/lib/services/contracts";
import { getCustomerById } from "@/lib/services/customers";
import type { Contract, ContractStatus, Customer } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SIG_W = 640;
const SIG_H = 200;

type EnrichedRow = Contract & {
  customerName?: string;
  carName?: string;
  carPlateNumber?: string;
};

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

type ContractRowDetailDialogProps = {
  open: boolean;
  row: EnrichedRow | null;
  onClose: () => void;
  onSaved?: () => void;
};

type ContractSignatureCanvasHandle = {
  clear: () => void;
  isBlank: () => boolean;
  toDataUrlPng: () => string | null;
};

function formatCustomerAddress(c: Customer | null): string {
  if (!c) return "—";
  const parts = [c.address, c.city, c.country].filter(
    (p) => p != null && String(p).trim() !== ""
  ) as string[];
  return parts.length ? parts.join(", ") : "—";
}

function formatTime(t?: string | null): string {
  if (!t || !String(t).trim()) return "—";
  return String(t).trim();
}

function FieldBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

const ContractSignatureCanvas = forwardRef<
  ContractSignatureCanvasHandle,
  { initialDataUrl?: string | null }
>(function ContractSignatureCanvas({ initialDataUrl }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const syncCanvasBitmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    canvas.width = SIG_W;
    canvas.height = SIG_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;
    return ctx;
  }, []);

  const fillWhite = useCallback(() => {
    const ctx = syncCanvasBitmap();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIG_W, SIG_H);
  }, [syncCanvasBitmap]);

  const drawInitial = useCallback(() => {
    fillWhite();
    if (!initialDataUrl?.trim()) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      fillWhite();
      const c2 = canvasRef.current?.getContext("2d");
      if (!c2) return;
      const scale = Math.min(SIG_W / img.width, SIG_H / img.height, 1);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const ox = (SIG_W - dw) / 2;
      const oy = (SIG_H - dh) / 2;
      c2.drawImage(img, ox, oy, dw, dh);
    };
    img.onerror = () => fillWhite();
    img.src = initialDataUrl;
  }, [fillWhite, initialDataUrl]);

  useEffect(() => {
    const t = window.setTimeout(drawInitial, 30);
    return () => window.clearTimeout(t);
  }, [drawInitial]);

  const toLogical = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * SIG_W;
    const y = ((clientY - rect.top) / rect.height) * SIG_H;
    return { x, y };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p =
      "touches" in e && e.touches[0]
        ? toLogical(e.touches[0].clientX, e.touches[0].clientY)
        : "clientX" in e
          ? toLogical(e.clientX, e.clientY)
          : { x: 0, y: 0 };
    drawing.current = true;
    last.current = p;
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p =
      "touches" in e && e.touches[0]
        ? toLogical(e.touches[0].clientX, e.touches[0].clientY)
        : "clientX" in e
          ? toLogical(e.clientX, e.clientY)
          : last.current;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  const isBlank = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return true;
    const data = ctx.getImageData(0, 0, SIG_W, SIG_H).data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 255;
      const g = data[i + 1] ?? 255;
      const b = data[i + 2] ?? 255;
      const a = data[i + 3] ?? 255;
      if (a < 250) return false;
      if (r < 248 || g < 248 || b < 248) return false;
    }
    return true;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        fillWhite();
      },
      isBlank,
      toDataUrlPng: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        try {
          return canvas.toDataURL("image/png");
        } catch {
          return null;
        }
      },
    }),
    [fillWhite, isBlank]
  );

  return (
    <canvas
      ref={canvasRef}
      className="h-32 w-full cursor-crosshair touch-none rounded-md border border-border bg-white"
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={end}
    />
  );
});

ContractSignatureCanvas.displayName = "ContractSignatureCanvas";

export function ContractRowDetailDialog({
  open,
  row,
  onClose,
  onSaved,
}: ContractRowDetailDialogProps) {
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusDraft, setStatusDraft] = useState<ContractStatus>("draft");
  const [fuelDraft, setFuelDraft] = useState<string>("0");
  const [sigKey, setSigKey] = useState(0);
  const sigRef = useRef<ContractSignatureCanvasHandle>(null);

  const load = useCallback(async () => {
    if (!row?.id) return;
    setLoading(true);
    try {
      const [fresh, cust] = await Promise.all([
        getContractById(row.id),
        getCustomerById(row.customerId),
      ]);
      setContract(fresh);
      setCustomer(cust);
      if (fresh) {
        setStatusDraft(fresh.status);
        setFuelDraft(String(fresh.fuelAmount ?? 0));
      }
      setSigKey((k) => k + 1);
    } catch (e: unknown) {
      toast({
        title: "Could not load contract",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [row?.id, row?.customerId, toast]);

  useEffect(() => {
    if (open && row) {
      void load();
    } else {
      setContract(null);
      setCustomer(null);
    }
  }, [open, row, load]);

  const mergeUpdate = async (patch: Partial<Contract>) => {
    if (!contract) return;
    try {
      await updateContract(contract.id, {
        ...contract,
        ...patch,
      });
      toast({ title: "Saved", description: "Contract updated." });
      await load();
      onSaved?.();
    } catch (e: unknown) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const carLine =
    row &&
    `${row.carName ?? "—"}${row.carPlateNumber ? `(${row.carPlateNumber})` : ""}`;

  const displayName = row?.customerName ?? "—";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex max-h-[min(90vh,900px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle className="text-lg">
            {row ? `Contract ${row.contractNumber}` : "Contract"}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading && !contract ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : contract && row ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldBlock label="Customer">{displayName}</FieldBlock>
                <FieldBlock label="Car">{carLine}</FieldBlock>
                <FieldBlock label="Start date">{formatDate(contract.startDate)}</FieldBlock>
                <FieldBlock label="End date">{formatDate(contract.endDate)}</FieldBlock>
                <FieldBlock label="Days">{contract.days}</FieldBlock>
                <FieldBlock label="Daily rate">{formatCurrency(contract.dailyRate)}</FieldBlock>
                <FieldBlock label="Total">{formatCurrency(contract.total)}</FieldBlock>
                <FieldBlock label="Status">
                  <Badge variant={statusBadgeVariant[contract.status] ?? "outline"} className="capitalize">
                    {contract.status}
                  </Badge>
                </FieldBlock>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">Contract status</Label>
                  <p className="text-xs text-muted-foreground">Change and save the contract status</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="detail-status" className="sr-only">
                      Status
                    </Label>
                    <Select
                      value={statusDraft}
                      onValueChange={(v) => setStatusDraft(v as ContractStatus)}
                    >
                      <SelectTrigger id="detail-status" className="capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" onClick={() => mergeUpdate({ status: statusDraft })}>
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">Fuel amount</Label>
                  <p className="text-xs text-muted-foreground">
                    Set the current fuel level (bars)
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="detail-fuel" className="sr-only">
                      Fuel bars
                    </Label>
                    <Select value={fuelDraft} onValueChange={setFuelDraft}>
                      <SelectTrigger id="detail-fuel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }).map((_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      mergeUpdate({ fuelAmount: Number.parseInt(fuelDraft, 10) || 0 })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldBlock label="Delivery place">
                  {contract.pickupPlace?.trim() ? contract.pickupPlace : "—"}
                </FieldBlock>
                <FieldBlock label="Delivery time">{formatTime(contract.pickupTime)}</FieldBlock>
                <FieldBlock label="Recovery place">
                  {contract.deliveryPlace?.trim() ? contract.deliveryPlace : "—"}
                </FieldBlock>
                <FieldBlock label="Recovery time">{formatTime(contract.deliveryTime)}</FieldBlock>
              </div>

              <FieldBlock label="Customer address">{formatCustomerAddress(customer)}</FieldBlock>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Amount breakdown
                </p>
                <div className="space-y-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Subtotal (days × daily rate)</span>
                    <span className="shrink-0 font-medium">{formatCurrency(contract.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Delivery amount</span>
                    <span className="shrink-0 font-medium">
                      {formatCurrency(contract.deliveryAmount ?? 0)}
                    </span>
                  </div>
                  {(contract.simAmount ?? 0) > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">SIM + Internet</span>
                      <span className="shrink-0 font-medium">
                        {formatCurrency(contract.simAmount ?? 0)}
                      </span>
                    </div>
                  )}
                  {(contract.cardPaymentAmount ?? 0) > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Card payment fee</span>
                      <span className="shrink-0 font-medium">
                        {formatCurrency(contract.cardPaymentAmount ?? 0)}
                      </span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between gap-4 font-semibold">
                    <span>Total</span>
                    <span className="shrink-0">{formatCurrency(contract.total)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Client signature</Label>
                {contract.clientSignatureBase64 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Current signature</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={contract.clientSignatureBase64}
                      alt=""
                      className="max-h-28 w-full rounded-md border object-contain bg-white p-2"
                    />
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">Draw a new signature below, then save.</p>
                <ContractSignatureCanvas
                  ref={sigRef}
                  key={sigKey}
                  initialDataUrl={contract.clientSignatureBase64 ?? null}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => sigRef.current?.clear()}>
                    Clear drawing
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!sigRef.current) return;
                      if (sigRef.current.isBlank()) {
                        toast({
                          title: "Empty signature",
                          description: "Draw something before saving, or use Clear.",
                          variant: "destructive",
                        });
                        return;
                      }
                      const data = sigRef.current.toDataUrlPng();
                      if (!data) {
                        toast({ title: "Could not read canvas", variant: "destructive" });
                        return;
                      }
                      void mergeUpdate({ clientSignatureBase64: data });
                    }}
                  >
                    Save signature
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldBlock label="License number">
                  {contract.licenseNumber?.trim() ? contract.licenseNumber : "—"}
                </FieldBlock>
                <FieldBlock label="Customer NIC / Passport">
                  {contract.customerNicOrPassport?.trim() ? contract.customerNicOrPassport : "—"}
                </FieldBlock>
              </div>

              <FieldBlock label="Notes">
                {contract.notes?.trim() ? (
                  <span className="whitespace-pre-wrap">{contract.notes}</span>
                ) : (
                  "—"
                )}
              </FieldBlock>

              <div className="pt-2">
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contract selected.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
