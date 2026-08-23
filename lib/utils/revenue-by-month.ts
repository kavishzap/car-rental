import type { Contract } from "@/lib/types";

const REVENUE_STATUSES = new Set<Contract["status"]>(["active", "completed"]);

function parseDateOnly(iso: string): Date {
  const datePart = iso.split("T")[0] ?? iso;
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function rentalOverlapsYear(start: Date, end: Date, year: number): boolean {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  return start < yearEnd && end >= yearStart;
}

/** Spread contract total across rental days, bucketed by calendar month. */
export function allocateContractRevenueByMonth(
  contract: Contract,
  year: number
): number[] {
  const monthly = new Array(12).fill(0) as number[];
  const total = contract.total ?? 0;

  if (
    total <= 0 ||
    !contract.startDate ||
    !contract.endDate ||
    !REVENUE_STATUSES.has(contract.status)
  ) {
    return monthly;
  }

  const start = parseDateOnly(contract.startDate);
  const end = parseDateOnly(contract.endDate);
  if (!rentalOverlapsYear(start, end, year)) return monthly;

  const rentalDays = contract.days > 0 ? contract.days : 1;
  const perDay = total / rentalDays;

  const cursor = new Date(start);
  for (let i = 0; i < rentalDays; i++) {
    if (cursor.getFullYear() === year) {
      monthly[cursor.getMonth()] += perDay;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return monthly;
}

export function buildMonthlyRevenueForYear(
  contracts: Contract[],
  year: number
): number[] {
  const totals = new Array(12).fill(0) as number[];

  for (const contract of contracts) {
    const allocated = allocateContractRevenueByMonth(contract, year);
    for (let i = 0; i < 12; i++) {
      totals[i] += allocated[i] ?? 0;
    }
  }

  return totals;
}

export function sumYearRevenueFromContracts(
  contracts: Contract[],
  year: number
): number {
  return buildMonthlyRevenueForYear(contracts, year).reduce(
    (sum, value) => sum + value,
    0
  );
}

export function countYearRevenueContracts(
  contracts: Contract[],
  year: number
): number {
  return contracts.filter((c) => {
    if (!REVENUE_STATUSES.has(c.status) || !c.startDate || !c.endDate) {
      return false;
    }
    const start = parseDateOnly(c.startDate);
    const end = parseDateOnly(c.endDate);
    return rentalOverlapsYear(start, end, year);
  }).length;
}
