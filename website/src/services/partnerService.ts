import {
  firestore,
  auth,
  getDocLocalFirst,
  getDocsLocalFirst,
} from './firebase.ts';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { Vehicle } from '../types/index.ts';

export type SharePlatform = 'WHATSAPP_STATUS' | 'WHATSAPP_CHAT' | 'FACEBOOK' | 'INSTAGRAM' | 'UNIVERSAL_SHARE' | 'COPY_LINK' | 'OTHER';

export interface PartnerStats {
  totalShares: number;
  totalClicks: number;
  totalLeads: number;
  totalConversions: number;
  totalEarnedXAF: number;
  balanceAvailableXAF: number;
  paidOutXAF: number;
  lastActivityDate: string;
  dailySharesCount: Record<string, number>;
}

export interface PartnerAccount {
  id: string;
  partnerCode: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  payoutMethod: 'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH' | 'BANK_TRANSFER';
  payoutPhone: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  stats: PartnerStats;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// RÈGLES DE QUOTAS & GESTION DES TIERS PARTENAIRES
// ==========================================

export const PARTNER_TIER_CONFIG = {
  BRONZE: {
    tier: 'BRONZE' as const,
    label: 'Bronze',
    minMonthlyShares: 0,
    requiredToPromote: 10,
    badgeColor: '#c2410c',
    badgeBg: '#ffedd5',
    description: 'Niveau initial (accès libre, 0 quota requis)',
  },
  SILVER: {
    tier: 'SILVER' as const,
    label: 'Silver (Argent)',
    minMonthlyShares: 10,
    requiredToPromote: 25,
    badgeColor: '#475569',
    badgeBg: '#f1f5f9',
    description: 'Niveau régulier (minimum 10 partages sur 30 jours pour conserver le rang)',
  },
  GOLD: {
    tier: 'GOLD' as const,
    label: 'Gold (Or)',
    minMonthlyShares: 25,
    requiredToPromote: 50,
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    description: 'Niveau VIP (minimum 25 partages sur 30 jours pour conserver le rang)',
  },
} as const;

/**
 * Calcule le nombre total de partages effectués sur les 30 derniers jours glissants
 */
export function getSharesInLast30Days(
  dailySharesCount?: Record<string, number>,
  referenceDate: Date = new Date()
): number {
  if (!dailySharesCount) return 0;
  const thirtyDaysAgo = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoffStr = thirtyDaysAgo.toISOString().split('T')[0];

  let sum = 0;
  for (const [dateStr, count] of Object.entries(dailySharesCount)) {
    if (dateStr >= cutoffStr) {
      sum += Number(count) || 0;
    }
  }
  return sum;
}

/**
 * Évalue le rang d'un partenaire avec gestion stricte des quotas 30 jours :
 * - Quota mensuel (30 jours glissants) :
 *   - GOLD : minimum 25 partages/30j. Si non atteint -> rétrograde en SILVER.
 *   - SILVER : minimum 10 partages/30j. Si non atteint -> rétrograde en BRONZE.
 *   - BRONZE : palier initial (0 quota minimum).
 * - Promotion :
 *   - Si >= 25 partages/30j -> Promu GOLD.
 *   - Si >= 10 partages/30j -> Promu SILVER.
 */
export function evaluatePartnerTier(
  currentTier: 'BRONZE' | 'SILVER' | 'GOLD',
  dailySharesCount?: Record<string, number>,
  referenceDate: Date = new Date()
): {
  newTier: 'BRONZE' | 'SILVER' | 'GOLD';
  sharesLast30Days: number;
  quotaRequired: number;
  quotaMet: boolean;
  status: 'PROMOTED' | 'MAINTAINED' | 'DEMOTED';
} {
  const sharesLast30Days = getSharesInLast30Days(dailySharesCount, referenceDate);

  if (currentTier === 'GOLD') {
    if (sharesLast30Days >= 25) {
      return { newTier: 'GOLD', sharesLast30Days, quotaRequired: 25, quotaMet: true, status: 'MAINTAINED' };
    }
    // Rétrogradation progressive d'un seul niveau : Gold -> Silver
    return { newTier: 'SILVER', sharesLast30Days, quotaRequired: 25, quotaMet: false, status: 'DEMOTED' };
  }

  if (currentTier === 'SILVER') {
    if (sharesLast30Days >= 25) {
      return { newTier: 'GOLD', sharesLast30Days, quotaRequired: 10, quotaMet: true, status: 'PROMOTED' };
    }
    if (sharesLast30Days >= 10) {
      return { newTier: 'SILVER', sharesLast30Days, quotaRequired: 10, quotaMet: true, status: 'MAINTAINED' };
    }
    // Rétrogradation progressive d'un seul niveau : Silver -> Bronze
    return { newTier: 'BRONZE', sharesLast30Days, quotaRequired: 10, quotaMet: false, status: 'DEMOTED' };
  }

  // BRONZE (Progression)
  if (sharesLast30Days >= 25) {
    return { newTier: 'GOLD', sharesLast30Days, quotaRequired: 0, quotaMet: true, status: 'PROMOTED' };
  }
  if (sharesLast30Days >= 10) {
    return { newTier: 'SILVER', sharesLast30Days, quotaRequired: 0, quotaMet: true, status: 'PROMOTED' };
  }
  return { newTier: 'BRONZE', sharesLast30Days, quotaRequired: 0, quotaMet: true, status: 'MAINTAINED' };
}

const PARTNER_STORAGE_KEY = 'fct_affiliate_partner_ref';

/**
 * Récupère le code partenaire stocké en session (provenant de l'URL ?ref=CODE)
 */
export function getStoredPartnerRef(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(PARTNER_STORAGE_KEY) || localStorage.getItem(PARTNER_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Enregistre le code partenaire en session et incrémente le compteur de clics
 */
export async function trackPartnerLandingRef(refCode: string | null) {
  if (!refCode || typeof window === 'undefined') return;
  const cleanCode = refCode.trim().toUpperCase();
  if (!cleanCode) return;

  try {
    const existing = getStoredPartnerRef();
    sessionStorage.setItem(PARTNER_STORAGE_KEY, cleanCode);
    localStorage.setItem(PARTNER_STORAGE_KEY, cleanCode);

    // Si nouveau clic dans la session, on incrémente le compteur de clics du partenaire
    if (existing !== cleanCode) {
      const q = query(collection(firestore, 'partners'), where('partnerCode', '==', cleanCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const partnerDoc = snap.docs[0];
        await updateDoc(doc(firestore, 'partners', partnerDoc.id), {
          'stats.totalClicks': increment(1),
          'stats.lastActivityDate': new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[FCT Partner Tracking] Erreur tracking clic affilié :', err);
  }
}

const PARTNER_CACHE_KEY = 'fct_cached_partner_account';
let cachedPartnerAccount: PartnerAccount | null = null;

export function getCachedPartnerAccount(): PartnerAccount | null {
  if (cachedPartnerAccount) return cachedPartnerAccount;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(PARTNER_CACHE_KEY);
      if (raw) {
        cachedPartnerAccount = JSON.parse(raw);
        return cachedPartnerAccount;
      }
    } catch {
      // ignore JSON errors
    }
  }
  return null;
}

export function setCachedPartnerAccount(acc: PartnerAccount | null) {
  cachedPartnerAccount = acc;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (acc) {
        localStorage.setItem(PARTNER_CACHE_KEY, JSON.stringify(acc));
      } else {
        localStorage.removeItem(PARTNER_CACHE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }
}

/**
 * Récupère le profil partenaire associé à l'utilisateur connecté
 */
export async function fetchCurrentPartnerProfile(userId?: string, userEmail?: string): Promise<PartnerAccount | null> {
  try {
    const uid = userId || auth.currentUser?.uid;
    const email = (userEmail || auth.currentUser?.email || '').toLowerCase().trim();

    if (!uid && !email) return null;

    // 1. Recherche par ID direct (cache local d'abord)
    if (uid) {
      const docRef = doc(firestore, 'partners', uid);
      const snap = await getDocLocalFirst(docRef);
      if (snap && snap.exists()) {
        const data = snap.data() as PartnerAccount;
        // Vérification et synchronisation du quota de maintien 30 jours
        const evaluation = evaluatePartnerTier(data.tier, data.stats?.dailySharesCount);
        if (evaluation.newTier !== data.tier) {
          data.tier = evaluation.newTier;
          updateDoc(docRef, { tier: evaluation.newTier, updatedAt: new Date().toISOString() }).catch(() => {});
        }
        setCachedPartnerAccount(data);
        return data;
      }
    }

    // 2. Recherche par email (cache local d'abord)
    if (email) {
      const q = query(collection(firestore, 'partners'), where('email', '==', email));
      const snap = await getDocsLocalFirst(q);
      if (snap && !snap.empty) {
        const data = snap.docs[0].data() as PartnerAccount;
        const evaluation = evaluatePartnerTier(data.tier, data.stats?.dailySharesCount);
        if (evaluation.newTier !== data.tier) {
          data.tier = evaluation.newTier;
          updateDoc(doc(firestore, 'partners', snap.docs[0].id), { tier: evaluation.newTier, updatedAt: new Date().toISOString() }).catch(() => {});
        }
        setCachedPartnerAccount(data);
        return data;
      }
    }

    return null;
  } catch (err) {
    console.error('[FCT Partner] Erreur récupération profil partenaire :', err);
    return null;
  }
}

/**
 * Création ou conversion d'un compte en Partenaire FCT
 */
export async function registerPartnerAccount(data: {
  fullName: string;
  phone: string;
  email: string;
  city?: string;
  payoutMethod?: 'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH' | 'BANK_TRANSFER';
  payoutPhone?: string;
  userId?: string;
}): Promise<{ success: boolean; partner?: PartnerAccount; error?: string }> {
  try {
    const email = data.email.trim().toLowerCase();
    const uid = data.userId || auth.currentUser?.uid || `partner_${Date.now()}`;

    // Génération du code partenaire unique (ex: FCT-FAB-72)
    const namePart = (data.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'USR').toUpperCase();
    const randPart = Math.floor(10 + Math.random() * 90);
    const partnerCode = `FCT-${namePart}-${randPart}`;

    const newPartner: PartnerAccount = {
      id: uid,
      partnerCode,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email,
      city: data.city || 'Douala',
      payoutMethod: data.payoutMethod || 'ORANGE_MONEY',
      payoutPhone: data.payoutPhone || data.phone.trim(),
      status: 'ACTIVE',
      tier: 'BRONZE',
      stats: {
        totalShares: 0,
        totalClicks: 0,
        totalLeads: 0,
        totalConversions: 0,
        totalEarnedXAF: 0,
        balanceAvailableXAF: 0,
        paidOutXAF: 0,
        lastActivityDate: new Date().toISOString(),
        dailySharesCount: {},
      },
      userId: data.userId || auth.currentUser?.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(firestore, 'partners', uid), newPartner);

    return { success: true, partner: newPartner };
  } catch (err: any) {
    console.error('[FCT Partner] Erreur inscription partenaire :', err);
    return { success: false, error: err?.message || "Impossible d'enregistrer le profil partenaire." };
  }
}

/**
 * Enregistre l'action de partage sur les réseaux sociaux et met à jour l'activité du partenaire
 */
export async function logPartnerShare(
  partner: PartnerAccount,
  vehicle: Vehicle,
  platform: SharePlatform
): Promise<void> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Log individuel pour audit et traçabilité
    await addDoc(collection(firestore, 'partner_shares'), {
      partnerId: partner.id,
      partnerCode: partner.partnerCode,
      partnerName: partner.fullName,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
      platform,
      timestamp: serverTimestamp(),
    });

    // 2. Mise à jour des stats agrégées du partenaire
    const currentDaily = partner.stats.dailySharesCount || {};
    const updatedDailyCount = (currentDaily[todayStr] || 0) + 1;
    const updatedDailyMap = {
      ...currentDaily,
      [todayStr]: updatedDailyCount,
    };

    // Évaluation du niveau de tier selon quota 30 jours (Bronze / Silver / Gold)
    const evaluation = evaluatePartnerTier(partner.tier, updatedDailyMap);
    const newTier = evaluation.newTier;

    await updateDoc(doc(firestore, 'partners', partner.id), {
      'stats.totalShares': increment(1),
      [`stats.dailySharesCount.${todayStr}`]: updatedDailyCount,
      'stats.lastActivityDate': new Date().toISOString(),
      tier: newTier,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[FCT Partner] Erreur logging partage :', err);
  }
}

/**
 * Génère l'URL affiliée complète pour un véhicule
 */
export function generateAffiliateUrl(vehicleId: string, partnerCode: string): string {
  const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://fct-automobile.com';
  return `${base}/?ref=${encodeURIComponent(partnerCode)}#/showroom/${vehicleId}`;
}

/**
 * Calcule le montant de la commission selon la nature de l'affaire
 */
export function calculatePartnerCommission(
  dealType: 'RENTAL' | 'SALE',
  dealAmountXAF: number,
  rentalRatePercent: number = 5,
  saleFixedAmountXAF: number = 100000
): number {
  if (dealType === 'RENTAL') {
    return Math.round((dealAmountXAF * rentalRatePercent) / 100);
  }
  return saleFixedAmountXAF;
}

/**
 * Génère le texte pré-rédigé idéal pour WhatsApp et les réseaux sociaux
 */
export function generateShareCopyText(vehicle: Vehicle, affiliateUrl: string, isRent: boolean): string {
  const price = isRent
    ? (vehicle.rentalDailyRate || 0)
    : (vehicle.salePrice || (vehicle as any).sellingPrice || 0);

  if (isRent) {
    return `*LOCATION VÉHICULE CERTIFIÉ - FCT AUTOMOBILE DOUALA*\n\n` +
      `• Modèle : *${vehicle.brand} ${vehicle.model} (${vehicle.year})*\n` +
      `• Tarif : *${price.toLocaleString('fr-FR')} FCFA / jour*\n` +
      `• Garantie : Assurance complète & Entretien certifié FCT\n` +
      `• Disponibilité : Immédiate à Douala (avec ou sans chauffeur)\n\n` +
      `*Consulter la fiche et réserver en ligne :*\n` +
      `${affiliateUrl}\n\n` +
      `Contact direct agence : (+237) 674 38 68 81 / 699 90 28 89\n` +
      `FCT Douala - Carrefour Santa Barbara, Bonamoussadi`;
  }

  return `*VÉHICULE CERTIFIÉ À VENDRE - FCT AUTOMOBILE DOUALA*\n\n` +
    `• Modèle : *${vehicle.brand} ${vehicle.model} (${vehicle.year})*\n` +
    `• Prix : *${price.toLocaleString('fr-FR')} FCFA*\n` +
    `• Statut : Certifié FCT, révisé et prêt à rouler\n` +
    `• Emplacement : Showroom Bonamoussadi, Carrefour Santa Barbara\n\n` +
    `*Consulter les photos et demander une proforma officielle :*\n` +
    `${affiliateUrl}\n\n` +
    `Contact direct agence : (+237) 674 38 68 81 / 699 90 28 89\n` +
    `FCT Douala - Carrefour Santa Barbara, Bonamoussadi`;
}
