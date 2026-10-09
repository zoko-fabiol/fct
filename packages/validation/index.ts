/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Zod Validation Schemas
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { z } from 'zod';

// Regex pour immatriculation Cameroun (ex: LT 4589 AB ou LT-4589-AB)
export const LicensePlateRegex = /^[A-Z]{2}[-\s]?[0-9]{3,4}[-\s]?[A-Z]{1,2}$/i;
// Regex téléphone Cameroun (+237 ou 6xx xx xx xx / 2xx xx xx xx)
export const CameroonPhoneRegex = /^(\+237|237)?[26][2-9][0-9]{7}$/;

export const VehicleSchema = z.object({
  vin: z.string().min(8, 'Le VIN doit comporter au moins 8 caractères').max(20),
  licensePlate: z.string().min(5, "Plaque d'immatriculation invalide"),
  brand: z.string().min(2, 'Marque obligatoire (ex: Toyota, Mitsubishi)'),
  model: z.string().min(2, 'Modèle obligatoire (ex: Prado, Pajero)'),
  year: z.number().int().min(1995).max(new Date().getFullYear() + 1),
  category: z.enum(['SUV', 'BERLINE', '4X4', 'PICKUP', 'UTILITAIRE', 'LUXE']),
  transmission: z.enum(['AUTOMATIQUE', 'MANUELLE']),
  fuel: z.enum(['DIESEL', 'ESSENCE', 'HYBRIDE']),
  seats: z.number().int().min(2).max(60),
  mileage: z.number().int().nonnegative('Le kilométrage doit être positif'),
  acquisitionCost: z.number().int().nonnegative("Le coût d'acquisition doit être positif"),
  rentalDailyRate: z.number().int().nonnegative('Le tarif journalier doit être positif'),
  securityDepositRate: z.number().int().nonnegative('La caution doit être positive'),
  salePrice: z.number().int().nonnegative('Le prix de vente doit être positif'),
  isForRent: z.boolean(),
  isForSale: z.boolean(),
  currentLocation: z.string().min(2, 'Emplacement requis'),
  color: z.string().min(2, 'Couleur requise'),
});

export const CustomerSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  fullName: z.string().min(3, 'Nom complet requis'),
  companyName: z.string().optional(),
  phone: z.string().min(9, 'Numéro de téléphone requis (+237 6xx xx xx xx)'),
  email: z.string().email('Adresse e-mail invalide'),
  address: z.string().min(3, 'Adresse requise (ex: Bonamoussadi, Akwa)'),
  city: z.string().default('Douala'),
  idCardNumber: z.string().optional(),
  taxNumber: z.string().optional(),
});

export const RentalContractSchema = z.object({
  customerId: z.string().min(1, 'Client obligatoire'),
  vehicleId: z.string().min(1, 'Véhicule obligatoire'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de début invalide'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de fin invalide'),
  dailyRateXAF: z.number().int().positive('Le tarif journalier doit être strictement positif'),
  securityDepositXAF: z.number().int().nonnegative('La caution doit être positive ou nulle'),
  driverIncluded: z.boolean(),
  driverId: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'La date de fin ne peut pas être antérieure à la date de début',
  path: ['endDate'],
});

export const CashMovementSchema = z.object({
  sessionId: z.string().min(1, 'Une session de caisse ouverte est obligatoire'),
  type: z.enum(['INFLOW', 'OUTFLOW']),
  category: z.enum([
    'RENTAL_PAYMENT',
    'SALE_PAYMENT',
    'DEPOSIT_IN',
    'DEPOSIT_REFUND',
    'FUEL_EXPENSE',
    'MAINTENANCE_EXPENSE',
    'OFFICE_EXPENSE',
    'SALARY_ADVANCE',
    'CONTRA_REVERSAL',
    'OTHER',
  ]),
  amountXAF: z.number().int().positive('Le montant doit être supérieur à zéro'),
  receivedFromOrPaidTo: z.string().min(2, 'Bénéficiaire ou payeur obligatoire'),
  paymentMethod: z.literal('CASH'),
  justificationReceiptUrl: z.string().optional(),
  reason: z.string().optional(),
  relatedInvoiceId: z.string().optional(),
  relatedContractId: z.string().optional(),
});

export const CashSessionCloseSchema = z.object({
  sessionId: z.string().min(1),
  countedClosingBalanceXAF: z.number().int().nonnegative('Le comptage physique des espèces est obligatoire'),
  closingNotes: z.string().optional(),
});
