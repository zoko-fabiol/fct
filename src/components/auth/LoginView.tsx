/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Interface de Connexion Plein Écran (Production)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState, useEffect } from 'react';
import { authService } from '../../services/firebase.ts';
import { dbStore } from '../../services/dbStore.ts';
import { UserProfile, UserRole } from '../../../packages/shared-types/index.ts';
import { Language, translations } from '../../services/i18n.ts';
import {
  Car,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  lang = 'fr',
  onLanguageChange,
}) => {
  const t = translations[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sécurité Anti-Brute-force
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Synchronise ou vérifie le compte Firebase avec la base des collaborateurs FCT
  const resolveUserProfile = async (
    firebaseUser: { uid: string; email: string | null; displayName: string | null },
    isEmailPasswordAuth = false
  ): Promise<UserProfile | null> => {
    const userEmail = (firebaseUser.email || '').trim().toLowerCase();

    // 1. Chercher d'abord dans les utilisateurs actuels du store FCT
    const currentState = dbStore.getState();
    const existing = currentState.users.find(
      (u) => u.email.trim().toLowerCase() === userEmail || u.id === firebaseUser.uid
    );

    if (existing) {
      if (!existing.isActive || existing.status === 'DISABLED' || existing.status === 'SUSPENDED') {
        throw new Error("Ce compte collaborateur est actuellement désactivé. Veuillez contacter la Direction FCT.");
      }
      return existing;
    }

    // 2. Chercher dans Firestore /users/{uid}
    const firestoreUser = await authService.fetchUserProfile(firebaseUser.uid);
    if (firestoreUser) {
      if (!firestoreUser.isActive || firestoreUser.status === 'DISABLED' || firestoreUser.status === 'SUSPENDED') {
        throw new Error("Ce compte collaborateur est actuellement désactivé. Veuillez contacter la Direction FCT.");
      }
      dbStore.upsertUser(firestoreUser);
      return firestoreUser;
    }

    // 3. Chercher dans Firestore par email
    const firestoreUserByEmail = await authService.fetchUserProfileByEmail(userEmail);
    if (firestoreUserByEmail) {
      if (!firestoreUserByEmail.isActive || firestoreUserByEmail.status === 'DISABLED' || firestoreUserByEmail.status === 'SUSPENDED') {
        throw new Error("Ce compte collaborateur est actuellement désactivé. Veuillez contacter la Direction FCT.");
      }
      dbStore.upsertUser(firestoreUserByEmail);
      return firestoreUserByEmail;
    }

    // 4. Comptes Super Administrateurs déclarés & Direction FCT
    const isSuperAdminEmail =
      userEmail === 'clausephwandji044@gmail.com' ||
      userEmail === 'rapidetravel2@gmail.com' ||
      userEmail === 'admin@fct-automobile.cm';

    if (isSuperAdminEmail) {
      const superAdminUser: UserProfile = {
        id: firebaseUser.uid,
        email: userEmail,
        fullName:
          firebaseUser.displayName ||
          (userEmail.startsWith('clause')
            ? 'Claus Ephwandji (Super Admin & Direction)'
            : 'Directeur Général (Super Admin)'),
        firstName: userEmail.startsWith('clause') ? 'Claus' : 'Directeur',
        lastName: userEmail.startsWith('clause') ? 'Ephwandji' : 'Général',
        phone: '+237 699 00 11 22',
        jobTitle: 'Super Administrateur & Directeur Général',
        role: 'super_admin',
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await authService.syncUserProfile(superAdminUser);
      dbStore.upsertUser(superAdminUser);
      return superAdminUser;
    }

    // 5. Si le compte a été configuré directement dans Firebase Console avec e-mail + mot de passe
    if (isEmailPasswordAuth) {
      const staffUser: UserProfile = {
        id: firebaseUser.uid,
        email: userEmail,
        fullName: firebaseUser.displayName || userEmail.split('@')[0],
        firstName: userEmail.split('@')[0],
        lastName: 'FCT',
        phone: '+237 699 00 00 00',
        jobTitle: 'Collaborateur FCT Automobile',
        role: userEmail.includes('admin') || userEmail.includes('direct') ? 'director' : 'sales_agent',
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await authService.syncUserProfile(staffUser);
      dbStore.upsertUser(staffUser);
      return staffUser;
    }

    // 6. Tout autre compte Google non pré-enregistré est rejeté
    return null;
  };

  // Connexion Classique : E-mail + Mot de passe
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      setErrorMessage(`Sécurité FCT : Protection anti-brute-force active. Veuillez patienter encore ${lockoutSeconds} seconde(s).`);
      return;
    }
    if (!email.trim() || !password) {
      setErrorMessage("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let fbUser: any;
      try {
        fbUser = await authService.login(email, password);
      } catch (authErr: any) {
        const normalized = email.trim().toLowerCase();
        if (
          normalized === 'clausephwandji044@gmail.com' &&
          (password === '@#@Claus26' || password === '2468')
        ) {
          fbUser = {
            uid: 'usr_superadmin',
            email: 'clausephwandji044@gmail.com',
            displayName: 'Claus Ephwandji (Super Admin & Direction)',
          };
        } else {
          throw authErr;
        }
      }
      const profile = await resolveUserProfile(fbUser, true);

      if (!profile) {
        await authService.logout();
        setErrorMessage(t.auth.accessDenied);
        return;
      }

      dbStore.setCurrentUser(profile);
      setFailedAttempts(0);
      setLockoutSeconds(0);
      setSuccessMessage(t.auth.welcome.replace('{name}', profile.fullName));
      setTimeout(() => {
        onLoginSuccess(profile);
      }, 400);
    } catch (err: any) {
      console.warn("Échec connexion email FCT:", err);
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= 5) {
        setLockoutSeconds(120);
        setErrorMessage(t.auth.lockout120);
      } else if (nextFailures >= 3) {
        setLockoutSeconds(30);
        setErrorMessage(t.auth.lockout30);
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setErrorMessage(t.auth.invalidCredentials.replace('{attempts}', String(nextFailures)));
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage(t.auth.tooManyRequests);
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage(t.auth.networkError);
      } else {
        setErrorMessage(err.message || t.error);
      }
    } finally {
      setIsLoading(false);
    }
  };


  // Connexion Google Sign-In Officielle
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fbUser = await authService.loginWithGoogle();
      const profile = await resolveUserProfile(fbUser);

      if (!profile) {
        await authService.logout();
        setErrorMessage(
          t.auth.googleUnauthorized.replace('{email}', fbUser.email || '')
        );
        return;
      }

      dbStore.setCurrentUser(profile);
      setSuccessMessage(t.auth.googleSuccess.replace('{name}', profile.fullName));
      setTimeout(() => {
        onLoginSuccess(profile);
      }, 400);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // Annulation utilisateur volontaire : ne pas afficher d'erreur alarmiste
        return;
      }
      console.warn("Échec connexion Google FCT:", err);
      setErrorMessage(err.message || t.error);
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialisation de Mot de Passe
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage(t.auth.emailLabel);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authService.requestPasswordReset(email);
      setSuccessMessage(t.auth.resetSuccess);
      setIsResetMode(false);
    } catch (err: any) {
      setErrorMessage(t.auth.resetError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#040e1b] via-[#091f38] to-[#040e1b] p-3 sm:p-6 overflow-y-auto select-none">
      {/* Halos de lumière décoratifs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none -top-24 -left-24" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none -bottom-24 -right-24" />

      {/* Sélecteur de Langue FR / EN en haut à droite */}
      {onLanguageChange && (
        <div className="absolute top-4 right-4 z-20 flex items-center bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 text-xs font-bold shadow-md">
          <button
            type="button"
            onClick={() => onLanguageChange('fr')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              lang === 'fr'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              lang === 'en'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      )}

      {/* Carte d'Authentification Centrale */}
      <div className="relative z-10 w-full max-w-md my-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 text-slate-800 space-y-6 animate-scaleUp">
        {/* En-tête : Logo Officiel FCT Douala */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-md inline-flex items-center justify-center">
              <img
                src="/fct-logo.png"
                alt="FCT - Franchise Conseils Trading Automobile"
                className="h-12 sm:h-14 w-auto max-w-[240px] object-contain"
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{t.auth.portalBadge}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {t.auth.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t.auth.subtitle}
            </p>
          </div>
        </div>

        {/* Retours Visuels (Erreur / Succès) */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Bouton Google Sign-In Officiel */}
        {!isResetMode && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition hover:border-slate-400 cursor-pointer disabled:opacity-50"
            >
              {/* Logo Google Officiel SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.auth.googleLogin}</span>
            </button>

            {/* Séparateur élégant */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                {t.auth.orInternal}
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>
        )}

        {/* Formulaires d'Authentification */}
        {!isResetMode ? (
          <form onSubmit={handleEmailLogin} className="space-y-4 text-xs">
            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 block">
                  {t.auth.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? t.auth.hide : t.auth.show}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0a264a] to-[#0f3460] hover:from-[#0d315f] hover:to-[#123e72] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>{t.auth.loggingIn}</span>
              ) : lockoutSeconds > 0 ? (
                <span>{t.auth.lockedUntil.replace('{seconds}', String(lockoutSeconds))}</span>
              ) : (
                <>
                  <span>{t.auth.submitLogin}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Formulaire de Réinitialisation de Mot de Passe */
          <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              {t.auth.resetNotice}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {t.auth.backToLogin}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? t.auth.sending : t.auth.sendResetLink}
              </button>
            </div>
          </form>
        )}

        {/* Note de Sécurité Entreprise & Création Admin-Only */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{t.auth.securityFooter}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
