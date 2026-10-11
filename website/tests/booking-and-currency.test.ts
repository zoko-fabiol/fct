import { describe, it, expect } from 'vitest';
import { calculateRentalTotal, formatXAF } from '../src/utils/currency.ts';
import { bookingFormSchema, purchaseFormSchema } from '../src/utils/validation.ts';

describe('Calculs de Tarification FCT Automobile (FCFA)', () => {
  it('calcule correctement une location standard de 3 jours sans chauffeur', () => {
    const res = calculateRentalTotal(50000, '2026-11-01', '2026-11-04', false);
    expect(res.days).toBe(3);
    expect(res.vehicleTotal).toBe(150000);
    expect(res.driverTotal).toBe(0);
    expect(res.grandTotal).toBe(150000);
  });

  it('calcule correctement une location de 5 jours avec option chauffeur FCT', () => {
    const res = calculateRentalTotal(70000, '2026-11-01', '2026-11-06', true, 15000);
    expect(res.days).toBe(5);
    expect(res.vehicleTotal).toBe(350000);
    expect(res.driverTotal).toBe(75000);
    expect(res.grandTotal).toBe(425000);
  });

  it('garantit une durée minimale de 1 jour si dates identiques', () => {
    const res = calculateRentalTotal(85000, '2026-11-01', '2026-11-01', false);
    expect(res.days).toBe(1);
    expect(res.grandTotal).toBe(85000);
  });

  it('formate les montants en FCFA avec séparateur de milliers officiel', () => {
    expect(formatXAF(0)).toBe('0 FCFA');
    expect(formatXAF(150000)).toMatch(/150\s?000\sFCFA/);
    expect(formatXAF(45000000)).toMatch(/45\s?000\s?000\sFCFA/);
  });
});

describe('Validation des Formulaires Publics (Zod)', () => {
  it('valide une réservation correcte avec numéro camerounais', () => {
    const valid = {
      customerName: 'Jean-Luc Ngassa',
      customerPhone: '+237 6 99 88 77 66',
      customerEmail: 'jeanluc@example.com',
      startDate: '2026-11-10',
      endDate: '2026-11-15',
      withDriver: true,
      notes: 'Arrivée Aéroport de Douala',
    };
    const parsed = bookingFormSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejette une réservation si la date de fin précède la date de début', () => {
    const invalid = {
      customerName: 'Jean-Luc Ngassa',
      customerPhone: '+237 6 99 88 77 66',
      customerEmail: 'jeanluc@example.com',
      startDate: '2026-11-15',
      endDate: '2026-11-10',
      withDriver: false,
    };
    const parsed = bookingFormSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('valide une demande d’achat de véhicule avec financement', () => {
    const valid = {
      fullName: 'Dr. Marie Madeleine Etoa',
      phone: '+237 6 77 11 22 33',
      email: 'marie.etoa@fct.cm',
      financingNeeded: true,
      notes: 'Demande de proforma pour prêt bancaire BICEC',
    };
    const parsed = purchaseFormSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});
