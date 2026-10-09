/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Dashboard & Executive Statistics
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { formatXAF } from '../../packages/business-rules/index.ts';
import { AppModule } from '../../packages/shared-types/index.ts';
import {
  Car,
  KeyRound,
  Wrench,
  Wallet,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate: (module: AppModule) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ state, lang, onNavigate }) => {
  const t = translations[lang];

  // Calculs statistiques
  const totalVehicles = state.vehicles.length;
  const availableVehicles = state.vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const rentedVehicles = state.vehicles.filter((v) => v.status === 'RENTED').length;
  const maintenanceVehicles = state.vehicles.filter((v) => v.status === 'MAINTENANCE').length;
  const occupancyRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

  const activeCashSession = state.cashSessions.find((s) => s.status === 'OPEN');
  const currentCashBalance = activeCashSession ? activeCashSession.calculatedExpectedBalanceXAF : 0;

  // Alertes Stock bas
  const lowStockCount = state.stock.filter((s) => s.quantityInStock <= s.minThresholdAlert).length;

  // Chiffre d'affaires total encaissé
  const totalInflows = state.cashMovements
    .filter((m) => m.type === 'INFLOW' && !m.isReversal)
    .reduce((acc, m) => acc + m.amountXAF, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Agency Welcome */}
      <div className="bg-gradient-to-r from-[#0f2a4a] via-[#1e3a8a] to-[#047857] rounded-xl p-5 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.dashboard.centralAgency}</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {t.dashboard.title}
          </h2>
          <p className="text-xs text-blue-100 max-w-xl mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('rentals')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.dashboard.newContract}</span>
          </button>
          <button
            onClick={() => onNavigate('cash')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>{t.dashboard.cashMovement}</span>
          </button>
          <button
            onClick={() => onNavigate('vehicles')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-600 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.dashboard.addVehicle}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Taux d'occupation Flotte */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.dashboard.fleetOccupancy}</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{occupancyRate}%</span>
            <span className="text-xs text-slate-500 font-semibold">
              ({rentedVehicles} / {totalVehicles} {t.dashboard.rentedCount})
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Solde Caisse Actif */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.dashboard.cashInRegister}</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700">
              {formatXAF(currentCashBalance)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            {activeCashSession ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Session {activeCashSession.sessionNumber} ({lang === 'fr' ? 'active' : 'open'})
              </span>
            ) : (
              <span className="text-rose-600 font-semibold">{t.noActiveSession}</span>
            )}
          </div>
        </div>

        {/* KPI 3: Total Encaissements */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.dashboard.totalCashInflows}</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">
              {formatXAF(totalInflows)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {lang === 'fr' ? 'Règlements locations et acomptes ventes' : 'Rental payments & sale advances'}
          </div>
        </div>

        {/* KPI 4: Alertes & Maintenance */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.dashboard.lowStockAlerts}</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-black text-rose-700">
              {maintenanceVehicles + lowStockCount}
            </span>
            <span className="text-xs text-slate-500">{t.dashboard.criticalAlerts}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{maintenanceVehicles} {lang === 'fr' ? 'en atelier' : 'in workshop'}</span>
            <span>{lowStockCount} {lang === 'fr' ? 'alertes pièces' : 'parts alerts'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Status & Operational Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fleet Status Breakdown & Active Rentals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Rentals Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Locations &amp; Missions en Cours</span>
              </div>
              <button
                onClick={() => onNavigate('rentals')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Voir tout</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Contrat</th>
                    <th className="py-2.5 px-4">Véhicule</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Période</th>
                    <th className="py-2.5 px-4 text-right">Montant</th>
                    <th className="py-2.5 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.contracts.map((ctr) => (
                    <tr key={ctr.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-blue-900">{ctr.contractNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{ctr.vehicleName}</div>
                        <div className="text-[10px] text-slate-400">{ctr.licensePlate}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{ctr.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{ctr.startDate} au {ctr.endDate}</div>
                        <div className="text-[10px] text-slate-400">{ctr.totalDays} jours</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatXAF(ctr.totalAmountXAF)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {t.rentalStatus[ctr.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Fleet Availability Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Disponibilité Immédiate - Agence Santa Barbara</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {state.vehicles.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {v.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          v.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'RENTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.vehicleStatus[v.status]}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">{v.brand} {v.model}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{v.licensePlate}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tarif / jour :</span>
                    <span className="font-bold text-emerald-700">{formatXAF(v.rentalDailyRate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Cash Session & Urgent Alerts */}
        <div className="space-y-6">
          {/* Cash Session Status Card */}
          <div className="bg-gradient-to-br from-[#0f2a4a] to-[#1e3a8a] text-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                État de Caisse Certifiée
              </span>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>

            {activeCashSession ? (
              <div className="space-y-3">
                <div className="text-2xl font-black text-white">
                  {formatXAF(activeCashSession.calculatedExpectedBalanceXAF)}
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Session :</span>
                    <span className="font-bold text-white">{activeCashSession.sessionNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ouverte par :</span>
                    <span>{activeCashSession.openedByName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fonds de départ :</span>
                    <span>{formatXAF(activeCashSession.openingBalanceXAF)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>Total Entrées :</span>
                    <span>+{formatXAF(activeCashSession.currentCashInXAF)}</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Total Sorties :</span>
                    <span>-{formatXAF(activeCashSession.currentCashOutXAF)}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('cash')}
                  className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer text-center block shadow"
                >
                  Gérer la Caisse &amp; Écritures
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-300 mb-3">
                  Aucune session de caisse n'est actuellement ouverte.
                </p>
                <button
                  onClick={() => onNavigate('cash')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Ouvrir une Session
                </button>
              </div>
            )}
          </div>

          {/* Recent Audit Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Journal d'Activité Récent</span>
              </span>
              <button
                onClick={() => onNavigate('audit')}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                Audit complet
              </button>
            </div>

            <div className="space-y-3">
              {state.auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{log.details}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{log.userName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
