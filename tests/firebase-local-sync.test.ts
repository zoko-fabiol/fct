import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clearAllLocalStorage } from '../src/services/firebaseSyncEngine.ts';
import { dbStore } from '../src/services/dbStore.ts';

// Mock simple de localStorage pour environnement Node
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

describe('Firebase Local Persistence & LocalStorage Purge', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    mockStorage.setItem('fct_erp_database_v1', JSON.stringify({ old: 'data' }));
    mockStorage.setItem('fct_automobile_erp_db', JSON.stringify({ old: 'v0' }));
    mockStorage.setItem('fct_offline_cache', 'true');
    (globalThis as any).localStorage = mockStorage;
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
  });

  it('devrait supprimer intégralement toutes les clés LocalStorage de FCT', () => {
    const res = clearAllLocalStorage();
    expect(res.clearedKeys).toContain('fct_erp_database_v1');
    expect(res.clearedKeys).toContain('fct_automobile_erp_db');
    expect(res.clearedKeys).toContain('fct_offline_cache');
    expect(mockStorage.getItem('fct_erp_database_v1')).toBeNull();
    expect(mockStorage.getItem('fct_automobile_erp_db')).toBeNull();
  });

  it('dbStore.clearLocalStorage() devrait purger le LocalStorage et retourner les octets libérés', () => {
    mockStorage.setItem('fct_erp_database_v1', JSON.stringify({ test: 123 }));
    const result = dbStore.clearLocalStorage();
    expect(result.clearedKeys).toContain('fct_erp_database_v1');
    expect(result.bytesFreed).toBeGreaterThan(0);
    expect(mockStorage.getItem('fct_erp_database_v1')).toBeNull();
  });

  it('dbStore ne doit plus jamais réécrire dans localStorage lors des mutations de données', () => {
    mockStorage.clear();
    // Effectuer une mise à jour d'état
    dbStore.updateSettings({ agencyName: 'FCT Automobile Douala Test' });
    // LocalStorage doit rester strictement vide
    expect(mockStorage.getItem('fct_erp_database_v1')).toBeNull();
  });
});
