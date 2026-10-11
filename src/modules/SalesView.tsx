/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Pipeline Commercial & Ventes Véhicules 360°
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { Language } from '../services/i18n.ts';
import { SaleOrder, SalePipelineStage, AppModule } from '../../packages/shared-types/index.ts';
import { formatXAF, hasEffectivePermission } from '../../packages/business-rules/index.ts';
import { DocumentPrintData } from '../components/DocumentModal.tsx';
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
  Eye,
  Download,
  TrendingUp,
  Plus,
  Printer,
  CheckCircle2,
  FileCheck,
  X,
  ExternalLink,
  Wallet,
  Receipt,
  Car,
  DollarSign,
  AlertCircle,
  FileText,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface SalesViewProps {
  state: DatabaseState;
  lang: Language;
  onOpenPrintModal: (data: DocumentPrintData) => void;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextEntityId?: string | null;
}

export const SalesView: React.FC<SalesViewProps> = ({
  state,
  lang,
  onOpenPrintModal,
  onNavigate,
  contextEntityId,
}) => {
  const currentUser = dbStore.getCurrentUser();
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Selected sale for Showroom / Fiche Détaillée
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const [saleDetailTab, setSaleDetailTab] = useState<'DETAILS' | 'DOCS' | 'VEHICLE' | 'CUSTOMER' | 'FINANCES' | 'TIMELINE'>('DETAILS');

  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [saleForm, setSaleForm] = useState({
    customerId: state.customers[0]?.id || '',
    vehicleId: state.vehicles.find((v) => v.isForSale && v.status !== 'SOLD')?.id || '',
    listedPriceXAF: 28500000,
    negotiatedPriceXAF: 27500000,
    paidAmountXAF: 5000000,
    notes: 'Acompte versé en agence. Reste à la livraison.',
  });

  const stages: { key: SalePipelineStage; label: string; color: string }[] = [
    { key: 'PROSPECT', label: '1. Prospect Intéressé', color: 'bg-slate-100 text-slate-800' },
    { key: 'OFFER', label: '2. Devis / Offre Envoyée', color: 'bg-blue-100 text-blue-800' },
    { key: 'NEGOTIATION', label: '3. Négociation en cours', color: 'bg-purple-100 text-purple-800' },
    { key: 'ORDER', label: '4. Bon de Commande Signé', color: 'bg-amber-100 text-amber-800' },
    { key: 'SOLD', label: '5. Véhicule Vendu', color: 'bg-emerald-100 text-emerald-800' },
    { key: 'DELIVERED', label: '6. Véhicule Livré (PV Signé)', color: 'bg-emerald-200 text-emerald-950 font-bold' },
  ];

  // Deep linking handling from contextEntityId
  useEffect(() => {
    if (contextEntityId) {
      // 1. Is it a Customer ID? (e.g. from CRM "Nouvelle Vente")
      const matchingCustomer = state.customers.find((c) => c.id === contextEntityId);
      if (matchingCustomer) {
        setSaleForm((prev) => ({
          ...prev,
          customerId: matchingCustomer.id,
        }));
        setSelectedSale(null);
        setIsNewSaleModalOpen(true);
        return;
      }

      // 2. Is it a Vehicle ID? (e.g. from Showroom "Vendre ce véhicule")
      const matchingVeh = state.vehicles.find((v) => v.id === contextEntityId);
      if (matchingVeh) {
        setSaleForm((prev) => ({
          ...prev,
          vehicleId: matchingVeh.id,
          listedPriceXAF: matchingVeh.salePrice || 25000000,
          negotiatedPriceXAF: matchingVeh.salePrice || 25000000,
        }));
        setSelectedSale(null);
        setIsNewSaleModalOpen(true);
        return;
      }

      // 3. Is it a Sale Order ID? (view showroom)
      const matchingSale = state.sales.find((s) => s.id === contextEntityId);
      if (matchingSale) {
        setSelectedSale(matchingSale);
        return;
      }
    }
  }, [contextEntityId, state.vehicles, state.customers, state.sales]);

  const handleSelectVehicle = (vehId: string) => {
    const veh = state.vehicles.find((v) => v.id === vehId);
    if (veh) {
      setSaleForm({
        ...saleForm,
        vehicleId: vehId,
        listedPriceXAF: veh.salePrice || 25000000,
        negotiatedPriceXAF: veh.salePrice || 25000000,
      });
    }
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const customer = state.customers.find((c) => c.id === saleForm.customerId);
    const vehicle = state.vehicles.find((v) => v.id === saleForm.vehicleId);
    if (!customer || !vehicle) {
      setFormError('Veuillez sélectionner un client et un véhicule valides.');
      return;
    }

    try {
      const created = dbStore.addSaleOrder({
        customerId: customer.id,
        customerName: customer.companyName || customer.fullName,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
        listedPriceXAF: saleForm.listedPriceXAF,
        negotiatedPriceXAF: saleForm.negotiatedPriceXAF,
        paidAmountXAF: saleForm.paidAmountXAF,
        balanceXAF: Math.max(0, saleForm.negotiatedPriceXAF - saleForm.paidAmountXAF),
        stage: 'ORDER',
        salesAgentId: dbStore.getCurrentUser().id,
        salesAgentName: dbStore.getCurrentUser().fullName,
        notes: saleForm.notes,
      });

      setIsNewSaleModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Bon de commande ${created.orderNumber} créé avec succès. Facture de vente générée automatiquement.`,
      });
      setTimeout(() => setActionAlert(null), 5000);

      handlePrintSaleOrder(created);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création de la vente.');
    }
  };

  const handleStageChange = (saleId: string, newStage: SalePipelineStage) => {
    try {
      dbStore.updateSaleStage(saleId, newStage);
      if (selectedSale?.id === saleId) {
        const updated = state.sales.find((s) => s.id === saleId);
        if (updated) setSelectedSale(updated);
      }
      if (newStage === 'SOLD' || newStage === 'DELIVERED') {
        setActionAlert({
          type: 'info',
          message: `Statut mis à jour : le véhicule a été automatiquement marqué comme VENDU dans la flotte FCT.`,
        });
      } else {
        setActionAlert({
          type: 'success',
          message: `Étape commerciale mise à jour avec succès.`,
        });
      }
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur de mise à jour' });
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  const handlePrintSaleOrder = (sale: SaleOrder) => {
    const customer = state.customers.find((c) => c.id === sale.customerId);
    const printData: DocumentPrintData = {
      title: 'BON DE COMMANDE DE VÉHICULE (FCT)',
      docNumber: sale.orderNumber,
      date: sale.createdAt.split('T')[0],
      customerName: sale.customerName,
      customerPhone: customer?.phone,
      customerAddress: customer?.address,
      customerNiu: customer?.taxNumber,
      items: [
        {
          description: `Vente véhicule automobile ${sale.vehicleName}`,
          qty: 1,
          unitPrice: sale.negotiatedPriceXAF,
          total: sale.negotiatedPriceXAF,
        },
      ],
      totalAmountXAF: sale.negotiatedPriceXAF,
      notes: `Acompte versé : ${formatXAF(sale.paidAmountXAF)}. Solde dû à la livraison : ${formatXAF(
        sale.balanceXAF
      )}. Le transfert de propriété et la remise de carte grise s'effectueront après complet paiement du prix convenu.`,
      signatureRole1: 'L’Acquéreur (Lu et approuvé)',
      signatureRole2: 'Pour Franchise Conseils Trading (Direction Commerciale)',
    };
    onOpenPrintModal(printData);
  };

  // Top KPIs
  const totalSalesVolume = state.sales.reduce((acc, s) => acc + s.negotiatedPriceXAF, 0);
  const totalCollected = state.sales.reduce((acc, s) => acc + s.paidAmountXAF, 0);
  const totalPendingBalance = state.sales.reduce((acc, s) => acc + s.balanceXAF, 0);
  const deliveredCount = state.sales.filter((s) => s.stage === 'DELIVERED').length;

  const kpis = [
    {
      id: 'kpi-volume',
      label: 'Volume Commercial Ventes',
      value: formatXAF(totalSalesVolume),
      sublabel: `${state.sales.length} dossiers engagés`,
      icon: TrendingUp,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-collected',
      label: 'Acomptes & Encaissés',
      value: formatXAF(totalCollected),
      sublabel: 'Règlements reçus en agence',
      icon: CheckCircle2,
      colorVariant: 'emerald' as const,
    },
    {
      id: 'kpi-balance',
      label: 'Soldes à la Livraison',
      value: formatXAF(totalPendingBalance),
      sublabel: 'En attente de remise des clés',
      icon: Clock,
      colorVariant: totalPendingBalance > 0 ? ('amber' as const) : ('slate' as const),
    },
    {
      id: 'kpi-delivered',
      label: 'Véhicules Livrés',
      value: deliveredCount,
      sublabel: 'PV de réception signés',
      icon: FileCheck,
      colorVariant: 'purple' as const,
    },
  ];

  // Filtered sales

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'BON_DE_COMMANDE',
    fileUrl: '',
    notes: '',
  });

  const handleAddDocumentToSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    try {
      const newDoc = {
        id: `doc_sale_${Date.now()}`,
        title: docForm.title || `Bon de Commande Signé - ${selectedSale.orderNumber}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        uploadedAt: new Date().toISOString(),
        relatedEntityId: selectedSale.id,
        relatedSaleId: selectedSale.id,
        notes: docForm.notes || `Document rattaché à la vente ${selectedSale.orderNumber}`,
      };
      dbStore.addDocument(newDoc as any);
      setIsAddDocModalOpen(false);
      setDocForm({ title: '', category: 'BON_DE_COMMANDE', fileUrl: '', notes: '' });
      setActionAlert({ type: 'success', message: 'Document rattaché avec succès au dossier de vente.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du document' });
    }
  };

  const filteredSales = useMemo(() => {
    return state.sales.filter((sale) => {
      const matchesStage = activeStageFilter === 'ALL' || sale.stage === activeStageFilter;
      const matchesSearch =
        sale.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(search.toLowerCase()) ||
        sale.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
        sale.salesAgentName.toLowerCase().includes(search.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [state.sales, activeStageFilter, search]);


  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DU DOSSIER DE VENTE SÉLECTIONNÉ
  // =========================================================================
  if (selectedSale) {
    const linkedVeh = state.vehicles.find((v) => v.id === selectedSale.vehicleId);
    const linkedCust = state.customers.find((c) => c.id === selectedSale.customerId);
    const saleDocs = (state.documents || []).filter(
      (d: any) => d.relatedEntityId === selectedSale.id || d.relatedSaleId === selectedSale.id
    );

    return (
      <>
        <EntityShowroomLayout
          backLabel="Retour aux dossiers de vente"
          onBack={() => setSelectedSale(null)}
          title={`Bon de Commande ${selectedSale.orderNumber}`}
          subtitle={`${selectedSale.customerName} • ${selectedSale.vehicleName}`}
          referenceId={selectedSale.orderNumber}
          status={selectedSale.stage}
          avatarImageUrl={linkedVeh?.photoUrls?.[0]}
          avatarIcon={TrendingUp}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Rattacher Document</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintSaleOrder(selectedSale)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer Bon de Commande</span>
              </button>
              {selectedSale.stage !== 'DELIVERED' &&
                hasEffectivePermission(currentUser, 'sales', 'update') && (
                  <button
                    type="button"
                    onClick={() => handleStageChange(selectedSale.id, 'DELIVERED')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Valider la Livraison (PV)</span>
                  </button>
                )}
            </div>
          }
          kpis={[
            {
              label: 'Prix Négocié Net',
              value: formatXAF(selectedSale.negotiatedPriceXAF),
              sublabel: `Prix catalogue: ${formatXAF(selectedSale.listedPriceXAF)}`,
              highlight: true,
            },
            {
              label: 'Acompte Encaissé',
              value: formatXAF(selectedSale.paidAmountXAF),
              sublabel: 'Règlement validé en caisse',
            },
            {
              label: 'Solde Restant Dû',
              value: formatXAF(selectedSale.balanceXAF),
              sublabel: selectedSale.balanceXAF === 0 ? 'Dossier soldé à 100%' : 'À percevoir avant livraison',
            },
            {
              label: 'Conseiller Commercial',
              value: selectedSale.salesAgentName || 'Équipe FCT Douala',
              sublabel: `Date: ${selectedSale.createdAt.split('T')[0]}`,
            },
          ]}
          tabs={[
            { id: 'DETAILS', label: 'Commande & Tarifs', icon: TrendingUp },
            { id: 'DOCS', label: 'Documents & PV Signés', icon: FileText, badge: saleDocs.length },
            { id: 'VEHICLE', label: 'Véhicule Vendu', icon: Car },
            { id: 'CUSTOMER', label: 'Client Acquéreur', icon: User },
            { id: 'FINANCES', label: 'Facturation & Caisse', icon: DollarSign },
            { id: 'TIMELINE', label: 'Pipeline Commercial', icon: Clock },
          ]}
          activeTab={saleDetailTab}
          onTabChange={(t) => setSaleDetailTab(t as any)}
        >
          {/* TAB 1: DETAILS */}
          {saleDetailTab === 'DETAILS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Synthèse Financière de la Vente</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Prix catalogue initial :</span>
                      <span className="font-bold text-slate-900">{formatXAF(selectedSale.listedPriceXAF)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Prix de vente final négocié :</span>
                      <span className="font-black text-sm text-blue-950">{formatXAF(selectedSale.negotiatedPriceXAF)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Remise commerciale accordée :</span>
                      <span className="font-bold text-emerald-800">
                        {formatXAF(Math.max(0, selectedSale.listedPriceXAF - selectedSale.negotiatedPriceXAF))}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Date d'ouverture dossier :</span>
                      <span className="font-mono text-slate-600">{selectedSale.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Conditions Particulières & Notes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 min-h-[90px] border border-slate-100">
                    {selectedSale.notes || 'Aucune observation particulière enregistrée.'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Commercial référent FCT : <strong className="text-slate-900">{selectedSale.salesAgentName}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCS */}
          {saleDetailTab === 'DOCS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Documents & Justificatifs de Vente</h3>
                  <p className="text-xs text-slate-500">Bon de commande signé, PV de livraison contradictoire, carte grise barrée, scan CNI</p>
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

              {saleDocs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Aucun document numérique rattaché à ce dossier de vente</p>
                  <p className="text-xs text-slate-400">Cliquez sur « Rattacher un document » pour archiver le bon de commande ou le PV de livraison.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {saleDocs.map((doc: any) => (
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
                          title="Visualiser le bon"
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
          {saleDetailTab === 'VEHICLE' && (
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
                        setSelectedSale(null);
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
            </div>
          )}

          {/* TAB 4: CUSTOMER */}
          {saleDetailTab === 'CUSTOMER' && (
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
                        setSelectedSale(null);
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
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs">Client acquéreur introuvable.</div>
              )}
            </div>
          )}

          {/* TAB 5: FINANCES */}
          {saleDetailTab === 'FINANCES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                  <div className="text-xs font-bold text-blue-700 uppercase">Prix Total Vente</div>
                  <div className="text-lg font-black text-blue-950 mt-1">{formatXAF(selectedSale.negotiatedPriceXAF)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Acompte / Règlements Reçus</div>
                  <div className="text-lg font-black text-emerald-950 mt-1">{formatXAF(selectedSale.paidAmountXAF)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-xs font-bold text-amber-700 uppercase">Solde Restant à Percevoir</div>
                  <div className="text-lg font-black text-amber-950 mt-1">{formatXAF(selectedSale.balanceXAF)}</div>
                </div>
              </div>

              {onNavigate && (
                <div className="flex gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const sid = selectedSale.id;
                      setSelectedSale(null);
                      onNavigate('billing', sid);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Consulter les Factures de Vente Liées</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sid = selectedSale.id;
                      setSelectedSale(null);
                      onNavigate('cash', sid);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Encaisser Acompte / Solde en Caisse</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TIMELINE */}
          {saleDetailTab === 'TIMELINE' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="font-bold text-slate-800 text-xs mb-3">Progression du Pipeline de Vente</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {stages.map((stg, idx) => {
                    const currentIdx = stages.findIndex((s) => s.key === selectedSale.stage);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div
                        key={stg.key}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wider">{idx + 1}. Étape</div>
                        <div className="text-xs truncate">{stg.label.split('. ')[1]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <EntityTimeline
                events={[
                  {
                    id: 'evt-order',
                    date: selectedSale.createdAt,
                    title: `Émission du bon de commande ${selectedSale.orderNumber}`,
                    description: `Création du dossier de vente pour ${selectedSale.vehicleName} au client ${selectedSale.customerName}.`,
                    type: 'INFO',
                  },
                  ...(selectedSale.stage === 'DELIVERED'
                    ? [
                        {
                          id: 'evt-deliv',
                          date: selectedSale.deliveryDate || selectedSale.createdAt,
                          title: 'Livraison contradictoire du véhicule avec PV de remise des clés',
                          description: 'Clés et documents administratifs remis au client acquéreur.',
                          type: 'SUCCESS' as const,
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          )}
        </EntityShowroomLayout>

        {/* Modal d'ajout de document */}
        {isAddDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Rattacher un Document à la Vente</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToSale} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Intitulé du document *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="Ex: Bon de commande signé, PV livraison, Scan CNI acquéreur..."
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
                    <option value="BON_DE_COMMANDE">Bon de Commande Signé</option>
                    <option value="PV_LIVRAISON">PV de Livraison Contradictoire</option>
                    <option value="CARTE_GRISE">Carte Grise / Certificat d'immatriculation</option>
                    <option value="CNI_PASSEPORT">CNI / Passeport Acquéreur</option>
                    <option value="RECU_ACOMPTE">Reçu d'Acompte / Caisse</option>
                    <option value="AUTRE">Autre Justificatif</option>
                  </select>
                </div>

                <CloudinaryUploadDropzone
                  folder="fct_automobile/sales"
                  label="Bon de commande / PV signé (Téléversement Cloudinary FCT) :"
                  helperText="Glissez ou sélectionnez le bon signé, PV de livraison ou scan CNI (PDF, PNG, JPG)"
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Ventes Véhicules &amp; Showroom Commercial</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bons de commande, négociation, acomptes et livraisons de véhicules neufs et occasions certifiées à Douala
          </p>
        </div>

        {hasEffectivePermission(currentUser, 'sales', 'create') && (
          <button
            onClick={() => {
              setFormError(null);
              setIsNewSaleModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Bon de Commande Vente</span>
          </button>
        )}
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : actionAlert.type === 'info'
              ? 'bg-blue-50 border-blue-300 text-blue-800'
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

      {/* Search & Tabs */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par n° de commande (VNT-...), client, véhicule, commercial..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: `Toutes (${state.sales.length})` },
          { id: 'ORDER', label: 'Bons de Commande', count: state.sales.filter((s) => s.stage === 'ORDER').length },
          { id: 'SOLD', label: 'Vendus', count: state.sales.filter((s) => s.stage === 'SOLD').length },
          { id: 'DELIVERED', label: 'Livrés (PV)', count: state.sales.filter((s) => s.stage === 'DELIVERED').length },
        ]}
        activeTab={activeStageFilter}
        onTabChange={setActiveStageFilter}
      />

      {/* Content: Cards or Table */}
      {filteredSales.length === 0 ? (
        <EmptyState
          title="Aucune commande de vente trouvée"
          description="Aucune commande ne correspond à vos filtres actuels."
          icon={TrendingUp}
          action={
            hasEffectivePermission(currentUser, 'sales', 'create')
              ? { label: 'Créer un bon de commande', onClick: () => setIsNewSaleModalOpen(true) }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSales.map((sale) => {
            const linkedVeh = state.vehicles.find((v) => v.id === sale.vehicleId);
            const isDelivered = sale.stage === 'DELIVERED';

            return (
              <EntityCard
                key={sale.id}
                title={sale.orderNumber}
                subtitle={`${sale.customerName} • ${sale.vehicleName}`}
                referenceId={sale.orderNumber}
                imageUrl={linkedVeh?.photoUrls?.[0]}
                fallbackIcon={TrendingUp}
                status={sale.stage}
                statusLabel={
                  sale.stage === 'DELIVERED'
                    ? 'Livré'
                    : sale.stage === 'SOLD'
                    ? 'Vendu'
                    : 'Commande'
                }
                onClick={() => setSelectedSale(sale)}
                metrics={[
                  {
                    label: 'Prix Négocié XAF',
                    value: formatXAF(sale.negotiatedPriceXAF),
                    icon: DollarSign,
                    highlight: true,
                  },
                  {
                    label: 'Acompte Versé',
                    value: formatXAF(sale.paidAmountXAF),
                    icon: CheckCircle2,
                  },
                  {
                    label: 'Solde Dû Livraison',
                    value: formatXAF(sale.balanceXAF),
                    icon: Clock,
                    highlight: sale.balanceXAF > 0,
                  },
                  {
                    label: 'Commercial Référent',
                    value: sale.salesAgentName,
                    icon: User,
                  },
                ]}
                quickActions={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintSaleOrder(sale);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Imprimer le bon de commande"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {!isDelivered && hasEffectivePermission(currentUser, 'sales', 'update') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStageChange(sale.id, 'DELIVERED');
                        }}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs transition"
                        title="Marquer comme livré (PV)"
                      >
                        Livrer
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
            <table className="w-full min-w-[750px] text-xs text-left">
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">N° Commande</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Véhicule</th>
                  <th className="py-3 px-4 text-right">Prix Négocié</th>
                  <th className="py-3 px-4 text-right">Acompte Payé</th>
                  <th className="py-3 px-4 text-right">Solde Dû</th>
                  <th className="py-3 px-4 text-center">Étape Pipeline</th>
                  <th className="py-3 px-4">Commercial</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{sale.orderNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sale.customerName}</td>
                    <td className="py-3 px-4 text-slate-700">{sale.vehicleName}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatXAF(sale.negotiatedPriceXAF)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {formatXAF(sale.paidAmountXAF)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        sale.balanceXAF > 0 ? 'text-amber-700 font-black' : 'text-slate-400'
                      }`}
                    >
                      {formatXAF(sale.balanceXAF)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <EntityStatusBadge status={sale.stage} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-600">{sale.salesAgentName}</td>
                    <td
                      className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handlePrintSaleOrder(sale)}
                        title="Imprimer bon de commande"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer inline-flex items-center transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {sale.stage !== 'DELIVERED' && hasEffectivePermission(currentUser, 'sales', 'update') && (
                        <button
                          onClick={() => handleStageChange(sale.id, 'DELIVERED')}
                          title="Marquer comme livré"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>Livrer</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      

      {/* New Sale Modal */}
      {isNewSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Nouveau Bon de Commande Vente Véhicule</span>
              </h3>
              <button
                onClick={() => setIsNewSaleModalOpen(false)}
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

            <form onSubmit={handleCreateSale} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Acquéreur *</label>
                <select
                  value={saleForm.customerId}
                  onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
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
                <label className="block text-slate-700 font-bold mb-1">Véhicule à Vendre *</label>
                <select
                  value={saleForm.vehicleId}
                  onChange={(e) => handleSelectVehicle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                >
                  {state.vehicles
                    .filter((v) => v.isForSale && v.status !== 'SOLD')
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.licensePlate}) - Prix: {formatXAF(v.salePrice || 25000000)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prix Catalogue (XAF)</label>
                  <input
                    type="number"
                    value={saleForm.listedPriceXAF}
                    onChange={(e) => setSaleForm({ ...saleForm, listedPriceXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prix Négocié Final (XAF) *</label>
                  <input
                    type="number"
                    value={saleForm.negotiatedPriceXAF}
                    onChange={(e) => setSaleForm({ ...saleForm, negotiatedPriceXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Acompte Immédiat Reçu (XAF)</label>
                <input
                  type="number"
                  value={saleForm.paidAmountXAF}
                  onChange={(e) => setSaleForm({ ...saleForm, paidAmountXAF: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes &amp; Modalités particulières</label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewSaleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  Créer Bon de Commande &amp; Facture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Visualiseur Universel */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
      />
    </div>
  );
};
