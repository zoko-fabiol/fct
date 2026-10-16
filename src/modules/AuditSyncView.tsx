/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Journal d'Audit 360° & Corbeille Sécurisée (30 Jours)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 *
 * Registre de traçabilité immuable, réconciliation temps réel avec Cloud Firestore,
 * et centre de restauration sécurisée des éléments supprimés dans la limite des 30 jours.
 */

import React, { useState, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { TrashItem, AppModule, UserRole } from '../../packages/shared-types/index.ts';
import {
  History,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  User,
  Trash2,
  RotateCcw,
  Search,
  Calendar,
  Filter,
  Layers,
  Sparkles,
  Car,
  FileCheck,
  Users,
  Coins,
  Wrench,
  Package,
  FileText,
  X,
  Eye,
  Check,
} from 'lucide-react';

interface AuditSyncViewProps {
  state: DatabaseState;
  lang: Language;
}

export const AuditSyncView: React.FC<AuditSyncViewProps> = ({ state, lang }) => {
  const t = translations[lang];
  const currentUser = dbStore.getCurrentUser();
  const isEn = lang === 'en';

  // Navigation entre Registre d'Audit 360° et Corbeille Sécurisée avec persistance F5
  const [activeTab, setActiveTab] = useState<'audit' | 'trash'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlSub = new URLSearchParams(window.location.search).get('subtab');
        if (urlSub === 'trash' || urlSub === 'audit') return urlSub;
        const saved = sessionStorage.getItem('fct_active_audit_tab') || localStorage.getItem('fct_active_audit_tab');
        if (saved === 'trash' || saved === 'audit') return saved;
      }
    } catch {}
    return 'audit';
  });

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fct_active_audit_tab', activeTab);
        localStorage.setItem('fct_active_audit_tab', activeTab);
        const url = new URL(window.location.href);
        url.searchParams.set('subtab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, [activeTab]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filtres du Registre d'Audit
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDatePreset, setSelectedDatePreset] = useState<'all' | 'today' | 'yesterday' | '7days' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Gestion de la Corbeille & Restauration
  const [confirmRestoreItem, setConfirmRestoreItem] = useState<TrashItem | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Droits de restauration admin
  const canRestore = currentUser.role === 'super_admin' || currentUser.role === 'director';

  // Dates de référence pour le filtrage
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Filtrage intelligent des logs d'audit
  const filteredAuditLogs = useMemo(() => {
    return (state.auditLogs || []).filter((log) => {
      // 1. Filtre par Date
      const logDate = log.timestamp.split('T')[0];
      if (selectedDatePreset === 'today' && logDate !== todayStr) return false;
      if (selectedDatePreset === 'yesterday' && logDate !== yesterdayStr) return false;
      if (selectedDatePreset === '7days' && new Date(log.timestamp) < sevenDaysAgo) return false;
      if (selectedDatePreset === 'custom' && customDate && logDate !== customDate) return false;

      // 2. Filtre par Utilisateur
      if (selectedUserId !== 'all' && log.userId !== selectedUserId) return false;

      // 3. Filtre par Action
      if (selectedAction !== 'all') {
        if (selectedAction === 'CASH') {
          if (log.action !== 'REVERSAL' && log.action !== 'CLOSE_SESSION' && log.module !== 'cash') return false;
        } else if (log.action !== selectedAction) {
          return false;
        }
      }

      // 4. Filtre par Module
      if (selectedModule !== 'all' && log.module !== selectedModule) return false;

      // 5. Recherche plein texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchText =
          (log.userName || '').toLowerCase().includes(q) ||
          (log.details || '').toLowerCase().includes(q) ||
          (log.reason || '').toLowerCase().includes(q) ||
          (log.module || '').toLowerCase().includes(q) ||
          (log.action || '').toLowerCase().includes(q) ||
          (log.recordId || '').toLowerCase().includes(q) ||
          (log.entityTitle || '').toLowerCase().includes(q) ||
          (log.idempotencyKey || '').toLowerCase().includes(q);
        if (!matchText) return false;
      }

      return true;
    });
  }, [state.auditLogs, selectedDatePreset, customDate, selectedUserId, selectedAction, selectedModule, searchQuery, todayStr, yesterdayStr, sevenDaysAgo]);

  // Éléments de la corbeille
  const trashItems = state.trashItems || [];
  const activeTrashItems = trashItems.filter((item) => {
    const daysLeft = Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return !item.isRestored && daysLeft > 0;
  });

  // KPIs synthétiques
  const logsTodayCount = (state.auditLogs || []).filter((l) => l.timestamp.startsWith(todayStr)).length;
  const creationsTodayCount = (state.auditLogs || []).filter((l) => l.action === 'CREATE').length;
  const updatesTodayCount = (state.auditLogs || []).filter((l) => l.action === 'UPDATE').length;
  const deletionsTodayCount = (state.auditLogs || []).filter((l) => l.action === 'DELETE').length;

  // Déclenchement de la restauration
  const handleExecuteRestore = () => {
    if (!confirmRestoreItem) return;
    try {
      const res = dbStore.restoreFromTrash(confirmRestoreItem.id);
      setRestoreFeedback({ type: 'success', message: res.message });
      setConfirmRestoreItem(null);
      setTimeout(() => setRestoreFeedback(null), 5000);
    } catch (err: unknown) {
      setRestoreFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
      setConfirmRestoreItem(null);
      setTimeout(() => setRestoreFeedback(null), 6000);
    }
  };

  // Liste des modules disponibles pour le filtre
  const availableModules: { key: AppModule; label: string }[] = [
    { key: 'vehicles', label: t.modules.vehicles },
    { key: 'rentals', label: t.modules.rentals },
    { key: 'sales', label: t.modules.sales },
    { key: 'crm', label: t.modules.crm },
    { key: 'reservations', label: t.modules.reservations },
    { key: 'billing', label: t.modules.billing },
    { key: 'cash', label: t.modules.cash },
    { key: 'maintenance', label: t.modules.maintenance },
    { key: 'stock', label: t.modules.stock },
    { key: 'drivers', label: t.modules.drivers },
    { key: 'documents', label: t.modules.documents },
    { key: 'users', label: t.modules.users },
    { key: 'settings', label: t.modules.settings },
    { key: 'audit', label: t.modules.audit },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Entête Supérieure avec Statut Firebase Temps Réel */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            <span>{t.auditPage.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.auditPage.subtitle}
          </p>
        </div>

        {/* Indicateur Temps Réel Firebase (Automatique & Sans Bouton Forcé) */}
        <div
          className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 shadow-xs transition ${
            state.isOnline
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
          title={state.isOnline ? t.auditPage.realtimeOnline : t.auditPage.realtimeOffline}
        >
          <span className="relative flex h-2 w-2">
            {state.isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                state.isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          {state.isOnline ? (
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? 'Firebase Realtime Active' : 'Firebase Temps Réel Actif'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>{isEn ? 'Offline Mode (Local Cache)' : 'Mode Hors-Ligne (Cache Local)'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Bannière de Feedback Toast */}
      {restoreFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-slideDown shadow-sm ${
            restoreFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            {restoreFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{restoreFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoreFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Onglets de Navigation Supérieurs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#0f2a4a] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t.auditPage.auditLogsTab}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {state.auditLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'trash'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>{t.auditPage.trashTab}</span>
          {activeTrashItems.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'trash' ? 'bg-white text-rose-700 font-bold' : 'bg-rose-100 text-rose-800 font-bold'
              }`}
            >
              {activeTrashItems.length}
            </span>
          )}
        </button>
      </div>

      {/* SECTION ONGLET 1 : REGISTRE D'AUDIT 360° */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Cartes de KPIs Synthétiques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">{t.auditPage.actionsToday}</span>
                <span className="text-base font-black text-slate-900">{logsTodayCount}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">{t.auditPage.creationsCount}</span>
                <span className="text-base font-black text-emerald-700">{creationsTodayCount}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">{t.auditPage.updatesCount}</span>
                <span className="text-base font-black text-amber-700">{updatesTodayCount}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">{t.auditPage.deletionsCount}</span>
                <span className="text-base font-black text-rose-700">{deletionsTodayCount}</span>
              </div>
            </div>
          </div>

          {/* Panneau de Filtres Multi-Axes Haute Précision */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>{isEn ? 'Granular Multi-Axis Filters' : 'Filtres d’Audit Multi-Axes'}</span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({filteredAuditLogs.length} / {state.auditLogs.length} {t.auditPage.actionsTracked})
                </span>
              </div>

              {/* Commutateur Cartes / Tableau */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEn ? 'Cards' : 'Cartes'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEn ? 'Table' : 'Tableau'}
                </button>
              </div>
            </div>

            {/* Ligne 1 : Date & Période */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.auditPage.filterByDate} :</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedDatePreset('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDatePreset === 'all'
                    ? 'bg-[#0f2a4a] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.auditPage.allDates}
              </button>

              <button
                type="button"
                onClick={() => setSelectedDatePreset('today')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDatePreset === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.auditPage.today}
              </button>

              <button
                type="button"
                onClick={() => setSelectedDatePreset('yesterday')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDatePreset === 'yesterday'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.auditPage.yesterday}
              </button>

              <button
                type="button"
                onClick={() => setSelectedDatePreset('7days')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDatePreset === '7days'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.auditPage.last7Days}
              </button>

              {/* Sélecteur de date journalière personnalisée */}
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    if (e.target.value) {
                      setSelectedDatePreset('custom');
                    } else {
                      setSelectedDatePreset('all');
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {customDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDate('');
                      setSelectedDatePreset('all');
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs p-1"
                    title={isEn ? 'Clear date' : 'Effacer la date'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Ligne 2 : Type d'Action, Collaborateur, Module et Recherche Plein Texte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
              {/* Type d'Action */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.auditPage.filterByAction}
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">{t.auditPage.allActions}</option>
                  <option value="CREATE">{isEn ? 'Creations (CREATE)' : 'Créations (CREATE)'}</option>
                  <option value="UPDATE">{isEn ? 'Modifications (UPDATE)' : 'Modifications (UPDATE)'}</option>
                  <option value="DELETE">{isEn ? 'Deletions (DELETE)' : 'Suppressions (DELETE)'}</option>
                  <option value="RESTORE">{isEn ? 'Restorations (RESTORE)' : 'Restaurations (RESTORE)'}</option>
                  <option value="CASH">{isEn ? 'Cash Movements & Sessions' : 'Caisse & Rapprochements'}</option>
                  <option value="SECURITY">{isEn ? 'Security & RBAC' : 'Sécurité & Droits'}</option>
                </select>
              </div>

              {/* Collaborateur FCT */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.auditPage.filterByUser}
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">{t.auditPage.allStaff}</option>
                  {state.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Module Métier */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.auditPage.filterByModule}
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">{t.auditPage.allModules}</option>
                  {availableModules.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recherche Texte */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isEn ? 'Instant Search' : 'Recherche Instantanée'}
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.auditPage.searchPlaceholder}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Affichage des Logs Filtrés */}
          {filteredAuditLogs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">{t.auditPage.emptyLogsTitle}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.auditPage.emptyLogsDesc}</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAuditLogs.map((log) => {
                const isRestoredAction = log.action === 'RESTORE';
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 truncate flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.userName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.userRole}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'RESTORE'
                            ? 'bg-indigo-100 text-indigo-800'
                            : log.action === 'DELETE'
                            ? 'bg-rose-100 text-rose-800'
                            : log.action === 'REVERSAL'
                            ? 'bg-amber-100 text-amber-800'
                            : log.action === 'CLOSE_SESSION'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          Module : {log.module}
                        </span>
                        <span className="font-mono text-slate-500 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">
                          {new Date(log.timestamp).toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-800 font-semibold text-xs leading-snug">{log.details}</p>
                      {log.reason && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                          Motif : {log.reason}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{new Date(log.timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}</span>
                      <span className="truncate max-w-[140px] text-[9px]">{log.idempotencyKey}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">{t.auditPage.colDateTime}</th>
                      <th className="py-3 px-4">{t.auditPage.colStaff}</th>
                      <th className="py-3 px-4">{t.auditPage.colRole}</th>
                      <th className="py-3 px-4">{t.auditPage.colAction}</th>
                      <th className="py-3 px-4">{t.auditPage.colModule}</th>
                      <th className="py-3 px-4">{t.auditPage.colDetails}</th>
                      <th className="py-3 px-4">{t.auditPage.colIdempotency}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{log.userName}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px]">{log.userRole}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              log.action === 'CREATE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'RESTORE'
                                ? 'bg-indigo-100 text-indigo-800'
                                : log.action === 'DELETE'
                                ? 'bg-rose-100 text-rose-800'
                                : log.action === 'REVERSAL'
                                ? 'bg-amber-100 text-amber-800'
                                : log.action === 'CLOSE_SESSION'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-black text-slate-700 uppercase text-[10px]">{log.module}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-medium max-w-md">
                          <div>{log.details}</div>
                          {log.reason && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">Motif : {log.reason}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[9px] text-slate-400 whitespace-nowrap">
                          {log.idempotencyKey}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION ONGLET 2 : CORBEILLE SÉCURISÉE FCT (GARANTIE 30 JOURS) */}
      {activeTab === 'trash' && (
        <div className="space-y-4">
          {/* Bannière de Garantie & Règles Métiers */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-slate-50 to-white border border-rose-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-600 text-white shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>{t.auditPage.trashTab}</span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                    Garantie 30 Jours
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                  {t.auditPage.trashSubtitle}. Lorsqu’un collaborateur supprime une donnée, celle-ci disparaît
                  immédiatement de l’interface opérationnelle, mais demeure restaurable par l’Administrateur en 1 clic
                  durant 30 jours.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {t.auditPage.restorableItems}
              </span>
              <span className="text-lg font-black text-rose-700 font-mono">{activeTrashItems.length}</span>
            </div>
          </div>

          {/* Liste des Éléments Supprimés */}
          {trashItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">{t.auditPage.emptyTrashTitle}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.auditPage.emptyTrashDesc}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Élément Supprimé</th>
                      <th className="py-3 px-4">Collection Métier</th>
                      <th className="py-3 px-4">Supprimé Par</th>
                      <th className="py-3 px-4">Date de Suppression</th>
                      <th className="py-3 px-4">Motif de Suppression</th>
                      <th className="py-3 px-4">Validité Restante</th>
                      <th className="py-3 px-4 text-right">Action Restauration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trashItems.map((item) => {
                      const daysLeft = Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpired = daysLeft <= 0;
                      const isRestored = item.isRestored;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 block">{item.entityTitle}</span>
                            <span className="font-mono text-[10px] text-slate-400">{item.entityId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                              {item.originalCollection}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.deletedByName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.deletedByRole}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {new Date(item.deletedAt).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs italic">
                            {item.deletionReason || 'Non spécifié'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isRestored ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{t.auditPage.restoredBadge}</span>
                              </span>
                            ) : isExpired ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3 text-slate-400" />
                                <span>{t.auditPage.expiredBadge}</span>
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                                  daysLeft <= 5
                                    ? 'bg-rose-100 text-rose-800 font-black'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {t.auditPage.expiresIn} {daysLeft} {t.auditPage.days}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isRestored ? (
                              <span className="text-[11px] text-slate-400 italic">
                                Restauré par {item.restoredByName || 'Admin'}
                              </span>
                            ) : isExpired ? (
                              <span className="text-[11px] text-slate-400 italic">Délai dépassé</span>
                            ) : canRestore ? (
                              <button
                                type="button"
                                onClick={() => setConfirmRestoreItem(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{t.auditPage.restoreBtn}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Réservé Admin</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE RESTAURATION SÉCURISÉE */}
      {confirmRestoreItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp my-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-base text-slate-900">{t.auditPage.confirmRestoreTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.auditPage.confirmRestoreDesc}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Élément :</span>
                <span className="font-bold text-slate-900">{confirmRestoreItem.entityTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Collection :</span>
                <span className="font-mono text-slate-700 uppercase">{confirmRestoreItem.originalCollection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Supprimé par :</span>
                <span className="font-bold text-slate-800">{confirmRestoreItem.deletedByName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isEn ? 'Yes, Restore Now' : 'Oui, Restaurer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
