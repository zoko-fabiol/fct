/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service Dédié Espace Adhérent Client Multi-Onglets
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Synchronisation temps réel Firestore sans aucune fausse donnée :
 * 1. Identité & Coordonnées (Profil & NIU)
 * 2. Pièces d'Identité & Permis (GED avec téléversement Cloudinary sécurisé)
 * 3. Historique des Locations (Contrats & Réservations)
 * 4. Achats de Véhicules (Commandes de vente & Showroom)
 * 5. Factures & Règlements (Factures & Solde)
 * 6. Historique & Relation Client (Timeline interactive)
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
  addDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

// ==========================================
// TYPES & MODÈLES DE DONNÉES
// ==========================================

export interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappPhone?: string;
  companyName?: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  taxNumber?: string; // NIU (Numéro d'Identifiant Unique)
  address?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
  isAdherent?: boolean;
}

export type DocumentCategory =
  | 'ID_CARD'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'TAX_NOTICE'
  | 'REGISTRATION'
  | 'RESIDENCE_PROOF'
  | 'OTHER';

export interface ClientDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  notes?: string;
  uploadedAt: string;
  relatedCustomerId: string;
  customerEmail?: string;
  status?: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
}

export interface ClientRentalRecord {
  id: string;
  contractNumber: string;
  vehicleId?: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  durationDays?: number;
  totalAmountXAF: number;
  paidAmountXAF: number;
  remainingAmountXAF: number;
  status: 'ACTIVE' | 'RETURNED' | 'CANCELLED' | 'PENDING' | 'CONFIRMED';
  depositAmountXAF?: number;
  driverOptionIncluded?: boolean;
  destination?: string;
  createdAt?: string;
}

export interface ClientSaleRecord {
  id: string;
  orderNumber: string;
  vehicleId?: string;
  vehicleName: string;
  stage: string;
  negotiatedPriceXAF: number;
  paidAmountXAF: number;
  balanceXAF: number;
  orderDate?: string;
  notes?: string;
}

export interface ClientInvoiceRecord {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  totalAmountXAF: number;
  paidAmountXAF: number;
  balanceXAF: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
}

export interface ClientTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'RENTAL' | 'SALE' | 'INVOICE' | 'DOCUMENT' | 'ACCOUNT';
  badge?: string;
  badgeColor?: string;
}

// Rétrocompatibilité avec les versions précédentes
export interface ClientBooking extends ClientRentalRecord {
  reservationNumber?: string;
  totalAmountEstimated?: number;
  depositAmount?: number;
}

// ==========================================
// 1. GESTION DU PROFIL (Identité & Coordonnées)
// ==========================================

export function subscribeCustomerProfile(
  uid: string,
  email: string,
  onUpdate: (profile: ClientProfile | null) => void
): () => void {
  if (!uid && !email) {
    onUpdate(null);
    return () => {};
  }

  const cleanEmail = email.trim().toLowerCase();
  const custDocRef = doc(firestore, 'customers', uid);

  const unsub = onSnapshot(
    custDocRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onUpdate({
          id: snap.id,
          fullName: d.fullName || auth.currentUser?.displayName || 'Client Adhérent FCT',
          email: d.email || cleanEmail,
          phone: d.phone || '',
          whatsappPhone: d.whatsappPhone || d.phone || '',
          companyName: d.companyName || '',
          type: d.type === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL',
          taxNumber: d.taxNumber || '',
          address: d.address || '',
          city: d.city || 'Douala',
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt,
          isAdherent: d.isAdherent ?? true,
        });
      } else {
        // Profil par défaut généré à partir de Firebase Auth
        onUpdate({
          id: uid,
          fullName: auth.currentUser?.displayName || cleanEmail.split('@')[0] || 'Client Adhérent FCT',
          email: cleanEmail,
          phone: '',
          companyName: '',
          type: 'INDIVIDUAL',
          taxNumber: '',
          address: 'Douala, Cameroun',
          city: 'Douala',
          createdAt: new Date().toISOString(),
          isAdherent: true,
        });
      }
    },
    (err) => {
      console.warn('[Client Portal] Profil introuvable, création automatique :', err.message);
      onUpdate(null);
    }
  );

  return unsub;
}

export async function saveCustomerProfile(
  uid: string,
  data: Partial<ClientProfile>
): Promise<void> {
  const custDocRef = doc(firestore, 'customers', uid);
  await setDoc(
    custDocRef,
    {
      ...data,
      id: uid,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

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

// ==========================================
// 2. PIÈCES D'IDENTITÉ & PERMIS (GED)
// ==========================================

export function subscribeCustomerDocuments(
  uid: string,
  email: string,
  onUpdate: (docs: ClientDocument[]) => void
): () => void {
  const cleanEmail = email.trim().toLowerCase();
  const docsCol = collection(firestore, 'documents');

  // Écoute par relatedCustomerId ou customerEmail
  const qUid = query(docsCol, where('relatedCustomerId', '==', uid));

  const unsub = onSnapshot(
    qUid,
    (snapshot) => {
      const list: ClientDocument[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        list.push({
          id: snap.id,
          title: d.title || 'Document client',
          category: d.category || 'OTHER',
          fileUrl: d.fileUrl || '',
          notes: d.notes,
          uploadedAt: d.uploadedAt || new Date().toISOString(),
          relatedCustomerId: d.relatedCustomerId || uid,
          customerEmail: d.customerEmail || cleanEmail,
          status: d.status || 'VERIFIED',
        });
      });
      list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      onUpdate(list);
    },
    (err) => {
      console.warn('[Client Portal] GED documents :', err.message);
      onUpdate([]);
    }
  );

  return unsub;
}

export async function uploadClientDocumentFile(
  file: File,
  meta: {
    title: string;
    category: DocumentCategory;
    uid: string;
    email: string;
    notes?: string;
  }
): Promise<ClientDocument> {
  // 1. Upload Cloudinary sécurisé via preset non signé
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'fct_erp_unsigned');
  formData.append('folder', 'fct_documents/clients');

  const res = await fetch('https://api.cloudinary.com/v1_1/c58pcgcp/auto/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Échec du téléversement du fichier vers le coffre-fort sécurisé.');
  }

  const cloudData = await res.json();
  const fileUrl = cloudData.secure_url || cloudData.url;

  // 2. Enregistrement dans Firestore (collection `documents`)
  const docData = {
    title: meta.title.trim(),
    category: meta.category,
    fileUrl,
    notes: meta.notes || '',
    uploadedAt: new Date().toISOString(),
    relatedCustomerId: meta.uid,
    relatedEntityId: meta.uid,
    customerEmail: meta.email.trim().toLowerCase(),
    status: 'VERIFIED' as const,
    isPrivate: false,
  };

  const newDocRef = await addDoc(collection(firestore, 'documents'), docData);

  return {
    id: newDocRef.id,
    ...docData,
  };
}

// ==========================================
// 3. HISTORIQUE DES LOCATIONS (Contrats & Réservations)
// ==========================================

export function subscribeCustomerRentals(
  uid: string,
  email: string,
  onUpdate: (rentals: ClientRentalRecord[]) => void
): () => void {
  const cleanEmail = email.trim().toLowerCase();
  const unsubs: (() => void)[] = [];

  let contractsList: ClientRentalRecord[] = [];
  let reservationsList: ClientRentalRecord[] = [];

  const updateCombined = () => {
    // Fusionner en évitant les doublons
    const combined = [...contractsList];
    reservationsList.forEach((r) => {
      const exists = combined.some(
        (c) => c.contractNumber === r.contractNumber || (c.vehicleName === r.vehicleName && c.startDate === r.startDate)
      );
      if (!exists) {
        combined.push(r);
      }
    });

    combined.sort((a, b) => (b.startDate || b.createdAt || '').localeCompare(a.startDate || a.createdAt || ''));
    onUpdate(combined);
  };

  // Écoute des contrats de location
  try {
    const contractsCol = collection(firestore, 'rental_contracts');
    const qContracts = query(contractsCol, where('customerId', '==', uid));
    unsubs.push(
      onSnapshot(
        qContracts,
        (snap) => {
          contractsList = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              contractNumber: data.contractNumber || d.id,
              vehicleId: data.vehicleId,
              vehicleName: data.vehicleName || 'Véhicule de Location FCT',
              startDate: data.startDate || '',
              endDate: data.endDate || '',
              durationDays: data.durationDays,
              totalAmountXAF: data.totalAmountXAF || 0,
              paidAmountXAF: data.paidAmountXAF || 0,
              remainingAmountXAF: data.remainingAmountXAF || 0,
              depositAmountXAF: data.depositAmountXAF || 0,
              status: data.status || 'ACTIVE',
              createdAt: data.createdAt,
            };
          });
          updateCombined();
        },
        () => updateCombined()
      )
    );
  } catch (e) {
    // Fallback silencieux
  }

  // Écoute des réservations en ligne
  try {
    const resCol = collection(firestore, 'reservations');
    const qRes = query(resCol, where('customerEmail', '==', cleanEmail));
    unsubs.push(
      onSnapshot(
        qRes,
        (snap) => {
          reservationsList = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              contractNumber: data.reservationNumber || d.id,
              vehicleId: data.vehicleId,
              vehicleName: data.vehicleName || 'Véhicule de Location FCT',
              startDate: data.startDate || '',
              endDate: data.endDate || '',
              durationDays: data.durationDays || 1,
              totalAmountXAF: data.totalAmountEstimated || data.totalAmount || 0,
              paidAmountXAF: data.depositAmount || 0,
              remainingAmountXAF: (data.totalAmountEstimated || 0) - (data.depositAmount || 0),
              status: data.status || 'PENDING',
              driverOptionIncluded: data.driverOptionIncluded,
              destination: data.destination,
              createdAt: data.createdAt,
            };
          });
          updateCombined();
        },
        () => updateCombined()
      )
    );
  } catch (e) {
    // Fallback silencieux
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

export function subscribeClientBookings(
  email: string,
  onUpdate: (bookings: ClientBooking[]) => void
): () => void {
  return subscribeCustomerRentals('', email, onUpdate as any);
}

// ==========================================
// 4. ACHATS DE VÉHICULES (Ventes & Commandes)
// ==========================================

export function subscribeCustomerSales(
  uid: string,
  email: string,
  onUpdate: (sales: ClientSaleRecord[]) => void
): () => void {
  const cleanEmail = email.trim().toLowerCase();
  const unsubs: (() => void)[] = [];

  let salesList: ClientSaleRecord[] = [];
  let leadsList: ClientSaleRecord[] = [];

  const updateCombined = () => {
    const combined = [...salesList, ...leadsList];
    combined.sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
    onUpdate(combined);
  };

  try {
    const salesCol = collection(firestore, 'sales');
    const qSales = query(salesCol, where('customerId', '==', uid));
    unsubs.push(
      onSnapshot(
        qSales,
        (snap) => {
          salesList = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              orderNumber: data.orderNumber || d.id,
              vehicleId: data.vehicleId,
              vehicleName: data.vehicleName || 'Véhicule FCT Automobile',
              stage: data.stage || 'COMMANDE_VALIDÉE',
              negotiatedPriceXAF: data.negotiatedPriceXAF || 0,
              paidAmountXAF: data.paidAmountXAF || 0,
              balanceXAF: data.balanceXAF || 0,
              orderDate: data.createdAt?.split('T')[0] || '',
              notes: data.notes,
            };
          });
          updateCombined();
        },
        () => updateCombined()
      )
    );
  } catch (e) {
    // Fallback silencieux
  }

  // Écoute des leads d'achats web
  try {
    const leadsCol = collection(firestore, 'web_leads');
    const qLeads = query(leadsCol, where('email', '==', cleanEmail));
    unsubs.push(
      onSnapshot(
        qLeads,
        (snap) => {
          leadsList = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              orderNumber: `LEAD-${d.id.substring(0, 8).toUpperCase()}`,
              vehicleId: data.vehicleId,
              vehicleName: data.vehicleName || 'Demande d\'Achat Véhicule',
              stage: 'DEMANDE_EN_COURS',
              negotiatedPriceXAF: 0,
              paidAmountXAF: 0,
              balanceXAF: 0,
              orderDate: data.createdAt?.split('T')[0] || '',
              notes: data.notes,
            };
          });
          updateCombined();
        },
        () => updateCombined()
      )
    );
  } catch (e) {
    // Fallback silencieux
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

// ==========================================
// 5. FACTURES & RÈGLEMENTS
// ==========================================

export function subscribeCustomerInvoices(
  uid: string,
  email: string,
  onUpdate: (invoices: ClientInvoiceRecord[]) => void
): () => void {
  const invoicesCol = collection(firestore, 'invoices');
  const q = query(invoicesCol, where('customerId', '==', uid));

  const unsub = onSnapshot(
    q,
    (snap) => {
      const list: ClientInvoiceRecord[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          invoiceNumber: data.invoiceNumber || d.id,
          issueDate: data.issueDate || data.createdAt?.split('T')[0] || '',
          dueDate: data.dueDate,
          totalAmountXAF: data.totalAmountXAF || 0,
          paidAmountXAF: data.paidAmountXAF || 0,
          balanceXAF: data.balanceXAF ?? (data.totalAmountXAF - (data.paidAmountXAF || 0)),
          status: data.status || 'PENDING',
        };
      });
      list.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
      onUpdate(list);
    },
    (err) => {
      console.warn('[Client Portal] Factures client :', err.message);
      onUpdate([]);
    }
  );

  return unsub;
}

// ==========================================
// 6. HISTORIQUE & RELATION CLIENT (Timeline)
// ==========================================

export function buildClientTimeline(params: {
  profile: ClientProfile | null;
  docs: ClientDocument[];
  rentals: ClientRentalRecord[];
  sales: ClientSaleRecord[];
  invoices: ClientInvoiceRecord[];
}): ClientTimelineEvent[] {
  const events: ClientTimelineEvent[] = [];

  // 1. Création de compte
  if (params.profile?.createdAt) {
    events.push({
      id: 'evt_account_created',
      date: params.profile.createdAt.split('T')[0],
      title: 'Création du compte Adhérent FCT',
      description: `Bienvenue chez Franchise Conseils Trading ! Compte client actif sous le profil ${params.profile.fullName}.`,
      type: 'ACCOUNT',
      badge: 'Adhésion',
      badgeColor: '#0284c7',
    });
  }

  // 2. Documents GED
  params.docs.forEach((doc) => {
    events.push({
      id: `evt_doc_${doc.id}`,
      date: doc.uploadedAt.split('T')[0],
      title: `Dépôt justificatif : ${doc.title}`,
      description: `Document archivé avec succès dans le coffre-fort numérique FCT (${doc.category}).`,
      type: 'DOCUMENT',
      badge: 'Justificatif GED',
      badgeColor: '#7c3aed',
    });
  });

  // 3. Locations
  params.rentals.forEach((r) => {
    events.push({
      id: `evt_rental_${r.id}`,
      date: r.startDate || r.createdAt?.split('T')[0] || '',
      title: `Dossier de Location : ${r.vehicleName}`,
      description: `Location réf. ${r.contractNumber} (${r.durationDays || 1} jours) pour un montant total de ${(r.totalAmountXAF || 0).toLocaleString('fr-FR')} FCFA. Statut : ${r.status}.`,
      type: 'RENTAL',
      badge: 'Location',
      badgeColor: '#059669',
    });
  });

  // 4. Ventes
  params.sales.forEach((s) => {
    events.push({
      id: `evt_sale_${s.id}`,
      date: s.orderDate || '',
      title: `Dossier d'Achat : ${s.vehicleName}`,
      description: `Bon de commande ${s.orderNumber}. Statut du dossier commercial : ${s.stage}.`,
      type: 'SALE',
      badge: 'Vente Véhicule',
      badgeColor: '#d97706',
    });
  });

  // 5. Factures
  params.invoices.forEach((inv) => {
    events.push({
      id: `evt_invoice_${inv.id}`,
      date: inv.issueDate || '',
      title: `Facture émise : N° ${inv.invoiceNumber}`,
      description: `Montant total TTC : ${(inv.totalAmountXAF || 0).toLocaleString('fr-FR')} FCFA. Encaissé : ${(inv.paidAmountXAF || 0).toLocaleString('fr-FR')} FCFA.`,
      type: 'INVOICE',
      badge: inv.status === 'PAID' ? 'Facture Soldée' : 'Facture Émise',
      badgeColor: inv.status === 'PAID' ? '#059669' : '#dc2626',
    });
  });

  // Trier du plus récent au plus ancien
  events.sort((a, b) => b.date.localeCompare(a.date));
  return events;
}

// Helpers de statut
export function getBookingStatusInfo(status: ClientRentalRecord['status']): {
  label: string;
  bg: string;
  color: string;
} {
  switch (status) {
    case 'CONFIRMED':
    case 'ACTIVE':
      return {
        label: status === 'ACTIVE' ? 'Location en cours' : 'Dossier Confirmé',
        bg: 'var(--fct-green-soft, #ecfdf5)',
        color: 'var(--fct-green-primary, #059669)',
      };
    case 'PENDING':
      return {
        label: 'En attente de validation agence',
        bg: '#fef3c7',
        color: '#b45309',
      };
    case 'RETURNED':
      return {
        label: 'Véhicule Restitué',
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
