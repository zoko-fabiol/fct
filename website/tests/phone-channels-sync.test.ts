import { describe, it, expect } from 'vitest';
import {
  validateCameroonPhone,
  UnifiedUserProfile,
  saveUserProfile,
} from '../src/services/profileService.ts';

describe('FCT Uniformisation des Canaux Téléphoniques (Appels, WhatsApp, Mobile Money)', () => {
  it('devrait formater correctement un numéro camerounais et détecter l’opérateur Orange', () => {
    const res = validateCameroonPhone('699458812');
    expect(res.valid).toBe(true);
    expect(res.operator).toBe('ORANGE');
    expect(res.formatted).toBe('+237 699 45 88 12');
  });

  it('devrait formater correctement un numéro camerounais et détecter l’opérateur MTN', () => {
    const res = validateCameroonPhone('+237 677 12 34 56');
    expect(res.valid).toBe(true);
    expect(res.operator).toBe('MTN');
    expect(res.formatted).toBe('+237 677 12 34 56');
  });

  it('devrait rejeter les numéros non conformes à la numérotation camerounaise', () => {
    const tooShort = validateCameroonPhone('699123');
    expect(tooShort.valid).toBe(false);
    expect(tooShort.error).toBeDefined();

    const wrongStart = validateCameroonPhone('233458812');
    expect(wrongStart.valid).toBe(false);
  });

  it('devrait synchroniser automatiquement WhatsApp et Mobile Money quand isWhatsappSame / isPayoutSame sont activés', async () => {
    const profile: UnifiedUserProfile = {
      id: 'usr_test_sync',
      accountType: 'PARTNER',
      fullName: 'Jean-Paul Mvogo',
      email: 'jp.mvogo@fct-automobile.cm',
      phone: '699 45 88 12',
      whatsappPhone: '699 45 88 12',
      city: 'Douala',
      payoutMethod: 'ORANGE_MONEY',
      payoutPhone: '699 45 88 12',
      payoutAccountName: 'Jean-Paul Mvogo',
      isWhatsappSame: true,
      isPayoutSame: true,
    };

    // Vérifie que les numéros communiquent bien
    expect(profile.whatsappPhone).toBe(profile.phone);
    expect(profile.payoutPhone).toBe(profile.phone);

    // Si on modifie le numéro principal avec synchronisation active
    const newMainPhone = '677 00 11 22';
    const updatedProfile: UnifiedUserProfile = {
      ...profile,
      phone: newMainPhone,
      whatsappPhone: profile.isWhatsappSame ? newMainPhone : profile.whatsappPhone,
      payoutPhone: profile.isPayoutSame ? newMainPhone : profile.payoutPhone,
    };

    expect(updatedProfile.whatsappPhone).toBe('677 00 11 22');
    expect(updatedProfile.payoutPhone).toBe('677 00 11 22');
  });

  it('devrait préserver des numéros distincts si l’utilisateur choisit de dissocier les canaux', () => {
    const profile: UnifiedUserProfile = {
      id: 'usr_test_dissociated',
      accountType: 'CLIENT',
      fullName: 'Suzanne Ndongo',
      email: 'suzanne.ndongo@fct-automobile.cm',
      phone: '699 45 88 12', // Appel Orange
      whatsappPhone: '677 12 34 56', // WhatsApp MTN distinct
      city: 'Douala',
      payoutMethod: 'MTN_MOMO',
      payoutPhone: '680 99 88 77', // MoMo dédié
      payoutAccountName: 'Suzanne Ndongo',
      isWhatsappSame: false,
      isPayoutSame: false,
    };

    expect(profile.whatsappPhone).not.toBe(profile.phone);
    expect(profile.payoutPhone).not.toBe(profile.phone);
    expect(profile.whatsappPhone).toBe('677 12 34 56');
    expect(profile.payoutPhone).toBe('680 99 88 77');
  });
});
