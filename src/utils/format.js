// Formats a number as Philippine Peso, e.g. 15 -> "₱15.00"
// Used everywhere money is displayed, so it's always 2 decimals, never
// floating-point ugliness like ₱14.999999999998.
export function formatPeso(amount) {
  const value = Number(amount) || 0;
  return `₱${value.toFixed(2)}`;
}