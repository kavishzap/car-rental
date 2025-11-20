export function calculateContractTotal(
  dailyRate: number,
  days: number,
  discount: number,
  taxRate: number
): { subtotal: number; total: number } {
  const gross = dailyRate * days;
  const discounted = gross - (discount || 0);
  const taxAmount = (discounted * (taxRate || 0)) / 100;
  const total = discounted + taxAmount;

  return {
    subtotal: discounted,
    total,
  };
}
