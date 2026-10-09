/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Automated Unit & Invariants Test Suite
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect } from 'vitest';
import {
  formatXAF,
  calculateRentalDays,
  checkVehicleAvailability,
  validateVehicleOperationalState,
  hasPermission,
  generateDocumentNumber,
} from '../packages/business-rules/index.ts';
import { Vehicle, RentalContract } from '../packages/shared-types/index.ts';

describe('Règles Métier Financières & Dates (XAF & Africa/Douala)', () => {
  it('formate correctement les montants entiers en Francs CFA (XAF)', () => {
    expect(formatXAF(150000)).toMatch(/150\s?000\sFCFA/);
    expect(formatXAF(0)).toBe('0 FCFA');
    expect(formatXAF(25000000)).toMatch(/25\s?000\s?000\sFCFA/);
  });

  it('calcule la durée de location avec minimum garanti de 1 jour', () => {
    expect(calculateRentalDays('2026-10-10', '2026-10-15')).toBe(5);
    expect(calculateRentalDays('2026-10-10', '2026-10-10')).toBe(1);
  });

  it('génère un numéro séquentiel certifié selon les normes FCT', () => {
    expect(generateDocumentNumber('CTR', 34, 2026)).toBe('CTR-2026-0034');
    expect(generateDocumentNumber('FAC', 105, 2026)).toBe('FAC-2026-0105');
    expect(generateDocumentNumber('REC', 245, 2026)).toBe('REC-2026-0245');
  });
});

describe('Invariants de Disponibilité et Incompatibilité Flotte', () => {
  const existingContracts: RentalContract[] = [
    {
      id: 'ctr_existing',
      contractNumber: 'CTR-2026-0001',
      customerId: 'cust_1',
      customerName: 'Client Test',
      vehicleId: 'veh_prado',
      vehicleName: 'Toyota Prado',
      licensePlate: 'LT-8841-CE',
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      dailyRateXAF: 85000,
      totalDays: 5,
      totalAmountXAF: 425000,
      securityDepositXAF: 300000,
      depositReturnedXAF: 0,
      paidAmountXAF: 425000,
      remainingAmountXAF: 0,
      driverIncluded: false,
      status: 'ACTIVE',
      penaltiesXAF: 0,
      createdById: 'usr_admin',
      createdAt: '2026-10-09',
      updatedAt: '2026-10-09',
    },
  ];

  it('détecte et refuse les chevauchements de dates pour un même véhicule', () => {
    // Période chevauchant le contrat existant (10 au 15 octobre)
    const check1 = checkVehicleAvailability('veh_prado', '2026-10-12', '2026-10-18', existingContracts);
    expect(check1.isAvailable).toBe(false);
    expect(check1.conflictReason).toContain('Conflit détecté');

    // Période libre après le 15 octobre
    const check2 = checkVehicleAvailability('veh_prado', '2026-10-16', '2026-10-20', existingContracts);
    expect(check2.isAvailable).toBe(true);
  });

  it('bloque la location ou la vente d’un véhicule en maintenance ou déjà vendu', () => {
    const vehMnt: Vehicle = {
      id: 'v_mnt',
      vin: '12345678901234567',
      licensePlate: 'LT-1111-AA',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      category: 'BERLINE',
      transmission: 'AUTOMATIQUE',
      fuel: 'ESSENCE',
      seats: 5,
      mileage: 20000,
      acquisitionCost: 15000000,
      rentalDailyRate: 40000,
      securityDepositRate: 150000,
      salePrice: 16000000,
      isForRent: true,
      isForSale: true,
      status: 'MAINTENANCE',
      currentLocation: 'Garage CFAO',
      color: 'Gris',
      photoUrls: [],
      documentsCount: 2,
      nextTechnicalInspectionDate: '2027-01-01',
      insuranceExpiryDate: '2027-01-01',
      updatedAt: '2026-10-09',
    };

    const resMnt = validateVehicleOperationalState(vehMnt, 'RENTAL');
    expect(resMnt.allowed).toBe(false);
    expect(resMnt.reason).toContain('immobilisé pour maintenance');

    const vehSold: Vehicle = { ...vehMnt, status: 'SOLD' };
    const resSold = validateVehicleOperationalState(vehSold, 'SALE');
    expect(resSold.allowed).toBe(false);
    expect(resSold.reason).toContain('déjà été vendu');
  });
});

describe('Matrice de Contrôle RBAC Granulaire', () => {
  it('accorde les permissions d’administration au super_admin', () => {
    expect(hasPermission('super_admin', 'cash', 'create')).toBe(true);
    expect(hasPermission('super_admin', 'vehicles', 'delete')).toBe(true);
    expect(hasPermission('super_admin', 'users', 'update')).toBe(true);
  });

  it('interdit l’accès aux mouvements de caisse pour un gestionnaire de flotte ou un chauffeur', () => {
    expect(hasPermission('fleet_manager', 'cash', 'create')).toBe(false);
    expect(hasPermission('driver', 'cash', 'create')).toBe(false);
    expect(hasPermission('driver', 'billing', 'delete')).toBe(false);
  });

  it('autorise le caissier à créer et approuver les écritures de caisse', () => {
    expect(hasPermission('accountant_cashier', 'cash', 'create')).toBe(true);
    expect(hasPermission('accountant_cashier', 'cash', 'approve')).toBe(true);
  });
});
