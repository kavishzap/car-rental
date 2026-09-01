import type { Contract } from "@/lib/types";

const REVENUE_STATUSES = new Set<Contract["status"]>(["active", "completed"]);

/** Fiscal year starts 1 July and ends 30 June of the following calendar year. */
export const FISCAL_YEAR_START_MONTH = 6; // 0-indexed July

export const FISCAL_MONTH_SHORT = [
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
] as const;

function parseDateOnly(iso: string): Date {
  const datePart = iso.split("T")[0] ?? iso;
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Calendar year of the July 1 that opens the fiscal year containing `date`. */
export function getFiscalYearStartYear(date = new Date()): number {
  return date.getMonth() >= FISCAL_YEAR_START_MONTH
    ? date.getFullYear()
    : date.getFullYear() - 1;
}

export function formatFiscalYearRange(startYear: number): string {
  return `Jul ${startYear} – Jun ${startYear + 1}`;
}

function fiscalPeriod(startYear: number) {
  const start = new Date(startYear, FISCAL_YEAR_START_MONTH, 1);
  const endExclusive = new Date(startYear + 1, FISCAL_YEAR_START_MONTH, 1);
  return { start, endExclusive };
}

function rentalOverlapsFiscalYear(start: Date, end: Date, startYear: number): boolean {
  const { start: fyStart, endExclusive } = fiscalPeriod(startYear);
  return start < endExclusive && end >= fyStart;
}

/** 0 = July … 11 = June, or null if the date is outside the fiscal year. */
function fiscalMonthIndex(date: Date, startYear: number): number | null {
  const { start, endExclusive } = fiscalPeriod(startYear);
  if (date < start || date >= endExclusive) return null;
  return (date.getMonth() - FISCAL_YEAR_START_MONTH + 12) % 12;
}

/** Spread contract total across rental days, bucketed by fiscal-year month (Jul–Jun). */
export function allocateContractRevenueByMonth(
  contract: Contract,
  startYear: number
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
  if (!rentalOverlapsFiscalYear(start, end, startYear)) return monthly;

  const rentalDays = contract.days > 0 ? contract.days : 1;
  const perDay = total / rentalDays;

  const cursor = new Date(start);
  for (let i = 0; i < rentalDays; i++) {
    const idx = fiscalMonthIndex(cursor, startYear);
    if (idx !== null) {
      monthly[idx] += perDay;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return monthly;
}

export function buildMonthlyRevenueForYear(
  contracts: Contract[],
  startYear: number
): number[] {
  const totals = new Array(12).fill(0) as number[];

  for (const contract of contracts) {
    const allocated = allocateContractRevenueByMonth(contract, startYear);
    for (let i = 0; i < 12; i++) {
      totals[i] += allocated[i] ?? 0;
    }
  }

  return totals;
}

export function sumYearRevenueFromContracts(
  contracts: Contract[],
  startYear: number
): number {
  return buildMonthlyRevenueForYear(contracts, startYear).reduce(
    (sum, value) => sum + value,
    0
  );
}

export function countYearRevenueContracts(
  contracts: Contract[],
  startYear: number
): number {
  return contracts.filter((c) => {
    if (!REVENUE_STATUSES.has(c.status) || !c.startDate || !c.endDate) {
      return false;
    }
    const start = parseDateOnly(c.startDate);
    const end = parseDateOnly(c.endDate);
    return rentalOverlapsFiscalYear(start, end, startYear);
  }).length;
}
