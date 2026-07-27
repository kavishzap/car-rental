/**
 * Customer portal requests store a JSON payload in `customer_data` instead of a
 * plain NIC/Passport string. Only unwrap when `source === "customer_portal"`;
 * back-office values stay as-is.
 */
export function resolveCustomerNicOrPassport(
  customerData: string | null | undefined
): string | undefined {
  if (customerData == null) return undefined;
  const raw = String(customerData).trim();
  if (!raw) return undefined;

  if (!raw.startsWith("{") && !raw.startsWith("[")) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.source === "customer_portal"
    ) {
      const candidates = [
        parsed.nicOrPassport,
        parsed.nic_or_passport,
        parsed.nic,
        parsed.passport,
        parsed.passportNumber,
        parsed.passport_number,
        parsed.idNumber,
        parsed.id_number,
      ];
      for (const value of candidates) {
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
      return undefined;
    }
  } catch {
    // Not valid JSON — treat as a plain NIC/Passport string.
  }

  return raw;
}
