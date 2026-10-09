/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Formatage des documents imprimés (factures, reçus)
 * Franchise Conseils Trading - Douala, Cameroun
 */

/**
 * Montant en FCFA avec des espaces normaux comme séparateurs de milliers.
 * `Intl.NumberFormat('fr')` produit une espace fine insécable (U+202F) que
 * les polices standard des PDF n'affichent pas correctement (carré ou « / »).
 */
export function formatAmountPlain(amount: number, withCurrency = true): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  const sign = value < 0 ? '-' : '';
  const digits = Math.abs(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${digits}${withCurrency ? ' FCFA' : ''}`;
}

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function below100(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    const base = t === 7 ? 'soixante' : 'quatre-vingt';
    const rest = 10 + u;
    if (t === 7 && u === 1) return 'soixante et onze';
    return `${base}-${UNITS[rest]}`;
  }
  if (t === 8) return u === 0 ? 'quatre-vingts' : `quatre-vingt-${UNITS[u]}`;
  if (u === 0) return TENS[t];
  if (u === 1) return `${TENS[t]} et un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = '';
  if (h > 0) {
    out = h === 1 ? 'cent' : `${UNITS[h]} cent${r === 0 ? 's' : ''}`;
  }
  if (r > 0) out = out ? `${out} ${below100(r)}` : below100(r);
  return out;
}

/**
 * Convertit un nombre entier en toutes lettres (français, règles usuelles).
 * Ex : 1 250 000 → « un million deux cent cinquante mille »
 */
export function numberToFrenchWords(amount: number): string {
  let n = Math.floor(Math.abs(Number.isFinite(amount) ? amount : 0));
  if (n === 0) return 'zéro';

  const parts: string[] = [];
  const scales: [number, string, string][] = [
    [1_000_000_000, 'milliard', 'milliards'],
    [1_000_000, 'million', 'millions'],
  ];
  for (const [value, singular, plural] of scales) {
    const q = Math.floor(n / value);
    if (q > 0) {
      parts.push(`${below1000(q)} ${q > 1 ? plural : singular}`);
      n %= value;
    }
  }
  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    // « cent » et « quatre-vingt » restent invariables devant « mille »
    const t = below1000(thousands).replace(/cents$/, 'cent').replace(/vingts$/, 'vingt');
    parts.push(thousands === 1 ? 'mille' : `${t} mille`);
    n %= 1000;
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(' ');
}

/** Montant en lettres pour les factures : « Arrêtée la présente facture à la somme de … ». */
export function amountInWordsFCFA(amount: number): string {
  const words = numberToFrenchWords(Math.round(amount));
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} francs CFA`;
}

/** Contenu encodé dans le QR code de vérification d'un document. */
export function buildVerificationPayload(data: {
  docNumber: string;
  date: string;
  total?: number;
  totalAmountXAF?: number;
  customerName: string;
}): string {
  const tot = data.total ?? data.totalAmountXAF ?? 0;
  return [
    'FCT-AUTOMOBILE-DOUALA',
    `DOC:${data.docNumber}`,
    `DATE:${data.date}`,
    `CLIENT:${data.customerName}`,
    `TOTAL:${Math.round(tot)} XAF`,
  ].join('|');
}

/** Nom de fichier sûr pour l'export PDF. */
export function buildPdfFileName(title: string, docNumber: string): string {
  const base = `${title}_${docNumber}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${base || 'Document_FCT'}.pdf`;
}
