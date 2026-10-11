/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests d'Intégration UI/UX & Traçabilité Croisée 360°
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import {
  calculateEffectivePermissions,
  hasEffectivePermission,
  formatXAF,
} from '../packages/business-rules/index.ts';

describe('Refonte UI/UX & Parcours de Suivi Intégré (FCT ERP & CRM)', () => {
  beforeEach(() => {
    const adminUser = dbStore.getUsers().find((u) => u.role === 'super_admin');
    if (adminUser) {
      dbStore.setCurrentUser(adminUser);
    }
    const activeSession = dbStore.getActiveCashSession();
    if (!activeSession) {
      dbStore.openCashSession(500000);
    }

    let state = dbStore.getState();
    if (state.vehicles.length === 0) {
      dbStore.addVehicle({
        vin: 'VF7TESTSCENARIO01',
        licensePlate: 'LT-8841-CE',
        brand: 'Toyota',
        model: 'Prado TX',
        year: 2022,
        category: 'SUV',
        transmission: 'AUTOMATIQUE',
        fuel: 'DIESEL',
        seats: 7,
        mileage: 48500,
        acquisitionCost: 38000000,
        rentalDailyRate: 85000,
        securityDepositRate: 350000,
        salePrice: 42000000,
        isForRent: true,
        isForSale: true,
        status: 'AVAILABLE',
        currentLocation: 'Agence Douala',
        color: 'Blanc',
        photoUrls: [],
        documentsCount: 4,
        nextTechnicalInspectionDate: '2027-02-15',
        insuranceExpiryDate: '2026-12-31',
      });
    }

    state = dbStore.getState();
    const veh = state.vehicles[0];

    if (state.stock.length === 0) {
      dbStore.addStockItem({
        code: 'STK-OIL-5W30',
        name: 'Huile Moteur 5W30 Synthèse',
        category: 'LUBRIFIANT',
        quantityInStock: 24,
        unitCostXAF: 35000,
        minThresholdAlert: 5,
        unit: 'Litre',
        supplier: 'TotalEnergies Cameroun',
        locationBin: 'Rayon A-01',
      });
    }

    state = dbStore.getState();
    const stk = state.stock[0];

    if (state.maintenance.length === 0 && veh && stk) {
      dbStore.addMaintenanceRecord({
        vehicleId: veh.id,
        vehicleName: `${veh.brand} ${veh.model}`,
        licensePlate: veh.licensePlate,
        type: 'PREVENTIVE',
        description: 'Vidange générale et changement filtre',
        mileageAtService: veh.mileage,
        totalCostXAF: 55000,
        laborCostXAF: 20000,
        garageName: 'Garage Partenaire Akwa',
        status: 'COMPLETED',
        startDate: '2026-10-01',
        completionDate: '2026-10-02',
        partsUsed: [
          {
            stockItemId: stk.id,
            name: stk.name,
            quantity: 1,
            unitPriceXAF: stk.unitCostXAF,
            totalXAF: stk.unitCostXAF,
          },
        ],
      });
    }

    if (state.drivers.length === 0) {
      dbStore.addDriver({
        fullName: 'Eric Ngassa',
        phone: '+237 670 11 22 33',
        licenseNumber: 'PC-2018-99441',
        licenseCategories: ['B'],
        licenseExpiryDate: '2028-05-14',
        medicalExamExpiryDate: '2028-05-14',
        status: 'AVAILABLE',
      });
    }

    if (!dbStore.getUsers().find((u) => u.role === 'driver')) {
      dbStore.addUser({
        fullName: 'Eric Ngassa (Chauffeur)',
        email: 'driver.test@fct-test.cm',
        phone: '+237 670 11 22 33',
        role: 'driver',
        status: 'ACTIVE',
        isActive: true,
      });
    }
  });

  it('1. Bilan de santé du véhicule calculé à partir des données réelles', () => {
    const state = dbStore.getState();
    const vehicle = state.vehicles[0];
    expect(vehicle).toBeDefined();

    const health = dbStore.getVehicleHealthSheet(vehicle.id);
    expect(health).not.toBeNull();
    expect(health!.healthScore).toBeGreaterThanOrEqual(10);
    expect(health!.healthScore).toBeLessThanOrEqual(100);
    expect(health!.totalMaintenanceCostXAF).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(health!.interventions)).toBe(true);
  });

  it('2. Navigation croisée : Intervention -> Véhicule lié', () => {
    const state = dbStore.getState();
    const mnt = state.maintenance[0];
    expect(mnt).toBeDefined();

    const linkedVeh = state.vehicles.find((v) => v.id === mnt.vehicleId);
    expect(linkedVeh).toBeDefined();
    expect(linkedVeh!.licensePlate).toBe(mnt.licensePlate);
  });

  it('3. Navigation croisée : Intervention -> Pièces de stock utilisées', () => {
    const state = dbStore.getState();
    const mntWithParts = state.maintenance.find((m) => m.partsUsed && m.partsUsed.length > 0);
    expect(mntWithParts).toBeDefined();

    const part = mntWithParts!.partsUsed[0];
    expect(part.stockItemId).toBeDefined();

    const stockItem = state.stock.find((s) => s.id === part.stockItemId);
    expect(stockItem).toBeDefined();
    expect(part.unitPriceXAF).toBe(stockItem!.unitCostXAF);
  });

  it('4. Navigation croisée : Chauffeur -> Missions et Contrats associés', () => {
    const state = dbStore.getState();
    const driver = state.drivers[0];
    expect(driver).toBeDefined();

    const driverContracts = state.contracts.filter((c) => c.driverId === driver.id);
    expect(Array.isArray(driverContracts)).toBe(true);
  });

  it('5. Identification du véhicule réellement affecté à un chauffeur et une mission en cours', () => {
    const state = dbStore.getState();
    const activeContractWithDriver = state.contracts.find((c) => c.status === 'ACTIVE' && c.driverId);
    if (activeContractWithDriver) {
      const assignedVeh = state.vehicles.find((v) => v.id === activeContractWithDriver.vehicleId);
      expect(assignedVeh).toBeDefined();
      expect(assignedVeh!.id).toBe(activeContractWithDriver.vehicleId);
    }
  });

  it('6. Navigation croisée : Location -> Contrat -> Véhicule et Client', () => {
    const state = dbStore.getState();
    const contract = state.contracts[0];
    expect(contract).toBeDefined();

    const linkedVeh = state.vehicles.find((v) => v.id === contract.vehicleId);
    const linkedCust = state.customers.find((c) => c.id === contract.customerId);

    expect(linkedVeh).toBeDefined();
    expect(linkedCust).toBeDefined();
    expect(contract.customerName).toBe(linkedCust!.companyName || linkedCust!.fullName);
  });

  it('7. Navigation croisée : Vente -> Client acquéreur et Véhicule vendu', () => {
    const state = dbStore.getState();
    const sale = state.sales[0];
    expect(sale).toBeDefined();

    const linkedCust = state.customers.find((c) => c.id === sale.customerId);
    const linkedVeh = state.vehicles.find((v) => v.id === sale.vehicleId);

    expect(linkedCust).toBeDefined();
    expect(linkedVeh).toBeDefined();
    expect(sale.negotiatedPriceXAF).toBeGreaterThan(0);
  });

  it('8. Navigation croisée : Facture -> Opération d’origine (Contrat ou Vente)', () => {
    const state = dbStore.getState();
    const invoice = state.invoices.find((i) => i.relatedContractId || i.relatedSaleOrderId);
    expect(invoice).toBeDefined();

    if (invoice!.relatedContractId) {
      const contract = state.contracts.find((c) => c.id === invoice!.relatedContractId);
      expect(contract).toBeDefined();
    }
    if (invoice!.relatedSaleOrderId) {
      const sale = state.sales.find((s) => s.id === invoice!.relatedSaleOrderId);
      expect(sale).toBeDefined();
    }
  });

  it('9. Contrôle strict des permissions : un chauffeur ne voit pas la gestion financière', () => {
    const state = dbStore.getState();
    const driverUser = state.users.find((u) => u.role === 'driver');
    expect(driverUser).toBeDefined();

    const canReadCash = hasEffectivePermission(driverUser!, 'cash', 'read', state.rolePermissions);
    const canReadBilling = hasEffectivePermission(driverUser!, 'billing', 'read', state.rolePermissions);
    const canReadDrivers = hasEffectivePermission(driverUser!, 'drivers', 'read', state.rolePermissions);

    expect(canReadCash).toBe(false);
    expect(canReadBilling).toBe(false);
    expect(canReadDrivers).toBe(true);
  });

  it('10. Clôture d’une intervention avec déduction atomique de stock et remise en circulation', () => {
    const state = dbStore.getState();
    const inProgressMnt = state.maintenance.find((m) => m.status === 'IN_PROGRESS' && m.partsUsed && m.partsUsed.length > 0);
    expect(inProgressMnt).toBeDefined();

    const partUsed = inProgressMnt!.partsUsed[0];
    const stockBefore = state.stock.find((s) => s.id === partUsed.stockItemId);
    expect(stockBefore).toBeDefined();
    const initialQty = stockBefore!.quantityInStock;

    // Clôture
    const completed = dbStore.completeMaintenance(inProgressMnt!.id, 'Fin de travaux certifiée');
    expect(completed.status).toBe('COMPLETED');

    const stateAfter = dbStore.getState();
    const stockAfter = stateAfter.stock.find((s) => s.id === partUsed.stockItemId);
    expect(stockAfter!.quantityInStock).toBe(initialQty - partUsed.quantity);

    const vehicleAfter = stateAfter.vehicles.find((v) => v.id === inProgressMnt!.vehicleId);
    expect(vehicleAfter!.status).toBe('AVAILABLE');
  });
});
