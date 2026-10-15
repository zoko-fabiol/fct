/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Portail Adhérent & Espace Client Multi-Onglets
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 *
 * 6 Onglets Métiers Réels (Synchronisation temps réel Firestore, Zéro fausse donnée) :
 * 1. Identité & Coordonnées
 * 2. Pièces d'Identité & Permis (GED)
 * 3. Historique des Locations
 * 4. Achats de Véhicules
 * 5. Factures & Règlements
 * 6. Historique & Relation Client
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  User,
  ShieldCheck,
  KeyRound,
  LogOut,
  Calendar,
  MessageSquare,
  Printer,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileText,
  TrendingUp,
  Receipt,
  Upload,
  Eye,
  Download,
  Plus,
  Save,
  Building,
  MapPin,
  Phone,
  Mail,
  Hash,
  Shield,
  FileCheck,
  ExternalLink,
  X,
  CreditCard,
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
} from '../services/firebase.ts';
import {
  ClientProfile,
  ClientDocument,
  ClientRentalRecord,
  ClientSaleRecord,
  ClientInvoiceRecord,
  DocumentCategory,
  subscribeCustomerProfile,
  saveCustomerProfile,
  subscribeCustomerDocuments,
  uploadClientDocumentFile,
  subscribeCustomerRentals,
  subscribeCustomerSales,
  subscribeCustomerInvoices,
  buildClientTimeline,
  getBookingStatusInfo,
  syncCustomerProfile,
} from '../services/clientPortalService.ts';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal.tsx';
import { PinVerificationModal } from '../components/PinVerificationModal.tsx';
import { sendEmailVerificationPin, verifyEmailPin, sendFirebaseEmailVerification } from '../services/authSecurityService.ts';
import { AppPage } from '../types/router.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';
import { WebsiteLanguage, websiteI18n } from '../services/i18n.ts';
import { UnifiedPhoneChannelsInput } from '../components/UnifiedPhoneChannelsInput.tsx';
import { saveSharedContactInfo, getSharedContactInfo } from '../services/profileService.ts';

type PortalTab = 'PROFILE' | 'DOCS' | 'RENTALS' | 'SALES' | 'INVOICES' | 'TIMELINE';

interface ClientPortalPageProps {
  onToast: (msg: string) => void;
  onNavigate?: (page: AppPage) => void;
  lang?: WebsiteLanguage;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ onToast, onNavigate, lang = 'fr' }) => {
  const isEn = lang === 'en';
  const t = websiteI18n[lang].portal;

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [activeTab, setActiveTab] = useState<PortalTab>('PROFILE');

  // Données réelles Firestore (Temps Réel)
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [rentals, setRentals] = useState<ClientRentalRecord[]>([]);
  const [sales, setSales] = useState<ClientSaleRecord[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoiceRecord[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);

  // Édition profil
  const sharedContact = getSharedContactInfo();
  const [editProfileForm, setEditProfileForm] = useState<Partial<ClientProfile>>(() => ({
    fullName: sharedContact.fullName || '',
    phone: sharedContact.phone || '',
    whatsappPhone: sharedContact.whatsappPhone || sharedContact.phone || '',
    city: sharedContact.city || 'Douala',
    taxNumber: sharedContact.taxNumber || '',
  }));
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Téléversement GED (Documents)
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('DRIVING_LICENSE');
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState('');

  // Formulaire d'authentification
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(() => sharedContact.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(() => sharedContact.fullName || '');
  const [phone, setPhone] = useState(() => sharedContact.phone || '');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 2FA Code PIN & Mot de passe oublié
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | undefined>(undefined);

  // 1. Écoute de la session Firebase Auth
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // 2. Écoute de toutes les collections du client connecté
  useEffect(() => {
    if (!currentUser?.uid || !currentUser?.email) {
      setProfile(null);
      setDocs([]);
      setRentals([]);
      setSales([]);
      setInvoices([]);
      return;
    }

    setIsLoadingData(true);
    const uid = currentUser.uid;
    const userEmail = currentUser.email;

    const unsubProfile = subscribeCustomerProfile(uid, userEmail, (prof) => {
      setProfile(prof);
      if (prof) {
        saveSharedContactInfo({
          fullName: prof.fullName,
          phone: prof.phone,
          whatsappPhone: prof.whatsappPhone || prof.phone,
          city: prof.city,
          email: prof.email,
          taxNumber: prof.taxNumber,
        });
        setEditProfileForm({
          fullName: prof.fullName,
          phone: prof.phone,
          whatsappPhone: prof.whatsappPhone || prof.phone,
          companyName: prof.companyName || '',
          type: prof.type,
          taxNumber: prof.taxNumber || '',
          address: prof.address || '',
          city: prof.city || 'Douala',
        });
      }
    });

    const unsubDocs = subscribeCustomerDocuments(uid, userEmail, (d) => {
      setDocs(d);
    });

    const unsubRentals = subscribeCustomerRentals(uid, userEmail, (r) => {
      setRentals(r);
      setIsLoadingData(false);
    });

    const unsubSales = subscribeCustomerSales(uid, userEmail, (s) => {
      setSales(s);
    });

    const unsubInvoices = subscribeCustomerInvoices(uid, userEmail, (inv) => {
      setInvoices(inv);
    });

    return () => {
      unsubProfile();
      unsubDocs();
      unsubRentals();
      unsubSales();
      unsubInvoices();
    };
  }, [currentUser]);

  // Timeline dynamique combinée
  const timelineEvents = useMemo(() => {
    return buildClientTimeline({ profile, docs, rentals, sales, invoices });
  }, [profile, docs, rentals, sales, invoices]);

  // Formatage monétaire FCFA
  const formatXAF = (amount: number) => {
    return (amount || 0).toLocaleString(isEn ? 'en-US' : 'fr-FR') + ' FCFA';
  };

  // Validation 2FA PIN et création effective du compte client
  const handleVerifyPinRegistration = async (inputPin: string) => {
    const check = await verifyEmailPin(email.trim(), inputPin, generatedPin);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Le code PIN a déjà validé l'adresse e-mail : pas besoin du mail générique Firebase en doublon
      await syncCustomerProfile(cred.user, { fullName: fullName.trim(), phone: phone.trim() });
      setCurrentUser(cred.user);
      setShowPinVerification(false);
      onToast(
        isEn
          ? `Welcome ${fullName.trim()}! Your FCT member portal is ready.`
          : `Bienvenue ${fullName.trim()} ! Votre espace client FCT est prêt.`
      );
      return { success: true };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: isEn ? 'This email is already in use.' : 'Cette adresse email est déjà enregistrée.' };
      }
      return { success: false, error: err?.message || 'Erreur lors de la création du compte.' };
    }
  };

  const handleResendPin = async () => {
    const pinRes = await sendEmailVerificationPin(email.trim());
    setGeneratedPin(pinRes.pin || '123456');
    onToast(isEn ? 'New PIN code ready!' : 'Nouveau code PIN disponible !');
  };

  // Connexion / Inscription
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError(isEn ? 'Please provide both email and password.' : 'Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setAuthError(isEn ? 'Please provide your full name.' : 'Veuillez indiquer votre nom complet.');
          setAuthLoading(false);
          return;
        }

        if (password.length < 6) {
          setAuthError(isEn ? 'Password must be at least 6 characters.' : 'Le mot de passe doit contenir au moins 6 caractères.');
          setAuthLoading(false);
          return;
        }

        const pinRes = await sendEmailVerificationPin(email.trim());
        setGeneratedPin(pinRes.pin || '123456');
        setShowPinVerification(true);
        onToast(isEn ? `Verification PIN sent to ${email.trim()}` : `Code PIN de vérification envoyé à ${email.trim()}`);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setCurrentUser(cred.user);
        onToast(
          isEn
            ? `Glad to see you back on your FCT client portal!`
            : `Ravi de vous revoir sur votre espace client FCT !`
        );
      }
    } catch (err: any) {
      console.error('[Client Portal Auth Error]', err);
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setAuthError(isEn ? 'Incorrect email address or password.' : 'Adresse email ou mot de passe incorrect.');
      } else if (code === 'auth/email-already-in-use') {
        setAuthError(isEn ? 'This email address is already registered with FCT.' : 'Cette adresse email est déjà associée à un compte FCT.');
      } else if (code === 'auth/weak-password') {
        setAuthError(isEn ? 'Password must be at least 6 characters long.' : 'Le mot de passe doit contenir au moins 6 caractères.');
      } else if (code === 'auth/invalid-email') {
        setAuthError(isEn ? 'Invalid email address format.' : 'Format d’adresse email invalide.');
      } else {
        setAuthError(err.message || (isEn ? 'An error occurred during authentication. Please retry.' : 'Erreur lors de la connexion. Veuillez réessayer.'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setProfile(null);
      setDocs([]);
      setRentals([]);
      setSales([]);
      setInvoices([]);
      onToast(isEn ? 'You have logged out of your member portal.' : 'Vous êtes déconnecté de votre espace adhérent.');
    } catch (e: any) {
      console.warn('Erreur déconnexion:', e);
    }
  };

  // Sauvegarde des modifications du profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    setIsSavingProfile(true);
    try {
      const cleanFull = editProfileForm.fullName?.trim() || profile?.fullName;
      const cleanPh = editProfileForm.phone?.trim() || profile?.phone;
      const cleanWa = editProfileForm.whatsappPhone?.trim() || cleanPh;
      const cleanCity = editProfileForm.city?.trim() || 'Douala';
      const cleanTax = editProfileForm.taxNumber?.trim().toUpperCase() || '';

      await saveCustomerProfile(currentUser.uid, {
        fullName: cleanFull,
        phone: cleanPh,
        whatsappPhone: cleanWa,
        companyName: editProfileForm.companyName?.trim() || '',
        type: editProfileForm.type || 'INDIVIDUAL',
        taxNumber: cleanTax,
        address: editProfileForm.address?.trim() || '',
        city: cleanCity,
      });

      saveSharedContactInfo({
        fullName: cleanFull,
        phone: cleanPh,
        whatsappPhone: cleanWa,
        city: cleanCity,
        taxNumber: cleanTax,
        email: currentUser.email || undefined,
      });

      onToast(isEn ? 'Profile updated successfully!' : 'Coordonnées et profil mis à jour avec succès !');
    } catch (err: any) {
      onToast(isEn ? 'Error updating profile.' : `Erreur : ${err.message || 'Mise à jour impossible'}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Dépôt d'un nouveau document dans la GED
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || !currentUser?.email) return;
    if (!docFile) {
      setDocUploadError(isEn ? 'Please choose a document file to upload.' : 'Veuillez sélectionner un fichier (JPG, PNG ou PDF).');
      return;
    }
    if (!docTitle.trim()) {
      setDocUploadError(isEn ? 'Please specify a document title.' : 'Veuillez renseigner le libellé du document.');
      return;
    }

    setIsUploadingDoc(true);
    setDocUploadError('');

    try {
      await uploadClientDocumentFile(docFile, {
        title: docTitle.trim(),
        category: docCategory,
        uid: currentUser.uid,
        email: currentUser.email,
        notes: docNotes.trim(),
      });

      setIsAddDocModalOpen(false);
      setDocTitle('');
      setDocNotes('');
      setDocFile(null);
      onToast(
        isEn
          ? 'Document safely archived in your FCT vault!'
          : 'Document archivé avec succès dans votre coffre-fort numérique !'
      );
    } catch (err: any) {
      setDocUploadError(err.message || (isEn ? 'Upload failed.' : 'Échec du téléversement vers le coffre-fort.'));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Catégories de documents
  const getDocCategoryLabel = (category: DocumentCategory) => {
    switch (category) {
      case 'DRIVING_LICENSE':
        return isEn ? 'Driver\'s License' : 'Permis de Conduire';
      case 'ID_CARD':
        return isEn ? 'National ID Card (CNI)' : 'Carte Nationale d\'Identité (CNI)';
      case 'PASSPORT':
        return isEn ? 'Passport' : 'Passeport';
      case 'RESIDENCE_PROOF':
        return isEn ? 'Proof of Residence' : 'Justificatif de Domicile';
      case 'REGISTRATION':
        return isEn ? 'Company Register (RCCM)' : 'Registre de Commerce (RCCM)';
      case 'TAX_NOTICE':
        return isEn ? 'Tax Certificate (NIU)' : 'Attestation Fiscale / NIU';
      default:
        return isEn ? 'Other Document' : 'Autre Document';
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* En-tête Espace Adhérent */}
      <div className="fct-page-header">
        <div className="fct-container">
          <span className="fct-badge fct-badge-blue">
            {isEn ? 'Member Space & VIP Client' : 'Espace Adhérent & Client Privilège'}
          </span>
          <h2>{isEn ? 'FCT Automobile Douala Client Portal' : 'Portail Client FCT Automobile Douala'}</h2>
          <p>
            {isEn
              ? 'Track your records, documents, rentals, vehicle purchases and invoices in real time.'
              : 'Gérez votre identité, vos pièces d’identité & permis (GED), vos locations, achats de véhicules et factures en temps réel.'}
          </p>
        </div>
      </div>

      <div className="fct-container">
        {currentUser ? (
          /* TABLEAU DE BORD CLIENT MULTI-ONGLETS */
          <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. Bandeau supérieur Adhérent */}
            <div
              style={{
                background: 'white',
                padding: '20px 24px',
                borderRadius: 20,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: 'var(--fct-blue-soft, #e0f2fe)',
                    color: 'var(--fct-blue-primary, #0f2a4a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {(profile?.fullName || currentUser.email || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                      {profile?.companyName || profile?.fullName || currentUser.displayName || 'Client Adhérent FCT'}
                    </h3>
                    <span className="fct-badge fct-badge-green" style={{ fontSize: 10 }}>
                      {profile?.type === 'COMPANY' ? 'Compte Entreprise' : 'Particulier'}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#ecfdf5',
                        color: '#059669',
                        fontWeight: 700,
                      }}
                    >
                      En Ligne ✓
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4, margin: 0 }}>
                    {currentUser.email} • {profile?.phone || 'Téléphone non renseigné'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: 12, padding: '8px 14px' }}
                >
                  <LogOut size={14} />
                  <span>{isEn ? 'Log Out' : 'Déconnexion'}</span>
                </button>
              </div>
            </div>

            {/* 2. Barre d'Onglets Officiels FCT (Exacte reproduction des 6 onglets demandés) */}
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                overflowX: 'auto',
                display: 'flex',
                gap: 4,
                padding: '6px',
              }}
            >
              {[
                {
                  id: 'PROFILE' as const,
                  label: isEn ? 'Identity & Contacts' : 'Identité & Coordonnées',
                  icon: User,
                  badge: null,
                },
                {
                  id: 'DOCS' as const,
                  label: isEn ? 'ID & Driving License (GED)' : 'Pièces d\'Identité & Permis (GED)',
                  icon: FileText,
                  badge: docs.length,
                },
                {
                  id: 'RENTALS' as const,
                  label: isEn ? 'Rental History' : 'Historique des Locations',
                  icon: KeyRound,
                  badge: rentals.length,
                },
                {
                  id: 'SALES' as const,
                  label: isEn ? 'Vehicle Purchases' : 'Achats de Véhicules',
                  icon: TrendingUp,
                  badge: sales.length,
                },
                {
                  id: 'INVOICES' as const,
                  label: isEn ? 'Invoices & Payments' : 'Factures & Règlements',
                  icon: Receipt,
                  badge: invoices.length,
                },
                {
                  id: 'TIMELINE' as const,
                  label: isEn ? 'History & Customer Relation' : 'Historique & Relation Client',
                  icon: Clock,
                  badge: null,
                },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? 'var(--fct-blue-primary, #0f2a4a)' : 'var(--text-sub, #475569)',
                      background: isActive ? '#f0f7ff' : 'transparent',
                      border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IconComponent size={16} color={isActive ? '#0284c7' : '#64748b'} />
                    <span>{tab.label}</span>
                    {tab.badge !== null && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 999,
                          background: isActive ? '#0284c7' : '#e2e8f0',
                          color: isActive ? 'white' : '#475569',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3. Contenu de chaque Onglet */}
            <div
              style={{
                background: 'white',
                padding: '28px',
                borderRadius: 20,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* ======================================================== */}
              {/* ONGLET 1 : IDENTITÉ & COORDONNÉES */}
              {/* ======================================================== */}
              {activeTab === 'PROFILE' && (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'Identity & Contact Details' : 'Identité & Coordonnées du Client'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {isEn
                          ? 'Manage your personal information, fiscal identifiers and agency contact numbers.'
                          : 'Renseignez vos coordonnées certifiées pour l\'établissement conforme de vos contrats de location et factures.'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="btn-primary"
                      style={{ fontSize: 13, padding: '10px 18px' }}
                    >
                      <Save size={15} />
                      <span>{isSavingProfile ? (isEn ? 'Saving...' : 'Enregistrement...') : (isEn ? 'Save Changes' : 'Enregistrer les Modifications')}</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {/* Bloc Coordonnées Principales */}
                    <div
                      style={{
                        padding: 20,
                        borderRadius: 16,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface-alt, #f8fafc)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fct-blue-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={16} />
                        <span>{isEn ? 'Personal Information' : 'Identité Principale'}</span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                          {isEn ? 'Full Name / Representative' : 'Nom Complet / Représentant :'}
                        </label>
                        <input
                          type="text"
                          value={editProfileForm.fullName || ''}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, fullName: e.target.value })}
                          className="fct-input"
                          placeholder="ex: Jean-Paul MBIIDA"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                          {isEn ? 'Account Type' : 'Type de Client :'}
                        </label>
                        <select
                          value={editProfileForm.type || 'INDIVIDUAL'}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, type: e.target.value as any })}
                          className="fct-input"
                        >
                          <option value="INDIVIDUAL">Particulier (B2C)</option>
                          <option value="COMPANY">Client Entreprise / Société (B2B)</option>
                        </select>
                      </div>

                      {editProfileForm.type === 'COMPANY' && (
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                            {isEn ? 'Company / Business Name' : 'Raison Sociale / Société :'}
                          </label>
                          <input
                            type="text"
                            value={editProfileForm.companyName || ''}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, companyName: e.target.value })}
                            className="fct-input"
                            placeholder="ex: CAMEROUN TRANSIT SARL"
                          />
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                          {isEn ? 'Email Address' : 'Adresse E-mail (Non modifiable) :'}
                        </label>
                        <input
                          type="email"
                          value={currentUser.email || ''}
                          disabled
                          className="fct-input"
                          style={{ background: '#e2e8f0', color: '#64748b', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

                    {/* Bloc Contact & Fiscalité */}
                    <div
                      style={{
                        padding: 20,
                        borderRadius: 16,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface-alt, #f8fafc)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building size={16} />
                        <span>{isEn ? 'Contact & Tax Information' : 'Fiscalité & Localisation'}</span>
                      </div>

                      <UnifiedPhoneChannelsInput
                        phone={editProfileForm.phone || ''}
                        whatsappPhone={editProfileForm.whatsappPhone || ''}
                        showPayoutChannel={false}
                        lang={lang}
                        labelPhone={isEn ? 'Phone Number (Calls)' : 'Numéro de Téléphone (Appels) :'}
                        onChange={({ phone: newPhone, whatsappPhone: newWa }) => {
                          setEditProfileForm((prev) => ({
                            ...prev,
                            phone: newPhone,
                            whatsappPhone: newWa,
                          }));
                          saveSharedContactInfo({ phone: newPhone, whatsappPhone: newWa });
                        }}
                      />

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                          {isEn ? 'Unique Tax ID (NIU)' : 'Numéro d\'Identifiant Unique (NIU) :'}
                        </label>
                        <input
                          type="text"
                          value={editProfileForm.taxNumber || ''}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, taxNumber: e.target.value.toUpperCase() })}
                          className="fct-input"
                          placeholder="ex: M102315784900P"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                            {isEn ? 'City' : 'Ville :'}
                          </label>
                          <input
                            type="text"
                            value={editProfileForm.city || 'Douala'}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, city: e.target.value })}
                            className="fct-input"
                            placeholder="Douala"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                            {isEn ? 'Address / Quarter' : 'Quartier / Adresse :'}
                          </label>
                          <input
                            type="text"
                            value={editProfileForm.address || ''}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                            className="fct-input"
                            placeholder="ex: Bonamoussadi"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* ======================================================== */}
              {/* ONGLET 2 : PIÈCES D'IDENTITÉ & PERMIS (GED) */}
              {/* ======================================================== */}
              {activeTab === 'DOCS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'Digital Records & Identity Proofs (GED)' : 'Dossier Numérique & Justificatifs Client (GED)'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {isEn
                          ? 'Scan of CNI, Passport, Driver\'s License, RCCM or Proof of Address stored in your secure vault.'
                          : 'Scan CNI ou Passeport, Permis de conduire, Justificatif de domicile, Registre du Commerce (RCCM).'}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddDocModalOpen(true)}
                      className="btn-primary"
                      style={{ fontSize: 13, padding: '10px 18px', background: '#7c3aed', borderColor: '#6d28d9' }}
                    >
                      <Upload size={15} />
                      <span>{isEn ? 'Attach Document' : 'Déposer un Document (CNI, Permis)'}</span>
                    </button>
                  </div>

                  {docs.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '48px 20px',
                        background: 'var(--bg-surface-alt, #f8fafc)',
                        borderRadius: 16,
                        border: '1.5px dashed var(--border-subtle)',
                      }}
                    >
                      <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'No digital documents archived yet' : 'Aucun document numérique archivé pour le moment'}
                      </h5>
                      <p style={{ fontSize: 13, color: 'var(--text-sub)', maxWidth: 460, margin: '8px auto 20px', lineHeight: 1.5 }}>
                        {isEn
                          ? 'Upload your driver\'s license and ID card now to get express vehicle handovers at the agency.'
                          : 'Téléversez votre permis de conduire et votre pièce d’identité dès maintenant pour bénéficier de la mise à disposition express de vos véhicules à l’agence.'}
                      </p>
                      <button
                        onClick={() => setIsAddDocModalOpen(true)}
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: 13, background: '#7c3aed' }}
                      >
                        <Plus size={15} />
                        <span>{isEn ? 'Add Driver\'s License or ID' : 'Ajouter mon Permis ou CNI'}</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            padding: 18,
                            background: 'white',
                            borderRadius: 16,
                            border: '1px solid var(--border-subtle)',
                            boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 12,
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <FileCheck size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: '#f3e8ff',
                                  color: '#6b21a8',
                                  marginBottom: 4,
                                }}
                              >
                                {getDocCategoryLabel(doc.category)}
                              </span>
                              <h5 style={{ fontSize: 14, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                                {doc.title}
                              </h5>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                Déposé le {doc.uploadedAt ? doc.uploadedAt.split('T')[0] : 'N/A'}
                              </div>
                              {doc.notes && (
                                <p style={{ fontSize: 11, color: 'var(--text-sub)', fontStyle: 'italic', margin: '4px 0 0' }}>
                                  {doc.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                            {doc.fileUrl && (
                              <>
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary"
                                  style={{ fontSize: 12, padding: '6px 12px' }}
                                >
                                  <Eye size={13} />
                                  <span>{isEn ? 'View' : 'Visualiser'}</span>
                                </a>
                                <a
                                  href={doc.fileUrl}
                                  download={doc.title}
                                  className="btn-secondary"
                                  style={{ fontSize: 12, padding: '6px 12px', color: '#059669', borderColor: '#a7f3d0' }}
                                >
                                  <Download size={13} />
                                  <span>{isEn ? 'Download' : 'Télécharger'}</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* ONGLET 3 : HISTORIQUE DES LOCATIONS */}
              {/* ======================================================== */}
              {activeTab === 'RENTALS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'Rental History & Active Contracts' : 'Historique des Locations & Contrats'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {isEn
                          ? 'All rental files, past or active, with balance tracking and documents.'
                          : 'Tous les contrats et réservations de location associés à votre compte, avec suivi du solde dû et options chauffeurs.'}
                      </p>
                    </div>

                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('location')}
                        className="btn-primary"
                        style={{ fontSize: 13, padding: '10px 18px' }}
                      >
                        <KeyRound size={15} />
                        <span>{isEn ? 'New Reservation' : 'Nouvelle Réservation'}</span>
                      </button>
                    )}
                  </div>

                  {rentals.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '48px 20px',
                        background: 'var(--bg-surface-alt, #f8fafc)',
                        borderRadius: 16,
                        border: '1.5px dashed var(--border-subtle)',
                      }}
                    >
                      <Car size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'No rental history recorded yet' : 'Aucun contrat de location enregistré pour le moment'}
                      </h5>
                      <p style={{ fontSize: 13, color: 'var(--text-sub)', maxWidth: 440, margin: '8px auto 20px', lineHeight: 1.5 }}>
                        {isEn
                          ? 'You do not have any past or active rentals. Browse our fleet of SUVs, 4x4s and sedans to book today.'
                          : 'Vos locations passées et en cours s’afficheront ici avec le détail de chaque véhicule et facture associée.'}
                      </p>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('location')}
                          className="btn-primary"
                          style={{ padding: '10px 20px', fontSize: 13 }}
                        >
                          <Car size={15} />
                          <span>{isEn ? 'Browse Rental Fleet' : 'Voir les Véhicules Disponibles'}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {rentals.map((r) => {
                        const statusInfo = getBookingStatusInfo(r.status);
                        const whatsappMsg = encodeURIComponent(
                          isEn
                            ? `Hello FCT Automobile, I have a question regarding my rental file ${r.contractNumber} for vehicle ${r.vehicleName}.`
                            : `Bonjour FCT Automobile, j'ai une question concernant mon dossier de location ${r.contractNumber} pour le véhicule ${r.vehicleName}.`
                        );

                        return (
                          <div
                            key={r.id}
                            style={{
                              padding: 20,
                              background: 'var(--bg-surface-alt, #f8fafc)',
                              borderRadius: 16,
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                              <div>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 10px',
                                    borderRadius: 6,
                                    background: statusInfo.bg,
                                    color: statusInfo.color,
                                    fontSize: 11,
                                    fontWeight: 800,
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                                <h5 style={{ fontSize: 17, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: '6px 0 2px' }}>
                                  {r.vehicleName}
                                </h5>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  N° Contrat / Réf : <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--fct-blue-primary)' }}>{r.contractNumber}</span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-primary)' }}>
                                  {formatXAF(r.totalAmountXAF)}
                                </div>
                                <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 2 }}>
                                  Encaissé : {formatXAF(r.paidAmountXAF)}
                                </div>
                                {r.remainingAmountXAF > 0 && (
                                  <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 800 }}>
                                    Solde restant : {formatXAF(r.remainingAmountXAF)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                gap: 16,
                                flexWrap: 'wrap',
                                fontSize: 12,
                                color: 'var(--text-sub)',
                                paddingTop: 8,
                                borderTop: '1px dashed var(--border-subtle)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={14} color="var(--fct-blue-primary)" />
                                <span>
                                  {r.startDate} au {r.endDate} ({r.durationDays || 1} jours)
                                </span>
                              </div>

                              {r.driverOptionIncluded && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 700 }}>
                                  <CheckCircle2 size={14} />
                                  <span>Chauffeur FCT Inclus</span>
                                </div>
                              )}

                              {r.destination && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <MapPin size={14} />
                                  <span>{r.destination}</span>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, flexWrap: 'wrap' }}>
                              <a
                                href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=${whatsappMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-emerald"
                                style={{ fontSize: 12, padding: '7px 12px' }}
                              >
                                <MessageSquare size={13} />
                                <span>{isEn ? 'WhatsApp Agent' : 'Échanger sur WhatsApp'}</span>
                              </a>

                              <button
                                onClick={() => window.print()}
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: '7px 12px' }}
                              >
                                <Printer size={13} />
                                <span>{isEn ? 'Print Contract' : 'Imprimer Fiche Contrat'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* ONGLET 4 : ACHATS DE VÉHICULES */}
              {/* ======================================================== */}
              {activeTab === 'SALES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'Vehicle Purchase Orders & Requests' : 'Commandes & Achats de Véhicules'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {isEn
                          ? 'Signed vehicle orders, inquiries and delivery statuses.'
                          : 'Bons de commande signés et demandes d\'achat de véhicules neufs ou occasions certifiées FCT.'}
                      </p>
                    </div>

                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('vente')}
                        className="btn-primary"
                        style={{ fontSize: 13, padding: '10px 18px', background: '#059669', borderColor: '#047857' }}
                      >
                        <TrendingUp size={15} />
                        <span>{isEn ? 'Explore Sales Showroom' : 'Consulter Showroom Vente'}</span>
                      </button>
                    )}
                  </div>

                  {sales.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '48px 20px',
                        background: 'var(--bg-surface-alt, #f8fafc)',
                        borderRadius: 16,
                        border: '1.5px dashed var(--border-subtle)',
                      }}
                    >
                      <TrendingUp size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'No vehicle purchase file on record' : 'Aucun dossier de vente lié à votre compte'}
                      </h5>
                      <p style={{ fontSize: 13, color: 'var(--text-sub)', maxWidth: 440, margin: '8px auto 20px', lineHeight: 1.5 }}>
                        {isEn
                          ? 'Interested in acquiring an SUV, pickup or luxury car? Discover our certified stock at Bonamoussadi.'
                          : 'Vous souhaitez acquérir un véhicule d’exception (Toyota Prado, Hilux, Mercedes GLE) ? Visitez notre catalogue de vente.'}
                      </p>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('vente')}
                          className="btn-primary"
                          style={{ padding: '10px 20px', fontSize: 13, background: '#059669' }}
                        >
                          <span>{isEn ? 'View Showroom' : 'Voir le Catalogue Vente FCT'}</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                      {sales.map((sale) => (
                        <div
                          key={sale.id}
                          style={{
                            padding: 20,
                            background: 'white',
                            borderRadius: 16,
                            border: '1px solid var(--border-subtle)',
                            boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--fct-blue-primary)', fontSize: 12 }}>
                              {sale.orderNumber}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: '#ecfdf5',
                                color: '#059669',
                              }}
                            >
                              {sale.stage}
                            </span>
                          </div>

                          <h5 style={{ fontSize: 16, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                            {sale.vehicleName}
                          </h5>

                          <div style={{ fontSize: 12, color: 'var(--text-sub)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {sale.negotiatedPriceXAF > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Prix de vente convenu :</span>
                                <strong style={{ color: 'var(--text-main)' }}>{formatXAF(sale.negotiatedPriceXAF)}</strong>
                              </div>
                            )}
                            {sale.paidAmountXAF > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Acompte versé :</span>
                                <strong style={{ color: '#059669' }}>{formatXAF(sale.paidAmountXAF)}</strong>
                              </div>
                            )}
                            {sale.balanceXAF > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Solde restant :</span>
                                <strong style={{ color: '#dc2626' }}>{formatXAF(sale.balanceXAF)}</strong>
                              </div>
                            )}
                            {sale.orderDate && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                Date de dossier : {sale.orderDate}
                              </div>
                            )}
                          </div>

                          <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                            <a
                              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=${encodeURIComponent(`Bonjour FCT Automobile, je vous contacte au sujet de mon bon de commande véhicule ${sale.orderNumber}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-emerald"
                              style={{ fontSize: 12, padding: '6px 12px' }}
                            >
                              <MessageSquare size={13} />
                              <span>{isEn ? 'Contact Sales' : 'Contacter Service Commercial'}</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* ONGLET 5 : FACTURES & RÈGLEMENTS */}
              {/* ======================================================== */}
              {activeTab === 'INVOICES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'Invoices & Customer Billing' : 'Factures & Règlements'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {isEn
                          ? 'Track all issued invoices, settlement statuses and remaining balances.'
                          : 'Toutes les factures et règlements associés à vos locations et acquisitions de véhicules.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => window.print()}
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: '8px 14px' }}
                      >
                        <Printer size={14} />
                        <span>{isEn ? 'Print Statement' : 'Imprimer Relevé'}</span>
                      </button>
                    </div>
                  </div>

                  {invoices.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '48px 20px',
                        background: 'var(--bg-surface-alt, #f8fafc)',
                        borderRadius: 16,
                        border: '1.5px dashed var(--border-subtle)',
                      }}
                    >
                      <Receipt size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'No invoice registered yet' : 'Aucune facture enregistrée pour ce client'}
                      </h5>
                      <p style={{ fontSize: 13, color: 'var(--text-sub)', maxWidth: 440, margin: '8px auto 0', lineHeight: 1.5 }}>
                        {isEn
                          ? 'Your official invoices will be automatically generated upon rental validation or vehicle purchase.'
                          : 'Dès validation de vos contrats par l\'agence FCT Automobile de Bonamoussadi, vos factures certifiées seront consultables ici.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: 'var(--fct-blue-dark, #0f2a4a)', color: 'white', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '12px 14px', borderRadius: '10px 0 0 0' }}>N° Facture</th>
                            <th style={{ padding: '12px 14px' }}>Date d'Émission</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total TTC</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Encaissé</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Solde Dû</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center' }}>Statut</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right', borderRadius: '0 10px 0 0' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((inv, idx) => (
                            <tr
                              key={inv.id}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                background: idx % 2 === 0 ? 'white' : '#f8fafc',
                              }}
                            >
                              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--fct-blue-primary)' }}>
                                {inv.invoiceNumber}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-sub)' }}>
                                {inv.issueDate}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>
                                {formatXAF(inv.totalAmountXAF)}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                {formatXAF(inv.paidAmountXAF)}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: inv.balanceXAF > 0 ? '#dc2626' : '#059669' }}>
                                {formatXAF(inv.balanceXAF)}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    background: inv.status === 'PAID' ? '#ecfdf5' : '#fef3c7',
                                    color: inv.status === 'PAID' ? '#059669' : '#b45309',
                                  }}
                                >
                                  {inv.status === 'PAID' ? 'Soldée ✓' : 'En attente'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <button
                                  onClick={() => window.print()}
                                  className="btn-secondary"
                                  style={{ fontSize: 11, padding: '5px 10px' }}
                                >
                                  <Printer size={12} />
                                  <span>{isEn ? 'Print' : 'Fiche'}</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* ONGLET 6 : HISTORIQUE & RELATION CLIENT */}
              {/* ======================================================== */}
              {activeTab === 'TIMELINE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                      {isEn ? 'History & Customer Relation Timeline' : 'Historique & Relation Client'}
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      {isEn
                        ? 'Chronological view of all your interactions with FCT Automobile Douala.'
                        : 'Fil chronologique de tous les événements, ouvertures de dossiers, dépôts de pièces et facturations liés à votre compte.'}
                    </p>
                  </div>

                  {timelineEvents.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '48px 20px',
                        background: 'var(--bg-surface-alt, #f8fafc)',
                        borderRadius: 16,
                        border: '1.5px dashed var(--border-subtle)',
                      }}
                    >
                      <Clock size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'No timeline activity yet' : 'Aucun événement dans l\'historique'}
                      </h5>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Ligne verticale de timeline */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          bottom: 8,
                          left: 7,
                          width: 2,
                          background: '#cbd5e1',
                        }}
                      />

                      {timelineEvents.map((evt) => (
                        <div key={evt.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {/* Point sur la ligne */}
                          <div
                            style={{
                              position: 'absolute',
                              left: -24,
                              top: 4,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: evt.badgeColor || '#0284c7',
                              border: '3px solid white',
                              boxShadow: '0 0 0 2px #cbd5e1',
                            }}
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {evt.date || 'Date N/A'}
                            </span>
                            {evt.badge && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: `${evt.badgeColor || '#0284c7'}15`,
                                  color: evt.badgeColor || '#0284c7',
                                }}
                              >
                                {evt.badge}
                              </span>
                            )}
                          </div>

                          <h5 style={{ fontSize: 15, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: '2px 0 0' }}>
                            {evt.title}
                          </h5>

                          <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
                            {evt.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal d'Upload GED (Pièces d'identité & Permis) */}
            {isAddDocModalOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                }}
              >
                <div
                  style={{
                    background: 'white',
                    borderRadius: 20,
                    maxWidth: 500,
                    width: '100%',
                    padding: 24,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: '#f5f3ff',
                          color: '#7c3aed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Upload size={20} />
                      </div>
                      <h4 style={{ fontSize: 17, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                        {isEn ? 'Attach Document to Vault' : 'Déposer un Document dans le Coffre-fort'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddDocModalOpen(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {docUploadError && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>
                      {docUploadError}
                    </div>
                  )}

                  <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                        {isEn ? 'Document Category :' : 'Type de Document :'}
                      </label>
                      <select
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                        className="fct-input"
                      >
                        <option value="DRIVING_LICENSE">Permis de Conduire</option>
                        <option value="ID_CARD">Carte Nationale d'Identité (CNI)</option>
                        <option value="PASSPORT">Passeport International</option>
                        <option value="RESIDENCE_PROOF">Justificatif de Domicile (Facture Eneo / CDE)</option>
                        <option value="REGISTRATION">Registre de Commerce (RCCM)</option>
                        <option value="TAX_NOTICE">Attestation Fiscale / NIU</option>
                        <option value="OTHER">Autre justificatif</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                        {isEn ? 'Document Title :' : 'Libellé / Titre du Document :'}
                      </label>
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="ex: Permis B Recto/Verso 2026"
                        className="fct-input"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                        {isEn ? 'Select File (JPG, PNG, PDF max 25MB) :' : 'Sélectionner le Fichier (JPG, PNG, PDF max 25 Mo) :'}
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        className="fct-input"
                        style={{ padding: '8px' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                        {isEn ? 'Notes (Optional) :' : 'Remarques ou Précisions (Facultatif) :'}
                      </label>
                      <input
                        type="text"
                        value={docNotes}
                        onChange={(e) => setDocNotes(e.target.value)}
                        placeholder="ex: En cours de renouvellement"
                        className="fct-input"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setIsAddDocModalOpen(false)}
                        className="btn-secondary"
                        style={{ fontSize: 13, padding: '10px 16px' }}
                      >
                        {isEn ? 'Cancel' : 'Annuler'}
                      </button>
                      <button
                        type="submit"
                        disabled={isUploadingDoc}
                        className="btn-primary"
                        style={{ fontSize: 13, padding: '10px 18px', background: '#7c3aed', borderColor: '#6d28d9' }}
                      >
                        <Upload size={14} />
                        <span>{isUploadingDoc ? (isEn ? 'Securing upload...' : 'Téléversement sécurisé...') : (isEn ? 'Upload to Vault' : 'Téléverser')}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* FORMULAIRE D'AUTHENTIFICATION CLIENT SI NON CONNECTÉ */
          /* ======================================================== */
          <div
            style={{
              maxWidth: 460,
              margin: '0 auto',
              background: 'white',
              padding: '36px 32px',
              borderRadius: 24,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: 'var(--fct-blue-soft)',
                  color: 'var(--fct-blue-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <ShieldCheck size={30} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                {isRegister
                  ? (isEn ? 'Create FCT Member Account' : 'Rejoindre l\'Espace Adhérent FCT')
                  : (isEn ? 'Client Portal Sign In' : 'Connexion Espace Client')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                {isRegister
                  ? (isEn ? 'Direct access to your rentals, GED and invoices' : 'Accédez à vos locations, documents GED et factures en direct')
                  : (isEn ? 'Enter your credentials to access your dashboard' : 'Identifiez-vous pour accéder à vos dossiers en temps réel')}
              </p>
            </div>

            {authError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isRegister && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                      {isEn ? 'Full Name :' : 'Nom et Prénom :'}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ex: Paul Biya"
                      className="fct-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                      {isEn ? 'Phone Number :' : 'Numéro de Téléphone :'}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+237 699 00 00 00"
                      className="fct-input"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                  {isEn ? 'Email Address :' : 'Adresse E-mail :'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="fct-input"
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {isEn ? 'Password :' : 'Mot de Passe :'}
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--fct-blue-primary)',
                        fontSize: 11,
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      {isEn ? 'Forgot password?' : 'Mot de passe oublié ?'}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="fct-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary"
                style={{ width: '100%', marginTop: 8, padding: '12px 20px', fontSize: 14 }}
              >
                {authLoading ? (
                  <span>{isEn ? 'Processing...' : 'Traitement en cours...'}</span>
                ) : isRegister ? (
                  <span>{isEn ? 'Verify Email & Create Account' : 'Vérifier l\'E-mail & Créer mon Compte'}</span>
                ) : (
                  <span>{isEn ? 'Access My Client Portal' : 'Accéder à Mon Espace Client'}</span>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setAuthError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--fct-blue-primary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {isRegister
                    ? (isEn ? 'Already registered? Sign in here' : 'Déjà adhérent ? Connectez-vous ici')
                    : (isEn ? 'New to FCT? Create your member account' : 'Nouveau client ? Créez votre compte adhérent')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modales Sécurisées 2FA PIN & Récupération MDP */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        defaultEmail={email}
        isEn={isEn}
      />

      <PinVerificationModal
        isOpen={showPinVerification}
        email={email}
        onCancel={() => setShowPinVerification(false)}
        onVerify={handleVerifyPinRegistration}
        onResend={handleResendPin}
        isEn={isEn}
      />
    </div>
  );
};
