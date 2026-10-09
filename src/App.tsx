/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Main Application Shell with Multi-Tab Navigation & Strict RBAC
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import React, { useState, useEffect } from 'react';
import { dbStore, DatabaseState } from './services/dbStore.ts';
import { Language, translations } from './services/i18n.ts';
import { AppModule, Vehicle } from '../packages/shared-types/index.ts';
import { hasPermission, hasEffectivePermission } from '../packages/business-rules/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DocumentModal, DocumentPrintData } from './components/DocumentModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';

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
import { UsersView } from './modules/UsersView.tsx';
import { SettingsView } from './modules/SettingsView.tsx';
import { AuditSyncView } from './modules/AuditSyncView.tsx';
import { HelpCenterView } from './modules/HelpCenterView.tsx';

import { WifiOff, ShieldAlert, ArrowLeft, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<DatabaseState>(dbStore.getState());
  const [currentUser, setCurrentUser] = useState(dbStore.getCurrentUser());

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Main scrollable container ref to guarantee opening at the very top
  const mainContentRef = React.useRef<HTMLElement>(null);

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Subscribe to DB changes & current user changes
  useEffect(() => {
    const unsubscribe = dbStore.subscribe(() => {
      setState({ ...dbStore.getState() });
      setCurrentUser(dbStore.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  // Strict RBAC synchronization: when role or overrides change, verify permission for currentModule
  useEffect(() => {
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

  // Sidebar / Navigation Module selection with optional context entity ID
  const handleNavigate = (module: AppModule, entityId?: string) => {
    if (!hasEffectivePermission(currentUser, module, 'read', state.rolePermissions)) {
      return;
    }
    setActiveShowroomVehicle(null);
    setContextEntityId(entityId || null);
    setCurrentModule(module);
    setIsMobileSidebarOpen(false);
    scrollToTop();
  };

  const handleSelectModule = (module: AppModule) => {
    handleNavigate(module);
  };

  // Open Showroom page for a vehicle (opens full page at top with multi-angle photos & sharing)
  const handleOpenShowroom = (vehicle: Vehicle) => {
    if (!hasPermission(currentUser.role, 'vehicles', 'read')) {
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

  const handleRefresh = () => {
    setState({ ...dbStore.getState() });
    setCurrentUser(dbStore.getCurrentUser());
  };

  // Find vehicle for active showroom view
  const showroomVehicle =
    currentModule === 'showroom'
      ? activeShowroomVehicle || state.vehicles[0]
      : null;

  const t = translations[lang];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden">
      {/* 1. Top Navbar */}
      <Navbar
        state={state}
        currentUser={currentUser}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onRefresh={handleRefresh}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
                  {t.rbac.activeRoleBadge} <strong>{t.roles[currentUser.role]}</strong>
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
                <UsersView state={state} lang={lang} onNavigate={handleNavigate} />
              )}
              {currentModule === 'settings' && (
                <SettingsView state={state} lang={lang} onNavigate={handleNavigate} />
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

      {/* Firebase Authentication & RBAC Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        state={state}
        lang={lang}
      />
    </div>
  );
}
