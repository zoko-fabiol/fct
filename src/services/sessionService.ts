/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service de Persistance de Session Sécurisée
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 * 
 * Garantit que la session de l'utilisateur reste active après chaque actualisation (F5),
 * en ligne comme hors-ligne, sans jamais subir de déconnexion inattendue.
 */

import { UserProfile } from '../../packages/shared-types/index.ts';

const SESSION_STORAGE_KEY = 'fct_auth_session_user';
let memoryFallbackSession: UserProfile | null = null;

export const sessionService = {
  /**
   * Sauvegarde la session de l'utilisateur connecté
   */
  saveSession(user: UserProfile): void {
    memoryFallbackSession = user;

    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(user);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      }
    } catch (e) {
      console.warn('[FCT Session] Échec sauvegarde session locale :', e);
    }
  },

  /**
   * Récupère la session utilisateur persistée
   */
  getActiveSession(): UserProfile | null {
    if (typeof window !== 'undefined') {
      try {
        if (typeof sessionStorage !== 'undefined') {
          const fromSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (fromSession) {
            const parsed = JSON.parse(fromSession) as UserProfile;
            if (parsed && parsed.id && parsed.email) {
              memoryFallbackSession = parsed;
              return parsed;
            }
          }
        }

        if (typeof localStorage !== 'undefined') {
          const fromLocal = localStorage.getItem(SESSION_STORAGE_KEY);
          if (fromLocal) {
            const parsed = JSON.parse(fromLocal) as UserProfile;
            if (parsed && parsed.id && parsed.email) {
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem(SESSION_STORAGE_KEY, fromLocal);
              }
              memoryFallbackSession = parsed;
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn('[FCT Session] Erreur lecture session persistée :', e);
      }
    }

    return memoryFallbackSession;
  },

  /**
   * Efface complètement la session lors d'une déconnexion explicite
   */
  clearSession(): void {
    memoryFallbackSession = null;
    if (typeof window === 'undefined') return;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[FCT Session] Erreur suppression session :', e);
    }
  },
};
