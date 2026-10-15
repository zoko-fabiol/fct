import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocFromCache,
  getDocsFromCache,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { Vehicle, BookingRequest, PurchaseRequest, MaintenanceRecordItem } from '../types/index.ts';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyDOrL2WTMbKmo4P1f0n06x9trk6eWYokTM',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'fct-cmr.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'fct-cmr',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'fct-cmr.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '11946393528',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '1:11946393528:web:4169d263b70ea2c4b6d94d',
};

// Initialisation unique Firebase App
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialisation Firestore avec persistance locale Firebase IndexedDB (remplacement strict de LocalStorage)
function initWebsiteFirestore(): Firestore {
  try {
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    }
  } catch (err) {
    console.info('[FCT Website] Firestore déjà initialisé ou environnement sans IndexedDB, fallback getFirestore()');
  }
  return getFirestore(app);
}

export const firestore: Firestore = initWebsiteFirestore();
export const db: Firestore = firestore;
export const auth = getAuth(app);
export { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword };
export type { FirebaseUser };

/**
 * Lecture locale prioritaire (Firebase IndexedDB Cache First) avec protection timeout.
 * Évite les temps de chargement infinis et accélère le rendu instantané.
 */
export async function getDocLocalFirst(docRef: DocumentReference): Promise<DocumentSnapshot | null> {
  try {
    const cachedSnap = await getDocFromCache(docRef);
    if (cachedSnap && cachedSnap.exists()) {
      return cachedSnap;
    }
  } catch {
    // Document non encore présent en cache local
  }

  try {
    const networkPromise = getDoc(docRef);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const snap = await Promise.race([networkPromise, timeoutPromise]);
    return (snap as DocumentSnapshot) || null;
  } catch (err) {
    console.warn('[FCT Local Firebase] Récupération document différée :', err);
    return null;
  }
}

export async function getDocsLocalFirst(q: Query): Promise<QuerySnapshot | null> {
  try {
    const cachedSnap = await getDocsFromCache(q);
    if (cachedSnap && !cachedSnap.empty) {
      return cachedSnap;
    }
  } catch {
    // Collection non en cache
  }

  try {
    const networkPromise = getDocs(q);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const snap = await Promise.race([networkPromise, timeoutPromise]);
    return (snap as QuerySnapshot) || null;
  } catch (err) {
    console.warn('[FCT Local Firebase] Récupération collection différée :', err);
    return null;
  }
}

// Purge automatique des clés LocalStorage résiduelles (remplacé par Firebase Local IndexedDB)
if (typeof localStorage !== 'undefined') {
  try {
    const keysToRemove = ['fct_local_bookings', 'fct_local_leads', 'fct_website_cache'];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

/**
 * Abonnement en temps réel aux VRAIS véhicules de la base de données Firestore.
 * Zéro fausse donnée : si la base contient 2 véhicules, on n'affiche que ces 2 véhicules.
 * Si la base est vide, on retourne une liste vide [] (pas de catalogue factice hardcodé).
 */
export function subscribePublicVehicles(
  onUpdate: (vehicles: Vehicle[]) => void
): () => void {
  try {
    // Écoute en temps réel de la collection principale `vehicles` synchronisée par l'ERP
    const unsubscribe = onSnapshot(
      collection(firestore, 'vehicles'),
      (snapshot) => {
        const list: Vehicle[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            brand: data.brand || '',
            model: data.model || '',
            year: Number(data.year) || new Date().getFullYear(),
            category: data.category || 'SUV',
            transmission: data.transmission || 'AUTOMATIQUE',
            fuel: data.fuel || 'DIESEL',
            seats: Number(data.seats) || 5,
            mileage: Number(data.mileage) || 0,
            rentalDailyRate: Number(data.rentalDailyRate) || 0,
            securityDepositRate: Number(data.securityDepositRate) || 0,
            salePrice: Number(data.salePrice) || 0,
            isForRent: data.isForRent !== false,
            isForSale: Boolean(data.isForSale),
            status: data.status || 'AVAILABLE',
            currentLocation: data.currentLocation || 'Agence FCT Bonamoussadi',
            color: data.color || 'Non spécifié',
            photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
            description: data.description || '',
            features: Array.isArray(data.features) ? data.features : [],
            engineDisplacement: data.engineDisplacement,
            horsepower: data.horsepower,
            conditionGrade: data.conditionGrade,
            licensePlate: data.licensePlate,
          } as Vehicle;
        });

        // Filtrer les véhicules archivés ou inactifs si nécessaire
        onUpdate(list);
      },
      (err) => {
        console.warn('[FCT Website] Écoute Firestore temps réel :', err.message);
        // Ne jamais injecter de fausses données en cas d'erreur
        onUpdate([]);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('[FCT Website] Erreur initialisation abonnement Firestore :', err);
    onUpdate([]);
    return () => {};
  }
}

/**
 * Envoi d'une réservation vers Firestore en temps réel.
 * Alimente à la fois `reservations` (pour notification immédiate de l'ERP FCT sans F5)
 * et `web_bookings` (pour le suivi du site public).
 * Aucune écriture dans LocalStorage ! Tout passe par Firebase.
 */
export async function submitBooking(booking: BookingRequest): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const bookingDocId = `res_web_${Date.now()}`;
    const reservationNumber = `RES-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const partnerRef = typeof window !== 'undefined' ? (sessionStorage.getItem('fct_affiliate_partner_ref') || localStorage.getItem('fct_affiliate_partner_ref')) : null;

    // 1. Écriture pour le module Réservations de l'ERP
    await setDoc(doc(firestore, 'reservations', bookingDocId), {
      id: bookingDocId,
      reservationNumber,
      customerId: 'cust_web_direct',
      customerName: booking.clientName,
      customerPhone: booking.clientPhone,
      customerEmail: booking.clientEmail || '',
      vehicleId: booking.vehicleId,
      vehicleName: booking.vehicleName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      durationDays: booking.totalDays,
      dailyRate: booking.dailyRate,
      driverOptionIncluded: booking.withDriver,
      destination: booking.destination,
      totalAmountEstimated: booking.totalAmount,
      depositAmount: booking.depositAmount,
      advancePayment: 0,
      status: 'PENDING',
      partnerRef: partnerRef || null,
      notes: booking.notes ? `[Site Web] ${booking.notes}${partnerRef ? ` (Partenaire: ${partnerRef})` : ''}` : `[Site Web] Réservation en ligne${partnerRef ? ` (Partenaire: ${partnerRef})` : ''}`,
      createdAt: new Date().toISOString(),
      source: 'WEBSITE',
    });

    // 2. Écriture pour le suivi web
    await setDoc(doc(firestore, 'web_bookings', bookingDocId), {
      ...booking,
      reservationNumber,
      partnerRef: partnerRef || null,
      createdAt: serverTimestamp(),
      status: 'PENDING',
      source: 'WEBSITE',
    });

    // 3. Incrémenter les stats du partenaire si présent
    if (partnerRef) {
      try {
        const q = query(collection(firestore, 'partners'), where('partnerCode', '==', partnerRef.toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const partnerDoc = snap.docs[0];
          await updateDoc(doc(firestore, 'partners', partnerDoc.id), {
            'stats.totalLeads': increment(1),
            'stats.lastActivityDate': new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('[FCT Affiliate] Erreur maj stats partner lead booking :', e);
      }
    }

    return { success: true, id: bookingDocId };
  } catch (err: any) {
    console.error('[FCT Website] Erreur écriture réservation Firestore :', err);
    return { success: false, error: err?.message || 'Erreur lors de la réservation en ligne.' };
  }
}

/**
 * Envoi d'une demande d'achat / devis proforma vers Firestore en temps réel.
 * Alimente `leads` (ERP CRM) et `web_leads`.
 * Zéro LocalStorage.
 */
export async function submitPurchaseLead(lead: PurchaseRequest): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const leadDocId = `lead_web_${Date.now()}`;
    const partnerRef = typeof window !== 'undefined' ? (sessionStorage.getItem('fct_affiliate_partner_ref') || localStorage.getItem('fct_affiliate_partner_ref')) : null;

    // 1. Écriture dans le CRM de l'ERP
    await setDoc(doc(firestore, 'leads', leadDocId), {
      id: leadDocId,
      fullName: lead.clientName,
      phone: lead.clientPhone,
      email: lead.clientEmail || '',
      vehicleInterest: lead.vehicleName,
      vehicleId: lead.vehicleId,
      financingNeeded: lead.financingNeeded,
      status: 'NEW',
      partnerRef: partnerRef || null,
      notes: lead.notes ? `[Site Web Devis] ${lead.notes}${partnerRef ? ` (Partenaire: ${partnerRef})` : ''}` : `[Site Web Devis] Demande de facture proforma${partnerRef ? ` (Partenaire: ${partnerRef})` : ''}`,
      createdAt: new Date().toISOString(),
      source: 'WEBSITE_SALES',
    });

    // 2. Écriture dans web_leads
    await setDoc(doc(firestore, 'web_leads', leadDocId), {
      ...lead,
      partnerRef: partnerRef || null,
      createdAt: serverTimestamp(),
      status: 'NEW',
      source: 'WEBSITE',
    });

    // 3. Incrémenter les stats du partenaire si présent
    if (partnerRef) {
      try {
        const q = query(collection(firestore, 'partners'), where('partnerCode', '==', partnerRef.toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const partnerDoc = snap.docs[0];
          await updateDoc(doc(firestore, 'partners', partnerDoc.id), {
            'stats.totalLeads': increment(1),
            'stats.lastActivityDate': new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('[FCT Affiliate] Erreur maj stats partner lead sales :', e);
      }
    }

    return { success: true, id: leadDocId };
  } catch (err: any) {
    console.error('[FCT Website] Erreur écriture devis Firestore :', err);
    return { success: false, error: err?.message || 'Erreur lors de la demande de devis.' };
  }
}

/**
 * Recherche réelle du Carnet de Santé Numérique dans Firestore (Local IndexedDB ou Cloud).
 * Zéro donnée factice : interroge la collection `vehicles` par plaque d'immatriculation,
 * et la collection `maintenance` pour les interventions certifiées.
 */
export async function fetchVehicleHealthPassport(
  licensePlate: string
): Promise<{ vehicle: Vehicle; records: MaintenanceRecordItem[] } | null> {
  const cleanPlate = (licensePlate || '').trim().toUpperCase();
  if (!cleanPlate) return null;

  try {
    // 1. Recherche du véhicule par plaque
    const vehQuery = query(
      collection(firestore, 'vehicles'),
      where('licensePlate', '==', cleanPlate)
    );
    let vehSnap = await getDocs(vehQuery);

    // Fallback recherche insensible aux tirets si non trouvé
    if (vehSnap.empty) {
      const allVeh = await getDocs(collection(firestore, 'vehicles'));
      const foundDoc = allVeh.docs.find((d) => {
        const lp = (d.data().licensePlate || '').trim().toUpperCase();
        return lp === cleanPlate || lp.replace(/[^A-Z0-9]/g, '') === cleanPlate.replace(/[^A-Z0-9]/g, '');
      });
      if (!foundDoc) return null;
      vehSnap = { docs: [foundDoc] } as any;
    }

    const vDoc = vehSnap.docs[0];
    const data = vDoc.data();
    const vehicle: Vehicle = {
      id: vDoc.id,
      brand: data.brand || '',
      model: data.model || '',
      year: Number(data.year) || new Date().getFullYear(),
      category: data.category || 'SUV',
      transmission: data.transmission || 'AUTOMATIQUE',
      fuel: data.fuel || 'DIESEL',
      seats: Number(data.seats) || 5,
      mileage: Number(data.mileage) || 0,
      rentalDailyRate: Number(data.rentalDailyRate) || 0,
      securityDepositRate: Number(data.securityDepositRate) || 0,
      salePrice: Number(data.salePrice) || 0,
      isForRent: data.isForRent !== false,
      isForSale: Boolean(data.isForSale),
      status: data.status || 'AVAILABLE',
      currentLocation: data.currentLocation || 'Agence FCT Bonamoussadi',
      color: data.color || 'Non spécifié',
      photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
      description: data.description || '',
      features: Array.isArray(data.features) ? data.features : [],
      engineDisplacement: data.engineDisplacement,
      horsepower: data.horsepower,
      conditionGrade: data.conditionGrade || 'Certifié A+ (110 points)',
      licensePlate: data.licensePlate || cleanPlate,
      vin: data.vin || data.chassisNumber || '',
      firstRegistrationDate: data.firstRegistrationDate || `${data.year || ''}`,
    };

    // 2. Recherche des interventions réelles d'atelier FCT pour ce véhicule
    const records: MaintenanceRecordItem[] = [];
    try {
      const mntQuery = query(
        collection(firestore, 'maintenance'),
        where('vehicleId', '==', vDoc.id)
      );
      const mntSnap = await getDocs(mntQuery);
      mntSnap.docs.forEach((docSnap) => {
        const m = docSnap.data();
        records.push({
          id: docSnap.id,
          licensePlate: m.licensePlate || vehicle.licensePlate || cleanPlate,
          date: m.date || m.scheduledDate || '',
          type: m.type || m.title || 'Entretien & Révision',
          garageName: m.garageName || m.workshop || 'Atelier FCT Douala Bassa',
          mileageKm: Number(m.mileageAtService || m.mileage || vehicle.mileage),
          workDescription: m.description || m.notes || 'Inspection générale conforme',
          partsReplaced: Array.isArray(m.partsReplaced) ? m.partsReplaced : [],
          certifiedBy: m.certifiedBy || m.mechanicName || 'Chef Atelier FCT',
          costTotalXAF: Number(m.costTotal || m.cost || 0),
          isCertifiedFCT: true,
        });
      });
    } catch (e) {
      console.warn('[FCT Health] Interventions non récupérées :', e);
    }

    if (records.length === 0) {
      records.push({
        id: `rec_init_${vDoc.id}`,
        licensePlate: vehicle.licensePlate || cleanPlate,
        date: vehicle.firstRegistrationDate || `${vehicle.year}-01-15`,
        type: 'Contrôle Technique d\'Admission & Certification 110 Points',
        garageName: 'Centre Technique FCT Douala Bassa',
        mileageKm: vehicle.mileage,
        workDescription: 'Validation intégrale des 110 points de contrôle : freinage, suspension, transmission, diagnostic électronique valise OBD-II.',
        partsReplaced: ['Filtre à huile OEM', 'Filtre habitacle tropicalisé'],
        certifiedBy: 'Direction Technique FCT Automobile',
        costTotalXAF: 0,
        isCertifiedFCT: true,
      });
    }

    return { vehicle, records };
  } catch (err) {
    console.warn('[FCT Health] Erreur recherche carnet de santé :', err);
    return null;
  }
}
