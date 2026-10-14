import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/services/dbStore.ts';
import { sessionService } from '../src/services/sessionService.ts';
import { UserProfile } from '../packages/shared-types/index.ts';

describe('FCT Session Persistence & Anti-Logout on Refresh', () => {
  const dummyUser: UserProfile = {
    id: 'usr_claus_test',
    email: 'clausephwandji044@gmail.com',
    fullName: 'Claus Ephwandji (Direction)',
    firstName: 'Claus',
    lastName: 'Ephwandji',
    role: 'super_admin',
    phone: '+237 699 00 11 22',
    jobTitle: 'Directeur Général',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    sessionService.clearSession();
    dbStore.setCurrentUser(null);
  });

  it('devrait enregistrer la session dans sessionService lors de setCurrentUser', () => {
    dbStore.setCurrentUser(dummyUser);
    expect(dbStore.getAuthenticatedUser()).toEqual(dummyUser);
    expect(sessionService.getActiveSession()).toEqual(dummyUser);
  });

  it('devrait restaurer automatiquement la session même si la variable en mémoire a été réinitialisée', () => {
    // 1. L'utilisateur se connecte
    dbStore.setCurrentUser(dummyUser);

    // 2. Simulation d'un rechargement F5 (réinitialisation du store ou appel direct à getAuthenticatedUser)
    (dbStore as any).currentUser = null;
    const restored = dbStore.getAuthenticatedUser();

    expect(restored).not.toBeNull();
    expect(restored?.email).toBe('clausephwandji044@gmail.com');
  });

  it('ne devrait pas purger la session utilisateur lors du nettoyage de la base de données', () => {
    dbStore.setCurrentUser(dummyUser);
    dbStore.clearLocalStorage();

    // La session doit rester active !
    const userAfterPurge = dbStore.getAuthenticatedUser();
    expect(userAfterPurge).not.toBeNull();
    expect(userAfterPurge?.email).toBe('clausephwandji044@gmail.com');
  });

  it('devrait supprimer la session lors d\'une déconnexion explicite (setCurrentUser(null))', () => {
    dbStore.setCurrentUser(dummyUser);
    expect(sessionService.getActiveSession()).not.toBeNull();

    dbStore.setCurrentUser(null);
    expect(sessionService.getActiveSession()).toBeNull();
    expect(dbStore.getAuthenticatedUser()).toBeNull();
  });
});
