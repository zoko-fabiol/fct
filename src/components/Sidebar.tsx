/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Modular Navigation Sidebar with Strict RBAC Filtering
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { AppModule, UserRole, UserProfile, PermissionAction } from '../../packages/shared-types/index.ts';
import { Language, translations } from '../services/i18n.ts';
import { hasPermission, hasEffectivePermission } from '../../packages/business-rules/index.ts';
import {
  LayoutDashboard,
  Car,
  Boxes,
  KeyRound,
  TrendingUp,
  Users2,
  CalendarCheck2,
  Receipt,
  Wallet,
  Wrench,
  UserSquare2,
  FolderLock,
  BellRing,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  HelpCircle,
  ShieldAlert,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentModule: AppModule | 'showroom';
  currentUserRole: UserRole;
  currentUser?: UserProfile;
  rolePermissions?: Record<UserRole, Record<AppModule, PermissionAction[]>>;
  onSelectModule: (module: AppModule) => void;
  lang: Language;
  badges: Partial<Record<AppModule, number>>;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: AppModule;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  currentUserRole,
  currentUser,
  rolePermissions,
  onSelectModule,
  lang,
  badges,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const t = translations[lang];

  const sections: NavSection[] = [
    {
      title: lang === 'fr' ? 'PILOTAGE' : 'OVERVIEW',
      items: [{ id: 'dashboard', icon: LayoutDashboard }],
    },
    {
      title: lang === 'fr' ? 'FLOTTE & PARC' : 'FLEET & ASSETS',
      items: [
        { id: 'vehicles', icon: Car },
        { id: 'stock', icon: Boxes },
        { id: 'maintenance', icon: Wrench },
        { id: 'drivers', icon: UserSquare2 },
      ],
    },
    {
      title: lang === 'fr' ? 'ACTIVITÉS COMMERCIALES' : 'COMMERCIAL & RENTALS',
      items: [
        { id: 'rentals', icon: KeyRound },
        { id: 'sales', icon: TrendingUp },
        { id: 'crm', icon: Users2 },
        { id: 'reservations', icon: CalendarCheck2 },
      ],
    },
    {
      title: lang === 'fr' ? 'FINANCE & CAISSE XAF' : 'FINANCE & CASH',
      items: [
        { id: 'cash', icon: Wallet },
        { id: 'billing', icon: Receipt },
        { id: 'reports', icon: BarChart3 },
      ],
    },
    {
      title: lang === 'fr' ? 'CONFORMITÉ & SYSTÈME' : 'COMPLIANCE & SYSTEM',
      items: [
        { id: 'documents', icon: FolderLock },
        { id: 'notifications', icon: BellRing },
        { id: 'settings', icon: Settings },
        { id: 'audit', icon: History },
        { id: 'help', icon: HelpCircle },
      ],
    },
  ];

  const checkReadPermission = (moduleId: AppModule) => {
    if (currentUser) {
      return hasEffectivePermission(currentUser, moduleId, 'read', rolePermissions);
    }
    return hasPermission(currentUserRole, moduleId, 'read', rolePermissions);
  };

  const totalSidebarItemsCount = sections.reduce(
    (acc, sec) => acc + sec.items.length,
    0
  );

  const authorizedModulesCount = sections.reduce(
    (acc, sec) =>
      acc + sec.items.filter((item) => checkReadPermission(item.id)).length,
    0
  );

  const renderSidebarNav = () => (
    <>
      <div className="flex-1 min-h-0 py-4 overflow-y-auto overscroll-contain space-y-5 px-3">
        {/* Active Role Indicator Badge */}
        <div className="px-3 py-2 rounded-lg bg-blue-950/80 border border-blue-800/50 flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="overflow-hidden flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                {t.rbac.activeRoleBadge}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {authorizedModulesCount}/{totalSidebarItemsCount}
              </span>
            </div>
            <div className="font-bold text-white truncate text-xs">{t.roles[currentUserRole]}</div>
          </div>
        </div>

        {sections.map((section, sIdx) => {
          // Strict RBAC Filter: Only show modules where the user has 'read' permission
          const visibleItems = section.items.filter((item) =>
            checkReadPermission(item.id)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx}>
              <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 mb-1.5">
                {section.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentModule === item.id ||
                    (currentModule === 'showroom' && item.id === 'vehicles');
                  const badge = badges[item.id];

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectModule(item.id);
                        onCloseMobile?.();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 min-h-[40px] sm:min-h-[36px] rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-900/60 text-white font-semibold border-l-4 border-emerald-500 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white active:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                        <span>{t.modules[item.id]}</span>
                      </div>

                      {badge !== undefined && badge > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.id === 'cash' || item.id === 'maintenance'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agency Footer Card */}
      <div className="p-3 m-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
        <div className="font-semibold text-white mb-0.5">FCT Automobile Douala</div>
        <div className="text-[10px] text-slate-400">Agence Santa Barbara</div>
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className="text-emerald-400 font-mono">XAF Douala</span>
          <span className="text-slate-500">v1.2.0-cm</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0a192f] text-slate-300 flex-col shrink-0 border-r border-slate-800 h-full min-h-0 overflow-hidden select-none">
        {renderSidebarNav()}
      </aside>

      {/* 2. Mobile & Tablet Drawer Modal */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={onCloseMobile}
          />

          {/* Drawer container */}
          <aside className="relative flex flex-col max-w-[280px] w-full bg-[#0a192f] text-slate-300 border-r border-slate-800 z-50 h-full overflow-hidden shadow-2xl select-none">
            {/* Drawer Header */}
            <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-xs text-white">
                  FCT
                </div>
                <div>
                  <div className="font-bold text-xs text-white">FCT Automobile</div>
                  <div className="text-[10px] text-slate-400">Douala, Santa Barbara</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            {renderSidebarNav()}
          </aside>
        </div>
      )}
    </>
  );
};
