/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Smart Text Summarizer & Responsive Formatters
 * Franchise Conseils Trading - Douala, Cameroun
 */

/**
 * Résume intelligemment un texte en respectant les limites de mots (sans couper au milieu d'un mot).
 */
export function summarizeText(text?: string | null, maxChars: number = 80): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const sub = trimmed.slice(0, maxChars);
  const lastSpace = sub.lastIndexOf(' ');
  const cleanCut = lastSpace > maxChars * 0.6 ? sub.slice(0, lastSpace) : sub;
  return `${cleanCut}...`;
}

/**
 * Formatage monétaire compact pour petits écrans (mobile / cartes étroites)
 * ex: 65 000 FCFA -> 65k FCFA, 28 000 000 FCFA -> 28M FCFA
 */
export function formatCompactXAF(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 FCFA';
  if (amount >= 1_000_000) {
    const m = (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1);
    return `${m}M FCFA`;
  }
  if (amount >= 1_000) {
    const k = (amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 0);
    return `${k}k FCFA`;
  }
  return `${Math.round(amount)} FCFA`;
}

/**
 * Formatage de date compact pour mobile
 */
export function formatCompactDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return 'Aujourd’hui';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
  } catch {
    return dateStr;
  }
}
