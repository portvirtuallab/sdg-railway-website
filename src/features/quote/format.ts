/** Formatting shared by server pages and client components. */
export function money(n: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export const STATUS_LABEL: Record<string, string> = {
  issued: 'Issued – awaiting acceptance',
  accepted: 'Accepted',
  expired: 'Expired',
  superseded: 'Superseded by a newer version',
  confirmed: 'Booking confirmed',
  'pending-train': 'Booking – train pending confirmation',
};
