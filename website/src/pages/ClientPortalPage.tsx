import React, { useState, useEffect } from 'react';
import {
  UserCheck,
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
import { AppPage } from '../types/router.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

interface ClientPortalPageProps {
  onToast: (msg: string) => void;
  onNavigate?: (page: AppPage) => void;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ onToast, onNavigate }) => {
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

  // Connexion / Inscription Authentique (Zéro Mock)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setAuthError('Veuillez indiquer votre nom complet.');
          setAuthLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await syncCustomerProfile(cred.user, { fullName: fullName.trim(), phone: phone.trim() });
        setCurrentUser(cred.user);
        onToast(`Bienvenue ${fullName.trim()} ! Votre compte client FCT est actif.`);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setCurrentUser(cred.user);
        onToast(`Ravi de vous revoir sur votre espace client FCT !`);
      }
    } catch (err: any) {
      console.error('[Client Portal Auth Error]', err);
      // Traduction des erreurs Firebase en français explicite (Silent-Failure Hunting)
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setAuthError('Adresse email ou mot de passe incorrect.');
      } else if (code === 'auth/email-already-in-use') {
        setAuthError('Cette adresse email est déjà associée à un compte FCT.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Le mot de passe doit contenir au moins 6 caractères.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Format d’adresse email invalide.');
      } else {
        setAuthError(err.message || 'Erreur lors de la connexion. Veuillez réessayer.');
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
      onToast('Vous êtes déconnecté de votre espace adhérent.');
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
          <span className="fct-badge fct-badge-blue">Espace Adhérent & Client Privilège</span>
          <h2>Portail Client FCT Automobile Douala</h2>
          <p>
            Suivez vos réservations en temps réel, consultez vos devis et échangez directement avec
            l'agence de Bonamoussadi en toute autonomie.
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
                      Espace Adhérent FCT
                    </h3>
                    <span className="fct-badge fct-badge-green" style={{ fontSize: 10 }}>En Ligne</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: 13, padding: '8px 14px' }}
              >
                <LogOut size={15} />
                <span>Déconnexion</span>
              </button>
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
                    Mes Dossiers & Réservations Récentes
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Synchronisation directe avec la base de données de l'agence (sans actualiser la page)
                  </p>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('location')}
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '8px 14px' }}
                  >
                    <KeyRound size={14} />
                    <span>Nouvelle Réservation</span>
                  </button>
                )}
              </div>

              {isLoadingBookings ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #cbd5e1', borderTopColor: 'var(--fct-blue-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                  <div>Chargement de vos dossiers Firestore en direct...</div>
                </div>
              ) : bookings.length > 0 ? (
                /* Liste des VRAIES réservations du client */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bookings.map((b) => {
                    const statusInfo = getBookingStatusInfo(b.status);
                    const whatsappMsg = encodeURIComponent(
                      `Bonjour FCT Automobile, je vous contacte concernant mon dossier de réservation ${b.reservationNumber || b.id} pour le véhicule ${b.vehicleName || ''}.`
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
                              Réf. Dossier : <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>{b.reservationNumber}</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-primary)' }}>
                              {(b.totalAmountEstimated || 0).toLocaleString('fr-FR')} FCFA
                            </div>
                            {b.depositAmount ? (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Caution : {b.depositAmount.toLocaleString('fr-FR')} FCFA
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
                              Du {b.startDate || '—'} au {b.endDate || '—'} ({b.durationDays || 1} j)
                            </span>
                          </div>

                          {b.driverOptionIncluded && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--fct-green-primary)', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>Option Chauffeur FCT</span>
                            </div>
                          )}

                          {b.destination && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Clock size={14} />
                              <span>Destination : {b.destination}</span>
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
                            <span>Échanger sur WhatsApp</span>
                          </a>

                          <button
                            onClick={() => handlePrintBooking(b)}
                            className="btn-secondary"
                            style={{ fontSize: 12, padding: '7px 12px' }}
                          >
                            <Printer size={13} />
                            <span>Imprimer Fiche</span>
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
                    Aucun dossier de réservation en cours
                  </h5>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', maxWidth: 420, margin: '8px auto 20px', lineHeight: 1.5 }}>
                    Vous n'avez pas encore effectué de réservation avec l'adresse <strong>{currentUser.email}</strong>. Vos prochaines demandes validées en agence apparaîtront ici automatiquement.
                  </p>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('location')}
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: 13 }}
                    >
                      <span>Explorer la Flotte Disponible</span>
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
                {isRegister ? 'Créer un Compte Adhérent' : 'Connexion Espace Client'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                Accédez à vos dossiers en direct et bénéficiez des privilèges FCT
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
                    <label className="fct-label">Nom complet *</label>
                    <input
                      type="text"
                      placeholder="Ex: Alain BIYIK"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>
                  <div className="fct-field">
                    <label className="fct-label">Numéro de téléphone / WhatsApp</label>
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
                <label className="fct-label">Adresse Courriel *</label>
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
                <label className="fct-label">Mot de Passe *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fct-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 12, fontSize: 14 }}
              >
                <span>{authLoading ? 'Connexion en cours...' : isRegister ? "Créer mon Compte Adhérent" : 'Accéder à mon Espace'}</span>
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
                  ? 'Déjà adhérent ? Connectez-vous ici'
                  : 'Pas encore de compte ? Créer un profil en 30 secondes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
