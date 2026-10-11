/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Main Application Shell with Multi-Tab Navigation & Strict RBAC
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import React, { useState, useEffect } from 'react';
import { dbStore, DatabaseState } from './services/dbStore.ts';
import { Language, translations } from './services/i18n.ts';
import { AppModule, Vehicle, UserProfile } from '../packages/shared-types/index.ts';
import { hasPermission, hasEffectivePermission } from '../packages/business-rules/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DocumentModal, DocumentPrintData } from './components/DocumentModal.tsx';
import { AppLoader } from './components/auth/AppLoader.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { authService } from './services/firebase.ts';

// 18 Feature Modules + Showroom
import { DashboardView } from './modules/DashboardView.tsx';
import { VehiclesView } from './modules/VehiclesView.tsx';
import { ShowroomView } from './modules/ShowroomView.tsx';
import { StockView } from './modules/StockView.tsx';
import { RentalsView } from './modules/RentalsView.tsx';
import { SalesView } from './modules/SalesView.tsx';
import { CrmView } from './modules/CrmView.tsx';
import { ReservationsView } from './modules/ReservationsView.tsx';
import { BillingView } from './modules/BillingView.tsx';
import { CashView } from './modules/CashView.tsx';
import { MaintenanceView } from './modules/MaintenanceView.tsx';
import { DriversView } from './modules/DriversView.tsx';
import { DocumentsView } from './modules/DocumentsView.tsx';
import { NotificationsView } from './modules/NotificationsView.tsx';
import { ReportsView } from './modules/ReportsView.tsx';
import { SettingsView } from './modules/SettingsView.tsx';
import { AuditSyncView } from './modules/AuditSyncView.tsx';
import { HelpCenterView } from './modules/HelpCenterView.tsx';

import { WifiOff, ShieldAlert, ArrowLeft, LayoutDashboard, ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<DatabaseState>(dbStore.getState());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(dbStore.getCurrentUser());
  const [authLoading, setAuthLoading] = useState(true);

  // Persistent Language FR / EN
  const [lang, setLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem('fct_erp_lang') as Language) || 'fr';
    } catch {
      return 'fr';
    }
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('fct_erp_lang', newLang);
    } catch {
      // Ignore
    }
  };

  // Active Module & Showroom State (Navigation directe sans petits onglets en haut)
  const [currentModule, setCurrentModule] = useState<AppModule | 'showroom'>('dashboard');
  const [activeShowroomVehicle, setActiveShowroomVehicle] = useState<Vehicle | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [printDocData, setPrintDocData] = useState<DocumentPrintData | null>(null);
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Sécurité Inactivité (Auto-Lock après 15 minutes)
  useEffect(() => {
    if (!currentUser || isSessionLocked) return;
    const INACTIVITY_MS = 15 * 60 * 1000;
    let timer = setTimeout(() => {
      setIsSessionLocked(true);
    }, INACTIVITY_MS);

    const resetInactivity = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsSessionLocked(true);
      }, INACTIVITY_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetInactivity, { passive: true }));

    return () => {
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetInactivity));
    };
  }, [currentUser, isSessionLocked]);

  // Main scrollable container ref to guarantee opening at the very top
  const mainContentRef = React.useRef<HTMLElement>(null);

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Surveillance de la session Firebase & synchronisation temps réel
  useEffect(() => {
    const unsubAuth = authService.onAuthChanged(async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          dbStore.setCurrentUser(null);
          setCurrentUser(null);
        } else {
          const userEmail = (firebaseUser.email || '').trim().toLowerCase();
          const currentState = dbStore.getState();
          let matched: UserProfile | null | undefined = currentState.users.find(
            (u) => u.email.trim().toLowerCase() === userEmail || u.id === firebaseUser.uid
          );
          if (!matched) {
            matched = await authService.fetchUserProfile(firebaseUser.uid);
          }
          if (!matched) {
            matched = await authService.fetchUserProfileByEmail(userEmail);
          }
          const isSuperAdmin =
            userEmail === 'clausephwandji044@gmail.com' ||
            userEmail === 'rapidetravel2@gmail.com' ||
            userEmail === 'admin@fct-automobile.cm';

          if (!matched && isSuperAdmin) {
            matched = {
              id: firebaseUser.uid,
              email: userEmail,
              fullName:
                firebaseUser.displayName ||
                (userEmail.startsWith('clause')
                  ? 'Claus Ephwandji (Super Admin & Direction)'
                  : 'Directeur Général (Super Admin)'),
              firstName: userEmail.startsWith('clause') ? 'Claus' : 'Directeur',
              lastName: userEmail.startsWith('clause') ? 'Ephwandji' : 'Général',
              phone: '+237 699 00 11 22',
              jobTitle: 'Super Administrateur & Directeur Général',
              role: 'super_admin',
              status: 'ACTIVE',
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            await authService.syncUserProfile(matched);
            dbStore.upsertUser(matched);
          }

          if (matched && matched.isActive && matched.status !== 'SUSPENDED' && matched.status !== 'DISABLED') {
            dbStore.setCurrentUser(matched);
            setCurrentUser(matched);
          } else {
            await authService.logout();
            dbStore.setCurrentUser(null);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.warn('Erreur vérification session Firebase:', err);
        dbStore.setCurrentUser(null);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    const unsubscribe = dbStore.subscribe(() => {
      setState({ ...dbStore.getState() });
      setCurrentUser(dbStore.getCurrentUser());
    });

    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, []);

  // Strict RBAC synchronization: when role or overrides change, verify permission for currentModule
  useEffect(() => {
    if (!currentUser) return;
    const isAllowed =
      currentModule === 'showroom'
        ? hasEffectivePermission(currentUser, 'vehicles', 'read', state.rolePermissions)
        : hasEffectivePermission(currentUser, currentModule, 'read', state.rolePermissions);

    if (!isAllowed) {
      // Find the first authorized module for this role
      const allModules: AppModule[] = [
        'dashboard',
        'vehicles',
        'rentals',
        'sales',
        'crm',
        'reservations',
        'billing',
        'cash',
        'stock',
        'maintenance',
        'drivers',
        'documents',
        'notifications',
        'reports',
        'users',
        'settings',
        'audit',
        'help',
      ];
      const firstAllowed =
        allModules.find((m) => hasEffectivePermission(currentUser, m, 'read', state.rolePermissions)) || 'dashboard';

      setCurrentModule(firstAllowed);
      setActiveShowroomVehicle(null);
      scrollToTop();
    }
  }, [currentUser, currentModule, state.rolePermissions]);

  // Ensure every time the module or showroom vehicle changes, it immediately resets scroll to top
  useEffect(() => {
    scrollToTop();
  }, [currentModule, activeShowroomVehicle?.id]);

  const [contextEntityId, setContextEntityId] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<
    | 'general'
    | 'appearance'
    | 'numbering'
    | 'finance'
    | 'fleet'
    | 'maintenance'
    | 'rentals'
    | 'modules'
    | 'users'
    | 'sync'
    | 'backup'
  >('general');

  // Sidebar / Navigation Module selection with optional context entity ID
  const handleNavigate = (module: AppModule, entityId?: string) => {
    if (module === 'users') {
      if (!currentUser || !hasEffectivePermission(currentUser, 'users', 'read', state.rolePermissions)) {
        return;
      }
      setActiveShowroomVehicle(null);
      setContextEntityId(entityId || null);
      setSettingsTab('users');
      setCurrentModule('settings');
      setIsMobileSidebarOpen(false);
      scrollToTop();
      return;
    }

    if (!currentUser || !hasEffectivePermission(currentUser, module, 'read', state.rolePermissions)) {
      return;
    }
    setActiveShowroomVehicle(null);
    setContextEntityId(entityId || null);
    if (module === 'settings' && !entityId) {
      setSettingsTab('general');
    }
    setCurrentModule(module);
    setIsMobileSidebarOpen(false);
    scrollToTop();
  };

  const handleSelectModule = (module: AppModule) => {
    handleNavigate(module);
  };

  // Open Showroom page for a vehicle (opens full page at top with multi-angle photos & sharing)
  const handleOpenShowroom = (vehicle: Vehicle) => {
    if (!currentUser || !hasPermission(currentUser.role, 'vehicles', 'read')) {
      return;
    }
    setActiveShowroomVehicle(vehicle);
    setCurrentModule('showroom');
    setIsMobileSidebarOpen(false);
    scrollToTop();
  };

  // Permission Check for Current View
  const isCurrentModuleAuthorized =
    currentModule === 'showroom'
      ? hasEffectivePermission(currentUser, 'vehicles', 'read', state.rolePermissions)
      : hasEffectivePermission(currentUser, currentModule, 'read', state.rolePermissions);

  // Badges calculation for sidebar items
  const badges: Partial<Record<AppModule, number>> = {
    rentals: state.contracts.filter((c) => c.status === 'ACTIVE').length,
    reservations: state.reservations.filter((r) => r.status === 'CONFIRMED').length,
    maintenance: state.maintenance.filter((m) => m.status === 'IN_PROGRESS').length,
    stock: state.stock.filter((s) => s.quantityInStock <= s.minThresholdAlert).length,
    cash: state.cashSessions.find((s) => s.status === 'OPEN') ? 1 : 0,
  };

  const handleOpenPrintModal = (data: DocumentPrintData) => {
    setPrintDocData(data);
  };

  // Find vehicle for active showroom view
  const showroomVehicle =
    currentModule === 'showroom'
      ? activeShowroomVehicle || state.vehicles[0]
      : null;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Erreur déconnexion:', e);
    } finally {
      dbStore.setCurrentUser(null);
      setCurrentUser(null);
    }
  };

  const t = translations[lang];

  // 1. Écran de démarrage / Splash Screen FCT
  if (authLoading) {
    return <AppLoader message="Initialisation sécurisée de l'écosystème FCT..." />;
  }

  // 2. Vue de connexion plein écran si non authentifié
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          dbStore.setCurrentUser(user);
          setCurrentUser(user);
        }}
        lang={lang}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden">
      {/* 1. Top Navbar */}
      <Navbar
        state={state}
        currentUser={currentUser}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Offline Alert Strip when disconnected */}
      {!state.isOnline && (
        <div className="shrink-0 no-print bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>
              {lang === 'fr'
                ? 'MODE HORS-LIGNE ACTIF (IndexedDB Local) — Les opérations sont conservées localement dans la file Outbox et seront synchronisées dès rétablissement de la connexion.'
                : 'OFFLINE MODE ACTIVE (Local IndexedDB) — Changes stored locally in Outbox queue and will sync upon reconnection.'}
            </span>
          </div>
          <button
            onClick={() => dbStore.setOnlineStatus(true)}
            className="px-2 py-0.5 rounded bg-slate-900 text-white font-semibold text-[11px] hover:bg-slate-800 transition cursor-pointer"
          >
            {lang === 'fr' ? 'Reconnexion' : 'Reconnect'}
          </button>
        </div>
      )}

      {/* 2. Main Body with Sidebar + Active View (Strictly Independent Scroll Contexts) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Modular Sidebar with Strict RBAC Filtering & Independent Scroll */}
        <Sidebar
          currentModule={currentModule}
          currentUserRole={currentUser.role}
          currentUser={currentUser}
          rolePermissions={state.rolePermissions}
          onSelectModule={handleSelectModule}
          lang={lang}
          badges={badges}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area - Independent Scroll with overscroll-contain */}
        <main
          ref={mainContentRef}
          className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"
        >
          {/* RBAC Access Denied View if module is forbidden */}
          {!isCurrentModuleAuthorized ? (
            <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm max-w-xl mx-auto my-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {t.rbac.accessDenied}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.rbac.unauthorizedModule}
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {t.rbac.activeRoleBadge} <strong>{t.roles[currentUser.role as keyof typeof t.roles] || currentUser.role}</strong>
                </span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleSelectModule('dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow cursor-pointer"
                >
                  {t.rbac.returnDashboard}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Showroom View */}
              {currentModule === 'showroom' && showroomVehicle && (
                <ShowroomView
                  vehicle={showroomVehicle}
                  lang={lang}
                  currentUserRole={currentUser.role}
                  onBack={() => handleSelectModule('vehicles')}
                  onBookRental={(vehId) => handleNavigate('rentals', vehId || showroomVehicle.id)}
                  onCreateSale={(vehId) => handleNavigate('sales', vehId || showroomVehicle.id)}
                  onReserve={(vehId) => handleNavigate('reservations', vehId || showroomVehicle.id)}
                />
              )}

              {/* 18 Standard Feature Modules */}
              {currentModule === 'dashboard' && (
                <DashboardView
                  state={state}
                  lang={lang}
                  onNavigate={handleSelectModule}
                />
              )}
              {currentModule === 'vehicles' && (
                <VehiclesView
                  state={state}
                  lang={lang}
                  currentUserRole={currentUser.role}
                  onOpenShowroom={handleOpenShowroom}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'stock' && (
                <StockView
                  state={state}
                  lang={lang}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'rentals' && (
                <RentalsView
                  state={state}
                  lang={lang}
                  onOpenPrintModal={handleOpenPrintModal}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'sales' && (
                <SalesView
                  state={state}
                  lang={lang}
                  onOpenPrintModal={handleOpenPrintModal}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'crm' && (
                <CrmView
                  state={state}
                  lang={lang}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'reservations' && (
                <ReservationsView
                  state={state}
                  lang={lang}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'billing' && (
                <BillingView
                  state={state}
                  lang={lang}
                  onOpenPrintModal={handleOpenPrintModal}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'cash' && (
                <CashView
                  state={state}
                  lang={lang}
                  onOpenPrintModal={handleOpenPrintModal}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'maintenance' && (
                <MaintenanceView
                  state={state}
                  lang={lang}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                  onOpenPrintModal={handleOpenPrintModal}
                />
              )}
              {currentModule === 'drivers' && (
                <DriversView
                  state={state}
                  lang={lang}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'documents' && (
                <DocumentsView
                  state={state}
                  lang={lang}
                  onNavigate={handleNavigate}
                  contextEntityId={contextEntityId}
                />
              )}
              {currentModule === 'notifications' && (
                <NotificationsView state={state} lang={lang} />
              )}
              {currentModule === 'reports' && (
                <ReportsView state={state} lang={lang} />
              )}
              {currentModule === 'users' && (
                <SettingsView state={state} lang={lang} onNavigate={handleNavigate} initialTab="users" />
              )}
              {currentModule === 'settings' && (
                <SettingsView state={state} lang={lang} onNavigate={handleNavigate} initialTab={settingsTab} />
              )}
              {currentModule === 'audit' && (
                <AuditSyncView state={state} lang={lang} />
              )}
              {currentModule === 'help' && (
                <HelpCenterView lang={lang} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Official FCT Document Print Modal */}
      <DocumentModal data={printDocData} onClose={() => setPrintDocData(null)} />

      {/* Verrouillage Automatique de Session (Protection Agence FCT) */}
      {isSessionLocked && currentUser && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Session Verrouillée</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Par mesure de sécurité pour l’agence FCT, la session a été mise en veille après inactivité prolongée.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0a264a] text-white font-bold flex items-center justify-center text-sm">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSessionLocked(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0a264a] to-[#0f3460] hover:from-[#0d315f] hover:to-[#123e72] text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Déverrouiller et Reprendre</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await authService.logout();
                  dbStore.setCurrentUser(null);
                  setCurrentUser(null);
                  setIsSessionLocked(false);
                }}
                className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
