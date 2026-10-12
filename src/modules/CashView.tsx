/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Caisse Certifiée & Journal Immuable XAF 360°
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { Language, translations } from '../services/i18n.ts';
import { CashMovement, CashMovementCategory, CashMovementType, AppModule } from '../../packages/shared-types/index.ts';
import { formatXAF, hasEffectivePermission } from '../../packages/business-rules/index.ts';
import { CashDenominationGrid } from '../components/cash/CashDenominationGrid.tsx';
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
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Printer,
  X,
  Receipt,
  FileText,
  KeyRound,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  Clock,
  DollarSign,
} from 'lucide-react';

interface CashViewProps {
  state: DatabaseState;
  lang: Language;
  onOpenPrintModal: (data: DocumentPrintData) => void;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextEntityId?: string | null;
}

export const CashView: React.FC<CashViewProps> = ({
  state,
  lang,
  onOpenPrintModal,
  onNavigate,
  contextEntityId,
}) => {
  const t = translations[lang];
  const currentUser = dbStore.getCurrentUser();
  const activeSession = state.cashSessions.find((s) => s.status === 'OPEN');

  const [activeTab, setActiveTab] = useState<'ALL' | 'INFLOW' | 'OUTFLOW' | 'REVERSALS'>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Selected movement for Showroom / Fiche Détaillée
  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);
  const [movementDetailTab, setMovementDetailTab] = useState<'DETAILS' | 'DOCS' | 'RELATIONS' | 'AUDIT'>('DETAILS');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [reversalTarget, setReversalTarget] = useState<CashMovement | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Movement Form State
  const [movementForm, setMovementForm] = useState({
    type: 'INFLOW' as CashMovementType,
    category: 'RENTAL_PAYMENT' as CashMovementCategory,
    amountXAF: 50000,
    receivedFromOrPaidTo: '',
    reason: '',
    justificationReceiptUrl: '',
    relatedContractId: '',
    relatedInvoiceId: '',
    relatedSaleOrderId: '',
  });

  // Session Open/Close State
  const [openingBalance, setOpeningBalance] = useState(250000);
  const [openBilletageSummary, setOpenBilletageSummary] = useState('');
  const [countedClosing, setCountedClosing] = useState(0);
  const [closeBilletageSummary, setCloseBilletageSummary] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [openMode, setOpenMode] = useState<'billetage' | 'quick'>('billetage');
  const [closeMode, setCloseMode] = useState<'billetage' | 'quick'>('billetage');

  // Handle contextual deep link (from Billing, Rentals, or Sales)
  useEffect(() => {
    if (contextEntityId && activeSession) {
      const inv = state.invoices.find((i) => i.id === contextEntityId);
      if (inv) {
        setMovementForm({
          type: 'INFLOW',
          category: inv.relatedSaleOrderId ? 'SALE_PAYMENT' : 'RENTAL_PAYMENT',
          amountXAF: inv.balanceXAF > 0 ? inv.balanceXAF : inv.totalAmountXAF,
          receivedFromOrPaidTo: inv.customerName,
          reason: `Règlement facture ${inv.invoiceNumber}`,
          justificationReceiptUrl: '',
          relatedContractId: inv.relatedContractId || '',
          relatedInvoiceId: inv.id,
          relatedSaleOrderId: inv.relatedSaleOrderId || '',
        });
        setIsRecordModalOpen(true);
        return;
      }

      const contract = state.contracts.find((c) => c.id === contextEntityId);
      if (contract) {
        setMovementForm({
          type: 'INFLOW',
          category: 'RENTAL_PAYMENT',
          amountXAF: contract.remainingAmountXAF > 0 ? contract.remainingAmountXAF : contract.dailyRateXAF,
          receivedFromOrPaidTo: contract.customerName,
          reason: `Règlement contrat location ${contract.contractNumber}`,
          justificationReceiptUrl: '',
          relatedContractId: contract.id,
          relatedInvoiceId: '',
          relatedSaleOrderId: '',
        });
        setSelectedMovement(null);
        setIsRecordModalOpen(true);
        return;
      }

      const sale = state.sales.find((s) => s.id === contextEntityId);
      if (sale) {
        setMovementForm({
          type: 'INFLOW',
          category: 'SALE_PAYMENT',
          amountXAF: sale.balanceXAF > 0 ? sale.balanceXAF : sale.paidAmountXAF,
          receivedFromOrPaidTo: sale.customerName,
          reason: `Règlement vente véhicule ${sale.vehicleName} (Bon ${sale.orderNumber})`,
          justificationReceiptUrl: '',
          relatedContractId: '',
          relatedInvoiceId: '',
          relatedSaleOrderId: sale.id,
        });
        setSelectedMovement(null);
        setIsRecordModalOpen(true);
        return;
      }

      const mov = state.cashMovements.find((m) => m.id === contextEntityId);
      if (mov) {
        setSelectedMovement(mov);
        return;
      }
    }
  }, [contextEntityId, activeSession, state.invoices, state.contracts, state.sales, state.cashMovements]);

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setFormError(null);

    // Contrôles anti-fraude stricts pour les décaissements (OUTFLOW)
    if (movementForm.type === 'OUTFLOW') {
      if (!movementForm.receivedFromOrPaidTo.trim()) {
        setFormError('Le tiers bénéficiaire du décaissement est strictement obligatoire.');
        return;
      }
      if (movementForm.reason.trim().length < 5) {
        setFormError('Le motif du décaissement doit être explicite (minimum 5 caractères).');
        return;
      }
    }

    try {
      const recorded = dbStore.recordCashMovement({
        sessionId: activeSession.id,
        type: movementForm.type,
        category: movementForm.category,
        amountXAF: movementForm.amountXAF,
        receivedFromOrPaidTo: movementForm.receivedFromOrPaidTo,
        reason: movementForm.reason,
        justificationReceiptUrl: movementForm.justificationReceiptUrl || undefined,
        relatedContractId: movementForm.relatedContractId || undefined,
        relatedInvoiceId: movementForm.relatedInvoiceId || undefined,
        relatedSaleOrderId: movementForm.relatedSaleOrderId || undefined,
      });

      setIsRecordModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Écriture de caisse validée : Reçu officiel ${recorded.receiptNumber} (${formatXAF(
          recorded.amountXAF
        )}).`,
      });
      setTimeout(() => setActionAlert(null), 5000);

      handlePrintReceipt(recorded);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l’enregistrement de caisse');
    }
  };

  const handleConfirmReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget) return;

    try {
      const reversal = dbStore.reverseCashMovement(reversalTarget.id, reversalReason);
      setReversalTarget(null);
      setReversalReason('');
      if (selectedMovement?.id === reversalTarget.id) {
        setSelectedMovement(null);
      }
      setActionAlert({
        type: 'success',
        message: `Contre-passation effectuée (Reçu d'annulation : ${reversal.receiptNumber}). Soldes rétablis.`,
      });
      setTimeout(() => setActionAlert(null), 5000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la contre-passation' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = dbStore.openCashSession(openingBalance);
      setIsOpenModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Session de caisse ${session.sessionNumber} ouverte avec un fonds initial de ${formatXAF(openingBalance)}. ${openBilletageSummary ? openBilletageSummary : ''}`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l’ouverture de caisse' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const discrepancy = countedClosing - activeSession.calculatedExpectedBalanceXAF;
    if (discrepancy !== 0 && !closingNotes.trim()) {
      setActionAlert({
        type: 'error',
        message: `Un écart de caisse de ${formatXAF(discrepancy)} a été détecté. La justification écrite de cet écart est obligatoire avant scellement.`,
      });
      setTimeout(() => setActionAlert(null), 6000);
      return;
    }

    const fullNotes = [
      closingNotes.trim(),
      closeBilletageSummary.trim()
    ].filter(Boolean).join(' | ');

    try {
      const session = dbStore.closeCashSession(activeSession.id, countedClosing, fullNotes || undefined);
      setIsCloseModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Session de caisse ${session.sessionNumber} clôturée et scellée. Solde physique : ${formatXAF(
          countedClosing
        )} (Écart : ${formatXAF(session.discrepancyXAF || 0)}).`,
      });
      setTimeout(() => setActionAlert(null), 5000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la clôture de caisse' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const handlePrintReceipt = (mov: CashMovement) => {
    const printData: DocumentPrintData = {
      title: mov.type === 'INFLOW' ? 'REÇU OFFICIEL DE CAISSE (ESPÈCES)' : 'BON DE DÉCAISSEMENT EN ESPÈCES',
      docNumber: mov.receiptNumber,
      date: mov.createdAt.split('T')[0],
      customerName: mov.receivedFromOrPaidTo,
      items: [
        {
          description: `Règlement ${t.cashCategory[mov.category]} - ${mov.reason || 'Conforme aux opérations FCT'}`,
          qty: 1,
          unitPrice: mov.amountXAF,
          total: mov.amountXAF,
        },
      ],
      totalAmountXAF: mov.amountXAF,
      notes: `Mode de paiement : 100% ESPÈCES (XAF). Écritures certifiées FCT Automobile Douala (Carrefour Santa Barbara). Opération N° ${mov.id}. ${
        mov.isReversal ? `ATTENTION : CONTRE-PASSATION DU REÇU ${mov.reversalOfReceiptNumber || ''}.` : ''
      }`,
      signatureRole1: mov.type === 'INFLOW' ? 'Le Payeur (Décharge)' : 'Le Bénéficiaire (Reçu)',
      signatureRole2: 'La Caissière FCT (Reçu certifié conforme)',
    };
    onOpenPrintModal(printData);
  };

  // KPIs
  const currentExpectedBalance = activeSession ? activeSession.calculatedExpectedBalanceXAF : 0;
  const currentInflow = activeSession ? activeSession.currentCashInXAF : 0;
  const currentOutflow = activeSession ? activeSession.currentCashOutXAF : 0;

  const kpis = [
    {
      id: 'kpi-balance',
      label: t.cashPage.theoreticalBalance,
      value: formatXAF(currentExpectedBalance),
      sublabel: activeSession ? `${t.cashPage.sessionCol} ${activeSession.sessionNumber}` : t.noActiveSession,
      icon: Wallet,
      colorVariant: 'emerald' as const,
    },
    {
      id: 'kpi-inflow',
      label: t.cashPage.totalInflows,
      value: formatXAF(currentInflow),
      sublabel: t.cashPage.inflowsSublabel,
      icon: ArrowDownLeft,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-outflow',
      label: t.cashPage.totalOutflows,
      value: formatXAF(currentOutflow),
      sublabel: t.cashPage.outflowsSublabel,
      icon: ArrowUpRight,
      colorVariant: 'amber' as const,
    },
    {
      id: 'kpi-status',
      label: t.cashPage.cashStatus,
      value: activeSession ? t.cashPage.sessionOpen : t.cashPage.sessionClosed,
      sublabel: activeSession ? `${t.cashPage.cashierLabel} ${activeSession.openedByName}` : t.cashPage.openRequired,
      icon: activeSession ? Unlock : Lock,
      colorVariant: activeSession ? ('purple' as const) : ('slate' as const),
    },
  ];


  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'RECU_CAISSE',
    fileUrl: '',
    notes: '',
  });

  const handleAddDocumentToMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovement) return;
    try {
      const newDoc = {
        id: `doc_cash_${Date.now()}`,
        title: docForm.title || `Reçu de Caisse - ${selectedMovement.receiptNumber}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        uploadedAt: new Date().toISOString(),
        relatedEntityId: selectedMovement.id,
        relatedReceiptNumber: selectedMovement.receiptNumber,
        notes: docForm.notes || `Justificatif d'encaissement/décaissement reçu ${selectedMovement.receiptNumber}`,
      };
      dbStore.addDocument(newDoc as any);
      setIsAddDocModalOpen(false);
      setDocForm({ title: '', category: 'RECU_CAISSE', fileUrl: '', notes: '' });
      setActionAlert({ type: 'success', message: 'Justificatif rattaché avec succès à l\'écriture de caisse.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du justificatif' });
    }
  };

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return state.cashMovements.filter((mov) => {
      if (activeTab === 'INFLOW' && (mov.type !== 'INFLOW' || mov.isReversal)) return false;
      if (activeTab === 'OUTFLOW' && (mov.type !== 'OUTFLOW' || mov.isReversal)) return false;
      if (activeTab === 'REVERSALS' && !mov.isReversal) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRec = mov.receiptNumber.toLowerCase().includes(q);
        const matchTiers = mov.receivedFromOrPaidTo.toLowerCase().includes(q);
        const matchReason = (mov.reason || '').toLowerCase().includes(q);
        return matchRec || matchTiers || matchReason;
      }
      return true;
    });
  }, [state.cashMovements, activeTab, search]);


  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DE L'ÉCRITURE DE CAISSE SÉLECTIONNÉE
  // =========================================================================
  if (selectedMovement) {
    const cashDocs = (state.documents || []).filter(
      (d: any) => d.relatedEntityId === selectedMovement.id || d.relatedReceiptNumber === selectedMovement.receiptNumber
    );

    return (
      <>
        <EntityShowroomLayout
          backLabel={t.cashPage.backToJournal}
          onBack={() => setSelectedMovement(null)}
          title={`${lang === 'en' ? 'Cash Entry' : 'Écriture de Caisse'} ${selectedMovement.receiptNumber}`}
          subtitle={`${selectedMovement.receivedFromOrPaidTo} • ${t.cashCategory[selectedMovement.category]}`}
          referenceId={selectedMovement.receiptNumber}
          status={selectedMovement.isReversal ? 'CANCELLED' : selectedMovement.type === 'INFLOW' ? 'ACTIVE' : 'IN_PROGRESS'}
          statusLabel={selectedMovement.isReversal ? t.cashPage.reversalTag : selectedMovement.type === 'INFLOW' ? t.cashPage.inflowTag : t.cashPage.outflowTag}
          avatarIcon={Wallet}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t.cashPage.attachDoc}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintReceipt(selectedMovement)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.cashPage.printReceipt}</span>
              </button>
            </div>
          }
          kpis={[
            {
              label: lang === 'en' ? 'Transaction Amount' : 'Montant de l\'Opération',
              value: formatXAF(selectedMovement.amountXAF),
              sublabel: selectedMovement.type === 'INFLOW' ? (lang === 'en' ? 'Inflow (+)' : 'Flux entrant (+)') : (lang === 'en' ? 'Outflow (-)' : 'Flux sortant (-)'),
              highlight: true,
            },
            {
              label: t.cashPage.thirdPartyLabel.replace(' :', ''),
              value: selectedMovement.receivedFromOrPaidTo,
              sublabel: t.cashCategory[selectedMovement.category],
            },
            {
              label: t.cashPage.cashierLabelName.replace(' :', ''),
              value: selectedMovement.performedByName || (lang === 'en' ? 'FCT Central Cash' : 'Caisse Centrale FCT'),
              sublabel: lang === 'en' ? 'Immutable OHADA timestamp' : 'Horodatage immuable OHADA',
            },
            {
              label: t.date,
              value: selectedMovement.createdAt.split('T')[0],
              sublabel: selectedMovement.isReversal ? t.cashPage.reversalTag : (lang === 'en' ? 'Certified conforming' : 'Certifiée conforme'),
            },
          ]}
          tabs={[
            { id: 'DETAILS', label: t.cashPage.tabDetails, icon: Wallet },
            { id: 'DOCS', label: t.cashPage.tabDocs, icon: FileText, badge: cashDocs.length },
            { id: 'RELATIONS', label: t.cashPage.tabRelations, icon: KeyRound },
            { id: 'AUDIT', label: t.cashPage.tabAudit, icon: ShieldCheck },
          ]}
          activeTab={movementDetailTab}
          onTabChange={(t) => setMovementDetailTab(t as any)}
        >
          {/* TAB 1: DETAILS */}
          {movementDetailTab === 'DETAILS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>{t.cashPage.financialFlow}</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">{t.cashPage.flowDirection}</span>
                      <span className={`font-black ${selectedMovement.type === 'INFLOW' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {selectedMovement.type === 'INFLOW' ? t.cashPage.inflowTag : t.cashPage.outflowTag}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">{t.cashPage.accountingCategory}</span>
                      <span className="font-bold text-slate-900">{t.cashCategory[selectedMovement.category]}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">{t.cashPage.cashAmount}</span>
                      <span className="font-black text-sm text-emerald-900">{formatXAF(selectedMovement.amountXAF)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">{t.cashPage.paymentMethod}</span>
                      <span className="font-bold text-slate-900">100% {lang === 'en' ? 'Cash (XAF)' : 'Espèces (XAF)'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{t.cashPage.thirdPartyInfo}</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">{t.cashPage.thirdPartyLabel}</span>
                      <span className="font-bold text-slate-900">{selectedMovement.receivedFromOrPaidTo}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">{t.cashPage.cashierLabelName}</span>
                      <span className="font-semibold text-slate-900">{selectedMovement.performedByName}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">{t.cashPage.certifiedTimestamp}</span>
                      <span className="font-mono text-slate-600">{selectedMovement.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>{t.cashPage.reasonSection}</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {selectedMovement.reason}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DOCS */}
          {movementDetailTab === 'DOCS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{lang === 'en' ? 'Cash Receipts & Vouchers' : 'Justificatifs & Décharges de Caisse'}</h3>
                  <p className="text-xs text-slate-500">{lang === 'en' ? 'Signed paper receipt, voucher, third-party ID, or discharge' : 'Reçu papier émargé, bon de caisse numéroté, pièce d\'identité du tiers ou décharge'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.cashPage.attachDoc}</span>
                </button>
              </div>

              {cashDocs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">{t.cashPage.noDigitalDocs}</p>
                  <p className="text-xs text-slate-400">{t.cashPage.attachDocHint}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cashDocs.map((doc: any) => (
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
                          title="Visualiser le justificatif"
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

          {/* TAB 3: RELATIONS */}
          {movementDetailTab === 'RELATIONS' && (
            <div className="space-y-4">
              {selectedMovement.relatedContractId ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Lié au Contrat de Location</span>
                    <span className="font-mono text-slate-500 text-xs">ID Contrat : {selectedMovement.relatedContractId}</span>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        const cId = selectedMovement.relatedContractId;
                        setSelectedMovement(null);
                        onNavigate('rentals', cId);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <span>Voir le Contrat de Location</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : selectedMovement.relatedInvoiceId ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Lié à la Facture</span>
                    <span className="font-mono text-slate-500 text-xs">ID Facture : {selectedMovement.relatedInvoiceId}</span>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        const iId = selectedMovement.relatedInvoiceId;
                        setSelectedMovement(null);
                        onNavigate('billing', iId);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <span>Voir la Facture</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : selectedMovement.relatedSaleOrderId ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Lié au Bon de Commande Vente</span>
                    <span className="font-mono text-slate-500 text-xs">ID Vente : {selectedMovement.relatedSaleOrderId}</span>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        const sId = selectedMovement.relatedSaleOrderId;
                        setSelectedMovement(null);
                        onNavigate('sales', sId);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <span>Voir la Vente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-slate-500 text-center text-xs">
                  Écriture directe autonome enregistrée en agence FCT Douala (sans dossier rattaché).
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT */}
          {movementDetailTab === 'AUDIT' && (
            <EntityTimeline
              events={[
                {
                  id: 'evt-create',
                  date: selectedMovement.createdAt,
                  title: `Enregistrement du reçu ${selectedMovement.receiptNumber}`,
                  description: `Écriture certifiée passée par ${selectedMovement.performedByName}.`,
                  type: 'INFO',
                },
                ...(selectedMovement.isReversal
                  ? [
                      {
                        id: 'evt-rev',
                        date: selectedMovement.createdAt,
                        title: 'Contre-passation effectuée',
                        description: `Cette écriture annule le reçu ${selectedMovement.reversalOfReceiptNumber}. Motif : ${selectedMovement.reversalReason || 'Erreur de saisie'}.`,
                        type: 'DANGER' as const,
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </EntityShowroomLayout>

        {/* Modal d'ajout de document */}
        {isAddDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Rattacher un Justificatif à l'Écriture</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToMovement} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Intitulé du document *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="Ex: Reçu émargé, Bon de décaissement, Décharge signée..."
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
                    <option value="RECU_CAISSE">Reçu de Caisse Numéroté</option>
                    <option value="BON_DECAISSEMENT">Bon de Décaissement Émargé</option>
                    <option value="PIECE_IDENTITE">Pièce d'Identité Tiers</option>
                    <option value="AUTRE">Autre Justificatif</option>
                  </select>
                </div>

                <CloudinaryUploadDropzone
                  folder="fct_automobile/cash"
                  label="Reçu émargé / Décharge (Téléversement Cloudinary FCT) :"
                  helperText="Glissez ou sélectionnez le scan du reçu de caisse ou bon de décaissement"
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
                    placeholder="Observations comptables..."
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
            <Wallet className="w-6 h-6 text-emerald-600" />
            <span>{t.cashPage.title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.cashPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeSession ? (
            <>
              {hasEffectivePermission(currentUser, 'cash', 'create') && (
                <button
                  onClick={() => setIsRecordModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.cashPage.recordMovementBtn}</span>
                </button>
              )}
              {hasEffectivePermission(currentUser, 'cash', 'approve') && (
                <button
                  onClick={() => {
                    setCountedClosing(activeSession.calculatedExpectedBalanceXAF);
                    setIsCloseModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.cashPage.closeCashBtn}</span>
                </button>
              )}
            </>
          ) : (
            hasEffectivePermission(currentUser, 'cash', 'create') && (
              <button
                onClick={() => setIsOpenModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>{t.cashPage.openCashBtn}</span>
              </button>
            )
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

      {/* Search & Tabs */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.cashPage.searchPlaceholder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: `${t.cashPage.allTab} (${state.cashMovements.length})` },
          {
            id: 'INFLOW',
            label: t.cashPage.inflowsTab,
            count: state.cashMovements.filter((m) => m.type === 'INFLOW' && !m.isReversal).length,
          },
          {
            id: 'OUTFLOW',
            label: t.cashPage.outflowsTab,
            count: state.cashMovements.filter((m) => m.type === 'OUTFLOW' && !m.isReversal).length,
          },
          {
            id: 'REVERSALS',
            label: t.cashPage.reversalsTab,
            count: state.cashMovements.filter((m) => m.isReversal).length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
      />

      {/* Content: Cards or Table */}
      {filteredMovements.length === 0 ? (
        <EmptyState
          title={t.cashPage.emptyMovementsTitle}
          description={t.cashPage.emptyMovementsDesc}
          icon={Wallet}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMovements.map((mov) => {
            const isInflow = mov.type === 'INFLOW';
            return (
              <EntityCard
                key={mov.id}
                title={mov.receiptNumber}
                subtitle={`${mov.receivedFromOrPaidTo} • ${t.cashCategory[mov.category]}`}
                referenceId={mov.receiptNumber}
                fallbackIcon={isInflow ? ArrowDownLeft : ArrowUpRight}
                status={mov.isReversal ? 'CANCELLED' : isInflow ? 'ACTIVE' : 'IN_PROGRESS'}
                statusLabel={
                  mov.isReversal
                    ? t.cashPage.reversalTag
                    : isInflow
                    ? t.cashPage.inflowTag
                    : t.cashPage.outflowTag
                }
                onClick={() => setSelectedMovement(mov)}
                metrics={[
                  {
                    label: t.cashPage.cashAmount,
                    value: `${isInflow ? '+' : '-'}${formatXAF(mov.amountXAF)}`,
                    icon: DollarSign,
                    highlight: true,
                  },
                  {
                    label: t.date,
                    value: mov.createdAt,
                    icon: Calendar,
                  },
                  {
                    label: t.cashPage.cashierLabelName.replace(' :', ''),
                    value: mov.performedByName,
                    icon: User,
                  },
                ]}
                quickActions={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintReceipt(mov);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title={t.cashPage.printReceipt}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {!mov.isReversal && hasEffectivePermission(currentUser, 'cash', 'approve') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReversalTarget(mov);
                          setReversalReason('');
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                        title={t.cashPage.reversalTag}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t.cashPage.receiptCol}</th>
                  <th className="py-3 px-4">{t.cashPage.dateCol}</th>
                  <th className="py-3 px-4">{t.cashPage.tierCol}</th>
                  <th className="py-3 px-4">{t.cashPage.categoryCol}</th>
                  <th className="py-3 px-4">{lang === 'en' ? 'Reason / Justification' : 'Motif / Justification'}</th>
                  <th className="py-3 px-4 text-right">{t.cashPage.amountCol}</th>
                  <th className="py-3 px-4">{t.cashPage.cashierLabelName.replace(' :', '')}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((mov) => {
                  const isInflow = mov.type === 'INFLOW';
                  return (
                    <tr
                      key={mov.id}
                      onClick={() => setSelectedMovement(mov)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        mov.isReversal ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{mov.receiptNumber}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {mov.createdAt}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{mov.receivedFromOrPaidTo}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {t.cashCategory[mov.category]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={mov.reason}>
                        {mov.reason}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-black whitespace-nowrap text-xs ${
                          mov.isReversal
                            ? 'text-purple-700 line-through'
                            : isInflow
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {isInflow ? '+' : '-'}
                        {formatXAF(mov.amountXAF)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{mov.performedByName}</td>
                      <td
                        className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handlePrintReceipt(mov)}
                          title="Imprimer le reçu de caisse"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer inline-flex items-center transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {!mov.isReversal && hasEffectivePermission(currentUser, 'cash', 'approve') && (
                          <button
                            onClick={() => {
                              setReversalTarget(mov);
                              setReversalReason('');
                            }}
                            title="Contre-passation comptable (extourne)"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer inline-flex items-center transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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

      

      {/* Record Movement Modal */}
      {isRecordModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>{t.cashPage.newMovementTitle}</span>
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRecordMovement} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.cashPage.typeLabel} *</label>
                  <select
                    value={movementForm.type}
                    onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  >
                    <option value="INFLOW">{t.cashPage.inflowsTab} ({lang === 'en' ? 'Revenue +' : 'Recette +'})</option>
                    <option value="OUTFLOW">{t.cashPage.outflowsTab} ({lang === 'en' ? 'Disbursement -' : 'Dépense -'})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.cashPage.accountingCategory} *</label>
                  <select
                    value={movementForm.category}
                    onChange={(e) => setMovementForm({ ...movementForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  >
                    <option value="RENTAL_PAYMENT">{t.cashCategory.RENTAL_PAYMENT}</option>
                    <option value="SALE_PAYMENT">{t.cashCategory.SALE_PAYMENT}</option>
                    <option value="DEPOSIT_IN">{t.cashCategory.DEPOSIT_IN}</option>
                    <option value="DEPOSIT_REFUND">{t.cashCategory.DEPOSIT_REFUND}</option>
                    <option value="FUEL_EXPENSE">{t.cashCategory.FUEL_EXPENSE}</option>
                    <option value="MAINTENANCE_EXPENSE">{t.cashCategory.MAINTENANCE_EXPENSE}</option>
                    <option value="OFFICE_EXPENSE">{t.cashCategory.OFFICE_EXPENSE}</option>
                    <option value="SALARY_ADVANCE">{t.cashCategory.SALARY_ADVANCE}</option>
                    <option value="OTHER">{t.cashCategory.OTHER}</option>
                  </select>
                </div>
              </div>

              {movementForm.type === 'OUTFLOW' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-semibold flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{lang === 'en' ? 'FCT Compliance Notice:' : 'Contrôle de conformité FCT Douala :'}</strong>{' '}
                    {t.cashPage.disbursementCompliance}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.cashPage.amountLabel} *</label>
                <input
                  type="number"
                  min={1}
                  value={movementForm.amountXAF}
                  onChange={(e) => setMovementForm({ ...movementForm, amountXAF: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-black text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {movementForm.type === 'OUTFLOW'
                    ? (lang === 'en' ? 'Disbursement Payee *' : 'Bénéficiaire du décaissement *')
                    : (lang === 'en' ? 'Payer Third Party (Customer / Partner) *' : 'Tiers Payeur (Client / Partenaire) *')}
                </label>
                <input
                  type="text"
                  value={movementForm.receivedFromOrPaidTo}
                  onChange={(e) => setMovementForm({ ...movementForm, receivedFromOrPaidTo: e.target.value })}
                  placeholder={movementForm.type === 'OUTFLOW' ? (lang === 'en' ? 'E.g. Total Station Bonamoussadi, Express Garage' : 'Ex: Station Total Bonamoussadi, Garage Rapide') : (lang === 'en' ? 'E.g. Christian Eboa Eboa' : 'Ex: Christian Eboa Eboa')}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.cashPage.reasonLabel}</label>
                <input
                  type="text"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  placeholder={movementForm.type === 'OUTFLOW' ? (lang === 'en' ? 'E.g. Full gas tank Prado LT 502 (Ticket #84920)' : 'Ex: Plein carburant Prado LT 502 (Ticket #84920)') : (lang === 'en' ? 'E.g. Deposit for 3-day Land Cruiser rental' : 'Ex: Acompte location Land Cruiser 3 jours')}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
                  required
                />
              </div>

              {/* Pièce Justificative (Cloudinary Dropzone) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t.cashPage.supportingDoc} {movementForm.type === 'OUTFLOW' ? (lang === 'en' ? '(Recommended / Audit)' : '(Recommandé / Audit)') : (lang === 'en' ? '(Optional)' : '(Optionnel)')}
                </label>
                <CloudinaryUploadDropzone
                  folder="fct_automobile/cash"
                  label={t.cashPage.uploadReceiptPrompt}
                  helperText={t.cashPage.uploadReceiptHelper}
                  currentValue={movementForm.justificationReceiptUrl}
                  onUploadSuccess={(url) => setMovementForm({ ...movementForm, justificationReceiptUrl: url })}
                  onClear={() => setMovementForm({ ...movementForm, justificationReceiptUrl: '' })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  {lang === 'en' ? 'Validate & Print Receipt' : 'Valider & Imprimer Reçu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Session Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Unlock className="w-5 h-5 text-blue-900" />
                <span>{t.cashPage.openModalTitle}</span>
              </h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setOpenMode('billetage')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    openMode === 'billetage' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t.cashPage.openModeBilletage}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenMode('quick')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    openMode === 'quick' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t.cashPage.openModeQuick}
                </button>
              </div>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-3 text-xs">
              {openMode === 'billetage' ? (
                <div>
                  <CashDenominationGrid
                    lang={lang}
                    onTotalChange={(tot, summary) => {
                      setOpeningBalance(tot);
                      setOpenBilletageSummary(summary);
                    }}
                  />
                  <div className="mt-2 text-slate-500 text-[11px]">
                    {lang === 'en' ? 'Calculated cash float:' : 'Fonds de caisse calculé :'} <strong className="text-slate-900">{formatXAF(openingBalance)}</strong>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.cashPage.openFundLabel} *</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-black text-sm"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  {t.cashPage.confirmOpenBtn} ({formatXAF(openingBalance)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {isCloseModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-700" />
                <span>{t.cashPage.closeModalTitle}</span>
              </h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCloseMode('billetage')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    closeMode === 'billetage' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t.cashPage.openModeBilletage}
                </button>
                <button
                  type="button"
                  onClick={() => setCloseMode('quick')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    closeMode === 'quick' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t.cashPage.openModeQuick}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium">{t.cashPage.theoreticalBalanceLabel}</span>{' '}
                <strong className="text-slate-900 text-sm ml-1">{formatXAF(activeSession.calculatedExpectedBalanceXAF)}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                {t.cashPage.sessionCol} {activeSession.sessionNumber}
              </div>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-3 text-xs">
              {closeMode === 'billetage' ? (
                <div>
                  <CashDenominationGrid
                    lang={lang}
                    expectedBalanceXAF={activeSession.calculatedExpectedBalanceXAF}
                    showDiscrepancy={true}
                    onTotalChange={(tot, summary) => {
                      setCountedClosing(tot);
                      setCloseBilletageSummary(summary);
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.cashPage.closePhysicalCount} *</label>
                  <input
                    type="number"
                    value={countedClosing}
                    onChange={(e) => setCountedClosing(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-black text-sm"
                    required
                  />
                  <div className="mt-1 text-xs font-bold">
                    {lang === 'en' ? 'Discrepancy:' : 'Écart :'} {' '}
                    <span
                      className={
                        countedClosing === activeSession.calculatedExpectedBalanceXAF
                          ? 'text-emerald-700'
                          : countedClosing > activeSession.calculatedExpectedBalanceXAF
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }
                    >
                      {formatXAF(countedClosing - activeSession.calculatedExpectedBalanceXAF)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t.cashPage.closeNotesLabel}{' '}
                  {countedClosing !== activeSession.calculatedExpectedBalanceXAF && (
                    <span className="text-rose-600 font-black">{t.cashPage.mandatoryDiscrepancy}</span>
                  )}
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={
                    countedClosing !== activeSession.calculatedExpectedBalanceXAF
                      ? t.cashPage.discrepancyPlaceholder
                      : t.cashPage.normalClosingNotes
                  }
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  {t.cashPage.confirmCloseBtn} ({formatXAF(countedClosing)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reversal Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-700" />
              <span>{t.cashPage.reversalTitle}</span>
            </h3>

            <p className="text-xs text-slate-600">
              {t.cashPage.reversalConfirmNotice} <strong className="text-slate-900">{reversalTarget.receiptNumber}</strong> ({formatXAF(reversalTarget.amountXAF)}).
            </p>

            <form onSubmit={handleConfirmReversal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.cashPage.reversalReasonLabel}</label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder={lang === 'en' ? 'E.g. Amount error entered or customer dispute' : 'Ex: Erreur de montant saisie ou contestation client'}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalTarget(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  {t.cashPage.confirmReversalBtn}
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
        lang={lang}
      />
    </div>
  );
};
