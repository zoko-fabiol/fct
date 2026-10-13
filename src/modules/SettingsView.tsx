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
  Info,
  ShieldCheck,
  X,
  Globe,
  ArrowLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Volume2,
  Bell,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { UsersView } from './UsersView.tsx';

interface SettingsViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  onLanguageChange?: (lang: Language) => void;
  initialTab?: SettingsTab;
}

export type SettingsTab =
  | 'general'
  | 'appearance'
  | 'numbering'
  | 'finance'
  | 'fleet'
  | 'maintenance'
  | 'rentals'
  | 'modules'
  | 'users';

export const SettingsView: React.FC<SettingsViewProps> = ({ state, lang, onNavigate, onLanguageChange, initialTab }) => {
  const { settings } = state;
  const currentUser = dbStore.getCurrentUser();
  const t = translations[lang];

  // RBAC permissions check
  const canEdit = hasEffectivePermission(currentUser, 'settings', 'update', state.rolePermissions);

  // Active category tab (null = Menu Hub principal des paramètres)
  const [activeTab, setActiveTab] = useState<SettingsTab | null>(initialTab ?? null);

  React.useEffect(() => {
    if (initialTab !== undefined) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  // Gestionnaires dynamiques en temps réel pour l'Apparence
  const handleThemeChangeLive = (newTheme: 'light' | 'dark' | 'system') => {
    handleChange('theme', newTheme);
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    dbStore.updateSettings({ theme: newTheme }, 'Changement instantané du thème');
  };

  const handleLanguageChangeLive = (newLang: 'fr' | 'en') => {
    handleChange('defaultLanguage', newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
    dbStore.updateSettings({ defaultLanguage: newLang }, 'Changement de langue principale');
  };

  const handleDensityChangeLive = (newDensity: 'compact' | 'comfortable' | 'spacious') => {
    handleChange('density', newDensity);
    document.documentElement.setAttribute('data-density', newDensity);
    dbStore.updateSettings({ density: newDensity }, 'Changement de densité d’affichage');
  };

  const playFctSoundChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [587.33, 880, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch (e) {
      console.warn('Audio non disponible:', e);
    }
  };

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const testBrowserNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationMsg('Les notifications ne sont pas supportées par ce navigateur.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('FCT Automobile — Douala', {
          body: 'Alerte sonore et notification système opérationnelles !',
          icon: '/favicon.ico',
        });
        setNotificationMsg('Notification envoyée avec succès sur votre bureau !');
      } else {
        setNotificationMsg('Autorisation refusée par le navigateur.');
      }
    } catch {
      setNotificationMsg('Erreur lors de la demande d’autorisation.');
    }
    setTimeout(() => setNotificationMsg(null), 4000);
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
    { label: lang === 'en' ? 'Rental Contract' : 'Contrat de location', prefix: formData.rentalPrefix || 'CTR', sample: generateDocumentNumber(formData.rentalPrefix || 'CTR', 1, sampleYear, padDigits, incYear) },
    { label: lang === 'en' ? 'Customer Invoice' : 'Facture client', prefix: formData.invoicePrefix || 'FAC', sample: generateDocumentNumber(formData.invoicePrefix || 'FAC', 42, sampleYear, padDigits, incYear) },
    { label: lang === 'en' ? 'Payment Receipt' : 'Reçu d’encaissement', prefix: formData.receiptPrefix || 'REC', sample: generateDocumentNumber(formData.receiptPrefix || 'REC', 158, sampleYear, padDigits, incYear) },
    { label: lang === 'en' ? 'Sales Order' : 'Bon de commande vente', prefix: formData.salePrefix || 'COM', sample: generateDocumentNumber(formData.salePrefix || 'COM', 7, sampleYear, padDigits, incYear) },
    { label: lang === 'en' ? 'Reservation' : 'Réservation', prefix: formData.reservationPrefix || 'RES', sample: generateDocumentNumber(formData.reservationPrefix || 'RES', 89, sampleYear, padDigits, incYear) },
    { label: lang === 'en' ? 'Maintenance Order' : 'Ordre de maintenance', prefix: formData.maintenancePrefix || 'MNT', sample: generateDocumentNumber(formData.maintenancePrefix || 'MNT', 12, sampleYear, padDigits, incYear) },
    { label: lang === 'en' ? 'Proforma Quote' : 'Devis proforma', prefix: formData.quotePrefix || 'DEV', sample: generateDocumentNumber(formData.quotePrefix || 'DEV', 3, sampleYear, padDigits, incYear) },
    { label: lang === 'en' ? 'Cash Expense Voucher' : 'Pièce de dépense caisse', prefix: formData.expensePrefix || 'DEP', sample: generateDocumentNumber(formData.expensePrefix || 'DEP', 205, sampleYear, padDigits, incYear) },
  ];

  // List of all 18 modules aligned strictly with AppModule type
  const allModules: { key: AppModule; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: t.modules.dashboard, desc: lang === 'en' ? 'Operations KPIs and overview' : 'KPIs d’exploitation et vue d’ensemble', icon: <Layers className="w-4 h-4 text-emerald-600" /> },
    { key: 'vehicles', label: t.modules.vehicles, desc: lang === 'en' ? 'Vehicle inventory, statuses and registration' : 'Inventaire des véhicules, statuts et immatriculations', icon: <Car className="w-4 h-4 text-blue-600" /> },
    { key: 'rentals', label: t.modules.rentals, desc: lang === 'en' ? 'Contracts, check-ins, check-outs and deposits' : 'Contrats, départs, retours et cautions', icon: <FileCheck className="w-4 h-4 text-emerald-600" /> },
    { key: 'sales', label: t.modules.sales, desc: lang === 'en' ? 'Sales pipeline, deposits and vehicle transfers' : 'Pipeline commercial, acomptes et cessions', icon: <Coins className="w-4 h-4 text-indigo-600" /> },
    { key: 'crm', label: t.modules.crm, desc: lang === 'en' ? 'Client profiles, leads and rental history' : 'Fiches clients, prospects et historique locatif', icon: <Building2 className="w-4 h-4 text-sky-600" /> },
    { key: 'reservations', label: t.modules.reservations, desc: lang === 'en' ? 'Schedules, deposits and preventive fleet hold' : 'Plannings, arrhes et blocage préventif', icon: <Clock className="w-4 h-4 text-teal-600" /> },
    { key: 'billing', label: t.modules.billing, desc: lang === 'en' ? 'Proforma invoices and compliant receipts' : 'Émission de factures proforma et reçus conformes', icon: <FileText className="w-4 h-4 text-violet-600" /> },
    { key: 'cash', label: t.modules.cash, desc: lang === 'en' ? 'Cash collections, expenses and daily closing' : 'Encaissements espèces, dépenses et clôtures', icon: <Coins className="w-4 h-4 text-emerald-600" /> },
    { key: 'maintenance', label: t.modules.maintenance, desc: lang === 'en' ? 'Work orders, oil changes and repairs' : 'Ordres d’intervention, vidanges et réparations', icon: <Wrench className="w-4 h-4 text-amber-600" /> },
    { key: 'stock', label: t.modules.stock, desc: lang === 'en' ? 'Spare parts management and restock alerts' : 'Gestion de pièces détachées et alertes réassort', icon: <Hash className="w-4 h-4 text-purple-600" /> },
    { key: 'drivers', label: t.modules.drivers, desc: lang === 'en' ? 'Licenses, schedules and chauffeur assignments' : 'Permis, plannings et missions de mise à disposition', icon: <Phone className="w-4 h-4 text-cyan-600" /> },
    { key: 'documents', label: t.modules.documents, desc: lang === 'en' ? 'PDF contracts, registration titles and Cloudinary' : 'Contrats PDF, cartes grises et Cloudinary', icon: <Camera className="w-4 h-4 text-slate-600" /> },
    { key: 'notifications', label: t.modules.notifications, desc: lang === 'en' ? 'Insurance expiry, inspections and rental delays' : 'Échéances assurances, visites et retards', icon: <AlertTriangle className="w-4 h-4 text-rose-600" /> },
    { key: 'reports', label: t.modules.reports, desc: lang === 'en' ? 'Profitability, fleet and cashflow analytics' : 'Analyses de rentabilité, flotte et trésorerie', icon: <Eye className="w-4 h-4 text-teal-600" /> },
    { key: 'users', label: t.modules.users, desc: lang === 'en' ? 'Role management, access and user accounts' : 'Gestion des rôles, accès et profils utilisateurs', icon: <Shield className="w-4 h-4 text-rose-600" /> },
    { key: 'settings', label: t.modules.settings, desc: lang === 'en' ? 'Central FCT agency configuration' : 'Configuration centrale de l’agence', icon: <Settings className="w-4 h-4 text-slate-700" /> },
    { key: 'audit', label: t.modules.audit, desc: lang === 'en' ? 'Operation traceability and synchronization' : 'Traçabilité des opérations et synchronisation', icon: <History className="w-4 h-4 text-slate-600" /> },
    { key: 'help', label: t.modules.help, desc: lang === 'en' ? 'User guide and standard operating procedures' : 'Guide d’utilisation et procédures opérationnelles', icon: <Info className="w-4 h-4 text-indigo-500" /> },
  ];

  // Settings audit logs filtered
  const settingsAuditLogs = useMemo(() => {
    return (state.auditLogs || []).filter(
      (log) => log.module === 'settings'
    );
  }, [state.auditLogs]);

  // Définition hiérarchique des 11 catégories FCT ordonnées du PLUS UTILISÉ au MOINS UTILISÉ
  interface SettingsCategoryItem {
    id: SettingsTab;
    rank: number;
    priorityLabel: string;
    label: string;
    shortLabel: string;
    desc: string;
    icon: React.ReactNode;
    colorBg: string;
    colorText: string;
    badgeValue: string;
    keywords: string[];
  }

  const categories: SettingsCategoryItem[] = [
    {
      id: 'general',
      rank: 1,
      priorityLabel: '01 • Priorité Exploitation',
      label: lang === 'en' ? 'General & Agency Identity' : 'Général & Identité de l’Agence',
      shortLabel: lang === 'en' ? 'Identity' : 'Identité',
      desc: lang === 'en'
        ? 'Official trade name, Bonamoussadi address, RCCM, Tax ID (NIU), phone numbers and official logo.'
        : 'Raison sociale, siège Bonamoussadi, RCCM, NIU fiscal, téléphones officiels et logo concessionnaire.',
      icon: <Building2 className="w-5 h-5" />,
      colorBg: 'bg-blue-50 border-blue-200 text-blue-700',
      colorText: 'text-blue-700',
      badgeValue: formData.tradeName || 'FCT Douala',
      keywords: ['identité', 'nom', 'adresse', 'bonamoussadi', 'rccm', 'niu', 'logo', 'téléphone', 'email', 'contact'],
    },
    {
      id: 'rentals',
      rank: 2,
      priorityLabel: '02 • Règles Locatives',
      label: lang === 'en' ? 'Rentals, Pricing & Deposits' : 'Locations, Tarification & Cautions',
      shortLabel: lang === 'en' ? 'Rentals' : 'Locations',
      desc: lang === 'en'
        ? 'Standard security deposits, minimum rental duration, hourly late penalty rate and return inspection.'
        : 'Caution standard (200 000 XAF), durées minimale/maximale, pénalité de retard et fiches contradictoires.',
      icon: <FileCheck className="w-5 h-5" />,
      colorBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      colorText: 'text-emerald-700',
      badgeValue: `${(formData.defaultDepositXAF || 200000).toLocaleString()} XAF`,
      keywords: ['caution', 'location', 'durée', 'pénalité', 'retard', 'contrat', 'inspection', 'tarif'],
    },
    {
      id: 'finance',
      rank: 3,
      priorityLabel: '03 • Caisse & Fiscalité',
      label: lang === 'en' ? 'Finance, Cash Desk & Tax' : 'Finances, Caisse & Fiscalité',
      shortLabel: lang === 'en' ? 'Finance' : 'Finances',
      desc: lang === 'en'
        ? 'Cameroon VAT rate (19.25%), authorized payment channels, expense thresholds and cash discrepancy tolerance.'
        : 'Taux TVA CEMAC 19.25%, tolérance écart de caisse (0 XAF), validation dépenses et modes de paiement.',
      icon: <Coins className="w-5 h-5" />,
      colorBg: 'bg-amber-50 border-amber-200 text-amber-700',
      colorText: 'text-amber-700',
      badgeValue: `TVA ${formData.taxRatePercent || 19.25}%`,
      keywords: ['tva', 'caisse', 'fiscalité', 'impôt', 'espèces', 'virement', 'orange money', 'mtn', 'dépense', 'écart'],
    },
    {
      id: 'fleet',
      rank: 4,
      priorityLabel: '04 • Contrôle Flotte',
      label: lang === 'en' ? 'Fleet Management & Alerts' : 'Parc Automobile & Alertes Sécurité',
      shortLabel: lang === 'en' ? 'Fleet' : 'Flotte',
      desc: lang === 'en'
        ? 'Preventive maintenance km anticipation, insurance & technical inspection alert lead-times and mandatory departure photos.'
        : 'Anticipation vidange (km), préavis assurances & visites techniques CEMAC et photos obligatoires.',
      icon: <Car className="w-5 h-5" />,
      colorBg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      colorText: 'text-cyan-700',
      badgeValue: `${formData.insuranceAlertDays || 30}j Préavis`,
      keywords: ['assurance', 'visite technique', 'alerte', 'photos', 'flotte', 'véhicule', 'anticipation', 'contrôle'],
    },
    {
      id: 'maintenance',
      rank: 5,
      priorityLabel: '05 • Atelier & Stocks',
      label: lang === 'en' ? 'Maintenance & Spare Parts' : 'Maintenance, Atelier & Stocks',
      shortLabel: lang === 'en' ? 'Maintenance' : 'Maintenance',
      desc: lang === 'en'
        ? 'Standard oil change interval (km), designated partner workshop and strict weighted average cost (PMP) stock deduction.'
        : 'Intervalle vidange périodique, garage partenaire CFAO et déstockage automatique des pièces.',
      icon: <Wrench className="w-5 h-5" />,
      colorBg: 'bg-orange-50 border-orange-200 text-orange-700',
      colorText: 'text-orange-700',
      badgeValue: `${(formData.defaultMaintenanceIntervalKm || 10000).toLocaleString()} km`,
      keywords: ['vidange', 'garage', 'atelier', 'pièces', 'stock', 'seuil', 'pmp', 'entretien', 'cfao'],
    },
    {
      id: 'appearance',
      rank: 6,
      priorityLabel: '06 • Confort Visuel',
      label: lang === 'en' ? 'Appearance & Preferences' : 'Apparence, Thème & Préférences',
      shortLabel: lang === 'en' ? 'Appearance' : 'Apparence',
      desc: lang === 'en'
        ? 'Theme color mode, French/English localization, data grid density and audible operation signals.'
        : 'Thème clair/sombre, bilinguisme FR/EN, compacité des tableaux et alertes sonores de guichet.',
      icon: <Palette className="w-5 h-5" />,
      colorBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      colorText: 'text-indigo-700',
      badgeValue: `${formData.theme === 'dark' ? 'Sombre' : 'Clair'} • ${(formData.defaultLanguage || 'FR').toUpperCase()}`,
      keywords: ['thème', 'sombre', 'clair', 'langue', 'anglais', 'français', 'densité', 'son', 'bip', 'affichage'],
    },
    {
      id: 'numbering',
      rank: 7,
      priorityLabel: '07 • Séquençage Pièces',
      label: lang === 'en' ? 'Numbering & Document Formats' : 'Numérotation des Documents Officiels',
      shortLabel: lang === 'en' ? 'Numbering' : 'Numérotation',
      desc: lang === 'en'
        ? 'Atomic document prefixes (CTR, FAC, REC, COM, DEV), zero-padding format and annual calendar inclusion.'
        : 'Préfixes officiels (CTR-, FAC-, REC-, DEV-), remplissage par zéros et millésime annuel anti-collision.',
      icon: <Hash className="w-5 h-5" />,
      colorBg: 'bg-violet-50 border-violet-200 text-violet-700',
      colorText: 'text-violet-700',
      badgeValue: `${formData.rentalPrefix || 'CTR'}- / ${formData.invoicePrefix || 'FAC'}-`,
      keywords: ['numérotation', 'prefixe', 'contrat', 'facture', 'reçu', 'devis', 'année', 'padding', 'séquence'],
    },
    {
      id: 'modules',
      rank: 8,
      priorityLabel: '08 • Modules FCT',
      label: lang === 'en' ? 'ERP Modules Controls' : 'Activation & Gestion des Modules',
      shortLabel: lang === 'en' ? 'Modules' : 'Modules',
      desc: lang === 'en'
        ? 'Toggle availability for the 18 operational modules across sidebar and navigation menus.'
        : 'Activation ou désactivation sélective des 18 modules opérationnels de la concession automobile.',
      icon: <Layers className="w-5 h-5" />,
      colorBg: 'bg-teal-50 border-teal-200 text-teal-700',
      colorText: 'text-teal-700',
      badgeValue: '18 Modules',
      keywords: ['modules', 'activation', 'désactivation', 'visibilité', 'menu', 'sidebar', 'fonctionnalités'],
    },
    {
      id: 'users',
      rank: 9,
      priorityLabel: '09 • Gouvernance RH',
      label: lang === 'en' ? 'Staff & RBAC Permissions' : 'Collaborateurs & Droits d’Accès (RBAC)',
      shortLabel: lang === 'en' ? 'Staff' : 'Équipe & Accès',
      desc: lang === 'en'
        ? 'Employee accounts directory, password generation, 4-digit security PIN and granular role matrix.'
        : 'Création d’employés, génération sécurisée de mots de passe, codes PIN et matrice des privilèges.',
      icon: <ShieldCheck className="w-5 h-5" />,
      colorBg: 'bg-rose-50 border-rose-200 text-rose-700',
      colorText: 'text-rose-700',
      badgeValue: `${state.users?.length || 0} Collaborateurs`,
      keywords: ['utilisateurs', 'collaborateurs', 'mot de passe', 'pin', 'rôles', 'rbac', 'droits', 'permissions', 'accès'],
    },
  ];

  // Filtrage dynamique du menu par recherche
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.label.toLowerCase().includes(query) ||
        cat.desc.toLowerCase().includes(query) ||
        cat.badgeValue.toLowerCase().includes(query) ||
        cat.keywords.some((k) => k.toLowerCase().includes(query))
    );
  }, [searchQuery, categories]);

  // Onglet sélectionné actif
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === activeTab) || null;
  }, [activeTab, categories]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Global avec Barre d'Action et Recherche */}
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
                  {activeTab === null
                    ? lang === 'fr'
                      ? 'Menu Central des Paramètres FCT — Sélectionnez une rubrique ci-dessous'
                      : 'Central FCT Settings Hub — Select a category below'
                    : `${currentCategory?.label || ''} — Douala, Cameroun`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Recherche Live */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'fr' ? 'Rechercher un réglage...' : 'Search settings...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* Boutons Annuler & Enregistrer persistants si modifications en attente */}
            {canEdit && (
              <>
                {isDirty && (
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm cursor-pointer"
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

        {/* Message d'alerte en cas de droits restreints */}
        {!canEdit && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {lang === 'fr'
                ? 'Mode consultation seule : Votre rôle actuel ne dispose pas des droits de modification sur les paramètres FCT.'
                : 'Read-only mode: Your current role does not have edit permissions on FCT Settings.'}
            </span>
          </div>
        )}

        {/* Messages de retour visuel */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{saveErrorMsg}</span>
          </div>
        )}

        {/* Motif d'audit quand modifications non sauvegardées */}
        {canEdit && isDirty && (
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fadeIn">
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

        {/* Navigation Drill-down : Si une catégorie est ouverte, barre de retour et raccourcis */}
        {activeTab !== null ? (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition cursor-pointer shadow-xs group"
                title="Retour au menu principal de tous les paramètres"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-700 transition group-hover:-translate-x-0.5" />
                <span>{lang === 'fr' ? '← Retour au Menu des Paramètres' : '← Back to Settings Menu'}</span>
              </button>

              <div className="text-xs text-slate-400 hidden md:flex items-center gap-1 font-semibold">
                <span className="hover:underline cursor-pointer" onClick={() => setActiveTab(null)}>Paramètres FCT</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-800 font-bold">{currentCategory?.label}</span>
              </div>
            </div>

            {/* Raccourcis rapides d'onglets compacts */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => {
                const isSelected = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Indicateur de synthèse du Hub */
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">
              {filteredCategories.length} catégorie(s) de configuration disponible(s) • Ordonnées par priorité d’usage
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
              Franchise Conseils Trading Automobile
            </span>
          </div>
        )}
      </div>

      {/* 2. VUE HUB MENU (Affichée quand aucun onglet n'est ouvert) */}
      {activeTab === null && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between space-y-4 text-xs"
              >
                <div className="space-y-3">
                  {/* Ligne haute : Icône colorée + Badge de priorité */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border font-bold ${cat.colorBg} shadow-xs group-hover:scale-105 transition-transform`}>
                      {cat.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {cat.priorityLabel}
                    </span>
                  </div>

                  {/* Titre & Description */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
                      <span>{cat.label}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                {/* Bas de carte : Valeur clé live + Bouton d'accès */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80 truncate max-w-[180px]">
                    {cat.badgeValue}
                  </div>
                  <div className="inline-flex items-center gap-1 font-black text-xs text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                    <span>Ouvrir</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Aucun résultat trouvé</h3>
              <p className="text-xs text-slate-500">
                Aucune catégorie de paramètres ne correspond à « {searchQuery} ».
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Effacer la recherche
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. CONTENUS DES SOUS-PAGES DÉTAILLÉES (Affichés uniquement quand une catégorie est sélectionnée) */}

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
                <div className="flex items-center gap-3">
                  <div className="h-12 w-28 bg-white border border-slate-200 rounded-xl p-1 shadow-xs flex items-center justify-center shrink-0">
                    <img
                      src={formData.logoUrl || '/fct-logo.png'}
                      alt="Logo FCT Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="/fct-logo.png ou URL Cloudinary"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                </div>
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
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Répercussion en temps réel
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* 1. Theme */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-bold">Thème Visuel</label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Actif : {(formData.theme || 'light').toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Clair', desc: 'Bureau standard', icon: Sun, color: 'text-amber-500' },
                  { value: 'dark', label: 'Sombre', desc: 'Contraste élevé', icon: Moon, color: 'text-indigo-400' },
                  { value: 'system', label: 'Système', desc: 'Automatique OS', icon: Monitor, color: 'text-slate-500' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = (formData.theme || 'light') === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleThemeChangeLive(item.value as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900">{item.label}</span>
                        <span className="text-[11px] text-slate-500">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Language */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-bold">Langue Principale de l’Application</label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Actif : {(formData.defaultLanguage || 'fr').toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { code: 'fr', label: 'Français (Cameroun)', badge: 'FR' },
                  { code: 'en', label: 'English (UK / US)', badge: 'EN' },
                ].map((item) => {
                  const isSelected = (formData.defaultLanguage || 'fr') === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleLanguageChangeLive(item.code as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {item.code === 'fr' ? 'Interface et devises en FCFA' : 'English interface with CFA Franc'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Display Density */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-bold">Densité d’Affichage des Tableaux & Cartes</label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Niveau : {(formData.density || 'comfortable').toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'compact', label: 'Compacte', desc: 'Densité maximale pour écrans de bureau' },
                  { value: 'comfortable', label: 'Confortable', desc: 'Densité équilibrée par défaut' },
                  { value: 'spacious', label: 'Spacieuse', desc: 'Espacement tactile et aéré' },
                ].map((item) => {
                  const isSelected = (formData.density || 'comfortable') === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleDensityChangeLive(item.value as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="block font-bold text-slate-900">{item.label}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mini-aperçu en direct de la densité */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Aperçu en temps réel selon la densité sélectionnée :
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Véhicule</th>
                        <th className="px-3 py-2">Immatriculation</th>
                        <th className="px-3 py-2">Tarif Journalier</th>
                        <th className="px-3 py-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Toyota Land Cruiser Prado TX</td>
                        <td className="px-3 py-2 font-mono text-[11px]">LT-4589-AB</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">85 000 XAF</td>
                        <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">Disponible</span></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Mitsubishi Pajero Sport 4x4</td>
                        <td className="px-3 py-2 font-mono text-[11px]">LT-1284-CD</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">75 000 XAF</td>
                        <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">En Location</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. Date & Time display */}
            <div className="space-y-3">
              <label className="block text-slate-700 font-bold">Format Date & Fuseau Horaire</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px] mb-1 font-semibold">Format de date</span>
                  <select
                    disabled={!canEdit}
                    value={formData.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none"
                  >
                    <option value="DD/MM/YYYY">JJ/MM/AAAA (ex: 13/10/2026)</option>
                    <option value="YYYY-MM-DD">AAAA-MM-JJ (ISO 8601)</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] mb-1 font-semibold">Fuseau Horaire</span>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Aperçu direct de date :</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {formData.dateFormat === 'YYYY-MM-DD'
                    ? new Date().toISOString().split('T')[0]
                    : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`
                  } • {formData.timezone || 'Africa/Douala'}
                </span>
              </div>
            </div>

            {/* 5. Sound alerts & Desktop notifications */}
            <div className="space-y-3">
              <label className="block text-slate-700 font-bold">Alertes Sonores & Notifications Système</label>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      Signaux Sonores FCT
                    </span>
                    <span className="text-slate-500 text-[10px] block">
                      Émettre un carillon doux lors d'encaissements ou alertes
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
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={playFctSoundChime}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>🔊 Écouter l’Alerte Sonore</span>
                  </button>

                  <button
                    type="button"
                    onClick={testBrowserNotification}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>🔔 Tester la Notification Bureau</span>
                  </button>
                </div>

                {notificationMsg && (
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-semibold animate-fadeIn">
                    {notificationMsg}
                  </div>
                )}
              </div>
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

      {/* TAB I: UTILISATEURS & DROITS RBAC */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-4 lg:p-6 overflow-hidden">
          <UsersView state={state} lang={lang} onNavigate={onNavigate} />
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
                aria-label="Fermer"
              >
                <X size={16} />
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

      {/* 4. Barre d'action inférieure de navigation & enregistrement quand une section est ouverte */}
      {activeTab !== null && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <button
            type="button"
            onClick={() => {
              setActiveTab(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer group shadow-xs w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 transition group-hover:-translate-x-0.5" />
            <span>{lang === 'fr' ? '← Retour au Menu des Paramètres' : '← Back to Settings Menu'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {canEdit && isDirty && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  isDirty
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Enregistrer les modifications' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
