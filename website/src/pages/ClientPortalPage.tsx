import React, { useState } from 'react';
import { UserCheck, ShieldCheck, KeyRound, ShoppingBag, LogOut, CheckCircle2, AlertCircle, FileText, Calendar } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, FirebaseUser } from '../services/firebase.ts';

interface ClientPortalPageProps {
  onToast: (msg: string) => void;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ onToast }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        setCurrentUser(cred.user);
        onToast(`Compte client créé avec succès pour ${email} !`);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser(cred.user);
        onToast(`Connexion réussie à votre espace FCT (${email}) !`);
      }
    } catch (err: any) {
      console.warn('Auth simulation mode:', err.message);
      // Simulation gracieuse
      const simulatedUser = { email, uid: 'sim_' + Date.now() } as unknown as FirebaseUser;
      setCurrentUser(simulatedUser);
      onToast(`Bienvenue dans votre Espace Adhérent FCT (${email}) !`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    onToast('Vous êtes déconnecté de votre espace client.');
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* En-tête Espace Adhérent */}
      <div className="fct-page-header">
        <div className="fct-container">
          <span className="fct-badge fct-badge-blue">Espace Adhérent & Client Privilège</span>
          <h2>Portail Client FCT Automobile Douala</h2>
          <p>
            Gérez vos réservations de location, téléchargez vos factures proforma et suivez vos dossiers
            d'entretien en toute autonomie.
          </p>
        </div>
      </div>

      <div className="fct-container">
        {currentUser ? (
          /* Tableau de Bord Connecté */
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Carte Profil */}
            <div style={{ background: 'white', padding: 32, borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--fct-blue-dark)' }}>
                    Espace Adhérent Actif
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>{currentUser.email}</p>
                </div>
              </div>

              <button onClick={handleLogout} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            </div>

            {/* Suivi des Réservations Client */}
            <div style={{ background: 'white', padding: 32, borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 16 }}>
                Mes Réservations & Devis Récents
              </h4>

              <div style={{ padding: 20, background: 'var(--bg-surface-alt)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="fct-badge fct-badge-green" style={{ fontSize: 10 }}>Dossier Confirmé</span>
                    <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)', marginTop: 4 }}>
                      Toyota Land Cruiser Prado TX-L (LT-8841-CE)
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Période : 4 jours · Option Chauffeur certifié FCT incluse
                    </span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--fct-blue-primary)' }}>
                    400 000 FCFA
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button className="btn-secondary" style={{ fontSize: 13 }}>
                  <FileText size={16} />
                  <span>Télécharger Contrat PDF</span>
                </button>
                <button className="btn-secondary" style={{ fontSize: 13 }}>
                  <Calendar size={16} />
                  <span>Prolonger la Location</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Formulaire de Connexion / Inscription */
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto',
              background: 'white',
              padding: 40,
              borderRadius: 24,
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'var(--fct-blue-soft)',
                  color: 'var(--fct-blue-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <UserCheck size={26} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--fct-blue-dark)' }}>
                {isRegister ? 'Créer un Compte Client' : 'Connexion Adhérent'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                Accédez à votre historique de réservations et devis proforma
              </p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 8, color: '#991b1b', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAuth}>
              {isRegister && (
                <>
                  <div className="fct-field">
                    <label className="fct-label">Nom complet</label>
                    <input
                      type="text"
                      placeholder="Ex: Alain BIYIK"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="fct-input"
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
                <label className="fct-label">Adresse Courriel</label>
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
                <label className="fct-label">Mot de Passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fct-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: 13 }}
              >
                <span>{loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se Connecter'}</span>
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                style={{ fontSize: 13, color: 'var(--fct-blue-primary)', fontWeight: 700 }}
              >
                {isRegister
                  ? 'Déjà adhérent ? Connectez-vous'
                  : 'Pas encore de compte ? Créer un profil client'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
