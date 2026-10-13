/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Maintenance & Bilan de Santé 360°
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { MaintenanceRecord, StockItem, Vehicle, AppModule } from '../../packages/shared-types/index.ts';
import { formatXAF, hasEffectivePermission } from '../../packages/business-rules/index.ts';
import { DocumentPrintData } from '../components/DocumentModal.tsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { DocumentViewerModal } from '../components/ui/DocumentViewerModal.tsx';
import {
  EntityActivitySummary,
  EntitySearchFilters,
  EntityStatusBadge,
  EntityDetailHeader,
  EntityTabs,
  EntityRelations,
  EntityTimeline,
  EmptyState,
} from '../components/ui/EntityComponents.tsx';
import { EntityShowroomLayout } from '../components/ui/EntityShowroomLayout.tsx';
import { EntityCard } from '../components/ui/EntityCard.tsx';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  Car,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  Building,
  Printer,
  Boxes,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Gauge,
  FileText,
  Activity,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  DollarSign,
  ArrowRight,
  User,
} from 'lucide-react';

interface MaintenanceViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  onOpenPrintModal?: (data: DocumentPrintData) => void;
  contextRecordId?: string | null;
  contextEntityId?: string | null;
}

interface PartUsedItem {
  stockItemId?: string;
  name: string;
  quantity: number;
  unitPriceXAF: number;
  totalXAF: number;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  state,
  lang,
  onNavigate,
  onOpenPrintModal,
  contextRecordId,
  contextEntityId,
}) => {
  const currentUser = dbStore.getCurrentUser();
  const t = translations[lang];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Selected vehicle for health sheet banner
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(state.vehicles[0]?.id || '');
  const [isHealthSheetOpen, setIsHealthSheetOpen] = useState(false);

  // Showroom modal on click
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'PARTS' | 'VEHICLE' | 'DOCS' | 'TIMELINE'>('OVERVIEW');

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<MaintenanceRecord | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');

  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<MaintenanceRecord | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State for new intervention
  const [mntForm, setMntForm] = useState({
    vehicleId: state.vehicles[0]?.id || '',
    type: 'PREVENTIVE' as MaintenanceRecord['type'],
    garageName: state.settings?.defaultGarageName || 'Atelier Central CFAO Bassa Douala',
    description: 'Vidange moteur, changement des plaquettes et filtres',
    mileageAtService: state.vehicles[0]?.mileage || 50000,
    laborCostXAF: 35000,
    startDate: new Date().toISOString().split('T')[0],
  });

  const [partsList, setPartsList] = useState<PartUsedItem[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string>(state.stock[0]?.id || '');
  const [selectedPartQty, setSelectedPartQty] = useState<number>(1);

  // Auto-focus on context vehicle, stock part, or record if passed
  useEffect(() => {
    const targetId = contextEntityId || contextRecordId;
    if (targetId) {
      const targetMnt = state.maintenance.find((m) => m.id === targetId);
      if (targetMnt) {
        setSelectedVehicleId(targetMnt.vehicleId);
        setSelectedRecord(targetMnt);
        return;
      }

      const targetPart = state.stock.find((p) => p.id === targetId);
      if (targetPart) {
        setSelectedStockId(targetPart.id);
        setIsNewOrderModalOpen(true);
        return;
      }

      const targetVeh = state.vehicles.find((v) => v.id === targetId);
      if (targetVeh) {
        setSelectedVehicleId(targetVeh.id);
        setIsHealthSheetOpen(true);
        return;
      }
    }
  }, [contextEntityId, contextRecordId, state.maintenance, state.stock, state.vehicles]);

  // Selected vehicle health data
  const healthData = selectedVehicleId ? dbStore.getVehicleHealthSheet(selectedVehicleId) : null;
  const currentSelectedVehicle = state.vehicles.find((v) => v.id === selectedVehicleId);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return state.maintenance.filter((rec) => {
      const matchesSearch =
        rec.recordNumber.toLowerCase().includes(search.toLowerCase()) ||
        rec.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
        rec.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
        rec.garageName.toLowerCase().includes(search.toLowerCase()) ||
        rec.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || rec.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [state.maintenance, search, statusFilter, typeFilter]);

  // Top KPIs
  const totalInterventions = state.maintenance.length;
  const inProgressCount = state.maintenance.filter((m) => m.status === 'IN_PROGRESS').length;
  const scheduledCount = state.maintenance.filter((m) => m.status === 'SCHEDULED').length;
  const totalCost = state.maintenance.reduce((sum, m) => sum + (m.totalCostXAF || 0), 0);

  const kpis = [
    {
      id: 'kpi-total',
      label: lang === 'en' ? 'Workshop Files' : 'Dossiers Atelier',
      value: totalInterventions,
      sublabel: `${state.maintenance.filter((m) => m.status === 'COMPLETED').length} ${lang === 'en' ? 'completed' : 'clôturés'}`,
      icon: Wrench,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-active',
      label: t.maintenancePage.activeRepairs,
      value: inProgressCount,
      sublabel: lang === 'en' ? 'Active immobilization' : 'Immobilisation active',
      icon: Clock,
      colorVariant: inProgressCount > 0 ? ('amber' as const) : ('slate' as const),
    },
    {
      id: 'kpi-scheduled',
      label: t.maintenancePage.scheduledTab,
      value: scheduledCount,
      sublabel: lang === 'en' ? 'Upcoming garage bookings' : 'Prochains RDV CFAO/Garage',
      icon: Calendar,
      colorVariant: 'purple' as const,
    },
    {
      id: 'kpi-cost',
      label: t.maintenancePage.totalMaintenanceCost,
      value: formatXAF(totalCost),
      sublabel: 'Pièces & Main-d’œuvre XAF',
      icon: Boxes,
      colorVariant: 'emerald' as const,
    },
  ];

  // Handle adding part from stock
  const handleAddPartFromStock = () => {
    const stockItem = state.stock.find((s) => s.id === selectedStockId);
    if (!stockItem) return;

    if (selectedPartQty <= 0) {
      setFormError('La quantité doit être supérieure à zéro.');
      return;
    }

    if (selectedPartQty > stockItem.quantityInStock) {
      setFormError(
        `Stock insuffisant pour "${stockItem.name}" : Disponible ${stockItem.quantityInStock} ${stockItem.unit}, Requis ${selectedPartQty} ${stockItem.unit}.`
      );
      return;
    }

    setFormError(null);
    const existingIdx = partsList.findIndex((p) => p.stockItemId === stockItem.id);
    if (existingIdx !== -1) {
      const newQty = partsList[existingIdx].quantity + selectedPartQty;
      if (newQty > stockItem.quantityInStock) {
        setFormError(`Quantité cumulée (${newQty}) dépasse le stock disponible (${stockItem.quantityInStock}).`);
        return;
      }
      const updated = [...partsList];
      updated[existingIdx].quantity = newQty;
      updated[existingIdx].totalXAF = newQty * stockItem.unitCostXAF;
      setPartsList(updated);
    } else {
      setPartsList([
        ...partsList,
        {
          stockItemId: stockItem.id,
          name: `${stockItem.name} (${stockItem.code})`,
          quantity: selectedPartQty,
          unitPriceXAF: stockItem.unitCostXAF,
          totalXAF: selectedPartQty * stockItem.unitCostXAF,
        },
      ]);
    }
  };

  const handleRemovePart = (index: number) => {
    setPartsList(partsList.filter((_, i) => i !== index));
  };

  const calculatedPartsTotal = partsList.reduce((sum, p) => sum + p.totalXAF, 0);
  const calculatedGrandTotal = mntForm.laborCostXAF + calculatedPartsTotal;

  // Open modal prefilled
  const handleOpenNewOrder = (prefilledVehicleId?: string) => {
    const vehId = prefilledVehicleId || selectedVehicleId || state.vehicles[0]?.id || '';
    const veh = state.vehicles.find((v) => v.id === vehId);
    setMntForm({
      vehicleId: vehId,
      type: 'PREVENTIVE',
      garageName: state.settings?.defaultGarageName || 'Atelier Central CFAO Bassa Douala',
      description: 'Révision périodique, vidange et remplacement consommables',
      mileageAtService: veh?.mileage || 50000,
      laborCostXAF: 35000,
      startDate: new Date().toISOString().split('T')[0],
    });
    setPartsList([]);
    setFormError(null);
    setIsNewOrderModalOpen(true);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = state.vehicles.find((v) => v.id === mntForm.vehicleId);
    if (!vehicle) return;

    try {
      const newRec = dbStore.addMaintenanceRecord({
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
        licensePlate: vehicle.licensePlate,
        type: mntForm.type,
        garageName: mntForm.garageName,
        description: mntForm.description,
        mileageAtService: mntForm.mileageAtService,
        partsUsed: partsList,
        laborCostXAF: mntForm.laborCostXAF,
        totalCostXAF: calculatedGrandTotal,
        status: 'IN_PROGRESS',
        startDate: mntForm.startDate,
      });

      setIsNewOrderModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Dossier de maintenance ${newRec.recordNumber} créé. Véhicule ${vehicle.licensePlate} placé en atelier.`,
      });
      setTimeout(() => setActionAlert(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création');
    }
  };

  // Complete / Validate Maintenance with Atomic Stock Deduction
  const handleOpenCompleteModal = (rec: MaintenanceRecord) => {
    setCompleteTarget(rec);
    setCompleteNotes(rec.technicianNotes || 'Intervention validée, contrôle de fin de travaux satisfaisant.');
    setIsCompleteModalOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!completeTarget) return;
    try {
      const closed = dbStore.completeMaintenance(completeTarget.id, completeNotes);
      setIsCompleteModalOpen(false);
      setCompleteTarget(null);
      if (selectedRecord?.id === closed.id) {
        setSelectedRecord(closed);
      }
      setActionAlert({
        type: 'success',
        message: `Intervention ${closed.recordNumber} clôturée avec succès. Pièces déduites du stock et véhicule disponible.`,
      });
      setTimeout(() => setActionAlert(null), 5000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la clôture' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  // Export / Print Health Sheet
  const handlePrintHealthSheet = (veh: Vehicle) => {
    const sheet = dbStore.getVehicleHealthSheet(veh.id);
    if (!sheet || !onOpenPrintModal) return;

    const printData: DocumentPrintData = {
      title: 'BILAN DE SANTÉ & CARNET MÉCANIQUE DU VÉHICULE (FCT)',
      docNumber: `SANTE-${veh.licensePlate.replace(/[^A-Za-z0-9]/g, '')}-2026`,
      date: new Date().toISOString().split('T')[0],
      customerName: `Véhicule Flotte FCT : ${veh.brand} ${veh.model} (${veh.licensePlate})`,
      customerAddress: `Localisation : ${veh.currentLocation} | Kilométrage certifié : ${veh.mileage.toLocaleString()} km`,
      items: [
        {
          description: `Score de santé mécanique : ${sheet.healthScore}/100 - Avis : ${sheet.recommendation}`,
          qty: 1,
          unitPrice: 0,
          total: 0,
        },
        ...sheet.partsReplaced.map((p) => ({
          description: `Pièce remplacée [Dossier ${p.recordNumber}] : ${p.name} (${p.garageName})`,
          qty: p.quantity,
          unitPrice: p.unitPriceXAF,
          total: p.totalXAF,
        })),
        {
          description: `Main d'œuvre & révisions cumulées (${sheet.completedCount} interventions terminées)`,
          qty: 1,
          unitPrice: sheet.totalMaintenanceCostXAF,
          total: sheet.totalMaintenanceCostXAF,
        },
      ],
      totalAmountXAF: sheet.totalMaintenanceCostXAF,
      notes: `Fiche technique officielle Franchise Conseils Trading - Douala, Cameroun. Prochaine visite technique réglementaire : ${veh.nextTechnicalInspectionDate}.`,
    };

    onOpenPrintModal(printData);
  };

  const handleConfirmDelete = (reason: string) => {
    if (!deleteConfirmRecord) return;
    try {
      const num = deleteConfirmRecord.recordNumber;
      dbStore.deleteMaintenanceRecord(deleteConfirmRecord.id, reason);
      setDeleteConfirmRecord(null);
      if (selectedRecord?.id === deleteConfirmRecord.id) {
        setSelectedRecord(null);
      }
      setActionAlert({ type: 'success', message: `Dossier ${num} supprimé et archivé dans le journal d'audit.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'FACTURE_REPARATION',
    fileUrl: '',
    notes: '',
  });

  const handleAddDocumentToMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const newDoc = {
        id: `doc_mnt_${Date.now()}`,
        title: docForm.title || `Justificatif - ${selectedRecord.recordNumber}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        fileSizeMb: 1.8,
        fileType: "PDF / Facture d'Atelier",
        relatedEntityType: 'MAINTENANCE',
        relatedEntityId: selectedRecord.id,
        relatedMaintenanceId: selectedRecord.id,
        confidentialityLevel: 'INTERNAL',
        status: 'VALID',
        createdAt: new Date().toISOString().split('T')[0],
        notes: docForm.notes,
      };

      if ((dbStore as any).addDocument) {
        (dbStore as any).addDocument(newDoc);
      } else {
        const currentDocs = state.documents || [];
        (dbStore as any).setState?.({ documents: [newDoc, ...currentDocs] });
      }

      setIsAddDocModalOpen(false);
      setDocForm({
        title: '',
        category: 'FACTURE_REPARATION',
        fileUrl: '',
        notes: '',
      });
      setActionAlert({ type: 'success', message: 'Justificatif / facture rattaché avec succès au dossier de maintenance.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du document' });
    }
  };

  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DU DOSSIER DE MAINTENANCE
  // =========================================================================
  if (selectedRecord) {
    const isCompleted = selectedRecord.status === 'COMPLETED';
    const mntDocs = (state.documents || []).filter(
      (d: any) => d.relatedEntityId === selectedRecord.id || d.relatedMaintenanceId === selectedRecord.id
    );
    const linkedVeh = state.vehicles.find((v) => v.id === selectedRecord.vehicleId);
    const vHealth = linkedVeh ? dbStore.getVehicleHealthSheet(linkedVeh.id) : null;

    return (
      <EntityShowroomLayout
        backLabel={t.maintenancePage.backToMaintenance}
        onBack={() => setSelectedRecord(null)}
        title={`${lang === 'en' ? 'Repair Order' : 'Ordre de Réparation'} ${selectedRecord.recordNumber}`}
        subtitle={`${selectedRecord.vehicleName} • ${lang === 'en' ? 'Garage' : 'Prestataire'} : ${selectedRecord.garageName}`}
        referenceId={selectedRecord.recordNumber}
        status={selectedRecord.status}
        statusLabel={
          isCompleted
            ? (lang === 'en' ? 'Closed & Verified' : 'Clôturée & Conforme')
            : selectedRecord.status === 'IN_PROGRESS'
            ? (lang === 'en' ? 'In Workshop' : 'En Atelier')
            : (lang === 'en' ? 'Scheduled' : 'Programmée')
        }
        avatarIcon={Wrench}
        actions={
          <div className="flex items-center gap-2">
            {!isCompleted && hasEffectivePermission(currentUser, 'maintenance', 'update') && (
              <button
                type="button"
                onClick={() => handleOpenCompleteModal(selectedRecord)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.maintenancePage.completeOrderBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddDocModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Attach Invoice / Estimate' : 'Rattacher Facture / Devis'}</span>
            </button>
            {linkedVeh && (
              <button
                type="button"
                onClick={() => handlePrintHealthSheet(linkedVeh)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'en' ? 'Print Health Report' : 'Imprimer Bilan Santé'}</span>
              </button>
            )}
            {onNavigate && linkedVeh && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRecord(null);
                  onNavigate('vehicles', linkedVeh.id);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Car className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Vehicle File' : 'Fiche Véhicule'}</span>
              </button>
            )}
          </div>
        }
        kpis={[
          {
            label: lang === 'en' ? 'Total Repair Cost' : 'Coût Total Intervention',
            value: formatXAF(selectedRecord.totalCostXAF),
            icon: DollarSign,
            sublabel: `${lang === 'en' ? 'Labor' : "Main d'œuvre"} : ${formatXAF(selectedRecord.laborCostXAF)}`,
          },
          {
            label: lang === 'en' ? 'Odometer Reading' : 'Kilométrage Compteur',
            value: `${selectedRecord.mileageAtService.toLocaleString()} km`,
            icon: Gauge,
            sublabel: `${lang === 'en' ? 'Start Date' : "Date d'entrée"} : ${selectedRecord.startDate}`,
          },
          {
            label: lang === 'en' ? 'Stock Parts Used' : 'Pièces de Stock Déduites',
            value: `${(selectedRecord.partsUsed || []).length} ${lang === 'en' ? 'items' : 'références'}`,
            icon: Boxes,
            sublabel: `${formatXAF((selectedRecord.partsUsed || []).reduce((s, p) => s + p.totalXAF, 0))} ${lang === 'en' ? 'of supplies' : 'de fournitures'}`,
          },
          {
            label: lang === 'en' ? 'Vehicle Health Score' : 'Score Santé Véhicule',
            value: vHealth ? `${vHealth.healthScore}%` : 'N/A',
            icon: Activity,
            sublabel: vHealth?.recommendation || (lang === 'en' ? 'Certified health check' : 'Bilan de santé certifié'),
          },
        ]}
        tabs={[
          { id: 'OVERVIEW', label: t.maintenancePage.tabOverview, icon: FileText },
          {
            id: 'PARTS',
            label: t.maintenancePage.tabParts,
            icon: Boxes,
            badge: (selectedRecord.partsUsed || []).length,
          },
          { id: 'VEHICLE', label: lang === 'en' ? 'Vehicle & Health' : 'Véhicule & Bilan Santé', icon: Car },
          {
            id: 'DOCS',
            label: t.maintenancePage.tabDocs,
            icon: FileText,
            badge: mntDocs.length + 1,
          },
          { id: 'TIMELINE', label: t.maintenancePage.tabHistory, icon: Clock },
        ]}
        activeTab={detailTab}
        onTabChange={(t) => setDetailTab(t as any)}
      >
        {/* TAB 1: OVERVIEW */}
        {detailTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-900" />
                  <span>Dossier Technique &amp; Prestataire</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Type d'intervention</div>
                    <div className="font-black text-sm text-slate-900 mt-1">{selectedRecord.type}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Garage / Atelier</div>
                    <div className="font-bold text-sm text-slate-900 mt-1">{selectedRecord.garageName}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Date d'entrée</div>
                    <div className="font-semibold text-slate-900 mt-1">{selectedRecord.startDate}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Date de restitution</div>
                    <div className="font-semibold text-slate-900 mt-1">{selectedRecord.completionDate || 'En cours d\'essais'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Chiffrage Financier &amp; Facturation</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Main d'œuvre atelier</div>
                    <div className="font-black text-base text-slate-900 mt-1">{formatXAF(selectedRecord.laborCostXAF)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Fournitures &amp; Pièces</div>
                    <div className="font-black text-base text-slate-900 mt-1">
                      {formatXAF((selectedRecord.partsUsed || []).reduce((s, p) => s + p.totalXAF, 0))}
                    </div>
                  </div>
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Montant Total Facturé TTC</div>
                    <div className="font-black text-xl text-emerald-950 mt-1">{formatXAF(selectedRecord.totalCostXAF)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Diagnostic Initial &amp; Description Complète des Travaux
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedRecord.description}
                </p>

                {selectedRecord.technicianNotes && (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1 text-xs">
                    <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                      Observations du Chef d'Atelier &amp; Notes Techniques
                    </div>
                    <p className="text-blue-950 leading-relaxed">
                      {selectedRecord.technicianNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTS */}
        {detailTab === 'PARTS' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Pièces Détachées &amp; Consommables Déduits du Stock ({(selectedRecord.partsUsed || []).length})
                </h3>
                <p className="text-xs text-slate-500">Traçabilité complète des références prélevées en magasin FCT</p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(null);
                    onNavigate('stock');
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Consulter le Stock Général</span>
                </button>
              )}
            </div>

            {(!selectedRecord.partsUsed || selectedRecord.partsUsed.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold">
                Aucune pièce de rechange n’a été consommée pour cette intervention.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[550px]">
                  <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Désignation de la pièce</th>
                      <th className="py-3 px-4 text-center">Quantité Déduite</th>
                      <th className="py-3 px-4 text-right">Prix Unitaire HT</th>
                      <th className="py-3 px-4 text-right">Total XAF</th>
                      {onNavigate && <th className="py-3 px-4 text-center">Fiche Stock</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.partsUsed.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4 text-center font-black text-slate-900">{p.quantity}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">{formatXAF(p.unitPriceXAF)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatXAF(p.totalXAF)}</td>
                        {onNavigate && (
                          <td className="py-3 px-4 text-center">
                            {p.stockItemId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecord(null);
                                  onNavigate('stock', p.stockItemId);
                                }}
                                className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer inline-flex"
                                title="Voir la pièce en stock"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB 3: VEHICLE */}
        {detailTab === 'VEHICLE' && (
          <div className="space-y-6">
            {linkedVeh ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md">
                      {linkedVeh.licensePlate}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {linkedVeh.brand} {linkedVeh.model} ({linkedVeh.year})
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">VIN : {linkedVeh.vin}</p>
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(null);
                        onNavigate('vehicles', linkedVeh.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Car className="w-4 h-4" />
                      <span>Consulter Showroom Véhicule</span>
                    </button>
                  )}
                </div>

                {vHealth && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Bilan de Santé Global &amp; Antécédents Mécaniques
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Score Santé : {vHealth.healthScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Interventions cumulées</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{vHealth.interventionsCount} ordres</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Dépenses maintenance</div>
                        <div className="text-base font-black text-emerald-700 mt-0.5">{formatXAF(vHealth.totalMaintenanceCostXAF)}</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Pièces remplacées</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{vHealth.partsReplaced.length} pièces</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Contrôle technique</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">{linkedVeh.nextTechnicalInspectionDate}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">Véhicule introuvable.</div>
            )}
          </div>
        )}

        {/* TAB 4: DOCS */}
        {detailTab === 'DOCS' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Justificatifs, Devis &amp; Factures d'Atelier</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Factures prestataires, ordres de travail signés et fiches d'inspection avant/après travaux
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Rattacher une Facture / Document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Carte Justificatif par défaut */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                    Ordre de Réparation
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Certifié
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Ordre de Réparation Officiel FCT</h4>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedRecord.recordNumber}</p>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div>Garage : <strong>{selectedRecord.garageName}</strong></div>
                  <div>Montant : <strong>{formatXAF(selectedRecord.totalCostXAF)}</strong></div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  {selectedRecord.invoiceAttachmentUrl ? (
                    <a
                      href={selectedRecord.invoiceAttachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Consulter le scan</span>
                    </a>
                  ) : (
                    <span className="flex-1 text-center py-2 rounded-lg bg-slate-50 text-slate-400 text-xs italic">
                      Scan de réparation non téléversé
                    </span>
                  )}
                </div>
              </div>

              {/* Documents attachés dynamiques */}
              {mntDocs.map((doc: any) => (
                <div key={doc.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                      {doc.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {doc.confidentialityLevel}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.fileType} • {doc.fileSizeMb || 1.0} Mo</p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div>Enregistré le : <strong>{doc.createdAt}</strong></div>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewerDoc(doc)}
                      className="flex-1 text-center py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualiser</span>
                    </button>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={doc.title}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TIMELINE */}
        {detailTab === 'TIMELINE' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Chronologie des Travaux &amp; Validation</h3>
            <EntityTimeline
              events={[
                {
                  id: 'evt-start',
                  date: selectedRecord.startDate,
                  title: `Prise en charge atelier — ${selectedRecord.garageName}`,
                  description: `Immobilisation atelier enregistrée pour ${selectedRecord.licensePlate}. Diagnostic initial : ${selectedRecord.description}`,
                  type: 'INFO',
                },
                ...(selectedRecord.status === 'COMPLETED'
                  ? [
                      {
                        id: 'evt-complete',
                        date: selectedRecord.completionDate || selectedRecord.startDate,
                        title: `Clôture des travaux et déduction de stock`,
                        description: selectedRecord.technicianNotes || 'Travaux réceptionnés et validés. Remise en circulation autorisée.',
                        type: 'SUCCESS' as const,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        )}

        {/* MODAL AJOUT DOCUMENT MAINTENANCE */}
        {isAddDocModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Rattacher une Facture / Document au Dossier</h3>
                <button
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToMaintenance} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Titre du document *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Facture CFAO Bassa, Devis carrosserie..."
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Catégorie</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="FACTURE_REPARATION">Facture de Réparation</option>
                    <option value="DEVIS">Devis Atelier</option>
                    <option value="BON_SORTIE_PIECES">Bon de Sortie Pièces</option>
                    <option value="RAPPORT_DIAGNOSTIC">Rapport de Diagnostic</option>
                    <option value="AUTRE">Autre Justificatif</option>
                  </select>
                </div>

                <div className="pt-2">
                  <CloudinaryUploadDropzone
                    folder="fct_automobile/maintenance"
                    label="Scan ou Facture Atelier (Téléversement Cloudinary FCT) :"
                    helperText="Glissez ou sélectionnez la facture de réparation ou le devis d'atelier (PDF, PNG, JPG)"
                    currentValue={docForm.fileUrl}
                    onUploadSuccess={(url) => setDocForm({ ...docForm, fileUrl: url })}
                    onClear={() => setDocForm({ ...docForm, fileUrl: '' })}
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Notes &amp; Réf Règlement</label>
                  <textarea
                    rows={2}
                    value={docForm.notes}
                    onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                    placeholder="Référence quittance garage..."
                    className="w-full px-3 py-2 border rounded-lg outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddDocModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 cursor-pointer"
                  >
                    Rattacher Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </EntityShowroomLayout>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-600" />
            <span>{t.maintenancePage.title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.maintenancePage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentSelectedVehicle && (
            <button
              onClick={() => handlePrintHealthSheet(currentSelectedVehicle)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              title={lang === 'en' ? 'Print health sheet for selected vehicle' : 'Imprimer le bilan de santé du véhicule sélectionné'}
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'en' ? 'Print Vehicle Sheet' : 'Imprimer Bilan Véhicule'}</span>
            </button>
          )}

          {hasEffectivePermission(currentUser, 'maintenance', 'create') && (
            <button
              onClick={() => handleOpenNewOrder()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.maintenancePage.newOrderBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <span>{actionAlert.message}</span>
          <button
            onClick={() => setActionAlert(null)}
            className="cursor-pointer text-slate-500 hover:text-slate-800 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Activity Summary KPIs */}
      <EntityActivitySummary items={kpis} columns={4} />

      {/* Vehicle Quick Selector & Health Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-900" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Diagnostic Santé en Direct par Véhicule
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-hidden cursor-pointer"
            >
              {state.vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.licensePlate}) - {v.status}
                </option>
              ))}
            </select>

            {currentSelectedVehicle && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('vehicles', currentSelectedVehicle.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition cursor-pointer"
                title="Consulter la fiche complète dans le Parc Automobile"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Showroom Parc</span>
              </button>
            )}
          </div>
        </div>

        {healthData && currentSelectedVehicle && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Score Santé</div>
              <div className="text-base font-black text-emerald-700">{healthData.healthScore} / 100</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Prochaine Vidange</div>
              <div className={`text-xs font-black mt-1 ${healthData.isDueForOilChange ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
                {healthData.isDueForOilChange ? '⚠️ Vidange Due !' : `dans ${healthData.kmRemainingUntilOilChange?.toLocaleString() || 0} km`}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Cycle : {healthData.oilChangeIntervalKm?.toLocaleString() || 10000} km</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Coût Cumulé</div>
              <div className="text-sm font-black text-slate-900 mt-1">{formatXAF(healthData.totalMaintenanceCostXAF)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Interventions</div>
              <div className="text-xs font-black text-blue-900 mt-1">
                {healthData.completedCount} faites ({healthData.activeCount} en cours)
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Kilométrage</div>
              <div className="text-sm font-black text-slate-900 mt-1">{currentSelectedVehicle.mileage.toLocaleString()} km</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Statut Flotte</div>
              <EntityStatusBadge status={currentSelectedVehicle.status} size="sm" className="mt-1" />
            </div>
          </div>
        )}

        {healthData && (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Recommandation atelier :</strong> {healthData.recommendation}
              </span>
            </div>
            <button
              onClick={() => handleOpenNewOrder(currentSelectedVehicle?.id)}
              className="px-3 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] cursor-pointer"
            >
              Planifier travaux
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.maintenancePage.searchPlaceholder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: t.maintenancePage.allTab, count: state.maintenance.length },
          { id: 'IN_PROGRESS', label: t.maintenancePage.inProgressTab, count: inProgressCount },
          { id: 'SCHEDULED', label: t.maintenancePage.scheduledTab, count: scheduledCount },
          {
            id: 'COMPLETED',
            label: t.maintenancePage.completedTab,
            count: state.maintenance.filter((m) => m.status === 'COMPLETED').length,
          },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        filters={[
          {
            label: lang === 'en' ? 'Type' : 'Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: lang === 'en' ? 'All Types' : 'Tous types', value: 'ALL' },
              { label: lang === 'en' ? 'Preventive' : 'Préventif', value: 'PREVENTIVE' },
              { label: lang === 'en' ? 'Curative' : 'Curatif', value: 'CURATIVE' },
              { label: lang === 'en' ? 'Urgent' : 'Urgent', value: 'EMERGENCY' },
            ],
          },
        ]}
      />

      {/* Content: Cards or Table */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          title={t.maintenancePage.emptyMaintenanceTitle}
          description={t.maintenancePage.emptyMaintenanceDesc}
          icon={Wrench}
          action={
            hasEffectivePermission(currentUser, 'maintenance', 'create')
              ? { label: t.maintenancePage.newOrderBtn, onClick: () => handleOpenNewOrder() }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((rec) => {
            const linkedVeh = state.vehicles.find((v) => v.id === rec.vehicleId);
            const isCompleted = rec.status === 'COMPLETED';

            return (
              <EntityCard
                key={rec.id}
                title={rec.vehicleName}
                subtitle={`${rec.garageName} — ${rec.description}`}
                referenceId={rec.recordNumber}
                imageUrl={linkedVeh?.photoUrls?.[0]}
                fallbackIcon={Wrench}
                status={rec.status}
                statusLabel={isCompleted ? 'Clôturée' : rec.status === 'IN_PROGRESS' ? 'En Atelier' : 'Programmée'}
                onClick={() => setSelectedRecord(rec)}
                metrics={[
                  {
                    label: 'Type & Date',
                    value: `${rec.type} • ${rec.startDate}`,
                    icon: Calendar,
                  },
                  {
                    label: 'Coût Total XAF',
                    value: formatXAF(rec.totalCostXAF),
                    icon: Boxes,
                    highlight: true,
                  },
                  {
                    label: 'Pièces Utilisées',
                    value: `${(rec.partsUsed || []).length} référence(s)`,
                    icon: Boxes,
                  },
                  {
                    label: 'Kilométrage',
                    value: `${(rec.mileageAtService || 0).toLocaleString()} km`,
                    icon: Gauge,
                  },
                ]}
                quickActions={
                  <div className="flex items-center gap-1">
                    {!isCompleted && hasEffectivePermission(currentUser, 'maintenance', 'update') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCompleteModal(rec);
                        }}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
                        title="Clôturer l'intervention"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasEffectivePermission(currentUser, 'maintenance', 'delete') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmRecord(rec);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                        title="Supprimer le dossier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">N° Dossier</th>
                  <th className="py-3 px-4">Véhicule</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Garage / Prestataire</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Pièces de Stock</th>
                  <th className="py-3 px-4 text-right">Coût Total (XAF)</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const isCompleted = rec.status === 'COMPLETED';
                  const partsSummary = (rec.partsUsed || []).map((p) => `${p.name} (x${p.quantity})`).join(', ');

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{rec.recordNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rec.licensePlate}</div>
                        <div className="text-[10px] text-slate-500">{rec.vehicleName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {rec.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{rec.garageName}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={rec.description}>
                        {rec.description}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.partsUsed && rec.partsUsed.length > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold"
                            title={partsSummary}
                          >
                            <Boxes className="w-3 h-3 text-emerald-600" />
                            {rec.partsUsed.length} réf
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Aucune pièce</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatXAF(rec.totalCostXAF)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <EntityStatusBadge
                          status={rec.status}
                          label={isCompleted ? 'Clôturée' : rec.status === 'IN_PROGRESS' ? 'En Atelier' : 'Programmée'}
                          size="sm"
                        />
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isCompleted && hasEffectivePermission(currentUser, 'maintenance', 'update') && (
                          <button
                            onClick={() => handleOpenCompleteModal(rec)}
                            title="Clôturer l'intervention"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Clôturer</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedVehicleId(rec.vehicleId);
                            const v = state.vehicles.find((veh) => veh.id === rec.vehicleId);
                            if (v) handlePrintHealthSheet(v);
                          }}
                          title="Imprimer le bilan de santé"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer inline-flex items-center transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {hasEffectivePermission(currentUser, 'maintenance', 'delete') && (
                          <button
                            onClick={() => setDeleteConfirmRecord(rec)}
                            title="Supprimer ce dossier"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer inline-flex items-center transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* New Maintenance Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-800 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <span>{t.maintenancePage.newOrderModalTitle}</span>
              </h3>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t.maintenancePage.vehicleLabel}</label>
                  <select
                    value={mntForm.vehicleId}
                    onChange={(e) => {
                      const veh = state.vehicles.find((v) => v.id === e.target.value);
                      setMntForm({
                        ...mntForm,
                        vehicleId: e.target.value,
                        mileageAtService: veh?.mileage || 50000,
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold"
                  >
                    {state.vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.licensePlate}) - {v.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t.maintenancePage.natureLabel} *</label>
                  <select
                    value={mntForm.type}
                    onChange={(e) => setMntForm({ ...mntForm, type: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold"
                  >
                    <option value="PREVENTIVE">{lang === 'en' ? 'Preventive (Oil change, Servicing)' : 'Préventive (Vidange, Révision)'}</option>
                    <option value="CURATIVE">{lang === 'en' ? 'Curative (Breakdown, Repair)' : 'Curative (Panne, Réparation)'}</option>
                    <option value="EMERGENCY">{lang === 'en' ? 'Workshop Emergency' : 'Urgence Atelier'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t.maintenancePage.garageLabel}</label>
                  <input
                    type="text"
                    value={mntForm.garageName}
                    onChange={(e) => setMntForm({ ...mntForm, garageName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t.maintenancePage.mileageAtServiceLabel}</label>
                  <input
                    type="number"
                    value={mntForm.mileageAtService}
                    onChange={(e) => setMntForm({ ...mntForm, mileageAtService: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">{lang === 'en' ? 'Start Date *' : "Date d'entrée *"}</label>
                  <input
                    type="date"
                    value={mntForm.startDate}
                    onChange={(e) => setMntForm({ ...mntForm, startDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.maintenancePage.diagnosticLabel}</label>
                <textarea
                  value={mntForm.description}
                  onChange={(e) => setMntForm({ ...mntForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 rounded-lg border border-slate-200 font-medium"
                  required
                />
              </div>

              {/* Stock Integration */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <span className="font-bold text-slate-900 block">{lang === 'en' ? 'FCT Stock Consumables Used' : 'Pièces consommées issues du Stock FCT'}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-slate-200 bg-white font-medium min-w-[200px]"
                  >
                    {state.stock.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {lang === 'en' ? 'Stock:' : 'Stock:'} {s.quantityInStock} {s.unit} ({formatXAF(s.unitCostXAF)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={selectedPartQty}
                    onChange={(e) => setSelectedPartQty(Math.max(1, Number(e.target.value)))}
                    className="w-20 p-2 rounded-lg border border-slate-200 bg-white text-center font-bold"
                  />

                  <button
                    type="button"
                    onClick={handleAddPartFromStock}
                    className="px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer"
                  >
                    {lang === 'en' ? 'Add Part' : 'Ajouter Pièce'}
                  </button>
                </div>

                {partsList.length > 0 && (
                  <div className="space-y-1 pt-2">
                    {partsList.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                        <span className="font-medium text-slate-800">
                          {p.name} — {lang === 'en' ? 'Qty:' : 'Qte:'} {p.quantity} @ {formatXAF(p.unitPriceXAF)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{formatXAF(p.totalXAF)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(idx)}
                            className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{lang === 'en' ? 'Labor / Workshop Fee (XAF)' : "Main d’œuvre / Forfait Atelier (XAF)"}</label>
                <input
                  type="number"
                  value={mntForm.laborCostXAF}
                  onChange={(e) => setMntForm({ ...mntForm, laborCostXAF: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900">{lang === 'en' ? 'Estimated Total Order Cost:' : 'Total Prévisionnel Dossier :'}</span>
                <span className="font-black text-sm text-blue-950">{formatXAF(calculatedGrandTotal)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  {lang === 'en' ? 'Submit & Immobilize Vehicle' : 'Valider & Immobiliser le véhicule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Order Modal */}
      {isCompleteModalOpen && completeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{t.maintenancePage.completeModalTitle} - {completeTarget.recordNumber}</span>
            </h3>

            <p className="text-xs text-slate-600">
              {lang === 'en'
                ? `Completing this order will deduct parts from stock and restore vehicle ${completeTarget.licensePlate} to AVAILABLE status.`
                : `La clôture validera la déduction atomique des pièces de rechange du stock FCT et rétablira le véhicule ${completeTarget.licensePlate} en état disponible (AVAILABLE).`}
            </p>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">{t.maintenancePage.resolutionNotesLabel}</label>
              <textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmComplete}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {lang === 'en' ? 'Confirm Closure' : 'Confirmer la Clôture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRecord && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteConfirmRecord)}
          title="Supprimer l'Ordre de Réparation"
          itemName={`Dossier ${deleteConfirmRecord.recordNumber} (${deleteConfirmRecord.licensePlate})`}
          itemDetails={`Intervention du ${deleteConfirmRecord.startDate} d'un montant de ${formatXAF(deleteConfirmRecord.totalCostXAF)}.`}
          warningMessage="La suppression d'un dossier de maintenance est une action sensible consignée dans le journal d'audit de sécurité."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmRecord(null)}
        />
      )}
      {/* Modal Visualiseur Universel de Document */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
        lang={lang}
      />
    </div>
  );
};
