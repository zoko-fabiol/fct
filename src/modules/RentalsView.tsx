/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Locations & Gestion des Contrats 360°
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { Language, translations } from '../services/i18n.ts';
import { RentalContract, RentalStatus, AppModule } from '../../packages/shared-types/index.ts';
import {
  formatXAF,
  calculateRentalDays,
  checkVehicleAvailability,
  hasEffectivePermission,
} from '../../packages/business-rules/index.ts';
import { DocumentPrintData } from '../components/DocumentModal.tsx';
import { formatAmountPlain } from '../utils/invoicePdf.ts';
import { exportCollectionToExcel } from '../utils/excelExport.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
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
  Upload,
  FileText,
  Eye,
  Download,
  KeyRound,
  Plus,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Car,
  Clock,
  Shield,
  X,
  UserCheck,
  Pencil,
  Ban,
  Trash2,
  Wallet,
  Receipt,
  ExternalLink,
  DollarSign,
  User,
  ArrowRight,
  Gauge,
  Fuel,
  FileCheck,
  ClipboardList,
  FileSpreadsheet,
} from 'lucide-react';

interface RentalsViewProps {
  state: DatabaseState;
  lang: Language;
  onOpenPrintModal: (data: DocumentPrintData) => void;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextEntityId?: string | null;
}

export const RentalsView: React.FC<RentalsViewProps> = ({
  state,
  lang,
  onOpenPrintModal,
  onNavigate,
  contextEntityId,
}) => {
  const t = translations[lang];
  const currentUser = dbStore.getCurrentUser();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Selected contract for Showroom / Fiche Détaillée
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [contractDetailTab, setContractDetailTab] = useState<'TERMS' | 'DOCS' | 'VEHICLE' | 'CUSTOMER' | 'INSPECTION' | 'FINANCES' | 'TIMELINE'>('TERMS');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
  const [cancelConfirmContract, setCancelConfirmContract] = useState<RentalContract | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Return Check-out Inspection Modal State
  const [returnModalContract, setReturnModalContract] = useState<RentalContract | null>(null);
  const [returnMileage, setReturnMileage] = useState<number>(0);
  const [returnFuel, setReturnFuel] = useState<number>(8);
  const [penaltiesAmount, setPenaltiesAmount] = useState<number>(0);
  const [penaltyNotes, setPenaltyNotes] = useState<string>('');
  const [returnCleanliness, setReturnCleanliness] = useState<'CLEAN' | 'DIRTY'>('CLEAN');
  const [returnSpareWheel, setReturnSpareWheel] = useState<boolean>(true);
  const [returnJackTools, setReturnJackTools] = useState<boolean>(true);

  const [editForm, setEditForm] = useState({
    startDate: '',
    endDate: '',
    dailyRateXAF: 0,
    securityDepositXAF: 0,
    driverIncluded: false,
    driverId: '',
  });

  // Form State for new contract
  const [contractForm, setContractForm] = useState({
    customerId: state.customers[0]?.id || '',
    vehicleId: state.vehicles.find((v) => v.status === 'AVAILABLE')?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    dailyRateXAF: 85000,
    securityDepositXAF: state.settings?.defaultDepositXAF || 300000,
    driverIncluded: false,
    driverId: '',
  });

  // Handle contextual opening
  React.useEffect(() => {
    if (contextEntityId) {
      // 1. Is it a Customer ID? (e.g. from CRM "Nouveau Contrat")
      const cust = state.customers.find((c) => c.id === contextEntityId);
      if (cust) {
        setContractForm((prev) => ({
          ...prev,
          customerId: cust.id,
        }));
        setSelectedContract(null);
        setIsCreateModalOpen(true);
        return;
      }

      // 2. Is it a Vehicle ID? (e.g. from Showroom "Louer ce véhicule")
      const veh = state.vehicles.find((v) => v.id === contextEntityId);
      if (veh) {
        setContractForm((prev) => ({
          ...prev,
          vehicleId: veh.id,
          dailyRateXAF: veh.rentalDailyRate,
          securityDepositXAF: veh.securityDepositRate,
        }));
        setSelectedContract(null);
        setIsCreateModalOpen(true);
        return;
      }

      // 3. Is it a Contract ID? (to view showroom)
      const contract = state.contracts.find((c) => c.id === contextEntityId);
      if (contract) {
        setSelectedContract(contract);
        return;
      }
    }
  }, [contextEntityId, state.customers, state.vehicles, state.contracts]);

  // Top KPIs
  const activeContractsCount = state.contracts.filter(
    (c) => c.status === 'CONFIRMED' || (c.status as string) === 'ACTIVE'
  ).length;
  const completedContractsCount = state.contracts.filter(
    (c) => c.status === 'RETURNED' || (c.status as string) === 'COMPLETED'
  ).length;
  const totalRevenue = state.contracts
    .filter((c) => c.status !== 'CANCELLED')
    .reduce((sum, c) => sum + (c.paidAmountXAF || 0), 0);
  const totalPendingBalance = state.contracts
    .filter((c) => c.status === 'CONFIRMED' || (c.status as string) === 'ACTIVE')
    .reduce((sum, c) => sum + (c.remainingAmountXAF || 0), 0);

  const kpis = [
    {
      id: 'kpi-active',
      label: t.rentalsPage.activeRentals,
      value: activeContractsCount,
      sublabel: lang === 'en' ? 'Vehicles on the road' : 'Véhicules en circulation',
      icon: KeyRound,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-completed',
      label: t.rentalsPage.returnedTab,
      value: completedContractsCount,
      sublabel: lang === 'en' ? 'Returned vehicles' : 'Véhicules restitués',
      icon: CheckCircle2,
      colorVariant: 'emerald' as const,
    },
    {
      id: 'kpi-revenue',
      label: lang === 'en' ? 'Revenue Collected' : 'Revenus Encaissés',
      value: formatXAF(totalRevenue),
      sublabel: lang === 'en' ? 'XAF collected at counter' : 'XAF réglés en agence',
      icon: DollarSign,
      colorVariant: 'purple' as const,
    },
    {
      id: 'kpi-balance',
      label: lang === 'en' ? 'Pending Balances' : 'Soldes en Attente',
      value: formatXAF(totalPendingBalance),
      sublabel: lang === 'en' ? 'Remaining to collect' : 'Reste à percevoir',
      icon: Clock,
      colorVariant: totalPendingBalance > 0 ? ('amber' as const) : ('slate' as const),
    },
  ];

  const handleOpenEdit = (contract: RentalContract) => {
    setEditingContract(contract);
    setEditForm({
      startDate: contract.startDate,
      endDate: contract.endDate,
      dailyRateXAF: contract.dailyRateXAF,
      securityDepositXAF: contract.securityDepositXAF,
      driverIncluded: contract.driverIncluded,
      driverId: contract.driverId || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEditContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    const start = new Date(editForm.startDate).getTime();
    const end = new Date(editForm.endDate).getTime();
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalAmount = diffDays * editForm.dailyRateXAF;

    const driver = editForm.driverId ? state.drivers.find((d) => d.id === editForm.driverId) : undefined;

    try {
      dbStore.updateContract(editingContract.id, {
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        dailyRateXAF: editForm.dailyRateXAF,
        securityDepositXAF: editForm.securityDepositXAF,
        totalDays: diffDays,
        totalAmountXAF: totalAmount,
        remainingAmountXAF: Math.max(0, totalAmount - editingContract.paidAmountXAF),
        driverIncluded: editForm.driverIncluded,
        driverId: driver?.id,
        driverName: driver?.fullName,
      });

      setIsEditModalOpen(false);
      if (selectedContract?.id === editingContract.id) {
        const updated = state.contracts.find((c) => c.id === editingContract.id);
        if (updated) setSelectedContract(updated);
      }
      setActionAlert({
        type: 'success',
        message: `Contrat ${editingContract.contractNumber} mis à jour avec succès.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la modification du contrat');
    }
  };

  const handleConfirmCancelContract = (reason: string) => {
    if (!cancelConfirmContract) return;
    try {
      const num = cancelConfirmContract.contractNumber;
      dbStore.cancelContract(cancelConfirmContract.id, reason);
      setCancelConfirmContract(null);
      if (selectedContract?.id === cancelConfirmContract.id) {
        setSelectedContract(null);
      }
      setActionAlert({
        type: 'success',
        message: `Contrat ${num} annulé avec succès. Véhicule et chauffeur libérés.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l’annulation' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const handleSelectVehicle = (vehId: string) => {
    const veh = state.vehicles.find((v) => v.id === vehId);
    if (veh) {
      setContractForm({
        ...contractForm,
        vehicleId: vehId,
        dailyRateXAF: veh.rentalDailyRate,
        securityDepositXAF: veh.securityDepositRate,
      });
    }
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const start = new Date(contractForm.startDate).getTime();
    const end = new Date(contractForm.endDate).getTime();
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const minDays = state.settings?.minRentalDurationDays || 1;
    if (diffDays < minDays) {
      setFormError(`La durée minimale de location configurée est de ${minDays} jour(s).`);
      return;
    }

    const availability = checkVehicleAvailability(
      contractForm.vehicleId,
      contractForm.startDate,
      contractForm.endDate,
      state.contracts
    );

    if (!availability.isAvailable) {
      setFormError(availability.conflictReason || 'Véhicule déjà réservé sur cette période.');
      return;
    }

    try {
      const created = dbStore.createContract(contractForm);
      setIsCreateModalOpen(false);
      handlePrintContract(created);
    } catch (err: any) {
      setFormError(err.message || 'Erreur de création de contrat');
    }
  };

  const handlePrintReturnInspection = (contract: RentalContract, veh: any) => {
    const customer = state.customers.find((c) => c.id === contract.customerId);
    const insp = contract.inspectionRetour;
    const distanceKm = insp && veh ? Math.max(0, insp.mileage - (veh.mileage || 0)) : 0;
    const printData: DocumentPrintData = {
      title: 'PROCÈS-VERBAL DE RESTITUTION & QUITTANCE DE CAUTION',
      docNumber: `PV-RET-${contract.contractNumber}`,
      date: new Date().toISOString().split('T')[0],
      customerName: contract.customerName,
      customerPhone: customer?.phone,
      customerAddress: customer?.address,
      items: [
        {
          description: `Restitution véhicule ${contract.vehicleName} (Immatriculation : ${veh?.licensePlate || '-'})`,
          qty: 1,
          unitPrice: 0,
          total: 0,
        },
        {
          description: `Kilométrage certifié au retour : ${insp?.mileage?.toLocaleString() || '-'} km (Distance parcourue : ${distanceKm.toLocaleString()} km)`,
          qty: 1,
          unitPrice: 0,
          total: 0,
        },
        {
          description: `Jauge carburant au retour : ${insp?.fuelLevel !== undefined ? insp.fuelLevel + '/8' : 'Conforme'} - État : ${insp?.cleanlinessCondition === 'CLEAN' ? 'Propre' : 'Nettoyage requis'}`,
          qty: 1,
          unitPrice: 0,
          total: 0,
        },
        {
          description: `Caution initiale consignée : ${formatXAF(contract.securityDepositXAF)} | Pénalités déduites : ${formatXAF(contract.penaltiesXAF || 0)}`,
          qty: 1,
          unitPrice: 0,
          total: 0,
        },
        {
          description: `SOLDE NET DE CAUTION RESTITUÉ AU CLIENT EN CAISSE`,
          qty: 1,
          unitPrice: contract.depositReturnedXAF || 0,
          total: contract.depositReturnedXAF || 0,
        },
      ],
      totalAmountXAF: contract.depositReturnedXAF || 0,
      total: contract.depositReturnedXAF || 0,
      depositAmount: contract.securityDepositXAF,
      notes: `Observations contradictoires : ${contract.penaltyReason || insp?.bodyConditionNotes || 'Véhicule restitué conforme sans litige'}. Signature certifiée FCT Automobile Douala.`,
      signatureRole1: 'Le Client (Bon pour accord restitution)',
      signatureRole2: "L'Inspecteur / Responsable d'Agence FCT",
    };
    onOpenPrintModal(printData);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalContract) return;

    const contractToReturn = returnModalContract;
    const veh = state.vehicles.find((v) => v.id === contractToReturn.vehicleId);

    dbStore.checkOutReturn(
      contractToReturn.id,
      {
        fuelLevel: returnFuel,
        mileage: returnMileage,
        bodyConditionNotes: penaltyNotes || 'Restitution standard conforme',
        cleanlinessCondition: returnCleanliness,
        hasSpareWheel: returnSpareWheel,
        hasJackAndTools: returnJackTools,
        inspectorName: dbStore.getCurrentUser().fullName,
        photos: [],
        signatureDate: new Date().toISOString(),
      },
      penaltiesAmount,
      penaltyNotes
    );

    const updated = state.contracts.find((c) => c.id === contractToReturn.id) || contractToReturn;
    if (selectedContract?.id === contractToReturn.id) {
      setSelectedContract(updated);
    }

    setReturnModalContract(null);
    setActionAlert({
      type: 'success',
      message: `Restitution validée pour le contrat ${contractToReturn.contractNumber}. Véhicule remis en circulation. PV prêt pour impression.`,
    });
    setTimeout(() => setActionAlert(null), 5000);

    handlePrintReturnInspection(updated, veh);
  };

  const handlePrintContract = (contract: RentalContract) => {
    const customer = state.customers.find((c) => c.id === contract.customerId);
    const printData: DocumentPrintData = {
      title: 'CONTRAT DE LOCATION AUTOMOBILE FCT',
      docNumber: contract.contractNumber,
      date: contract.createdAt.split('T')[0],
      customerName: contract.customerName,
      customerPhone: customer?.phone,
      customerAddress: customer?.address,
      items: [
        {
          description: `Location véhicule ${contract.vehicleName} (${contract.totalDays} jour(s)) - Période du ${contract.startDate} au ${contract.endDate}`,
          qty: contract.totalDays,
          unitPrice: contract.dailyRateXAF,
          total: contract.totalAmountXAF,
        },
        ...(contract.driverIncluded
          ? [
              {
                description: `Option Chauffeur Professionnel Agréé FCT inclus (${contract.driverName || 'Affecté en agence'})`,
                qty: contract.totalDays,
                unitPrice: 0,
                total: 0,
              },
            ]
          : []),
      ],
      subtotal: contract.totalAmountXAF,
      tax: 0,
      total: contract.totalAmountXAF,
      depositAmount: contract.securityDepositXAF,
      notes: `Caution consignée obligatoire : ${formatAmountPlain(contract.securityDepositXAF)} FCFA. Le locataire s'engage à respecter les conditions générales d'assurance et d'utilisation du réseau FCT Douala.`,
    };

    onOpenPrintModal(printData);
  };


  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'CONTRAT_SIGNE',
    fileUrl: '',
    notes: '',
  });

  const handleAddDocumentToContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      const newDoc = {
        id: `doc_rent_${Date.now()}`,
        title: docForm.title || `Contrat Signé - ${selectedContract.contractNumber}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        uploadedAt: new Date().toISOString(),
        relatedEntityId: selectedContract.id,
        relatedContractId: selectedContract.id,
        notes: docForm.notes || `Document rattaché au contrat ${selectedContract.contractNumber}`,
      };
      dbStore.addDocument(newDoc as any);
      setIsAddDocModalOpen(false);
      setDocForm({ title: '', category: 'CONTRAT_SIGNE', fileUrl: '', notes: '' });
      setActionAlert({ type: 'success', message: 'Document rattaché avec succès au contrat.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du document' });
    }
  };

  const filteredContracts = useMemo(() => {
    return state.contracts.filter((c) => {
      const matchesTab =
        activeTab === 'ALL' ||
        (activeTab === 'ACTIVE' && (c.status === 'CONFIRMED' || (c.status as string) === 'ACTIVE')) ||
        (activeTab === 'COMPLETED' && (c.status === 'RETURNED' || (c.status as string) === 'COMPLETED')) ||
        c.status === activeTab;
      const matchesSearch =
        c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.customerName.toLowerCase().includes(search.toLowerCase()) ||
        c.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
        (c.driverName || '').toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [state.contracts, activeTab, search]);


  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DU CONTRAT SÉLECTIONNÉ
  // =========================================================================
  if (selectedContract) {
    const linkedVeh = state.vehicles.find((v) => v.id === selectedContract.vehicleId);
    const linkedDrv = selectedContract.driverId
      ? state.drivers.find((d) => d.id === selectedContract.driverId)
      : null;
    const linkedCust = state.customers.find((c) => c.id === selectedContract.customerId);
    const contractDocs = (state.documents || []).filter(
      (d: any) => d.relatedEntityId === selectedContract.id || d.relatedContractId === selectedContract.id
    );

    return (
      <>
        <EntityShowroomLayout
          backLabel={t.rentalsPage.backToRentals}
          onBack={() => setSelectedContract(null)}
          title={`${lang === 'en' ? 'Rental Agreement' : 'Contrat'} ${selectedContract.contractNumber}`}
          subtitle={`${selectedContract.customerName} • ${selectedContract.vehicleName}`}
          referenceId={selectedContract.contractNumber}
          status={selectedContract.status}
          statusLabel={
            selectedContract.status === 'CONFIRMED' || (selectedContract.status as string) === 'ACTIVE'
              ? (lang === 'en' ? 'Active' : 'En Cours')
              : selectedContract.status === 'RETURNED' || (selectedContract.status as string) === 'COMPLETED'
              ? (lang === 'en' ? 'Returned' : 'Restitué')
              : selectedContract.status === 'OVERDUE'
              ? (lang === 'en' ? 'Overdue' : 'En Retard')
              : selectedContract.status === 'CANCELLED'
              ? (lang === 'en' ? 'Cancelled' : 'Annulé')
              : (lang === 'en' ? 'Draft' : 'Brouillon')
          }
          avatarImageUrl={linkedVeh?.photoUrls?.[0]}
          avatarIcon={KeyRound}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t.rentalsPage.attachDoc}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintContract(selectedContract)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.rentalsPage.printContract}</span>
              </button>
              {(selectedContract.status === 'CONFIRMED' || (selectedContract.status as string) === 'ACTIVE') &&
                hasEffectivePermission(currentUser, 'rentals', 'update') && (
                  <button
                    type="button"
                    onClick={() => {
                      setReturnModalContract(selectedContract);
                      setReturnMileage(linkedVeh?.mileage || 50000);
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.rentalsPage.closeReturnBtn}</span>
                  </button>
                )}
            </div>
          }
          kpis={[
            {
              label: t.rentalsPage.dailyRateCol,
              value: formatXAF(selectedContract.dailyRateXAF),
              sublabel: lang === 'en' ? 'Per rental day' : 'Par jour de location',
            },
            {
              label: lang === 'en' ? 'Total Duration' : 'Durée Totale',
              value: `${selectedContract.totalDays} ${lang === 'en' ? 'Days' : 'Jours'}`,
              sublabel: `${lang === 'en' ? 'From' : 'Du'} ${selectedContract.startDate} ${lang === 'en' ? 'to' : 'au'} ${selectedContract.endDate}`,
            },
            {
              label: t.rentalsPage.totalCol,
              value: formatXAF(selectedContract.totalAmountXAF),
              sublabel: `${lang === 'en' ? 'Paid:' : 'Payé:'} ${formatXAF(selectedContract.paidAmountXAF)}`,
              highlight: true,
            },
            {
              label: t.rentalsPage.depositCol,
              value: formatXAF(selectedContract.securityDepositXAF),
              sublabel: selectedContract.depositReturnedXAF > 0 ? (lang === 'en' ? 'Deposit Refunded' : 'Caution Restituée') : (lang === 'en' ? 'Held in Cash Register' : 'Consignée en Caisse'),
            },
          ]}
          tabs={[
            { id: 'TERMS', label: t.rentalsPage.tabTerms, icon: ClipboardList },
            { id: 'DOCS', label: t.rentalsPage.tabDocs, icon: FileText, badge: contractDocs.length },
            { id: 'VEHICLE', label: t.rentalsPage.tabVehicle, icon: Car },
            { id: 'CUSTOMER', label: t.rentalsPage.tabCustomer, icon: User },
            { id: 'FINANCES', label: t.rentalsPage.tabFinances, icon: DollarSign },
            { id: 'INSPECTION', label: t.rentalsPage.tabInspection, icon: FileCheck },
            { id: 'TIMELINE', label: t.rentalsPage.tabTimeline, icon: Clock },
          ]}
          activeTab={contractDetailTab}
          onTabChange={(t) => setContractDetailTab(t as any)}
        >
          {/* TAB 1: TERMS */}
          {contractDetailTab === 'TERMS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Période Contractuelle</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Date de départ :</span>
                      <span className="font-bold text-slate-900">{selectedContract.startDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Date de restitution :</span>
                      <span className="font-bold text-slate-900">{selectedContract.endDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Durée totale :</span>
                      <span className="font-black text-blue-900">{selectedContract.totalDays} jour(s)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Date d'émission :</span>
                      <span className="font-mono text-slate-600">{selectedContract.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Tarification & Caution XAF</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Tarif journalier :</span>
                      <span className="font-bold text-slate-900">{formatXAF(selectedContract.dailyRateXAF)} / jour</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Montant total contrat :</span>
                      <span className="font-black text-sm text-blue-950">{formatXAF(selectedContract.totalAmountXAF)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Caution obligatoire :</span>
                      <span className="font-bold text-emerald-800">{formatXAF(selectedContract.securityDepositXAF)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Statut de la caution :</span>
                      <span className="font-semibold text-slate-800">{selectedContract.depositReturnedXAF > 0 ? 'Restituée au client' : 'Consignée en agence FCT'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCS */}
          {contractDetailTab === 'DOCS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Documents & Contrats Numérisés</h3>
                  <p className="text-xs text-slate-500">Contrat signé, permis du locataire, attestation d'assurance et état des lieux numérisés</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Rattacher un document</span>
                </button>
              </div>

              {contractDocs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Aucun document numérique rattaché à ce contrat</p>
                  <p className="text-xs text-slate-400">Cliquez sur « Rattacher un document » pour archiver le contrat signé ou le permis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contractDocs.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{doc.title}</h4>
                          <div className="text-[11px] text-slate-500">{doc.category} • Ajouté le {doc.uploadedAt ? doc.uploadedAt.split('T')[0] : 'N/A'}</div>
                          {doc.notes && <div className="text-[11px] text-slate-600 italic mt-0.5">{doc.notes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewerDoc(doc)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Visualiser le contrat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={doc.title}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VEHICLE */}
          {contractDetailTab === 'VEHICLE' && (
            <div className="space-y-4">
              {linkedVeh ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {linkedVeh.photoUrls?.[0] ? (
                      <img src={linkedVeh.photoUrls[0]} alt={linkedVeh.model} className="w-24 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                    ) : (
                      <div className="w-24 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Car className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {linkedVeh.brand} {linkedVeh.model} ({linkedVeh.year})
                      </h4>
                      <div className="text-slate-600 text-xs mt-0.5">
                        Immatriculation : <span className="font-bold text-blue-900">{linkedVeh.licensePlate}</span> • VIN : <span className="font-mono text-slate-700">{linkedVeh.vin}</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        Kilométrage actuel : <span className="font-bold text-slate-800">{linkedVeh.mileage?.toLocaleString()} km</span> • Catégorie : {linkedVeh.category}
                      </div>
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContract(null);
                        onNavigate('vehicles', linkedVeh.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0f2a4a] hover:bg-[#163a66] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start md:self-center"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>Ouvrir Fiche Showroom Véhicule</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs">Véhicule non trouvé.</div>
              )}

              {linkedDrv ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center text-xl font-black shrink-0">
                      {linkedDrv.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1">Chauffeur Professionnel Agréé FCT</div>
                      <h4 className="font-black text-slate-900 text-sm">{linkedDrv.fullName}</h4>
                      <div className="text-slate-600 text-xs mt-0.5">
                        Permis N° : <span className="font-bold">{linkedDrv.licenseNumber}</span> (Cat. {(linkedDrv.licenseCategories || []).join(', ') || 'B'}) • Tél : {linkedDrv.phone}
                      </div>
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContract(null);
                        onNavigate('drivers', linkedDrv.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start md:self-center"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ouvrir Profil Chauffeur</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                  Location en formule autonome sans chauffeur FCT affecté.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CUSTOMER */}
          {contractDetailTab === 'CUSTOMER' && (
            <div className="space-y-4">
              {linkedCust ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {linkedCust.type === 'COMPANY' ? 'Client Entreprise' : 'Client Particulier'}
                    </div>
                    <h4 className="font-black text-slate-900 text-base">
                      {linkedCust.companyName || linkedCust.fullName}
                    </h4>
                    <div className="text-slate-600 text-xs">Téléphone : <span className="font-bold text-slate-900">{linkedCust.phone}</span></div>
                    <div className="text-slate-600 text-xs">Email : {linkedCust.email}</div>
                    <div className="text-slate-600 text-xs">Adresse / Ville : {linkedCust.address}</div>
                    {linkedCust.taxNumber && (
                      <div className="font-mono text-slate-500 text-xs">NIU Fiscal : {linkedCust.taxNumber}</div>
                    )}
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContract(null);
                        onNavigate('crm', linkedCust.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Consulter Fiche Client CRM 360°</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs">Client introuvable.</div>
              )}
            </div>
          )}

          {/* TAB 5: FINANCES */}
          {contractDetailTab === 'FINANCES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                  <div className="text-xs font-bold text-blue-700 uppercase">Montant Total Prévu</div>
                  <div className="text-lg font-black text-blue-950 mt-1">{formatXAF(selectedContract.totalAmountXAF)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Montant Encaissé</div>
                  <div className="text-lg font-black text-emerald-950 mt-1">{formatXAF(selectedContract.paidAmountXAF)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-xs font-bold text-amber-700 uppercase">Solde Restant</div>
                  <div className="text-lg font-black text-amber-950 mt-1">{formatXAF(selectedContract.remainingAmountXAF)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Caution Consignée en Caisse</span>
                  <span className="text-slate-500 text-[11px]">
                    Dépôt de garantie bloqué pour couverture des éventuels dommages ou carburant manquant
                  </span>
                </div>
                <span className="font-black text-sm text-emerald-800">{formatXAF(selectedContract.securityDepositXAF)}</span>
              </div>

              {onNavigate && (
                <div className="flex gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedContract.id;
                      setSelectedContract(null);
                      onNavigate('billing', cid);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Consulter les Factures Liées</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedContract.id;
                      setSelectedContract(null);
                      onNavigate('cash', cid);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Encaisser au Journal de Caisse</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INSPECTION */}
          {contractDetailTab === 'INSPECTION' && (
            <div className="space-y-4">
              {selectedContract.inspectionRetour ? (
                <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <span className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Rapport de Restitution &amp; État des Lieux de Retour</span>
                    </span>
                    <span className="text-xs text-emerald-800 font-mono">
                      {selectedContract.inspectionRetour.signatureDate}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-800">
                    <div>Kilométrage relevé au retour : <span className="font-bold">{selectedContract.inspectionRetour.mileage.toLocaleString()} km</span></div>
                    <div>Jauge de carburant : <span className="font-bold">{selectedContract.inspectionRetour.fuelLevel} / 8</span></div>
                    <div>État de propreté : <span className="font-bold">{selectedContract.inspectionRetour.cleanlinessCondition}</span></div>
                    <div>Inspecteur FCT : <span className="font-semibold">{selectedContract.inspectionRetour.inspectorName}</span></div>
                  </div>
                  {selectedContract.inspectionRetour.bodyConditionNotes && (
                    <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                      <strong>Observations carrosserie :</strong> {selectedContract.inspectionRetour.bodyConditionNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Véhicule actuellement en cours de location</p>
                  <p className="text-xs text-slate-400">L'inspection de retour sera enregistrée lors de la clôture et restitution du véhicule.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TIMELINE */}
          {contractDetailTab === 'TIMELINE' && (
            <EntityTimeline
              events={[
                {
                  id: 'evt-create',
                  date: selectedContract.createdAt,
                  title: `Émission du contrat ${selectedContract.contractNumber}`,
                  description: `Véhicule ${selectedContract.vehicleName} réservé pour ${selectedContract.customerName} du ${selectedContract.startDate} au ${selectedContract.endDate}.`,
                  type: 'INFO',
                },
                ...(selectedContract.status === 'RETURNED' || (selectedContract.status as string) === 'COMPLETED'
                  ? [
                      {
                        id: 'evt-return',
                        date: selectedContract.inspectionRetour?.signatureDate || selectedContract.endDate,
                        title: 'Restitution du véhicule et inspection de fin de contrat',
                        description: 'Véhicule inspecté et remis en état disponible dans la flotte FCT.',
                        type: 'SUCCESS' as const,
                      },
                    ]
                  : []),
                ...(selectedContract.status === 'CANCELLED'
                  ? [
                      {
                        id: 'evt-cancel',
                        date: selectedContract.createdAt,
                        title: 'Annulation du contrat de location',
                        description: 'Contrat annulé administrativement. Caution libérée.',
                        type: 'DANGER' as const,
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </EntityShowroomLayout>

        {/* Modal d'inspection de retour certifié */}
        {returnModalContract && (() => {
          const veh = state.vehicles.find((v) => v.id === returnModalContract.vehicleId);
          const departKm = veh?.mileage || 0;
          const drivenKm = Math.max(0, returnMileage - departKm);
          const netCautionRefund = Math.max(0, returnModalContract.securityDepositXAF - penaltiesAmount);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>État des Lieux Contradictoire &amp; Restitution</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Contrat <strong className="text-slate-900">{returnModalContract.contractNumber}</strong> • Client :{' '}
                    <strong className="text-slate-900">{returnModalContract.customerName}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Véhicule : <strong className="text-slate-800">{veh?.brand} {veh?.model}</strong> (Immat: <strong className="text-blue-900">{veh?.licensePlate || '-'}</strong>)
                  </p>
                </div>

                <form onSubmit={handleConfirmReturn} className="space-y-3.5 text-xs">
                  {/* Kilométrage contradictoire */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-blue-700" />
                        Relevé Kilométrique Contradictoire
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Départ : <strong>{departKm.toLocaleString()} km</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Compteur au retour *</label>
                        <input
                          type="number"
                          min={departKm}
                          value={returnMileage}
                          onChange={(e) => setReturnMileage(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-200 font-black text-sm text-slate-900 bg-white"
                          required
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 uppercase font-black block">Distance Parcourue</span>
                          <span className="font-black text-blue-900 text-sm">+{drivenKm.toLocaleString()} km</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Jauge Carburant & Équipements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5 text-amber-600" />
                        Jauge Carburant au retour *
                      </label>
                      <select
                        value={returnFuel}
                        onChange={(e) => setReturnFuel(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold bg-white"
                      >
                        {[8, 7, 6, 5, 4, 3, 2, 1, 0].map((level) => (
                          <option key={level} value={level}>
                            {level}/8 {level === 8 ? '(Plein complet)' : level === 4 ? '(Demi-plein)' : level <= 2 ? '(Réserve)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Propreté du véhicule *</label>
                      <select
                        value={returnCleanliness}
                        onChange={(e) => setReturnCleanliness(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold bg-white"
                      >
                        <option value="CLEAN">Propre / Conforme</option>
                        <option value="DIRTY">Lavage agence requis (Salissures)</option>
                      </select>
                    </div>
                  </div>

                  {/* Checklist des accessoires */}
                  <div className="flex items-center gap-4 py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={returnSpareWheel}
                        onChange={(e) => setReturnSpareWheel(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900"
                      />
                      <span>Roue de secours présente</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={returnJackTools}
                        onChange={(e) => setReturnJackTools(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900"
                      />
                      <span>Cric &amp; Outils complets</span>
                    </label>
                  </div>

                  {/* Décompte Financier de la Caution */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-emerald-700" />
                        Règlement de Caution (Dépôt : {formatXAF(returnModalContract.securityDepositXAF)})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Pénalités déduites (XAF)</label>
                        <input
                          type="number"
                          min={0}
                          max={returnModalContract.securityDepositXAF}
                          value={penaltiesAmount}
                          onChange={(e) => setPenaltiesAmount(Number(e.target.value))}
                          placeholder="0"
                          className="w-full p-2 rounded-lg border border-slate-200 font-black text-rose-700 bg-white"
                        />
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-300 flex flex-col justify-center text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Restitution Nette au Client</span>
                        <span className="font-black text-emerald-700 text-sm">{formatXAF(netCautionRefund)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Observations d'état de retour / Carrosserie / Motif pénalités</label>
                    <textarea
                      value={penaltyNotes}
                      onChange={(e) => setPenaltyNotes(e.target.value)}
                      placeholder="Ex: Véhicule restitué en parfait état, carrosserie intacte, accessoires vérifiés."
                      rows={2}
                      className="w-full p-2 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setReturnModalContract(null)}
                      className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider &amp; Imprimer PV de Restitution</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Modal d'ajout de document */}
        {isAddDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Rattacher un Document au Contrat</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToContract} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Intitulé du document *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="Ex: Contrat signé par le client, Scan CNI / Permis..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Catégorie du document</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="CONTRAT_SIGNE">Contrat de Location Signé</option>
                    <option value="PERMIS_CONDUIRE">Permis de Conduire Locataire</option>
                    <option value="CNI_PASSEPORT">CNI / Passeport Locataire</option>
                    <option value="ETAT_DES_LIEUX">État des Lieux Numérisé</option>
                    <option value="RECU_CAUTION">Reçu de Caution</option>
                    <option value="AUTRE">Autre Justificatif</option>
                  </select>
                </div>

                <CloudinaryUploadDropzone
                  folder="fct_automobile/rentals"
                  label="Contrat signé / Justificatif (Téléversement Cloudinary FCT) :"
                  helperText="Glissez ou sélectionnez le contrat signé ou permis locataire (PDF, PNG, JPG)"
                  currentValue={docForm.fileUrl}
                  onUploadSuccess={(url) => setDocForm({ ...docForm, fileUrl: url })}
                  onClear={() => setDocForm({ ...docForm, fileUrl: '' })}
                />

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notes / Observations</label>
                  <textarea
                    rows={2}
                    value={docForm.notes}
                    onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                    placeholder="Observations ou annotations..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddDocModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold cursor-pointer shadow-xs"
                  >
                    Enregistrer et Rattacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-emerald-600" />
            <span>{t.rentalsPage.title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.rentalsPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportCollectionToExcel({
                filename: `FCT_Contrats_Location_${new Date().toISOString().split('T')[0]}`,
                sheetName: 'Contrats Location',
                title: 'FCT AUTOMOBILE DOUALA — REGISTRE DES CONTRATS DE LOCATION',
                subtitle: `Exporté le ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')} à ${new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR')} • ${filteredContracts.length} contrat(s)`,
                columns: [
                  { header: t.rentalsPage.contractNumCol, key: 'contractNumber', width: 16 },
                  { header: t.rentalsPage.clientCol, key: 'customerName', width: 26 },
                  { header: t.rentalsPage.vehicleCol, key: 'vehicleName', width: 28 },
                  { header: lang === 'en' ? 'Plate' : 'Immatriculation', key: 'licensePlate', width: 18 },
                  { header: lang === 'en' ? 'Start' : 'Début', key: 'startDate', width: 14 },
                  { header: lang === 'en' ? 'End' : 'Fin', key: 'endDate', width: 14 },
                  { header: lang === 'en' ? 'Days' : 'Jours', key: 'totalDays', width: 10 },
                  { header: t.rentalsPage.dailyRateCol, key: 'dailyRateXAF', width: 18 },
                  { header: t.rentalsPage.totalCol, key: 'totalAmountXAF', width: 18 },
                  { header: lang === 'en' ? 'Paid (XAF)' : 'Encaissé (XAF)', key: 'paidAmountXAF', width: 18 },
                  { header: lang === 'en' ? 'Balance (XAF)' : 'Solde (XAF)', key: 'remainingAmountXAF', width: 18 },
                  { header: t.rentalsPage.depositCol, key: 'securityDepositXAF', width: 18 },
                  { header: t.rentalsPage.statusCol, key: 'status', width: 14 },
                ],
                data: filteredContracts,
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f2a4a] hover:bg-[#163a66] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t.exportCSV} (.xlsx)</span>
          </button>
          {hasEffectivePermission(currentUser, 'rentals', 'create') && (
            <button
              onClick={() => {
                setFormError(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.rentalsPage.newContractBtn}</span>
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

      {/* Filters & View Switcher */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={lang === 'en' ? 'Search contract # (CTR-...), customer, vehicle, driver...' : 'Rechercher n° contrat (CTR-...), client, véhicule, chauffeur...'}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: t.rentalsPage.allTab, count: state.contracts.length },
          { id: 'ACTIVE', label: t.rentalsPage.activeTab, count: activeContractsCount },
          { id: 'COMPLETED', label: t.rentalsPage.returnedTab, count: completedContractsCount },
          {
            id: 'CANCELLED',
            label: lang === 'en' ? 'Cancelled' : 'Annulés',
            count: state.contracts.filter((c) => c.status === 'CANCELLED').length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content: Cards or Table */}
      {filteredContracts.length === 0 ? (
        <EmptyState
          title={t.rentalsPage.emptyRentalsTitle}
          description={t.rentalsPage.emptyRentalsDesc}
          icon={KeyRound}
          action={
            hasEffectivePermission(currentUser, 'rentals', 'create')
              ? { label: t.rentalsPage.newContractBtn, onClick: () => setIsCreateModalOpen(true) }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => {
            const linkedVeh = state.vehicles.find((v) => v.id === contract.vehicleId);
            const isActive = contract.status === 'CONFIRMED' || (contract.status as string) === 'ACTIVE';

            return (
              <EntityCard
                key={contract.id}
                title={contract.contractNumber}
                subtitle={`${contract.customerName} • ${contract.vehicleName}`}
                referenceId={contract.contractNumber}
                imageUrl={linkedVeh?.photoUrls?.[0]}
                fallbackIcon={KeyRound}
                status={contract.status}
                statusLabel={
                  isActive
                    ? 'En Location'
                    : contract.status === 'RETURNED' || (contract.status as string) === 'COMPLETED'
                    ? 'Restitué'
                    : contract.status === 'OVERDUE'
                    ? 'En Retard'
                    : contract.status === 'CANCELLED'
                    ? 'Annulé'
                    : 'Brouillon'
                }
                onClick={() => setSelectedContract(contract)}
                metrics={[
                  {
                    label: 'Période & Durée',
                    value: `${contract.totalDays} jour(s) (${contract.startDate} au ${contract.endDate})`,
                    icon: Calendar,
                  },
                  {
                    label: 'Montant Total XAF',
                    value: formatXAF(contract.totalAmountXAF),
                    icon: DollarSign,
                    highlight: true,
                  },
                  {
                    label: 'Caution Consignée',
                    value: formatXAF(contract.securityDepositXAF),
                    icon: Shield,
                  },
                  {
                    label: 'Chauffeur Dédié',
                    value: contract.driverIncluded ? contract.driverName || 'Oui' : 'Sans chauffeur',
                    icon: User,
                  },
                ]}
                quickActions={
                  <div className="flex items-center gap-1">
                    {isActive && hasEffectivePermission(currentUser, 'rentals', 'update') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReturnModalContract(contract);
                          setReturnMileage(linkedVeh?.mileage || 50000);
                        }}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-2xs"
                        title="Restituer le véhicule"
                      >
                        Retour
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintContract(contract);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Imprimer le contrat"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {isActive && hasEffectivePermission(currentUser, 'rentals', 'update') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelConfirmContract(contract);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                        title="Annuler le contrat"
                      >
                        <Ban className="w-3.5 h-3.5" />
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
                  <th className="py-3 px-4">{t.rentalsPage.contractNumCol}</th>
                  <th className="py-3 px-4">{t.rentalsPage.clientCol}</th>
                  <th className="py-3 px-4">{t.rentalsPage.vehicleCol}</th>
                  <th className="py-3 px-4">{t.rentalsPage.periodCol}</th>
                  <th className="py-3 px-4 text-center">{t.rentalsPage.driverCol}</th>
                  <th className="py-3 px-4 text-right">{t.rentalsPage.totalCol}</th>
                  <th className="py-3 px-4 text-right">{t.rentalsPage.depositCol}</th>
                  <th className="py-3 px-4 text-center">{t.rentalsPage.statusCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((contract) => {
                  const isActive = contract.status === 'CONFIRMED' || (contract.status as string) === 'ACTIVE';

                  return (
                    <tr
                      key={contract.id}
                      onClick={() => setSelectedContract(contract)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{contract.contractNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{contract.customerName}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{contract.vehicleName}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {contract.startDate} → {contract.endDate} ({contract.totalDays}{lang === 'en' ? 'd' : 'j'})
                      </td>
                      <td className="py-3 px-4 text-center">
                        {contract.driverIncluded ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {contract.driverName || (lang === 'en' ? 'Yes' : 'Oui')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">{lang === 'en' ? 'No' : 'Non'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatXAF(contract.totalAmountXAF)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-800 whitespace-nowrap">
                        {formatXAF(contract.securityDepositXAF)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <EntityStatusBadge
                          status={contract.status}
                          label={
                            isActive
                              ? (lang === 'en' ? 'Active Rental' : 'En Location')
                              : contract.status === 'RETURNED' || (contract.status as string) === 'COMPLETED'
                              ? t.rentalsPage.returnedTab
                              : contract.status === 'OVERDUE'
                              ? (lang === 'en' ? 'Overdue' : 'En Retard')
                              : contract.status === 'CANCELLED'
                              ? (lang === 'en' ? 'Cancelled' : 'Annulé')
                              : (lang === 'en' ? 'Draft' : 'Brouillon')
                          }
                          size="sm"
                        />
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isActive && hasEffectivePermission(currentUser, 'rentals', 'update') && (
                          <button
                            onClick={() => {
                              setReturnModalContract(contract);
                              const veh = state.vehicles.find((v) => v.id === contract.vehicleId);
                              setReturnMileage(veh?.mileage || 50000);
                            }}
                            title="Effectuer l'inspection de retour"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Retour</span>
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintContract(contract)}
                          title="Imprimer le contrat"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer inline-flex items-center transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {isActive && hasEffectivePermission(currentUser, 'rentals', 'update') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(contract)}
                              title="Modifier les dates/tarifs"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer inline-flex items-center transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCancelConfirmContract(contract)}
                              title="Annuler le contrat"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer inline-flex items-center transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      

      {/* Return Inspection Modal (Liste / Tableau) */}
      {returnModalContract && (() => {
        const veh = state.vehicles.find((v) => v.id === returnModalContract.vehicleId);
        const departKm = veh?.mileage || 0;
        const drivenKm = Math.max(0, returnMileage - departKm);
        const netCautionRefund = Math.max(0, returnModalContract.securityDepositXAF - penaltiesAmount);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>État des Lieux Contradictoire &amp; Restitution</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Contrat <strong className="text-slate-900">{returnModalContract.contractNumber}</strong> • Client :{' '}
                  <strong className="text-slate-900">{returnModalContract.customerName}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Véhicule : <strong className="text-slate-800">{veh?.brand} {veh?.model}</strong> (Immat: <strong className="text-blue-900">{veh?.licensePlate || '-'}</strong>)
                </p>
              </div>

              <form onSubmit={handleConfirmReturn} className="space-y-3.5 text-xs">
                {/* Kilométrage contradictoire */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-blue-700" />
                      Relevé Kilométrique Contradictoire
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Départ : <strong>{departKm.toLocaleString()} km</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Compteur au retour *</label>
                      <input
                        type="number"
                        min={departKm}
                        value={returnMileage}
                        onChange={(e) => setReturnMileage(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 font-black text-sm text-slate-900 bg-white"
                        required
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-black block">Distance Parcourue</span>
                        <span className="font-black text-blue-900 text-sm">+{drivenKm.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jauge Carburant & Équipements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-600" />
                      Jauge Carburant au retour *
                    </label>
                    <select
                      value={returnFuel}
                      onChange={(e) => setReturnFuel(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 font-bold bg-white"
                    >
                      {[8, 7, 6, 5, 4, 3, 2, 1, 0].map((level) => (
                        <option key={level} value={level}>
                          {level}/8 {level === 8 ? '(Plein complet)' : level === 4 ? '(Demi-plein)' : level <= 2 ? '(Réserve)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Propreté du véhicule *</label>
                    <select
                      value={returnCleanliness}
                      onChange={(e) => setReturnCleanliness(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-slate-200 font-bold bg-white"
                    >
                      <option value="CLEAN">Propre / Conforme</option>
                      <option value="DIRTY">Lavage agence requis (Salissures)</option>
                    </select>
                  </div>
                </div>

                {/* Checklist des accessoires */}
                <div className="flex items-center gap-4 py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnSpareWheel}
                      onChange={(e) => setReturnSpareWheel(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900"
                    />
                    <span>Roue de secours présente</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnJackTools}
                      onChange={(e) => setReturnJackTools(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900"
                    />
                    <span>Cric &amp; Outils complets</span>
                  </label>
                </div>

                {/* Décompte Financier de la Caution */}
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-700" />
                      Règlement de Caution (Dépôt : {formatXAF(returnModalContract.securityDepositXAF)})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Pénalités déduites (XAF)</label>
                      <input
                        type="number"
                        min={0}
                        max={returnModalContract.securityDepositXAF}
                        value={penaltiesAmount}
                        onChange={(e) => setPenaltiesAmount(Number(e.target.value))}
                        placeholder="0"
                        className="w-full p-2 rounded-lg border border-slate-200 font-black text-rose-700 bg-white"
                      />
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-300 flex flex-col justify-center text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-black">Restitution Nette au Client</span>
                      <span className="font-black text-emerald-700 text-sm">{formatXAF(netCautionRefund)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Observations d'état de retour / Carrosserie / Motif pénalités</label>
                  <textarea
                    value={penaltyNotes}
                    onChange={(e) => setPenaltyNotes(e.target.value)}
                    placeholder="Ex: Véhicule restitué en parfait état, carrosserie intacte, accessoires vérifiés."
                    rows={2}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReturnModalContract(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider &amp; Imprimer PV de Restitution</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* New Contract Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-800 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Émettre un Contrat de Location</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
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

            <form onSubmit={handleCreateContract} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client *</label>
                <select
                  value={contractForm.customerId}
                  onChange={(e) => setContractForm({ ...contractForm, customerId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                >
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.fullName} ({c.type}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Véhicule à louer *</label>
                <select
                  value={contractForm.vehicleId}
                  onChange={(e) => handleSelectVehicle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                >
                  {state.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.licensePlate}) - {formatXAF(v.rentalDailyRate)}/j - {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date de début *</label>
                  <input
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date de fin *</label>
                  <input
                    type="date"
                    value={contractForm.endDate}
                    onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tarif Journalier (XAF) *</label>
                  <input
                    type="number"
                    value={contractForm.dailyRateXAF}
                    onChange={(e) => setContractForm({ ...contractForm, dailyRateXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Caution Obligatoire (XAF) *</label>
                  <input
                    type="number"
                    value={contractForm.securityDepositXAF}
                    onChange={(e) => setContractForm({ ...contractForm, securityDepositXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contractForm.driverIncluded}
                    onChange={(e) => setContractForm({ ...contractForm, driverIncluded: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-900"
                  />
                  <span>Option Chauffeur Professionnel Agréé FCT inclus</span>
                </label>

                {contractForm.driverIncluded && (
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Sélectionner le chauffeur</label>
                    <select
                      value={contractForm.driverId}
                      onChange={(e) => setContractForm({ ...contractForm, driverId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 font-bold bg-white"
                    >
                      <option value="">Sélectionner parmi les chauffeurs disponibles</option>
                      {state.drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.status}) - Permis {d.licenseNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  Valider &amp; Imprimer Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {isEditModalOpen && editingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-900" />
              <span>Modifier Contrat {editingContract.contractNumber}</span>
            </h3>

            <form onSubmit={handleSaveEditContract} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date Début *</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date Fin *</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tarif Journalier (XAF)</label>
                  <input
                    type="number"
                    value={editForm.dailyRateXAF}
                    onChange={(e) => setEditForm({ ...editForm, dailyRateXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Caution (XAF)</label>
                  <input
                    type="number"
                    value={editForm.securityDepositXAF}
                    onChange={(e) => setEditForm({ ...editForm, securityDepositXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmContract && (
        <DeleteConfirmModal
          isOpen={Boolean(cancelConfirmContract)}
          title="Annuler le Contrat de Location"
          itemName={`Contrat ${cancelConfirmContract.contractNumber} (${cancelConfirmContract.customerName})`}
          itemDetails={`Période du ${cancelConfirmContract.startDate} au ${cancelConfirmContract.endDate} d'un montant de ${formatXAF(cancelConfirmContract.totalAmountXAF)}.`}
          warningMessage="L'annulation libérera le véhicule et le chauffeur affecté. Cette action sera enregistrée dans le journal d'audit de sécurité."
          onConfirm={handleConfirmCancelContract}
          onCancel={() => setCancelConfirmContract(null)}
        />
      )}
      {/* Modal Visualiseur Universel */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
        lang={lang}
      />
    </div>
  );
};
