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
import { Vehicle } from '../packages/shared-types/index.ts';

const mockVehicle: Vehicle = {
  id: 'v_toyota_prado_2024',
  brand: 'Toyota',
  model: 'Land Cruiser Prado TX-L',
  year: 2024,
  category: 'SUV_4X4',
  fuel: 'DIESEL',
  transmission: 'AUTOMATIQUE',
  seats: 7,
  color: 'Blanc Nacré',
  licensePlate: 'LT-8841-CE',
  mileage: 18500,
  rentalDailyRate: 85000,
  sellingPrice: 42000000,
  securityDepositRate: 200000,
  isForRent: true,
  isForSale: true,
  status: 'DISPONIBLE',
  photoUrls: ['https://example.com/prado.jpg'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
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
