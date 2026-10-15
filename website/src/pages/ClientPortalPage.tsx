import React, { useState, useEffect } from 'react';
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
  ClientBooking,
  subscribeClientBookings,
  syncCustomerProfile,
  getBookingStatusInfo,
} from '../services/clientPortalService.ts';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal.tsx';
import { PinVerificationModal } from '../components/PinVerificationModal.tsx';
import { sendEmailVerificationPin, verifyEmailPin, sendFirebaseEmailVerification } from '../services/authSecurityService.ts';
import { AppPage } from '../types/router.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';
import { WebsiteLanguage, websiteI18n } from '../services/i18n.ts';

interface ClientPortalPageProps {
  onToast: (msg: string) => void;
  onNavigate?: (page: AppPage) => void;
  lang?: WebsiteLanguage;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ onToast, onNavigate, lang = 'fr' }) => {
  const isEn = lang === 'en';
  const t = websiteI18n[lang].portal;
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Formulaire d'authentification
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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

  // 2. Écoute en temps réel des réservations réelles du client connecté (Firestore)
  useEffect(() => {
    if (!currentUser?.email) {
      setBookings([]);
      return;
    }

    setIsLoadingBookings(true);
    const unsubBookings = subscribeClientBookings(currentUser.email, (realBookings) => {
      setBookings(realBookings);
      setIsLoadingBookings(false);
    });

    return () => unsubBookings();
  }, [currentUser]);

  // Validation 2FA PIN et création effective du compte client
  const handleVerifyPinRegistration = async (inputPin: string) => {
    const check = await verifyEmailPin(email.trim(), inputPin, generatedPin);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendFirebaseEmailVerification(cred.user);
      await syncCustomerProfile(cred.user, { fullName: fullName.trim(), phone: phone.trim() });
      setCurrentUser(cred.user);
      setShowPinVerification(false);
      onToast(
        isEn
          ? `Welcome ${fullName.trim()}! Your FCT client account is active.`
          : `Bienvenue ${fullName.trim()} ! Votre compte client FCT est actif.`
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

  // Connexion / Inscription Authentique (avec déclenchement 2FA PIN si inscription)
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

        // Déclenchement de la double authentification par e-mail
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
      // Traduction des erreurs Firebase en français/anglais explicite (Silent-Failure Hunting)
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
      setBookings([]);
      onToast(isEn ? 'You have logged out of your member portal.' : 'Vous êtes déconnecté de votre espace adhérent.');
    } catch (e: any) {
      console.warn('Erreur déconnexion:', e);
    }
  };

  const handlePrintBooking = (b: ClientBooking) => {
    window.print();
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
              ? 'Track your reservations in real time, view your records and communicate directly with the Bonamoussadi agency.'
              : "Suivez vos réservations en temps réel, consultez vos devis et échangez directement avec l'agence de Bonamoussadi en toute autonomie."}
          </p>
        </div>
      </div>

      <div className="fct-container">
        {currentUser ? (
          /* Tableau de Bord Connecté (Temps Réel & Données Réelles) */
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Carte Profil Adhérent */}
            <div
              style={{
                background: 'white',
                padding: '24px 28px',
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
                    background: 'var(--fct-blue-soft)',
                    color: 'var(--fct-blue-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <UserCheck size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                      {isEn ? 'FCT Member Space' : 'Espace Adhérent FCT'}
                    </h3>
                    <span className="fct-badge fct-badge-green" style={{ fontSize: 10 }}>
                      {isEn ? 'Online' : 'En Ligne'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('profile')}
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: '8px 14px' }}
                  >
                    <User size={15} />
                    <span>{isEn ? 'Edit Profile' : 'Mon Profil & Paiements'}</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: 13, padding: '8px 14px' }}
                >
                  <LogOut size={15} />
                  <span>{isEn ? 'Log Out' : 'Déconnexion'}</span>
                </button>
              </div>
            </div>

            {/* Suivi des Réservations Réelles en Direct */}
            <div
              style={{
                background: 'white',
                padding: '28px',
                borderRadius: 20,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                    {isEn ? 'My Files & Recent Reservations' : 'Mes Dossiers & Réservations Récentes'}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {isEn
                      ? 'Live synchronization with the agency database (no page refresh)'
                      : "Synchronisation directe avec la base de données de l'agence (sans actualiser la page)"}
                  </p>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('location')}
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '8px 14px' }}
                  >
                    <KeyRound size={14} />
                    <span>{isEn ? 'New Reservation' : 'Nouvelle Réservation'}</span>
                  </button>
                )}
              </div>

              {isLoadingBookings ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #cbd5e1', borderTopColor: 'var(--fct-blue-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                  <div>{isEn ? 'Loading your Firestore records live...' : 'Chargement de vos dossiers Firestore en direct...'}</div>
                </div>
              ) : bookings.length > 0 ? (
                /* Liste des VRAIES réservations du client */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bookings.map((b) => {
                    const statusInfo = getBookingStatusInfo(b.status);
                    const whatsappMsg = encodeURIComponent(
                      isEn
                        ? `Hello FCT Automobile, I am contacting you regarding my booking file ${b.reservationNumber || b.id} for vehicle ${b.vehicleName || ''}.`
                        : `Bonjour FCT Automobile, je vous contacte concernant mon dossier de réservation ${b.reservationNumber || b.id} pour le véhicule ${b.vehicleName || ''}.`
                    );

                    return (
                      <div
                        key={b.id}
                        style={{
                          padding: 20,
                          background: 'var(--bg-surface-alt)',
                          borderRadius: 14,
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
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
                            <strong style={{ display: 'block', fontSize: 16, color: 'var(--fct-blue-dark)', marginTop: 6 }}>
                              {b.vehicleName}
                            </strong>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                              {isEn ? 'File Ref:' : 'Réf. Dossier :'} <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>{b.reservationNumber}</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-primary)' }}>
                              {(b.totalAmountEstimated || 0).toLocaleString(isEn ? 'en-US' : 'fr-FR')} FCFA
                            </div>
                            {b.depositAmount ? (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {isEn ? 'Deposit:' : 'Caution :'} {b.depositAmount.toLocaleString(isEn ? 'en-US' : 'fr-FR')} FCFA
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Détails Dates & Options */}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={14} color="var(--fct-blue-primary)" />
                            <span>
                              {isEn
                                ? `From ${b.startDate || '—'} to ${b.endDate || '—'} (${b.durationDays || 1} d)`
                                : `Du ${b.startDate || '—'} au ${b.endDate || '—'} (${b.durationDays || 1} j)`}
                            </span>
                          </div>

                          {b.driverOptionIncluded && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--fct-green-primary)', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>{isEn ? 'FCT Dedicated Chauffeur' : 'Option Chauffeur FCT'}</span>
                            </div>
                          )}

                          {b.destination && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Clock size={14} />
                              <span>{isEn ? 'Destination:' : 'Destination :'} {b.destination}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions Rapides */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, flexWrap: 'wrap' }}>
                          <a
                            href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=${whatsappMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-emerald"
                            style={{ fontSize: 12, padding: '7px 12px' }}
                          >
                            <MessageSquare size={13} />
                            <span>{isEn ? 'Chat on WhatsApp' : 'Échanger sur WhatsApp'}</span>
                          </a>

                          <button
                            onClick={() => handlePrintBooking(b)}
                            className="btn-secondary"
                            style={{ fontSize: 12, padding: '7px 12px' }}
                          >
                            <Printer size={13} />
                            <span>{isEn ? 'Print File' : 'Imprimer Fiche'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ÉTAT VIDE RÉEL (Zero Fake Data) */
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    background: 'var(--bg-surface-alt)',
                    borderRadius: 16,
                    border: '1.5px dashed var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'white',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Car size={26} strokeWidth={1.5} />
                  </div>
                  <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                    {isEn ? 'No active reservation file' : 'Aucun dossier de réservation en cours'}
                  </h5>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', maxWidth: 420, margin: '8px auto 20px', lineHeight: 1.5 }}>
                    {isEn
                      ? `You haven't made any reservations yet with the address ${currentUser.email}. Your upcoming validated rentals will automatically appear here.`
                      : `Vous n'avez pas encore effectué de réservation avec l'adresse ${currentUser.email}. Vos prochaines demandes validées en agence apparaîtront ici automatiquement.`}
                  </p>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('location')}
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: 13 }}
                    >
                      <span>{isEn ? 'Browse Available Fleet' : 'Explorer la Flotte Disponible'}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Formulaire de Connexion / Inscription Authentique */
          <div
            style={{
              maxWidth: 460,
              margin: '0 auto',
              background: 'white',
              padding: '36px 32px',
              borderRadius: 24,
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src="/fct-logo.png"
                alt="FCT - Franchise Conseils Trading"
                style={{
                  height: 48,
                  width: 'auto',
                  maxWidth: 200,
                  objectFit: 'contain',
                  margin: '0 auto 16px',
                  display: 'block',
                }}
              />
              <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                {isRegister
                  ? (isEn ? 'Create Member Account' : 'Créer un Compte Adhérent')
                  : (isEn ? 'Client Portal Sign In' : 'Connexion Espace Client')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                {isEn
                  ? 'Access your files live and enjoy FCT VIP privileges'
                  : 'Accédez à vos dossiers en direct et bénéficiez des privilèges FCT'}
              </p>
            </div>

            {authError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: 10,
                  color: '#991b1b',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isRegister && (
                <>
                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Full Name *' : 'Nom complet *'}</label>
                    <input
                      type="text"
                      placeholder={isEn ? 'e.g. Alain BIYIK' : 'Ex: Alain BIYIK'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>
                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Phone Number / WhatsApp' : 'Numéro de téléphone / WhatsApp'}</label>
                    <input
                      type="tel"
                      placeholder="+237 6XX XX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="fct-input"
                    />
                  </div>
                </>
              )}

              <div className="fct-field">
                <label className="fct-label">{isEn ? 'Email Address *' : 'Adresse Courriel *'}</label>
                <input
                  type="email"
                  placeholder="votre.email@fct.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="fct-input"
                  required
                />
              </div>

              <div className="fct-field">
                <label className="fct-label">{isEn ? 'Password *' : 'Mot de Passe *'}</label>
                <input
                  type="password"
                  placeholder={isEn ? 'Minimum 6 characters' : 'Minimum 6 caractères'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fct-input"
                  required
                />
              </div>

              {!isRegister && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--fct-blue-primary, #1e3a8a)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {isEn ? 'Forgot password?' : 'Mot de passe oublié ?'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 12, fontSize: 14 }}
              >
                <span>
                  {authLoading
                    ? (isEn ? 'Authentication in progress...' : 'Connexion en cours...')
                    : isRegister
                    ? (isEn ? 'Create My Member Account' : 'Créer mon Compte Adhérent')
                    : (isEn ? 'Sign In to My Space' : 'Accéder à mon Espace')}
                </span>
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setAuthError('');
                }}
                style={{ fontSize: 13, color: 'var(--fct-blue-primary)', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                {isRegister
                  ? (isEn ? 'Already a member? Log in here' : 'Déjà adhérent ? Connectez-vous ici')
                  : (isEn ? 'No account yet? Create your profile in 30 seconds' : 'Pas encore de compte ? Créer un profil en 30 secondes')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Récupération Mot de passe oublié */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        defaultEmail={email}
        isEn={isEn}
      />

      {/* Modal Double Authentification Code PIN par Email */}
      <PinVerificationModal
        isOpen={showPinVerification}
        email={email}
        onVerify={handleVerifyPinRegistration}
        onResend={handleResendPin}
        onCancel={() => setShowPinVerification(false)}
        isEn={isEn}
      />
    </div>
  );
};
