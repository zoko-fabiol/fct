/**
 * @license
 * Tests Vitest : Annulation Réservations, Export Excel .xlsx & Sécurité Code PIN
 * FCT Automobile Douala
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import { exportCollectionToExcel, exportDocumentToExcel } from '../src/utils/excelExport.ts';
import { formatAmountPlain } from '../src/utils/invoiceFormat.ts';

describe('FCT — Réservations & Annulation Sécurisée (Zero Destruction)', () => {
  it('devrait annuler une réservation sans supprimer les données physiques', () => {
    const availVehicle = dbStore.getState().vehicles.find((v) => v.status === 'AVAILABLE') || dbStore.getState().vehicles[0];
    // Assurer le statut AVAILABLE pour le test
    availVehicle.status = 'AVAILABLE';

    const newRes = dbStore.addReservation({
      customerId: dbStore.getState().customers[0].id,
      customerName: dbStore.getState().customers[0].fullName,
      customerPhone: dbStore.getState().customers[0].phone,
      vehicleId: availVehicle.id,
      vehicleName: availVehicle.model,
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      advanceDepositXAF: 50000,
      estimatedTotalXAF: 250000,
      status: 'CONFIRMED',
      source: 'WALK_IN',
    });

    const cancelled = dbStore.cancelReservation(newRes.id, 'Client indisponible');
    expect(cancelled.status).toBe('CANCELLED');

    const inState = dbStore.getState().reservations.find((r) => r.id === newRes.id);
    expect(inState).toBeDefined();
    expect(inState?.status).toBe('CANCELLED');

    const auditLog = dbStore.getState().auditLogs.find((l) =>
      l.details.includes(`Annulation de la réservation ${newRes.reservationNumber}`)
    );
    expect(auditLog).toBeDefined();
  });

  it('devrait refuser d\'annuler une réservation déjà annulée', () => {
    const availVehicle = dbStore.getState().vehicles.find((v) => v.status === 'AVAILABLE') || dbStore.getState().vehicles[0];
    availVehicle.status = 'AVAILABLE';

    const newRes = dbStore.addReservation({
      customerId: dbStore.getState().customers[0].id,
      customerName: dbStore.getState().customers[0].fullName,
      customerPhone: dbStore.getState().customers[0].phone,
      vehicleId: availVehicle.id,
      vehicleName: availVehicle.model,
      startDate: '2026-12-10',
      endDate: '2026-12-15',
      advanceDepositXAF: 50000,
      estimatedTotalXAF: 250000,
      status: 'CONFIRMED',
      source: 'WALK_IN',
    });

    dbStore.cancelReservation(newRes.id);

    expect(() => {
      dbStore.cancelReservation(newRes.id);
    }).toThrow('Cette réservation est déjà annulée.');
  });
});

describe('FCT — Formatage Montant sans slash erroné', () => {
  it('formatAmountPlain ne doit contenir aucun slash ni espace fine insécable', () => {
    const val = 350000;
    const formatted = formatAmountPlain(val, true);

    expect(formatted).not.toContain('/');
    expect(formatted).toBe('350 000 FCFA');
    expect(formatted.charCodeAt(3)).toBe(32); // Espace standard ASCII (0x20)
  });
});

describe('FCT — Moteur d\'Exportation Excel (.xlsx)', () => {
  it('exportCollectionToExcel accepte un objet d\'options ou des arguments positionnels', () => {
    const data = [
      { id: '1', name: 'Toyota Prado', amount: 85000 },
      { id: '2', name: 'Mercedes GLE', amount: 120000 },
    ];

    expect(() => {
      exportCollectionToExcel({
        data,
        columns: [
          { header: 'ID', key: 'id' },
          { header: 'Véhicule', key: 'name' },
          { header: 'Prix', key: 'amount' },
        ],
        filename: 'test_export',
      });
    }).not.toThrow();
  });

  it('exportDocumentToExcel génère un classeur A4 sans erreur', () => {
    const docData = {
      title: 'Contrat de Location',
      docNumber: 'CTR-2026-0034',
      date: '2026-10-12',
      customerName: 'SOCTRAN SA',
      customerPhone: '+237 699 00 00 00',
      items: [
        { description: 'Location Toyota Prado TX-L', qty: 7, unitPrice: 85000, total: 595000 },
      ],
      subtotal: 595000,
      tax: 0,
      total: 595000,
      depositAmount: 350000,
      notes: 'Caution consignée 350 000 FCFA',
    };

    expect(() => {
      exportDocumentToExcel(docData);
    }).not.toThrow();
  });
});

describe('FCT — Sécurité Code PIN Cloud (Firestore) & Caractère Optionnel', () => {
  it('par défaut, les utilisateurs n\'ont aucun code PIN obligatoire configuré', () => {
    const users = dbStore.getUsers();
    expect(users.length).toBeGreaterThan(0);
    // Le premier utilisateur (Super Admin ou autre) ne doit pas avoir de code PIN hardcodé '1234'
    const superAdmin = users[0];
    expect(superAdmin.securityPin).toBeUndefined();
  });

  it('permet à un utilisateur de définir son code PIN de sécurité (stocké sur UserProfile)', () => {
    const user = dbStore.getUsers()[0];
    const updated = dbStore.setUserPin(user.id, '8492');

    expect(updated.securityPin).toBe('8492');

    const inStore = dbStore.getUsers().find((u) => u.id === user.id);
    expect(inStore?.securityPin).toBe('8492');
  });

  it('permet de supprimer / désactiver le code PIN à tout moment (PIN optionnel)', () => {
    const user = dbStore.getUsers()[0];
    // On efface le PIN en passant undefined
    const updated = dbStore.setUserPin(user.id, undefined);

    expect(updated.securityPin).toBeUndefined();

    const inStore = dbStore.getUsers().find((u) => u.id === user.id);
    expect(inStore?.securityPin).toBeUndefined();
  });

  it('ignore les formats invalides et ne définit aucun PIN si non conforme (ex: 2 chiffres)', () => {
    const user = dbStore.getUsers()[0];
    const updated = dbStore.setUserPin(user.id, '12');

    expect(updated.securityPin).toBeUndefined();
  });
});
