/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Rapports & Exports Analytiques
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import React, { useState } from 'react';
import { DatabaseState } from '../services/dbStore.ts';
import { Language } from '../services/i18n.ts';
import { formatXAF } from '../../packages/business-rules/index.ts';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Car,
  DollarSign,
  Wrench,
  Package,
  Users2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface ReportsViewProps {
  state: DatabaseState;
  lang: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state, lang }) => {
  const [activeTab, setActiveTab] = useState<'FINANCE' | 'FLEET' | 'MAINTENANCE' | 'STOCK'>('FINANCE');

  // 1. Finance & Cashflow
  const totalFleetValue = state.vehicles.reduce((acc, v) => acc + v.acquisitionCost, 0);
  const totalInflows = state.cashMovements
    .filter((m) => m.type === 'INFLOW' && !m.isReversal)
    .reduce((acc, m) => acc + m.amountXAF, 0);
  const totalOutflows = state.cashMovements
    .filter((m) => m.type === 'OUTFLOW' && !m.isReversal)
    .reduce((acc, m) => acc + m.amountXAF, 0);
  const netCashFlow = totalInflows - totalOutflows;

  const totalInvoiced = state.invoices
    .filter((i) => i.type === 'INVOICE')
    .reduce((acc, i) => acc + i.totalAmountXAF, 0);
  const totalUnpaidReceivables = state.invoices
    .filter((i) => i.type === 'INVOICE')
    .reduce((acc, i) => acc + i.balanceXAF, 0);

  // 2. Fleet Stats
  const totalVehicles = state.vehicles.length;
  const availableCount = state.vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const rentedCount = state.vehicles.filter((v) => v.status === 'RENTED').length;
  const maintenanceCount = state.vehicles.filter((v) => v.status === 'MAINTENANCE').length;
  const soldCount = state.vehicles.filter((v) => v.status === 'SOLD').length;

  // 3. Maintenance Stats
  const totalMaintenanceSpent = state.maintenance.reduce((acc, m) => acc + m.totalCostXAF, 0);
  const completedInterventions = state.maintenance.filter((m) => m.status === 'COMPLETED').length;
  const inProgressInterventions = state.maintenance.filter((m) => m.status === 'IN_PROGRESS').length;

  // Top vehicles by maintenance cost
  const vehicleMaintenanceCosts = state.vehicles
    .map((v) => {
      const vRecords = state.maintenance.filter((m) => m.vehicleId === v.id);
      const cost = vRecords.reduce((acc, m) => acc + m.totalCostXAF, 0);
      return {
        vehicle: v,
        count: vRecords.length,
        totalCost: cost,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  // 4. Stock Stats
  const totalStockValorization = state.stock.reduce((acc, s) => acc + s.quantityInStock * s.unitCostXAF, 0);
  const lowStockCount = state.stock.filter((s) => s.quantityInStock <= s.minThresholdAlert).length;

  // 5. Commercial Pipeline
  const totalSalesConcluded = state.sales.reduce((acc, s) => acc + s.negotiatedPriceXAF, 0);
  const totalLeadsCount = state.leads?.length || 0;
  const convertedLeadsCount = state.leads?.filter((l) => l.stage === 'CONVERTED').length || 0;

  // CSV Exports
  const exportVehiclesCSV = () => {
    const headers = 'ID,Plaque,Marque,Modele,Categorie,Annee,Statut,TarifJourXAF,PrixVenteXAF,Kilometrage\n';
    const rows = state.vehicles
      .map(
        (v) =>
          `"${v.id}","${v.licensePlate}","${v.brand}","${v.model}","${v.category}",${v.year},"${v.status}",${v.rentalDailyRate},${v.salePrice},${v.mileage}`
      )
      .join('\n');
    downloadCSV(headers + rows, 'fct_parc_vehicules_douala.csv');
  };

  const exportCashMovementsCSV = () => {
    const headers = 'Recu,Date,Type,Categorie,Tiers,MontantXAF,Caissier,EstContrePassation,Motif\n';
    const rows = state.cashMovements
      .map(
        (m) =>
          `"${m.receiptNumber}","${m.createdAt}","${m.type}","${m.category}","${m.receivedFromOrPaidTo}",${m.amountXAF},"${m.performedByName}",${m.isReversal},"${m.reason || ''}"`
      )
      .join('\n');
    downloadCSV(headers + rows, 'fct_journal_caisse_xaf.csv');
  };

  const exportInvoicesCSV = () => {
    const headers = 'Numero,Type,Client,DateEmission,Echeance,MontantTotalXAF,PayeXAF,SoldeXAF,Statut\n';
    const rows = state.invoices
      .map(
        (i) =>
          `"${i.invoiceNumber}","${i.type}","${i.customerName}","${i.issueDate}","${i.dueDate}",${i.totalAmountXAF},${i.paidAmountXAF},${i.balanceXAF},"${i.status}"`
      )
      .join('\n');
    downloadCSV(headers + rows, 'fct_factures_et_creances.csv');
  };

  const exportMaintenanceCSV = () => {
    const headers = 'Numero,Vehicule,Immatriculation,Date,Type,Prestataire,Statut,PiecesXAF,MainOeuvreXAF,TotalXAF\n';
    const rows = state.maintenance
      .map(
        (m) => {
          const partsCost = m.partsUsed.reduce((sum, p) => sum + p.totalXAF, 0);
          return `"${m.recordNumber}","${m.vehicleName}","${m.licensePlate}","${m.startDate}","${m.type}","${m.garageName}","${m.status}",${partsCost},${m.laborCostXAF},${m.totalCostXAF}`;
        }
      )
      .join('\n');
    downloadCSV(headers + rows, 'fct_bilan_maintenance_parc.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Rapports Financiers &amp; Exports Analytiques</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bilan d'exploitation XAF, rentabilité de la flotte, analyse des coûts d'entretien et exports certifiés
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportVehiclesCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Parc (CSV)</span>
          </button>
          <button
            onClick={exportCashMovementsCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Caisse (CSV)</span>
          </button>
          <button
            onClick={exportInvoicesCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Factures (CSV)</span>
          </button>
          <button
            onClick={exportMaintenanceCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Maintenance (CSV)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'FINANCE', label: 'Bilan Financier & Trésorerie' },
          { key: 'FLEET', label: 'Exploitation du Parc' },
          { key: 'MAINTENANCE', label: 'Coûts & Bilan Santé Atelier' },
          { key: 'STOCK', label: 'Valorisation Stock de Pièces' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-2.5 px-3 transition cursor-pointer ${
              activeTab === tab.key
                ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Finance */}
      {activeTab === 'FINANCE' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-black">Actifs Flotte (Acquisition)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{formatXAF(totalFleetValue)}</div>
              <div className="text-[10px] text-slate-500 mt-1">{totalVehicles} véhicules acquis</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-emerald-700 uppercase font-black">Recettes Caisse Encaissées</div>
              <div className="text-xl font-black text-emerald-700 mt-1">{formatXAF(totalInflows)}</div>
              <div className="text-[10px] text-emerald-600 mt-1">Total flux entrants effectifs</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-rose-700 uppercase font-black">Dépenses &amp; Décaissements</div>
              <div className="text-xl font-black text-rose-700 mt-1">{formatXAF(totalOutflows)}</div>
              <div className="text-[10px] text-rose-600 mt-1">Carburant, entretien, fournitures</div>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-300 shadow-xs">
              <div className="text-[10px] text-emerald-800 uppercase font-black">Flux Net d'Exploitation</div>
              <div className="text-xl font-black text-emerald-900 mt-1">{formatXAF(netCashFlow)}</div>
              <div className="text-[10px] text-emerald-700 mt-1">Trésorerie nette générée</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-700" />
                <span>Rapprochement Facturation vs Encaissements</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Total Facturé (TTC) :</span>
                  <span className="font-black text-slate-900">{formatXAF(totalInvoiced)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Total Encaissé sur Factures :</span>
                  <span className="font-bold text-emerald-700">{formatXAF(totalInvoiced - totalUnpaidReceivables)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Créances Clients en Attente :</span>
                  <span className="font-black text-rose-700">{formatXAF(totalUnpaidReceivables)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Ventes Véhicules Conclues :</span>
                  <span className="font-black text-blue-900">{formatXAF(totalSalesConcluded)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>Performance Commerciale CRM</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Prospects Enregistrés :</span>
                  <span className="font-bold text-slate-900">{totalLeadsCount}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Prospects Convertis en Clients :</span>
                  <span className="font-bold text-emerald-700">{convertedLeadsCount}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Taux de Conversion Commerciale :</span>
                  <span className="font-black text-emerald-800">
                    {totalLeadsCount > 0 ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) : 0} %
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Clients Actifs FCT :</span>
                  <span className="font-bold text-blue-900">{state.customers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fleet */}
      {activeTab === 'FLEET' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <div className="text-[10px] text-emerald-700 uppercase font-black">Disponibles</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{availableCount}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <div className="text-[10px] text-blue-700 uppercase font-black">En Location</div>
              <div className="text-2xl font-black text-blue-800 mt-1">{rentedCount}</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <div className="text-[10px] text-amber-700 uppercase font-black">En Maintenance</div>
              <div className="text-2xl font-black text-amber-800 mt-1">{maintenanceCount}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
              <div className="text-[10px] text-purple-700 uppercase font-black">Vendus</div>
              <div className="text-2xl font-black text-purple-800 mt-1">{soldCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Inventaire &amp; Rentrabilité Flotte Automobile FCT</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Véhicule</th>
                    <th className="py-2.5 px-4">Catégorie</th>
                    <th className="py-2.5 px-4">Kilométrage</th>
                    <th className="py-2.5 px-4 text-right">Acquisition (XAF)</th>
                    <th className="py-2.5 px-4 text-right">Tarif / Jour</th>
                    <th className="py-2.5 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {v.brand} {v.model} ({v.licensePlate})
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{v.category}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{v.mileage.toLocaleString()} km</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                        {formatXAF(v.acquisitionCost)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-700">
                        {formatXAF(v.rentalDailyRate)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.status === 'RENTED'
                              ? 'bg-blue-100 text-blue-800'
                              : v.status === 'MAINTENANCE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Maintenance */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-black">Dépenses Cumulées Atelier</div>
              <div className="text-xl font-black text-rose-700 mt-1">{formatXAF(totalMaintenanceSpent)}</div>
              <div className="text-[10px] text-slate-500 mt-1">{state.maintenance.length} interventions enregistrées</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-emerald-700 uppercase font-black">Interventions Terminées</div>
              <div className="text-xl font-black text-emerald-700 mt-1">{completedInterventions}</div>
              <div className="text-[10px] text-emerald-600 mt-1">Avec pièces déduites du stock</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-amber-700 uppercase font-black">Interventions en Cours</div>
              <div className="text-xl font-black text-amber-700 mt-1">{inProgressInterventions}</div>
              <div className="text-[10px] text-amber-600 mt-1">Véhicules actuellement immobilisés</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Coûts de Maintenance Cumulés par Véhicule (Bilan d'usure)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Véhicule</th>
                    <th className="py-2.5 px-4">Immatriculation</th>
                    <th className="py-2.5 px-4 text-center">Nombre d'Interventions</th>
                    <th className="py-2.5 px-4 text-right">Coût Total Entretien (XAF)</th>
                    <th className="py-2.5 px-4 text-right">% du Coût d'Acquisition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicleMaintenanceCosts.map(({ vehicle, count, totalCost }) => {
                    const ratio = vehicle.acquisitionCost > 0 ? (totalCost / vehicle.acquisitionCost) * 100 : 0;
                    return (
                      <tr key={vehicle.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {vehicle.brand} {vehicle.model}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{vehicle.licensePlate}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-blue-900">{count}</td>
                        <td className="py-2.5 px-4 text-right font-black text-rose-700">{formatXAF(totalCost)}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-700">{ratio.toFixed(1)} %</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Stock */}
      {activeTab === 'STOCK' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-black">Valorisation du Stock de Pièces</div>
              <div className="text-xl font-black text-emerald-800 mt-1">{formatXAF(totalStockValorization)}</div>
              <div className="text-[10px] text-slate-500 mt-1">{state.stock.length} références d'articles</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-rose-700 uppercase font-black">Articles Sous Seuil d'Alerte</div>
              <div className="text-xl font-black text-rose-700 mt-1">{lowStockCount}</div>
              <div className="text-[10px] text-rose-600 mt-1">À réapprovisionner d'urgence</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Inventaire Valorisé des Pièces &amp; Consommables</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Désignation</th>
                    <th className="py-2.5 px-4">Catégorie</th>
                    <th className="py-2.5 px-4 text-right">En Stock</th>
                    <th className="py-2.5 px-4 text-right">Seuil Min</th>
                    <th className="py-2.5 px-4 text-right">Coût Unitaire (XAF)</th>
                    <th className="py-2.5 px-4 text-right">Valeur Totale (XAF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.stock.map((it) => {
                    const isLow = it.quantityInStock <= it.minThresholdAlert;
                    return (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-900">{it.code}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{it.name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{it.category}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-black ${
                            isLow ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        >
                          {it.quantityInStock} {it.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500 font-medium">
                          {it.minThresholdAlert} {it.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-700">{formatXAF(it.unitCostXAF)}</td>
                        <td className="py-2.5 px-4 text-right font-black text-emerald-800">
                          {formatXAF(it.quantityInStock * it.unitCostXAF)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
