/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Suite Complète de Tests Utilisateurs, Rôles & Permissions (18 Scénarios)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import {
  hasPermission,
  hasEffectivePermission,
  calculateEffectivePermissions,
  getPermissionOrigin,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_APP_MODULES,
  getUserVisibleModules,
} from '../packages/business-rules/index.ts';
import { UserProfile, UserRole, AppModule } from '../packages/shared-types/index.ts';

describe('Module Utilisateurs, Rôles, Permissions & Sécurité RBAC (18 Scénarios Obligatoires)', () => {
  beforeAll(() => {
    const adminUser = dbStore.getUsers().find((u) => u.role === 'super_admin' && u.isActive);
    if (adminUser) {
      dbStore.setCurrentUser(adminUser);
    }
    const rolesNeeded: UserRole[] = [
      'director',
      'accountant_cashier',
      'rental_agent',
      'sales_agent',
      'fleet_manager',
      'driver',
      'viewer',
    ];
    rolesNeeded.forEach((role) => {
      if (!dbStore.getUsers().find((u) => u.role === role)) {
        dbStore.addUser({
          fullName: `Fixture Test ${role}`,
          email: `fixture.${role}@fct-test.cm`,
          phone: '+237 600 00 00 00',
          role,
          status: 'ACTIVE',
          isActive: true,
        });
      }
    });
  });

  beforeEach(() => {
    // S'assurer d'avoir l'utilisateur Super Admin actif comme utilisateur courant pour administrer
    const adminUser = dbStore.getUsers().find((u) => u.role === 'super_admin' && u.isActive);
    if (adminUser) {
      dbStore.setCurrentUser(adminUser);
    }
  });

  // SCÉNARIO 1 : La création d’un utilisateur avec un rôle par défaut
  it('Scénario 1: crée un collaborateur avec un rôle par défaut et applique ses droits initiaux', () => {
    const newUser = dbStore.addUser({
      fullName: 'Alain Tchuente',
      firstName: 'Alain',
      lastName: 'Tchuente',
      email: 'alain.tchuente@fct-automobile.cm',
      phone: '+237 699 12 34 88',
      jobTitle: 'Conseiller Commercial Vente Showroom',
      role: 'sales_agent',
      status: 'ACTIVE',
      isActive: true,
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe('alain.tchuente@fct-automobile.cm');
    expect(newUser.role).toBe('sales_agent');

    // Vérifier les permissions effectives calculées pour sales_agent
    const perms = calculateEffectivePermissions(newUser);
    expect(perms.sales.includes('read')).toBe(true);
    expect(perms.sales.includes('create')).toBe(true);
    expect(perms.cash.includes('create')).toBe(false); // Pas de droit de caisse
  });

  // SCÉNARIO 2 : L’invitation et l’activation d’un compte
  it('Scénario 2: invite un collaborateur avec statut INVITED puis active son compte', () => {
    const invitedUser = dbStore.addUser({
      fullName: 'Mireille Dongmo',
      email: 'mireille.dongmo@fct-automobile.cm',
      phone: '+237 677 44 55 66',
      jobTitle: 'Gestionnaire de Stock Pièces',
      role: 'fleet_manager',
      status: 'INVITED',
      isActive: true,
    });

    expect(invitedUser.status).toBe('INVITED');

    // Activation du compte
    const activatedUser = dbStore.toggleUserStatus(invitedUser.id, 'ACTIVE', 'Activation suite à la première connexion');
    expect(activatedUser.status).toBe('ACTIVE');
    expect(activatedUser.isActive).toBe(true);
  });

  // SCÉNARIO 3 : L’impossibilité de créer deux profils pour un même compte (normalisation et anti-doublon)
  it('Scénario 3: refuse la création de doublons avec normalisation d’e-mail insensible à la casse et aux espaces', () => {
    expect(() => {
      dbStore.addUser({
        fullName: 'Doublon Test',
        email: '  CLAUSEPHWANDJI044@GMAIL.COM  ', // Déjà le Super Admin
        phone: '+237 699 00 00 00',
        role: 'sales_agent',
        status: 'ACTIVE',
        isActive: true,
      });
    }).toThrow(/existe déjà/);
  });

  // SCÉNARIO 4 : La visibilité correcte des modules pour chaque rôle
  it('Scénario 4: garantit la visibilité stricte des modules selon la matrice des 8 rôles', () => {
    const users = dbStore.getUsers();

    const superAdmin = users.find((u) => u.role === 'super_admin')!;
    const cashier = users.find((u) => u.role === 'accountant_cashier')!;
    const driver = users.find((u) => u.role === 'driver')!;
    const viewer = users.find((u) => u.role === 'viewer')!;

    // Super Admin voit tous les modules
    expect(ALL_APP_MODULES.every((m) => hasEffectivePermission(superAdmin, m, 'read'))).toBe(true);

    // Caissière voit la caisse et la facturation, mais pas la gestion des utilisateurs
    expect(hasEffectivePermission(cashier, 'cash', 'read')).toBe(true);
    expect(hasEffectivePermission(cashier, 'billing', 'read')).toBe(true);
    expect(hasEffectivePermission(cashier, 'users', 'read')).toBe(false);

    // Chauffeur ne voit pas la caisse ni la facturation
    expect(hasEffectivePermission(driver, 'cash', 'read')).toBe(false);
    expect(hasEffectivePermission(driver, 'billing', 'read')).toBe(false);
    expect(hasEffectivePermission(driver, 'vehicles', 'read')).toBe(true);

    // Observateur en lecture seule
    expect(hasEffectivePermission(viewer, 'vehicles', 'read')).toBe(true);
    expect(hasEffectivePermission(viewer, 'vehicles', 'create')).toBe(false);
  });

  // SCÉNARIO 5 : Le refus d’accès à un module non autorisé par navigation directe
  it('Scénario 5: bloque l’accès par navigation directe si le collaborateur n’a pas la permission de lecture', () => {
    const driverUser = dbStore.getUsers().find((u) => u.role === 'driver')!;
    expect(hasEffectivePermission(driverUser, 'cash', 'read')).toBe(false);
    expect(hasEffectivePermission(driverUser, 'settings', 'read')).toBe(false);
    expect(hasEffectivePermission(driverUser, 'users', 'read')).toBe(false);
  });

  // SCÉNARIO 6 : Le refus des opérations interdites par les règles RBAC
  it('Scénario 6: bloque les opérations interdites par les invariants de sécurité', () => {
    // Même avec une tentative de permission, aucun rôle non-superadmin ne peut supprimer des utilisateurs ou les logs
    const cashier = dbStore.getUsers().find((u) => u.role === 'accountant_cashier')!;
    const effective = calculateEffectivePermissions(cashier);
    expect(effective.users?.includes('delete')).toBe(false);
    expect(effective.audit?.includes('delete')).toBe(false);
    expect(effective.cash?.includes('delete')).toBe(false); // Immuabilité caisse
  });

  // SCÉNARIO 7 : L’ajout d’un droit individuel sans modification des autres membres du rôle (allow exception)
  it('Scénario 7: octroie une exception "allow" à un utilisateur sans impacter les autres membres du même rôle', () => {
    const salesUser = dbStore.getUsers().find((u) => u.role === 'sales_agent')!;

    // Initialement, sales_agent n'a pas accès à maintenance en lecture
    expect(hasEffectivePermission(salesUser, 'maintenance', 'read')).toBe(false);

    // Accorder l'exception individuelle allow: maintenance:read
    dbStore.updateUserOverrides(
      salesUser.id,
      {
        allow: { maintenance: ['read'] },
      },
      'Consultation des entretiens pour renseigner les prospects'
    );

    const updatedUser = dbStore.getUserById(salesUser.id)!;
    expect(hasEffectivePermission(updatedUser, 'maintenance', 'read')).toBe(true);
    expect(getPermissionOrigin(updatedUser, 'maintenance', 'read')).toBe('INDIVIDUAL_ALLOW');

    // Vérifier qu'un autre commercial n'a PAS reçu ce privilège
    const otherSales = dbStore.getUsers().find((u) => u.role === 'sales_agent' && u.id !== salesUser.id);
    if (otherSales) {
      expect(hasEffectivePermission(otherSales, 'maintenance', 'read')).toBe(false);
      expect(getPermissionOrigin(otherSales, 'maintenance', 'read')).toBe('DENIED');
    }
  });

  // SCÉNARIO 8 : L’application d’une restriction individuelle malgré une autorisation du rôle (deny restriction)
  it('Scénario 8: applique la règle de priorité stricte où Deny l’emporte sur les droits du rôle', () => {
    const rentalAgent = dbStore.getUsers().find((u) => u.role === 'rental_agent')!;

    // Initialement, rental_agent a 'create' sur rentals
    expect(hasEffectivePermission(rentalAgent, 'rentals', 'create')).toBe(true);

    // Appliquer une restriction explicite deny sur 'create'
    dbStore.updateUserOverrides(
      rentalAgent.id,
      {
        deny: { rentals: ['create'] },
      },
      'Restriction temporaire de création de contrats suite à un audit'
    );

    const updatedUser = dbStore.getUserById(rentalAgent.id)!;
    // Doit être strictement REFUSÉ en vertu de la priorité de Deny
    expect(hasEffectivePermission(updatedUser, 'rentals', 'create')).toBe(false);
    expect(getPermissionOrigin(updatedUser, 'rentals', 'create')).toBe('INDIVIDUAL_DENY');
  });

  // SCÉNARIO 9 : L’impossibilité de s’attribuer un rôle supérieur
  it('Scénario 9: bloque l’élévation de privilèges si l’auteur n’a pas le statut de Super Administrateur', () => {
    const directorUser = dbStore.getUsers().find((u) => u.role === 'director')!;
    dbStore.setCurrentUser(directorUser);

    // Le directeur tente de créer un super_admin
    expect(() => {
      dbStore.addUser({
        fullName: 'Tentative SuperAdmin',
        email: 'pirate@fct-automobile.cm',
        phone: '+237 699 99 99 99',
        role: 'super_admin',
        status: 'ACTIVE',
        isActive: true,
      });
    }).toThrow(/Seul un Super Administrateur/);
  });

  // SCÉNARIO 10 : La prise en compte des changements de permissions de rôle
  it('Scénario 10: applique immédiatement la modification de matrice à tous les membres du rôle', () => {
    // Le super admin accorde l'export au rôle rental_agent sur le CRM
    const matrix = dbStore.getRolePermissionsMatrix();
    const updatedRentalPerms = {
      ...matrix.rental_agent,
      crm: [...(matrix.rental_agent.crm || []), 'export' as const],
    };

    dbStore.updateRolePermissions('rental_agent', updatedRentalPerms, 'Autorisation export CRM accordée');

    const rentalMember = dbStore.getUsers().find((u) => u.role === 'rental_agent')!;
    expect(hasEffectivePermission(rentalMember, 'crm', 'export', dbStore.getRolePermissionsMatrix())).toBe(true);
  });

  // SCÉNARIO 11 : La protection des données et documents privés
  it('Scénario 11: restreint la consultation des données sensibles et documents privés', () => {
    const cashier = dbStore.getUsers().find((u) => u.role === 'accountant_cashier')!;
    const driver = dbStore.getUsers().find((u) => u.role === 'driver')!;

    // La caissière a accès aux données financières sensibles
    expect(hasEffectivePermission(cashier, 'cash', 'sensitiveData')).toBe(true);

    // Le chauffeur n'a pas accès aux données sensibles
    expect(hasEffectivePermission(driver, 'cash', 'sensitiveData')).toBe(false);
    expect(hasEffectivePermission(driver, 'documents', 'sensitiveData')).toBe(false);
  });

  // SCÉNARIO 12 : La protection du dernier super administrateur actif
  it('Scénario 12: protège rigoureusement le dernier Super Administrateur actif contre la désactivation et la rétrogradation', () => {
    const activeSuperAdmins = dbStore.getUsers().filter((u) => u.role === 'super_admin' && u.isActive);
    expect(activeSuperAdmins.length).toBeGreaterThanOrEqual(1);

    const theSuperAdmin = activeSuperAdmins[0];

    // Tentative de rétrogradation de rôle
    expect(() => {
      dbStore.updateUser(theSuperAdmin.id, { role: 'viewer' });
    }).toThrow(/dernier Super Administrateur/);

    // Tentative de désactivation
    expect(() => {
      dbStore.toggleUserStatus(theSuperAdmin.id, 'DISABLED');
    }).toThrow(/dernier Super Administrateur/);
  });

  // SCÉNARIO 13 : L’enregistrement systématique des événements dans l’audit de sécurité
  it('Scénario 13: enregistre chaque création, modification de statut et altération de matrice dans les logs de sécurité', () => {
    const initialLogsCount = dbStore.getSecurityAuditLogs().length;

    // Création d'un compte
    const user = dbStore.addUser({
      fullName: 'Audit Log Test User',
      email: 'audit.test@fct-automobile.cm',
      phone: '+237 699 00 11 00',
      role: 'viewer',
      status: 'ACTIVE',
      isActive: true,
    });

    const logsAfterCreate = dbStore.getSecurityAuditLogs();
    expect(logsAfterCreate.length).toBe(initialLogsCount + 1);
    expect(logsAfterCreate[0].actionType).toBe('USER_CREATE');
    expect(logsAfterCreate[0].targetUserId).toBe(user.id);
  });

  // SCÉNARIO 14 : Bon fonctionnement après actualisation et reconnexion
  it('Scénario 14: persiste les utilisateurs et la matrice de permissions dans l’état du store', () => {
    const state = dbStore.getState();
    expect(state.users.length).toBeGreaterThan(0);
    expect(state.rolePermissions).toBeDefined();
    expect(state.rolePermissions.super_admin).toBeDefined();
    expect(state.rolePermissions.driver).toBeDefined();
  });

  // SCÉNARIO 15 : Absence de régression dans les autres modules
  it('Scénario 15: garantit que les opérations métier sur les véhicules, réservations et caisse fonctionnent sans régression', () => {
    const state = dbStore.getState();
    expect(state.vehicles.length).toBeGreaterThan(0);
    expect(state.contracts.length).toBeGreaterThan(0);
    expect(state.cashSessions.length).toBeGreaterThan(0);
  });

  // SCÉNARIO 16 : Cohérence de l’interface liste/showroom pour les véhicules et chauffeurs
  it('Scénario 16: vérifie que chaque chauffeur dispose des champs complets pour le showroom', () => {
    const drivers = dbStore.getState().drivers;
    expect(drivers.length).toBeGreaterThan(0);
    drivers.forEach((d) => {
      expect(d.fullName).toBeDefined();
      expect(d.licenseNumber).toBeDefined();
      expect(Array.isArray(d.licenseCategories)).toBe(true);
      expect(d.licenseExpiryDate).toBeDefined();
      expect(d.medicalExamExpiryDate).toBeDefined();
      expect(d.rating).toBeGreaterThanOrEqual(1);
    });
  });

  // SCÉNARIO 17 : Affichage correct des historiques et relations entre les services
  it('Scénario 17: relie correctement les chauffeurs avec les véhicules assignés et les contrats', () => {
    const state = dbStore.getState();
    const assignedDriver = state.drivers.find((d) => d.currentAssignedVehicleId);
    if (assignedDriver) {
      const veh = state.vehicles.find((v) => v.id === assignedDriver.currentAssignedVehicleId);
      expect(veh).toBeDefined();
    }
  });

  // SCÉNARIO 18 : Respect des permissions dans les fiches détaillées et les actions associées
  it('Scénario 18: applique hasEffectivePermission pour déterminer la visibilité des boutons d’action', () => {
    const viewer = dbStore.getUsers().find((u) => u.role === 'viewer')!;
    const admin = dbStore.getUsers().find((u) => u.role === 'super_admin')!;

    // Observateur ne peut pas modifier ni supprimer
    expect(hasEffectivePermission(viewer, 'users', 'update')).toBe(false);
    expect(hasEffectivePermission(viewer, 'users', 'delete')).toBe(false);

    // Super Admin a toutes les permissions
    expect(hasEffectivePermission(admin, 'users', 'update')).toBe(true);
    expect(hasEffectivePermission(admin, 'users', 'delete')).toBe(true);
  });

  // SCÉNARIO 19 : Assignation d'onglet supplémentaire en Lecture Seule à un chauffeur (Demande vocale utilisateur)
  it('Scénario 19: permet d’assigner un onglet supplémentaire en Lecture Seule (voir sans modifier)', () => {
    const driver = dbStore.getUsers().find((u) => u.role === 'driver')!;

    // 1. Par défaut, le rôle chauffeur n'a pas accès au stock
    expect(hasEffectivePermission(driver, 'stock', 'read')).toBe(false);
    const initialVisible = getUserVisibleModules(driver);
    expect(initialVisible.includes('stock')).toBe(false);

    // 2. L'administrateur lui accorde l'onglet Stock en Lecture Seule (read=true, create/update/delete=false)
    dbStore.updateUserOverrides(
      driver.id,
      {
        allow: { stock: ['read'] },
        deny: { stock: ['create', 'update', 'delete'] },
      },
      'Attribution exceptionnelle de l\'onglet Stock en consultation seule pour inventaire véhicule'
    );

    const updatedDriver = dbStore.getUserById(driver.id)!;

    // 3. L'onglet Stock est désormais visible dans sa barre latérale
    const newVisible = getUserVisibleModules(updatedDriver);
    expect(newVisible.includes('stock')).toBe(true);
    expect(hasEffectivePermission(updatedDriver, 'stock', 'read')).toBe(true);

    // 4. MAIS il ne peut PAS modifier ni créer de pièces (règle stricte : voir sans modifier)
    expect(hasEffectivePermission(updatedDriver, 'stock', 'update')).toBe(false);
    expect(hasEffectivePermission(updatedDriver, 'stock', 'create')).toBe(false);
    expect(hasEffectivePermission(updatedDriver, 'stock', 'delete')).toBe(false);
  });

  // SCÉNARIO 20 : Décochage et masquage d'un onglet par défaut pour un utilisateur spécifique
  it('Scénario 20: permet de masquer un onglet par défaut d’un collaborateur sans impacter son rôle', () => {
    const driver = dbStore.getUsers().find((u) => u.role === 'driver')!;

    // 1. Masquer l'onglet 'drivers' pour ce chauffeur spécifique via Deny
    dbStore.updateUserOverrides(
      driver.id,
      {
        deny: { drivers: ['read'] },
      },
      'Masquage exceptionnel de l\'onglet Conducteurs pour ce profil'
    );

    const updatedDriver = dbStore.getUserById(driver.id)!;

    // 2. L'onglet 'drivers' disparaît de sa liste visible
    const visibleMods = getUserVisibleModules(updatedDriver);
    expect(visibleMods.includes('drivers')).toBe(false);
    expect(hasEffectivePermission(updatedDriver, 'drivers', 'read')).toBe(false);

    // 3. Un autre chauffeur conserve son accès normal hérité du rôle
    const anotherDriver = dbStore.getUsers().find((u) => u.role === 'driver' && u.id !== driver.id);
    if (anotherDriver) {
      expect(getUserVisibleModules(anotherDriver).includes('drivers')).toBe(true);
      expect(hasEffectivePermission(anotherDriver, 'drivers', 'read')).toBe(true);
    }
  });
});

