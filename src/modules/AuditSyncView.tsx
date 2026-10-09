/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Journal d'Audit & Synchronisation Hors-ligne
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language } from '../services/i18n.ts';
import { History, Wifi, WifiOff, RefreshCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface AuditSyncViewProps {
  state: DatabaseState;
  lang: Language;
}

export const AuditSyncView: React.FC<AuditSyncViewProps> = ({ state, lang }) => {
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
            <span>Journal d'Audit &amp; File de Synchronisation Hors-ligne (Outbox)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutabilité des écritures, clés d'idempotence, détection des conflits et synchronisation IndexedDB vers Firestore
          </p>
        </div>

        <button
          onClick={handleForceSync}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Forcer Synchronisation Serveur</span>
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
              {state.isOnline ? 'Connectivité Réseau Établie' : 'Fonctionnement Hors-Ligne (Offline)'}
            </div>
            <div className="text-xs text-slate-500">
              {pendingItems.length === 0
                ? 'Toutes les écritures locales sont confirmées et synchronisées avec le serveur Cloud Firestore.'
                : `${pendingItems.length} opération(s) en attente dans la file Outbox locale.`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Statut Outbox</span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              pendingItems.length > 0
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {pendingItems.length > 0 ? `${pendingItems.length} En attente` : 'Synchronisé'}
          </span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">
            Journal d'Audit Intégral ({state.auditLogs.length} actions tracées)
          </span>
          <span className="text-xs text-slate-500">
            Horodatage normalisé Africa/Douala
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Date &amp; Heure</th>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Détails de l'Opération</th>
                <th className="py-3 px-4">Clé d'Idempotence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString('fr-FR', {
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
      </div>
    </div>
  );
};
