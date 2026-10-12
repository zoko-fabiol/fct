/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests Billetage BEAC & Inspection Restitution
 * Douala, Cameroun
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import {
  calculateTotalBreakdown,
  generateBreakdownSummary,
  INITIAL_BREAKDOWN,
  DenominationBreakdown,
} from '../src/components/cash/CashDenominationGrid.tsx';

describe('Billetage Officiel BEAC / CEMAC (XAF)', () => {
  it('calcule correctement le montant total à partir des coupures saisies', () => {
    const breakdown: DenominationBreakdown = {
      ...INITIAL_BREAKDOWN,
      b10000: 10, // 100 000
      b5000: 4,   // 20 000
      b2000: 5,   // 10 000
      b1000: 10,  // 10 000
      b500: 2,    // 1 000
      c100: 5,    // 500
    };

    const total = calculateTotalBreakdown(breakdown);
    expect(total).toBe(141500);
  });

  it('génère un résumé textuel d’audit clair pour les notes de caisse', () => {
    const breakdown: DenominationBreakdown = {
      ...INITIAL_BREAKDOWN,
      b10000: 5,
      b5000: 2,
    };

    const summary = generateBreakdownSummary(breakdown);
    expect(summary).toContain('5x10 000');
    expect(summary).toContain('2x5 000');
    expect(summary).toContain('FCFA');
    expect(summary).toContain('[Billetage:');
  });
});

describe('Traçabilité Caisse & Rapprochement Session', () => {
  beforeEach(() => {
    // Si une session est ouverte, on la clôture pour les tests
    const active = dbStore.getActiveCashSession();
    if (active) {
      dbStore.closeCashSession(active.id, active.calculatedExpectedBalanceXAF, 'Clôture de test');
    }
  });

  it('ouvre une session et consigne un décaissement avec justification obligatoire', () => {
    const session = dbStore.openCashSession(200000);
    expect(session.status).toBe('OPEN');
    expect(session.openingBalanceXAF).toBe(200000);

    const expense = dbStore.recordCashMovement({
      sessionId: session.id,
      type: 'OUTFLOW',
      category: 'FUEL_EXPENSE',
      amountXAF: 25000,
      receivedFromOrPaidTo: 'Station Total Santa Barbara',
      reason: 'Plein carburant Prado immatriculation LT 502 (Ticket #99482)',
      justificationReceiptUrl: 'https://res.cloudinary.com/fct/receipt-fuel-99482.jpg',
    });

    expect(expense.receiptNumber).toBeDefined();
    expect(expense.amountXAF).toBe(25000);
    expect(expense.justificationReceiptUrl).toBeDefined();

    // Vérifier l'impact sur le solde théorique
    const state = dbStore.getState();
    const updatedSession = state.cashSessions.find((s) => s.id === session.id);
    expect(updatedSession?.calculatedExpectedBalanceXAF).toBe(175000);

    // Clôture avec billetage conforme
    const closed = dbStore.closeCashSession(
      session.id,
      175000,
      '[Billetage: 17x10 000, 1x5 000 = 175 000 FCFA]'
    );
    expect(closed.status).toBe('CLOSED');
    expect(closed.discrepancyXAF).toBe(0);
    expect(closed.closingNotes).toContain('Billetage');
  });
});

describe('Inspection Contradictoire de Restitution & Décompte de Caution', () => {
  it('met à jour le contrat avec inspection de retour, libère le véhicule et calcule le solde net de caution', () => {
    const state = dbStore.getState();
    const activeContract = state.contracts.find((c) => c.status === 'CONFIRMED');

    if (activeContract) {
      const vehId = activeContract.vehicleId;
      const initialDeposit = activeContract.securityDepositXAF;
      const penaltyAmount = 15000;

      dbStore.checkOutReturn(
        activeContract.id,
        {
          fuelLevel: 7,
          mileage: 65200,
          bodyConditionNotes: 'Restitution conforme, légère salissure banquette arrière',
          cleanlinessCondition: 'DIRTY',
          hasSpareWheel: true,
          hasJackAndTools: true,
          inspectorName: 'Gérant FCT Douala',
          photos: [],
          signatureDate: new Date().toISOString(),
        },
        penaltyAmount,
        'Frais de nettoyage approfondi banquette'
      );

      const updated = dbStore.getState().contracts.find((c) => c.id === activeContract.id);
      expect(updated?.status).toBe('RETURNED');
      expect(updated?.penaltiesXAF).toBe(penaltyAmount);
      expect(updated?.depositReturnedXAF).toBe(initialDeposit - penaltyAmount);

      // Le véhicule doit être libéré et son kilométrage mis à jour
      const veh = dbStore.getState().vehicles.find((v) => v.id === vehId);
      expect(veh?.status).toBe('AVAILABLE');
      expect(veh?.mileage).toBe(65200);
    }
  });
});
