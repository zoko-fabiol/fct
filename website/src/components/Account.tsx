import React, { useEffect, useState } from 'react';
import { X, Loader2, LogOut, ClipboardList, UserRound, ShieldCheck } from 'lucide-react';
import {
  auth,
  firestore,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  collection,
  query,
  where,
  onSnapshot,
  FirebaseUser,
} from '../services/firebase.ts';
import { emailSchema, firstError } from '../utils/validation.ts';
import { formatXAF } from '../utils/currency.ts';
import { formatDateFR } from '../utils/date.ts';
import { useToast } from './Toast.tsx';

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition';

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet e-mail. Connectez-vous.';
    case 'auth/weak-password':
      return 'Mot de passe trop faible (8 caractères minimum).';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    case 'auth/network-request-failed':
      return 'Connexion internet instable. Vérifiez votre réseau et réessayez.';
    default:
      return 'Authentification impossible pour le moment. Réessayez.';
  }
}

/* ------------------------------ Modal Auth ------------------------------ */
export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) return toast('error', firstError(emailCheck.error));
    if (password.length < 8) return toast('error', 'Le mot de passe doit contenir au moins 8 caractères.');

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, emailCheck.data, password);
        toast('success', 'Connexion réussie. Bienvenue chez FCT Automobile.');
      } else {
        await createUserWithEmailAndPassword(auth, emailCheck.data, password);
        toast('success', 'Compte client créé avec succès.');
      }
      onClose();
    } catch (err) {
      console.error('[FCT Website] Authentification :', err);
      toast('error', authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="luxury-glass rounded-3xl w-full max-w-md p-8 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-white">
              {mode === 'login' ? 'Espace Client FCT' : 'Créer mon espace client'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Suivez vos demandes de réservation et d'achat.</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="Adresse e-mail" />
          <input id="auth-password" type="password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Mot de passe (8 caractères min.)" />
          <button type="submit" disabled={submitting} className="gold-gradient-btn w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Me connecter' : 'Créer mon compte'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-xs text-amber-400 hover:text-amber-300 w-full text-center cursor-pointer">
          {mode === 'login' ? "Pas encore de compte ? Créer mon espace client" : 'Déjà client ? Me connecter'}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------ Espace Client ------------------------------ */
interface MyBooking {
  id: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  estimatedTotalXAF: number;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente de validation', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  CONFIRMED: { label: 'Confirmée', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  CANCELLED: { label: 'Annulée', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

export const AccountPanel: React.FC<{ user: FirebaseUser; onOpenHealthPassport?: () => void }> = ({
  user,
  onOpenHealthPassport,
}) => {
  const toast = useToast();
  const [bookings, setBookings] = useState<MyBooking[] | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, 'web_bookings'), where('customerUid', '==', user.uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as MyBooking), id: d.id }));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setBookings(list);
      },
      (err) => {
        console.error('[FCT Website] Lecture des demandes client :', err);
        setBookings([]);
        toast('error', 'Impossible de charger vos demandes pour le moment.');
      }
    );
  }, [user.uid, toast]);

  const logout = async () => {
    try {
      await signOut(auth);
      toast('success', 'Vous êtes déconnecté.');
    } catch (err) {
      console.error('[FCT Website] Déconnexion :', err);
      toast('error', 'La déconnexion a échoué. Réessayez.');
    }
  };

  return (
    <section id="espace-client" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <UserRound className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-white">Mon espace client</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <button onClick={logout} className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/5 flex items-center gap-2 cursor-pointer">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      <div className="luxury-card p-6 space-y-4">
        <h3 className="font-display font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-amber-400" /> Mes demandes de réservation</h3>
        {bookings === null ? (
          <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune demande pour le moment. Choisissez un véhicule dans notre catalogue de location.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {bookings.map((b) => {
              const st = STATUS_LABELS[b.status] ?? STATUS_LABELS.PENDING;
              return (
                <li key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{b.vehicleName}</p>
                    <p className="text-xs text-slate-400">{formatDateFR(b.startDate)} → {formatDateFR(b.endDate)} · {formatXAF(b.estimatedTotalXAF)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${st.cls}`}>{st.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="luxury-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Carnet de Santé &amp; Suivi Mécanique de mon Véhicule
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Consultez les révisions, vidanges et contrôles techniques réalisés par le garage FCT.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenHealthPassport}
          className="gold-gradient-btn px-4 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Consulter le Carnet de Santé Numérique</span>
        </button>
      </div>
    </section>
  );
};
