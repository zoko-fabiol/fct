/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Centre de Configuration & Paramètres FCT
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Ce composant implémente l'ensemble des 10 catégories de configuration FCT
 * en préservant strictement l'intégralité des paramètres existants, avec
 * persistance réactive (IndexedDB / LocalStorage / Firestore), journal d'audit,
 * contrôle RBAC et validation en temps réel.
 */

import React, { useState, useMemo } from 'react';
import { DatabaseState, dbStore } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { AppModule, AgencySettings, AuditLog } from '../../packages/shared-types/index.ts';
import { generateDocumentNumber, hasEffectivePermission } from '../../packages/business-rules/index.ts';
import {
  Settings,
  Building2,
  MapPin,
  Phone,
  Hash,
  Clock,
  Coins,
  Palette,
  FileText,
  Shield,
  Wrench,
  Car,
  Layers,
  Cloud,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Upload,
  Eye,
  Lock,
  Camera,
  Percent,
  History,
  FileCheck,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';

interface SettingsViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
}

type SettingsTab =
  | 'general'
  | 'appearance'
  | 'numbering'
  | 'finance'
  | 'fleet'
  | 'maintenance'
  | 'rentals'
  | 'modules'
  | 'sync'
  | 'backup';

export const SettingsView: React.FC<SettingsViewProps> = ({ state, lang, onNavigate }) => {
  const { settings } = state;
  const currentUser = dbStore.getCurrentUser();
  const t = translations[lang];

  // RBAC permissions check
  const canEdit = hasEffectivePermission(currentUser, 'settings', 'update', state.rolePermissions);

  // Active category tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Local draft state for editing with save/cancel mechanics
  const [formData, setFormData] = useState<AgencySettings>(() => ({ ...settings }));
  const [changeReason, setChangeReason] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState<{ step: string; current: number; total: number } | null>(null);
  const [localStorageClearedInfo, setLocalStorageClearedInfo] = useState<{ clearedKeys: string[]; bytesFreed: number } | null>(null);

  // Synchronize draft when external state changes, if not dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(settings);
  }, [formData, settings]);

  const handleChange = <K extends keyof AgencySettings>(key: K, value: AgencySettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  const handleModuleToggle = (moduleKey: AppModule) => {
    if (!canEdit) return;
    const currentEnabled = formData.moduleToggles?.[moduleKey] ?? true;
    setFormData((prev) => ({
      ...prev,
      moduleToggles: {
        ...(prev.moduleToggles || {}),
        [moduleKey]: !currentEnabled,
      },
    }));
  };

  const handlePaymentMethodToggle = (method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY') => {
    if (!canEdit) return;
    const currentMethods = formData.allowedPaymentMethods || ['CASH'];
    let updated: ('CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY')[];
    if (currentMethods.includes(method)) {
      if (currentMethods.length === 1 && method === 'CASH') {
        // Prevent unchecking the sole cash method as it's required for Douala desk
        return;
      }
      updated = currentMethods.filter((m) => m !== method);
    } else {
      updated = [...currentMethods, method];
    }
    handleChange('allowedPaymentMethods', updated);
  };

  const handleSave = () => {
    if (!canEdit) return;
    try {
      dbStore.updateSettings(formData, changeReason.trim() || undefined);
      setSaveSuccessMsg(
        lang === 'fr'
          ? 'Paramètres FCT enregistrés et appliqués avec succès.'
          : 'FCT Settings saved and applied successfully.'
      );
      setChangeReason('');
      setSaveErrorMsg(null);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setSaveErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCancel = () => {
    setFormData({ ...settings });
    setChangeReason('');
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  const handleResetDefaults = () => {
    if (!canEdit) return;
    try {
      dbStore.resetSettingsToDefaults(
        lang === 'fr'
          ? 'Réinitialisation manuelle aux paramètres d’usine FCT'
          : 'Manual factory reset of FCT Settings'
      );
      setFormData({ ...dbStore.getSettings() });
      setIsResetConfirmOpen(false);
      setSaveSuccessMsg(
        lang === 'fr'
          ? 'Paramètres FCT réinitialisés aux valeurs standards.'
          : 'FCT Settings restored to default values.'
      );
    } catch (err: unknown) {
      setSaveErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleExportBackup = () => {
    const jsonString = dbStore.exportDatabaseBackup();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fct-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!canEdit || !importJsonText.trim()) return;
    const res = dbStore.importDatabaseBackup(importJsonText.trim());
    if (res.success) {
      setFormData({ ...dbStore.getSettings() });
      setIsImportModalOpen(false);
      setImportJsonText('');
      setSaveSuccessMsg(
        lang === 'fr'
          ? res.message || 'Sauvegarde restaurée avec succès dans la base FCT.'
          : 'Backup successfully restored into FCT database.'
      );
    } else {
      setSaveErrorMsg(
        lang === 'fr'
          ? res.message || 'Échec de la restauration : format JSON invalide ou corrompu.'
          : 'Restoration failed: invalid or corrupted JSON format.'
      );
    }
  };

  const handleTransferToFirebase = async () => {
    if (!canEdit) return;
    setIsTransferring(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    try {
      const purgeResult = dbStore.clearLocalStorage();
      setLocalStorageClearedInfo(purgeResult);
      const res = await dbStore.transferAllToFirebase((step, current, total) => {
        setTransferProgress({ step, current, total });
      });
      setSaveSuccessMsg(
        lang === 'fr'
          ? `Transfert Firebase réussi ! ${res.totalTransferred} enregistrements synchronisés dans Firestore. LocalStorage entièrement nettoyé (${purgeResult.clearedKeys.length} clés supprimées).`
          : `Firebase transfer successful! ${res.totalTransferred} records synced to Firestore. LocalStorage completely purged.`
      );
    } catch (err: unknown) {
      setSaveErrorMsg(
        lang === 'fr'
          ? `Échec du transfert vers Firebase : ${err instanceof Error ? err.message : String(err)}`
          : `Firebase transfer failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsTransferring(false);
      setTransferProgress(null);
    }
  };

  const handleReloadFromFirebase = async () => {
    try {
      const success = await dbStore.reloadFromFirebase();
      if (success) {
        setFormData({ ...dbStore.getSettings() });
        setSaveSuccessMsg(
          lang === 'fr'
            ? 'Données rechargées depuis le cache local Firebase Firestore avec succès.'
            : 'Data reloaded from Firebase Firestore local cache successfully.'
        );
      } else {
        setSaveErrorMsg(
          lang === 'fr'
            ? 'Aucune donnée trouvée dans Firebase ou hors-ligne.'
            : 'No data found in Firebase or offline.'
        );
      }
    } catch (err: unknown) {
      setSaveErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };


  // Preview document numbers computed live
  const sampleYear = new Date().getFullYear();
  const padDigits = formData.numberPaddingDigits || 4;
  const incYear = formData.includeYearInDocNumber !== false;

  const docPreviews = [
    { label: 'Contrat de location', prefix: formData.rentalPrefix || 'CTR', sample: generateDocumentNumber(formData.rentalPrefix || 'CTR', 1, sampleYear, padDigits, incYear) },
    { label: 'Facture client', prefix: formData.invoicePrefix || 'FAC', sample: generateDocumentNumber(formData.invoicePrefix || 'FAC', 42, sampleYear, padDigits, incYear) },
    { label: 'Reçu d’encaissement', prefix: formData.receiptPrefix || 'REC', sample: generateDocumentNumber(formData.receiptPrefix || 'REC', 158, sampleYear, padDigits, incYear) },
    { label: 'Bon de commande vente', prefix: formData.salePrefix || 'COM', sample: generateDocumentNumber(formData.salePrefix || 'COM', 7, sampleYear, padDigits, incYear) },
    { label: 'Réservation', prefix: formData.reservationPrefix || 'RES', sample: generateDocumentNumber(formData.reservationPrefix || 'RES', 89, sampleYear, padDigits, incYear) },
    { label: 'Ordre de maintenance', prefix: formData.maintenancePrefix || 'MNT', sample: generateDocumentNumber(formData.maintenancePrefix || 'MNT', 12, sampleYear, padDigits, incYear) },
    { label: 'Devis proforma', prefix: formData.quotePrefix || 'DEV', sample: generateDocumentNumber(formData.quotePrefix || 'DEV', 3, sampleYear, padDigits, incYear) },
    { label: 'Pièce de dépense caisse', prefix: formData.expensePrefix || 'DEP', sample: generateDocumentNumber(formData.expensePrefix || 'DEP', 205, sampleYear, padDigits, incYear) },
  ];

  // List of all 18 modules aligned strictly with AppModule type
  const allModules: { key: AppModule; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Tableau de bord', desc: 'KPIs d’exploitation et vue d’ensemble', icon: <Layers className="w-4 h-4 text-emerald-600" /> },
    { key: 'vehicles', label: 'Parc Automobile', desc: 'Inventaire des véhicules, statuts et immatriculations', icon: <Car className="w-4 h-4 text-blue-600" /> },
    { key: 'rentals', label: 'Locations & Contrats', desc: 'Contrats, départs, retours et cautions', icon: <FileCheck className="w-4 h-4 text-emerald-600" /> },
    { key: 'sales', label: 'Vente Véhicules & Mandats', desc: 'Pipeline commercial, acomptes et cessions', icon: <Coins className="w-4 h-4 text-indigo-600" /> },
    { key: 'crm', label: 'Clients & CRM', desc: 'Fiches clients, prospects et historique locatif', icon: <Building2 className="w-4 h-4 text-sky-600" /> },
    { key: 'reservations', label: 'Réservations de Véhicules', desc: 'Plannings, arrhes et blocage préventif', icon: <Clock className="w-4 h-4 text-teal-600" /> },
    { key: 'billing', label: 'Facturation & Devis', desc: 'Émission de factures proforma et reçus conformes', icon: <FileText className="w-4 h-4 text-violet-600" /> },
    { key: 'cash', label: 'Caisse & Trésorerie', desc: 'Encaissements espèces, dépenses et clôtures', icon: <Coins className="w-4 h-4 text-emerald-600" /> },
    { key: 'maintenance', label: 'Maintenance & Garage', desc: 'Ordres d’intervention, vidanges et réparations', icon: <Wrench className="w-4 h-4 text-amber-600" /> },
    { key: 'stock', label: 'Pièces & Stock', desc: 'Gestion de pièces détachées et alertes réassort', icon: <Hash className="w-4 h-4 text-purple-600" /> },
    { key: 'drivers', label: 'Chauffeurs & Assignations', desc: 'Permis, plannings et missions de mise à disposition', icon: <Phone className="w-4 h-4 text-cyan-600" /> },
    { key: 'documents', label: 'Coffre-Fort Documents', desc: 'Contrats PDF, cartes grises et Cloudinary', icon: <Camera className="w-4 h-4 text-slate-600" /> },
    { key: 'notifications', label: 'Alertes & Notifications', desc: 'Échéances assurances, visites et retards', icon: <AlertTriangle className="w-4 h-4 text-rose-600" /> },
    { key: 'reports', label: 'Rapports & Statistiques', desc: 'Analyses de rentabilité, flotte et trésorerie', icon: <Eye className="w-4 h-4 text-teal-600" /> },
    { key: 'users', label: 'Équipe & Permissions RBAC', desc: 'Gestion des rôles, accès et profils utilisateurs', icon: <Shield className="w-4 h-4 text-rose-600" /> },
    { key: 'settings', label: 'Paramètres FCT', desc: 'Configuration centrale de l’agence', icon: <Settings className="w-4 h-4 text-slate-700" /> },
    { key: 'audit', label: 'Audit & Journal Système', desc: 'Traçabilité des opérations et synchronisation', icon: <History className="w-4 h-4 text-slate-600" /> },
    { key: 'help', label: 'Centre d’Aide FCT', desc: 'Guide d’utilisation et procédures opérationnelles', icon: <Info className="w-4 h-4 text-indigo-500" /> },
  ];

  // Settings audit logs filtered
  const settingsAuditLogs = useMemo(() => {
    return (state.auditLogs || []).filter(
      (log) => log.module === 'settings'
    );
  }, [state.auditLogs]);

  // Tab navigation definitions
  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'general', label: 'Général & Identité', icon: <Building2 className="w-4 h-4" /> },
    { id: 'appearance', label: 'Apparence & Préférences', icon: <Palette className="w-4 h-4" /> },
    { id: 'numbering', label: 'Numérotation & Documents', icon: <Hash className="w-4 h-4" /> },
    { id: 'finance', label: 'Finances & Caisse', icon: <Coins className="w-4 h-4" /> },
    { id: 'fleet', label: 'Parc & Alertes', icon: <Car className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance & Stock', icon: <Wrench className="w-4 h-4" /> },
    { id: 'rentals', label: 'Locations & Réservations', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'modules', label: 'Gestion des Modules', icon: <Layers className="w-4 h-4" />, badge: '18' },
    { id: 'sync', label: 'Synchronisation & Médias', icon: <Cloud className="w-4 h-4" /> },
    { id: 'backup', label: 'Sauvegardes & Audit', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with title, search and persistent action buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{t.settingsPage.title}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    FCT ERP v2.4
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.settingsPage.subtitle} — Douala, Cameroun
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'fr' ? 'Rechercher un paramètre...' : 'Search settings...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* Cancel & Save triggers */}
            {canEdit && (
              <>
                {isDirty && (
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lang === 'fr' ? 'Annuler' : 'Cancel'}</span>
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    isDirty
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'fr' ? 'Enregistrer les modifications' : 'Save Changes'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Read-only RBAC Alert when user lacks 'settings.update' */}
        {!canEdit && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              {lang === 'fr'
                ? 'Mode consultation seule : Votre rôle actuel ne dispose pas des droits de modification sur les paramètres FCT.'
                : 'Read-only mode: Your current role does not have edit permissions on FCT Settings.'}
            </span>
          </div>
        )}

        {/* Alerts: Success or Error */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{saveErrorMsg}</span>
          </div>
        )}

        {/* Audit trail reason input if dirty */}
        {canEdit && isDirty && (
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 whitespace-nowrap">
              <History className="w-4 h-4 text-blue-700" />
              <span>{lang === 'fr' ? 'Motif de traçabilité (Audit) :' : 'Change Reason (Audit) :'}</span>
            </div>
            <input
              type="text"
              placeholder={
                lang === 'fr'
                  ? 'Ex: Mise à jour du taux TVA / Ajustement de l’adresse de l’agence...'
                  : 'E.g. VAT rate update / Agency address adjustment...'
              }
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="flex-1 w-full px-3 py-1.5 text-xs rounded-lg border border-blue-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}

        {/* 2. Responsive Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-slate-700 text-emerald-400' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB A: GENERAL & COMPANY IDENTITY */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>Identité Légale & Raison Sociale</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Siège Social Douala</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Nom Officiel de l’Entreprise <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.agencyName}
                  onChange={(e) => handleChange('agencyName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Nom Commercial / Sigle
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.tradeName || 'FCT Automobile Douala'}
                  onChange={(e) => handleChange('tradeName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Registre du Commerce (RCCM)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.commercialRegistry}
                  onChange={(e) => handleChange('commercialRegistry', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Numéro d’Identifiant Unique (NIU)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.taxIdNumber}
                  onChange={(e) => handleChange('taxIdNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">
                  Adresse Principale & Quartier
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Point de Repère Local
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.landmark}
                  onChange={(e) => handleChange('landmark', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Ville</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Pays</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Téléphone Principal (Standard)</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.phone1}
                  onChange={(e) => handleChange('phone1', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Téléphone Secondaire / Mobile</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.phone2}
                  onChange={(e) => handleChange('phone2', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Email Officiel</label>
                <input
                  type="email"
                  disabled={!canEdit}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Site Web</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">
                  URL du Logo de l’Entreprise (Entêtes & Impressions)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="https://... ou identifiant Cloudinary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">
                  Mention Légale de Bas de Page (Factures & Contrats)
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={formData.legalMention || ''}
                  onChange={(e) => handleChange('legalMention', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Quick Summary / Legal Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm tracking-wide">FCT Automobile — Cameroun</span>
              </div>
              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Raison Sociale :</span>
                  <span className="font-bold text-white text-sm">{formData.agencyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Localisation exacte :</span>
                  <span className="text-slate-200 font-semibold">
                    {formData.address} ({formData.landmark}), {formData.city}, {formData.country}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-700/50">
                  <div>
                    <span className="text-slate-400 block text-[11px]">RCCM :</span>
                    <span className="font-mono text-emerald-300 font-bold">{formData.commercialRegistry}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIU :</span>
                    <span className="font-mono text-emerald-300 font-bold">{formData.taxIdNumber}</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zone CEMAC — Fuseau {formData.timezone} (UTC+1)</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Protection des Données Légales</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Ces données sont directement imprimées sur tous les contrats de location, factures proforma et reçus de caisse remis aux clients à Douala.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: APPEARANCE & PREFERENCES */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>Apparence de l’Interface & Préférences Régionales</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Theme */}
            <div className="space-y-2">
              <label className="block text-slate-700 font-bold">Thème Visuel</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Clair', desc: 'Bureau standard' },
                  { value: 'dark', label: 'Sombre', desc: 'Contraste élevé' },
                  { value: 'system', label: 'Système', desc: 'Automatique' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleChange('theme', item.value as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      (formData.theme || 'light') === item.value
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="block font-bold text-slate-900">{item.label}</span>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="block text-slate-700 font-bold">Langue Principale de l’Application</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { code: 'fr', label: 'Français (Cameroun)', flag: '🇨🇲' },
                  { code: 'en', label: 'English (UK / US)', flag: '🇬🇧' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleChange('defaultLanguage', item.code as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      (formData.defaultLanguage || 'fr') === item.code
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="block font-bold text-slate-900 text-sm">
                      {item.flag} {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Density */}
            <div className="space-y-2">
              <label className="block text-slate-700 font-bold">Densité d’Affichage des Tableaux</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'compact', label: 'Compacte', desc: 'Max données' },
                  { value: 'comfortable', label: 'Confortable', desc: 'Équilibrée' },
                  { value: 'spacious', label: 'Spacieuse', desc: 'Tactile' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleChange('density', item.value as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      (formData.density || 'comfortable') === item.value
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="block font-bold text-slate-900">{item.label}</span>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time display */}
            <div className="space-y-3">
              <label className="block text-slate-700 font-bold">Format Date & Fuseau Horaire</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Format de date</span>
                  <select
                    disabled={!canEdit}
                    value={formData.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="DD/MM/YYYY">JJ/MM/AAAA (ex: 09/10/2026)</option>
                    <option value="YYYY-MM-DD">AAAA-MM-JJ (ISO 8601)</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Fuseau Horaire</span>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">Notifications Sonores & Visuelles</span>
                <span className="text-slate-500 text-[11px]">
                  Émettre un signal sonore doux lors d’un encaissement réussi ou d’une alerte critique
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={formData.enableSoundAlerts !== false}
                  onChange={(e) => handleChange('enableSoundAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: NUMBERING & DOCUMENT RULES */}
      {activeTab === 'numbering' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>Règles de Numérotation des Documents Officiels</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Génération atomique & protection anti-collision
              </span>
            </div>

            {/* Global formatting options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre de chiffres (remplissage 0)</label>
                <select
                  disabled={!canEdit}
                  value={formData.numberPaddingDigits || 4}
                  onChange={(e) => handleChange('numberPaddingDigits', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={4}>4 chiffres standard (ex: 0001)</option>
                  <option value={5}>5 chiffres (ex: 00001)</option>
                  <option value={6}>6 chiffres étendu (ex: 000001)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Inclure l’année dans la référence</label>
                <div className="flex items-center h-9">
                  <label className="relative inline-flex items-center cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={formData.includeYearInDocNumber !== false}
                      onChange={(e) => handleChange('includeYearInDocNumber', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="text-slate-800 font-semibold text-xs">
                      {formData.includeYearInDocNumber !== false ? 'Oui (ex: 2026)' : 'Non (Sans année)'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <span className="block text-slate-500 font-bold mb-1">Règle de continuité</span>
                <span className="text-[11px] text-slate-600 leading-tight block">
                  La séquence s’incrémente de façon strictement croissante. Aucune réutilisation de numéro supprimé.
                </span>
              </div>
            </div>

            {/* Individual Prefixes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Contrat Location</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.rentalPrefix}
                  onChange={(e) => handleChange('rentalPrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Facture Client</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.invoicePrefix}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Reçu Encaissement</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.receiptPrefix}
                  onChange={(e) => handleChange('receiptPrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Commande Vente</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.salePrefix}
                  onChange={(e) => handleChange('salePrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Réservation</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.reservationPrefix || 'RES'}
                  onChange={(e) => handleChange('reservationPrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Maintenance</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.maintenancePrefix || 'MNT'}
                  onChange={(e) => handleChange('maintenancePrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Devis Proforma</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.quotePrefix || 'DEV'}
                  onChange={(e) => handleChange('quotePrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Préfixe Dépense Caisse</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.expensePrefix || 'DEP'}
                  onChange={(e) => handleChange('expensePrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Real-time Preview Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Aperçu en Direct des Prochains Numéros de Pièces</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {docPreviews.map((doc, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 block truncate">{doc.label}</span>
                  <span className="font-mono font-bold text-blue-900 text-sm tracking-wide block">
                    {doc.sample}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB D: FINANCE & CASH DESK */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Paramètres Financiers, Fiscaux & Caisse</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Devise Canonique : Franc CFA (XAF)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Taux de TVA Cameroun (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  disabled={!canEdit}
                  value={formData.taxRatePercent}
                  onChange={(e) => handleChange('taxRatePercent', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Taux légal normal : 19.25%</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Caution Standard par Défaut (XAF)</label>
              <input
                type="number"
                step="5000"
                disabled={!canEdit}
                value={formData.defaultDepositXAF}
                onChange={(e) => handleChange('defaultDepositXAF', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Recommandé : 200 000 XAF</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Plafond Remise sans Approbation (%)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.maxDiscountWithoutApprovalPercent || 10}
                onChange={(e) => handleChange('maxDiscountWithoutApprovalPercent', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Au-delà : validation Directeur requise</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Seuil Approbation Dépense Caisse (XAF)
              </label>
              <input
                type="number"
                step="5000"
                disabled={!canEdit}
                value={formData.expenseApprovalThresholdXAF || 50000}
                onChange={(e) => handleChange('expenseApprovalThresholdXAF', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Au-delà : validation Direction obligatoire</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Tolérance Écart de Caisse Clôture (XAF)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.cashDiscrepancyToleranceXAF || 0}
                onChange={(e) => handleChange('cashDiscrepancyToleranceXAF', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Tolérance comptable maximale admise</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Clôture Caisse Journalière Obligatoire</label>
              <div className="flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={formData.mandatoryCashOpening !== false}
                    onChange={(e) => handleChange('mandatoryCashOpening', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="text-slate-800 font-semibold text-xs">
                    {formData.mandatoryCashOpening !== false ? 'Activée' : 'Facultative'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="block text-xs font-bold text-slate-900">
              Modes de Paiement Autorisés au Guichet FCT
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { key: 'CASH' as const, label: 'Espèces (Cash Guichet)', desc: 'Mode principal FCT Douala' },
                { key: 'BANK_TRANSFER' as const, label: 'Virement Bancaire', desc: 'Attestation requise' },
                { key: 'CHECK' as const, label: 'Chèque Certifié', desc: 'Validation préalable' },
                { key: 'MOBILE_MONEY' as const, label: 'Orange / MTN Money', desc: 'Bordereau de transaction' },
              ].map((pm) => {
                const isChecked = (formData.allowedPaymentMethods || ['CASH']).includes(pm.key);
                return (
                  <button
                    key={pm.key}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handlePaymentMethodToggle(pm.key)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isChecked
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{pm.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500">{pm.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB E: FLEET & ALERTS */}
      {activeTab === 'fleet' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Paramètres du Parc Automobile & Seuils d’Alerte</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Alerte Expiration Assurance (Jours avant)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.insuranceAlertDays || 30}
                onChange={(e) => handleChange('insuranceAlertDays', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Déclenche notification et pastille orange</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Alerte Visite Technique (Jours avant)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.technicalInspectionAlertDays || 30}
                onChange={(e) => handleChange('technicalInspectionAlertDays', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contrôle technique CEMAC obligatoire</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Alerte Kilométrique Anticipée Vidange (Km)
              </label>
              <input
                type="number"
                step="500"
                disabled={!canEdit}
                value={formData.maintenanceAlertMileageKm || 1500}
                onChange={(e) => handleChange('maintenanceAlertMileageKm', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Ex: alerter 1 500 km avant l’échéance</span>
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Photos Obligatoires lors des Départs / Retours</span>
                <span className="text-slate-500 text-[11px]">
                  Exiger au minimum 4 photos (face avant, arrière, côté gauche, côté droit) avant signature du contrat
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={formData.requireVehicleInspectionPhotos !== false}
                  onChange={(e) => handleChange('requireVehicleInspectionPhotos', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB F: MAINTENANCE & STOCK */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Paramètres de Maintenance & Gestion du Stock de Pièces</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Intervalle Standard Vidange Moteur (Km)
              </label>
              <input
                type="number"
                step="1000"
                disabled={!canEdit}
                value={formData.defaultMaintenanceIntervalKm || 10000}
                onChange={(e) => handleChange('defaultMaintenanceIntervalKm', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Recommandé : 5 000 à 10 000 km</span>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Garage Partenaire / Concessionnaire Référent
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.defaultGarageName || 'Atelier Central CFAO Bassa Douala'}
                onChange={(e) => handleChange('defaultGarageName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Seuil d’Alerte de Stock Faible par Défaut
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.lowStockThresholdGlobal || 5}
                onChange={(e) => handleChange('lowStockThresholdGlobal', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Alerte lorsqu’une pièce a ≤ ce nombre en rayon</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <div>
                <span className="font-bold text-amber-950 block">Déduction Automatique des Pièces</span>
                <span className="text-amber-800 text-[11px]">
                  Déduire le stock uniquement lors de la clôture définitive de l’ordre de maintenance
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={formData.strictStockDeductionOnWorkOrder !== false}
                  onChange={(e) => handleChange('strictStockDeductionOnWorkOrder', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB G: RENTALS & RESERVATIONS */}
      {activeTab === 'rentals' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Paramètres des Locations, Réservations & Contrats</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Durée Minimale de Location (Jours)</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.minRentalDurationDays || 1}
                onChange={(e) => handleChange('minRentalDurationDays', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Délai Max d’Annulation sans Frais (Jours)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.maxAdvanceReservationDays || 90}
                onChange={(e) => handleChange('maxAdvanceReservationDays', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Pénalité de Retard Horaire (XAF/h)</label>
              <input
                type="number"
                step="1000"
                disabled={!canEdit}
                value={formData.hourlyLatePenaltyRateXAF || 5000}
                onChange={(e) => handleChange('hourlyLatePenaltyRateXAF', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Inspection Contradictoire Obligatoire</span>
                <span className="text-slate-500 text-[11px]">
                  Bloquer la clôture du contrat tant que la fiche de retour contradictoire (kilométrage & niveau de carburant) n’est pas signée
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={formData.mandatoryInspectionOnReturn !== false}
                  onChange={(e) => handleChange('mandatoryInspectionOnReturn', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB H: 18 MODULES TOGGLES */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Gestion & Disponibilité des 18 Modules FCT</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                La désactivation d’un module masque son accès dans le menu de navigation mais ne supprime jamais ses données historiques.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allModules.map((mod) => {
              const isEnabled = formData.moduleToggles?.[mod.key] ?? true;
              return (
                <div
                  key={mod.key}
                  className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                    isEnabled
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-slate-200 bg-slate-50/70 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 mt-0.5">{mod.icon}</div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{mod.label}</span>
                      <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                        {mod.desc}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      disabled={!canEdit || mod.key === 'settings' || mod.key === 'dashboard'}
                      checked={isEnabled}
                      onChange={() => handleModuleToggle(mod.key)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB I: SYNC & PERSISTENCE FIREBASE */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Persistance des Données FCT : Firebase Local (IndexedDB) & Firestore Cloud</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  state.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-700">
                {state.isOnline ? 'En ligne (Cloud Firestore fct-cmr)' : 'Hors-ligne (Firebase Local Cache)'}
              </span>
            </div>
          </div>

          {/* Architecture overview banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Moteur Principal : Local Firebase
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-bold">
                  IndexedDB Persistent
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Persistance locale offline-first ultra-rapide sans latence, synchronisée en temps réel multi-onglets et répliquée sur le projet Cloud <strong>fct-cmr</strong>.
              </p>
            </div>

            <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-600" />
                  LocalStorage Navigateur
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  Désactivé & Purgé (0 Ko)
                </span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                L'ensemble des anciennes clés de stockage ont été définitivement purgées. Plus aucune donnée FCT n'est stockée dans l'ancien LocalStorage vulnérable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Status overview and migration trigger */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-900 block text-xs">Synchronisation & Transfert Intégral</span>
              
              <div className="space-y-2 text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <span>Véhicules enregistrés :</span>
                  <span className="font-bold text-slate-900">{state.vehicles?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Clients & Comptes :</span>
                  <span className="font-bold text-slate-900">{state.customers?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Contrats de Location :</span>
                  <span className="font-bold text-slate-900">{state.contracts?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Factures & Règlements :</span>
                  <span className="font-bold text-slate-900">{state.invoices?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mouvements Caisse Espèces :</span>
                  <span className="font-bold text-slate-900">{state.cashMovements?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Articles en Stock :</span>
                  <span className="font-bold text-slate-900">{state.stock?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Dossiers Maintenance :</span>
                  <span className="font-bold text-slate-900">{state.maintenance?.length || 0}</span>
                </div>
              </div>

              {isTransferring && transferProgress && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-amber-900">
                    <span>{transferProgress.step}</span>
                    <span>{transferProgress.current} / {transferProgress.total}</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 transition-all duration-300"
                      style={{
                        width: `${Math.round((transferProgress.current / Math.max(1, transferProgress.total)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={!canEdit || isTransferring}
                  onClick={handleTransferToFirebase}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTransferring ? 'animate-spin' : ''}`} />
                  <span>
                    {isTransferring
                      ? 'Transfert vers Firebase en cours...'
                      : 'Transférer toutes les données vers Firebase & Purger LocalStorage'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isTransferring}
                  onClick={handleReloadFromFirebase}
                  className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Recharger depuis le Cache Local Firebase</span>
                </button>
              </div>
            </div>

            {/* Cloudinary credentials & Storage settings */}
            <div className="space-y-4">
              <span className="font-bold text-slate-900 block text-xs">Coffre-fort Documents & Cloudinary</span>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Cloud Name Cloudinary
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.cloudinaryCloudName || 'c58pcgcp'}
                  onChange={(e) => handleChange('cloudinaryCloudName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Upload Preset Non Signé
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.cloudinaryUploadPreset || 'fct_erp_unsigned'}
                  onChange={(e) => handleChange('cloudinaryUploadPreset', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Dossier Racine Cloudinary
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.cloudinaryFolderRoot || 'fct_automobile'}
                  onChange={(e) => handleChange('cloudinaryFolderRoot', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB J: BACKUP & AUDIT TRAIL */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Sauvegarde de Sécurité & Restauration Intégrale</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Export Button */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Sauvegarde Locale Complète</span>
                  <span className="text-[11px] text-slate-500 block">
                    Télécharger un instantané JSON chiffré de toute la base de données FCT (véhicules, clients, caisse, contrats).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter la Sauvegarde (JSON)</span>
                </button>
              </div>

              {/* Import Button */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Restauration depuis JSON</span>
                  <span className="text-[11px] text-slate-500 block">
                    Restaurer une sauvegarde antérieure avec validation de schéma et traçabilité immédiate.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Importer / Restaurer</span>
                </button>
              </div>

              {/* Factory Reset */}
              <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-rose-900 block">Paramètres d’Usine FCT</span>
                  <span className="text-[11px] text-rose-700 block">
                    Rétablir les paramètres par défaut de l’agence (Douala, TVA 19.25%, XAF) sans altérer les données métier.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="w-full py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rétablir les Paramètres</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs for Settings Changes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <History className="w-4 h-4 text-blue-700" />
                <span>Journal d’Audit des Modifications de Paramètres ({settingsAuditLogs.length})</span>
              </div>
            </div>

            {settingsAuditLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Aucune modification de configuration enregistrée pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date & Heure</th>
                      <th className="py-2.5 px-3">Auteur</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Détails / Motif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {settingsAuditLogs.slice(0, 10).map((log: AuditLog) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{log.userName}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">
                Confirmer la réinitialisation des paramètres ?
              </h3>
              <p className="text-xs text-slate-500">
                Tous les préfixes de numérotation, taux fiscaux et règles de l’agence FCT seront réinitialisés à leurs valeurs d’origine. Aucune opération métier (véhicules, clients, contrats) ne sera effacée.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
              >
                Oui, Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT BACKUP JSON */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Restaurer une Sauvegarde FCT</span>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Collez ci-dessous le contenu brut du fichier JSON généré lors d’une sauvegarde FCT précédente :
            </p>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"version": 1, "settings": {...}, "vehicles": [...]}'
              className="w-full p-3 rounded-xl border border-slate-200 font-mono text-[11px] bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!importJsonText.trim()}
                onClick={handleImportBackup}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition disabled:opacity-50"
              >
                Restaurer la Base
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
