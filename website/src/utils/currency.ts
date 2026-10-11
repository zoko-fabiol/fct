/**
 * @license
 * FCT Automobile - Formats Monétaires Officiels (FCFA / XAF)
 * Franchise Conseils Trading - Douala, Cameroun
 */

export function formatXAF(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
}

export function calculateRentalTotal(
  dailyRate: number,
  startDateStr: string,
  endDateStr: string,
  withDriver: boolean = false,
  driverDailyRate: number = 15000
): {
  days: number;
  vehicleTotal: number;
  driverTotal: number;
  grandTotal: number;
} {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const vehicleTotal = diffDays * dailyRate;
  const driverTotal = withDriver ? diffDays * driverDailyRate : 0;
  const grandTotal = vehicleTotal + driverTotal;

  return {
    days: diffDays,
    vehicleTotal,
    driverTotal,
    grandTotal,
  };
}
