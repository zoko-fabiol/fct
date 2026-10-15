/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests Unitaires Système Partenaires & Affiliation
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect } from 'vitest';
import {
  generateAffiliateUrl,
  generateShareCopyText,
  calculatePartnerCommission,
} from '../website/src/services/partnerService.ts';
import {
  getSharesInLast30Days,
  evaluatePartnerTier,
  PARTNER_TIER_CONFIG,
} from '../packages/business-rules/index.ts';
import { Vehicle } from '../website/src/types/index.ts';

const mockVehicle: Vehicle = {
  id: 'v_toyota_prado_2024',
  brand: 'Toyota',
  model: 'Land Cruiser Prado TX-L',
  year: 2024,
  category: 'SUV',
  fuel: 'DIESEL',
  transmission: 'AUTOMATIQUE',
  seats: 7,
  color: 'Blanc Nacré',
  licensePlate: 'LT-8841-CE',
  mileage: 18500,
  rentalDailyRate: 85000,
  salePrice: 42000000,
  securityDepositRate: 200000,
  isForRent: true,
  isForSale: true,
  status: 'AVAILABLE',
  currentLocation: 'Douala (Akwa)',
  description: 'Toyota Land Cruiser Prado TX-L état neuf',
  features: ['Climatisation', '4x4 Permanent', 'GPS'],
  photoUrls: ['https://example.com/prado.jpg'],
};

describe('Système Partenaires & Affiliation FCT Automobile', () => {
  it('devrait générer une URL affiliée valide avec le code partenaire', () => {
    const url = generateAffiliateUrl(mockVehicle.id, 'FCT-FABIOL-77');
    expect(url).toContain('ref=FCT-FABIOL-77');
    expect(url).toContain(`showroom/${mockVehicle.id}`);
  });

  it('devrait générer un texte de partage enrichi pour la location sur WhatsApp', () => {
    const affiliateUrl = generateAffiliateUrl(mockVehicle.id, 'FCT-FABIOL-77');
    const text = generateShareCopyText(mockVehicle, affiliateUrl, true);

    expect(text).toContain('Toyota Land Cruiser Prado TX-L (2024)');
    expect(text).toContain('85'); // Tarif journalier présent
    expect(text).toContain('FCT-FABIOL-77');
    expect(text).toContain('Douala');
  });

  it('devrait générer un texte de partage pour la vente de véhicule', () => {
    const affiliateUrl = generateAffiliateUrl(mockVehicle.id, 'FCT-FABIOL-77');
    const text = generateShareCopyText(mockVehicle, affiliateUrl, false);

    expect(text).toContain('À VENDRE');
    expect(text).toContain('Toyota Land Cruiser Prado TX-L');
    expect(text).toContain('42'); // Prix de vente
    expect(text).toContain(affiliateUrl);
  });

  it('devrait calculer la commission de location (ex: 5% sur 85 000 FCFA/jour pour 3 jours)', () => {
    const totalRental = 85000 * 3; // 255 000 FCFA
    const commission = calculatePartnerCommission('RENTAL', totalRental, 5, 100000);
    expect(commission).toBe(12750); // 5% de 255 000 FCFA
  });

  it('devrait attribuer le forfait de commission vente par défaut (100 000 FCFA)', () => {
    const vehiclePrice = 42000000;
    const commission = calculatePartnerCommission('SALE', vehiclePrice, 5, 100000);
    expect(commission).toBe(100000); // Forfait vente FCT
  });

  it('devrait respecter un montant forfaitaire personnalisé de vente', () => {
    const vehiclePrice = 35000000;
    const commission = calculatePartnerCommission('SALE', vehiclePrice, 5, 150000);
    expect(commission).toBe(150000);
  });
});

describe('FCT Système Partenaires - Quotas 30 jours et Maintien / Chute de Rang', () => {
  const refDate = new Date('2026-10-15T12:00:00Z');

  it('devrait calculer correctement le nombre de partages sur les 30 derniers jours', () => {
    const dailyShares: Record<string, number> = {
      '2026-10-15': 3, // aujourd'hui
      '2026-10-05': 5, // 10 jours avant
      '2026-09-20': 4, // 25 jours avant (inclus dans 30j)
      '2026-09-01': 10, // 44 jours avant (exclu du rolling 30j)
      '2026-08-01': 20, // exclu
    };

    const count30d = getSharesInLast30Days(dailyShares, refDate);
    expect(count30d).toBe(3 + 5 + 4); // 12 partages dans la fenêtre
  });

  it('devrait retourner 0 partages si aucun historique récent', () => {
    expect(getSharesInLast30Days(undefined, refDate)).toBe(0);
    expect(getSharesInLast30Days({}, refDate)).toBe(0);
  });

  it('devrait maintenir GOLD si le quota minimum de 25 partages/30j est atteint', () => {
    const dailyShares = { '2026-10-10': 25 };
    const res = evaluatePartnerTier('GOLD', dailyShares, refDate);
    expect(res.newTier).toBe('GOLD');
    expect(res.status).toBe('MAINTAINED');
    expect(res.quotaMet).toBe(true);
    expect(res.sharesLast30Days).toBe(25);
  });

  it('devrait rétrograder GOLD vers SILVER (chute progressive d\'1 niveau) si partages < 25', () => {
    const dailyShares = { '2026-10-10': 24 };
    const res = evaluatePartnerTier('GOLD', dailyShares, refDate);
    expect(res.newTier).toBe('SILVER');
    expect(res.status).toBe('DEMOTED');
    expect(res.quotaMet).toBe(false);
  });

  it('devrait maintenir SILVER si le quota minimum de 10 partages/30j est atteint', () => {
    const dailyShares = { '2026-10-10': 15 };
    const res = evaluatePartnerTier('SILVER', dailyShares, refDate);
    expect(res.newTier).toBe('SILVER');
    expect(res.status).toBe('MAINTAINED');
    expect(res.quotaMet).toBe(true);
  });

  it('devrait rétrograder SILVER vers BRONZE si partages < 10', () => {
    const dailyShares = { '2026-10-10': 8 };
    const res = evaluatePartnerTier('SILVER', dailyShares, refDate);
    expect(res.newTier).toBe('BRONZE');
    expect(res.status).toBe('DEMOTED');
    expect(res.quotaMet).toBe(false);
  });

  it('ne devrait jamais faire chuter en-dessous de BRONZE (palier de base)', () => {
    const dailyShares = {};
    const res = evaluatePartnerTier('BRONZE', dailyShares, refDate);
    expect(res.newTier).toBe('BRONZE');
    expect(res.status).toBe('MAINTAINED');
    expect(res.quotaMet).toBe(true);
  });

  it('devrait promouvoir automatiquement BRONZE vers SILVER à 10 partages', () => {
    const dailyShares = { '2026-10-12': 10 };
    const res = evaluatePartnerTier('BRONZE', dailyShares, refDate);
    expect(res.newTier).toBe('SILVER');
    expect(res.status).toBe('PROMOTED');
  });

  it('devrait promouvoir automatiquement vers GOLD à 25 partages', () => {
    const dailyShares = { '2026-10-12': 28 };
    const res = evaluatePartnerTier('BRONZE', dailyShares, refDate);
    expect(res.newTier).toBe('GOLD');
    expect(res.status).toBe('PROMOTED');
  });
});

