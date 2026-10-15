/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service Profil Utilisateur (Adhérents & Partenaires)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { firestore, getDocLocalFirst } from './firebase.ts';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type UserAccountType = 'PARTNER' | 'CLIENT';

export interface UnifiedUserProfile {
  id: string;
  accountType: UserAccountType;
  fullName: string;
  email: string;
  phone: string;
  whatsappPhone: string;
  city: string;
  address?: string;
  idCardNumber?: string;

  // Coordonnées financières (Orange Money / MTN Mobile Money)
  payoutMethod: 'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH';
  payoutPhone: string;
  payoutAccountName: string;

  // Drapeaux de synchronisation intelligente
  isWhatsappSame?: boolean;
  isPayoutSame?: boolean;

  // Chiffres & Activité
  partnerCode?: string;
  stats?: {
    totalShares?: number;
    totalClicks?: number;
    activeContracts?: number;
    balanceAvailableXAF?: number;
  };
}

/**
 * Valide et détecte l'opérateur d'un numéro de téléphone camerounais
 */
export function validateCameroonPhone(phoneInput: string): {
  valid: boolean;
  operator: 'ORANGE' | 'MTN' | 'AUTRE';
  formatted: string;
  error?: string;
} {
  const digitsOnly = phoneInput.replace(/[^0-9]/g, '');

  let localNumber = digitsOnly;
  if (digitsOnly.startsWith('237') && digitsOnly.length === 12) {
    localNumber = digitsOnly.substring(3);
  }

  if (localNumber.length !== 9 || !localNumber.startsWith('6')) {
    return {
      valid: false,
      operator: 'AUTRE',
      formatted: phoneInput,
      error: 'Le numéro doit comporter 9 chiffres et débuter par 6 (ex: 699 45 88 12).',
    };
  }

  // Détection de l'opérateur
  const prefix2 = localNumber.substring(0, 2);
  const prefix3 = localNumber.substring(0, 3);
  let operator: 'ORANGE' | 'MTN' | 'AUTRE' = 'AUTRE';

  if (prefix2 === '69' || (parseInt(prefix3, 10) >= 655 && parseInt(prefix3, 10) <= 659)) {
    operator = 'ORANGE';
  } else if (
    prefix2 === '67' ||
    prefix2 === '68' ||
    (parseInt(prefix3, 10) >= 650 && parseInt(prefix3, 10) <= 654)
  ) {
    operator = 'MTN';
  }

  const formatted = `+237 ${localNumber.substring(0, 3)} ${localNumber.substring(3, 5)} ${localNumber.substring(5, 7)} ${localNumber.substring(7, 9)}`;

  return {
    valid: true,
    operator,
    formatted,
  };
}

const PROFILE_CACHE_KEY = 'fct_cached_unified_profile';
let cachedUnifiedProfile: UnifiedUserProfile | null = null;

export function getCachedUserProfile(): UnifiedUserProfile | null {
  if (cachedUnifiedProfile) return cachedUnifiedProfile;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      if (raw) {
        cachedUnifiedProfile = JSON.parse(raw);
        return cachedUnifiedProfile;
      }
    } catch {
      // ignore JSON errors
    }
  }
  return null;
}

export function setCachedUserProfile(profile: UnifiedUserProfile | null) {
  cachedUnifiedProfile = profile;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (profile) {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(PROFILE_CACHE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }
}

/**
 * Récupère le profil unifié depuis Firestore
 */
export async function getUserProfile(
  userId: string,
  accountType: UserAccountType
): Promise<UnifiedUserProfile | null> {
  if (!userId) return null;

  try {
    const colName = accountType === 'PARTNER' ? 'partners' : 'customers';
    let ref = doc(firestore, colName, userId);
    let snap = await getDocLocalFirst(ref);

    if ((!snap || !snap.exists()) && accountType === 'CLIENT') {
      // Fallback si enregistré sous la collection legacy 'clients'
      ref = doc(firestore, 'clients', userId);
      snap = await getDocLocalFirst(ref);
    }

    if (!snap || !snap.exists()) {
      return null;
    }

    const data = snap.data();
    const result: UnifiedUserProfile = {
      id: snap.id,
      accountType,
      fullName: data.fullName || '',
      email: data.email || '',
      phone: data.phone || '',
      whatsappPhone: data.whatsappPhone || data.phone || '',
      city: data.city || 'Douala',
      address: data.address || '',
      idCardNumber: data.idCardNumber || '',
      payoutMethod: data.payoutMethod || 'ORANGE_MONEY',
      payoutPhone: data.payoutPhone || data.phone || '',
      payoutAccountName: data.payoutAccountName || data.fullName || '',
      partnerCode: data.partnerCode || '',
      stats: data.stats || {},
    };
    setCachedUserProfile(result);
    return result;
  } catch (err) {
    console.error('[FCT Profile] Erreur récupération profil :', err);
    return null;
  }
}

/**
 * Met à jour le profil dans Firestore
 */
export async function saveUserProfile(
  profile: UnifiedUserProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    const colName = profile.accountType === 'PARTNER' ? 'partners' : 'customers';
    const ref = doc(firestore, colName, profile.id);

    const cleanPhone = profile.phone.trim();
    const cleanWhatsapp = (profile.isWhatsappSame ? cleanPhone : (profile.whatsappPhone || cleanPhone)).trim();
    const cleanPayout = (profile.isPayoutSame ? cleanPhone : (profile.payoutPhone || cleanPhone)).trim();

    const updatePayload: Record<string, any> = {
      fullName: profile.fullName.trim(),
      phone: cleanPhone,
      whatsappPhone: cleanWhatsapp,
      city: profile.city.trim(),
      address: (profile.address || '').trim(),
      idCardNumber: (profile.idCardNumber || '').trim(),
      payoutMethod: profile.payoutMethod,
      payoutPhone: cleanPayout,
      payoutAccountName: (profile.payoutAccountName || profile.fullName).trim(),
      isWhatsappSame: profile.isWhatsappSame !== undefined ? profile.isWhatsappSame : cleanWhatsapp === cleanPhone,
      isPayoutSame: profile.isPayoutSame !== undefined ? profile.isPayoutSame : cleanPayout === cleanPhone,
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, updatePayload, { merge: true });

    // Synchronisation croisée : si l'utilisateur existe dans l'autre collection (adhérent ⇄ client),
    // on propage immédiatement le bloc coordonnées afin d'éviter toute double saisie
    const counterpartCol = profile.accountType === 'PARTNER' ? 'customers' : 'partners';
    const counterpartRef = doc(firestore, counterpartCol, profile.id);
    const counterpartSnap = await getDocLocalFirst(counterpartRef);
    if (counterpartSnap && counterpartSnap.exists()) {
      await setDoc(
        counterpartRef,
        {
          fullName: profile.fullName.trim(),
          phone: cleanPhone,
          whatsappPhone: cleanWhatsapp,
          city: profile.city.trim(),
          address: (profile.address || '').trim(),
          payoutPhone: cleanPayout,
          payoutMethod: profile.payoutMethod,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }

    setCachedUserProfile({
      ...profile,
      phone: cleanPhone,
      whatsappPhone: cleanWhatsapp,
      payoutPhone: cleanPayout,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[FCT Profile] Erreur enregistrement profil :', err);
    return { success: false, error: err.message || 'Erreur lors de la mise à jour.' };
  }
}
