/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Top Navigation Bar
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { UserProfile, UserRole } from '../../packages/shared-types/index.ts';
import {
  Wifi,
  WifiOff,
  Globe,
  Shield,
  UserCheck,
  User,
  Building2,
  Clock,
  Menu,
  LogOut,
  Lock,
  Sparkles,
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
}) => {
  const t = translations[lang];
  const pendingSyncCount = state.syncQueue.filter((q) => q.status === 'PENDING').length;
  const activeSession = state.cashSessions.find((s) => s.status === 'OPEN');

  const toggleOnline = () => {
    dbStore.setOnlineStatus(!state.isOnline);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0f2a4a] text-white border-b border-blue-900/60 shadow-md pt-[env(safe-area-inset-top,0px)]">
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Brand & Agency Title with Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            title={lang === 'fr' ? 'Ouvrir le menu de navigation' : 'Open navigation menu'}
            className="lg:hidden p-2 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-white transition cursor-pointer border border-blue-700/60 shadow-sm"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </button>

          <div className="bg-white px-2 py-1 rounded-lg border border-white/20 shadow-sm flex items-center justify-center shrink-0">
            <img
              src={FCT_LOGO_BASE64}
              alt="FCT Automobile Douala"
              className="h-7 sm:h-8 w-auto max-w-[120px] object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-sm sm:text-base tracking-wide text-white truncate max-w-[150px] sm:max-w-none">
                FRANCHISE CONSEILS TRADING
              </span>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0">
                ERP / CRM
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-300">
              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden md:inline">{t.agencyLocation}</span>
              <span className="md:hidden">Douala, Santa Barbara</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>UTC+1</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Control Panel */}
        <div className="flex items-center flex-wrap gap-2.5 text-xs">
          {/* Caisse Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border text-[11px] sm:text-xs shrink-0 ${
              activeSession
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                activeSession ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="font-medium hidden sm:inline">
              {activeSession ? `${t.activeSession} (${activeSession.sessionNumber})` : t.noActiveSession}
            </span>
            <span className="font-medium sm:hidden">
              {activeSession ? t.activeSession : t.noActiveSession}
            </span>
          </div>

          {/* Network / Offline Mode Switch */}
          <button
            onClick={toggleOnline}
            title={lang === 'fr' ? 'Bascule Mode En Ligne / Hors-Ligne' : 'Toggle Online / Offline Mode'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium border cursor-pointer ${
              state.isOnline
                ? 'bg-blue-900/60 hover:bg-blue-900 border-blue-700/60 text-blue-200'
                : 'bg-amber-950/90 hover:bg-amber-900 border-amber-600/70 text-amber-200'
            }`}
          >
            {state.isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.online}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{t.offline}</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-md border border-slate-700 p-0.5">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => onLanguageChange('fr')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                lang === 'fr'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                lang === 'en'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Collaborateur Authentifié & Rôle RBAC (Cliquable pour ouvrir Profil & PIN) */}
          <button
            type="button"
            onClick={onOpenProfileSecurity}
            title={t.navbar.myProfile}
            className="flex items-center bg-slate-800/90 hover:bg-slate-700/90 rounded-lg border border-slate-700/80 px-2.5 py-1 gap-2 text-xs transition cursor-pointer text-left"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <div className="max-w-[130px] sm:max-w-[180px] truncate">
              <span className="font-bold text-white truncate block">
                {currentUser.fullName}
              </span>
            </div>
            <span className="hidden md:inline px-1.5 py-0.5 rounded bg-blue-900/90 text-[10px] text-blue-200 font-bold uppercase shrink-0">
              {t.roles[currentUser.role]}
            </span>
          </button>

          {/* Bouton Verrouiller l'écran maintenant */}
          {onLockNow && (
            <button
              type="button"
              onClick={onLockNow}
              title={t.navbar.lockSession}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Déconnexion de la session Firebase */}
          <button
            type="button"
            onClick={onLogout}
            title={t.navbar.logout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-200 hover:text-white font-bold text-xs transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.lockScreen.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
