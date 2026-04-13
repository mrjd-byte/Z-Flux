/**
 * Formats a numeric amount as Indian Rupees (₹).
 * @param amount The numeric amount to format.
 * @returns A string with the ₹ symbol and formatted number.
 */
export function formatCurrency(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
