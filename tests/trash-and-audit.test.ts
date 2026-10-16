/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests Unitaires & d'Intégration
 * Corbeille Sécurisée (Garantie 30 Jours), Soft-Delete & Audit 360° Multi-Axes
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import { UserRole } from '../packages/shared-types/index.ts';

describe('FCT — Corbeille Sécurisée (30 Jours) & Soft-Delete Métier', () => {
  beforeEach(() => {
    // Réinitialiser l'acteur comme super_admin pour la préparation
    (dbStore as any).currentUser = {
      id: 'usr_superadmin',
      fullName: 'Directeur Général FCT',
      role: 'super_admin' as UserRole,
      accountStatus: 'ACTIVE',
      email: 'directeur@fct.cm',
    };
  });

  it('devrait masquer immédiatement le véhicule de la flotte active lors d’une suppression et l’archiver dans la corbeille', () => {
    // 1. Ajouter un véhicule test
    const veh = dbStore.addVehicle({
      brand: 'Toyota',
      model: 'Hilux Double Cabine',
      year: 2024,
      licensePlate: 'LT-888-HL',
      vin: 'VINTST888HL0001',
      rentalDailyRate: 75000,
      securityDepositRate: 200000,
      salePrice: 28000000,
      isForRent: true,
      isForSale: false,
      fuel: 'DIESEL',
      transmission: 'AUTOMATIQUE',
      seats: 5,
      mileage: 15000,
      acquisitionCost: 20000000,
      status: 'AVAILABLE',
      category: 'PICKUP',
      color: 'Gris Métallisé',
      currentLocation: 'Agence Bonamoussadi',
      photoUrls: [],
      nextTechnicalInspectionDate: '2027-01-01',
      insuranceExpiryDate: '2027-01-01',
    });

    expect(dbStore.getVehicles().some((v) => v.id === veh.id)).toBe(true);

    // 2. Supprimer le véhicule avec motif
    const deleted = dbStore.deleteVehicle(veh.id, 'Véhicule cédé à une filiale');
    expect(deleted).toBe(true);

    // 3. Le véhicule doit avoir disparu à 100% de la flotte active (invisible pour tous)
    expect(dbStore.getVehicles().some((v) => v.id === veh.id)).toBe(false);

    // 4. Mais il est présent dans la corbeille sécurisée avec une garantie de 30 jours
    const trashItems = dbStore.getTrashItems();
    const trashRecord = trashItems.find((t) => t.entityId === veh.id);
    expect(trashRecord).toBeDefined();
    expect(trashRecord?.entityTitle).toContain('Toyota Hilux');
    expect(trashRecord?.originalCollection).toBe('vehicles');
    expect(trashRecord?.isRestored).toBe(false);
    expect(trashRecord?.deletedByName).toBe('Directeur Général FCT');
    expect(trashRecord?.deletionReason).toBe('Véhicule cédé à une filiale');

    // Vérifier l'expiration à 30 jours (+/- 1 heure de marge)
    const diffDays =
      (new Date(trashRecord!.expiresAt).getTime() - new Date(trashRecord!.deletedAt).getTime()) /
      (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(30);

    // 5. Un log d'audit DELETE doit avoir été tracé
    const auditLogs = dbStore.getState().auditLogs;
    const deleteLog = auditLogs.find((l) => l.action === 'DELETE' && l.recordId === veh.id);
    expect(deleteLog).toBeDefined();
    expect(deleteLog?.trashId).toBe(trashRecord?.id);
  });

  it('devrait permettre à l’Administrateur de restaurer un véhicule supprimé dans sa collection active', () => {
    // 1. Créer et supprimer un véhicule
    const veh = dbStore.addVehicle({
      brand: 'Mitsubishi',
      model: 'Pajero Sport',
      year: 2023,
      licensePlate: 'LT-777-PJ',
      vin: 'VINPJ7770001',
      rentalDailyRate: 65000,
      securityDepositRate: 200000,
      salePrice: 22000000,
      isForRent: true,
      isForSale: false,
      fuel: 'DIESEL',
      transmission: 'AUTOMATIQUE',
      seats: 7,
      mileage: 25000,
      acquisitionCost: 18000000,
      status: 'AVAILABLE',
      category: 'SUV',
      color: 'Noir',
      currentLocation: 'Agence Bonamoussadi',
      photoUrls: [],
      nextTechnicalInspectionDate: '2027-01-01',
      insuranceExpiryDate: '2027-01-01',
    });

    dbStore.deleteVehicle(veh.id, 'Erreur de saisie opérateur');
    expect(dbStore.getVehicles().some((v) => v.id === veh.id)).toBe(false);

    const trashRecord = dbStore.getTrashItems().find((t) => t.entityId === veh.id);
    expect(trashRecord).toBeDefined();

    // 2. L'administrateur restaure l'élément
    const res = dbStore.restoreFromTrash(trashRecord!.id);
    expect(res.success).toBe(true);

    // 3. Le véhicule réapparaît instantanément dans la flotte active
    const restoredVeh = dbStore.getVehicles().find((v) => v.id === veh.id);
    expect(restoredVeh).toBeDefined();
    expect(restoredVeh?.licensePlate).toBe('LT-777-PJ');

    // 4. La corbeille marque l'élément comme restauré
    const updatedTrash = dbStore.getTrashItems().find((t) => t.id === trashRecord!.id);
    expect(updatedTrash?.isRestored).toBe(true);
    expect(updatedTrash?.restoredByName).toBe('Directeur Général FCT');

    // 5. Un log d'audit RESTORE est consigné
    const restoreLog = dbStore.getState().auditLogs.find((l) => l.action === 'RESTORE' && l.recordId === veh.id);
    expect(restoreLog).toBeDefined();
  });

  it('devrait refuser la restauration si effectuée par un utilisateur non-administrateur (ex: commercial ou loueur)', () => {
    // 1. Créer et archiver un client
    const customer = dbStore.addCustomer({
      fullName: 'Monsieur Paul Biya Test',
      phone: '+237 699 00 11 22',
      email: 'paul.test@fct.cm',
      type: 'INDIVIDUAL',
      address: 'Bonamoussadi',
      city: 'Douala',
    });

    dbStore.deleteCustomer(customer.id, 'Client inactif');
    const trashRecord = dbStore.getTrashItems().find((t) => t.entityId === customer.id);
    expect(trashRecord).toBeDefined();

    // 2. Simuler la connexion d'un agent de location (non admin)
    (dbStore as any).currentUser = {
      id: 'usr_rental_agent',
      fullName: 'Agent Guichet Bonamoussadi',
      role: 'rental_agent' as UserRole,
      accountStatus: 'ACTIVE',
      email: 'agent@fct.cm',
    };

    // 3. La tentative de restauration doit être rejetée avec une exception explicite
    expect(() => {
      dbStore.restoreFromTrash(trashRecord!.id);
    }).toThrow(/seuls les administrateurs FCT sont habilités/i);

    // Le client ne doit pas avoir été restauré
    expect(dbStore.getState().customers.some((c) => c.id === customer.id)).toBe(false);
  });

  it('devrait refuser la restauration si le délai de rétention de 30 jours est expiré', () => {
    // 1. Créer un client
    const customer = dbStore.addCustomer({
      fullName: 'Entreprise Dangote Douala',
      phone: '+237 677 33 44 55',
      email: 'contact@dangote-test.cm',
      type: 'COMPANY',
      address: 'Akwa',
      city: 'Douala',
    });

    dbStore.deleteCustomer(customer.id, 'Ancien compte');
    const trashRecord = dbStore.getTrashItems().find((t) => t.entityId === customer.id);
    expect(trashRecord).toBeDefined();

    // 2. Falsifier la date d'expiration pour simuler un élément vieux de 35 jours
    const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    (trashRecord as any).expiresAt = expiredDate;

    // 3. Tenter de restaurer en tant que Super Admin
    expect(() => {
      dbStore.restoreFromTrash(trashRecord!.id);
    }).toThrow(/Délai de restauration dépassé/i);
  });

  it('devrait empêcher la double restauration d’un même élément', () => {
    const customer = dbStore.addCustomer({
      fullName: 'Société Camerounaise de Transport',
      phone: '+237 690 99 88 77',
      email: 'contact@sct.cm',
      type: 'COMPANY',
      address: 'Port Autonome',
      city: 'Douala',
    });

    dbStore.deleteCustomer(customer.id, 'Test double restauration');
    const trashRecord = dbStore.getTrashItems().find((t) => t.entityId === customer.id);

    // Première restauration -> Succès
    const res1 = dbStore.restoreFromTrash(trashRecord!.id);
    expect(res1.success).toBe(true);

    // Seconde restauration -> Erreur
    expect(() => {
      dbStore.restoreFromTrash(trashRecord!.id);
    }).toThrow(/a déjà été restauré/i);
  });
});
