/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Business Rules Engine
 * Franchise Conseils Trading - Douala, Cameroun
 */

import {
  AppModule,
  PermissionAction,
  UserRole,
  Vehicle,
  RentalContract,
  Reservation,
  UserProfile,
  RoleDefinition,
} from '../shared-types/index.ts';

/**
 * Formatage monétaire officiel en Francs CFA (XAF) pour le Cameroun
 * Entier strict avec séparateurs d'espaces
 */
export function formatXAF(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 FCFA';
  const rounded = Math.round(amount);
  return `${new Intl.NumberFormat('fr-CM', { maximumFractionDigits: 0 }).format(rounded)} FCFA`;
}

/**
 * Calcul du nombre de jours de location (minimum 1 jour)
 */
export function calculateRentalDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays || 1);
}

/**
 * Vérification stricte des conflits et chevauchements de dates pour un véhicule
 */
export function checkVehicleAvailability(
  vehicleId: string,
  proposedStart: string,
  proposedEnd: string,
  existingContracts: RentalContract[],
  ignoreContractId?: string,
  existingReservations?: Reservation[],
  ignoreReservationId?: string
): { isAvailable: boolean; conflictReason?: string } {
  const propStartTime = new Date(proposedStart).getTime();
  const propEndTime = new Date(proposedEnd).getTime();

  for (const contract of existingContracts) {
    if (contract.vehicleId !== vehicleId) continue;
    if (ignoreContractId && contract.id === ignoreContractId) continue;
    if (contract.status === 'CANCELLED' || contract.status === 'RETURNED') continue;

    const cStart = new Date(contract.startDate).getTime();
    const cEnd = new Date(contract.endDate).getTime();

    // Condition de chevauchement d'intervalles [start, end]
    if (propStartTime <= cEnd && propEndTime >= cStart) {
      return {
        isAvailable: false,
        conflictReason: `Conflit détecté avec le contrat ${contract.contractNumber} (${contract.startDate} au ${contract.endDate}) pour ce véhicule.`,
      };
    }
  }

  if (existingReservations) {
    for (const res of existingReservations) {
      if (res.vehicleId !== vehicleId) continue;
      if (ignoreReservationId && res.id === ignoreReservationId) continue;
      if (res.status === 'CANCELLED' || res.status === 'CONVERTED') continue;

      const rStart = new Date(res.startDate).getTime();
      const rEnd = new Date(res.endDate).getTime();

      if (propStartTime <= rEnd && propEndTime >= rStart) {
        return {
          isAvailable: false,
          conflictReason: `Conflit détecté avec la réservation ${res.reservationNumber} (${res.startDate} au ${res.endDate}) pour ce véhicule.`,
        };
      }
    }
  }

  return { isAvailable: true };
}

/**
 * Vérification d'éligibilité d'un véhicule pour la location ou la vente
 */
export function validateVehicleOperationalState(vehicle: Vehicle, operation: 'RENTAL' | 'SALE'): { allowed: boolean; reason?: string } {
  if (vehicle.status === 'SOLD') {
    return { allowed: false, reason: "Ce véhicule a déjà été vendu. Aucune opération n'est autorisée." };
  }
  if (vehicle.status === 'MAINTENANCE') {
    return { allowed: false, reason: 'Ce véhicule est actuellement immobilisé pour maintenance mécanique à Douala.' };
  }
  if (operation === 'RENTAL') {
    if (!vehicle.isForRent) {
      return { allowed: false, reason: "Ce véhicule n'est pas configuré pour le parc de location." };
    }
    if (vehicle.status === 'RENTED') {
      return { allowed: false, reason: 'Ce véhicule est déjà en cours de location.' };
    }
  }
  if (operation === 'SALE') {
    if (!vehicle.isForSale) {
      return { allowed: false, reason: "Ce véhicule n'est pas marqué comme disponible à la vente." };
    }
  }
  return { allowed: true };
}

/**
 * Matrice complète RBAC (Role-Based Access Control)
 * Définition exhaustive des droits par ressource et action
 */
/**
 * Liste complète des 18 modules applicatifs de FCT ERP & CRM AUTOMOBILE
 */
export const ALL_APP_MODULES: AppModule[] = [
  'dashboard',
  'vehicles',
  'stock',
  'rentals',
  'sales',
  'crm',
  'reservations',
  'billing',
  'cash',
  'maintenance',
  'drivers',
  'documents',
  'notifications',
  'reports',
  'users',
  'settings',
  'audit',
  'help',
];

/**
 * Liste exhaustive des 7 actions de sécurité par module
 */
export const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
  'read',
  'create',
  'update',
  'delete',
  'approve',
  'export',
  'sensitiveData',
];

/**
 * Matrice officielle par défaut RBAC (Role-Based Access Control)
 * Définition exhaustive des droits initiaux par ressource et action pour les 8 rôles
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<AppModule, PermissionAction[]>> = {
  super_admin: {
    dashboard: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    vehicles: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    stock: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    rentals: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    sales: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    crm: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    reservations: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    billing: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    cash: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    maintenance: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    drivers: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    documents: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    notifications: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    reports: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    users: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    settings: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    audit: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    help: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
    partners: ['read', 'create', 'update', 'delete', 'approve', 'export', 'sensitiveData'],
  },
  director: {
    dashboard: ['read', 'export', 'sensitiveData'],
    vehicles: ['read', 'create', 'update', 'approve', 'export'],
    stock: ['read', 'export'],
    rentals: ['read', 'create', 'update', 'approve', 'export'],
    sales: ['read', 'create', 'update', 'approve', 'export'],
    crm: ['read', 'create', 'update', 'export'],
    reservations: ['read', 'create', 'update', 'approve', 'export'],
    billing: ['read', 'create', 'update', 'approve', 'export', 'sensitiveData'],
    cash: ['read', 'approve', 'export', 'sensitiveData'],
    maintenance: ['read', 'approve', 'export'],
    drivers: ['read', 'create', 'update', 'export'],
    documents: ['read', 'create', 'update', 'export', 'sensitiveData'],
    notifications: ['read', 'create'],
    reports: ['read', 'export', 'sensitiveData'],
    users: ['read'],
    settings: ['read', 'update'],
    audit: ['read', 'export'],
    help: ['read'],
    partners: ['read', 'create', 'update', 'approve', 'export', 'sensitiveData'],
  },
  sales_agent: {
    dashboard: ['read'],
    vehicles: ['read'],
    stock: ['read'],
    rentals: ['read'],
    sales: ['read', 'create', 'update', 'export'],
    crm: ['read', 'create', 'update', 'export'],
    reservations: ['read', 'create'],
    billing: ['read', 'create'],
    cash: ['read'],
    maintenance: [],
    drivers: ['read'],
    documents: ['read', 'create'],
    notifications: ['read'],
    reports: ['read'],
    users: [],
    settings: [],
    audit: [],
    help: ['read'],
    partners: ['read', 'create', 'update', 'export'],
  },
  rental_agent: {
    dashboard: ['read'],
    vehicles: ['read'],
    stock: ['read'],
    rentals: ['read', 'create', 'update', 'export'],
    sales: [],
    crm: ['read', 'create', 'update'],
    reservations: ['read', 'create', 'update'],
    billing: ['read', 'create'],
    cash: ['read', 'create'], // Encaissement d'acompte
    maintenance: ['read'],
    drivers: ['read', 'update'],
    documents: ['read', 'create'],
    notifications: ['read'],
    reports: ['read'],
    users: [],
    settings: [],
    audit: [],
    help: ['read'],
    partners: ['read', 'create'],
  },
  accountant_cashier: {
    dashboard: ['read', 'export', 'sensitiveData'],
    vehicles: ['read'],
    stock: ['read'],
    rentals: ['read'],
    sales: ['read'],
    crm: ['read'],
    reservations: ['read'],
    billing: ['read', 'create', 'update', 'approve', 'export', 'sensitiveData'],
    cash: ['read', 'create', 'update', 'approve', 'export', 'sensitiveData'],
    maintenance: ['read', 'export'],
    drivers: ['read'],
    documents: ['read', 'create', 'export', 'sensitiveData'],
    notifications: ['read'],
    reports: ['read', 'export', 'sensitiveData'],
    users: [],
    settings: ['read'],
    audit: ['read'],
    help: ['read'],
    partners: ['read', 'approve', 'export', 'sensitiveData'],
  },
  fleet_manager: {
    dashboard: ['read'],
    vehicles: ['read', 'create', 'update', 'export'],
    stock: ['read', 'create', 'update', 'export'],
    rentals: ['read'],
    sales: [],
    crm: ['read'],
    reservations: ['read'],
    billing: ['read'],
    cash: [],
    maintenance: ['read', 'create', 'update', 'approve', 'export'],
    drivers: ['read', 'create', 'update', 'export'],
    documents: ['read', 'create', 'update'],
    notifications: ['read'],
    reports: ['read', 'export'],
    users: [],
    settings: [],
    audit: [],
    help: ['read'],
    partners: [],
  },
  driver: {
    dashboard: ['read'],
    vehicles: ['read'],
    stock: [],
    rentals: ['read'],
    sales: [],
    crm: [],
    reservations: [],
    billing: [],
    cash: [],
    maintenance: ['create'], // Signalement de panne / incident
    drivers: ['read'],
    documents: ['read'],
    notifications: ['read'],
    reports: [],
    users: [],
    settings: [],
    audit: [],
    help: ['read'],
    partners: [],
  },
  viewer: {
    dashboard: ['read'],
    vehicles: ['read'],
    stock: ['read'],
    rentals: ['read'],
    sales: ['read'],
    crm: ['read'],
    reservations: ['read'],
    billing: ['read'],
    cash: ['read'],
    maintenance: ['read'],
    drivers: ['read'],
    documents: ['read'],
    notifications: ['read'],
    reports: ['read'],
    users: [],
    settings: ['read'],
    audit: [],
    help: ['read'],
    partners: ['read'],
  },
};

/**
 * Définition et métadonnées complètes des 8 rôles FCT
 */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'Super Administrateur',
    description: 'Administration globale du système, gestion complète des utilisateurs, sécurité et paramètres.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
  },
  {
    id: 'director',
    name: 'Directeur Général',
    description: 'Supervision globale des opérations, approbations transversales, consultation des rapports financiers.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.director,
  },
  {
    id: 'accountant_cashier',
    name: 'Chef Comptable & Caissier',
    description: 'Gestion de la facturation, tenue des sessions de caisse, encaissements et rapports financiers.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.accountant_cashier,
  },
  {
    id: 'rental_agent',
    name: 'Agent de Location',
    description: 'Gestion des réservations, contrats de location, départs/retours et états des lieux.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.rental_agent,
  },
  {
    id: 'sales_agent',
    name: 'Conseiller Commercial Ventes',
    description: 'Prospection CRM, suivi des opportunités, offres commerciales et ventes de véhicules.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.sales_agent,
  },
  {
    id: 'fleet_manager',
    name: 'Gestionnaire de Flotte & Parc',
    description: 'Gestion des véhicules, maintenance préventive/curative, suivi du stock de pièces et chauffeurs.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.fleet_manager,
  },
  {
    id: 'driver',
    name: 'Chauffeur Professionnel',
    description: 'Consultation des missions attribuées, signalement d’incidents ou pannes et suivi véhicule.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.driver,
  },
  {
    id: 'viewer',
    name: 'Consultation Seule (Observateur)',
    description: 'Accès en lecture seule sans aucune permission d’écriture ou de validation.',
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.viewer,
  },
];

/**
 * Calcul des permissions effectives d'un utilisateur avec application stricte des priorités :
 * 1. Protections de sécurité fondamentales (invariants immuables : pas de delete sur caisse/audit)
 * 2. Restriction individuelle explicite (deny) l'emporte TOUJOURS sur les autorisations
 * 3. Droits de base conférés par le rôle (matrice dynamique ou défaut)
 * 4. Autorisations individuelles explicites (allow) étendent les droits dans la limite autorisée
 */
export function calculateEffectivePermissions(
  user: UserProfile,
  customMatrix?: Record<UserRole, Record<AppModule, PermissionAction[]>>
): Record<AppModule, PermissionAction[]> {
  const activeMatrix = customMatrix || DEFAULT_ROLE_PERMISSIONS;
  const baseRolePermissions = activeMatrix[user.role] || DEFAULT_ROLE_PERMISSIONS[user.role] || {};

  const effective: Record<AppModule, PermissionAction[]> = {} as any;

  ALL_APP_MODULES.forEach((mod) => {
    const roleActions = new Set<PermissionAction>(baseRolePermissions[mod] || []);

    // 1. Appliquer les surcharges d'autorisation (allow)
    const userAllow = user.permissionsOverrides?.allow?.[mod];
    if (userAllow && Array.isArray(userAllow)) {
      userAllow.forEach((act) => roleActions.add(act));
    }

    // 2. Appliquer les surcharges de restriction (deny) - Priorité absolue : Deny l'emporte
    const userDeny = user.permissionsOverrides?.deny?.[mod];
    if (userDeny && Array.isArray(userDeny)) {
      userDeny.forEach((act) => roleActions.delete(act));
    }

    // 3. Invariants de sécurité non contournables :
    if (user.role !== 'super_admin') {
      if (mod === 'users') {
        roleActions.delete('delete');
      }
      if (mod === 'audit') {
        roleActions.delete('delete'); // Aucun utilisateur ne peut supprimer les logs d'audit
      }
      if (mod === 'cash') {
        roleActions.delete('delete'); // Immuabilité stricte des mouvements de caisse
      }
    }

    effective[mod] = Array.from(roleActions);
  });

  return effective;
}

/**
 * Détermine l'origine précise d'un droit pour un utilisateur (Rôle, Exception Allow, Restriction Deny, Refusé)
 */
export function getPermissionOrigin(
  user: UserProfile,
  module: AppModule,
  action: PermissionAction,
  customMatrix?: Record<UserRole, Record<AppModule, PermissionAction[]>>
): 'ROLE_DEFAULT' | 'INDIVIDUAL_ALLOW' | 'INDIVIDUAL_DENY' | 'DENIED' {
  const userDeny = user.permissionsOverrides?.deny?.[module];
  if (userDeny && userDeny.includes(action)) {
    return 'INDIVIDUAL_DENY';
  }

  const userAllow = user.permissionsOverrides?.allow?.[module];
  if (userAllow && userAllow.includes(action)) {
    return 'INDIVIDUAL_ALLOW';
  }

  const activeMatrix = customMatrix || DEFAULT_ROLE_PERMISSIONS;
  const rolePerms = activeMatrix[user.role]?.[module] || [];
  if (rolePerms.includes(action)) {
    return 'ROLE_DEFAULT';
  }

  return 'DENIED';
}

/**
 * Vérification des permissions effectives d'un utilisateur connecté
 */
export function hasEffectivePermission(
  user: UserProfile | null | undefined,
  module: AppModule,
  action: PermissionAction,
  customMatrix?: Record<UserRole, Record<AppModule, PermissionAction[]>>
): boolean {
  if (!user || !user.isActive || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
    return false;
  }
  const effective = calculateEffectivePermissions(user, customMatrix);
  return effective[module]?.includes(action) ?? false;
}

/**
 * Retourne la liste de tous les modules / onglets visibles pour un collaborateur
 * (un onglet est visible si l'utilisateur possède la permission effective 'read')
 */
export function getUserVisibleModules(
  user: UserProfile | null | undefined,
  customMatrix?: Record<UserRole, Record<AppModule, PermissionAction[]>>
): AppModule[] {
  if (!user || !user.isActive || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
    return [];
  }
  const effective = calculateEffectivePermissions(user, customMatrix);
  return ALL_APP_MODULES.filter((mod) => effective[mod]?.includes('read'));
}

/**
 * Vérifie si un rôle possède une permission spécifique sur un module (Compatibilité existante)
 */
export function hasPermission(
  role: UserRole,
  module: AppModule,
  action: PermissionAction,
  customMatrix?: Record<UserRole, Record<AppModule, PermissionAction[]>>
): boolean {
  const matrix = customMatrix || DEFAULT_ROLE_PERMISSIONS;
  const modulePerms = matrix[role]?.[module];
  if (!modulePerms) return false;
  return modulePerms.includes(action);
}

/**
 * Outil de comparaison des permissions entre deux rôles pour la matrice d'administration
 */
export function compareRolePermissions(
  roleA: UserRole,
  roleB: UserRole,
  customMatrix?: Record<UserRole, Record<AppModule, PermissionAction[]>>
): Record<AppModule, { onlyInA: PermissionAction[]; onlyInB: PermissionAction[]; inBoth: PermissionAction[] }> {
  const matrix = customMatrix || DEFAULT_ROLE_PERMISSIONS;
  const permsA = matrix[roleA] || {};
  const permsB = matrix[roleB] || {};

  const comparison: Record<AppModule, { onlyInA: PermissionAction[]; onlyInB: PermissionAction[]; inBoth: PermissionAction[] }> = {} as any;

  ALL_APP_MODULES.forEach((mod) => {
    const listA = new Set(permsA[mod] || []);
    const listB = new Set(permsB[mod] || []);

    const onlyInA: PermissionAction[] = [];
    const onlyInB: PermissionAction[] = [];
    const inBoth: PermissionAction[] = [];

    ALL_PERMISSION_ACTIONS.forEach((act) => {
      const inA = listA.has(act);
      const inB = listB.has(act);
      if (inA && inB) inBoth.push(act);
      else if (inA && !inB) onlyInA.push(act);
      else if (!inA && inB) onlyInB.push(act);
    });

    comparison[mod] = { onlyInA, onlyInB, inBoth };
  });

  return comparison;
}

/**
 * Générateur de numéro séquentiel certifié avec préfixe et année (Simulation serveur)
 */
export function generateDocumentNumber(
  prefix: string,
  sequence: number,
  year: number | null | undefined = 2026,
  padDigits = 4,
  includeYear = true
): string {
  const padded = String(sequence).padStart(padDigits, '0');
  if (includeYear && year !== null && year !== undefined) {
    return `${prefix}-${year}-${padded}`;
  }
  return `${prefix}-${padded}`;
}
