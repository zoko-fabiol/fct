/**
 * FCT ERP & CRM AUTOMOBILE - Service Dédié Espace Adhérent Client
 * Franchise Conseils Trading - Douala, Cameroun
 * Synchronisation temps réel Firestore sans aucune fausse donnée.
 */

import {
  firestore,
  auth,
  FirebaseUser,
} from './firebase.ts';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface ClientBooking {
  id: string;
  reservationNumber?: string;
  vehicleId?: string;
  vehicleName?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  totalAmountEstimated?: number;
  depositAmount?: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  driverOptionIncluded?: boolean;
  destination?: string;
  notes?: string;
  createdAt?: string;
}

export interface ClientContract {
  id: string;
  contractNumber: string;
  vehicleModel?: string;
  licensePlate?: string;
  startDate: string;
  endDate: string;
  totalAmountXAF: number;
  depositAmountXAF: number;
  status: 'DRAFT' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
}

/**
 * Écoute en temps réel les réservations associées à l'email du client connecté.
 * Zéro fausse donnée : renvoie exactement les réservations stockées dans Firestore.
 */
export function subscribeClientBookings(
  email: string,
  onUpdate: (bookings: ClientBooking[]) => void
): () => void {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    onUpdate([]);
    return () => {};
  }

  try {
    const resCol = collection(firestore, 'reservations');
    const q = query(resCol, where('customerEmail', '==', cleanEmail));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ClientBooking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            reservationNumber: data.reservationNumber || docSnap.id,
            vehicleId: data.vehicleId,
            vehicleName: data.vehicleName || 'Véhicule FCT',
            startDate: data.startDate,
            endDate: data.endDate,
            durationDays: data.durationDays,
            totalAmountEstimated: data.totalAmountEstimated || data.totalAmount,
            depositAmount: data.depositAmount,
            status: data.status || 'PENDING',
            driverOptionIncluded: data.driverOptionIncluded,
            destination: data.destination,
            notes: data.notes,
            createdAt: data.createdAt,
          });
        });

        // Trier par date de création descendante
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      },
      (err) => {
        console.warn('[Client Portal] Erreur écoute réservations client :', err.message);
        onUpdate([]);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[Client Portal] Initialisation impossible :', err);
    onUpdate([]);
    return () => {};
  }
}

/**
 * Enregistrement ou mise à jour du profil adhérent dans Firestore (collection `customers`).
 * Permet au CRM de l'ERP FCT de reconnaître immédiatement le client.
 */
export async function syncCustomerProfile(
  user: FirebaseUser,
  extra: { fullName?: string; phone?: string }
): Promise<void> {
  try {
    const custRef = doc(firestore, 'customers', user.uid);
    await setDoc(
      custRef,
      {
        id: user.uid,
        email: user.email?.trim().toLowerCase() || '',
        fullName: extra.fullName || user.displayName || 'Client Adhérent FCT',
        phone: extra.phone || '',
        status: 'ACTIVE',
        isAdherent: true,
        source: 'PORTAL_SIGNUP',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Client Portal] Sync profil client non-bloquante :', err);
  }
}

/**
 * Libellé et couleur du badge de statut d'une réservation.
 */
export function getBookingStatusInfo(status: ClientBooking['status']): {
  label: string;
  bg: string;
  color: string;
} {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: 'Dossier Confirmé',
        bg: 'var(--fct-green-soft)',
        color: 'var(--fct-green-primary)',
      };
    case 'PENDING':
      return {
        label: 'En attente de validation agence',
        bg: '#fef3c7',
        color: '#b45309',
      };
    case 'COMPLETED':
      return {
        label: 'Location Terminée',
        bg: '#e0f2fe',
        color: '#0369a1',
      };
    case 'CANCELLED':
      return {
        label: 'Annulé',
        bg: '#fee2e2',
        color: '#b91c1c',
      };
    default:
      return {
        label: 'En traitement',
        bg: '#f1f5f9',
        color: '#475569',
      };
  }
}
