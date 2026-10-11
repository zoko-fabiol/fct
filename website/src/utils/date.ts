/**
 * @license
 * FCT Automobile - Gestion des dates et calendriers
 * Douala, Cameroun
 */

export function formatDateFR(dateString?: string): string {
  if (!dateString) return 'Date non spécifiée';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultReturnDateString(daysAhead = 3): string {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
