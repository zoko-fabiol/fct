/**
 * @license
 * FCT Automobile - Service Catalogue Public Temps Réel (Location & Vente)
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Lit exclusivement `public_vehicles` (projection assainie alimentée par l'ERP).
 * Aucune donnée factice : si le catalogue est vide, l'interface l'indique honnêtement.
 */

import { firestore, collection, onSnapshot } from './firebase.ts';
import { PublicVehicle, PUBLIC_VEHICLES_COLLECTION } from '../../../src/services/publicCatalog.ts';

export type { PublicVehicle };

export function subscribeToVehicles(
  onUpdate: (vehicles: PublicVehicle[]) => void,
  onError: (err: Error) => void
): () => void {
  try {
    return onSnapshot(
      collection(firestore, PUBLIC_VEHICLES_COLLECTION),
      (snapshot) => {
        const list: PublicVehicle[] = snapshot.docs.map(
          (docSnap) => ({ ...(docSnap.data() as PublicVehicle), id: docSnap.id })
        );
        onUpdate(list);
      },
      (error) => {
        console.error('[FCT Website] Erreur de synchronisation du catalogue :', error);
        onError(error);
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[FCT Website] Initialisation du catalogue impossible :', error);
    onError(error);
    return () => {};
  }
}
