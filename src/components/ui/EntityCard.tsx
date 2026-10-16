/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Carte Entité Homogène (Showroom & Listes)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { EntityStatusBadge, UniversalStatus } from './EntityComponents.tsx';

export interface EntityCardMetric {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  highlight?: boolean;
}

interface EntityCardProps {
  title: string;
  subtitle?: string;
  referenceId?: string;
  imageUrl?: string;
  fallbackIcon?: React.ElementType;
  status?: UniversalStatus;
  statusLabel?: string;
  badge?: React.ReactNode;
  metrics?: EntityCardMetric[];
  quickActions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  referenceId,
  imageUrl,
  fallbackIcon: FallbackIcon,
  status,
  statusLabel,
  badge,
  metrics,
  quickActions,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden text-left ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {/* Visual Header / Thumbnail */}
      {imageUrl ? (
        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
            {status && <EntityStatusBadge status={status} label={statusLabel} size="sm" />}
            {badge}
          </div>

          {referenceId && (
            <div className="absolute bottom-2.5 left-2.5 font-mono text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
              {referenceId}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 pb-2 border-b border-slate-100 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {FallbackIcon && (
              <div className="p-2 rounded-xl bg-blue-50 text-blue-800 shrink-0">
                <FallbackIcon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              {referenceId && (
                <div className="font-mono text-[10px] text-slate-400 font-bold uppercase truncate">
                  {referenceId}
                </div>
              )}
              <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-900 transition-colors">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {status && <EntityStatusBadge status={status} label={statusLabel} size="sm" />}
            {badge}
          </div>
        </div>
      )}

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {imageUrl && (
          <div>
            <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-900 transition-colors">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{subtitle}</p>}
          </div>
        )}

        {!imageUrl && subtitle && (
          <p className="text-xs text-slate-500 font-medium -mt-1 line-clamp-2">{subtitle}</p>
        )}

        {/* Metrics Grid */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
            {metrics.map((m, idx) => {
              const MetricIcon = m.icon;
              return (
                <div key={idx} className="bg-slate-50/80 rounded-lg p-2 border border-slate-100/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 truncate">
                    {MetricIcon && <MetricIcon className="w-3 h-3 text-slate-400 shrink-0" />}
                    <span className="truncate">{m.label}</span>
                  </div>
                  <div
                    className={`font-black text-xs mt-0.5 truncate ${
                      typeof m.value === 'string' && (m.value.includes('FCFA') || m.value.includes('XAF'))
                        ? 'privacy-blur '
                        : ''
                    }${m.highlight ? 'text-blue-900' : 'text-slate-900'}`}
                  >
                    {m.value}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Card Footer: Quick Actions or Open CTA */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 text-blue-700 font-bold group-hover:text-blue-900 group-hover:translate-x-0.5 transition-transform text-[11px]">
            <span>Consulter la fiche 360°</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>

          {quickActions && (
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {quickActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
