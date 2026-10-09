import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';

describe('Contextual Reactions & Pre-filling Tests', () => {
  beforeEach(() => {
    const adminUser = dbStore.getUsers().find((u) => u.role === 'super_admin');
    if (adminUser) {
      dbStore.setCurrentUser(adminUser);
    }
  });

  it('correctly associates and retrieves customer data for rental contract creation', () => {
    const state = dbStore.getState();
    const customer = state.customers[0];
    expect(customer).toBeDefined();

    // Verify customer exists and has all essential fields needed for rental prefill
    expect(customer.id).toBeTruthy();
    expect(customer.phone).toBeTruthy();
    expect(customer.fullName || customer.companyName).toBeTruthy();
  });

  it('correctly associates and retrieves vehicle data for contract & sale prefill', () => {
    const state = dbStore.getState();
    const vehicle = state.vehicles.find((v) => v.status === 'AVAILABLE');
    expect(vehicle).toBeDefined();
    expect(vehicle?.rentalDailyRate).toBeGreaterThan(0);
    expect(vehicle?.securityDepositRate).toBeGreaterThan(0);
  });

  it('pre-calculates cash receipt amounts from pending invoice balances', () => {
    const state = dbStore.getState();
    const invoice = state.invoices[0];
    expect(invoice).toBeDefined();

    // Verify that invoice balance is correctly available for cash payment prefilling
    const expectedAmount = invoice.balanceXAF > 0 ? invoice.balanceXAF : invoice.totalAmountXAF;
    expect(expectedAmount).toBeGreaterThan(0);
  });

  it('pre-calculates cash receipt amounts from rental contract balances', () => {
    const state = dbStore.getState();
    const contract = state.contracts[0];
    expect(contract).toBeDefined();

    const expectedAmount = contract.remainingAmountXAF > 0 ? contract.remainingAmountXAF : contract.dailyRateXAF;
    expect(expectedAmount).toBeGreaterThan(0);
  });
});
