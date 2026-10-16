/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Top Navigation Bar (Design Épuré & Ultra-Aéré)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { UserProfile } from '../../packages/shared-types/index.ts';
import {
  Wifi,
  WifiOff,
  Building2,
  Menu,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Coins,
  Clock,
  Globe,
} from 'lucide-react';
import { FCT_LOGO_BASE64 } from '../utils/logoBase64.ts';

interface NavbarProps {
  state: DatabaseState;
  currentUser: UserProfile;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onOpenProfileSecurity?: () => void;
  onLockNow?: () => void;
  onToggleMobileSidebar?: () => void;
  isPrivacyMode?: boolean;
  onTogglePrivacyMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  currentUser,
  lang,
  onLanguageChange,
  onLogout,
  onOpenProfileSecurity,
  onLockNow,
  onToggleMobileSidebar,
  isPrivacyMode = false,
  onTogglePrivacyMode,
}) => {
  const t = translations[lang];
  const pendingSyncCount = state.syncQueue.filter((q) => q.status === 'PENDING').length;
  const activeSession = state.cashSessions.find((s) => s.status === 'OPEN');
  const isEn = lang === 'en';

  const toggleOnline = () => {
    dbStore.setOnlineStatus(!state.isOnline);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0f2a4a] text-white border-b border-blue-900/60 shadow-md pt-[env(safe-area-inset-top,0px)]">
      {/* ============================================================== */}
      {/* ÉTAGE 1 : IDENTITÉ DE MARQUE, CONCESSION & STATUT DE CAISSE   */}
      {/* ============================================================== */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-3 border-b border-blue-900/40">
        {/* Identité FCT & Hamburger Mobile */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Menu Mobile Hamburger */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            title={lang === 'fr' ? 'Ouvrir le menu de navigation' : 'Open navigation menu'}
            className="lg:hidden p-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-white transition cursor-pointer border border-blue-700/60 shadow-xs shrink-0"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Logo officiel concessionnaire */}
          <div className="bg-white px-2 py-0.5 rounded-lg border border-white/20 shadow-xs flex items-center justify-center shrink-0">
            <img
              src={FCT_LOGO_BASE64}
              alt="FCT Automobile Douala"
              className="h-6 sm:h-7 w-auto max-w-[110px] object-contain"
            />
          </div>

          {/* Titre & Localisation Concession */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm tracking-wide text-white truncate">
                FRANCHISE CONSEILS TRADING
              </span>
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                ERP / CRM
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 truncate">
              <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">Douala • Bonamoussadi</span>
              <span className="text-slate-500 hidden md:inline">•</span>
              <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-blue-300" />
                <span>UTC+1</span>
              </span>
            </div>
          </div>
        </div>

        {/* Étage 1 Droite : Statut de Caisse Actif / Fermé */}
        <div className="shrink-0">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition shadow-xs ${
              activeSession
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title={
              activeSession
                ? `${t.activeSession} : ${activeSession.sessionNumber}`
                : t.noActiveSession
            }
          >
            <Coins className={`w-3.5 h-3.5 shrink-0 ${activeSession ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${activeSession ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
              <span className="font-semibold text-xs">
                {activeSession ? (
                  <>
                    <span className="hidden sm:inline">{isEn ? 'Cash Session' : 'Session Caisse'} </span>
                    <span className="font-mono font-bold text-white">
                      ({activeSession.sessionNumber.replace(/^CS-\d{4}-/, 'CS-')})
                    </span>
                  </>
                ) : (
                  <span>{isEn ? 'Register Closed' : 'Caisse Fermée'}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ÉTAGE 2 : COMMANDES SYSTÈME, OUTILS & COMPTE COLLABORATEUR      */}
      {/* ============================================================== */}
      <div className="px-3 sm:px-4 py-1.5 bg-[#0a1e35]/85 flex items-center justify-between gap-3 text-xs">
        {/* Étage 2 Gauche : Connectivité Firestore, Langue, Mode Discrétion */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Statut Réseau / Hors-ligne avec toggle On/Off */}
          <button
            type="button"
            onClick={toggleOnline}
            title={
              state.isOnline
                ? isEn
                  ? 'Online — Cloud Firestore real-time active'
                  : 'En ligne — Synchronisation Cloud Firestore active'
                : isEn
                  ? 'Offline mode (local cache active)'
                  : 'Mode Hors-Ligne (cache local actif)'
            }
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium transition cursor-pointer shrink-0 ${
              state.isOnline
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30'
            }`}
          >
            {state.isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-semibold">{isEn ? 'Online' : 'En ligne'}</span>
              </>
            ) : (
              <>
                <div className="relative flex items-center">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {pendingSyncCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                      {pendingSyncCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-semibold">{isEn ? 'Offline' : 'Hors-ligne'}</span>
              </>
            )}
          </button>

          {/* Séparateur */}
          <div className="h-3.5 w-px bg-blue-800/60 shrink-0" />

          {/* Sélecteur de Langue Compact (FR / EN) */}
          <div className="flex items-center bg-slate-900/80 rounded-md border border-slate-700/80 p-0.5 shrink-0">
            <Globe className="w-3 h-3 text-slate-400 ml-1 mr-0.5" />
            <button
              type="button"
              onClick={() => onLanguageChange('fr')}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition cursor-pointer ${
                lang === 'fr'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition cursor-pointer ${
                lang === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Mode Discrétion / Confidentialité des Chiffres */}
          {onTogglePrivacyMode && (
            <>
              <div className="h-3.5 w-px bg-blue-800/60 shrink-0 hidden sm:block" />
              <button
                type="button"
                onClick={onTogglePrivacyMode}
                title={
                  lang === 'fr'
                    ? isPrivacyMode
                      ? 'Désactiver le mode discrétion (Afficher les montants)'
                      : 'Activer le mode discrétion (Masquer les montants)'
                    : isPrivacyMode
                      ? 'Disable privacy mode (Show amounts)'
                      : 'Enable privacy mode (Hide amounts)'
                }
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] transition cursor-pointer shrink-0 ${
                  isPrivacyMode
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-xs'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
                }`}
              >
                {isPrivacyMode ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline font-semibold">{isEn ? 'Private' : 'Discrétion'}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden md:inline font-medium text-slate-400">{isEn ? 'Visible' : 'Montants'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Étage 2 Droite : Compte Collaborateur AÉRÉ (sans titre de poste), Cadenas & Déconnexion */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Nom du Collaborateur (sans le poste encombrant, épuré comme demandé) */}
          <button
            type="button"
            onClick={onOpenProfileSecurity}
            title={`${currentUser.fullName} (${t.roles[currentUser.role]}) — ${t.navbar.myProfile}`}
            className="flex items-center bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 px-2.5 py-1 gap-2 text-xs transition cursor-pointer text-left shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[220px]">
              {currentUser.fullName}
            </span>
          </button>

          {/* Bouton Verrouiller l'écran */}
          {onLockNow && (
            <button
              type="button"
              onClick={onLockNow}
              title={t.navbar.lockSession}
              className="p-1 rounded-md bg-slate-900/70 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-slate-700/80 transition cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bouton Déconnexion */}
          <button
            type="button"
            onClick={onLogout}
            title={t.navbar.logout}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white font-medium text-xs transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{t.lockScreen.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
