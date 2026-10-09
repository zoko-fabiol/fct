/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests de Gestion & Intégration des Paramètres FCT
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import { generateDocumentNumber, hasEffectivePermission } from '../packages/business-rules/index.ts';
import { UserProfile, AgencySettings } from '../packages/shared-types/index.ts';

describe('Centre de Configuration & Paramètres FCT', () => {
  beforeEach(() => {
    // Reset state to initial known configuration
    dbStore.resetSettingsToDefaults('Test Setup Reset');
  });

  describe('1. Préservation des paramètres existants & Valeurs par défaut', () => {
    it('doit conserver l’intégralité des 18 champs d’origine de l’agence FCT', () => {
      const current = dbStore.getSettings();

      // Identité légale
      expect(current.agencyName).toBe('Franchise Conseils Trading (FCT)');
      expect(current.commercialRegistry).toBe('RC/DLA/2020/B/1458');
      expect(current.taxIdNumber).toBe('M052014587963P');
      expect(current.address).toBe('Carrefour Santa Barbara, Bonamoussadi');
      expect(current.landmark).toBe('En face de la station TotalEnergies Santa Barbara');
      expect(current.city).toBe('Douala');
      expect(current.country).toBe('Cameroun');
      expect(current.phone1).toBe('+237 699 45 88 12');
      expect(current.phone2).toBe('+237 677 32 10 99');
      expect(current.email).toBe('contact@fct-automobile.cm');
      expect(current.website).toBe('https://fct-automobile.cm');

      // Financier & numérotation
      expect(current.currency).toBe('XAF');
      expect(current.timezone).toBe('Africa/Douala');
      expect(current.taxRatePercent).toBe(19.25);
      expect(current.defaultDepositXAF).toBe(200000);
      expect(current.rentalPrefix).toBe('CTR');
      expect(current.invoicePrefix).toBe('FAC');
      expect(current.receiptPrefix).toBe('REC');
      expect(current.salePrefix).toBe('COM');
    });

    it('doit initialiser les nouveaux paramètres optionnels avec des valeurs par défaut cohérentes', () => {
      const current = dbStore.getSettings();

      expect(current.reservationPrefix).toBe('RES');
      expect(current.maintenancePrefix).toBe('MNT');
      expect(current.quotePrefix).toBe('DEV');
      expect(current.expensePrefix).toBe('DEP');
      expect(current.numberPaddingDigits).toBe(4);
      expect(current.includeYearInDocNumber).toBe(true);
      expect(current.insuranceAlertDays).toBe(30);
      expect(current.technicalInspectionAlertDays).toBe(30);
      expect(current.maintenanceAlertMileageKm).toBe(1500);
      expect(current.cloudinaryCloudName).toBe('c58pcgcp');
      expect(current.cloudinaryUploadPreset).toBe('fct_erp_unsigned');
    });
  });

  describe('2. Mise à jour réactive & Journal d’audit (Audit Trail)', () => {
    it('doit persister les modifications et enregistrer une entrée dans le journal d’audit', () => {
      const updateData: Partial<AgencySettings> = {
        taxRatePercent: 19.5,
        defaultDepositXAF: 250000,
        address: 'Bonamoussadi - Face Supermarché Santa Barbara',
      };

      const reason = 'Ajustement officiel de la caution et clarification de l’adresse';
      dbStore.updateSettings(updateData, reason);

      const updated = dbStore.getSettings();
      expect(updated.taxRatePercent).toBe(19.5);
      expect(updated.defaultDepositXAF).toBe(250000);
      expect(updated.address).toBe('Bonamoussadi - Face Supermarché Santa Barbara');

      // Vérification de l'entrée d'audit
      const state = dbStore.getState();
      const auditLog = state.auditLogs.find(
        (log) => log.action === 'UPDATE' && log.module === 'settings'
      );
      expect(auditLog).toBeDefined();
      expect(auditLog?.reason).toBe(reason);
    });

    it('doit permettre la réinitialisation d’usine des paramètres avec trace d’audit', () => {
      dbStore.updateSettings({ rentalPrefix: 'LOC-CUSTOM' });
      expect(dbStore.getSettings().rentalPrefix).toBe('LOC-CUSTOM');

      dbStore.resetSettingsToDefaults('Restauration des paramètres standard');
      expect(dbStore.getSettings().rentalPrefix).toBe('CTR');

      const state = dbStore.getState();
      const resetLog = state.auditLogs.find(
        (l) => l.action === 'UPDATE' && l.module === 'settings' && l.details?.includes('valeurs par défaut')
      );
      expect(resetLog).toBeDefined();
    });
  });

  describe('3. Numérotation atomique & Consommation par les modules', () => {
    it('doit générer les numéros de document conformément aux paramètres configurés', () => {
      // Configuration 6 chiffres avec année
      const doc1 = generateDocumentNumber('FAC', 42, 2026, 6, true);
      expect(doc1).toBe('FAC-2026-000042');

      // Configuration 4 chiffres sans année
      const doc2 = generateDocumentNumber('REC', 7, 2026, 4, false);
      expect(doc2).toBe('REC-0007');

      // Vérification de dbStore.getNextDocNumber dynamique
      dbStore.updateSettings({
        numberPaddingDigits: 5,
        includeYearInDocNumber: true,
      });

      const nextDoc = dbStore.getNextDocNumber('CTR');
      expect(nextDoc).toMatch(/^CTR-\d{4}-\d{5}$/);
    });
  });

  describe('4. Sauvegardes & Restauration Intégrale', () => {
    it('doit exporter la base de données au format JSON complet', () => {
      const dump = dbStore.exportDatabaseBackup();
      expect(typeof dump).toBe('string');
      const parsed = JSON.parse(dump);
      expect(parsed.version).toBe('2.5.0');
      expect(parsed.settings).toBeDefined();
      expect(parsed.vehicles).toBeDefined();
      expect(parsed.customers).toBeDefined();
      expect(parsed.cashMovements).toBeDefined();
    });

    it('doit valider et importer une sauvegarde JSON valide', () => {
      const dump = dbStore.exportDatabaseBackup();
      const result = dbStore.importDatabaseBackup(dump);
      expect(result.success).toBe(true);

      const state = dbStore.getState();
      const importLog = state.auditLogs.find(
        (l) => l.action === 'UPDATE' && l.module === 'settings' && l.recordId === 'database_restore'
      );
      expect(importLog).toBeDefined();
    });

    it('doit rejeter un JSON corrompu ou invalide sans détruire les données actuelles', () => {
      const corruptedJson = '{"notValidBackup": true}';
      const result = dbStore.importDatabaseBackup(corruptedJson);
      expect(result.success).toBe(false);
      // Le state reste intact
      expect(dbStore.getSettings().agencyName).toBe('Franchise Conseils Trading (FCT)');
    });
  });

  describe('5. Contrôle RBAC des permissions de paramétrage', () => {
    const superAdmin: UserProfile = {
      id: 'usr_admin',
      fullName: 'Directeur Général',
      email: 'admin@fct.cm',
      phone: '+237 699 00 00 00',
      role: 'super_admin',
      status: 'ACTIVE',
      isActive: true,
      createdAt: '2026-01-01',
    };

    const cashier: UserProfile = {
      id: 'usr_cashier',
      fullName: 'Caissière Guichet',
      email: 'cashier@fct.cm',
      phone: '+237 677 00 00 00',
      role: 'accountant_cashier',
      status: 'ACTIVE',
      isActive: true,
      createdAt: '2026-01-01',
    };

    it('doit autoriser le super_admin à modifier les paramètres FCT', () => {
      const permissions = dbStore.getState().rolePermissions;
      const canUpdate = hasEffectivePermission(superAdmin, 'settings', 'update', permissions);
      expect(canUpdate).toBe(true);
    });

    it('doit refuser la modification des paramètres aux rôles opérationnels non-admin', () => {
      const permissions = dbStore.getState().rolePermissions;
      const canUpdate = hasEffectivePermission(cashier, 'settings', 'update', permissions);
      expect(canUpdate).toBe(false);
    });
  });
});
