export function generateContractNumber() {
  // CTR-YYYYMMDD-XXXX (random suffix)
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CTR-${y}${m}${day}-${rand}`;
}
