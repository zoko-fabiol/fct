/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Zod Schemas Validation Tests
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect } from 'vitest';
import {
  VehicleSchema,
  CustomerSchema,
  RentalContractSchema,
  CashMovementSchema,
} from '../packages/validation/index.ts';

describe('Validation des Schémas Zod Métier', () => {
  it('valide avec succès un véhicule conforme', () => {
    const validVehicle = {
      vin: 'JTEBX9FJ80K129841',
      licensePlate: 'LT-8841-CE',
      brand: 'Toyota',
      model: 'Prado TX',
      year: 2022,
      category: 'SUV',
      transmission: 'AUTOMATIQUE',
      fuel: 'DIESEL',
      seats: 7,
      mileage: 48000,
      acquisitionCost: 38000000,
      rentalDailyRate: 85000,
      securityDepositRate: 350000,
      salePrice: 42000000,
      isForRent: true,
      isForSale: true,
      currentLocation: 'Agence Bonamoussadi',
      color: 'Blanc',
    };
    const result = VehicleSchema.safeParse(validVehicle);
    expect(result.success).toBe(true);
  });

  it('rejette un véhicule avec VIN trop court ou tarifs négatifs', () => {
    const invalidVehicle = {
      vin: '1234', // trop court
      licensePlate: 'LT-1111-AA',
      brand: 'Toyota',
      model: 'Prado',
      year: 2022,
      category: 'SUV',
      transmission: 'AUTOMATIQUE',
      fuel: 'DIESEL',
      seats: 5,
      mileage: -10, // négatif
      acquisitionCost: 10000,
      rentalDailyRate: -500, // négatif
      securityDepositRate: 100,
      salePrice: 100,
      isForRent: true,
      isForSale: false,
      currentLocation: 'Douala',
      color: 'Gris',
    };
    const result = VehicleSchema.safeParse(invalidVehicle);
    expect(result.success).toBe(false);
  });

  it('rejette un contrat de location dont la date de fin est antérieure au début', () => {
    const invalidContract = {
      customerId: 'cust_1',
      vehicleId: 'veh_1',
      startDate: '2026-10-20',
      endDate: '2026-10-15', // Erreur: fin avant début
      dailyRateXAF: 85000,
      securityDepositXAF: 300000,
      driverIncluded: false,
    };
    const result = RentalContractSchema.safeParse(invalidContract);
    expect(result.success).toBe(false);
  });

  it('valide une écriture de caisse obligatoirement en espèces (CASH)', () => {
    const validMovement = {
      sessionId: 'cs_1',
      type: 'INFLOW',
      category: 'RENTAL_PAYMENT',
      amountXAF: 595000,
      receivedFromOrPaidTo: 'SOCTRAN SA',
      paymentMethod: 'CASH',
    };
    const result = CashMovementSchema.safeParse(validMovement);
    expect(result.success).toBe(true);
  });
});
