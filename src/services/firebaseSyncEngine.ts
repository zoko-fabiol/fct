/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Moteur de Synchronisation & Persistance Firebase Local/Cloud
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 * 
 * Remplace l'ancien LocalStorage par le cache persistant Firestore (IndexedDB sous le capot)
 * et assure la réplication bidirectionnelle en temps réel avec le projet Firebase `fct-cmr`.
 */

import {
  writeBatch,
  doc,
  collection,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import {
  Vehicle,
  Customer,
  RentalContract,
  Reservation,
  SaleOrder,
  Invoice,
  CashSession,
  CashMovement,
  StockItem,
  StockMovement,
  MaintenanceRecord,
  Driver,
  CrmLead,
  UserProfile,
  AuditLog,
  SecurityAuditEvent,
} from '../../packages/shared-types/index.ts';
import type { DatabaseState, FctDocument } from './dbStore.ts';

export interface TransferResult {
  success: boolean;
  totalTransferred: number;
  collections: Record<string, number>;
  localStorageBytesFreed: number;
  error?: string;
  syncedAt: string;
}

/**
 * 1. Purge intégrale et définitive de l'ancien LocalStorage
 */
export function clearAllLocalStorage(): { clearedKeys: string[]; bytesFreed: number } {
  if (typeof localStorage === 'undefined') {
    return { clearedKeys: [], bytesFreed: 0 };
  }

  const targetedKeys = [
    'fct_erp_database_v1',
    'fct_automobile_erp_db',
    'fct_db_state',
    'fct_sync_queue',
    'fct_offline_cache',
  ];

  let bytesFreed = 0;
  const clearedKeys: string[] = [];

  // Suppression des clés connues
  for (const key of targetedKeys) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      bytesFreed += val.length * 2;
      localStorage.removeItem(key);
      clearedKeys.push(key);
    }
  }

  // Suppression de toute clé orpheline résiduelle liée à la base de données
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith('fct_') || key.startsWith('FCT_')) &&
      key !== 'fct_erp_lang' &&
      key !== 'fct_auth_session_user'
    ) {
      const val = localStorage.getItem(key);
      if (val) bytesFreed += val.length * 2;
      localStorage.removeItem(key);
      clearedKeys.push(key);
    }
  }

  console.info(
    `[FCT Firebase Engine] LocalStorage intégralement purgé : ${clearedKeys.length} clé(s) supprimée(s), ${Math.round(bytesFreed / 1024)} Ko libérés.`
  );

  return { clearedKeys, bytesFreed };
}

/**
 * 2. Transfert massif de toutes les collections du store vers Firebase (Firestore Local Cache & Cloud)
 */
export async function transferAllDataToFirebase(
  state: DatabaseState,
  onProgress?: (step: string, current: number, total: number) => void
): Promise<TransferResult> {
  const result: TransferResult = {
    success: false,
    totalTransferred: 0,
    collections: {},
    localStorageBytesFreed: 0,
    syncedAt: new Date().toISOString(),
  };

  try {
    const itemsToSave: { collectionName: string; docId: string; data: any }[] = [];

    // Paramètres généraux
    if (state.settings) {
      itemsToSave.push({
        collectionName: 'settings',
        docId: 'agency_settings',
        data: state.settings,
      });
    }

    // Permissions RBAC
    if (state.rolePermissions) {
      itemsToSave.push({
        collectionName: 'settings',
        docId: 'role_permissions',
        data: { roles: state.rolePermissions },
      });
    }

    // Compteurs de documents
    if (state.documentCounters) {
      itemsToSave.push({
        collectionName: 'settings',
        docId: 'document_counters',
        data: state.documentCounters,
      });
    }

    // Utilisateurs
    (state.users || []).forEach((u: UserProfile) => {
      itemsToSave.push({ collectionName: 'users', docId: u.id, data: u });
    });

    // Véhicules
    (state.vehicles || []).forEach((v: Vehicle) => {
      itemsToSave.push({ collectionName: 'vehicles', docId: v.id, data: v });
    });

    // Clients
    (state.customers || []).forEach((c: Customer) => {
      itemsToSave.push({ collectionName: 'customers', docId: c.id, data: c });
    });

    // Prospects CRM
    (state.leads || []).forEach((l: CrmLead) => {
      itemsToSave.push({ collectionName: 'leads', docId: l.id, data: l });
    });

    // Contrats de location
    (state.contracts || []).forEach((c: RentalContract) => {
      itemsToSave.push({ collectionName: 'rental_contracts', docId: c.id, data: c });
    });

    // Réservations
    (state.reservations || []).forEach((r: Reservation) => {
      itemsToSave.push({ collectionName: 'reservations', docId: r.id, data: r });
    });

    // Ventes
    (state.sales || []).forEach((s: SaleOrder) => {
      itemsToSave.push({ collectionName: 'sales', docId: s.id, data: s });
    });

    // Factures
    (state.invoices || []).forEach((inv: Invoice) => {
      itemsToSave.push({ collectionName: 'invoices', docId: inv.id, data: inv });
    });

    // Sessions de caisse
    (state.cashSessions || []).forEach((cs: CashSession) => {
      itemsToSave.push({ collectionName: 'cash_sessions', docId: cs.id, data: cs });
    });

    // Mouvements de caisse
    (state.cashMovements || []).forEach((cm: CashMovement) => {
      itemsToSave.push({ collectionName: 'cash_movements', docId: cm.id, data: cm });
    });

    // Pièces de stock
    (state.stock || []).forEach((st: StockItem) => {
      itemsToSave.push({ collectionName: 'stock', docId: st.id, data: st });
    });

    // Mouvements de stock
    (state.stockMovements || []).forEach((sm: StockMovement) => {
      itemsToSave.push({ collectionName: 'stock_movements', docId: sm.id, data: sm });
    });

    // Dossiers de maintenance
    (state.maintenance || []).forEach((m: MaintenanceRecord) => {
      itemsToSave.push({ collectionName: 'maintenance', docId: m.id, data: m });
    });

    // Chauffeurs
    (state.drivers || []).forEach((d: Driver) => {
      itemsToSave.push({ collectionName: 'drivers', docId: d.id, data: d });
    });

    // Documents
    (state.documents || []).forEach((docItem: FctDocument) => {
      itemsToSave.push({ collectionName: 'documents', docId: docItem.id, data: docItem });
    });

    // Journaux d'audit de sécurité
    (state.securityAuditLogs || []).forEach((sal: SecurityAuditEvent) => {
      itemsToSave.push({ collectionName: 'security_audit_logs', docId: sal.id, data: sal });
    });

    // Journaux d'audit généraux
    (state.auditLogs || []).slice(0, 500).forEach((al: AuditLog) => {
      itemsToSave.push({ collectionName: 'audit_logs', docId: al.id, data: al });
    });

    const total = itemsToSave.length;
    let committed = 0;
    const CHUNK_SIZE = 350; // Firestore limite les lots à 500 ops max

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = itemsToSave.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const ref = doc(db, item.collectionName, item.docId);
        batch.set(
          ref,
          {
            ...item.data,
            _firebaseSyncedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        result.collections[item.collectionName] =
          (result.collections[item.collectionName] || 0) + 1;
      });

      await batch.commit();
      committed += chunk.length;

      if (onProgress) {
        onProgress('Écriture dans Firebase...', committed, total);
      }
    }

    // Nettoyage de l'ancien LocalStorage maintenant que Firebase est alimenté
    const cleanInfo = clearAllLocalStorage();
    result.localStorageBytesFreed = cleanInfo.bytesFreed;
    result.totalTransferred = committed;
    result.success = true;

    console.info(
      `[FCT Firebase Engine] Transfert terminé avec succès : ${committed} documents injectés dans Firebase.`
    );
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'transferAllDataToFirebase');
    result.error = error.message || 'Erreur lors du transfert Firebase';
  }

  return result;
}

/**
 * 3. Récupération de l'ensemble des données depuis Firebase (Local Cache ou Cloud)
 */
export async function loadAllFromFirebase(): Promise<Partial<DatabaseState> | null> {
  try {
    const loaded: Partial<DatabaseState> = {};

    const [
      vehSnap,
      custSnap,
      leadSnap,
      ctrSnap,
      resSnap,
      saleSnap,
      invSnap,
      csSnap,
      cmSnap,
      stkSnap,
      smSnap,
      mntSnap,
      drvSnap,
      docSnap,
      userSnap,
    ] = await Promise.all([
      getDocs(collection(db, 'vehicles')),
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'leads')),
      getDocs(collection(db, 'rental_contracts')),
      getDocs(collection(db, 'reservations')),
      getDocs(collection(db, 'sales')),
      getDocs(collection(db, 'invoices')),
      getDocs(collection(db, 'cash_sessions')),
      getDocs(collection(db, 'cash_movements')),
      getDocs(collection(db, 'stock')),
      getDocs(collection(db, 'stock_movements')),
      getDocs(collection(db, 'maintenance')),
      getDocs(collection(db, 'drivers')),
      getDocs(collection(db, 'documents')),
      getDocs(collection(db, 'users')),
    ]);

    // Si Firebase contient des véhicules ou des clients, hydrater le store
    if (vehSnap.docs.length > 0) {
      loaded.vehicles = vehSnap.docs.map((d) => d.data() as Vehicle);
    }
    if (custSnap.docs.length > 0) {
      loaded.customers = custSnap.docs.map((d) => d.data() as Customer);
    }
    if (leadSnap.docs.length > 0) {
      loaded.leads = leadSnap.docs.map((d) => d.data() as CrmLead);
    }
    if (ctrSnap.docs.length > 0) {
      loaded.contracts = ctrSnap.docs.map((d) => d.data() as RentalContract);
    }
    if (resSnap.docs.length > 0) {
      loaded.reservations = resSnap.docs.map((d) => d.data() as Reservation);
    }
    if (saleSnap.docs.length > 0) {
      loaded.sales = saleSnap.docs.map((d) => d.data() as SaleOrder);
    }
    if (invSnap.docs.length > 0) {
      loaded.invoices = invSnap.docs.map((d) => d.data() as Invoice);
    }
    if (csSnap.docs.length > 0) {
      loaded.cashSessions = csSnap.docs.map((d) => d.data() as CashSession);
    }
    if (cmSnap.docs.length > 0) {
      loaded.cashMovements = cmSnap.docs.map((d) => d.data() as CashMovement);
    }
    if (stkSnap.docs.length > 0) {
      loaded.stock = stkSnap.docs.map((d) => d.data() as StockItem);
    }
    if (smSnap.docs.length > 0) {
      loaded.stockMovements = smSnap.docs.map((d) => d.data() as StockMovement);
    }
    if (mntSnap.docs.length > 0) {
      loaded.maintenance = mntSnap.docs.map((d) => d.data() as MaintenanceRecord);
    }
    if (drvSnap.docs.length > 0) {
      loaded.drivers = drvSnap.docs.map((d) => d.data() as Driver);
    }
    if (docSnap.docs.length > 0) {
      loaded.documents = docSnap.docs.map((d) => d.data() as FctDocument);
    }
    if (userSnap.docs.length > 0) {
      loaded.users = userSnap.docs.map((d) => d.data() as UserProfile);
    }

    return Object.keys(loaded).length > 0 ? loaded : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'loadAllFromFirebase');
    return null;
  }
}

/**
 * 4. Abonnement en temps réel aux collections principales pour synchronisation continue
 */
export function listenToFirebaseRealtime(
  onUpdate: (partial: Partial<DatabaseState>) => void
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  const attachListener = <T>(collectionName: string, stateKey: keyof DatabaseState) => {
    try {
      const unsub = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => d.data() as T);
            onUpdate({ [stateKey]: items } as Partial<DatabaseState>);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, collectionName);
        }
      );
      unsubs.push(unsub);
    } catch (e) {
      console.warn(`Erreur attachement listener Firebase [${collectionName}]:`, e);
    }
  };

  attachListener<Vehicle>('vehicles', 'vehicles');
  attachListener<Customer>('customers', 'customers');
  attachListener<RentalContract>('rental_contracts', 'contracts');
  attachListener<Reservation>('reservations', 'reservations');
  attachListener<SaleOrder>('sales', 'sales');
  attachListener<Invoice>('invoices', 'invoices');
  attachListener<CashMovement>('cash_movements', 'cashMovements');
  attachListener<CashSession>('cash_sessions', 'cashSessions');
  attachListener<StockItem>('stock', 'stock');
  attachListener<MaintenanceRecord>('maintenance', 'maintenance');
  attachListener<Driver>('drivers', 'drivers');
  attachListener<CrmLead>('leads', 'leads');

  return () => {
    unsubs.forEach((fn) => fn());
  };
}
