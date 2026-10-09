/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - IndexedDB Local Persistence & Outbox Engine
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { SyncQueueItem } from '../../packages/shared-types/index.ts';

const DB_NAME = 'FCT_ERP_INDEXED_DB';
const DB_VERSION = 1;

export class IndexedDbService {
  private db: IDBDatabase | null = null;
  private isReadyPromise: Promise<boolean>;

  constructor() {
    this.isReadyPromise = this.init();
  }

  private init(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(false);
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Création des stores locaux
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'collectionName' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onerror = () => {
        console.warn('IndexedDB initialisation non disponible, utilisation du stockage mémoire/cache.');
        resolve(false);
      };
    });
  }

  public async saveOutboxItem(item: SyncQueueItem): Promise<void> {
    await this.isReadyPromise;
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('outbox', 'readwrite');
        const store = tx.objectStore('outbox');
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  public async getPendingOutboxItems(): Promise<SyncQueueItem[]> {
    await this.isReadyPromise;
    if (!this.db) return [];

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('outbox', 'readonly');
        const store = tx.objectStore('outbox');
        const request = store.getAll();
        request.onsuccess = () => {
          const items: SyncQueueItem[] = (request.result || []).filter(
            (i: SyncQueueItem) => i.status === 'PENDING'
          );
          resolve(items);
        };
        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  public async markOutboxItemSynced(id: string): Promise<void> {
    await this.isReadyPromise;
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('outbox', 'readwrite');
        const store = tx.objectStore('outbox');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  public async cacheCollection(collectionName: string, data: any): Promise<void> {
    await this.isReadyPromise;
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        store.put({ collectionName, data, cachedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  public async getCachedCollection(collectionName: string): Promise<any | null> {
    await this.isReadyPromise;
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const request = store.get(collectionName);
        request.onsuccess = () => {
          resolve(request.result?.data || null);
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }
}

export const indexedDbService = new IndexedDbService();
