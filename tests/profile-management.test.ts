import { describe, it, expect } from 'vitest';
import { validateCameroonPhone, UnifiedUserProfile } from '../website/src/services/profileService.ts';

describe('Profile Management & Mobile Money Validation (Douala, Cameroun)', () => {
  describe('Cameroon Phone & Operator Detection', () => {
    it('identifies Orange Cameroon numbers starting with 69x and 655-659', () => {
      const res1 = validateCameroonPhone('699123456');
      expect(res1.valid).toBe(true);
      expect(res1.operator).toBe('ORANGE');
      expect(res1.formatted).toBe('+237 699 12 34 56');

      const res2 = validateCameroonPhone('+237 656 88 99 00');
      expect(res2.valid).toBe(true);
      expect(res2.operator).toBe('ORANGE');
    });

    it('identifies MTN Cameroon numbers starting with 67x, 68x and 650-654', () => {
      const res1 = validateCameroonPhone('677987654');
      expect(res1.valid).toBe(true);
      expect(res1.operator).toBe('MTN');
      expect(res1.formatted).toBe('+237 677 98 76 54');

      const res2 = validateCameroonPhone('651234567');
      expect(res2.valid).toBe(true);
      expect(res2.operator).toBe('MTN');
    });

    it('rejects invalid or international non-Cameroon phone numbers', () => {
      const res1 = validateCameroonPhone('123456');
      expect(res1.valid).toBe(false);

      const res2 = validateCameroonPhone('799123456');
      expect(res2.valid).toBe(false);
    });
  });

  describe('Unified User Profile Structure', () => {
    it('validates profile model with mobile money without PIN constraint', () => {
      const profile: UnifiedUserProfile = {
        id: 'usr_test_123',
        accountType: 'CLIENT',
        fullName: 'Jean Dupont',
        email: 'jean.dupont@gmail.com',
        phone: '699123456',
        whatsappPhone: '699123456',
        city: 'Douala',
        payoutMethod: 'ORANGE_MONEY',
        payoutPhone: '699123456',
        payoutAccountName: 'Jean Dupont',
      };

      expect(profile.fullName).toBe('Jean Dupont');
      expect(profile.payoutMethod).toBe('ORANGE_MONEY');
      expect(profile.city).toBe('Douala');
    });
  });
});
