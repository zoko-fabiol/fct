/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Profil Collaborateur & Sécurité PIN
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState, useEffect } from 'react';
import { dbStore } from '../services/dbStore.ts';
import { UserProfile } from '../../packages/shared-types/index.ts';
import { Language, translations } from '../services/i18n.ts';
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Building,
  Save,
  ShieldCheck,
} from 'lucide-react';

interface ProfileSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  lang: Language;
  onLockNow: () => void;
}

export const ProfileSecurityModal: React.FC<ProfileSecurityModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  lang,
  onLockNow,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PASSWORD' | 'PIN'>('PROFILE');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Formulaire Profil
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '+237 699 45 88 12');

  // Formulaire Mot de Passe
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Formulaire Code PIN & Inactivité
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [lockTimeoutMinutes, setLockTimeoutMinutes] = useState<number>(5);
  const [autoLockEnabled, setAutoLockEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (currentUser?.id) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '+237 699 45 88 12');

      // Le code PIN provient directement du profil Firestore du collaborateur (aucun PIN par défaut)
      const firestorePin = currentUser.securityPin || '';
      const firesetTimeout = currentUser.autoLockTimeoutMinutes || 5;
      const firesetEnabled = currentUser.autoLockEnabled ?? Boolean(currentUser.securityPin);

      setPin(firestorePin);
      setConfirmPin(firestorePin);
      setLockTimeoutMinutes(firesetTimeout);
      setAutoLockEnabled(firesetEnabled);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim() || currentUser.fullName,
        email,
        phone,
      };
      dbStore.updateUser(currentUser.id, updatedUser);
      setAlert({ type: 'success', message: t.securityModal.profileSuccess });
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || t.error });
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setAlert({ type: 'error', message: t.securityModal.passwordLength });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', message: t.securityModal.passwordMismatch });
      return;
    }
    setAlert({ type: 'success', message: t.securityModal.savePassword });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSavePinSettings = (e: React.FormEvent) => {
    e.preventDefault();

    // Le PIN est optionnel : si le champ est vide, on désactive le code PIN
    if (!pin.trim()) {
      try {
        dbStore.updateUser(
          currentUser.id,
          {
            securityPin: undefined,
            autoLockEnabled: false,
            autoLockTimeoutMinutes: lockTimeoutMinutes,
          },
          'Suppression du code PIN optionnel (Stocké sur Firestore)'
        );
        setPin('');
        setConfirmPin('');
        setAutoLockEnabled(false);
        setAlert({
          type: 'success',
          message: t.securityModal.pinRemoved,
        });
        setTimeout(() => setAlert(null), 3500);
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message || t.error });
      }
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setAlert({ type: 'error', message: t.securityModal.pinInvalid });
      return;
    }
    if (pin !== confirmPin) {
      setAlert({ type: 'error', message: t.securityModal.pinMismatch });
      return;
    }

    try {
      dbStore.updateUser(
        currentUser.id,
        {
          securityPin: pin,
          autoLockEnabled,
          autoLockTimeoutMinutes: lockTimeoutMinutes,
        },
        'Mise à jour du code PIN de sécurité sur Firestore'
      );

      setAlert({
        type: 'success',
        message: t.securityModal.pinSuccess,
      });
      setTimeout(() => setAlert(null), 3500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || t.error });
    }
  };

  const handleRemovePin = () => {
    try {
      dbStore.updateUser(
        currentUser.id,
        {
          securityPin: undefined,
          autoLockEnabled: false,
        },
        'Désactivation du code PIN sur Firestore'
      );
      setPin('');
      setConfirmPin('');
      setAutoLockEnabled(false);
      setAlert({
        type: 'success',
        message: t.securityModal.pinRemoved,
      });
      setTimeout(() => setAlert(null), 3500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || t.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full text-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        {/* Header Modal */}
        <div className="bg-[#0f2a4a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">{t.securityModal.title}</h3>
              <p className="text-slate-300 text-xs">
                {currentUser.fullName} • <span className="font-mono text-emerald-400">{t.roles[currentUser.role as keyof typeof t.roles] || currentUser.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === 'PROFILE'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.securityModal.tabProfile}</span>
          </button>
          <button
            onClick={() => setActiveTab('PASSWORD')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === 'PASSWORD'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.securityModal.tabPassword}</span>
          </button>
          <button
            onClick={() => setActiveTab('PIN')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === 'PIN'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>{t.securityModal.tabPin}</span>
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              alert.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="p-5">
          {/* TAB 1: PROFIL */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.securityModal.firstName}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.securityModal.lastName}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.securityModal.email}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.securityModal.phone}</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building className="w-3.5 h-3.5 text-blue-900" />
                  <span>{t.agencyLocation}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {t.role} : <strong className="text-blue-900">{t.roles[currentUser.role as keyof typeof t.roles] || currentUser.role}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.securityModal.saveProfile}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MOT DE PASSE */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.securityModal.oldPassword}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.securityModal.newPassword}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.securityModal.confirmPassword}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{t.securityModal.savePassword}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CODE PIN & INACTIVITÉ */}
          {activeTab === 'PIN' && (
            <form onSubmit={handleSavePinSettings} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t.securityModal.pinTitle}</span>
                  </div>
                  {currentUser.securityPin ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      PIN (Firestore)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      {lang === 'fr' ? 'Aucun PIN (Optionnel)' : 'No PIN (Optional)'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {t.securityModal.pinDesc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.securityModal.newPin}</label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-widest text-base focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.securityModal.confirmPin}</label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-widest text-base focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoLockCheck"
                    checked={autoLockEnabled}
                    onChange={(e) => setAutoLockEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="autoLockCheck" className="text-slate-800 font-bold cursor-pointer">
                    {t.securityModal.autoLockCheck}
                  </label>
                </div>

                {autoLockEnabled && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.securityModal.timeoutLabel}</span>
                    </label>
                    <select
                      value={lockTimeoutMinutes}
                      onChange={(e) => setLockTimeoutMinutes(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-emerald-500"
                    >
                      <option value={1}>1 {t.securityModal.minutes}</option>
                      <option value={2}>2 {t.securityModal.minutes}</option>
                      <option value={5}>5 {t.securityModal.minutes}</option>
                      <option value={10}>10 {t.securityModal.minutes}</option>
                      <option value={15}>15 {t.securityModal.minutes}</option>
                      <option value={30}>30 {t.securityModal.minutes}</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (pin && pin.length === 4) {
                        handleSavePinSettings(new Event('submit') as any);
                      }
                      onLockNow();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer text-xs"
                    title={t.securityModal.lockNow}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.securityModal.lockNow}</span>
                  </button>

                  {currentUser.securityPin && (
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer border border-rose-200 transition"
                      title={t.securityModal.removePin}
                    >
                      {t.securityModal.removePin}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t.securityModal.savePin}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
