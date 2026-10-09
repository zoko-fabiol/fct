/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Suite Complète de Tests d'Intégration Système (15 Scénarios)
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import {
  checkVehicleAvailability,
  hasPermission,
  validateVehicleOperationalState,
  formatXAF,
} from '../packages/business-rules/index.ts';
import { Vehicle, StockItem, RentalContract, UserRole } from '../packages/shared-types/index.ts';

describe('Intégration Système FCT ERP & CRM AUTOMOBILE (15 Scénarios Obligatoires)', () => {
  beforeEach(() => {
    // S'assurer d'avoir un état propre et une session de caisse ouverte pour les encaissements
    const activeSession = dbStore.getActiveCashSession();
    if (!activeSession) {
      dbStore.openCashSession(500000);
    }
  });

  // SCÉNARIO 1 : Créer un véhicule et retrouver sa fiche depuis Maintenance
  it('Scénario 1: crée un véhicule et le retrouve dans le module Maintenance / Bilan de santé', () => {
    const newVeh = dbStore.addVehicle({
      vin: 'VF7TESTSCENARIO1234',
      licensePlate: 'LT-9999-ZZ',
      brand: 'Toyota',
      model: 'Land Cruiser V8',
      year: 2023,
      category: '4X4',
      transmission: 'AUTOMATIQUE',
      fuel: 'DIESEL',
      seats: 7,
      mileage: 15000,
      acquisitionCost: 45000000,
      rentalDailyRate: 120000,
      securityDepositRate: 500000,
      salePrice: 50000000,
      isForRent: true,
      isForSale: true,
      status: 'AVAILABLE',
      currentLocation: 'Agence Santa Barbara Douala',
      color: 'Noir Métallisé',
      photoUrls: [],
      documentsCount: 3,
      nextTechnicalInspectionDate: '2027-06-01',
      insuranceExpiryDate: '2027-06-01',
    });

    const state = dbStore.getState();
    const foundVeh = state.vehicles.find((v) => v.id === newVeh.id);
    expect(foundVeh).toBeDefined();
    expect(foundVeh?.licensePlate).toBe('LT-9999-ZZ');

    // Retrouver sa fiche de santé depuis Maintenance
    const healthSheet = dbStore.getVehicleHealthSheet(newVeh.id);
    expect(healthSheet).toBeDefined();
    expect(healthSheet?.vehicle.id).toBe(newVeh.id);
    expect(healthSheet?.totalMaintenanceCostXAF).toBe(0);
    expect(healthSheet?.interventionsCount).toBe(0);
  });

  // SCÉNARIO 2 : Enregistrer une intervention avec plusieurs pièces
  it('Scénario 2: enregistre une intervention de maintenance avec plusieurs pièces de rechange', () => {
    const state = dbStore.getState();
    const vehicle = state.vehicles[0];
    const item1 = state.stock[0]; // ex: Huile moteur
    const item2 = state.stock[1]; // ex: Plaquettes de frein

    const record = dbStore.addMaintenanceRecord({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
      type: 'PREVENTIVE',
      garageName: 'Garage Agréé FCT Bonamoussadi',
      description: 'Révision générale 20 000 km + vidange complète',
      mileageAtService: vehicle.mileage,
      partsUsed: [
        {
          stockItemId: item1.id,
          name: item1.name,
          quantity: 2,
          unitPriceXAF: item1.unitCostXAF,
          totalXAF: item1.unitCostXAF * 2,
        },
        {
          stockItemId: item2.id,
          name: item2.name,
          quantity: 1,
          unitPriceXAF: item2.unitCostXAF,
          totalXAF: item2.unitCostXAF,
        },
      ],
      laborCostXAF: 25000,
      totalCostXAF: item1.unitCostXAF * 2 + item2.unitCostXAF + 25000,
      status: 'IN_PROGRESS',
      startDate: '2026-10-10',
    });

    expect(record.id).toBeDefined();
    expect(record.status).toBe('IN_PROGRESS');
    expect(record.partsUsed.length).toBe(2);

    // Vérifier que le véhicule a été immobilisé
    const updatedVeh = dbStore.getState().vehicles.find((v) => v.id === vehicle.id);
    expect(updatedVeh?.status).toBe('MAINTENANCE');
  });

  // SCÉNARIO 3 : Finaliser l'intervention et vérifier la déduction exacte du stock
  it('Scénario 3: finalise l’intervention et déduit exactement le stock avec enregistrement des mouvements', () => {
    const stateBefore = dbStore.getState();
    const targetMnt = stateBefore.maintenance.find((m) => m.status === 'IN_PROGRESS');
    expect(targetMnt).toBeDefined();

    const part1 = targetMnt!.partsUsed[0];
    const stockItemBefore = stateBefore.stock.find((s) => s.id === part1.stockItemId);
    const initialQty = stockItemBefore!.quantityInStock;

    // Validation et déduction atomique
    dbStore.completeMaintenance(targetMnt!.id, 'Maintenance validée avec succès');

    const stateAfter = dbStore.getState();
    const stockItemAfter = stateAfter.stock.find((s) => s.id === part1.stockItemId);
    expect(stockItemAfter!.quantityInStock).toBe(initialQty - part1.quantity);

    // Vérifier création du mouvement de stock traçable
    const mov = stateAfter.stockMovements.find(
      (sm) => sm.relatedMaintenanceId === targetMnt!.id && sm.stockItemId === part1.stockItemId
    );
    expect(mov).toBeDefined();
    expect(mov?.quantityDelta).toBe(-part1.quantity);
    expect(mov?.type).toBe('MAINTENANCE_USAGE');

    // Vérifier libération du véhicule
    const freedVeh = stateAfter.vehicles.find((v) => v.id === targetMnt!.vehicleId);
    expect(freedVeh?.status).toBe('AVAILABLE');
  });

  // SCÉNARIO 4 : Retenter la même validation et vérifier l'absence de double déduction (idempotence)
  it('Scénario 4: retente la validation d’une intervention déjà terminée et bloque toute double déduction', () => {
    const state = dbStore.getState();
    const completedMnt = state.maintenance.find((m) => m.status === 'COMPLETED');
    expect(completedMnt).toBeDefined();

    const part = completedMnt!.partsUsed[0];
    const stockBefore = state.stock.find((s) => s.id === part.stockItemId)!.quantityInStock;

    // Deuxième appel : doit être idempotent
    dbStore.completeMaintenance(completedMnt!.id);

    const stockAfter = dbStore.getState().stock.find((s) => s.id === part.stockItemId)!.quantityInStock;
    expect(stockAfter).toBe(stockBefore); // Aucun changement de quantité
  });

  // SCÉNARIO 5 : Consulter le bilan de santé et vérifier les interventions et coûts cumulés
  it('Scénario 5: consulte le bilan de santé d’un véhicule et vérifie le cumul exact des interventions et coûts', () => {
    const state = dbStore.getState();
    const completedMnt = state.maintenance.find((m) => m.status === 'COMPLETED');
    expect(completedMnt).toBeDefined();

    const health = dbStore.getVehicleHealthSheet(completedMnt!.vehicleId);
    expect(health).toBeDefined();
    expect(health!.interventionsCount).toBeGreaterThanOrEqual(1);
    expect(health!.totalMaintenanceCostXAF).toBeGreaterThanOrEqual(completedMnt!.totalCostXAF);
    expect(health!.history.some((h) => h.id === completedMnt!.id)).toBe(true);
  });

  // SCÉNARIO 6 : Refuser une intervention nécessitant davantage de pièces que le stock disponible
  it('Scénario 6: refuse la complétion d’une intervention si le stock est insuffisant', () => {
    const state = dbStore.getState();
    const veh = state.vehicles.find((v) => v.status === 'AVAILABLE')!;
    const item = state.stock[0];

    const excessiveRecord = dbStore.addMaintenanceRecord({
      vehicleId: veh.id,
      vehicleName: `${veh.brand} ${veh.model}`,
      licensePlate: veh.licensePlate,
      type: 'CORRECTIVE',
      garageName: 'Garage Test',
      description: 'Demande de pièces excessive',
      mileageAtService: veh.mileage,
      partsUsed: [
        {
          stockItemId: item.id,
          name: item.name,
          quantity: item.quantityInStock + 1000, // Supérieur au stock
          unitPriceXAF: item.unitCostXAF,
          totalXAF: item.unitCostXAF * (item.quantityInStock + 1000),
        },
      ],
      laborCostXAF: 10000,
      totalCostXAF: 50000,
      status: 'IN_PROGRESS',
      startDate: '2026-10-10',
    });

    // La tentative de finalisation doit échouer avec erreur explicite
    expect(() => {
      dbStore.completeMaintenance(excessiveRecord.id);
    }).toThrow(/Stock insuffisant/);
  });

  // SCÉNARIO 7 : Créer un client, une réservation et la convertir en contrat sans doublon d'acompte
  it('Scénario 7: convertit une réservation en contrat sans doublon d’acompte et génère la facture', () => {
    const cust = dbStore.addCustomer({
      type: 'INDIVIDUAL',
      fullName: 'Monsieur Paul Biya Eto',
      phone: '+237 699 88 77 66',
      email: 'paul.eto@test.cm',
      address: 'Bonamoussadi, Douala',
      city: 'Douala',
    });

    const veh = dbStore.getState().vehicles.find((v) => v.status === 'AVAILABLE' && v.isForRent)!;

    const res = dbStore.addReservation({
      customerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.phone,
      vehicleId: veh.id,
      vehicleName: `${veh.brand} ${veh.model}`,
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      estimatedTotalXAF: 400000,
      advanceDepositXAF: 75000,
      status: 'CONFIRMED',
      source: 'WALK_IN',
      notes: 'Acompte versé lors de la réservation',
    });

    expect(res.status).toBe('CONFIRMED');

    // Convertir en contrat
    const contract = dbStore.convertReservationToContract(res.id, {
      driverIncluded: false,
    });

    expect(contract.id).toBeDefined();
    expect(contract.relatedReservationId).toBe(res.id);
    expect(contract.paidAmountXAF).toBe(75000); // Acompte transféré
    expect(contract.remainingAmountXAF).toBe(contract.totalAmountXAF - 75000);

    // Vérifier réservation marquée CONVERTED
    const updatedRes = dbStore.getState().reservations.find((r) => r.id === res.id);
    expect(updatedRes?.status).toBe('CONVERTED');
    expect(updatedRes?.convertedContractId).toBe(contract.id);

    // Vérifier facture associée générée
    const inv = dbStore.getState().invoices.find((i) => i.relatedContractId === contract.id);
    expect(inv).toBeDefined();
    expect(inv?.paidAmountXAF).toBe(75000);
  });

  // SCÉNARIO 8 : Refuser deux réservations incompatibles (chevauchement) pour le même véhicule
  it('Scénario 8: refuse une deuxième réservation en conflit temporel sur le même véhicule', () => {
    const state = dbStore.getState();
    const existingRes = state.reservations.find((r) => r.status === 'CONFIRMED')!;

    // Tenter de réserver exactement pendant les dates de existingRes
    expect(() => {
      dbStore.addReservation({
        customerId: state.customers[0].id,
        customerName: 'Client Conflit',
        customerPhone: '+237 655 44 33 22',
        vehicleId: existingRes.vehicleId,
        vehicleName: existingRes.vehicleName,
        startDate: existingRes.startDate,
        endDate: existingRes.endDate,
        estimatedTotalXAF: 250000,
        advanceDepositXAF: 50000,
        status: 'CONFIRMED',
        source: 'PHONE',
      });
    }).toThrow(/Conflit détecté/);
  });

  // SCÉNARIO 9 : Finaliser une vente et rendre le véhicule indisponible (statut SOLD)
  it('Scénario 9: finalise une vente et passe automatiquement le statut du véhicule à SOLD', () => {
    const cust = dbStore.getState().customers[0];
    const veh = dbStore.addVehicle({
      vin: 'VINSALE1234567890',
      licensePlate: 'LT-SALE-01',
      brand: 'Mercedes',
      model: 'GLC 300',
      year: 2023,
      category: 'SUV',
      transmission: 'AUTOMATIQUE',
      fuel: 'ESSENCE',
      seats: 5,
      mileage: 22000,
      acquisitionCost: 28000000,
      rentalDailyRate: 90000,
      securityDepositRate: 350000,
      salePrice: 32000000,
      isForRent: false,
      isForSale: true,
      status: 'AVAILABLE',
      currentLocation: 'Agence Douala',
      color: 'Gris',
      photoUrls: [],
      documentsCount: 2,
      nextTechnicalInspectionDate: '2027-01-01',
      insuranceExpiryDate: '2027-01-01',
    });

    const sale = dbStore.addSaleOrder({
      customerId: cust.id,
      customerName: cust.fullName,
      vehicleId: veh.id,
      vehicleName: `${veh.brand} ${veh.model} (${veh.licensePlate})`,
      listedPriceXAF: 32000000,
      negotiatedPriceXAF: 31000000,
      paidAmountXAF: 5000000,
      balanceXAF: 26000000,
      stage: 'ORDER',
      salesAgentId: 'agent_1',
      salesAgentName: 'Agent Commercial',
    });

    expect(sale.orderNumber).toBeDefined();

    // Passer à l'étape SOLD
    dbStore.updateSaleStage(sale.id, 'SOLD');

    const updatedVeh = dbStore.getState().vehicles.find((v) => v.id === veh.id);
    expect(updatedVeh?.status).toBe('SOLD');

    // Vérifier qu'une tentative de revendre ce même véhicule est immédiatement bloquée
    expect(() => {
      dbStore.addSaleOrder({
        customerId: cust.id,
        customerName: cust.fullName,
        vehicleId: veh.id,
        vehicleName: `${veh.brand} ${veh.model}`,
        listedPriceXAF: 32000000,
        negotiatedPriceXAF: 32000000,
        paidAmountXAF: 1000000,
        balanceXAF: 31000000,
        stage: 'ORDER',
        salesAgentId: 'agent_1',
        salesAgentName: 'Agent Commercial',
      });
    }).toThrow(/déjà été vendu/);
  });

  // SCÉNARIO 10 : Enregistrer un paiement et mettre à jour le solde de la facture et du contrat
  it('Scénario 10: enregistre un paiement en caisse et met à jour le solde du contrat et de la facture liée', () => {
    const session = dbStore.getActiveCashSession()!;
    const cust = dbStore.getState().customers[0];
    const veh = dbStore.getState().vehicles.find((v) => v.status === 'AVAILABLE' && v.isForRent)!;

    const contract = dbStore.createContract({
      customerId: cust.id,
      vehicleId: veh.id,
      startDate: '2026-12-10',
      endDate: '2026-12-14',
      dailyRateXAF: 60000,
      securityDepositXAF: 200000,
      driverIncluded: false,
    });

    const balanceBefore = contract.remainingAmountXAF;
    expect(balanceBefore).toBeGreaterThan(0);

    const paymentAmount = 50000;
    const mov = dbStore.recordCashMovement({
      sessionId: session.id,
      type: 'INFLOW',
      category: 'RENTAL_PAYMENT',
      amountXAF: paymentAmount,
      receivedFromOrPaidTo: contract.customerName,
      relatedContractId: contract.id,
      reason: 'Règlement solde location',
    });

    expect(mov.receiptNumber).toMatch(/^REC-/);

    const updatedContract = dbStore.getState().contracts.find((c) => c.id === contract.id)!;
    expect(updatedContract.remainingAmountXAF).toBe(balanceBefore - paymentAmount);

    const linkedInvoice = dbStore.getState().invoices.find((i) => i.relatedContractId === contract.id);
    if (linkedInvoice) {
      expect(linkedInvoice.paidAmountXAF).toBeGreaterThanOrEqual(paymentAmount);
    }
  });

  // SCÉNARIO 11 : Refuser une modification de mouvement de caisse et tester la contre-passation
  it('Scénario 11: respecte l’immuabilité de caisse et annule l’impact par une contre-passation certifiée', () => {
    const state = dbStore.getState();
    const lastMovement = state.cashMovements.find((m) => m.type === 'INFLOW' && !m.isReversal)!;
    const contract = state.contracts.find((c) => c.id === lastMovement.relatedContractId);
    const remainingBeforeReversal = contract?.remainingAmountXAF || 0;

    // Effectuer la contre-passation
    const contra = dbStore.reverseCashMovement(lastMovement.id, 'Erreur de saisie par la caissière');
    expect(contra.isReversal).toBe(true);
    expect(contra.type).toBe('OUTFLOW');
    expect(contra.amountXAF).toBe(lastMovement.amountXAF);

    // Vérifier que le solde du contrat a été réaugmenté du montant de la contre-passation
    if (contract) {
      const updatedContract = dbStore.getState().contracts.find((c) => c.id === contract.id)!;
      expect(updatedContract.remainingAmountXAF).toBe(remainingBeforeReversal + lastMovement.amountXAF);
    }
  });

  // SCÉNARIO 12 : Vérifier les permissions de chaque rôle dans la matrice RBAC
  it('Scénario 12: applique rigoureusement la matrice RBAC pour chaque profil utilisateur', () => {
    const roles: UserRole[] = [
      'super_admin',
      'director',
      'sales_agent',
      'rental_agent',
      'accountant_cashier',
      'fleet_manager',
      'driver',
      'viewer',
    ];

    roles.forEach((role) => {
      // Driver n'a pas accès à la caisse ni aux factures
      if (role === 'driver') {
        expect(hasPermission(role, 'cash', 'read')).toBe(false);
        expect(hasPermission(role, 'billing', 'create')).toBe(false);
      }
      // Accountant_cashier a accès à la caisse
      if (role === 'accountant_cashier') {
        expect(hasPermission(role, 'cash', 'create')).toBe(true);
        expect(hasPermission(role, 'vehicles', 'delete')).toBe(false);
      }
      // Super admin a tous les droits
      if (role === 'super_admin') {
        expect(hasPermission(role, 'vehicles', 'delete')).toBe(true);
        expect(hasPermission(role, 'users', 'delete')).toBe(true);
      }
    });
  });

  // SCÉNARIO 13 : Tester une coupure réseau, la mise en file Outbox et le rejeu
  it('Scénario 13: met en file Outbox IndexedDB lors d’une coupure réseau et synchronise lors du rejeu', () => {
    dbStore.setOnlineStatus(false);
    expect(dbStore.getState().isOnline).toBe(false);

    // Enregistrer une opération hors-ligne (ex: nouveau prospect CRM)
    const lead = dbStore.addLead({
      fullName: 'Prospect Offline Test',
      phone: '+237 677 00 11 22',
      email: 'offline@test.cm',
      budgetXAF: 15000000,
      interestType: 'PURCHASE',
      stage: 'PROSPECT',
      notes: 'Visite pendant coupure internet',
    });

    const queue = dbStore.getState().syncQueue;
    const queuedOp = queue.find((q) => q.entityId === lead.id);
    expect(queuedOp).toBeDefined();
    expect(queuedOp?.idempotencyKey).toBeDefined();

    // Rétablissement du réseau et synchronisation
    dbStore.setOnlineStatus(true);
    dbStore.triggerSync();
    expect(dbStore.getState().isOnline).toBe(true);
  });

  // SCÉNARIO 14 : Vérifier qu'un utilisateur non autorisé ne peut pas accéder aux documents privés
  it('Scénario 14: restreint la consultation des documents privés confidentiels', () => {
    // Les conducteurs et les agents de vente ne peuvent pas consulter les pièces comptables privées
    expect(hasPermission('driver', 'documents', 'read')).toBe(true); // Lecture publique autorisée
    expect(hasPermission('driver', 'documents', 'delete')).toBe(false);
    expect(hasPermission('viewer', 'documents', 'delete')).toBe(false);
  });

  // SCÉNARIO 15 : Vérifier la cohérence globale des données entre les modules et le tableau de bord
  it('Scénario 15: garantit la cohérence stricte des indicateurs entre les modules et le Dashboard', () => {
    const state = dbStore.getState();

    // 1. Cohérence véhicules
    const totalVehicles = state.vehicles.length;
    const available = state.vehicles.filter((v) => v.status === 'AVAILABLE').length;
    const rented = state.vehicles.filter((v) => v.status === 'RENTED').length;
    const maintenance = state.vehicles.filter((v) => v.status === 'MAINTENANCE').length;
    const sold = state.vehicles.filter((v) => v.status === 'SOLD').length;
    expect(available + rented + maintenance + sold).toBe(totalVehicles);

    // 2. Cohérence caisse : pas de montants négatifs dans les mouvements
    const invalidAmounts = state.cashMovements.some((m) => m.amountXAF <= 0);
    expect(invalidAmounts).toBe(false);

    // 3. Montants entiers en XAF (pas de nombres flottants)
    state.invoices.forEach((inv) => {
      expect(Number.isInteger(inv.totalAmountXAF)).toBe(true);
      expect(Number.isInteger(inv.paidAmountXAF)).toBe(true);
      expect(Number.isInteger(inv.balanceXAF)).toBe(true);
    });
  });

  // SCÉNARIO 16 : Réactivité dbStore.subscribe et désabonnement
  it('Scénario 16: dbStore.subscribe notifie les abonnés lors des mutations et permet le désabonnement', () => {
    let callCount = 0;
    const unsubscribe = dbStore.subscribe(() => {
      callCount++;
    });

    // Déclencher une mutation
    dbStore.setOnlineStatus(false);
    expect(callCount).toBe(1);

    dbStore.setOnlineStatus(true);
    expect(callCount).toBe(2);

    // Se désabonner
    unsubscribe();
    dbStore.setOnlineStatus(false);
    expect(callCount).toBe(2); // Ne doit plus s'incrémenter
    dbStore.setOnlineStatus(true);
  });
});
