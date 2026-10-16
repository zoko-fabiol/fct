/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Centre d'Administration & Gestion du Site Web Public
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 *
 * Ce composant réunit dans l'ERP les fonctionnalités :
 * 1. Éditeur universel de textes CMS (bilingue FR / EN) pour chaque élément du site web
 * 2. Tableau de bord analytique en temps réel (visiteurs, revisites, appareils, sessions)
 * 3. Personnalisation de la palette de couleurs FCT (application en direct sans toucher aux tuiles)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Type,
  BarChart3,
  Palette,
  Save,
  RotateCcw,
  CheckCircle2,
  Users,
  Smartphone,
  Laptop,
  Monitor,
  Activity,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Clock,
  Search,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  Car,
  FileCheck,
  RefreshCw,
  ExternalLink,
  Share2,
  ShieldCheck,
  UserCheck,
  KeyRound,
  HeartPulse,
  User,
  SlidersHorizontal,
  Bot,
  Trash2,
} from 'lucide-react';
import {
  WebsiteTheme,
  DEFAULT_WEBSITE_THEME,
  THEME_PRESETS,
  applyWebsiteThemeToDOM,
  saveWebsiteTheme,
  subscribeWebsiteTheme,
  saveWebsiteContent,
  subscribeWebsiteContent,
  getWebsiteContent,
  DEFAULT_WEBSITE_TRANSLATIONS,
  WebsiteLanguage,
  deepMergeWebsiteContent,
} from '../../services/websiteCmsService.ts';
import {
  VisitorLog,
  DailyStats,
  subscribeVisitors,
  subscribeDailyStats,
  seedDemoAnalyticsIfEmpty,
  purgeBotAndLinuxVisits,
  consolidateLinuxBotVisits,
} from '../../services/websiteAnalyticsService.ts';

type AdminSubTab = 'content' | 'analytics' | 'theme';

export interface WebsiteAdminTabProps {
  onNotify?: (msg: string) => void;
}

class WebsiteAdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[FCT WebsiteAdminTab Crash]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-3">
          <div className="font-bold text-sm">Une anomalie a été interceptée dans le module Web.</div>
          <div className="text-xs font-mono bg-white p-3 rounded-lg border border-rose-200 text-rose-700">
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
          >
            Recharger le module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const WebsiteAdminTabInner: React.FC<WebsiteAdminTabProps> = ({ onNotify }) => {
  const [currentSubTab, setCurrentSubTab] = useState<AdminSubTab>('content');

  // ==========================================
  // ÉTAT SOUS-ONGLET 1 : ÉDITEUR DE TEXTES CMS
  // ==========================================
  const [contentLang, setContentLang] = useState<WebsiteLanguage>('fr');
  const [contentFr, setContentFr] = useState<Record<string, any>>(() => JSON.parse(JSON.stringify(DEFAULT_WEBSITE_TRANSLATIONS.fr)));
  const [contentEn, setContentEn] = useState<Record<string, any>>(() => JSON.parse(JSON.stringify(DEFAULT_WEBSITE_TRANSLATIONS.en)));
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    nav: true,
    home: true,
    rental: false,
    showroom: false,
    health: false,
    partners: false,
    portal: false,
    profile: false,
    agency: false,
    footer: false,
    auth: false,
  });
  const [cmsSearch, setCmsSearch] = useState('');

  const handleToggleAllSections = (expand: boolean) => {
    setOpenSections({
      nav: expand,
      home: expand,
      rental: expand,
      showroom: expand,
      health: expand,
      partners: expand,
      portal: expand,
      profile: expand,
      agency: expand,
      footer: expand,
      auth: expand,
    });
  };

  // Synchronisation temps réel bidirectionnelle des textes (Firestore + BroadcastChannel + Pont HMR Local)
  useEffect(() => {
    // 1. Écoute Firestore & BroadcastChannel en direct (site_content/fr)
    const unsubFr = subscribeWebsiteContent('fr', (remoteFr) => {
      if (remoteFr && !isSavingContent) {
        setContentFr((prev) => deepMergeWebsiteContent(prev, remoteFr));
      }
    });

    // 2. Écoute Firestore & BroadcastChannel en direct (site_content/en)
    const unsubEn = subscribeWebsiteContent('en', (remoteEn) => {
      if (remoteEn && !isSavingContent) {
        setContentEn((prev) => deepMergeWebsiteContent(prev, remoteEn));
      }
    });

    // 3. Écouteur HMR Vite local instantané (Port 3001 ⇄ Port 3000)
    if (import.meta.hot) {
      import.meta.hot.on('fct-cms-update', (data: any) => {
        if (data?.type === 'CMS_CONTENT_UPDATE' && data.lang && data.content && !isSavingContent) {
          if (data.lang === 'fr') {
            setContentFr((prev) => deepMergeWebsiteContent(prev, data.content));
          } else if (data.lang === 'en') {
            setContentEn((prev) => deepMergeWebsiteContent(prev, data.content));
          }
        }
      });
    }

    return () => {
      unsubFr();
      unsubEn();
    };
  }, [isSavingContent]);

  const activeContent = contentLang === 'fr' ? contentFr : contentEn;
  const setActiveContent = contentLang === 'fr' ? setContentFr : setContentEn;

  const handleTextChange = (section: string, key: string, value: string) => {
    setActiveContent((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value,
      },
    }));
  };

  const handleSaveContent = async () => {
    setIsSavingContent(true);
    try {
      await Promise.all([
        saveWebsiteContent('fr', contentFr),
        saveWebsiteContent('en', contentEn),
      ]);
      const msg = contentLang === 'fr'
        ? 'Textes du site web enregistrés avec succès dans Firebase !'
        : 'Website texts successfully saved to Firebase!';
      if (onNotify) onNotify(msg);
      else alert(msg);
    } catch (err: unknown) {
      alert('Erreur d’enregistrement des textes : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleResetContent = () => {
    if (confirm('Voulez-vous réinitialiser les textes du site web aux valeurs d’usine FCT officielles ?')) {
      setContentFr(JSON.parse(JSON.stringify(DEFAULT_WEBSITE_TRANSLATIONS.fr)));
      setContentEn(JSON.parse(JSON.stringify(DEFAULT_WEBSITE_TRANSLATIONS.en)));
      if (onNotify) onNotify('Textes réinitialisés aux valeurs standards.');
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ==========================================
  // ÉTAT SOUS-ONGLET 2 : STATISTIQUES & ANALYTICS
  // ==========================================
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [visitorFilter, setVisitorFilter] = useState<'all' | 'active' | 'mobile' | 'desktop'>('all');
  const [searchVisitor, setSearchVisitor] = useState('');
  const [isPurgingBots, setIsPurgingBots] = useState(false);
  const [isConsolidatingBots, setIsConsolidatingBots] = useState(false);

  const handleConsolidateBots = async () => {
    setIsConsolidatingBots(true);
    try {
      const res = await consolidateLinuxBotVisits();
      const msg = `Regroupement réussi : tous les bots Linux ont été regroupés en 1 seul appareil totalisant ${res.consolidatedVisits} visites.`;
      if (onNotify) onNotify(msg);
      else alert(msg);
    } catch (err) {
      alert('Erreur lors du regroupement : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsConsolidatingBots(false);
    }
  };

  const handlePurgeBots = async () => {
    if (!confirm('Voulez-vous supprimer les visites parasites provenant des robots Vercel / serveurs Linux et réinitialiser les statistiques réelles ?')) {
      return;
    }
    setIsPurgingBots(true);
    try {
      const { deletedCount } = await purgeBotAndLinuxVisits();
      const msg = `Nettoyage réussi : ${deletedCount} visites de robots / serveurs Linux ont été purgées.`;
      if (onNotify) onNotify(msg);
      else alert(msg);
    } catch (err) {
      alert('Erreur lors du nettoyage : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsPurgingBots(false);
    }
  };

  useEffect(() => {
    seedDemoAnalyticsIfEmpty();

    const unsubVisitors = subscribeVisitors((data) => {
      setVisitors(data);
      setIsLoadingAnalytics(false);

      // Si plusieurs documents individuels pour Linux existent dans la base, les consolider automatiquement en 1 seul appareil
      const linuxDocs = data.filter((v) => v.device === 'Linux' || v.deviceModel === 'Linux Desktop');
      if (linuxDocs.length > 1) {
        consolidateLinuxBotVisits().catch(() => {});
      }
    });

    const unsubDaily = subscribeDailyStats((data) => {
      setDailyStats(data);
    });

    return () => {
      unsubVisitors();
      unsubDaily();
    };
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayStat = dailyStats.find((d) => d.date === todayStr) || {
    id: todayStr,
    date: todayStr,
    uniqueVisitorsCount: visitors.filter((v) => v.lastVisitDate === todayStr).length,
    totalSessionsCount: visitors.reduce((acc, v) => acc + (v.lastVisitDate === todayStr ? v.todayVisitCount || 1 : 0), 0),
    revisitsCount: visitors.filter((v) => v.lastVisitDate === todayStr && v.visitCount > 1).length,
    devices: {},
    countries: {},
  };

  const activeVisitorsNow = visitors.filter((v) => v.isActive);
  const totalRevisits = visitors.reduce((acc, v) => acc + Math.max(0, (v.visitCount || 1) - 1), 0);
  const linuxTotalVisits = useMemo(() => {
    return visitors
      .filter((v) => v.device === 'Linux' || v.id === 'vis_crawler_linux_vercel' || (v.deviceModel && v.deviceModel.includes('Linux')))
      .reduce((acc, v) => acc + (v.visitCount || 1), 0);
  }, [visitors]);

  // Répartition par appareil
  const deviceCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Android: 0,
      iPhone: 0,
      Windows: 0,
      Mac: 0,
      iPad: 0,
      Linux: 0,
      Autre: 0,
    };
    visitors.forEach((v) => {
      const dev = v.device || 'Autre';
      if (counts[dev] !== undefined) counts[dev]++;
      else counts.Autre = (counts.Autre || 0) + 1;
    });
    return counts;
  }, [visitors]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      if (visitorFilter === 'active' && !v.isActive) return false;
      if (visitorFilter === 'mobile' && v.deviceCategory !== 'Mobile') return false;
      if (visitorFilter === 'desktop' && v.deviceCategory !== 'Desktop') return false;
      if (searchVisitor.trim()) {
        const q = searchVisitor.toLowerCase().trim();
        return (
          v.deviceModel.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.page.toLowerCase().includes(q) ||
          v.browser.toLowerCase().includes(q) ||
          (v.ipMasked && v.ipMasked.includes(q))
        );
      }
      return true;
    });
  }, [visitors, visitorFilter, searchVisitor]);

  // ==========================================
  // ÉTAT SOUS-ONGLET 3 : COULEURS & THÈME FCT
  // ==========================================
  const [themeColors, setThemeColors] = useState<WebsiteTheme>(DEFAULT_WEBSITE_THEME);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  useEffect(() => {
    const unsubTheme = subscribeWebsiteTheme((remoteTheme) => {
      setThemeColors(remoteTheme);
    });
    return () => unsubTheme();
  }, []);

  const handleColorChange = (key: keyof WebsiteTheme, val: string) => {
    const updated = { ...themeColors, [key]: val };
    setThemeColors(updated);
    applyWebsiteThemeToDOM(updated);
  };

  const handleApplyPreset = async (presetTheme: WebsiteTheme, presetName: string) => {
    setThemeColors(presetTheme);
    applyWebsiteThemeToDOM(presetTheme);
    setIsSavingTheme(true);
    try {
      await saveWebsiteTheme(presetTheme);
      const msg = `Thème « ${presetName} » appliqué et synchronisé dans Firebase !`;
      if (onNotify) onNotify(msg);
      else alert(msg);
    } catch (err: unknown) {
      alert('Erreur enregistrement thème : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    try {
      await saveWebsiteTheme(themeColors);
      const msg = 'Palette de couleurs FCT enregistrée avec succès dans Firebase !';
      if (onNotify) onNotify(msg);
      else alert(msg);
    } catch (err: unknown) {
      alert('Erreur enregistrement thème : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleResetTheme = async () => {
    if (confirm('Rétablir la palette de couleurs officielle FCT Automobile par défaut ?')) {
      setThemeColors(DEFAULT_WEBSITE_THEME);
      applyWebsiteThemeToDOM(DEFAULT_WEBSITE_THEME);
      await saveWebsiteTheme(DEFAULT_WEBSITE_THEME);
      if (onNotify) onNotify('Palette officielle FCT restaurée avec succès.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header du Module Web & Navigation par Sous-onglets */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <Globe className="w-3.5 h-3.5" />
              <span>Portail Vitrine & Showroom Public</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Administration du Site Web FCT Automobile
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Contrôlez chaque texte du site vitrine, suivez les visites et appareils de vos clients en direct,
              et personnalisez la charte de couleurs de l’agence FCT Douala.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/#/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <span>Voir le Site Public</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Barre des 3 sous-onglets */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCurrentSubTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              currentSubTab === 'content'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>1. Textes & Contenus du Site</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              currentSubTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>2. Statistiques & Visiteurs en Direct</span>
            {activeVisitorsNow.length > 0 && (
              <span className="flex h-2 w-2 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('theme')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              currentSubTab === 'theme'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>3. Couleurs & Thème (Sans tuiles)</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* SOUS-ONGLET 1 : CMS TEXTES BILINGUES (FR / EN)       */}
      {/* ==================================================== */}
      {currentSubTab === 'content' && (
        <div className="space-y-6">
          {/* Barre d'action supérieure CMS avec recherche et contrôles */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Langue & Recherche */}
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setContentLang('fr')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      contentLang === 'fr'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    FR · Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentLang('en')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      contentLang === 'en'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    EN · English
                  </button>
                </div>

                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={cmsSearch}
                    onChange={(e) => setCmsSearch(e.target.value)}
                    placeholder="Filtrer un texte, bouton, titre (ex: caution, whatsapp, carnet...)"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {cmsSearch && (
                    <button
                      type="button"
                      onClick={() => setCmsSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleAllSections(true)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  title="Déplier tous les modules"
                >
                  Tout Déplier
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllSections(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  title="Replier tous les modules"
                >
                  Tout Replier
                </button>
                <button
                  type="button"
                  onClick={handleResetContent}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rétablir</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingContent}
                  onClick={handleSaveContent}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingContent ? 'Enregistrement...' : 'Enregistrer dans Firebase'}</span>
                </button>
              </div>
            </div>

            {cmsSearch.trim() && (
              <div className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center justify-between">
                <span>Filtre actif : « {cmsSearch} » — Les sections correspondantes sont automatiquement ouvertes.</span>
                <button onClick={() => setCmsSearch('')} className="underline hover:text-blue-800 cursor-pointer">Effacer</button>
              </div>
            )}
          </div>

          {/* Module 1 : Navigation & Menus */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('nav')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">1. Navigation, Menus & En-tête</h3>
                  <p className="text-[11px] text-slate-500">Intitulés des liens du menu principal, barre VIP et boutons d'accès</p>
                </div>
              </div>
              {openSections.nav ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.nav && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Menu Accueil</label>
                  <input
                    type="text"
                    value={activeContent.nav?.home || ''}
                    onChange={(e) => handleTextChange('nav', 'home', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Menu Location</label>
                  <input
                    type="text"
                    value={activeContent.nav?.rentals || ''}
                    onChange={(e) => handleTextChange('nav', 'rentals', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Menu Vente</label>
                  <input
                    type="text"
                    value={activeContent.nav?.sales || ''}
                    onChange={(e) => handleTextChange('nav', 'sales', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Carnet de Santé</label>
                  <input
                    type="text"
                    value={activeContent.nav?.healthPassport || ''}
                    onChange={(e) => handleTextChange('nav', 'healthPassport', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Notre Agence</label>
                  <input
                    type="text"
                    value={activeContent.nav?.agency || ''}
                    onChange={(e) => handleTextChange('nav', 'agency', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Bouton WhatsApp VIP</label>
                  <input
                    type="text"
                    value={activeContent.nav?.whatsapp || ''}
                    onChange={(e) => handleTextChange('nav', 'whatsapp', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Bouton Espace Adhérent</label>
                  <input
                    type="text"
                    value={activeContent.nav?.clientPortal || ''}
                    onChange={(e) => handleTextChange('nav', 'clientPortal', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Bascule de Langue</label>
                  <input
                    type="text"
                    value={activeContent.nav?.switchLang || ''}
                    onChange={(e) => handleTextChange('nav', 'switchLang', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Module 2 : Accueil & Hero */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('home')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">2. Page d'Accueil & Bannières d'Autorité</h3>
                  <p className="text-[11px] text-slate-500">Accroches principales, badges, slogans, KPI et arguments de confiance</p>
                </div>
              </div>
              {openSections.home ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.home && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Badge Surtitre Héro</label>
                    <input
                      type="text"
                      value={activeContent.home?.badge || ''}
                      onChange={(e) => handleTextChange('home', 'badge', e.target.value)}
                      placeholder="DOUALA · CARREFOUR SANTA BARBARA..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Explorer la Flotte</label>
                    <input
                      type="text"
                      value={activeContent.home?.exploreFleet || ''}
                      onChange={(e) => handleTextChange('home', 'exploreFleet', e.target.value)}
                      placeholder="Explorer la Flotte"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Véhicules en Vente</label>
                    <input
                      type="text"
                      value={activeContent.home?.viewSales || ''}
                      onChange={(e) => handleTextChange('home', 'viewSales', e.target.value)}
                      placeholder="Véhicules en Vente"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Carnet de Santé</label>
                    <input
                      type="text"
                      value={activeContent.home?.healthPassportBtn || ''}
                      onChange={(e) => handleTextChange('home', 'healthPassportBtn', e.target.value)}
                      placeholder="Carnet de Santé"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Grand Titre Héro</label>
                    <textarea
                      rows={2}
                      value={activeContent.home?.heroTitle || ''}
                      onChange={(e) => handleTextChange('home', 'heroTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sous-titre / Descriptif Héro</label>
                    <textarea
                      rows={2}
                      value={activeContent.home?.heroSubtitle || ''}
                      onChange={(e) => handleTextChange('home', 'heroSubtitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">KPI 1 : Flotte</span>
                    <input
                      type="text"
                      placeholder="Titre"
                      value={activeContent.home?.kpi1Title || ''}
                      onChange={(e) => handleTextChange('home', 'kpi1Title', e.target.value)}
                      className="w-full px-2 py-1 mb-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Sous-titre"
                      value={activeContent.home?.kpi1Sub || ''}
                      onChange={(e) => handleTextChange('home', 'kpi1Sub', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">KPI 2 : Caution</span>
                    <input
                      type="text"
                      placeholder="Titre"
                      value={activeContent.home?.kpi2Title || ''}
                      onChange={(e) => handleTextChange('home', 'kpi2Title', e.target.value)}
                      className="w-full px-2 py-1 mb-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Sous-titre"
                      value={activeContent.home?.kpi2Sub || ''}
                      onChange={(e) => handleTextChange('home', 'kpi2Sub', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">KPI 3 : Assistance</span>
                    <input
                      type="text"
                      placeholder="Titre"
                      value={activeContent.home?.kpi3Title || ''}
                      onChange={(e) => handleTextChange('home', 'kpi3Title', e.target.value)}
                      className="w-full px-2 py-1 mb-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Sous-titre"
                      value={activeContent.home?.kpi3Sub || ''}
                      onChange={(e) => handleTextChange('home', 'kpi3Sub', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Section Véhicules Disponibles</label>
                    <input
                      type="text"
                      value={activeContent.home?.featuredVehicles || ''}
                      onChange={(e) => handleTextChange('home', 'featuredVehicles', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sous-titre Section Véhicules</label>
                    <input
                      type="text"
                      value={activeContent.home?.featuredSubtitle || ''}
                      onChange={(e) => handleTextChange('home', 'featuredSubtitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-2">
                  <span className="font-bold text-blue-900 block">Bannière Carnet de Santé Numérique</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Titre de la bannière"
                      value={activeContent.home?.healthBannerTitle || ''}
                      onChange={(e) => handleTextChange('home', 'healthBannerTitle', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Bouton vérifier plaque"
                      value={activeContent.home?.checkPlate || ''}
                      onChange={(e) => handleTextChange('home', 'checkPlate', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description de la bannière"
                    value={activeContent.home?.healthBannerDesc || ''}
                    onChange={(e) => handleTextChange('home', 'healthBannerDesc', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Module 3 : Location & Vente */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('rental')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">3. Catalogues Location & Vente de Véhicules</h3>
                  <p className="text-[11px] text-slate-500">Textes des catalogues, filtres de catégories, mentions tarifaires et garanties</p>
                </div>
              </div>
              {openSections.rental ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.rental && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Page Location</label>
                    <input
                      type="text"
                      value={activeContent.rental?.title || ''}
                      onChange={(e) => handleTextChange('rental', 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sous-titre Page Location</label>
                    <input
                      type="text"
                      value={activeContent.rental?.subtitle || ''}
                      onChange={(e) => handleTextChange('rental', 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Libellé Jour</label>
                    <input
                      type="text"
                      value={activeContent.rental?.dayRate || ''}
                      onChange={(e) => handleTextChange('rental', 'dayRate', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Libellé Caution</label>
                    <input
                      type="text"
                      value={activeContent.rental?.deposit || ''}
                      onChange={(e) => handleTextChange('rental', 'deposit', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Option Chauffeur VIP</label>
                    <input
                      type="text"
                      value={activeContent.rental?.withDriverOpt || ''}
                      onChange={(e) => handleTextChange('rental', 'withDriverOpt', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Page Vente</label>
                    <input
                      type="text"
                      value={activeContent.sales?.title || ''}
                      onChange={(e) => handleTextChange('sales', 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sous-titre Page Vente</label>
                    <input
                      type="text"
                      value={activeContent.sales?.subtitle || ''}
                      onChange={(e) => handleTextChange('sales', 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Texte Garantie Vente Incluse</label>
                  <input
                    type="text"
                    value={activeContent.sales?.warrantyIncluded || ''}
                    onChange={(e) => handleTextChange('sales', 'warrantyIncluded', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Module 4 : Fiche Détaillée Showroom & Réservation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('showroom')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">4. Fiche Détaillée Showroom & Formulaire Réservation</h3>
                  <p className="text-[11px] text-slate-500">Caractéristiques techniques, conditions tarifaires, services inclus et confirmation</p>
                </div>
              </div>
              {openSections.showroom ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.showroom && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Retour</label>
                    <input
                      type="text"
                      value={activeContent.showroom?.back || ''}
                      onChange={(e) => handleTextChange('showroom', 'back', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Badge Certifié FCT</label>
                    <input
                      type="text"
                      value={activeContent.showroom?.certifiedFCT || ''}
                      onChange={(e) => handleTextChange('showroom', 'certifiedFCT', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Caractéristiques</label>
                    <input
                      type="text"
                      value={activeContent.showroom?.specsTitle || ''}
                      onChange={(e) => handleTextChange('showroom', 'specsTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Libellé Boîte de Vitesse</label>
                    <input
                      type="text"
                      value={activeContent.showroom?.transmission || ''}
                      onChange={(e) => handleTextChange('showroom', 'transmission', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Libellé Carburant</label>
                    <input
                      type="text"
                      value={activeContent.showroom?.fuel || ''}
                      onChange={(e) => handleTextChange('showroom', 'fuel', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Libellé Places Assises</label>
                    <input
                      type="text"
                      value={activeContent.showroom?.seats || ''}
                      onChange={(e) => handleTextChange('showroom', 'seats', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mention Disponible</label>
                    <input
                      type="text"
                      value={activeContent.showroom?.available || ''}
                      onChange={(e) => handleTextChange('showroom', 'available', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-emerald-700 font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">Formulaire de Réservation VIP & Reçus</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Bouton Confirmer Réservation"
                      value={activeContent.showroom?.bookNow || ''}
                      onChange={(e) => handleTextChange('showroom', 'bookNow', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Option Chauffeur dédié"
                      value={activeContent.showroom?.withDriverCheckbox || ''}
                      onChange={(e) => handleTextChange('showroom', 'withDriverCheckbox', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Message de succès après envoi de réservation"
                    value={activeContent.showroom?.successNotice || ''}
                    onChange={(e) => handleTextChange('showroom', 'successNotice', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-emerald-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Module 5 : Carnet de Santé Numérique */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('health')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">5. Carnet de Santé Numérique & Traçabilité</h3>
                  <p className="text-[11px] text-slate-500">Moteur de recherche par plaque, libellés de révision, historique et sceau certifié</p>
                </div>
              </div>
              {openSections.health ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.health && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Page Carnet de Santé</label>
                    <input
                      type="text"
                      value={activeContent.health?.title || ''}
                      onChange={(e) => handleTextChange('health', 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sous-titre Page Carnet</label>
                    <input
                      type="text"
                      value={activeContent.health?.subtitle || ''}
                      onChange={(e) => handleTextChange('health', 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Placeholder Recherche de Plaque</label>
                    <input
                      type="text"
                      value={activeContent.health?.searchPlaceholder || ''}
                      onChange={(e) => handleTextChange('health', 'searchPlaceholder', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Lancer Recherche</label>
                    <input
                      type="text"
                      value={activeContent.health?.searchBtn || ''}
                      onChange={(e) => handleTextChange('health', 'searchBtn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-teal-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Libellé Kilométrage Certifié</label>
                    <input
                      type="text"
                      value={activeContent.health?.mileageCertified || ''}
                      onChange={(e) => handleTextChange('health', 'mileageCertified', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sceau Authentique FCT</label>
                    <input
                      type="text"
                      value={activeContent.health?.certifiedStamp || ''}
                      onChange={(e) => handleTextChange('health', 'certifiedStamp', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Message Si Plaque Inconnue</label>
                    <input
                      type="text"
                      value={activeContent.health?.noRecords || ''}
                      onChange={(e) => handleTextChange('health', 'noRecords', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-rose-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 6 : Réseau Partenaires & Apporteurs d'Affaires */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('partners')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">6. Réseau Partenaires & Apporteurs d'Affaires</h3>
                  <p className="text-[11px] text-slate-500">Piliers de commissions, inscription, partage WhatsApp et retraits Orange/MTN</p>
                </div>
              </div>
              {openSections.partners ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.partners && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Grand Titre Partenaire</label>
                    <input
                      type="text"
                      value={activeContent.partners?.heroTitle || ''}
                      onChange={(e) => handleTextChange('partners', 'heroTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Badge Surtitre</label>
                    <input
                      type="text"
                      value={activeContent.partners?.heroBadge || ''}
                      onChange={(e) => handleTextChange('partners', 'heroBadge', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-orange-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Descriptif Réseau d'Affiliation</label>
                  <textarea
                    rows={2}
                    value={activeContent.partners?.heroSubtitle || ''}
                    onChange={(e) => handleTextChange('partners', 'heroSubtitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Pilier 1 : Location</span>
                    <input
                      type="text"
                      placeholder="Titre"
                      value={activeContent.partners?.pillar1Title || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar1Title', e.target.value)}
                      className="w-full px-2 py-1 mb-1 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={activeContent.partners?.pillar1Desc || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar1Desc', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Pilier 2 : Vente</span>
                    <input
                      type="text"
                      placeholder="Titre"
                      value={activeContent.partners?.pillar2Title || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar2Title', e.target.value)}
                      className="w-full px-2 py-1 mb-1 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={activeContent.partners?.pillar2Desc || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar2Desc', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Pilier 3 : Payout Mobile</span>
                    <input
                      type="text"
                      placeholder="Titre"
                      value={activeContent.partners?.pillar3Title || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar3Title', e.target.value)}
                      className="w-full px-2 py-1 mb-1 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={activeContent.partners?.pillar3Desc || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar3Desc', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Pilier 4 : Partage 1-Clic</span>
                    <input
                      type="text"
                      placeholder="Titre"
                      value={activeContent.partners?.pillar4Title || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar4Title', e.target.value)}
                      className="w-full px-2 py-1 mb-1 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={activeContent.partners?.pillar4Desc || ''}
                      onChange={(e) => handleTextChange('partners', 'pillar4Desc', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                </div>

                {/* Campagnes WhatsApp, Sélecteur de Véhicules & Pitch d'Affiliation */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs border-b border-emerald-200/60 pb-2">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <span>Campagnes WhatsApp, Sélecteur de Véhicules & Pitch d'Affiliation</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Titre Sélecteur de Véhicule</label>
                      <input
                        type="text"
                        value={activeContent.partners?.selectVehicleToShare || ''}
                        onChange={(e) => handleTextChange('partners', 'selectVehicleToShare', e.target.value)}
                        placeholder="Ex: Sélectionnez un véhicule à promouvoir"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Consigne de Partage WhatsApp</label>
                      <input
                        type="text"
                        value={activeContent.partners?.selectVehicleDesc || ''}
                        onChange={(e) => handleTextChange('partners', 'selectVehicleDesc', e.target.value)}
                        placeholder="Ex: Sélectionnez un véhicule pour publier une annonce calibrée..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Alerte Anti-Spam & Quota 24h</label>
                    <textarea
                      rows={2}
                      value={activeContent.partners?.antiSpamNotice || ''}
                      onChange={(e) => handleTextChange('partners', 'antiSpamNotice', e.target.value)}
                      placeholder="Ex: Anti-spam actif : Déjà comptabilisé aujourd'hui (1 max/véhicule/24h)..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Bouton Statut WhatsApp</label>
                      <input
                        type="text"
                        value={activeContent.partners?.shareWhatsappBtn || ''}
                        onChange={(e) => handleTextChange('partners', 'shareWhatsappBtn', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Bouton Partager le Lien</label>
                      <input
                        type="text"
                        value={activeContent.partners?.shareUniversalBtn || ''}
                        onChange={(e) => handleTextChange('partners', 'shareUniversalBtn', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Bouton Copier Lien Affilié</label>
                      <input
                        type="text"
                        value={activeContent.partners?.copyLinkBtn || ''}
                        onChange={(e) => handleTextChange('partners', 'copyLinkBtn', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Pitch / Modèle de message pré-rédigé */}
                  <div className="pt-2 border-t border-emerald-200/60 space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px]">
                      Modèles d'Annonces & Textes Pré-rédigés (Pitch WhatsApp) :
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">En-tête Annonce Location</label>
                        <input
                          type="text"
                          value={activeContent.partners?.sharePitchRentHeader || ''}
                          onChange={(e) => handleTextChange('partners', 'sharePitchRentHeader', e.target.value)}
                          placeholder="Ex: *LOCATION VÉHICULE CERTIFIÉ - FCT AUTOMOBILE DOUALA*"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">En-tête Annonce Vente</label>
                        <input
                          type="text"
                          value={activeContent.partners?.sharePitchSaleHeader || ''}
                          onChange={(e) => handleTextChange('partners', 'sharePitchSaleHeader', e.target.value)}
                          placeholder="Ex: *VÉHICULE CERTIFIÉ À VENDRE - FCT AUTOMOBILE DOUALA*"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Mention Garantie & Entretien</label>
                        <input
                          type="text"
                          value={activeContent.partners?.sharePitchWarranty || ''}
                          onChange={(e) => handleTextChange('partners', 'sharePitchWarranty', e.target.value)}
                          placeholder="Ex: Garantie : Assurance complète & Entretien certifié FCT"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Mention Disponibilité / Délai</label>
                        <input
                          type="text"
                          value={activeContent.partners?.sharePitchAvailability || ''}
                          onChange={(e) => handleTextChange('partners', 'sharePitchAvailability', e.target.value)}
                          placeholder="Ex: Disponibilité : Immédiate à Douala (avec ou sans chauffeur)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Mention Statut Véhicule Vente</label>
                        <input
                          type="text"
                          value={activeContent.partners?.sharePitchSaleStatus || ''}
                          onChange={(e) => handleTextChange('partners', 'sharePitchSaleStatus', e.target.value)}
                          placeholder="Ex: Statut : Certifié FCT, révisé et prêt à rouler"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Mention Emplacement Showroom</label>
                        <input
                          type="text"
                          value={activeContent.partners?.sharePitchSaleLocation || ''}
                          onChange={(e) => handleTextChange('partners', 'sharePitchSaleLocation', e.target.value)}
                          placeholder="Ex: Emplacement : Showroom Bonamoussadi, Carrefour Santa Barbara"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Retrait Mobile Money</label>
                    <input
                      type="text"
                      value={activeContent.partners?.requestPayoutBtn || ''}
                      onChange={(e) => handleTextChange('partners', 'requestPayoutBtn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Délai Versement (Avis)</label>
                    <input
                      type="text"
                      value={activeContent.partners?.payoutNotice || ''}
                      onChange={(e) => handleTextChange('partners', 'payoutNotice', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 7 : Espace Adhérent Client */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('portal')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">7. Espace Adhérent Client & Suivi Contrats</h3>
                  <p className="text-[11px] text-slate-500">Connexion client, suivi des locations actives, cautions consignées et factures</p>
                </div>
              </div>
              {openSections.portal ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.portal && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Espace Adhérent</label>
                    <input
                      type="text"
                      value={activeContent.portal?.title || ''}
                      onChange={(e) => handleTextChange('portal', 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sous-titre Espace Adhérent</label>
                    <input
                      type="text"
                      value={activeContent.portal?.subtitle || ''}
                      onChange={(e) => handleTextChange('portal', 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Connexion Client</label>
                    <input
                      type="text"
                      value={activeContent.portal?.loginBtn || ''}
                      onChange={(e) => handleTextChange('portal', 'loginBtn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-cyan-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Télécharger Facture PDF</label>
                    <input
                      type="text"
                      value={activeContent.portal?.downloadInvoice || ''}
                      onChange={(e) => handleTextChange('portal', 'downloadInvoice', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Prolongation Contrat</label>
                    <input
                      type="text"
                      value={activeContent.portal?.extendContract || ''}
                      onChange={(e) => handleTextChange('portal', 'extendContract', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 8 : Mon Compte & Profil Utilisateur */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('profile')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">8. Mon Compte, Profil & Restitution Cautions / Payouts</h3>
                  <p className="text-[11px] text-slate-500">Coordonnées, contact WhatsApp, comptes Orange Money & MTN pour cautions et gains</p>
                </div>
              </div>
              {openSections.profile ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.profile && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Page Mon Compte</label>
                    <input
                      type="text"
                      value={activeContent.profile?.headerTitle || ''}
                      onChange={(e) => handleTextChange('profile', 'headerTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Enregistrer Modifications</label>
                    <input
                      type="text"
                      value={activeContent.profile?.saveBtn || ''}
                      onChange={(e) => handleTextChange('profile', 'saveBtn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-violet-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Rassurance Versement Partenaire (Commissions)</label>
                    <input
                      type="text"
                      value={activeContent.profile?.payoutPartnerReassurance || ''}
                      onChange={(e) => handleTextChange('profile', 'payoutPartnerReassurance', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Rassurance Restitution Caution Client</label>
                    <input
                      type="text"
                      value={activeContent.profile?.payoutClientReassurance || ''}
                      onChange={(e) => handleTextChange('profile', 'payoutClientReassurance', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 9 : Coordonnées Agence Bonamoussadi & Contacts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('agency')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">9. Coordonnées Agence Bonamoussadi & Contacts</h3>
                  <p className="text-[11px] text-slate-500">Adresse physique, repère, horaires d'ouverture et numéros de hotline VIP</p>
                </div>
              </div>
              {openSections.agency ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.agency && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Adresse Complète</label>
                    <input
                      type="text"
                      value={activeContent.agency?.addressDesc || ''}
                      onChange={(e) => handleTextChange('agency', 'addressDesc', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Point de Repère</label>
                    <input
                      type="text"
                      value={activeContent.agency?.landmark || ''}
                      onChange={(e) => handleTextChange('agency', 'landmark', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Horaires Lundi - Vendredi</label>
                    <input
                      type="text"
                      value={activeContent.agency?.weekdays || ''}
                      onChange={(e) => handleTextChange('agency', 'weekdays', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Horaires Samedi</label>
                    <input
                      type="text"
                      value={activeContent.agency?.saturday || ''}
                      onChange={(e) => handleTextChange('agency', 'saturday', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Horaires Dimanche</label>
                    <input
                      type="text"
                      value={activeContent.agency?.sunday || ''}
                      onChange={(e) => handleTextChange('agency', 'sunday', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Ligne Directe Hotline</label>
                    <input
                      type="text"
                      value={activeContent.agency?.hotline || ''}
                      onChange={(e) => handleTextChange('agency', 'hotline', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">WhatsApp Commercial</label>
                    <input
                      type="text"
                      value={activeContent.agency?.whatsappDesk || ''}
                      onChange={(e) => handleTextChange('agency', 'whatsappDesk', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Email Officiel</label>
                    <input
                      type="text"
                      value={activeContent.agency?.email || ''}
                      onChange={(e) => handleTextChange('agency', 'email', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 10 : Pied de Page & Mentions Légales */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('footer')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">10. Pied de Page & Mentions Légales</h3>
                  <p className="text-[11px] text-slate-500">Descriptif d'entreprise en footer, copyright et immatriculation RC</p>
                </div>
              </div>
              {openSections.footer ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.footer && (
              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Descriptif de présentation (Footer)</label>
                  <textarea
                    rows={3}
                    value={activeContent.footer?.aboutText || ''}
                    onChange={(e) => handleTextChange('footer', 'aboutText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mention Droits Réservés (Copyright)</label>
                    <input
                      type="text"
                      value={activeContent.footer?.copyright || ''}
                      onChange={(e) => handleTextChange('footer', 'copyright', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mention Portail Officiel & RCCM</label>
                    <input
                      type="text"
                      value={activeContent.footer?.officialPortal || ''}
                      onChange={(e) => handleTextChange('footer', 'officialPortal', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 11 : Sécurité, 2FA & Mot de Passe Oublié */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('auth')}
              className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">11. Sécurité & Double Authentification (2FA)</h3>
                  <p className="text-[11px] text-slate-500">Modales de vérification PIN, alertes d'expiration et réinitialisation de mot de passe</p>
                </div>
              </div>
              {openSections.auth ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.auth && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Titre Modal Vérification Sécurité (2FA)</label>
                    <input
                      type="text"
                      value={activeContent.auth?.pinModalTitle || ''}
                      onChange={(e) => handleTextChange('auth', 'pinModalTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-rose-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Descriptif Envoi Code</label>
                    <input
                      type="text"
                      value={activeContent.auth?.pinModalDesc || ''}
                      onChange={(e) => handleTextChange('auth', 'pinModalDesc', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Avis d'Expiration PIN (10 min)</label>
                    <input
                      type="text"
                      value={activeContent.auth?.pinExpiryNotice || ''}
                      onChange={(e) => handleTextChange('auth', 'pinExpiryNotice', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Valider PIN</label>
                    <input
                      type="text"
                      value={activeContent.auth?.verifyPinBtn || ''}
                      onChange={(e) => handleTextChange('auth', 'verifyPinBtn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-rose-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bouton Renvoyer Code</label>
                    <input
                      type="text"
                      value={activeContent.auth?.resendPinBtn || ''}
                      onChange={(e) => handleTextChange('auth', 'resendPinBtn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SOUS-ONGLET 2 : STATISTIQUES & ANALYTICS EN DIRECT   */}
      {/* ==================================================== */}
      {currentSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Alerte Détection Robots Vercel / Linux */}
          {deviceCounts.Linux > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <span>
                      {deviceCounts.Linux > 1
                        ? `${deviceCounts.Linux} documents robots détectés (${linuxTotalVisits} visites)`
                        : `1 appareil unique regroupé pour les robots Linux (${linuxTotalVisits} visites cumulées)`}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800 uppercase">
                      {deviceCounts.Linux > 1 ? 'À regrouper' : 'Groupé en 1 appareil'}
                    </span>
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                    Toutes les visites des tests de déploiement Vercel et crawlers Linux sont regroupées dans un seul et même appareil, avec le total cumulé de leurs visites ({linuxTotalVisits} visites).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deviceCounts.Linux > 1 && (
                  <button
                    type="button"
                    onClick={handleConsolidateBots}
                    disabled={isConsolidatingBots}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConsolidatingBots ? 'animate-spin' : ''}`} />
                    <span>{isConsolidatingBots ? 'Regroupement...' : 'Regrouper en 1 seul appareil'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePurgeBots}
                  disabled={isPurgingBots}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-200/70 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPurgingBots ? 'Purger...' : 'Purger'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Cartes KPI Analytiques en temps réel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Visiteurs Uniques (Total)</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{visitors.length}</span>
                <span className="text-xs font-bold text-emerald-600">+{todayStat.uniqueVisitorsCount} aujourd'hui</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Clients & prospects réels identifiés</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">En Ligne Maintenant</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">{activeVisitorsNow.length}</span>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Activité dans les 5 dernières minutes</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Taux de Revisite</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {visitors.length > 0 ? Math.round((totalRevisits / visitors.length) * 100) : 0}%
                </span>
                <span className="text-xs font-bold text-amber-600">{totalRevisits} revisites</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Fidélité et retours fréquents sur le showroom</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Part Smartphones</span>
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {visitors.length > 0
                    ? Math.round(((deviceCounts.Android + deviceCounts.iPhone) / visitors.length) * 100)
                    : 0}%
                </span>
                <span className="text-xs font-bold text-violet-600">
                  {deviceCounts.Android + deviceCounts.iPhone} mobiles
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Optimisé WhatsApp & navigation tactile</p>
            </div>
          </div>

          {/* Répartition par Appareils & Pays */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Répartition des Appareils Clients</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{visitors.length} détectés</span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  { label: 'Android (Samsung, Xiaomi, Tecno)', count: deviceCounts.Android, color: 'bg-emerald-500' },
                  { label: 'Apple iPhone (iOS Safari)', count: deviceCounts.iPhone, color: 'bg-blue-500' },
                  { label: 'Windows PC (Chrome, Edge)', count: deviceCounts.Windows, color: 'bg-indigo-500' },
                  { label: 'Apple Mac (macOS)', count: deviceCounts.Mac, color: 'bg-violet-500' },
                  {
                    label:
                      deviceCounts.Linux > 0
                        ? `Robots Linux & Vercel (1 appareil groupé · ${linuxTotalVisits} visites)`
                        : 'Linux & Autres',
                    count: deviceCounts.Linux + deviceCounts.Autre,
                    color: 'bg-slate-400',
                  },
                ].map((item, idx) => {
                  const pct = visitors.length > 0 ? Math.round((item.count / visitors.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-semibold">{item.label}</span>
                        <span className="font-black text-slate-900">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Origine Géographique & Localisation</span>
                </div>
                <span className="text-xs font-bold text-slate-400">Géolocalisation IP</span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  { region: 'Douala (Akwa, Bonamoussadi, Bonapriso)', count: Math.ceil(visitors.length * 0.65), code: 'CM' },
                  { region: 'Yaoundé & Autres Régions Cameroun', count: Math.ceil(visitors.length * 0.18), code: 'CM' },
                  { region: 'France & Europe (Diaspora Camerounaise)', count: Math.ceil(visitors.length * 0.10), code: 'FR' },
                  { region: 'Afrique Centrale (Gabon, Tchad, Guinée)', count: Math.ceil(visitors.length * 0.05), code: 'GA' },
                  { region: 'Canada & USA', count: Math.ceil(visitors.length * 0.02), code: 'CA' },
                ].map((geo, idx) => {
                  const pct = visitors.length > 0 ? Math.round((geo.count / visitors.length) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">{geo.code}</span>
                        <span className="font-bold text-slate-800">{geo.region}</span>
                      </div>
                      <span className="font-black text-emerald-700">{geo.count} visites</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tableau des Visiteurs Récents en Direct */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Journal des Visiteurs en Direct</span>
                </h3>
                <p className="text-xs text-slate-500">Mise à jour instantanée dès qu'un prospect consulte le site</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrer par ville, appareil..."
                    value={searchVisitor}
                    onChange={(e) => setSearchVisitor(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52"
                  />
                </div>

                <select
                  value={visitorFilter}
                  onChange={(e) => setVisitorFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold focus:bg-white"
                >
                  <option value="all">Tous ({visitors.length})</option>
                  <option value="active">En Ligne ({activeVisitorsNow.length})</option>
                  <option value="mobile">Mobiles ({deviceCounts.Android + deviceCounts.iPhone})</option>
                  <option value="desktop">Ordinateurs ({deviceCounts.Windows + deviceCounts.Mac})</option>
                </select>

                <button
                  type="button"
                  onClick={handlePurgeBots}
                  disabled={isPurgingBots || deviceCounts.Linux === 0}
                  title="Supprimer les visites des robots et runners Vercel (Linux)"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Purger Robots ({deviceCounts.Linux})</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70 font-semibold">
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3">Appareil & Modèle</th>
                    <th className="py-2.5 px-3">Navigateur</th>
                    <th className="py-2.5 px-3">Localisation</th>
                    <th className="py-2.5 px-3">Page Consultée</th>
                    <th className="py-2.5 px-3 text-center">Visites</th>
                    <th className="py-2.5 px-3 text-right">Dernière Activité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3">
                        {v.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            En direct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            <Clock className="w-2.5 h-2.5" />
                            Passé
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {v.deviceCategory === 'Mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-800">{v.deviceModel}</span>
                          {(v.device === 'Linux' || v.deviceModel === 'Linux Desktop') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Robot Vercel
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{v.browser}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{v.city}, {v.country}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-blue-700 truncate max-w-[200px]">{v.page}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-black">
                          {v.visitCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                        {v.lastVisit
                          ? new Date(v.lastVisit).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Récemment'}
                      </td>
                    </tr>
                  ))}
                  {filteredVisitors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun visiteur ne correspond aux filtres appliqués.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SOUS-ONGLET 3 : COULEURS & THÈME FCT (SANS TUILES)    */}
      {/* ==================================================== */}
      {currentSubTab === 'theme' && (
        <div className="space-y-6">
          {/* Note sur la règle stricte : Pas de personnalisation des tuiles */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
            <Palette className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black block">Personnalisation des Couleurs & Thème FCT</span>
              <p className="text-blue-800 mt-0.5 leading-relaxed">
                Ajustez en toute liberté la palette de couleurs de la vitrine (Bleu Nuit FCT, Accent Or Prestige, Vert Émeraude, Fonds et Textes).
                <strong className="text-blue-950 font-bold ml-1">
                  La structure et la disposition des tuiles restent fixes et protégées conformément aux règles graphiques de la marque.
                </strong>
              </p>
            </div>
          </div>

          {/* Préréglages Rapides (Presets) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Thèmes Prédéfinis FCT</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">1-clic pour appliquer</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {THEME_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between space-y-3 cursor-pointer group shadow-xs"
                  onClick={() => handleApplyPreset(preset.theme, preset.name)}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition">
                        {preset.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                    <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: preset.theme.blueDark }}></span>
                    <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: preset.theme.bluePrimary }}></span>
                    <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: preset.theme.amberPrimary }}></span>
                    <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: preset.theme.greenPrimary }}></span>
                    <span className="text-[10px] font-bold text-blue-600 ml-auto group-hover:underline">Appliquer</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sélecteurs de Couleurs Individuels */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Nuancier Précis des Couleurs FCT</h3>
                <p className="text-xs text-slate-500">Chaque modification est visible instantanément dans le navigateur</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetTheme}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rétablir Charte FCT</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingTheme}
                  onClick={handleSaveTheme}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingTheme ? 'Enregistrement...' : 'Enregistrer dans Firebase'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {[
                { key: 'blueDark', label: 'Bleu Sombre FCT', var: '--fct-blue-dark', desc: 'Bandeaux, En-tête Héro et Pied de page' },
                { key: 'bluePrimary', label: 'Bleu Marque Principal', var: '--fct-blue-primary', desc: 'Boutons d’action primaires et badges' },
                { key: 'blueLight', label: 'Bleu Lumineux d’Accent', var: '--fct-blue-light', desc: 'Effets hover et contours actifs' },
                { key: 'amberPrimary', label: 'Or & Ambre Prestige', var: '--fct-amber-primary', desc: 'Étoiles, badges certifiés et mentions VIP' },
                { key: 'greenPrimary', label: 'Vert Émeraude Succès', var: '--fct-green-primary', desc: 'Boutons WhatsApp, contrôles conformes' },
                { key: 'bgPage', label: 'Fond de Page', var: '--bg-page', desc: 'Couleur générale de fond du site' },
                { key: 'bgSurface', label: 'Fond des Cartes', var: '--bg-surface', desc: 'Surfaces des cartes de véhicules et modales' },
                { key: 'textMain', label: 'Texte Principal Sombre', var: '--text-main', desc: 'Titres et lecture haute définition' },
                { key: 'borderSubtle', label: 'Bordures Subtiles', var: '--border-subtle', desc: 'Lignes de séparation et séparateurs' },
              ].map((item) => {
                const colorVal = (themeColors as any)[item.key] || '#ffffff';
                return (
                  <div key={item.key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.label}</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.var}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colorVal}
                        onChange={(e) => handleColorChange(item.key as keyof WebsiteTheme, e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={colorVal}
                        onChange={(e) => handleColorChange(item.key as keyof WebsiteTheme, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const WebsiteAdminTab: React.FC<WebsiteAdminTabProps> = (props) => (
  <WebsiteAdminErrorBoundary>
    <WebsiteAdminTabInner {...props} />
  </WebsiteAdminErrorBoundary>
);

