/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Composant Cadre Showroom Pleine Page (Niveau B)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React from 'react';
import { ArrowLeft, Printer, Share2, LucideIcon } from 'lucide-react';
import { EntityTabs, EntityStatusBadge } from './EntityComponents.tsx';
import { printElementById } from '../../utils/printDocument.ts';
import { isNativeMobile } from '../../services/mobileFileService.ts';
import { Share } from '@capacitor/share';
import { Language } from '../../services/i18n.ts';


export interface ShowroomKpiItem {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  sublabel?: string;
  highlight?: boolean;
}

export interface ShowroomTabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string;
}

interface EntityShowroomLayoutProps {
  backLabel: string;
  onBack: () => void;
  title: string;
  subtitle?: string;
  referenceId?: string;
  status?: string;
  statusLabel?: string;
  avatarIcon?: LucideIcon;
  avatarText?: string;
  avatarImageUrl?: string;
  actions?: React.ReactNode;
  kpis?: ShowroomKpiItem[];
  tabs?: ShowroomTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  lang?: Language;
}

export const EntityShowroomLayout: React.FC<EntityShowroomLayoutProps> = ({
  backLabel,
  onBack,
  title,
  subtitle,
  referenceId,
  status,
  statusLabel,
  avatarIcon: AvatarIcon,
  avatarText,
  avatarImageUrl,
  actions,
  kpis = [],
  tabs = [],
  activeTab,
  onTabChange,
  children,
  lang = 'fr',
}) => {
  const isEn = lang === 'en';
  return (
    <div id="fct-showroom-printable-content" className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Barre d'outils supérieure de navigation (Pleine Page) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 no-print">
        {/* Bouton retour + Fil d'ariane contextuel */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{backLabel}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-1">
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800 truncate max-w-xs">{title}</span>
            {referenceId && (
              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {referenceId}
              </span>
            )}
          </div>
        </div>

        {/* Actions rapides en haut à droite */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {actions}
          <button
            type="button"
            onClick={async () => {
              if (isNativeMobile()) {
                try {
                  await Share.share({
                    title: `Fiche ${referenceId || title || 'Showroom'}`,
                    text: `Fiche Showroom FCT Automobile : ${title || 'Véhicule'} ${referenceId ? `(Réf: ${referenceId})` : ''}`,
                    url: window.location.href,
                    dialogTitle: isEn ? 'Share showroom sheet' : 'Partager la fiche showroom',
                  });
                  return;
                } catch (err) {
                  console.warn('Partage fiche showroom annulé:', err);
                }
              }
              printElementById('fct-showroom-printable-content', `Fiche_${referenceId || title || 'Showroom'}`);
            }}
            title={isEn ? (isNativeMobile() ? 'Share sheet' : 'Print sheet') : (isNativeMobile() ? 'Partager la fiche' : 'Imprimer la fiche')}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            {isNativeMobile() ? (
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden md:inline">
              {isEn ? (isNativeMobile() ? 'Share Sheet' : 'Print Sheet') : (isNativeMobile() ? 'Partager Fiche' : 'Imprimer Fiche')}
            </span>
          </button>

        </div>
      </div>

      {/* 2. Bandeau Hero de l'Entité */}
      <div className="bg-[#0f2a4a] text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Avatar / Vignette */}
            {avatarImageUrl ? (
              <img
                src={avatarImageUrl}
                alt={title}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0 bg-slate-900"
              />
            ) : avatarText ? (
              <div className="w-16 h-16 rounded-2xl bg-white text-[#0f2a4a] font-black flex items-center justify-center text-2xl shadow-md shrink-0">
                {avatarText}
              </div>
            ) : AvatarIcon ? (
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-emerald-400 flex items-center justify-center shadow-md shrink-0">
                <AvatarIcon className="w-8 h-8" />
              </div>
            ) : null}

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {status && (
                  <EntityStatusBadge status={status} label={statusLabel} size="md" />
                )}
                {referenceId && (
                  <span className="font-mono text-xs text-blue-200 bg-white/10 px-2 py-0.5 rounded-md">
                    Réf : {referenceId}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-300">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Grille des KPIs de l'Entité si disponibles */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border backdrop-blur-xs transition ${
                    kpi.highlight
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {Icon && <Icon className="w-3.5 h-3.5 text-blue-300" />}
                    <span>{kpi.label}</span>
                  </div>
                  <div className="text-base sm:text-lg font-black mt-1 text-white">
                    {kpi.value}
                  </div>
                  {kpi.sublabel && (
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {kpi.sublabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Onglets de Navigation Interne */}
      {tabs.length > 0 && onTabChange && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs px-4 pt-3">
          <EntityTabs
            tabs={tabs}
            activeTab={activeTab || tabs[0]?.id}
            onChange={onTabChange}
          />
        </div>
      )}

      {/* 4. Contenu Principal Pleine Page */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
