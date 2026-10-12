/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Grille de Billetage Officielle BEAC / CEMAC (XAF)
 * Douala, Cameroun - Conformité Caisse Physique & Contrôle Contradictoire
 */

import React, { useState, useEffect } from 'react';
import { formatXAF } from '../../../packages/business-rules/index.ts';
import { Banknote, Coins, RotateCcw, Calculator } from 'lucide-react';
import { Language, translations } from '../../services/i18n.ts';

export interface DenominationBreakdown {
  b10000: number;
  b5000: number;
  b2000: number;
  b1000: number;
  b500: number;
  c500: number;
  c100: number;
  c50: number;
  c25: number;
}

export const INITIAL_BREAKDOWN: DenominationBreakdown = {
  b10000: 0,
  b5000: 0,
  b2000: 0,
  b1000: 0,
  b500: 0,
  c500: 0,
  c100: 0,
  c50: 0,
  c25: 0,
};

const DENOMINATIONS: Array<{
  key: keyof DenominationBreakdown;
  label: string;
  value: number;
  type: 'note' | 'coin';
}> = [
  { key: 'b10000', label: '10 000 FCFA', value: 10000, type: 'note' },
  { key: 'b5000', label: '5 000 FCFA', value: 5000, type: 'note' },
  { key: 'b2000', label: '2 000 FCFA', value: 2000, type: 'note' },
  { key: 'b1000', label: '1 000 FCFA', value: 1000, type: 'note' },
  { key: 'b500', label: '500 FCFA (Billet)', value: 500, type: 'note' },
  { key: 'c500', label: '500 FCFA (Pièce)', value: 500, type: 'coin' },
  { key: 'c100', label: '100 FCFA', value: 100, type: 'coin' },
  { key: 'c50', label: '50 FCFA', value: 50, type: 'coin' },
  { key: 'c25', label: '25 FCFA', value: 25, type: 'coin' },
];

export function calculateTotalBreakdown(breakdown: DenominationBreakdown): number {
  return DENOMINATIONS.reduce((sum, item) => sum + (breakdown[item.key] || 0) * item.value, 0);
}

export function generateBreakdownSummary(breakdown: DenominationBreakdown, lang: Language = 'fr'): string {
  const parts: string[] = [];
  DENOMINATIONS.forEach((d) => {
    const qty = breakdown[d.key] || 0;
    if (qty > 0) {
      parts.push(`${qty}x${d.label.replace(' FCFA', '')}`);
    }
  });
  const total = calculateTotalBreakdown(breakdown);
  return parts.length > 0 ? `[${lang === 'en' ? 'Cash Breakdown' : 'Billetage'}: ${parts.join(', ')} = ${formatXAF(total)}]` : '';
}

interface CashDenominationGridProps {
  onTotalChange?: (total: number, summary: string) => void;
  expectedBalanceXAF?: number;
  showDiscrepancy?: boolean;
  lang?: Language;
}

export const CashDenominationGrid: React.FC<CashDenominationGridProps> = ({
  onTotalChange,
  expectedBalanceXAF,
  showDiscrepancy = false,
  lang = 'fr',
}) => {
  const t = translations[lang];
  const [breakdown, setBreakdown] = useState<DenominationBreakdown>(INITIAL_BREAKDOWN);

  const total = calculateTotalBreakdown(breakdown);
  const summary = generateBreakdownSummary(breakdown, lang);

  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(total, summary);
    }
  }, [total, summary, onTotalChange]);

  const handleQtyChange = (key: keyof DenominationBreakdown, val: string) => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setBreakdown((prev) => ({
      ...prev,
      [key]: parsed,
    }));
  };

  const handleReset = () => {
    setBreakdown(INITIAL_BREAKDOWN);
  };

  const discrepancy = expectedBalanceXAF !== undefined ? total - expectedBalanceXAF : undefined;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
          <Calculator className="w-4 h-4 text-blue-700" />
          <span>{t.cashPage.denominationTitle}</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition"
          title={t.cashPage.resetCounters}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.cashPage.resetCounters}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {DENOMINATIONS.map((d) => {
          const qty = breakdown[d.key] || 0;
          const subtotal = qty * d.value;
          const label =
            d.key === 'b500'
              ? `500 FCFA (${t.cashPage.noteBillet})`
              : d.key === 'c500'
              ? `500 FCFA (${t.cashPage.coinPiece})`
              : d.label;

          return (
            <div
              key={d.key}
              className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs gap-2"
            >
              <div className="flex items-center gap-1.5 min-w-[100px]">
                {d.type === 'note' ? (
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span className="font-semibold text-slate-700 text-[11px] whitespace-nowrap">{label}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={qty === 0 ? '' : qty}
                  placeholder="0"
                  onChange={(e) => handleQtyChange(d.key, e.target.value)}
                  className="w-14 text-center py-1 px-1 text-xs font-bold rounded border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <span className="text-[11px] font-bold text-slate-500 min-w-[70px] text-right">
                  {subtotal > 0 ? formatXAF(subtotal) : '-'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé du Billetage */}
      <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-xs">
          <span className="text-slate-500 font-medium">{t.cashPage.totalCounted} </span>
          <span className="font-black text-slate-900 text-sm ml-1">{formatXAF(total)}</span>
        </div>

        {showDiscrepancy && discrepancy !== undefined && (
          <div className="text-xs font-bold">
            {discrepancy === 0 ? (
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {t.cashPage.perfectBalance}
              </span>
            ) : discrepancy > 0 ? (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                {t.cashPage.surplus} +{formatXAF(discrepancy)}
              </span>
            ) : (
              <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                {t.cashPage.shortage} {formatXAF(discrepancy)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
