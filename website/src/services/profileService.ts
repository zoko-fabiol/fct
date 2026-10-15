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
    return {
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

    const updatePayload: Record<string, any> = {
      fullName: profile.fullName.trim(),
      phone: profile.phone.trim(),
      whatsappPhone: profile.whatsappPhone.trim() || profile.phone.trim(),
      city: profile.city.trim(),
      address: (profile.address || '').trim(),
      idCardNumber: (profile.idCardNumber || '').trim(),
      payoutMethod: profile.payoutMethod,
      payoutPhone: profile.payoutPhone.trim() || profile.phone.trim(),
      payoutAccountName: (profile.payoutAccountName || profile.fullName).trim(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, updatePayload, { merge: true });

    return { success: true };
  } catch (err: any) {
    console.error('[FCT Profile] Erreur enregistrement profil :', err);
    return { success: false, error: err.message || 'Erreur lors de la mise à jour.' };
  }
}
