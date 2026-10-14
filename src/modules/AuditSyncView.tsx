/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Journal d'Audit & Synchronisation Hors-ligne
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { History, Wifi, WifiOff, RefreshCw, CheckCircle2, Clock, AlertTriangle, ShieldCheck, User } from 'lucide-react';

interface AuditSyncViewProps {
  state: DatabaseState;
  lang: Language;
}

export const AuditSyncView: React.FC<AuditSyncViewProps> = ({ state, lang }) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const pendingItems = state.syncQueue.filter((q) => q.status === 'PENDING');

  const handleForceSync = () => {
    dbStore.triggerSync();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            <span>{t.auditPage.title} &amp; {t.auditPage.outboxQueue}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.auditPage.subtitle}
          </p>
        </div>

        <button
          onClick={handleForceSync}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t.auditPage.forceSyncBtn}</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              state.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {state.isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">
              {state.isOnline ? t.auditPage.onlineConnected : t.auditPage.offlineMode}
            </div>
            <div className="text-xs text-slate-500">
              {pendingItems.length === 0
                ? t.auditPage.allWritesSynced
                : `${pendingItems.length} ${t.auditPage.pendingOutboxOps}`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.auditPage.outboxStatus}</span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              pendingItems.length > 0
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {pendingItems.length > 0 ? `${pendingItems.length} ${t.auditPage.pendingBadge}` : t.auditPage.syncedBadge}
          </span>
        </div>
      </div>

      {/* Audit Logs Table or Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-sm text-slate-900 block">
              {t.auditPage.auditLogTitle} ({state.auditLogs.length} {t.auditPage.actionsTracked})
            </span>
            <span className="text-[11px] text-slate-500">
              {t.auditPage.timezoneNotice}
            </span>
          </div>

          {/* Switch Cartes vs Tableau */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'en' ? 'Cards' : 'Cartes'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'en' ? 'Table' : 'Tableau'}
            </button>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {state.auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{log.userName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{log.userRole}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      log.action === 'CREATE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.action === 'REVERSAL'
                        ? 'bg-amber-100 text-amber-800'
                        : log.action === 'CLOSE_SESSION'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.action}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">Module : {log.module}</span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium text-[11px] line-clamp-2">
                    {log.details}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{new Date(log.timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}</span>
                  <span className="truncate max-w-[140px]">{log.idempotencyKey}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t.auditPage.colDateTime}</th>
                  <th className="py-3 px-4">{t.auditPage.colStaff}</th>
                  <th className="py-3 px-4">{t.auditPage.colRole}</th>
                  <th className="py-3 px-4">{t.auditPage.colAction}</th>
                  <th className="py-3 px-4">{t.auditPage.colModule}</th>
                  <th className="py-3 px-4">{t.auditPage.colDetails}</th>
                  <th className="py-3 px-4">{t.auditPage.colIdempotency}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[10px]">{log.userRole}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'REVERSAL'
                            ? 'bg-amber-100 text-amber-800'
                            : log.action === 'CLOSE_SESSION'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{log.module}</td>
                    <td className="py-3 px-4 text-slate-800">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{log.idempotencyKey}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
