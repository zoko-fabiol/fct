/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Design System & Composants Communs
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  X,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Inbox,
  Loader2,
  Calendar,
  User,
  Car,
  FileText,
  KeyRound,
  Wrench,
  Boxes,
  Receipt,
  Wallet,
  Building,
} from 'lucide-react';
import { AppModule } from '../../../packages/shared-types/index.ts';

// ============================================================================
// 1. ENTITY STATUS BADGE
// ============================================================================
export type UniversalStatus =
  | 'AVAILABLE'
  | 'RENTED'
  | 'SOLD'
  | 'MAINTENANCE'
  | 'IMMOBILIZED'
  | 'RESERVED'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SCHEDULED'
  | 'CANCELLED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'UNPAID'
  | 'OVERDUE'
  | 'DRAFT'
  | 'ON_TRIP'
  | 'LEAVE'
  | 'PENDING'
  | 'DELIVERED'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | string;

interface EntityStatusBadgeProps {
  status: UniversalStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EntityStatusBadge: React.FC<EntityStatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const norm = String(status || '').toUpperCase();

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;
  let text = label || norm;

  switch (norm) {
    case 'AVAILABLE':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'PAID':
    case 'DELIVERED':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      text = label || (norm === 'AVAILABLE' ? 'Disponible' : norm === 'ACTIVE' ? 'Actif' : norm === 'COMPLETED' ? 'Terminé' : norm === 'PAID' ? 'Soldé' : 'Livré');
      break;

    case 'IN_PROGRESS':
    case 'ON_TRIP':
    case 'RENTED':
    case 'PARTIALLY_PAID':
    case 'NEGOTIATION':
    case 'ORDER':
      style = 'bg-blue-50 text-blue-800 border-blue-200';
      Icon = Clock;
      text = label || (norm === 'IN_PROGRESS' ? 'En cours' : norm === 'ON_TRIP' ? 'En mission' : norm === 'RENTED' ? 'En location' : norm === 'PARTIALLY_PAID' ? 'Partiel' : norm);
      break;

    case 'SCHEDULED':
    case 'RESERVED':
    case 'PENDING':
    case 'DRAFT':
    case 'PROSPECT':
    case 'OFFER':
      style = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      text = label || (norm === 'SCHEDULED' ? 'Programmé' : norm === 'RESERVED' ? 'Réservé' : norm === 'PENDING' ? 'En attente' : norm === 'DRAFT' ? 'Brouillon' : norm);
      break;

    case 'MAINTENANCE':
    case 'LOW_STOCK':
      style = 'bg-orange-50 text-orange-800 border-orange-200';
      Icon = AlertTriangle;
      text = label || (norm === 'MAINTENANCE' ? 'En atelier' : 'Stock faible');
      break;

    case 'IMMOBILIZED':
    case 'CANCELLED':
    case 'OVERDUE':
    case 'OUT_OF_STOCK':
    case 'SUSPENDED':
    case 'DISABLED':
      style = 'bg-rose-50 text-rose-800 border-rose-200';
      Icon = AlertCircle;
      text = label || (norm === 'IMMOBILIZED' ? 'Immobilisé' : norm === 'CANCELLED' ? 'Annulé' : norm === 'OVERDUE' ? 'En retard' : norm === 'OUT_OF_STOCK' ? 'Rupture' : norm === 'SUSPENDED' ? 'Suspendu' : 'Désactivé');
      break;

    case 'SOLD':
      style = 'bg-indigo-50 text-indigo-900 border-indigo-200';
      Icon = CheckCircle2;
      text = label || 'Vendu';
      break;

    case 'LEAVE':
      style = 'bg-purple-50 text-purple-800 border-purple-200';
      Icon = Calendar;
      text = label || 'En congé';
      break;

    default:
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs ${sizeClasses} ${style} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{text}</span>
    </span>
  );
};

// ============================================================================
// 2. ENTITY ACTIVITY SUMMARY (KPIS)
// ============================================================================
export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ElementType;
  colorVariant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

interface EntityActivitySummaryProps {
  items: KpiItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export const EntityActivitySummary: React.FC<EntityActivitySummaryProps> = ({
  items,
  columns = 4,
  className = '',
}) => {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-3 ${className}`}>
      {items.map((kpi) => {
        const Icon = kpi.icon;
        const colorVariants = {
          blue: {
            bg: 'bg-blue-50/70 border-blue-200/80 text-blue-900',
            iconBg: 'bg-blue-600 text-white',
            val: 'text-blue-950',
          },
          emerald: {
            bg: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
            iconBg: 'bg-emerald-600 text-white',
            val: 'text-emerald-950',
          },
          amber: {
            bg: 'bg-amber-50/70 border-amber-200/80 text-amber-900',
            iconBg: 'bg-amber-600 text-white',
            val: 'text-amber-950',
          },
          rose: {
            bg: 'bg-rose-50/70 border-rose-200/80 text-rose-900',
            iconBg: 'bg-rose-600 text-white',
            val: 'text-rose-950',
          },
          purple: {
            bg: 'bg-purple-50/70 border-purple-200/80 text-purple-900',
            iconBg: 'bg-purple-600 text-white',
            val: 'text-purple-950',
          },
          slate: {
            bg: 'bg-slate-50 border-slate-200 text-slate-800',
            iconBg: 'bg-slate-700 text-white',
            val: 'text-slate-900',
          },
        };
        const theme = colorVariants[kpi.colorVariant || 'slate'];

        return (
          <div
            key={kpi.id}
            className={`p-3.5 rounded-xl border shadow-xs transition-all hover:shadow-sm ${theme.bg}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">
                {kpi.label}
              </span>
              <div className={`p-1.5 rounded-lg shadow-2xs shrink-0 ${theme.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-xl font-black mt-1 tracking-tight truncate ${theme.val}`}>
              {kpi.value}
            </div>
            {kpi.sublabel && (
              <div className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                {kpi.sublabel}
              </div>
            )}
            {kpi.trend && (
              <div
                className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 ${
                  kpi.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                <span>{kpi.trend.value}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// 3. ENTITY SEARCH & FILTERS ROW
// ============================================================================
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface EntitySearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: FilterOption[];
  }[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: { id: string; label: string; count?: number }[];
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (mode: 'cards' | 'table') => void;
  className?: string;
}

export const EntitySearchFilters: React.FC<EntitySearchFiltersProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  filters,
  activeTab,
  onTabChange,
  tabs,
  viewMode,
  onViewModeChange,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Optional Top Tabs */}
      {tabs && onTabChange && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-semibold">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#0f2a4a] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Input & Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {filters?.map((f, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">{f.label}:</span>
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer text-xs"
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.count !== undefined ? `(${opt.count})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Cards vs Table switch */}
          {onViewModeChange && viewMode && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cartes
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tableau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. ENTITY DETAIL HEADER (SHOWROOM / MODAL HEADER)
// ============================================================================
interface EntityDetailHeaderProps {
  title: string;
  subtitle?: string;
  referenceId?: string;
  status?: UniversalStatus;
  statusLabel?: string;
  icon?: React.ElementType;
  avatarUrl?: string;
  onClose: () => void;
  actions?: React.ReactNode;
}

export const EntityDetailHeader: React.FC<EntityDetailHeaderProps> = ({
  title,
  subtitle,
  referenceId,
  status,
  statusLabel,
  icon: Icon = FileText,
  avatarUrl,
  onClose,
  actions,
}) => {
  return (
    <div className="bg-[#0f2a4a] text-white p-5 rounded-t-2xl relative shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
        title="Fermer la fiche"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4 pr-10">
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-emerald-400 flex items-center justify-center shadow-md shrink-0">
              <Icon className="w-7 h-7" />
            </div>
          )}

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {status && (
                <EntityStatusBadge status={status} label={statusLabel} size="sm" />
              )}
              {referenceId && (
                <span className="font-mono text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                  Réf: {referenceId}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
            {subtitle && <p className="text-xs text-slate-300 font-medium">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
};

// ============================================================================
// 5. ENTITY TABS (INTERNAL MODAL NAVIGATION)
// ============================================================================
export interface TabDef {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number | string;
}

interface EntityTabsProps {
  tabs: TabDef[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const EntityTabs: React.FC<EntityTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-slate-200 overflow-x-auto px-6 pt-3 text-xs font-semibold ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`pb-3 px-3.5 border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              isActive
                ? 'border-blue-600 text-blue-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// 6. ENTITY RELATIONS (CROSS-MODULE LINKS)
// ============================================================================
export interface RelationItem {
  id: string;
  module: AppModule;
  entityId: string;
  title: string;
  subtitle?: string;
  status?: string;
  icon?: React.ElementType;
}

interface EntityRelationsProps {
  relations: RelationItem[];
  onNavigate?: (module: AppModule, entityId?: string) => void;
  emptyMessage?: string;
  className?: string;
}

export const EntityRelations: React.FC<EntityRelationsProps> = ({
  relations,
  onNavigate,
  emptyMessage = 'Aucune relation liée enregistrée.',
  className = '',
}) => {
  if (relations.length === 0) {
    return (
      <div className={`p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  const moduleIcons: Record<string, React.ElementType> = {
    vehicles: Car,
    drivers: User,
    maintenance: Wrench,
    stock: Boxes,
    rentals: KeyRound,
    reservations: Calendar,
    sales: FileText,
    billing: Receipt,
    cash: Wallet,
    crm: Building,
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`}>
      {relations.map((rel) => {
        const Icon = rel.icon || moduleIcons[rel.module] || ExternalLink;
        return (
          <div
            key={rel.id}
            onClick={() => onNavigate && onNavigate(rel.module, rel.entityId)}
            className={`p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-3 shadow-2xs ${
              onNavigate ? 'cursor-pointer group hover:border-blue-400' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800 transition shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-900">
                  {rel.title}
                </div>
                {rel.subtitle && (
                  <div className="text-[11px] text-slate-500 truncate">{rel.subtitle}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {rel.status && <EntityStatusBadge status={rel.status} size="sm" />}
              {onNavigate && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// 7. ENTITY TIMELINE (CHRONOLOGICAL EVENT TRAIL)
// ============================================================================
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  authorName?: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'STATUS_CHANGE';
}

interface EntityTimelineProps {
  events: TimelineEvent[];
  emptyMessage?: string;
  className?: string;
}

export const EntityTimeline: React.FC<EntityTimelineProps> = ({
  events,
  emptyMessage = 'Aucun événement dans l’historique chronologique.',
  className = '',
}) => {
  if (events.length === 0) {
    return (
      <div className={`p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 ${className}`}>
      {events.map((evt) => {
        const dotColors = {
          INFO: 'bg-blue-600 border-white',
          SUCCESS: 'bg-emerald-600 border-white',
          WARNING: 'bg-amber-500 border-white',
          DANGER: 'bg-rose-600 border-white',
          STATUS_CHANGE: 'bg-purple-600 border-white',
        }[evt.type || 'INFO'];

        return (
          <div key={evt.id} className="relative group">
            {/* Dot */}
            <div
              className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 shadow-2xs ${dotColors}`}
            />
            <div className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 transition text-xs space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-slate-900">{evt.title}</span>
                <span className="text-[10px] text-slate-500 font-mono">{evt.date}</span>
              </div>
              {evt.description && (
                <p className="text-slate-600 text-[11px] leading-relaxed">{evt.description}</p>
              )}
              {evt.authorName && (
                <div className="text-[10px] text-slate-400 font-medium">Par : {evt.authorName}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// 8. EMPTY, LOADING, ERROR & PERMISSION DENIED STATES
// ============================================================================
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}) => {
  return (
    <div className={`p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        {description && <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{description}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Chargement des données en cours...',
  className = '',
}) => {
  return (
    <div className={`p-12 text-center text-slate-500 text-xs space-y-3 ${className}`}>
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
      <p className="font-semibold">{message}</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3 ${className}`}>
      <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
      <div>
        <h4 className="font-bold text-rose-900 text-sm">{title}</h4>
        <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs cursor-pointer"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export const PermissionDeniedState: React.FC<{
  moduleName?: string;
  requiredAction?: string;
  className?: string;
}> = ({
  moduleName = 'ce module',
  requiredAction = 'lecture',
  className = '',
}) => {
  return (
    <div className={`p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-sm">Accès Refusé</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
          Votre compte ne dispose pas des droits nécessaires ({requiredAction}) pour consulter ou modifier {moduleName}.
          Veuillez contacter un administrateur système si vous devez y accéder.
        </p>
      </div>
    </div>
  );
};
