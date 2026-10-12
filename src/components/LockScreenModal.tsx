/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Écran de Verrouillage Sécurisé PIN
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../packages/shared-types/index.ts';
import {
  Lock,
  Unlock,
  Delete,
  LogOut,
  ShieldAlert,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { FCT_LOGO_BASE64 } from '../utils/logoBase64.ts';

interface LockScreenModalProps {
  isLocked: boolean;
  currentUser: UserProfile;
  onUnlock: () => void;
  onLogout: () => void;
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({
  isLocked,
  currentUser,
  onUnlock,
  onLogout,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Horloge en direct
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasPinConfigured = Boolean(currentUser.securityPin && currentUser.securityPin.length === 4);

  const handleKeyPress = useCallback((digit: string) => {
    setErrorMsg(null);
    setEnteredPin((prev) => (prev.length < 4 ? prev + digit : prev));
  }, []);

  const handleDelete = useCallback(() => {
    setErrorMsg(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  }, []);

  const handleVerifyPin = useCallback(() => {
    // Si aucun PIN n'est configuré sur Firestore, on déverrouille directement
    if (!currentUser.securityPin) {
      setEnteredPin('');
      setErrorMsg(null);
      onUnlock();
      return;
    }

    if (enteredPin === currentUser.securityPin) {
      setEnteredPin('');
      setErrorMsg(null);
      onUnlock();
    } else {
      setIsShaking(true);
      setErrorMsg('Code PIN incorrect. Veuillez réessayer.');
      setTimeout(() => {
        setIsShaking(false);
        setEnteredPin('');
      }, 700);
    }
  }, [enteredPin, currentUser.securityPin, onUnlock]);

  // Écoute des touches du clavier physique
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (enteredPin.length === 4) {
          handleVerifyPin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, enteredPin, handleKeyPress, handleDelete, handleVerifyPin]);

  // Auto-validation dès que 4 chiffres sont saisis
  useEffect(() => {
    if (enteredPin.length === 4) {
      handleVerifyPin();
    }
  }, [enteredPin, handleVerifyPin]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b1c2d] flex flex-col items-center justify-between p-6 text-white select-none backdrop-blur-md overflow-hidden">
      {/* Top Header : Logo & Horloge */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <img
            src={FCT_LOGO_BASE64}
            alt="FCT Logo"
            className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg border border-white/15"
          />
          <div>
            <div className="text-xs font-black tracking-wider text-emerald-400 uppercase">
              FCT Automobile Douala
            </div>
            <div className="text-[10px] text-slate-400">Station Sécurisée</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-black font-mono tracking-wider text-slate-100 flex items-center gap-1.5 justify-end">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{currentTime}</span>
          </div>
          <div className="text-[10px] text-slate-400 capitalize">{currentDate}</div>
        </div>
      </div>

      {/* Centre : Profil & Clavier PIN */}
      <div className="w-full max-w-sm flex flex-col items-center my-auto">
        {/* Avatar & Nom */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-emerald-800 p-0.5 shadow-2xl">
            <div className="w-full h-full bg-[#0f2a4a] rounded-2xl flex items-center justify-center text-2xl font-black text-white">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-[#0b1c2d] flex items-center justify-center text-slate-900">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        <h2 className="text-lg font-black text-white tracking-tight">{currentUser.fullName}</h2>
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full bg-blue-900/60 border border-blue-400/30 text-[10px] font-bold text-blue-200">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Session Verrouillée • {currentUser.role}</span>
        </div>

        {hasPinConfigured ? (
          <>
            {/* Dots PIN */}
            <div
              className={`flex items-center gap-4 my-6 ${
                isShaking ? 'animate-bounce text-rose-500' : ''
              }`}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'bg-emerald-400 border-emerald-400 scale-125 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                        : 'border-slate-500 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {/* Message d'erreur */}
            {errorMsg && (
              <div className="text-xs text-rose-400 font-bold mb-3 flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pavé Numérique */}
            <div className="grid grid-cols-3 gap-3 w-64 max-w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-emerald-500/20 active:scale-95 border border-white/10 text-xl font-bold text-white transition flex items-center justify-center shadow-xs cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              {/* Touche Vide ou Déverrouiller */}
              <div className="flex items-center justify-center">
                <div className="text-[10px] text-slate-500 font-medium">PIN: 4 ch.</div>
              </div>

              {/* Touche 0 */}
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-emerald-500/20 active:scale-95 border border-white/10 text-xl font-bold text-white transition flex items-center justify-center shadow-xs cursor-pointer"
              >
                0
              </button>

              {/* Touche Effacer */}
              <button
                type="button"
                onClick={handleDelete}
                className="h-14 rounded-2xl bg-white/5 hover:bg-rose-500/20 active:scale-95 border border-white/10 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
                title="Effacer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="my-8 text-center space-y-4 max-w-xs">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-slate-200">
                Aucun Code PIN Configuré (Optionnel)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Votre compte n'a aucun code PIN obligatoire. Vous pouvez déverrouiller immédiatement votre session en un clic.
              </p>
            </div>

            <button
              type="button"
              onClick={onUnlock}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition"
            >
              <Unlock className="w-4 h-4" />
              <span>Déverrouiller la Station</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer : Déconnexion de secours */}
      <div className="w-full max-w-md flex items-center justify-between pb-2 text-xs">
        <span className="text-slate-500 text-[11px]">FCT ERP • Bonamoussadi Santa Barbara</span>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/30 text-slate-300 hover:text-rose-200 border border-white/10 transition cursor-pointer text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Changer d'utilisateur</span>
        </button>
      </div>
    </div>
  );
};
