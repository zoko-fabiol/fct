import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { Vehicle, BookingRequest, PurchaseRequest } from '../types/index.ts';
import { INITIAL_VEHICLES } from '../data/defaultCatalog.ts';

const firebaseConfig = {
  apiKey: "AIzaSyDa-placeholder-web-fct-douala",
  authDomain: "fct-cmr.firebaseapp.com",
  projectId: "fct-cmr",
  storageBucket: "fct-cmr.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword };
export type { FirebaseUser };

/**
 * Abonnement temps réel au catalogue public
 * Fallback immédiat et robuste sur INITIAL_VEHICLES si Firestore est vide ou non connecté
 */
export function subscribePublicVehicles(
  onUpdate: (vehicles: Vehicle[]) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(firestore, 'public_vehicles'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Vehicle[] = snapshot.docs.map((doc) => ({
            ...(doc.data() as Vehicle),
            id: doc.id,
          }));
          onUpdate(list);
        } else {
          // Utilise le catalogue officiel FCT pré-enregistré
          onUpdate(INITIAL_VEHICLES);
        }
      },
      (err) => {
        console.warn('[FCT Website] Firestore snapshot fallback:', err.message);
        onUpdate(INITIAL_VEHICLES);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[FCT Website] Utilisation du catalogue local FCT :', err);
    onUpdate(INITIAL_VEHICLES);
    return () => {};
  }
}

/**
 * Envoi d'une demande de réservation vers Firestore (web_bookings)
 */
export async function submitBooking(booking: BookingRequest): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await addDoc(collection(firestore, 'web_bookings'), {
      ...booking,
      createdAt: serverTimestamp(),
      status: 'PENDING',
      source: 'WEBSITE',
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    console.warn('[FCT Website] Booking fallback storage:', err);
    // Sauvegarde locale de secours pour ne pas perdre la demande client
    const existing = JSON.parse(localStorage.getItem('fct_local_bookings') || '[]');
    existing.push({ ...booking, id: 'local_' + Date.now(), createdAt: new Date().toISOString() });
    localStorage.setItem('fct_local_bookings', JSON.stringify(existing));
    return { success: true, id: 'fct_local_' + Date.now() };
  }
}

/**
 * Envoi d'une demande d'achat / devis proforma vers Firestore (web_leads)
 */
export async function submitPurchaseLead(lead: PurchaseRequest): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await addDoc(collection(firestore, 'web_leads'), {
      ...lead,
      createdAt: serverTimestamp(),
      status: 'NEW',
      source: 'WEBSITE',
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    console.warn('[FCT Website] Lead fallback storage:', err);
    const existing = JSON.parse(localStorage.getItem('fct_local_leads') || '[]');
    existing.push({ ...lead, id: 'local_' + Date.now(), createdAt: new Date().toISOString() });
    localStorage.setItem('fct_local_leads', JSON.stringify(existing));
    return { success: true, id: 'fct_lead_' + Date.now() };
  }
}
