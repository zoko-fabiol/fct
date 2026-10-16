/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Rapports & Exports Analytiques
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import React, { useState } from 'react';
import { DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { formatXAF } from '../../packages/business-rules/index.ts';
import { exportCollectionToExcel } from '../utils/excelExport.ts';
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
  const t = translations[lang];
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

  // Exports Excel Professionnels FCT
  const exportVehiclesExcel = () => {
    exportCollectionToExcel({
      filename: `FCT_Parc_Vehicules_Douala_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Parc Véhicules',
      title: 'FCT AUTOMOBILE DOUALA — ÉTAT ANALYTIQUE DU PARC AUTOMOBILE',
      subtitle: `Export officiel certifié FCT • ${state.vehicles.length} véhicule(s) enregistrés`,
      columns: [
        { header: 'ID', key: 'id', width: 14 },
        { header: lang === 'en' ? 'License Plate' : 'Immatriculation', key: 'licensePlate', width: 18 },
        { header: lang === 'en' ? 'Make' : 'Marque', key: 'brand', width: 18 },
        { header: lang === 'en' ? 'Model' : 'Modèle', key: 'model', width: 22 },
        { header: t.reportsPage.colCategory, key: 'category', width: 16 },
        { header: lang === 'en' ? 'Year' : 'Année', key: 'year', width: 10 },
        { header: t.reportsPage.colStatus, key: 'status', width: 14 },
        { header: `${t.reportsPage.colDailyRate} (XAF)`, key: 'rentalDailyRate', width: 18 },
        { header: lang === 'en' ? 'Sale Price (XAF)' : 'Prix Vente (XAF)', key: 'salePrice', width: 18 },
        { header: `${t.reportsPage.colMileage} (km)`, key: 'mileage', width: 16 },
      ],
      data: state.vehicles,
    });
  };

  const exportCashMovementsExcel = () => {
    exportCollectionToExcel({
      filename: `FCT_Journal_Caisse_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Journal Caisse',
      title: 'FCT AUTOMOBILE DOUALA — JOURNAL ANALYTIQUE DE CAISSE XAF',
      subtitle: `Export officiel certifié FCT • ${state.cashMovements.length} mouvement(s)`,
      columns: [
        { header: lang === 'en' ? 'Receipt #' : 'N° Reçu', key: 'receiptNumber', width: 16 },
        { header: lang === 'en' ? 'Date & Time' : 'Date & Heure', key: 'createdAt', width: 22 },
        { header: lang === 'en' ? 'Flow' : 'Flux', key: 'type', width: 12 },
        { header: t.reportsPage.colCategory, key: 'category', width: 20 },
        { header: lang === 'en' ? 'Payer / Payee' : 'Tiers Payeur / Bénéficiaire', key: 'receivedFromOrPaidTo', width: 28 },
        { header: lang === 'en' ? 'Amount (XAF)' : 'Montant (XAF)', key: 'amountXAF', width: 18 },
        { header: lang === 'en' ? 'Cashier' : 'Caissier', key: 'performedByName', width: 20 },
        { header: lang === 'en' ? 'Operation Reason' : 'Motif de l\'opération', key: 'reason', width: 32 },
      ],
      data: state.cashMovements,
    });
  };

  const exportInvoicesExcel = () => {
    exportCollectionToExcel({
      filename: `FCT_Factures_Creances_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Factures & Créances',
      title: 'FCT AUTOMOBILE DOUALA — REGISTRE DES FACTURES & CRÉANCES',
      subtitle: `Export officiel certifié FCT • ${state.invoices.length} facture(s)`,
      columns: [
        { header: lang === 'en' ? 'Invoice #' : 'N° Facture', key: 'invoiceNumber', width: 16 },
        { header: lang === 'en' ? 'Type' : 'Type', key: 'type', width: 14 },
        { header: lang === 'en' ? 'Customer' : 'Client', key: 'customerName', width: 26 },
        { header: lang === 'en' ? 'Issue Date' : 'Date Émission', key: 'issueDate', width: 14 },
        { header: lang === 'en' ? 'Due Date' : 'Date Échéance', key: 'dueDate', width: 14 },
        { header: lang === 'en' ? 'Total (XAF)' : 'Total (XAF)', key: 'totalAmountXAF', width: 18 },
        { header: lang === 'en' ? 'Paid (XAF)' : 'Réglé (XAF)', key: 'paidAmountXAF', width: 18 },
        { header: lang === 'en' ? 'Balance Due (XAF)' : 'Solde Dû (XAF)', key: 'balanceXAF', width: 18 },
        { header: t.reportsPage.colStatus, key: 'status', width: 14 },
      ],
      data: state.invoices,
    });
  };

  const exportMaintenanceExcel = () => {
    const data = state.maintenance.map((m) => ({
      ...m,
      partsCostXAF: m.partsUsed.reduce((sum, p) => sum + p.totalXAF, 0),
    }));

    exportCollectionToExcel({
      filename: `FCT_Maintenance_Atelier_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Maintenance Parc',
      title: 'FCT AUTOMOBILE DOUALA — BILAN ATELIER & ENTRETIEN DU PARC',
      subtitle: `Export officiel certifié FCT • ${state.maintenance.length} intervention(s)`,
      columns: [
        { header: lang === 'en' ? 'Record #' : 'N° Fiche', key: 'recordNumber', width: 16 },
        { header: t.reportsPage.colVehicle, key: 'vehicleName', width: 26 },
        { header: lang === 'en' ? 'License Plate' : 'Immatriculation', key: 'licensePlate', width: 18 },
        { header: lang === 'en' ? 'Date' : 'Date', key: 'startDate', width: 14 },
        { header: lang === 'en' ? 'Type' : 'Type Entretien', key: 'type', width: 16 },
        { header: lang === 'en' ? 'Workshop Garage' : 'Garage Prestataire', key: 'garageName', width: 24 },
        { header: lang === 'en' ? 'Parts (XAF)' : 'Pièces (XAF)', key: 'partsCostXAF', width: 16 },
        { header: lang === 'en' ? 'Labor (XAF)' : 'Main d\'œuvre (XAF)', key: 'laborCostXAF', width: 18 },
        { header: lang === 'en' ? 'Total (XAF)' : 'Total Intervention (XAF)', key: 'totalCostXAF', width: 22 },
        { header: t.reportsPage.colStatus, key: 'status', width: 14 },
      ],
      data,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>{t.reportsPage.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.reportsPage.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportVehiclesExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.reportsPage.exportFleetBtn}</span>
          </button>
          <button
            onClick={exportCashMovementsExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t.reportsPage.exportCashBtn}</span>
          </button>
          <button
            onClick={exportInvoicesExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.reportsPage.exportInvoicesBtn}</span>
          </button>
          <button
            onClick={exportMaintenanceExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
            <span>{t.reportsPage.exportMaintenanceBtn}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'FINANCE', label: t.reportsPage.tabFinance },
          { key: 'FLEET', label: t.reportsPage.tabFleet },
          { key: 'MAINTENANCE', label: t.reportsPage.tabMaintenance },
          { key: 'STOCK', label: t.reportsPage.tabStock },
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
              <div className="text-[10px] text-slate-400 uppercase font-black">{t.reportsPage.fleetAssets}</div>
              <div className="text-xl font-black text-slate-900 mt-1 privacy-blur">{formatXAF(totalFleetValue)}</div>
              <div className="text-[10px] text-slate-500 mt-1">{totalVehicles} {t.reportsPage.vehiclesAcquired}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-emerald-700 uppercase font-black">{t.reportsPage.collectedReceipts}</div>
              <div className="text-xl font-black text-emerald-700 mt-1 privacy-blur">{formatXAF(totalInflows)}</div>
              <div className="text-[10px] text-emerald-600 mt-1">{t.reportsPage.totalInflowsDesc}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-rose-700 uppercase font-black">{t.reportsPage.expensesOutflows}</div>
              <div className="text-xl font-black text-rose-700 mt-1 privacy-blur">{formatXAF(totalOutflows)}</div>
              <div className="text-[10px] text-rose-600 mt-1">{t.reportsPage.expensesDesc}</div>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-300 shadow-xs">
              <div className="text-[10px] text-emerald-800 uppercase font-black">{t.reportsPage.netOperatingCashflow}</div>
              <div className="text-xl font-black text-emerald-900 mt-1 privacy-blur">{formatXAF(netCashFlow)}</div>
              <div className="text-[10px] text-emerald-700 mt-1">{t.reportsPage.netCashflowDesc}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-700" />
                <span>{t.reportsPage.reconciliationTitle}</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">{t.reportsPage.totalInvoicedTtc}</span>
                  <span className="font-black text-slate-900 privacy-blur">{formatXAF(totalInvoiced)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">{t.reportsPage.totalInvoicedCollected}</span>
                  <span className="font-bold text-emerald-700 privacy-blur">{formatXAF(totalInvoiced - totalUnpaidReceivables)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">{t.reportsPage.pendingReceivables}</span>
                  <span className="font-black text-rose-700 privacy-blur">{formatXAF(totalUnpaidReceivables)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">{t.reportsPage.concludedSales}</span>
                  <span className="font-black text-blue-900 privacy-blur">{formatXAF(totalSalesConcluded)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>{t.reportsPage.crmPerformance}</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">{t.reportsPage.registeredLeads}</span>
                  <span className="font-bold text-slate-900">{totalLeadsCount}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">{t.reportsPage.convertedLeads}</span>
                  <span className="font-bold text-emerald-700">{convertedLeadsCount}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">{t.reportsPage.conversionRate}</span>
                  <span className="font-black text-emerald-800">
                    {totalLeadsCount > 0 ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) : 0} %
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">{t.reportsPage.activeClients}</span>
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
              <div className="text-[10px] text-emerald-700 uppercase font-black">{t.vehicleStatus.AVAILABLE}</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{availableCount}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <div className="text-[10px] text-blue-700 uppercase font-black">{t.vehicleStatus.RENTED}</div>
              <div className="text-2xl font-black text-blue-800 mt-1">{rentedCount}</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <div className="text-[10px] text-amber-700 uppercase font-black">{t.vehicleStatus.MAINTENANCE}</div>
              <div className="text-2xl font-black text-amber-800 mt-1">{maintenanceCount}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
              <div className="text-[10px] text-purple-700 uppercase font-black">{t.vehicleStatus.SOLD}</div>
              <div className="text-2xl font-black text-purple-800 mt-1">{soldCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span>{t.reportsPage.fleetInventoryTitle}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">{t.reportsPage.colVehicle}</th>
                    <th className="py-2.5 px-4">{t.reportsPage.colCategory}</th>
                    <th className="py-2.5 px-4">{t.reportsPage.colMileage}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colAcquisition}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colDailyRate}</th>
                    <th className="py-2.5 px-4 text-center">{t.reportsPage.colStatus}</th>
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
                          {t.vehicleStatus[v.status as keyof typeof t.vehicleStatus] || v.status}
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
              <div className="text-[10px] text-slate-400 uppercase font-black">{t.reportsPage.cumulatedWorkshopSpent}</div>
              <div className="text-xl font-black text-rose-700 mt-1">{formatXAF(totalMaintenanceSpent)}</div>
              <div className="text-[10px] text-slate-500 mt-1">{state.maintenance.length} {t.reportsPage.recordsRegistered}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-emerald-700 uppercase font-black">{t.reportsPage.completedRepairs}</div>
              <div className="text-xl font-black text-emerald-700 mt-1">{completedInterventions}</div>
              <div className="text-[10px] text-emerald-600 mt-1">{t.reportsPage.partsDeducted}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-amber-700 uppercase font-black">{t.reportsPage.inProgressRepairs}</div>
              <div className="text-xl font-black text-amber-700 mt-1">{inProgressInterventions}</div>
              <div className="text-[10px] text-amber-600 mt-1">{t.reportsPage.currentlyImmobilized}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>{t.reportsPage.maintenanceWearTitle}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">{t.reportsPage.colVehicle}</th>
                    <th className="py-2.5 px-4">{lang === 'en' ? 'License Plate' : 'Immatriculation'}</th>
                    <th className="py-2.5 px-4 text-center">{t.reportsPage.colInterventionCount}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colTotalMaintenance}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colAcquisitionRatio}</th>
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
              <div className="text-[10px] text-slate-400 uppercase font-black">{t.reportsPage.stockValorization}</div>
              <div className="text-xl font-black text-emerald-800 mt-1">{formatXAF(totalStockValorization)}</div>
              <div className="text-[10px] text-slate-500 mt-1">{state.stock.length} {t.reportsPage.itemReferences}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-rose-700 uppercase font-black">{t.reportsPage.itemsUnderAlert}</div>
              <div className="text-xl font-black text-rose-700 mt-1">{lowStockCount}</div>
              <div className="text-[10px] text-rose-600 mt-1">{t.reportsPage.urgentRestock}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{t.reportsPage.stockValuedInventory}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">{t.reportsPage.colCode}</th>
                    <th className="py-2.5 px-4">{t.reportsPage.colDesignation}</th>
                    <th className="py-2.5 px-4">{t.reportsPage.colCategory}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colInStock}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colMinThreshold}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colUnitCost}</th>
                    <th className="py-2.5 px-4 text-right">{t.reportsPage.colTotalValue}</th>
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
