const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

/** Format a number as Mexican peso currency (e.g. `formatMXN(1250)` → `"$1,250.00"`). */
export function formatMXN(amount: number): string {
  return MXN.format(amount);
}
