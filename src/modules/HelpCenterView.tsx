/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Centre d'Aide & Procédures Opérationnelles (SOP)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { Language, translations } from '../services/i18n.ts';
import { HelpCircle, BookOpen, ShieldCheck, MapPin, Phone, AlertTriangle, FileText } from 'lucide-react';

interface HelpCenterViewProps {
  lang?: Language;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({ lang = 'fr' }) => {
  const t = translations[lang];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-600" />
            <span>{t.sop.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.sop.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
        {/* SOP 1: Location & Inspection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>{t.sop.rentalProcedure}</span>
          </div>
          <p className="leading-relaxed">{t.sop.step1}</p>
          <p className="leading-relaxed">{t.sop.step2}</p>
          <p className="leading-relaxed">{t.sop.step3}</p>
          <p className="leading-relaxed">{t.sop.step4}</p>
        </div>

        {/* SOP 2: Caisse & Rapprochement Espèces */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>{t.sop.cashRules}</span>
          </div>
          <p className="leading-relaxed">{t.sop.cashRule1}</p>
          <p className="leading-relaxed">{t.sop.cashRule2}</p>
          <p className="leading-relaxed">{t.sop.cashRule3}</p>
        </div>

        {/* Contacts d'Urgence Douala */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            <Phone className="w-4 h-4 text-rose-600" />
            <span>{lang === 'fr' ? 'Contacts Utiles & Assistance d’Urgence Douala' : 'Useful Contacts & Douala Emergency Roadside Assistance'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-600">
            <div>
              <div className="font-bold text-slate-900">Agence FCT Santa Barbara</div>
              <div>+237 699 45 88 12 / +237 677 32 10 99</div>
              <div className="text-[11px] text-slate-400">Permanence 7j/7 07h00 - 21h00</div>
            </div>
            <div>
              <div className="font-bold text-slate-900">Assistance Dépannage Douala</div>
              <div>Garage Agréé CFAO Bassa : +237 233 42 11 00</div>
              <div className="text-[11px] text-slate-400">Remorquage &amp; Intervention rapide</div>
            </div>
            <div>
              <div className="font-bold text-slate-900">Commissariat Bonamoussadi</div>
              <div>117 / +237 233 47 00 00</div>
              <div className="text-[11px] text-slate-400">En cas d'accident ou de litige tiers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
