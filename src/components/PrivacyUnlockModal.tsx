/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Modale de Déverrouillage PIN Mode Discrétion
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Santa Barbara)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../packages/shared-types/index.ts';
import { Language } from '../services/i18n.ts';
import {
  Lock,
  Eye,
  Delete,
  X,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface PrivacyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: UserProfile;
  lang?: Language;
}

export const PrivacyUnlockModal: React.FC<PrivacyUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  lang = 'fr',
}) => {
  const isEn = lang === 'en';
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setEnteredPin('');
      setErrorMsg(null);
      setIsShaking(false);
    }
  }, [isOpen]);

  const handleKeyPress = useCallback((digit: string) => {
    setErrorMsg(null);
    setEnteredPin((prev) => (prev.length < 4 ? prev + digit : prev));
  }, []);

  const handleDelete = useCallback(() => {
    setErrorMsg(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  }, []);

  const handleVerify = useCallback(() => {
    // Si aucun PIN configuré sur le profil utilisateur
    if (!currentUser.securityPin) {
      onSuccess();
      onClose();
      return;
    }

    if (enteredPin === currentUser.securityPin) {
      setEnteredPin('');
      setErrorMsg(null);
      onSuccess();
      onClose();
    } else {
      setIsShaking(true);
      setErrorMsg(
        isEn
          ? 'Incorrect PIN code. Please try again.'
          : 'Code PIN incorrect. Veuillez réessayer.'
      );
      setTimeout(() => {
        setIsShaking(false);
        setEnteredPin('');
      }, 600);
    }
  }, [enteredPin, currentUser.securityPin, onSuccess, onClose, isEn]);

  // Déclenchement automatique dès que 4 chiffres sont saisis
  useEffect(() => {
    if (enteredPin.length === 4) {
      handleVerify();
    }
  }, [enteredPin, handleVerify]);

  // Support du clavier physique (0-9, Backspace, Echap, Entrée)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (enteredPin.length === 4) {
          handleVerify();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enteredPin, handleKeyPress, handleDelete, handleVerify, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-center transform transition-all ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header avec bouton fermer */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Lock className="w-4 h-4" />
            <span>{isEn ? 'Security Verification' : 'Sécurité Renforcée'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icône & Titres */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Eye className="w-7 h-7" />
        </div>

        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          {isEn ? 'Reveal Financial Amounts' : 'Révéler les Montants Financiers'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
          {currentUser.securityPin
            ? isEn
              ? 'Enter your 4-digit security PIN to disable privacy mode.'
              : 'Saisissez votre code PIN à 4 chiffres pour désactiver le mode discrétion.'
            : isEn
              ? 'Click below to disable privacy mode and display amounts.'
              : 'Cliquez ci-dessous pour désactiver le mode discrétion et afficher les montants.'}
        </p>

        {currentUser.securityPin ? (
          <>
            {/* 4 Indicateurs de PIN */}
            <div className="flex justify-center items-center gap-3.5 mb-5">
              {[0, 1, 2, 3].map((idx) => {
                const filled = idx < enteredPin.length;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-amber-500 scale-125 shadow-md shadow-amber-500/50'
                        : 'border-2 border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {/* Message d'erreur */}
            {errorMsg && (
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-4 flex items-center justify-center gap-1.5 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Clavier Numérique Ergonomique */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-lg transition active:scale-95 cursor-pointer shadow-xs"
                >
                  {digit}
                </button>
              ))}

              {/* Bouton Effacer Tout */}
              <button
                type="button"
                onClick={() => setEnteredPin('')}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-400 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                {isEn ? 'Clear' : 'Vider'}
              </button>

              {/* Chiffre 0 */}
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-lg transition active:scale-95 cursor-pointer shadow-xs"
              >
                0
              </button>

              {/* Bouton Retour / Effacer un chiffre */}
              <button
                type="button"
                onClick={handleDelete}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-left text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {isEn ? 'No PIN configured on your profile' : 'Aucun code PIN configuré'}
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  {isEn
                    ? 'You can set a 4-digit PIN in your Profile settings to strictly protect financial reveals.'
                    : 'Vous pouvez configurer un PIN à 4 chiffres dans votre profil pour verrouiller les révélations.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
            >
              {isEn ? 'Display Amounts Now' : 'Afficher les montants maintenant'}
            </button>
          </div>
        )}

        {/* Bouton Annuler */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold transition"
        >
          {isEn ? 'Keep Amounts Hidden' : 'Laisser les montants masqués'}
        </button>
      </div>
    </div>
  );
};
