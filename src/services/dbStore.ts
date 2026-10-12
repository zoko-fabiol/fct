/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Unified Database & Reactive Store
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Implements:
 * - Feature-based Repository Pattern
 * - Atomic state mutations & Outbox Queue
 * - Conflict detection & Idempotency key generation
 * - Certified Cash Desk (Immutable movements + Counter-entries)
 * - Automatic Audit Logging (actor, timestamp, reason, diff)
 */

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
  CrmLead,
  MaintenanceRecord,
  Driver,
  AuditLog,
  SyncQueueItem,
  AgencySettings,
  UserProfile,
  UserRole,
  AppModule,
  PermissionAction,
  SecurityAuditEvent,
  UserAccountStatus,
  UserPermissionOverrides,
} from '../../packages/shared-types/index.ts';
import { PUBLIC_VEHICLES_COLLECTION, isVehiclePublishable, toPublicVehicle } from './publicCatalog.ts';
import {
  initialSettings,
  initialUsers,
  initialVehicles,
  initialCustomers,
  initialContracts,
  initialReservations,
  initialSales,
  initialCashSession,
  initialCashMovements,
  initialStock,
  initialStockMovements,
  initialLeads,
  initialMaintenance,
  initialDrivers,
  initialInvoices,
} from './seedData.ts';
import {
  generateDocumentNumber,
  checkVehicleAvailability,
  validateVehicleOperationalState,
  DEFAULT_ROLE_PERMISSIONS,
  calculateEffectivePermissions,
  hasEffectivePermission,
  getPermissionOrigin,
} from '../../packages/business-rules/index.ts';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { indexedDbService } from './indexedDbService.ts';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  clearAllLocalStorage,
  transferAllDataToFirebase,
  loadAllFromFirebase,
  listenToFirebaseRealtime,
  TransferResult,
} from './firebaseSyncEngine.ts';

export interface FctDocument {
  id: string;
  title: string;
  category: string;
  categoryLabel?: string;
  fileUrl: string;
  uploadedAt?: string;
  updatedAt?: string;
  size?: string;
  type?: 'PDF' | 'IMG' | 'DOC' | 'OTHER';
  isPrivate?: boolean;
  author?: string;
  expiryDate?: string;
  notes?: string;
  relatedModule?: AppModule | string;
  relatedEntityId?: string;
  relatedEntityName?: string;
  relatedVehicleId?: string;
  relatedDriverId?: string;
  relatedContractId?: string;
  relatedInvoiceId?: string;
  relatedCustomerId?: string;
  relatedPartId?: string;
  relatedSaleId?: string;
  relatedCashMovementId?: string;
}

export const initialDocuments: FctDocument[] = [];

export interface DatabaseState {
  settings: AgencySettings;
  users: UserProfile[];
  rolePermissions: Record<UserRole, Record<AppModule, PermissionAction[]>>;
  securityAuditLogs: SecurityAuditEvent[];
  vehicles: Vehicle[];
  customers: Customer[];
  leads: CrmLead[];
  contracts: RentalContract[];
  reservations: Reservation[];
  sales: SaleOrder[];
  invoices: Invoice[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  stock: StockItem[];
  stockMovements: StockMovement[];
  maintenance: MaintenanceRecord[];
  drivers: Driver[];
  documents: FctDocument[];
  auditLogs: AuditLog[];
  syncQueue: SyncQueueItem[];
  isOnline: boolean;
  documentCounters: Record<string, number>;
}

function loadInitialState(): DatabaseState {
  return {
    settings: initialSettings,
    users: initialUsers,
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    securityAuditLogs: [
      {
        id: 'sec_aud_init',
        timestamp: new Date().toISOString(),
        performedById: 'usr_superadmin',
        performedByName: 'Directeur Systèmes (Super Admin)',
        performedByRole: 'super_admin',
        actionType: 'ROLE_PERMISSIONS_UPDATE',
        summary: 'Initialisation de la matrice de permissions RBAC FCT (8 rôles x 18 modules)',
      },
    ],
    vehicles: initialVehicles,
    customers: initialCustomers,
    leads: initialLeads,
    contracts: initialContracts,
    reservations: initialReservations,
    sales: initialSales,
    invoices: initialInvoices,
    cashSessions: [initialCashSession],
    cashMovements: initialCashMovements,
    stock: initialStock,
    stockMovements: initialStockMovements,
    maintenance: initialMaintenance,
    drivers: initialDrivers,
    documents: initialDocuments,
    auditLogs: [
      {
        id: 'aud_init_1',
        timestamp: new Date().toISOString(),
        userId: 'usr_superadmin',
        userName: 'Directeur Systèmes (Super Admin)',
        userRole: 'super_admin',
        action: 'CREATE',
        module: 'settings',
        recordId: 'init',
        details: 'Initialisation de la base FCT Automobile Douala',
        idempotencyKey: 'idemp-init-001',
      },
    ],
    syncQueue: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    documentCounters: {
      CTR: 35,
      FAC: 106,
      REC: 247,
      COM: 13,
      RES: 90,
      MNT: 46,
      CS: 55,
    },
  };
}

class DatabaseStore {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();
  private currentUser: UserProfile | null = null; // Strictement nul par défaut tant que non authentifié

  public get actor(): { id: string; fullName: string; role: UserRole } {
    return {
      id: this.currentUser?.id || 'usr_superadmin',
      fullName: this.currentUser?.fullName || 'Direction FCT',
      role: this.currentUser?.role || ('super_admin' as UserRole),
    };
  }
  private isFirebaseInitialized = false;
  private unsubscribeRealtime?: () => void;

  constructor() {
    // 1. Purge complète du LocalStorage (remplacé par Firebase Local)
    clearAllLocalStorage();

    // 2. Initialisation de l'état en mémoire
    this.state = loadInitialState();

    // 3. Gestionnaires d'état réseau et synchronisation
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.state.isOnline = true;
        this.triggerSync();
        this.notify();
      });

      window.addEventListener('offline', () => {
        this.state.isOnline = false;
        this.notify();
      });

      // 4. Initialisation du cache local et écouteurs Firestore
      this.initFirebasePersistence();
    }
  }

  private async initFirebasePersistence() {
    try {
      // Hydratation depuis Firebase (IndexedDB local cache ou Cloud)
      const firebaseData = await loadAllFromFirebase();
      if (firebaseData && Object.keys(firebaseData).length > 0) {
        this.state = {
          ...this.state,
          ...firebaseData,
        };
        this.notify();
        console.info('[FCT Store] Données synchronisées depuis Firebase avec succès.');
      } else {
        // Premier lancement sans données dans Firebase : amorçage automatique
        console.info('[FCT Store] Première initialisation : transfert automatique du dataset vers Firebase...');
        transferAllDataToFirebase(this.state).catch((e) => console.warn('Amorçage Firebase différé :', e));
      }

      // Écouteur en temps réel pour synchronisation collaborative multi-onglets / multi-utilisateurs
      this.unsubscribeRealtime = listenToFirebaseRealtime((partial) => {
        this.state = {
          ...this.state,
          ...partial,
        };
        this.notify();
      });

      this.isFirebaseInitialized = true;
    } catch (err) {
      console.warn('[FCT Store] Initialisation Firebase différée :', err);
    }
  }

  private notify() {
    // Plus de sauvegarde dans LocalStorage ! Le stockage est désormais géré par Firebase.
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getCurrentUser(): UserProfile {
    if (this.currentUser) return this.currentUser;
    return this.state.users[0] || {
      id: 'usr_superadmin',
      fullName: 'Directeur Systèmes (Super Admin)',
      email: 'admin@fct-automobile.cm',
      role: 'super_admin' as UserRole,
      agencyId: 'agency_douala_bonanjo',
      phone: '+237 699 00 00 01',
      department: 'Direction',
      isActive: true,
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
  }

  public getAuthenticatedUser(): UserProfile | null {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile | null) {
    this.currentUser = user;
    this.notify();
  }

  // --- GESTION DES UTILISATEURS, RÔLES & PERMISSIONS ---

  public getUsers(): UserProfile[] {
    return this.state.users;
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getRolePermissionsMatrix(): Record<UserRole, Record<AppModule, PermissionAction[]>> {
    return this.state.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
  }

  public getSecurityAuditLogs(): SecurityAuditEvent[] {
    return this.state.securityAuditLogs || [];
  }

  public addSecurityAuditEvent(
    event: Omit<SecurityAuditEvent, 'id' | 'timestamp' | 'performedById' | 'performedByName' | 'performedByRole'>
  ): SecurityAuditEvent {
    const newEvent: SecurityAuditEvent = {
      ...event,
      id: `sec_aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      performedById: this.actor.id,
      performedByName: this.actor.fullName,
      performedByRole: this.actor.role,
    };
    if (!this.state.securityAuditLogs) this.state.securityAuditLogs = [];
    this.state.securityAuditLogs.unshift(newEvent);
    this.notify();
    return newEvent;
  }

  public updateRolePermissions(
    role: UserRole,
    permissions: Record<AppModule, PermissionAction[]>,
    reason?: string
  ): void {
    if (this.actor.role !== 'super_admin' && this.actor.role !== 'director') {
      this.addSecurityAuditEvent({
        actionType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        summary: `Tentative non autorisée de modification de la matrice RBAC pour le rôle "${role}" par ${this.actor.fullName}`,
        details: 'Opération rejetée : privilèges insuffisants.',
      });
      throw new Error('Privilèges insuffisants pour modifier les permissions des rôles.');
    }

    if (!this.state.rolePermissions) {
      this.state.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    }
    this.state.rolePermissions[role] = { ...permissions };

    this.addSecurityAuditEvent({
      actionType: 'ROLE_PERMISSIONS_UPDATE',
      targetRole: role,
      summary: `Mise à jour de la matrice de permissions pour le rôle "${role}" par ${this.actor.fullName}`,
      details: reason || 'Modification enregistrée via la matrice granulaire RBAC.',
    });

    this.createAuditLog(
      'UPDATE',
      'users',
      role,
      `Mise à jour des permissions du rôle ${role}`,
      reason
    );

    this.notify();
  }

  public resetRolePermissionsToDefault(role?: UserRole): void {
    if (this.actor.role !== 'super_admin') {
      throw new Error('Seul un Super Administrateur peut réinitialiser la matrice de permissions.');
    }

    if (!this.state.rolePermissions) {
      this.state.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    }

    if (role) {
      this.state.rolePermissions[role] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role]));
      this.addSecurityAuditEvent({
        actionType: 'ROLE_PERMISSIONS_UPDATE',
        targetRole: role,
        summary: `Réinitialisation aux valeurs par défaut des permissions du rôle "${role}"`,
      });
    } else {
      this.state.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
      this.addSecurityAuditEvent({
        actionType: 'ROLE_PERMISSIONS_UPDATE',
        summary: 'Réinitialisation globale de la matrice RBAC pour tous les rôles aux valeurs par défaut FCT',
      });
    }

    this.notify();
  }

  public addUser(
    userData: Omit<UserProfile, 'id' | 'createdAt' | 'createdById' | 'createdByName'> & {
      overrides?: UserPermissionOverrides;
    }
  ): UserProfile {
    // Contrôle d'autorité : Seuls super_admin et director peuvent créer/inviter des comptes
    if (this.actor.role !== 'super_admin' && this.actor.role !== 'director') {
      throw new Error('Privilèges insuffisants : Seul un Super Administrateur ou Directeur peut créer un compte.');
    }

    // Un directeur ne peut pas créer un Super Administrateur
    if (userData.role === 'super_admin' && this.actor.role !== 'super_admin') {
      throw new Error('Privilèges insuffisants : Seul un Super Administrateur peut créer un autre Super Administrateur.');
    }

    // Normalisation de l'e-mail
    const normalizedEmail = (userData.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Une adresse e-mail professionnelle valide est requise.');
    }

    // Vérification stricte anti-doublon
    const existing = this.state.users.find((u) => u.email.trim().toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error(`Un compte utilisateur avec l'adresse e-mail "${normalizedEmail}" existe déjà.`);
    }

    const newUser: UserProfile = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: normalizedEmail,
      fullName:
        userData.fullName ||
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
        normalizedEmail.split('@')[0],
      status: userData.status || 'ACTIVE',
      isActive: userData.status === 'ACTIVE' || userData.status === 'INVITED',
      createdAt: new Date().toISOString(),
      createdById: this.actor.id,
      createdByName: this.actor.fullName,
      permissionsOverrides: userData.permissionsOverrides || userData.overrides,
    };

    this.state.users.unshift(newUser);

    this.addSecurityAuditEvent({
      actionType: newUser.status === 'INVITED' ? 'USER_INVITE' : 'USER_CREATE',
      targetUserId: newUser.id,
      targetUserName: newUser.fullName,
      targetRole: newUser.role,
      summary: `Création du compte utilisateur "${newUser.fullName}" (${newUser.role}) par ${this.actor.fullName}`,
      details: `Email: ${newUser.email}, Statut initial: ${newUser.status}`,
    });

    this.createAuditLog(
      'CREATE',
      'users',
      newUser.id,
      `Création collaborateur ${newUser.fullName} (${newUser.email}) - Rôle: ${newUser.role}`
    );

    this.mirrorToFirestore('users', newUser.id, newUser);
    this.notify();
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<UserProfile>, reason?: string): UserProfile {
    const idx = this.state.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('Utilisateur introuvable');
    const target = this.state.users[idx];

    // Protection essentielle : Ne jamais désactiver ou rétrograder le dernier super_admin actif
    if (target.role === 'super_admin' && (target.isActive || target.status === 'ACTIVE')) {
      const otherActiveSuperAdmins = this.state.users.filter(
        (u) => u.id !== userId && u.role === 'super_admin' && u.isActive && u.status === 'ACTIVE'
      );
      if (otherActiveSuperAdmins.length === 0) {
        if (updates.role && updates.role !== 'super_admin') {
          throw new Error('Action impossible : vous ne pouvez pas rétrograder le dernier Super Administrateur actif du système.');
        }
        if (updates.isActive === false || updates.status === 'DISABLED' || updates.status === 'SUSPENDED') {
          throw new Error('Action impossible : vous ne pouvez pas désactiver ou suspendre le dernier Super Administrateur actif du système.');
        }
      }
    }

    // Un utilisateur non super_admin ne peut pas promouvoir en super_admin
    if (updates.role && updates.role !== target.role) {
      if (this.actor.role !== 'super_admin' && updates.role === 'super_admin') {
        throw new Error('Seul un Super Administrateur peut promouvoir un utilisateur au rôle Super Administrateur.');
      }
    }

    // Normalisation si email modifié et vérification anti-doublon
    if (updates.email) {
      const newEmail = updates.email.trim().toLowerCase();
      const duplicate = this.state.users.find((u) => u.id !== userId && u.email.trim().toLowerCase() === newEmail);
      if (duplicate) {
        throw new Error(`L'adresse e-mail "${newEmail}" est déjà attribuée à un autre compte.`);
      }
      updates.email = newEmail;
    }

    this.state.users[idx] = {
      ...this.state.users[idx],
      ...updates,
      isActive: updates.status ? (updates.status === 'ACTIVE' || updates.status === 'INVITED') : (updates.isActive ?? this.state.users[idx].isActive),
    };

    this.addSecurityAuditEvent({
      actionType: updates.role && updates.role !== target.role ? 'ROLE_CHANGE' : 'USER_UPDATE',
      targetUserId: target.id,
      targetUserName: target.fullName,
      targetRole: updates.role || target.role,
      summary: `Mise à jour du compte de "${target.fullName}" par ${this.actor.fullName}`,
      details: reason || 'Modification des informations ou du rôle utilisateur.',
    });

    this.createAuditLog(
      'UPDATE',
      'users',
      userId,
      `Modification collaborateur ${target.fullName}`,
      reason
    );

    this.mirrorToFirestore('users', userId, this.state.users[idx]);
    this.notify();
    return this.state.users[idx];
  }

  public upsertUser(user: UserProfile): void {
    const normEmail = (user.email || '').trim().toLowerCase();
    const idx = this.state.users.findIndex(
      (u) => (user.id && u.id === user.id) || (normEmail && u.email.trim().toLowerCase() === normEmail)
    );
    if (idx >= 0) {
      this.state.users[idx] = { ...this.state.users[idx], ...user };
    } else {
      this.state.users.unshift(user);
    }
    this.notify();
  }

  public toggleUserStatus(userId: string, newStatus: UserAccountStatus, reason?: string): UserProfile {
    return this.updateUser(userId, { status: newStatus, isActive: newStatus === 'ACTIVE' || newStatus === 'INVITED' }, reason);
  }

  public updateUserOverrides(userId: string, overrides: UserPermissionOverrides, reason?: string): UserProfile {
    const idx = this.state.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('Utilisateur introuvable');
    const target = this.state.users[idx];

    // Vérification de sécurité : Seul super_admin ou director
    if (this.actor.role !== 'super_admin' && this.actor.role !== 'director') {
      throw new Error('Privilèges insuffisants pour modifier les exceptions individuelles.');
    }

    this.state.users[idx] = {
      ...target,
      permissionsOverrides: overrides,
    };

    this.addSecurityAuditEvent({
      actionType: 'USER_OVERRIDE_UPDATE',
      targetUserId: target.id,
      targetUserName: target.fullName,
      targetRole: target.role,
      summary: `Modification des exceptions de droits individuels pour "${target.fullName}" par ${this.actor.fullName}`,
      details: reason || 'Application des surcharges (allow/deny) spécifiques à l’utilisateur.',
    });

    this.createAuditLog(
      'UPDATE',
      'users',
      userId,
      `Modification des surcharges de permissions pour ${target.fullName}`,
      reason
    );

    this.mirrorToFirestore('users', userId, this.state.users[idx]);
    this.notify();
    return this.state.users[idx];
  }

  public getEffectiveUserPermissions(userId: string): Record<AppModule, PermissionAction[]> {
    const user = this.getUserById(userId);
    if (!user) throw new Error('Utilisateur introuvable');
    return calculateEffectivePermissions(user, this.state.rolePermissions);
  }

  public setOnlineStatus(online: boolean) {
    this.state.isOnline = online;
    if (online) {
      this.triggerSync();
    } else {
      this.notify();
    }
  }

  // Idempotency Key & Audit Helper
  private createAuditLog(
    action: AuditLog['action'],
    module: AuditLog['module'],
    recordId: string,
    details: string,
    reason?: string
  ) {
    const idempKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: this.actor.id,
      userName: this.actor.fullName,
      userRole: this.actor.role,
      action,
      module,
      recordId,
      details,
      reason,
      idempotencyKey: idempKey,
    };
    this.state.auditLogs.unshift(log);

    // Ajouter à la file Outbox pour synchronisation serveur
    const queueItem: SyncQueueItem = {
      id: `queue_${Date.now()}`,
      idempotencyKey: idempKey,
      entityType: module,
      entityId: recordId,
      action: action === 'CREATE' ? 'CREATE' : action === 'DELETE' ? 'DELETE' : 'UPDATE',
      payload: { recordId, details },
      status: this.state.isOnline ? 'SYNCED' : 'PENDING',
      version: 1,
      localTimestamp: new Date().toISOString(),
      serverConfirmedTimestamp: this.state.isOnline ? new Date().toISOString() : undefined,
    };
    this.state.syncQueue.unshift(queueItem);
    indexedDbService.saveOutboxItem(queueItem).catch(() => {});
  }

  // Synchronisation avec Cloud Firestore
  public async mirrorToFirestore(collectionName: string, docId: string, data: any) {
    if (!this.state.isOnline) return;
    try {
      await setDoc(doc(db, collectionName, docId), {
        ...data,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    }
    if (collectionName === 'vehicles') {
      await this.syncPublicVehicle(data as Vehicle);
    }
  }

  // Suppression dans Cloud Firestore
  public async deleteFromFirestore(collectionName: string, docId: string) {
    if (!this.state.isOnline) return;
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
    }
    if (collectionName === 'vehicles') {
      await this.unpublishPublicVehicle(docId);
    }
  }

  // Catalogue public (site web) : projection assainie, publiée uniquement si disponible
  private async syncPublicVehicle(vehicle: Vehicle) {
    if (!vehicle || !vehicle.id) return;
    if (!isVehiclePublishable(vehicle)) {
      await this.unpublishPublicVehicle(vehicle.id);
      return;
    }
    try {
      await setDoc(doc(db, PUBLIC_VEHICLES_COLLECTION, vehicle.id), toPublicVehicle(vehicle));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${PUBLIC_VEHICLES_COLLECTION}/${vehicle.id}`);
    }
  }

  private async unpublishPublicVehicle(vehicleId: string) {
    try {
      await deleteDoc(doc(db, PUBLIC_VEHICLES_COLLECTION, vehicleId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${PUBLIC_VEHICLES_COLLECTION}/${vehicleId}`);
    }
  }

  public getSettings(): AgencySettings {
    return this.state.settings || initialSettings;
  }

  public updateSettings(updates: Partial<AgencySettings>, reason?: string): AgencySettings {
    this.state.settings = {
      ...(this.state.settings || initialSettings),
      ...updates,
    };

    const changedKeys = Object.keys(updates).join(', ');
    this.createAuditLog(
      'UPDATE',
      'settings',
      'agency_settings',
      `Mise à jour des paramètres FCT : ${changedKeys}`,
      reason || 'Modification enregistrée via l’onglet Paramètres FCT'
    );

    this.mirrorToFirestore('settings', 'agency_settings', this.state.settings);
    this.notify();
    return this.state.settings;
  }

  public resetSettingsToDefaults(reason?: string): AgencySettings {
    this.state.settings = JSON.parse(JSON.stringify(initialSettings));

    this.createAuditLog(
      'UPDATE',
      'settings',
      'agency_settings',
      'Réinitialisation complète des paramètres aux valeurs par défaut officielles FCT',
      reason || 'Rétablissement des valeurs certifiées d’usine'
    );

    this.mirrorToFirestore('settings', 'agency_settings', this.state.settings);
    this.notify();
    return this.state.settings;
  }

  // --- SAUVEGARDE & RESTAURATION INTÉGRALE ---

  public exportDatabaseBackup(): string {
    const backupData = {
      app: 'FCT_ERP_CRM_AUTOMOBILE_DOUALA',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: this.actor.id,
        name: this.actor.fullName,
        role: this.actor.role,
      },
      settings: this.state.settings,
      rolePermissions: this.state.rolePermissions,
      vehicles: this.state.vehicles,
      customers: this.state.customers,
      contracts: this.state.contracts,
      reservations: this.state.reservations,
      sales: this.state.sales,
      invoices: this.state.invoices,
      cashSessions: this.state.cashSessions,
      cashMovements: this.state.cashMovements,
      stock: this.state.stock,
      stockMovements: this.state.stockMovements,
      maintenance: this.state.maintenance,
      drivers: this.state.drivers,
      leads: this.state.leads,
      documents: this.state.documents,
      documentCounters: this.state.documentCounters,
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importDatabaseBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.vehicles || !parsed.contracts || !parsed.settings) {
        throw new Error('Fichier de sauvegarde invalide : structures obligatoires manquantes.');
      }

      this.state.settings = { ...initialSettings, ...(parsed.settings || {}) };
      if (Array.isArray(parsed.vehicles)) this.state.vehicles = parsed.vehicles;
      if (Array.isArray(parsed.customers)) this.state.customers = parsed.customers;
      if (Array.isArray(parsed.contracts)) this.state.contracts = parsed.contracts;
      if (Array.isArray(parsed.reservations)) this.state.reservations = parsed.reservations;
      if (Array.isArray(parsed.sales)) this.state.sales = parsed.sales;
      if (Array.isArray(parsed.invoices)) this.state.invoices = parsed.invoices;
      if (Array.isArray(parsed.cashSessions)) this.state.cashSessions = parsed.cashSessions;
      if (Array.isArray(parsed.cashMovements)) this.state.cashMovements = parsed.cashMovements;
      if (Array.isArray(parsed.stock)) this.state.stock = parsed.stock;
      if (Array.isArray(parsed.stockMovements)) this.state.stockMovements = parsed.stockMovements;
      if (Array.isArray(parsed.maintenance)) this.state.maintenance = parsed.maintenance;
      if (Array.isArray(parsed.drivers)) this.state.drivers = parsed.drivers;
      if (Array.isArray(parsed.leads)) this.state.leads = parsed.leads;
      if (Array.isArray(parsed.documents)) this.state.documents = parsed.documents;
      if (parsed.rolePermissions) this.state.rolePermissions = parsed.rolePermissions;
      if (parsed.documentCounters) this.state.documentCounters = parsed.documentCounters;

      this.createAuditLog(
        'UPDATE',
        'settings',
        'database_restore',
        `Restauration complète de la base de données effectuée par ${this.actor.fullName}`,
        'Import d’une sauvegarde JSON certifiée'
      );

      this.notify();
      return { success: true, message: 'Base de données FCT restaurée avec succès.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur lors de l’importation de la sauvegarde' };
    }
  }

  public getNextDocNumber(prefix: string): string {
    const current = this.state.documentCounters[prefix] || 1;
    this.state.documentCounters[prefix] = current + 1;
    const year = this.state.settings?.includeYearInDocNumber !== false ? 2026 : null;
    const padDigits = this.state.settings?.numberPaddingDigits || 4;
    return generateDocumentNumber(prefix, current, year, padDigits);
  }

  // --- 1. VÉHICULES ---
  public addVehicle(vehicle: Omit<Vehicle, 'id' | 'documentsCount' | 'updatedAt'> & { documentsCount?: number }): Vehicle {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `veh_${Date.now()}`,
      documentsCount: vehicle.documentsCount ?? 0,
      updatedAt: new Date().toISOString(),
    };
    this.state.vehicles.unshift(newVehicle);
    this.createAuditLog('CREATE', 'vehicles', newVehicle.id, `Création véhicule ${newVehicle.brand} ${newVehicle.model} (${newVehicle.licensePlate})`);
    this.mirrorToFirestore('vehicles', newVehicle.id, newVehicle);
    this.notify();
    return newVehicle;
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle {
    const idx = this.state.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Véhicule introuvable');
    const updated = {
      ...this.state.vehicles[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.vehicles = this.state.vehicles.map((v) => (v.id === id ? updated : v));
    this.createAuditLog('UPDATE', 'vehicles', id, `Mise à jour véhicule ${updated.licensePlate}`);
    this.mirrorToFirestore('vehicles', id, updated);
    this.notify();
    return updated;
  }

  public deleteVehicle(id: string, reason?: string): boolean {
    const target = this.state.vehicles.find((v) => v.id === id);
    if (!target) throw new Error('Véhicule introuvable');

    // Sécurité DMS : vérifier si le véhicule est en cours de location
    const activeContract = this.state.contracts.find(
      (c) => c.vehicleId === id && (c.status === 'ACTIVE' || c.status === 'CONFIRMED')
    );
    if (activeContract) {
      throw new Error(
        `Impossible de supprimer : le véhicule ${target.licensePlate} est lié au contrat actif ${activeContract.contractNumber}. Clôturez ou annulez d'abord ce contrat.`
      );
    }

    this.state.vehicles = this.state.vehicles.filter((v) => v.id !== id);
    this.createAuditLog(
      'DELETE',
      'vehicles',
      id,
      `Suppression véhicule ${target.brand} ${target.model} (${target.licensePlate})`,
      reason || 'Suppression manuelle depuis l’interface'
    );
    this.deleteFromFirestore('vehicles', id);
    this.notify();
    return true;
  }

  // --- 2. CLIENTS ---
  public addCustomer(customer: Omit<Customer, 'id' | 'totalRentalsCount' | 'totalSpentXAF' | 'createdAt'>): Customer {
    const newCust: Customer = {
      ...customer,
      id: `cust_${Date.now()}`,
      totalRentalsCount: 0,
      totalSpentXAF: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.state.customers.unshift(newCust);
    this.createAuditLog('CREATE', 'crm', newCust.id, `Nouveau client ${newCust.fullName}`);
    this.mirrorToFirestore('customers', newCust.id, newCust);
    this.notify();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const idx = this.state.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Client introuvable');
    const updated = {
      ...this.state.customers[idx],
      ...updates,
    };
    this.state.customers = this.state.customers.map((c) => (c.id === id ? updated : c));
    this.createAuditLog('UPDATE', 'crm', id, `Mise à jour fiche client ${updated.fullName}`);
    this.mirrorToFirestore('customers', id, updated);
    this.notify();
    return updated;
  }

  public deleteCustomer(id: string, reason?: string): boolean {
    const target = this.state.customers.find((c) => c.id === id);
    if (!target) throw new Error('Client introuvable');

    // Vérifier si le client a des contrats actifs
    const activeContracts = this.state.contracts.filter(
      (c) => c.customerId === id && (c.status === 'ACTIVE' || c.status === 'CONFIRMED')
    );
    if (activeContracts.length > 0) {
      throw new Error(
        `Impossible de supprimer : ce client a ${activeContracts.length} contrat(s) en cours de validité.`
      );
    }

    this.state.customers = this.state.customers.filter((c) => c.id !== id);
    this.createAuditLog(
      'DELETE',
      'crm',
      id,
      `Suppression fiche client ${target.fullName} (${target.companyName || 'Particulier'})`,
      reason || 'Suppression du répertoire'
    );
    this.deleteFromFirestore('customers', id);
    this.notify();
    return true;
  }

  // --- 3. LOCATIONS & CONTRATS ---
  public createContract(contractData: {
    customerId: string;
    vehicleId: string;
    startDate: string;
    endDate: string;
    dailyRateXAF: number;
    securityDepositXAF: number;
    driverIncluded: boolean;
    driverId?: string;
    relatedReservationId?: string;
    initialPaidAmountXAF?: number;
  }): RentalContract {
    const vehicle = this.state.vehicles.find((v) => v.id === contractData.vehicleId);
    const customer = this.state.customers.find((c) => c.id === contractData.customerId);
    if (!vehicle) throw new Error('Véhicule introuvable');
    if (!customer) throw new Error('Client introuvable');

    // Contrôle d'opérabilité du véhicule
    const opCheck = validateVehicleOperationalState(vehicle, 'RENTAL');
    if (!opCheck.allowed) {
      throw new Error(opCheck.reason);
    }

    // Contrôle strict anti-chevauchement des dates (sur contrats ET réservations existantes)
    const availCheck = checkVehicleAvailability(
      vehicle.id,
      contractData.startDate,
      contractData.endDate,
      this.state.contracts,
      undefined,
      this.state.reservations,
      contractData.relatedReservationId
    );
    if (!availCheck.isAvailable) {
      throw new Error(availCheck.conflictReason || 'Véhicule indisponible pour cette période.');
    }

    const contractNumber = this.getNextDocNumber('CTR');
    const start = new Date(contractData.startDate).getTime();
    const end = new Date(contractData.endDate).getTime();
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalAmount = diffDays * contractData.dailyRateXAF;
    const initialPaid = contractData.initialPaidAmountXAF || 0;

    const driver = contractData.driverId ? this.state.drivers.find((d) => d.id === contractData.driverId) : undefined;

    const contract: RentalContract = {
      id: `ctr_${Date.now()}`,
      contractNumber,
      customerId: customer.id,
      customerName: customer.companyName || customer.fullName,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
      licensePlate: vehicle.licensePlate,
      startDate: contractData.startDate,
      endDate: contractData.endDate,
      dailyRateXAF: contractData.dailyRateXAF,
      totalDays: diffDays,
      totalAmountXAF: totalAmount,
      securityDepositXAF: contractData.securityDepositXAF,
      depositReturnedXAF: 0,
      paidAmountXAF: initialPaid,
      remainingAmountXAF: Math.max(0, totalAmount - initialPaid),
      driverIncluded: contractData.driverIncluded,
      driverId: driver?.id,
      driverName: driver?.fullName,
      relatedReservationId: contractData.relatedReservationId,
      status: 'CONFIRMED',
      penaltiesXAF: 0,
      createdById: this.actor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Marquer le véhicule comme loué
    this.updateVehicle(vehicle.id, { status: 'RENTED' });
    if (driver) {
      const dIdx = this.state.drivers.findIndex((d) => d.id === driver.id);
      if (dIdx !== -1) {
        this.state.drivers[dIdx].status = 'ON_TRIP';
        this.state.drivers[dIdx].currentAssignedVehicleId = vehicle.id;
      }
    }

    // Création automatique de la facture correspondante
    const invoiceNumber = this.getNextDocNumber('FAC');
    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      type: 'INVOICE',
      customerId: customer.id,
      customerName: customer.companyName || customer.fullName,
      customerAddress: customer.address,
      customerNiu: customer.taxNumber,
      items: [
        {
          description: `Location véhicule automobile ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) - ${diffDays} jour(s)`,
          quantity: diffDays,
          unitPriceXAF: contractData.dailyRateXAF,
          totalXAF: totalAmount,
        },
      ],
      subtotalXAF: totalAmount,
      taxAmountXAF: 0,
      totalAmountXAF: totalAmount,
      paidAmountXAF: initialPaid,
      balanceXAF: Math.max(0, totalAmount - initialPaid),
      status: initialPaid >= totalAmount ? 'PAID' : initialPaid > 0 ? 'PARTIALLY_PAID' : 'ISSUED',
      relatedContractId: contract.id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: contractData.endDate,
      createdById: this.actor.id,
      createdAt: new Date().toISOString(),
    };
    this.state.invoices.unshift(invoice);

    this.state.contracts.unshift(contract);
    this.createAuditLog('CREATE', 'rentals', contract.id, `Création contrat ${contract.contractNumber} (${contract.totalAmountXAF} XAF)`);
    this.mirrorToFirestore('rental_contracts', contract.id, contract);
    this.mirrorToFirestore('invoices', invoice.id, invoice);
    this.notify();
    return contract;
  }

  /**
   * Conversion d'une réservation en contrat de location officiel
   * - Réutilise le client et le véhicule existants
   * - Réutilise les dates et tarifs
   * - Transfère l'acompte de réservation sur le contrat sans le compter deux fois
   * - Évite les doublons et met à jour le statut de la réservation
   */
  public convertReservationToContract(
    reservationId: string,
    options?: { driverIncluded?: boolean; driverId?: string }
  ): RentalContract {
    const res = this.state.reservations.find((r) => r.id === reservationId);
    if (!res) throw new Error('Réservation introuvable');
    if (res.status === 'CONVERTED') throw new Error('Cette réservation a déjà été convertie en contrat.');
    if (res.status === 'CANCELLED') throw new Error('Impossible de convertir une réservation annulée.');

    const vehicle = this.state.vehicles.find((v) => v.id === res.vehicleId);
    if (!vehicle) throw new Error('Véhicule lié à la réservation introuvable.');

    const contract = this.createContract({
      customerId: res.customerId,
      vehicleId: res.vehicleId,
      startDate: res.startDate,
      endDate: res.endDate,
      dailyRateXAF: vehicle.rentalDailyRate,
      securityDepositXAF: vehicle.securityDepositRate,
      driverIncluded: options?.driverIncluded ?? false,
      driverId: options?.driverId,
      relatedReservationId: res.id,
      initialPaidAmountXAF: res.advanceDepositXAF, // Acompte transféré
    });

    res.status = 'CONVERTED';
    res.convertedContractId = contract.id;
    this.createAuditLog(
      'UPDATE',
      'reservations',
      res.id,
      `Réservation ${res.reservationNumber} convertie avec succès en contrat ${contract.contractNumber} (Acompte reporté : ${res.advanceDepositXAF} XAF)`
    );
    this.notify();
    return contract;
  }

  // Départ / Inspection Check-in
  public checkInDeparture(contractId: string, inspection: NonNullable<RentalContract['inspectionDepart']>) {
    const contract = this.state.contracts.find((c) => c.id === contractId);
    if (!contract) throw new Error('Contrat introuvable');
    contract.inspectionDepart = inspection;
    contract.status = 'ACTIVE';
    contract.updatedAt = new Date().toISOString();
    this.createAuditLog('UPDATE', 'rentals', contractId, `Check-in départ contrat ${contract.contractNumber}`);
    this.notify();
  }

  // Retour / Restitution Check-out
  public checkOutReturn(
    contractId: string,
    inspection: NonNullable<RentalContract['inspectionRetour']>,
    penaltiesXAF = 0,
    penaltyReason?: string
  ) {
    const contract = this.state.contracts.find((c) => c.id === contractId);
    if (!contract) throw new Error('Contrat introuvable');

    contract.inspectionRetour = inspection;
    contract.actualReturnDate = new Date().toISOString().split('T')[0];
    contract.status = 'RETURNED';
    contract.penaltiesXAF = penaltiesXAF;
    contract.penaltyReason = penaltyReason;
    contract.depositReturnedXAF = Math.max(0, contract.securityDepositXAF - penaltiesXAF);
    contract.updatedAt = new Date().toISOString();

    // Libérer le véhicule
    this.updateVehicle(contract.vehicleId, {
      status: 'AVAILABLE',
      mileage: inspection.mileage,
    });

    // Libérer le chauffeur si présent
    if (contract.driverId) {
      const dIdx = this.state.drivers.findIndex((d) => d.id === contract.driverId);
      if (dIdx !== -1) {
        this.state.drivers[dIdx].status = 'AVAILABLE';
        this.state.drivers[dIdx].currentAssignedVehicleId = undefined;
      }
    }

    this.createAuditLog('UPDATE', 'rentals', contractId, `Restitution véhicule contrat ${contract.contractNumber} (Pénalités: ${penaltiesXAF} XAF)`);
    this.mirrorToFirestore('rental_contracts', contractId, contract);
    this.notify();
  }

  // Annulation ou Modification de Contrat
  public updateContract(id: string, updates: Partial<RentalContract>): RentalContract {
    const idx = this.state.contracts.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Contrat introuvable');
    const updated = {
      ...this.state.contracts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.contracts = this.state.contracts.map((c) => (c.id === id ? updated : c));
    this.createAuditLog('UPDATE', 'rentals', id, `Modification contrat ${updated.contractNumber}`);
    this.mirrorToFirestore('rental_contracts', id, updated);
    this.notify();
    return updated;
  }

  public cancelContract(id: string, reason: string): RentalContract {
    const contract = this.state.contracts.find((c) => c.id === id);
    if (!contract) throw new Error('Contrat introuvable');

    const updated = {
      ...contract,
      status: 'CANCELLED' as const,
      penaltyReason: reason,
      updatedAt: new Date().toISOString(),
    };
    this.state.contracts = this.state.contracts.map((c) => (c.id === id ? updated : c));

    // Libérer le véhicule
    this.updateVehicle(contract.vehicleId, { status: 'AVAILABLE' });

    // Libérer le chauffeur si présent
    if (contract.driverId) {
      this.state.drivers = this.state.drivers.map((d) =>
        d.id === contract.driverId
          ? { ...d, status: 'AVAILABLE', currentAssignedVehicleId: undefined }
          : d
      );
    }

    this.createAuditLog('UPDATE', 'rentals', id, `Annulation contrat ${updated.contractNumber}`, reason);
    this.mirrorToFirestore('rental_contracts', id, updated);
    this.notify();
    return updated;
  }

  // --- 4. RÉSERVATIONS ---
  public addReservation(res: Omit<Reservation, 'id' | 'reservationNumber' | 'createdAt'>): Reservation {
    const vehicle = this.state.vehicles.find((v) => v.id === res.vehicleId);
    if (!vehicle) throw new Error('Véhicule introuvable');
    const customer = this.state.customers.find((c) => c.id === res.customerId);
    if (!customer) throw new Error('Client introuvable');

    // Contrôle d'opérabilité du véhicule
    const opCheck = validateVehicleOperationalState(vehicle, 'RENTAL');
    if (!opCheck.allowed) {
      throw new Error(opCheck.reason);
    }

    // Contrôle strict de disponibilité
    const availCheck = checkVehicleAvailability(
      vehicle.id,
      res.startDate,
      res.endDate,
      this.state.contracts,
      undefined,
      this.state.reservations
    );
    if (!availCheck.isAvailable) {
      throw new Error(availCheck.conflictReason || 'Véhicule déjà réservé ou sous contrat pour cette période.');
    }

    const reservationNumber = this.getNextDocNumber('RES');
    const newRes: Reservation = {
      ...res,
      id: `res_${Date.now()}`,
      reservationNumber,
      status: res.status || 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    this.state.reservations.unshift(newRes);

    // Enregistrement de l'acompte de réservation en caisse si session ouverte
    const activeSession = this.getActiveCashSession();
    if (newRes.advanceDepositXAF > 0 && activeSession) {
      this.recordCashMovement({
        sessionId: activeSession.id,
        type: 'INFLOW',
        category: 'DEPOSIT_IN',
        amountXAF: newRes.advanceDepositXAF,
        receivedFromOrPaidTo: newRes.customerName,
        relatedCustomerId: newRes.customerId,
        reason: `Acompte réservation ${newRes.reservationNumber} (${newRes.vehicleName})`,
      });
    }

    this.createAuditLog('CREATE', 'reservations', newRes.id, `Nouvelle réservation ${newRes.reservationNumber}`);
    this.mirrorToFirestore('reservations', newRes.id, newRes);
    this.notify();
    return newRes;
  }

  public updateReservation(id: string, updates: Partial<Reservation>): Reservation {
    const res = this.state.reservations.find((r) => r.id === id);
    if (!res) throw new Error('Réservation introuvable');
    const updated = { ...res, ...updates };
    this.state.reservations = this.state.reservations.map((r) => (r.id === id ? updated : r));
    this.createAuditLog('UPDATE', 'reservations', id, `Mise à jour réservation ${updated.reservationNumber}`);
    this.mirrorToFirestore('reservations', id, updated);
    this.notify();
    return updated;
  }

  public deleteReservation(id: string, reason?: string): boolean {
    const target = this.state.reservations.find((r) => r.id === id);
    if (!target) throw new Error('Réservation introuvable');
    this.state.reservations = this.state.reservations.filter((r) => r.id !== id);
    this.createAuditLog('DELETE', 'reservations', id, `Suppression réservation ${target.reservationNumber}`, reason);
    this.deleteFromFirestore('reservations', id);
    this.notify();
    return true;
  }

  public cancelReservation(id: string, reason?: string): Reservation {
    const res = this.state.reservations.find((r) => r.id === id);
    if (!res) throw new Error('Réservation introuvable');
    if (res.status === 'CONVERTED') throw new Error('Impossible d\'annuler une réservation déjà convertie en contrat.');
    if (res.status === 'CANCELLED') throw new Error('Cette réservation est déjà annulée.');
    const updated: Reservation = { ...res, status: 'CANCELLED' };
    this.state.reservations = this.state.reservations.map((r) =>
      r.id === id ? updated : r
    );
    this.createAuditLog('UPDATE', 'reservations', id, `Annulation de la réservation ${res.reservationNumber}${reason ? ` (Motif: ${reason})` : ''}`);
    this.mirrorToFirestore('reservations', id, updated);
    this.notify();
    return updated;
  }

  public updateReservationStatus(id: string, status: Reservation['status']) {
    const res = this.state.reservations.find((r) => r.id === id);
    if (!res) throw new Error('Réservation introuvable');
    const updated = { ...res, status };
    this.state.reservations = this.state.reservations.map((r) =>
      r.id === id ? updated : r
    );
    this.createAuditLog('UPDATE', 'reservations', id, `Statut réservation ${res.reservationNumber} changé en ${status}`);
    this.mirrorToFirestore('reservations', id, updated);
    this.notify();
  }

  // --- 5. VENTES VÉHICULES ---
  public addSaleOrder(sale: Omit<SaleOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): SaleOrder {
    const vehicle = this.state.vehicles.find((v) => v.id === sale.vehicleId);
    if (!vehicle) throw new Error('Véhicule introuvable');
    const customer = this.state.customers.find((c) => c.id === sale.customerId);
    if (!customer) throw new Error('Client introuvable');

    // Contrôle d'opérabilité du véhicule pour la vente
    const opCheck = validateVehicleOperationalState(vehicle, 'SALE');
    if (!opCheck.allowed) {
      throw new Error(opCheck.reason);
    }

    // Empêcher la vente simultanée du même véhicule
    const activeSale = this.state.sales.find(
      (s) => s.vehicleId === sale.vehicleId && (s.stage === 'ORDER' || s.stage === 'SOLD' || s.stage === 'DELIVERED')
    );
    if (activeSale) {
      throw new Error(`Ce véhicule fait déjà l'objet d'une commande ou vente confirmée (${activeSale.orderNumber}).`);
    }

    const orderNumber = this.getNextDocNumber('COM');
    const newSale: SaleOrder = {
      ...sale,
      id: `sale_${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.sales.unshift(newSale);

    // Création automatique de la facture de vente
    const invoiceNumber = this.getNextDocNumber('FAC');
    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      type: 'INVOICE',
      customerId: customer.id,
      customerName: customer.companyName || customer.fullName,
      customerAddress: customer.address,
      customerNiu: customer.taxNumber,
      items: [
        {
          description: `Vente véhicule automobile ${newSale.vehicleName}`,
          quantity: 1,
          unitPriceXAF: newSale.negotiatedPriceXAF,
          totalXAF: newSale.negotiatedPriceXAF,
        },
      ],
      subtotalXAF: newSale.negotiatedPriceXAF,
      taxAmountXAF: 0,
      totalAmountXAF: newSale.negotiatedPriceXAF,
      paidAmountXAF: newSale.paidAmountXAF,
      balanceXAF: Math.max(0, newSale.negotiatedPriceXAF - newSale.paidAmountXAF),
      status: newSale.paidAmountXAF >= newSale.negotiatedPriceXAF ? 'PAID' : newSale.paidAmountXAF > 0 ? 'PARTIALLY_PAID' : 'ISSUED',
      relatedSaleOrderId: newSale.id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      createdById: this.actor.id,
      createdAt: new Date().toISOString(),
    };
    this.state.invoices.unshift(invoice);

    // Si acompte versé et session de caisse ouverte, enregistrer l'encaissement
    const activeSession = this.getActiveCashSession();
    if (newSale.paidAmountXAF > 0 && activeSession) {
      this.recordCashMovement({
        sessionId: activeSession.id,
        type: 'INFLOW',
        category: 'SALE_PAYMENT',
        amountXAF: newSale.paidAmountXAF,
        receivedFromOrPaidTo: newSale.customerName,
        relatedSaleOrderId: newSale.id,
        relatedCustomerId: newSale.customerId,
        reason: `Acompte bon de commande vente ${newSale.orderNumber} (${newSale.vehicleName})`,
      });
    }

    if (newSale.stage === 'SOLD' || newSale.stage === 'DELIVERED') {
      this.updateVehicle(newSale.vehicleId, { status: 'SOLD' });
    }

    this.createAuditLog('CREATE', 'sales', newSale.id, `Nouvelle commande vente ${newSale.orderNumber} (${newSale.negotiatedPriceXAF} XAF)`);
    this.mirrorToFirestore('sales', newSale.id, newSale);
    this.mirrorToFirestore('invoices', invoice.id, invoice);
    this.notify();
    return newSale;
  }

  public updateSaleStage(id: string, stage: SaleOrder['stage']) {
    const sale = this.state.sales.find((s) => s.id === id);
    if (!sale) throw new Error('Vente introuvable');
    sale.stage = stage;
    sale.updatedAt = new Date().toISOString();

    if (stage === 'SOLD' || stage === 'DELIVERED') {
      this.updateVehicle(sale.vehicleId, { status: 'SOLD' });
    }

    this.createAuditLog('UPDATE', 'sales', id, `Vente ${sale.orderNumber} passée à l'étape ${stage}`);
    this.mirrorToFirestore('sales', id, sale);
    this.notify();
  }

  // --- 6. FACTURATION ---
  public addInvoice(inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdById' | 'createdAt'>): Invoice {
    const invoiceNumber = this.getNextDocNumber('FAC');
    const newInvoice: Invoice = {
      ...inv,
      id: `inv_${Date.now()}`,
      invoiceNumber,
      createdById: this.actor.id,
      createdAt: new Date().toISOString(),
    };
    this.state.invoices.unshift(newInvoice);
    this.createAuditLog('CREATE', 'billing', newInvoice.id, `Création facture ${newInvoice.invoiceNumber} (${newInvoice.totalAmountXAF} XAF)`);
    this.mirrorToFirestore('invoices', newInvoice.id, newInvoice);
    this.notify();
    return newInvoice;
  }

  // --- 7. CAISSE CERTIFIÉE EN ESPÈCES (IMMUTABLE) ---
  public getActiveCashSession(): CashSession | undefined {
    return this.state.cashSessions.find((s) => s.status === 'OPEN');
  }

  public openCashSession(openingBalanceXAF: number): CashSession {
    const existing = this.getActiveCashSession();
    if (existing) throw new Error('Une session de caisse est déjà ouverte.');

    const sessionNumber = this.getNextDocNumber('CS');
    const newSession: CashSession = {
      id: `cs_${Date.now()}`,
      sessionNumber,
      openedById: this.actor.id,
      openedByName: this.actor.fullName,
      openedAt: new Date().toISOString(),
      openingBalanceXAF,
      currentCashInXAF: 0,
      currentCashOutXAF: 0,
      calculatedExpectedBalanceXAF: openingBalanceXAF,
      status: 'OPEN',
    };
    this.state.cashSessions.unshift(newSession);
    this.createAuditLog('CREATE', 'cash', newSession.id, `Ouverture session de caisse ${newSession.sessionNumber} avec ${openingBalanceXAF} XAF`);
    this.mirrorToFirestore('cash_sessions', newSession.id, newSession);
    this.notify();
    return newSession;
  }

  public closeCashSession(sessionId: string, countedClosingBalanceXAF: number, notes?: string): CashSession {
    const session = this.state.cashSessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session introuvable');
    if (session.status === 'CLOSED') throw new Error('Session déjà clôturée');

    const expected = session.openingBalanceXAF + session.currentCashInXAF - session.currentCashOutXAF;
    const discrepancy = countedClosingBalanceXAF - expected;

    session.status = 'CLOSED';
    session.closedById = this.actor.id;
    session.closedByName = this.actor.fullName;
    session.closedAt = new Date().toISOString();
    session.countedClosingBalanceXAF = countedClosingBalanceXAF;
    session.calculatedExpectedBalanceXAF = expected;
    session.discrepancyXAF = discrepancy;
    session.closingNotes = notes;

    this.createAuditLog(
      'CLOSE_SESSION',
      'cash',
      session.id,
      `Clôture session caisse ${session.sessionNumber} (Compté: ${countedClosingBalanceXAF} XAF, Ecart: ${discrepancy} XAF)`,
      notes
    );
    this.mirrorToFirestore('cash_sessions', session.id, session);
    this.notify();
    return session;
  }

  /**
   * Enregistrement d'un flux de caisse en espèces.
   * STRICTEMENT IMMUABLE : aucune modification ni suppression en place n'est permise.
   */
  public recordCashMovement(data: {
    sessionId: string;
    type: CashMovement['type'];
    category: CashMovement['category'];
    amountXAF: number;
    receivedFromOrPaidTo: string;
    relatedContractId?: string;
    relatedInvoiceId?: string;
    relatedSaleOrderId?: string;
    relatedCustomerId?: string;
    justificationReceiptUrl?: string;
    reason?: string;
  }): CashMovement {
    const session = this.state.cashSessions.find((s) => s.id === data.sessionId);
    if (!session || session.status !== 'OPEN') {
      throw new Error('Une session de caisse ouverte est obligatoire pour enregistrer un mouvement.');
    }

    const receiptNumber = this.getNextDocNumber('REC');
    const movement: CashMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber,
      sessionId: data.sessionId,
      type: data.type,
      category: data.category,
      amountXAF: data.amountXAF,
      paymentMethod: 'CASH', // Toujours CASH selon spécifications
      receivedFromOrPaidTo: data.receivedFromOrPaidTo,
      relatedContractId: data.relatedContractId,
      relatedInvoiceId: data.relatedInvoiceId,
      relatedSaleOrderId: data.relatedSaleOrderId,
      relatedCustomerId: data.relatedCustomerId,
      justificationReceiptUrl: data.justificationReceiptUrl,
      performedById: this.actor.id,
      performedByName: this.actor.fullName,
      createdAt: new Date().toISOString(),
      isReversal: false,
      reason: data.reason,
    };

    if (data.type === 'INFLOW') {
      session.currentCashInXAF += data.amountXAF;
    } else {
      session.currentCashOutXAF += data.amountXAF;
    }
    session.calculatedExpectedBalanceXAF = session.openingBalanceXAF + session.currentCashInXAF - session.currentCashOutXAF;

    if (data.type === 'INFLOW') {
      // 1. Si lié à un contrat
      if (data.relatedContractId) {
        const contract = this.state.contracts.find((c) => c.id === data.relatedContractId);
        if (contract) {
          contract.paidAmountXAF += data.amountXAF;
          contract.remainingAmountXAF = Math.max(0, contract.totalAmountXAF - contract.paidAmountXAF);
        }
        // Mettre à jour la facture liée au contrat si présente
        const inv = this.state.invoices.find((i) => i.relatedContractId === data.relatedContractId);
        if (inv && inv.id !== data.relatedInvoiceId) {
          inv.paidAmountXAF += data.amountXAF;
          inv.balanceXAF = Math.max(0, inv.totalAmountXAF - inv.paidAmountXAF);
          inv.status = inv.balanceXAF === 0 ? 'PAID' : 'PARTIALLY_PAID';
        }
      }

      // 2. Si lié à une commande de vente
      if (data.relatedSaleOrderId) {
        const sale = this.state.sales.find((s) => s.id === data.relatedSaleOrderId);
        if (sale) {
          sale.paidAmountXAF += data.amountXAF;
          sale.balanceXAF = Math.max(0, sale.negotiatedPriceXAF - sale.paidAmountXAF);
        }
        // Mettre à jour la facture liée à la vente si présente
        const inv = this.state.invoices.find((i) => i.relatedSaleOrderId === data.relatedSaleOrderId);
        if (inv && inv.id !== data.relatedInvoiceId) {
          inv.paidAmountXAF += data.amountXAF;
          inv.balanceXAF = Math.max(0, inv.totalAmountXAF - inv.paidAmountXAF);
          inv.status = inv.balanceXAF === 0 ? 'PAID' : 'PARTIALLY_PAID';
        }
      }

      // 3. Si lié directement à une facture
      if (data.relatedInvoiceId) {
        const inv = this.state.invoices.find((i) => i.id === data.relatedInvoiceId);
        if (inv) {
          inv.paidAmountXAF += data.amountXAF;
          inv.balanceXAF = Math.max(0, inv.totalAmountXAF - inv.paidAmountXAF);
          inv.status = inv.balanceXAF === 0 ? 'PAID' : 'PARTIALLY_PAID';

          // Propager au contrat ou à la vente si non encore fait
          if (inv.relatedContractId && !data.relatedContractId) {
            const contract = this.state.contracts.find((c) => c.id === inv.relatedContractId);
            if (contract) {
              contract.paidAmountXAF += data.amountXAF;
              contract.remainingAmountXAF = Math.max(0, contract.totalAmountXAF - contract.paidAmountXAF);
            }
          }
          if (inv.relatedSaleOrderId && !data.relatedSaleOrderId) {
            const sale = this.state.sales.find((s) => s.id === inv.relatedSaleOrderId);
            if (sale) {
              sale.paidAmountXAF += data.amountXAF;
              sale.balanceXAF = Math.max(0, sale.negotiatedPriceXAF - sale.paidAmountXAF);
            }
          }
        }
      }

      // 4. Mettre à jour les statistiques financières du client
      const custId =
        data.relatedCustomerId ||
        (data.relatedContractId && this.state.contracts.find((c) => c.id === data.relatedContractId)?.customerId) ||
        (data.relatedSaleOrderId && this.state.sales.find((s) => s.id === data.relatedSaleOrderId)?.customerId) ||
        (data.relatedInvoiceId && this.state.invoices.find((i) => i.id === data.relatedInvoiceId)?.customerId);

      if (custId) {
        const customer = this.state.customers.find((c) => c.id === custId);
        if (customer) {
          customer.totalSpentXAF += data.amountXAF;
          if (data.relatedContractId) {
            customer.totalRentalsCount = this.state.contracts.filter((c) => c.customerId === customer.id).length;
          }
        }
      }
    }

    this.state.cashMovements.unshift(movement);
    this.createAuditLog('CREATE', 'cash', movement.id, `Encaissement/Décaissement ${movement.receiptNumber} (${data.type} ${data.amountXAF} XAF)`);
    this.mirrorToFirestore('cash_movements', movement.id, movement);
    this.mirrorToFirestore('cash_sessions', session.id, session);
    this.notify();
    return movement;
  }

  /**
   * CONTRE-PASSATION (Contre-écriture)
   * Seul moyen légal et comptable d'annuler une écriture erronée en caisse.
   */
  public reverseCashMovement(originalMovementId: string, reversalReason: string): CashMovement {
    const orig = this.state.cashMovements.find((m) => m.id === originalMovementId);
    if (!orig) throw new Error('Écriture de caisse introuvable.');
    if (orig.isReversal) throw new Error('Impossible de contre-passer une contre-écriture.');

    const activeSession = this.getActiveCashSession();
    if (!activeSession) throw new Error('Une session de caisse ouverte est requise pour passer une contre-écriture.');

    // Mouvement opposé
    const oppositeType: CashMovement['type'] = orig.type === 'INFLOW' ? 'OUTFLOW' : 'INFLOW';
    const receiptNumber = this.getNextDocNumber('REC');

    const contraMovement: CashMovement = {
      id: `mov_rev_${Date.now()}`,
      receiptNumber,
      sessionId: activeSession.id,
      type: oppositeType,
      category: 'CONTRA_REVERSAL',
      amountXAF: orig.amountXAF,
      paymentMethod: 'CASH',
      receivedFromOrPaidTo: `Contre-écriture pour annulation de ${orig.receiptNumber}`,
      performedById: this.actor.id,
      performedByName: this.actor.fullName,
      createdAt: new Date().toISOString(),
      isReversal: true,
      reversalOfMovementId: orig.id,
      reversalOfReceiptNumber: orig.receiptNumber,
      reversalReason: reversalReason,
      reason: reversalReason,
    };

    if (oppositeType === 'INFLOW') {
      activeSession.currentCashInXAF += orig.amountXAF;
    } else {
      activeSession.currentCashOutXAF += orig.amountXAF;
    }
    activeSession.calculatedExpectedBalanceXAF =
      activeSession.openingBalanceXAF + activeSession.currentCashInXAF - activeSession.currentCashOutXAF;

    // Si contre-passation d'un encaissement, déduire les montants enregistrés sur les entités liées
    if (orig.type === 'INFLOW') {
      if (orig.relatedContractId) {
        const contract = this.state.contracts.find((c) => c.id === orig.relatedContractId);
        if (contract) {
          contract.paidAmountXAF = Math.max(0, contract.paidAmountXAF - orig.amountXAF);
          contract.remainingAmountXAF = Math.min(contract.totalAmountXAF, contract.remainingAmountXAF + orig.amountXAF);
        }
        const inv = this.state.invoices.find((i) => i.relatedContractId === orig.relatedContractId);
        if (inv) {
          inv.paidAmountXAF = Math.max(0, inv.paidAmountXAF - orig.amountXAF);
          inv.balanceXAF = Math.min(inv.totalAmountXAF, inv.balanceXAF + orig.amountXAF);
          inv.status = inv.paidAmountXAF === 0 ? 'ISSUED' : 'PARTIALLY_PAID';
        }
      }

      if (orig.relatedSaleOrderId) {
        const sale = this.state.sales.find((s) => s.id === orig.relatedSaleOrderId);
        if (sale) {
          sale.paidAmountXAF = Math.max(0, sale.paidAmountXAF - orig.amountXAF);
          sale.balanceXAF = Math.min(sale.negotiatedPriceXAF, sale.balanceXAF + orig.amountXAF);
        }
        const inv = this.state.invoices.find((i) => i.relatedSaleOrderId === orig.relatedSaleOrderId);
        if (inv) {
          inv.paidAmountXAF = Math.max(0, inv.paidAmountXAF - orig.amountXAF);
          inv.balanceXAF = Math.min(inv.totalAmountXAF, inv.balanceXAF + orig.amountXAF);
          inv.status = inv.paidAmountXAF === 0 ? 'ISSUED' : 'PARTIALLY_PAID';
        }
      }

      if (orig.relatedInvoiceId) {
        const inv = this.state.invoices.find((i) => i.id === orig.relatedInvoiceId);
        if (inv) {
          inv.paidAmountXAF = Math.max(0, inv.paidAmountXAF - orig.amountXAF);
          inv.balanceXAF = Math.min(inv.totalAmountXAF, inv.balanceXAF + orig.amountXAF);
          inv.status = inv.paidAmountXAF === 0 ? 'ISSUED' : 'PARTIALLY_PAID';
        }
      }

      const custId =
        orig.relatedCustomerId ||
        (orig.relatedContractId && this.state.contracts.find((c) => c.id === orig.relatedContractId)?.customerId) ||
        (orig.relatedSaleOrderId && this.state.sales.find((s) => s.id === orig.relatedSaleOrderId)?.customerId) ||
        (orig.relatedInvoiceId && this.state.invoices.find((i) => i.id === orig.relatedInvoiceId)?.customerId);

      if (custId) {
        const customer = this.state.customers.find((c) => c.id === custId);
        if (customer) {
          customer.totalSpentXAF = Math.max(0, customer.totalSpentXAF - orig.amountXAF);
        }
      }
    }

    this.state.cashMovements.unshift(contraMovement);
    this.createAuditLog('REVERSAL', 'cash', contraMovement.id, `Contre-écriture ${contraMovement.receiptNumber} annulant ${orig.receiptNumber}`, reversalReason);
    this.mirrorToFirestore('cash_movements', contraMovement.id, contraMovement);
    this.mirrorToFirestore('cash_sessions', activeSession.id, activeSession);
    this.notify();
    return contraMovement;
  }

  // --- 8. STOCK & PIÈCES ---
  public addStockItem(item: Omit<StockItem, 'id'>): StockItem {
    const newItem: StockItem = {
      ...item,
      id: `stk_${Date.now()}`,
    };
    this.state.stock.unshift(newItem);
    this.createAuditLog('CREATE', 'stock', newItem.id, `Nouvel article stock ${newItem.name} (${newItem.code})`);
    this.mirrorToFirestore('stock', newItem.id, newItem);
    this.notify();
    return newItem;
  }

  public updateStockItem(id: string, updates: Partial<StockItem>): StockItem {
    const idx = this.state.stock.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Article introuvable');
    const updated = { ...this.state.stock[idx], ...updates };
    this.state.stock = this.state.stock.map((s) => (s.id === id ? updated : s));
    this.createAuditLog('UPDATE', 'stock', id, `Mise à jour article stock ${updated.name}`);
    this.mirrorToFirestore('stock', id, updated);
    this.notify();
    return updated;
  }

  public deleteStockItem(id: string, reason?: string): boolean {
    const target = this.state.stock.find((s) => s.id === id);
    if (!target) throw new Error('Article introuvable');
    this.state.stock = this.state.stock.filter((s) => s.id !== id);
    this.createAuditLog('DELETE', 'stock', id, `Suppression article stock ${target.name} (${target.code})`, reason);
    this.deleteFromFirestore('stock', id);
    this.notify();
    return true;
  }

  public adjustStockQuantity(
    itemId: string,
    qtyDelta: number,
    reason: string,
    type?: StockMovement['type']
  ) {
    const item = this.state.stock.find((s) => s.id === itemId);
    if (!item) throw new Error('Article de stock introuvable');
    if (item.quantityInStock + qtyDelta < 0) {
      throw new Error(`Stock insuffisant : impossible d'avoir une quantité négative (${item.quantityInStock + qtyDelta}).`);
    }

    item.quantityInStock += qtyDelta;

    const movement: StockMovement = {
      id: `mov_stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stockItemId: item.id,
      stockItemCode: item.code,
      stockItemName: item.name,
      type: type || (qtyDelta >= 0 ? 'INFLOW' : 'OUTFLOW'),
      quantityDelta: qtyDelta,
      quantityAfter: item.quantityInStock,
      unitCostXAF: item.unitCostXAF,
      totalCostXAF: Math.abs(qtyDelta) * item.unitCostXAF,
      reason,
      performedById: this.actor.id,
      performedByName: this.actor.fullName,
      timestamp: new Date().toISOString(),
    };
    this.state.stockMovements.unshift(movement);

    this.createAuditLog(
      'UPDATE',
      'stock',
      itemId,
      `Ajustement stock ${item.name} (${qtyDelta > 0 ? '+' : ''}${qtyDelta} -> ${item.quantityInStock})`,
      reason
    );
    this.mirrorToFirestore('stock', itemId, item);
    this.mirrorToFirestore('stock_movements', movement.id, movement);
    this.notify();
  }

  // --- 9. MAINTENANCE ---
  public addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id' | 'recordNumber'>): MaintenanceRecord {
    const recordNumber = this.getNextDocNumber('MNT');
    const newRec: MaintenanceRecord = {
      ...record,
      id: `mnt_${Date.now()}`,
      recordNumber,
    };
    this.state.maintenance.unshift(newRec);

    // Mettre à jour l'état du véhicule
    this.updateVehicle(newRec.vehicleId, { status: 'MAINTENANCE' });

    this.createAuditLog('CREATE', 'maintenance', newRec.id, `Ouverture dossier maintenance ${newRec.recordNumber} sur ${newRec.licensePlate}`);
    this.mirrorToFirestore('maintenance', newRec.id, newRec);
    this.notify();
    return newRec;
  }

  public updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>): MaintenanceRecord {
    const rec = this.state.maintenance.find((m) => m.id === id);
    if (!rec) throw new Error('Dossier de maintenance introuvable');
    const updated = { ...rec, ...updates };
    this.state.maintenance = this.state.maintenance.map((m) => (m.id === id ? updated : m));
    this.createAuditLog('UPDATE', 'maintenance', id, `Modification dossier maintenance ${updated.recordNumber}`);
    this.mirrorToFirestore('maintenance', id, updated);
    this.notify();
    return updated;
  }

  public deleteMaintenanceRecord(id: string, reason?: string): boolean {
    const rec = this.state.maintenance.find((m) => m.id === id);
    if (!rec) throw new Error('Dossier de maintenance introuvable');

    // Si la maintenance n'était pas terminée, réassigner le véhicule à AVAILABLE
    if (rec.status !== 'COMPLETED') {
      const veh = this.state.vehicles.find((v) => v.id === rec.vehicleId);
      if (veh && veh.status === 'MAINTENANCE') {
        veh.status = 'AVAILABLE';
      }
    }

    this.state.maintenance = this.state.maintenance.filter((m) => m.id !== id);
    this.createAuditLog('DELETE', 'maintenance', id, `Suppression dossier maintenance ${rec.recordNumber}`, reason);
    this.deleteFromFirestore('maintenance', id);
    this.notify();
    return true;
  }

  /**
   * Finalisation atomique & idempotente d'une intervention de maintenance
   * 1. Vérification d'unicité (idempotence : ne déduit jamais 2 fois)
   * 2. Contrôle de disponibilité préalable de TOUTES les pièces de stock
   * 3. Déduction atomique des stocks et génération des mouvements traçables
   * 4. Rétablissement du statut véhicule & actualisation du kilométrage
   */
  public completeMaintenance(id: string, notes?: string): MaintenanceRecord {
    const rec = this.state.maintenance.find((m) => m.id === id);
    if (!rec) throw new Error('Dossier de maintenance introuvable');

    // Garde d'idempotence stricte : si déjà validé, ne pas ré-exécuter
    if (rec.status === 'COMPLETED') {
      return rec;
    }

    // 1. Vérification préalable de la disponibilité de TOUTES les pièces liées au stock
    if (rec.partsUsed && rec.partsUsed.length > 0) {
      for (const part of rec.partsUsed) {
        if (part.stockItemId) {
          const item = this.state.stock.find((s) => s.id === part.stockItemId);
          if (!item) {
            throw new Error(`Article de stock lié introuvable pour la pièce "${part.name}".`);
          }
          if (item.quantityInStock < part.quantity) {
            throw new Error(
              `Stock insuffisant pour "${part.name}" : Disponible ${item.quantityInStock} ${item.unit}, Requis ${part.quantity} ${item.unit}. Impossible de clôturer l'intervention.`
            );
          }
        }
      }

      // 2. Déduction atomique et enregistrement des mouvements de stock
      for (const part of rec.partsUsed) {
        if (part.stockItemId) {
          const item = this.state.stock.find((s) => s.id === part.stockItemId)!;
          item.quantityInStock -= part.quantity;

          const movement: StockMovement = {
            id: `mov_stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            stockItemId: item.id,
            stockItemCode: item.code,
            stockItemName: item.name,
            type: 'MAINTENANCE_USAGE',
            quantityDelta: -part.quantity,
            quantityAfter: item.quantityInStock,
            unitCostXAF: part.unitPriceXAF || item.unitCostXAF,
            totalCostXAF: part.totalXAF || part.quantity * item.unitCostXAF,
            reason: `Consommation dossier maintenance ${rec.recordNumber} (${rec.vehicleName})`,
            relatedMaintenanceId: rec.id,
            relatedVehicleId: rec.vehicleId,
            performedById: this.actor.id,
            performedByName: this.actor.fullName,
            timestamp: new Date().toISOString(),
          };
          this.state.stockMovements.unshift(movement);
          this.mirrorToFirestore('stock', item.id, item);
          this.mirrorToFirestore('stock_movements', movement.id, movement);
        }
      }
    }

    // 3. Clôture de l'intervention
    rec.status = 'COMPLETED';
    rec.completionDate = new Date().toISOString().split('T')[0];
    if (notes) rec.technicianNotes = notes;

    // 4. Actualisation de l'état du véhicule
    const veh = this.state.vehicles.find((v) => v.id === rec.vehicleId);
    if (veh) {
      if (veh.status === 'MAINTENANCE') {
        veh.status = 'AVAILABLE';
      }
      if (rec.mileageAtService && rec.mileageAtService > veh.mileage) {
        veh.mileage = rec.mileageAtService;
      }
      this.mirrorToFirestore('vehicles', veh.id, veh);
    }

    this.createAuditLog(
      'UPDATE',
      'maintenance',
      id,
      `Clôture validée maintenance ${rec.recordNumber} (${rec.totalCostXAF} XAF). Pièces déduites et véhicule rendu disponible.`
    );
    this.mirrorToFirestore('maintenance', id, rec);
    this.notify();
    return rec;
  }

  /**
   * Calcul du Bilan de Santé 360° pour un véhicule
   */
  public getVehicleHealthSheet(vehicleId: string) {
    const vehicle = this.state.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return null;

    const interventions = this.state.maintenance.filter((m) => m.vehicleId === vehicleId);
    const totalMaintenanceCostXAF = interventions.reduce((sum, m) => sum + (m.totalCostXAF || 0), 0);
    const completedCount = interventions.filter((m) => m.status === 'COMPLETED').length;
    const activeCount = interventions.filter((m) => m.status !== 'COMPLETED').length;

    const partsReplaced = interventions.flatMap((m) =>
      (m.partsUsed || []).map((p) => ({
        ...p,
        recordNumber: m.recordNumber,
        date: m.completionDate || m.startDate,
        garageName: m.garageName,
      }))
    );

    const contracts = this.state.contracts.filter((c) => c.vehicleId === vehicleId);
    const reservations = this.state.reservations.filter((r) => r.vehicleId === vehicleId);
    const sales = this.state.sales.filter((s) => s.vehicleId === vehicleId);

    // Calcul du score de santé (sur 100)
    let score = 95;
    if (vehicle.mileage > 100000) score -= 15;
    else if (vehicle.mileage > 60000) score -= 8;

    if (activeCount > 0) score -= 20;

    const today = new Date().getTime();
    const ctDate = new Date(vehicle.nextTechnicalInspectionDate).getTime();
    const daysToCT = (ctDate - today) / (1000 * 3600 * 24);
    if (daysToCT < 0) score -= 25; // CT expiré
    else if (daysToCT < 30) score -= 5;

    score = Math.max(10, Math.min(100, Math.round(score)));

    let recommendation = 'Véhicule en excellent état mécanique opérationnel.';
    if (activeCount > 0) {
      recommendation = `Intervention en cours dans les ateliers (${interventions.find((m) => m.status !== 'COMPLETED')?.garageName}).`;
    } else if (daysToCT < 0) {
      recommendation = 'URGENT : Contrôle technique périodique expiré à Douala.';
    } else if (vehicle.mileage > 0 && vehicle.mileage % 10000 > 8500) {
      recommendation = 'Prochaine vidange moteur recommandée dans moins de 1 500 km.';
    }

    return {
      vehicle,
      interventions,
      history: interventions,
      interventionsCount: interventions.length,
      totalMaintenanceCostXAF,
      completedCount,
      activeCount,
      partsReplaced,
      contracts,
      reservations,
      sales,
      healthScore: score,
      daysToCT: Math.round(daysToCT),
      recommendation,
    };
  }

  // --- 9.b CRM LEADS & PIPELINE ---
  public addLead(lead: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt'>): CrmLead {
    const now = new Date().toISOString();
    const newLead: CrmLead = {
      ...lead,
      id: `lead_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.state.leads.unshift(newLead);
    this.createAuditLog('CREATE', 'crm', newLead.id, `Nouveau prospect CRM ${newLead.fullName} (${newLead.interestType})`);
    this.mirrorToFirestore('leads', newLead.id, newLead);
    this.notify();
    return newLead;
  }

  public updateLead(id: string, updates: Partial<CrmLead>): CrmLead {
    const idx = this.state.leads.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Prospect introuvable');
    const updated = {
      ...this.state.leads[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.leads = this.state.leads.map((l) => (l.id === id ? updated : l));
    this.createAuditLog('UPDATE', 'crm', id, `Mise à jour prospect CRM ${updated.fullName} (${updated.stage})`);
    this.mirrorToFirestore('leads', id, updated);
    this.notify();
    return updated;
  }

  public deleteLead(id: string, reason?: string): boolean {
    const target = this.state.leads.find((l) => l.id === id);
    if (!target) throw new Error('Prospect introuvable');
    this.state.leads = this.state.leads.filter((l) => l.id !== id);
    this.createAuditLog('DELETE', 'crm', id, `Suppression prospect CRM ${target.fullName}`, reason);
    this.deleteFromFirestore('leads', id);
    this.notify();
    return true;
  }

  public convertLeadToCustomer(
    leadId: string,
    customerData: Omit<Customer, 'id' | 'totalRentalsCount' | 'totalSpentXAF' | 'createdAt'>
  ): Customer {
    const lead = this.state.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Prospect introuvable');

    // Vérifier si un client existe déjà avec ce téléphone pour éviter les doublons
    let customer = this.state.customers.find((c) => c.phone.replace(/\s+/g, '') === customerData.phone.replace(/\s+/g, ''));
    if (!customer) {
      customer = this.addCustomer(customerData);
    }

    lead.stage = 'CONVERTED';
    lead.convertedCustomerId = customer.id;
    lead.updatedAt = new Date().toISOString();

    this.createAuditLog('UPDATE', 'crm', leadId, `Conversion du prospect ${lead.fullName} en client officiel ${customer.fullName}`);
    this.mirrorToFirestore('leads', leadId, lead);
    this.notify();
    return customer;
  }

  // --- 10. CHAUFFEURS ---
  public addDriver(driver: Omit<Driver, 'id' | 'rating'>): Driver {
    const newDriver: Driver = {
      ...driver,
      id: `drv_${Date.now()}`,
      rating: 5.0,
    };
    this.state.drivers.unshift(newDriver);
    this.createAuditLog('CREATE', 'drivers', newDriver.id, `Nouveau chauffeur ${newDriver.fullName}`);
    this.mirrorToFirestore('drivers', newDriver.id, newDriver);
    this.notify();
    return newDriver;
  }

  public updateDriver(id: string, updates: Partial<Driver>): Driver {
    const idx = this.state.drivers.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Chauffeur introuvable');
    const updated = { ...this.state.drivers[idx], ...updates };
    this.state.drivers = this.state.drivers.map((d) => (d.id === id ? updated : d));
    this.createAuditLog('UPDATE', 'drivers', id, `Mise à jour chauffeur ${updated.fullName}`);
    this.mirrorToFirestore('drivers', id, updated);
    this.notify();
    return updated;
  }

  public deleteDriver(id: string, reason?: string): boolean {
    const target = this.state.drivers.find((d) => d.id === id);
    if (!target) throw new Error('Chauffeur introuvable');
    if (target.status === 'ON_TRIP') {
      throw new Error(`Impossible de supprimer le chauffeur ${target.fullName} : il est actuellement en mission sur route.`);
    }
    this.state.drivers = this.state.drivers.filter((d) => d.id !== id);
    this.createAuditLog('DELETE', 'drivers', id, `Suppression chauffeur ${target.fullName}`, reason);
    this.deleteFromFirestore('drivers', id);
    this.notify();
    return true;
  }

  // --- 11. COFFRE-FORT NUMÉRIQUE & DOCUMENTS ---
  public addDocument(doc: Partial<FctDocument>): FctDocument {
    if (!this.state.documents) this.state.documents = [];
    const created: FctDocument = {
      id: doc.id || `doc_${Date.now()}`,
      title: doc.title || 'Document FCT',
      category: doc.category || 'AUTRE',
      categoryLabel: doc.categoryLabel,
      fileUrl: doc.fileUrl || '',
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString().split('T')[0],
      size: doc.size || '1.0 MB',
      type: doc.type || (doc.fileUrl?.toLowerCase().includes('.pdf') ? 'PDF' : 'IMG'),
      isPrivate: doc.isPrivate !== undefined ? doc.isPrivate : true,
      author: doc.author || this.actor.fullName || 'Direction FCT',
      expiryDate: doc.expiryDate || 'Permanent',
      notes: doc.notes,
      relatedModule: doc.relatedModule,
      relatedEntityId: doc.relatedEntityId,
      relatedEntityName: doc.relatedEntityName,
      relatedVehicleId: doc.relatedVehicleId,
      relatedDriverId: doc.relatedDriverId,
      relatedContractId: doc.relatedContractId,
      relatedInvoiceId: doc.relatedInvoiceId,
      relatedCustomerId: doc.relatedCustomerId,
      relatedPartId: doc.relatedPartId,
      relatedSaleId: doc.relatedSaleId,
      relatedCashMovementId: doc.relatedCashMovementId,
    };
    this.state.documents.unshift(created);
    this.createAuditLog('CREATE', 'documents', created.id, `Dépôt document ${created.title}`);
    this.mirrorToFirestore('documents', created.id, created);
    this.notify();
    return created;
  }

  public deleteDocument(id: string): boolean {
    if (!this.state.documents) return false;
    const target = this.state.documents.find((d) => d.id === id);
    if (!target) return false;
    this.state.documents = this.state.documents.filter((d) => d.id !== id);
    this.createAuditLog('DELETE', 'documents', id, `Suppression document ${target.title}`);
    this.deleteFromFirestore('documents', id);
    this.notify();
    return true;
  }

  // --- 12. SYNCHRONISATION OUTBOX ---
  public triggerSync() {
    if (!this.state.isOnline) return;
    const now = new Date().toISOString();
    this.state.syncQueue.forEach((item) => {
      if (item.status === 'PENDING') {
        item.status = 'SYNCED';
        item.serverConfirmedTimestamp = now;
      }
    });
    this.notify();
  }

  // Transfert manuel vers Firebase & purge LocalStorage
  public async transferAllToFirebase(
    onProgress?: (step: string, current: number, total: number) => void
  ): Promise<TransferResult> {
    return await transferAllDataToFirebase(this.state, onProgress);
  }

  // Recharger depuis Firebase Local Cache / Cloud
  public async reloadFromFirebase(): Promise<boolean> {
    const data = await loadAllFromFirebase();
    if (data && Object.keys(data).length > 0) {
      this.state = {
        ...this.state,
        ...data,
      };
      this.notify();
      return true;
    }
    return false;
  }

  // Purge de l'ancien LocalStorage
  public clearLocalStorage(): { clearedKeys: string[]; bytesFreed: number } {
    return clearAllLocalStorage();
  }

  // Réinitialisation d'usine
  public async resetToFactory(): Promise<void> {
    clearAllLocalStorage();
    this.state = loadInitialState();
    this.notify();
    await this.transferAllToFirebase();
  }

  /**
   * PURGE DE SÉCURITÉ DE PRODUCTION (ZERO-TRUST / CLEAN SLATE)
   * Réservée exclusivement au Super Administrateur (Claus Ephwandji).
   * Élimine toutes les données factices de simulation, faux comptes de tests,
   * fausses écritures et remet l'ERP dans son état de production réel certifié.
   */
  public async purgeAllMockDataForProduction(): Promise<{
    clearedContracts: number;
    clearedInvoices: number;
    clearedCashMovements: number;
    clearedReservations: number;
    clearedSales: number;
    clearedMaintenance: number;
  }> {
    if (this.actor.role !== 'super_admin') {
      throw new Error("Seul le Super Administrateur peut exécuter la purge de bascule en production.");
    }

    const counts = {
      clearedContracts: this.state.contracts.length,
      clearedInvoices: this.state.invoices.length,
      clearedCashMovements: this.state.cashMovements.length,
      clearedReservations: this.state.reservations.length,
      clearedSales: this.state.sales.length,
      clearedMaintenance: this.state.maintenance.length,
    };

    // 1. Ne conserver que le Super Administrateur authentique
    const verifiedAdmin = this.state.users.find(
      (u) => u.email.trim().toLowerCase() === 'clausephwandji044@gmail.com' || u.role === 'super_admin'
    ) || {
      id: 'usr_superadmin',
      fullName: 'Claus Ephwandji (Super Admin & Direction)',
      email: 'clausephwandji044@gmail.com',
      role: 'super_admin' as UserRole,
      agencyId: 'agency_douala_bonamoussadi',
      phone: '+237 699 00 11 22',
      department: 'Direction Générale',
      jobTitle: 'Super Administrateur & Directeur Général',
      isActive: true,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
    };

    this.state.users = [verifiedAdmin];
    this.currentUser = verifiedAdmin;

    // 2. Vider les transactions factices de test
    this.state.contracts = [];
    this.state.invoices = [];
    this.state.cashSessions = [];
    this.state.cashMovements = [];
    this.state.reservations = [];
    this.state.sales = [];
    this.state.leads = [];
    this.state.maintenance = [];
    this.state.stockMovements = [];
    this.state.documents = [];
    this.state.drivers = [];
    this.state.customers = [];

    // 3. Nettoyer les URLs d'images factices sur les véhicules existants
    this.state.vehicles = this.state.vehicles.map((v) => ({
      ...v,
      photoUrls: (v.photoUrls || []).filter((u) => !u.includes('unsplash.com')),
      status: 'AVAILABLE',
    }));

    // 4. Compteurs officiels remis à 0 pour démarrer proprement
    this.state.documentCounters = {
      CTR: 0,
      FAC: 0,
      REC: 0,
      COM: 0,
      RES: 0,
      MNT: 0,
      CS: 0,
    };

    // 5. Journalisation d'audit de sécurité immuable
    this.addSecurityAuditEvent({
      actionType: 'ROLE_PERMISSIONS_UPDATE',
      summary: `Bascule en production certifiée FCT effectuée par ${this.actor.fullName}`,
      details: 'Purge intégrale des données de simulation et mise en service de la base de production.',
    });

    this.createAuditLog(
      'UPDATE',
      'settings',
      'production_go_live',
      'Bascule en production et purge des données de simulation',
      `Purge exécutée par ${this.actor.fullName} (${this.actor.id})`
    );

    // 6. Synchroniser immédiatement la base propre dans Firebase
    await transferAllDataToFirebase(this.state);
    this.notify();

    return counts;
  }
}

export const dbStore = new DatabaseStore();
