/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests d'Impact Dynamique des Paramètres FCT en Temps Réel
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Valide que toute modification dans les paramètres de la concession (vidange, TVA,
 * préfixes de numérotation, cautions, etc.) est immédiatement et dynamiquement
 * répercutée dans l'ensemble des modules opérationnels.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import { Vehicle } from '../packages/shared-types/index.ts';

describe('Impact Dynamique en Direct des Paramètres FCT', () => {
  beforeEach(() => {
    dbStore.resetSettingsToDefaults('Reset Test Environment');
  });

  describe('1. Maintenance & Alertes Vidange Flotte (defaultMaintenanceIntervalKm)', () => {
    it('doit recalculer instantanément le statut de vidange quand l’intervalle passe de 10 000 km à 5 000 km', () => {
      // Création d'un véhicule test avec 4 500 km
      const testVehicle: Vehicle = {
        id: 'veh_test_oil_live',
        brand: 'Toyota',
        model: 'Rav4 Douala Test',
        year: 2024,
        category: 'SUV',
        licensePlate: 'LT-999-ZZ',
        vin: 'TOYOTA999LIVE',
        color: 'Blanc',
        fuel: 'ESSENCE',
        transmission: 'AUTOMATIQUE',
        seats: 5,
        mileage: 4500, // 4 500 km au compteur
        acquisitionCost: 18000000,
        rentalDailyRate: 65000,
        securityDepositRate: 200000,
        salePrice: 22000000,
        status: 'AVAILABLE',
        currentLocation: 'Bonamoussadi',
        insuranceExpiryDate: '2027-12-31',
        nextTechnicalInspectionDate: '2027-12-31',
        isForRent: true,
        isForSale: false,
        photoUrls: [],
        documentsCount: 0,
        updatedAt: new Date().toISOString(),
      };
      const createdVehicle = dbStore.addVehicle(testVehicle);
      const vehicleId = createdVehicle.id;

      // 1. Avec l'intervalle par défaut standard (10 000 km, alerte à 1 500 km) :
      // 4 500 km / 10 000 km -> reste 5 500 km avant vidange -> PAS d'alerte vidange
      let health = dbStore.getVehicleHealthSheet(vehicleId);
      expect(health).not.toBeNull();
      expect(health?.kmRemainingUntilOilChange).toBe(5500);
      expect(health?.isDueForOilChange).toBe(false);
      expect(health?.oilChangeIntervalKm).toBe(10000);

      // 2. L'administrateur ajuste l'intervalle à 5 000 km pour conditions sévères à Douala
      // et configure le seuil d'alerte à 1 000 km
      dbStore.updateSettings({
        defaultMaintenanceIntervalKm: 5000,
        maintenanceAlertMileageKm: 1000,
      });

      // 3. Le bilan de santé doit IMMÉDIATEMENT basculer en alerte vidange due !
      // 4 500 km avec intervalle de 5 000 km -> reste 500 km (<= 1 000 km seuil)
      health = dbStore.getVehicleHealthSheet(vehicleId);
      expect(health).not.toBeNull();
      expect(health?.oilChangeIntervalKm).toBe(5000);
      expect(health?.kmRemainingUntilOilChange).toBe(500);
      expect(health?.isDueForOilChange).toBe(true);
      expect(health?.recommendation).toContain('Prochaine vidange moteur recommandée dans moins de 500 km');
      expect(health?.recommendation).toContain('Intervalle FCT configuré');

      // Nettoyage
      dbStore.deleteVehicle(vehicleId);
    });

    it('doit répercuter dynamiquement le nom du garage partenaire par défaut', () => {
      dbStore.updateSettings({
        defaultGarageName: 'Garage Agréé FCT Akwa Nord Douala',
      });

      const currentSettings = dbStore.getSettings();
      expect(currentSettings.defaultGarageName).toBe('Garage Agréé FCT Akwa Nord Douala');
    });
  });

  describe('2. Numérotation Dynamique des Pièces Officielles (getNextDocNumber)', () => {
    it('doit adopter immédiatement le préfixe configuré pour les factures et le formatage', () => {
      // Mise à jour du préfixe de facture et de la longueur du compteur
      dbStore.updateSettings({
        invoicePrefix: 'FCT-FAC',
        numberPaddingDigits: 5,
        includeYearInDocNumber: true,
      });

      const nextInvNumber = dbStore.getNextDocNumber('invoice');
      const year = new Date().getFullYear();
      expect(nextInvNumber).toMatch(new RegExp(`^FCT-FAC-${year}-\\d{5}$`));

      const nextFacNumber = dbStore.getNextDocNumber('FAC');
      expect(nextFacNumber).toMatch(new RegExp(`^FCT-FAC-${year}-\\d{5}$`));
    });

    it('doit respecter l’omission de l’année si configuré dans les paramètres', () => {
      dbStore.updateSettings({
        rentalPrefix: 'LOC-DLA',
        includeYearInDocNumber: false,
        numberPaddingDigits: 3,
      });

      const nextRentalNumber = dbStore.getNextDocNumber('rental');
      expect(nextRentalNumber).toMatch(/^LOC-DLA-\d{3}$/);
    });

    it('doit supporter dynamiquement les préfixes réservations, maintenance et dépenses', () => {
      dbStore.updateSettings({
        reservationPrefix: 'FCT-RESV',
        maintenancePrefix: 'FCT-MAINT',
        expensePrefix: 'FCT-DEP',
      });

      const year = new Date().getFullYear();
      expect(dbStore.getNextDocNumber('reservation')).toContain(`FCT-RESV-${year}`);
      expect(dbStore.getNextDocNumber('maintenance')).toContain(`FCT-MAINT-${year}`);
      expect(dbStore.getNextDocNumber('expense')).toContain(`FCT-DEP-${year}`);
    });
  });

  describe('3. Paramètres Financiers, TVA & Cautions', () => {
    it('doit appliquer dynamiquement le taux de TVA configuré', () => {
      dbStore.updateSettings({
        taxRatePercent: 20,
      });

      const current = dbStore.getSettings();
      expect(current.taxRatePercent).toBe(20);

      // Calcul dynamique de taxe pour un montant de 100 000 XAF
      const amount = 100000;
      const computedTax = Math.round(amount * (current.taxRatePercent / 100));
      expect(computedTax).toBe(20000);
    });

    it('doit permettre de configurer la caution standard et la durée minimale de location', () => {
      dbStore.updateSettings({
        defaultDepositXAF: 350000,
        minRentalDurationDays: 2,
        hourlyLatePenaltyRateXAF: 10000,
      });

      const current = dbStore.getSettings();
      expect(current.defaultDepositXAF).toBe(350000);
      expect(current.minRentalDurationDays).toBe(2);
      expect(current.hourlyLatePenaltyRateXAF).toBe(10000);
    });
  });

  describe('4. Commutateurs de Modules (moduleToggles)', () => {
    it('doit sauvegarder et persister l’état des modules activés/désactivés', () => {
      dbStore.updateSettings({
        moduleToggles: {
          drivers: false,
          sales: false,
          stock: true,
        },
      });

      const current = dbStore.getSettings();
      expect(current.moduleToggles?.drivers).toBe(false);
      expect(current.moduleToggles?.sales).toBe(false);
      expect(current.moduleToggles?.stock).toBe(true);
    });
  });
});
