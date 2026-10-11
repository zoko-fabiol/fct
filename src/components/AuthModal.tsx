/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Authentification Firebase & Contrôle RBAC
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState } from 'react';
import { authService } from '../services/firebase.ts';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { UserProfile, UserRole } from '../../packages/shared-types/index.ts';
import { Language, translations } from '../services/i18n.ts';
import { Shield, Lock, Mail, AlertCircle, CheckCircle2, UserCheck, KeyRound, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  state: DatabaseState;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  state,
  lang,
}) => {
  const t = translations[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const firebaseUser = await authService.login(email, password);
      // Trouver ou synchroniser le profil collaborateur
      const matchedUser = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        dbStore.setCurrentUser(matchedUser);
      } else {
        // Profil par défaut rattaché
        const dynamicUser: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          fullName: firebaseUser.displayName || email.split('@')[0],
          phone: '+237 699 00 00 00',
          role: email === 'rapidetravel2@gmail.com' ? 'super_admin' : 'viewer',
          status: 'ACTIVE',
          isActive: true,
        };
        dbStore.setCurrentUser(dynamicUser);
      }
      setStatusMessage({ type: 'success', text: 'Connexion Firebase réussie.' });
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.warn('Firebase login attempt:', err);
      // En cas de compte non encore provisionné sur Firebase Auth, fallback gracieux avec notification claire
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
        setStatusMessage({
          type: 'error',
          text: 'Identifiants Firebase invalides. Vous pouvez utiliser le sélecteur rapide de rôles FCT ci-dessous pour tester immédiatement les 8 profils RBAC.',
        });
      } else {
        setStatusMessage({ type: 'error', text: err.message || 'Erreur d’authentification.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      await authService.requestPasswordReset(email);
      setStatusMessage({
        type: 'success',
        text: 'Un e-mail de réinitialisation sécurisé a été transmis par Firebase.',
      });
      setIsResetMode(false);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Impossible d’envoyer le lien de réinitialisation.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (user: UserProfile) => {
    dbStore.setCurrentUser(user);
    setStatusMessage({
      type: 'success',
      text: `Profil actif basculé sur : ${user.fullName} (${t.roles[user.role as UserRole]})`,
    });
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-[#0f2a4a] text-white flex items-center justify-center font-black text-sm">
              FCT
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Authentification &amp; Contrôle d'Accès RBAC
              </h3>
              <p className="text-[11px] text-slate-500">
                Projet Firebase : <span className="font-mono font-bold text-blue-900">fct-cmr</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Formulaire Firebase Auth Standard */}
        {!isResetMode ? (
          <form onSubmit={handleEmailLogin} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">E-mail Collaborateur *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="nom@fct-automobile.cm ou rapidetravel2@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mot de passe *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                Mot de passe oublié ?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold transition cursor-pointer shadow disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter (Firebase Auth)'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-3 text-xs">
            <p className="text-slate-600">
              Saisissez l'adresse e-mail rattachée à votre compte pour recevoir le lien de réinitialisation sécurisé.
            </p>
            <div>
              <label className="font-bold text-slate-700 block mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="px-3 py-1.5 rounded bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded bg-emerald-600 text-white font-bold cursor-pointer"
              >
                Envoyer le lien
              </button>
            </div>
          </form>
        )}

        {/* Section Sélecteur de Rôles RBAC FCT pour Audit & Recette */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 mb-2.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Sélection Rapide des Profils RBAC (Recette &amp; Démonstration) :</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {state.users.map((u) => {
              const isCurrent = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectRole(u)}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{t.roles[u.role as UserRole]}</div>
                    <div className="text-[10px] text-slate-500">{u.fullName.split(' ')[0]}</div>
                  </div>
                  {isCurrent && <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
