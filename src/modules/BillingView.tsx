/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Facturation, Devis & Suivi des Règlements 360°
 * Franchise Conseils Trading - Douala, Cameroun (Bonamoussadi, Carrefour Santa Barbara)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { Language, translations } from '../services/i18n.ts';
import { Invoice, InvoiceType, AppModule } from '../../packages/shared-types/index.ts';
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
  Receipt,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
  Wallet,
  FileText,
  KeyRound,
  TrendingUp,
  AlertCircle,
  DollarSign,
  User,
  ArrowRight,
  Calendar,
  Building,
} from 'lucide-react';

interface BillingViewProps {
  state: DatabaseState;
  lang: Language;
  onOpenPrintModal: (data: DocumentPrintData) => void;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextEntityId?: string | null;
}

export const BillingView: React.FC<BillingViewProps> = ({
  state,
  lang,
  onOpenPrintModal,
  onNavigate,
  contextEntityId,
}) => {
  const t = translations[lang];
  const currentUser = dbStore.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNPAID' | 'PAID' | 'PROFORMA'>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Selected invoice for Showroom / Fiche Détaillée
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDetailTab, setInvoiceDetailTab] = useState<'ITEMS' | 'DOCS' | 'CUSTOMER' | 'ORIGIN' | 'PAYMENTS' | 'TIMELINE'>('ITEMS');

  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [invForm, setInvForm] = useState({
    type: 'INVOICE' as InvoiceType,
    customerId: state.customers[0]?.id || '',
    description: 'Prestation de mise à disposition véhicule avec chauffeur',
    quantity: 5,
    unitPriceXAF: 85000,
    includeTVA: false,
    dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
  });

  // Deep linking handling from contextEntityId
  useEffect(() => {
    if (contextEntityId) {
      // 1. Is it an Invoice ID? (view showroom)
      const matchingInv = state.invoices.find((i) => i.id === contextEntityId);
      if (matchingInv) {
        setSelectedInvoice(matchingInv);
        return;
      }

      // 2. Is it a Customer ID? (e.g. from CRM "Émettre une Facture")
      const matchingCust = state.customers.find((c) => c.id === contextEntityId);
      if (matchingCust) {
        setInvForm((prev) => ({ ...prev, customerId: matchingCust.id }));
        setSelectedInvoice(null);
        setIsNewInvoiceModalOpen(true);
        return;
      }

      // 3. Is it a Contract ID? (e.g. from Rentals "Facturer")
      const matchingContract = state.contracts.find((c) => c.id === contextEntityId);
      if (matchingContract) {
        setInvForm((prev) => ({
          ...prev,
          customerId: matchingContract.customerId,
          description: `Location véhicule ${matchingContract.vehicleName} (Contrat ${matchingContract.contractNumber})`,
          quantity: matchingContract.totalDays,
          unitPriceXAF: matchingContract.dailyRateXAF,
        }));
        setSelectedInvoice(null);
        setIsNewInvoiceModalOpen(true);
        return;
      }

      // 4. Is it a Sale Order ID? (e.g. from Sales "Facturer")
      const matchingSale = state.sales.find((s) => s.id === contextEntityId);
      if (matchingSale) {
        setInvForm((prev) => ({
          ...prev,
          customerId: matchingSale.customerId,
          description: `Vente véhicule ${matchingSale.vehicleName} (Bon ${matchingSale.orderNumber})`,
          quantity: 1,
          unitPriceXAF: matchingSale.negotiatedPriceXAF,
        }));
        setSelectedInvoice(null);
        setIsNewInvoiceModalOpen(true);
        return;
      }
    }
  }, [contextEntityId, state.invoices, state.customers, state.contracts, state.sales]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = state.customers.find((c) => c.id === invForm.customerId);
    if (!customer) return;

    const subtotal = invForm.quantity * invForm.unitPriceXAF;
    const tax = invForm.includeTVA ? Math.round(subtotal * 0.1925) : 0;
    const total = subtotal + tax;

    try {
      const created = dbStore.addInvoice({
        type: invForm.type,
        customerId: customer.id,
        customerName: customer.companyName || customer.fullName,
        customerAddress: customer.address,
        customerNiu: customer.taxNumber,
        items: [
          {
            description: invForm.description,
            quantity: invForm.quantity,
            unitPriceXAF: invForm.unitPriceXAF,
            totalXAF: subtotal,
          },
        ],
        subtotalXAF: subtotal,
        taxAmountXAF: tax,
        totalAmountXAF: total,
        paidAmountXAF: 0,
        balanceXAF: total,
        status: 'ISSUED',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: invForm.dueDate,
      });

      setIsNewInvoiceModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Document ${created.invoiceNumber} généré avec succès (${formatXAF(created.totalAmountXAF)}).`,
      });
      setTimeout(() => setActionAlert(null), 4000);

      handlePrintInvoice(created);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la création de la facture.' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const handlePrintInvoice = (inv: Invoice) => {
    const printData: DocumentPrintData = {
      title: inv.type === 'PROFORMA' ? 'DEVIS / FACTURE PROFORMA FCT' : 'FACTURE OFFICIELLE FCT',
      docNumber: inv.invoiceNumber,
      date: inv.issueDate,
      customerName: inv.customerName,
      customerAddress: inv.customerAddress,
      customerNiu: inv.customerNiu,
      items: inv.items.map((it) => ({
        description: it.description,
        qty: it.quantity,
        unitPrice: it.unitPriceXAF,
        total: it.totalXAF,
      })),
      subtotal: inv.subtotalXAF,
      tax: inv.taxAmountXAF,
      total: inv.totalAmountXAF,
      notes: `Modalité de règlement : Espèces en caisse à l'agence de Bonamoussadi, Carrefour Santa Barbara, Douala. Échéance de paiement : ${
        inv.dueDate
      }. Solde restant dû : ${formatXAF(inv.balanceXAF)}. Numéro d'Identifiant Unique (NIU) FCT : M052014587963P.`,
      signatureRole1: 'Le Client (Bon pour accord)',
      signatureRole2: 'Pour Franchise Conseils Trading (Comptabilité Générale)',
    };
    onOpenPrintModal(printData);
  };

  // Financial KPIs
  const totalInvoiced = state.invoices
    .filter((i) => i.type === 'INVOICE')
    .reduce((acc, i) => acc + i.totalAmountXAF, 0);
  const totalPaid = state.invoices
    .filter((i) => i.type === 'INVOICE')
    .reduce((acc, i) => acc + i.paidAmountXAF, 0);
  const totalBalanceDue = state.invoices
    .filter((i) => i.type === 'INVOICE')
    .reduce((acc, i) => acc + i.balanceXAF, 0);

  const kpis = [
    {
      id: 'kpi-invoiced',
      label: t.billingPage.totalInvoiced,
      value: formatXAF(totalInvoiced),
      sublabel: `${state.invoices.filter((i) => i.type === 'INVOICE').length} ${t.billingPage.activeInvoicesCount.toLowerCase()}`,
      icon: Receipt,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-paid',
      label: t.billingPage.totalCollected,
      value: formatXAF(totalPaid),
      sublabel: lang === 'en' ? 'Validated at cash desk' : 'Validés en caisse',
      icon: CheckCircle2,
      colorVariant: 'emerald' as const,
    },
    {
      id: 'kpi-balance',
      label: t.billingPage.outstandingBalance,
      value: formatXAF(totalBalanceDue),
      sublabel: lang === 'en' ? 'Remaining balances due' : 'Soldes restant dus',
      icon: Clock,
      colorVariant: totalBalanceDue > 0 ? ('rose' as const) : ('slate' as const),
    },
  ];


  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'FACTURE_SIGNEE',
    fileUrl: '',
    notes: '',
  });

  const handleAddDocumentToInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      const newDoc = {
        id: `doc_inv_${Date.now()}`,
        title: docForm.title || `Facture - ${selectedInvoice.invoiceNumber}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        uploadedAt: new Date().toISOString(),
        relatedEntityId: selectedInvoice.id,
        relatedInvoiceId: selectedInvoice.id,
        notes: docForm.notes || `Document rattaché à la facture ${selectedInvoice.invoiceNumber}`,
      };
      dbStore.addDocument(newDoc as any);
      setIsAddDocModalOpen(false);
      setDocForm({ title: '', category: 'FACTURE_SIGNEE', fileUrl: '', notes: '' });
      setActionAlert({ type: 'success', message: 'Document rattaché avec succès à la pièce comptable.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du document' });
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return state.invoices.filter((inv) => {
      if (activeTab === 'UNPAID' && (inv.balanceXAF <= 0 || inv.status === 'CANCELLED')) return false;
      if (activeTab === 'PAID' && inv.balanceXAF > 0) return false;
      if (activeTab === 'PROFORMA' && inv.type !== 'PROFORMA') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchCust = inv.customerName.toLowerCase().includes(q);
        return matchNum || matchCust;
      }
      return true;
    });
  }, [state.invoices, activeTab, search]);


  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DE LA FACTURE SÉLECTIONNÉE
  // =========================================================================
  if (selectedInvoice) {
    const invDocs = (state.documents || []).filter(
      (d: any) => d.relatedEntityId === selectedInvoice.id || d.relatedInvoiceId === selectedInvoice.id
    );

    return (
      <>
        <EntityShowroomLayout
          backLabel={t.billingPage.backToBilling}
          onBack={() => setSelectedInvoice(null)}
          title={`${selectedInvoice.type === 'PROFORMA' ? t.billingPage.proformaBadge : (lang === 'en' ? 'Invoice' : 'Facture')} ${selectedInvoice.invoiceNumber}`}
          subtitle={`${selectedInvoice.customerName} • ${t.date} : ${selectedInvoice.issueDate} • ${t.billingPage.dueCol} : ${selectedInvoice.dueDate}`}
          referenceId={selectedInvoice.invoiceNumber}
          status={selectedInvoice.balanceXAF === 0 ? 'PAID' : selectedInvoice.status}
          statusLabel={
            selectedInvoice.status === 'CANCELLED'
              ? (lang === 'en' ? 'Cancelled' : 'Annulée')
              : selectedInvoice.balanceXAF === 0
              ? t.billingPage.settledBadge
              : t.billingPage.unpaidBadge
          }
          avatarIcon={Receipt}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Attach Document' : 'Rattacher Document'}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintInvoice(selectedInvoice)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.billingPage.printInvoiceBtn}</span>
              </button>
              {selectedInvoice.balanceXAF > 0 && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    const invId = selectedInvoice.id;
                    setSelectedInvoice(null);
                    onNavigate('cash', invId);
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{t.billingPage.payCashBtn}</span>
                </button>
              )}
            </div>
          }
          kpis={[
            {
              label: t.billingPage.ttcCol,
              value: formatXAF(selectedInvoice.totalAmountXAF),
              sublabel: `${t.billingPage.htCol}: ${formatXAF(selectedInvoice.subtotalXAF)}`,
              highlight: true,
            },
            {
              label: t.billingPage.paidCol,
              value: formatXAF(selectedInvoice.paidAmountXAF),
              sublabel: lang === 'en' ? 'Cash register receipts' : 'Règlements reçus en caisse',
            },
            {
              label: t.billingPage.balanceCol,
              value: formatXAF(selectedInvoice.balanceXAF),
              sublabel: selectedInvoice.balanceXAF === 0 ? (lang === 'en' ? 'Invoice fully settled' : 'Facture totalement soldée') : (lang === 'en' ? 'Pending collection' : 'Créance en cours de recouvrement'),
            },
            {
              label: `${t.billingPage.vatCol} (19.25%)`,
              value: formatXAF(selectedInvoice.taxAmountXAF),
              sublabel: lang === 'en' ? 'Cameroon Tax / DGI compliant' : 'Conformité fiscale Cameroun / DGI',
            },
          ]}
          tabs={[
            { id: 'ITEMS', label: t.billingPage.tabItems, icon: Receipt },
            { id: 'DOCS', label: t.billingPage.tabDocs, icon: FileText, badge: invDocs.length },
            { id: 'CUSTOMER', label: t.billingPage.tabCustomer, icon: User },
            { id: 'ORIGIN', label: t.billingPage.tabOrigin, icon: Calendar },
            { id: 'PAYMENTS', label: t.billingPage.tabPayments, icon: DollarSign },
            { id: 'TIMELINE', label: t.billingPage.tabTimeline, icon: Clock },
          ]}
          activeTab={invoiceDetailTab}
          onTabChange={(t) => setInvoiceDetailTab(t as any)}
        >
          {/* TAB 1: ITEMS */}
          {invoiceDetailTab === 'ITEMS' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[500px]">
                    <thead className="bg-[#0f2a4a] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{lang === 'en' ? 'Service / Item Description' : 'Description de la prestation / article'}</th>
                        <th className="py-3 px-4 text-center">{lang === 'en' ? 'Quantity' : 'Quantité'}</th>
                        <th className="py-3 px-4 text-right">{t.billingPage.htCol} {lang === 'en' ? 'Unit' : 'Unitaire'}</th>
                        <th className="py-3 px-4 text-right">{t.billingPage.htCol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{it.description}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">{it.quantity}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-600">{formatXAF(it.unitPriceXAF)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">{formatXAF(it.totalXAF)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ml-auto max-w-sm space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{t.billingPage.htCol} :</span>
                  <span className="font-bold text-slate-900">{formatXAF(selectedInvoice.subtotalXAF)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{t.billingPage.vatCol} (19.25%) :</span>
                  <span className="font-bold text-slate-900">{formatXAF(selectedInvoice.taxAmountXAF)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-black text-blue-950">
                  <span>Total TTC Net à Payer :</span>
                  <span>{formatXAF(selectedInvoice.totalAmountXAF)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCS */}
          {invoiceDetailTab === 'DOCS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Documents & Justificatifs Comptables</h3>
                  <p className="text-xs text-slate-500">Facture tamponnée FCT, bon de commande client, bordereau de remise chèque ou virement</p>
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

              {invDocs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Aucun justificatif numérique rattaché à cette facture</p>
                  <p className="text-xs text-slate-400">Cliquez sur « Rattacher un document » pour archiver la preuve de virement ou la facture signée.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {invDocs.map((doc: any) => (
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

          {/* TAB 3: CUSTOMER */}
          {invoiceDetailTab === 'CUSTOMER' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-base">{selectedInvoice.customerName}</h4>
                  <div className="text-slate-600 text-xs">Adresse de facturation : {selectedInvoice.customerAddress}</div>
                  {selectedInvoice.customerNiu && (
                    <div className="font-mono text-slate-500 text-xs">NIU Fiscal : {selectedInvoice.customerNiu}</div>
                  )}
                </div>

                {onNavigate && selectedInvoice.customerId && (
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedInvoice.customerId;
                      setSelectedInvoice(null);
                      onNavigate('crm', cid);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Consulter Fiche Client CRM 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ORIGIN */}
          {invoiceDetailTab === 'ORIGIN' && (
            <div className="space-y-4">
              {selectedInvoice.relatedContractId ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Liée au Contrat de Location</span>
                    <span className="font-mono text-slate-500 text-xs">Réf. Contrat : {selectedInvoice.relatedContractId}</span>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        const cId = selectedInvoice.relatedContractId;
                        setSelectedInvoice(null);
                        onNavigate('rentals', cId);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <span>Voir le Contrat de Location</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : selectedInvoice.relatedSaleOrderId ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Liée à la Commande de Vente</span>
                    <span className="font-mono text-slate-500 text-xs">Réf. Vente : {selectedInvoice.relatedSaleOrderId}</span>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        const sId = selectedInvoice.relatedSaleOrderId;
                        setSelectedInvoice(null);
                        onNavigate('sales', sId);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <span>Voir la Commande de Vente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-slate-500 text-center text-xs">
                  Facturation directe émise en agence FCT Douala (aucune prestation liée enregistrée).
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {invoiceDetailTab === 'PAYMENTS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Montant Encaissé</div>
                  <div className="text-lg font-black text-emerald-950 mt-1">{formatXAF(selectedInvoice.paidAmountXAF)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-xs font-bold text-amber-700 uppercase">Solde Restant Dû</div>
                  <div className="text-lg font-black text-amber-950 mt-1">{formatXAF(selectedInvoice.balanceXAF)}</div>
                </div>
              </div>

              {onNavigate && selectedInvoice.balanceXAF > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const iId = selectedInvoice.id;
                      setSelectedInvoice(null);
                      onNavigate('cash', iId);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Encaisser le solde au Journal de Caisse</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TIMELINE */}
          {invoiceDetailTab === 'TIMELINE' && (
            <EntityTimeline
              events={[
                {
                  id: 'evt-issue',
                  date: selectedInvoice.issueDate,
                  title: `Émission de la pièce ${selectedInvoice.invoiceNumber}`,
                  description: `Facture émise au nom de ${selectedInvoice.customerName} pour un montant de ${formatXAF(selectedInvoice.totalAmountXAF)}. Échéance : ${selectedInvoice.dueDate}.`,
                  type: 'INFO',
                },
                ...(selectedInvoice.paidAmountXAF > 0
                  ? [
                      {
                        id: 'evt-paid',
                        date: selectedInvoice.issueDate,
                        title: 'Règlement enregistré',
                        description: `Montant encaissé : ${formatXAF(selectedInvoice.paidAmountXAF)}. Solde dû : ${formatXAF(selectedInvoice.balanceXAF)}.`,
                        type: 'SUCCESS' as const,
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
                  <span>Rattacher un Document à la Facture</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToInvoice} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Intitulé du document *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="Ex: Facture signée/tamponnée, Ordre de virement bancaire..."
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
                    <option value="FACTURE_SIGNEE">Facture Signée &amp; Tamponnée</option>
                    <option value="BORDEREAU_VIREMENT">Preuve de Virement / Chèque</option>
                    <option value="BON_DE_COMMANDE">Bon de Commande Client</option>
                    <option value="AUTRE">Autre Justificatif</option>
                  </select>
                </div>

                <CloudinaryUploadDropzone
                  folder="fct_automobile/billing"
                  label="Facture signée / Preuve de virement (Téléversement Cloudinary FCT) :"
                  helperText="Glissez ou sélectionnez la facture tamponnée ou l'ordre de virement bancaire"
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
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>{t.billingPage.title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.billingPage.subtitle}
          </p>
        </div>

        {hasEffectivePermission(currentUser, 'billing', 'create') && (
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.billingPage.newInvoice}</span>
          </button>
        )}
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
      <EntityActivitySummary items={kpis} columns={3} />

      {/* Search & Tabs */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={lang === 'en' ? 'Search by invoice # (FAC-...), customer...' : 'Rechercher par n° de facture (FAC-...), client...'}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: `${t.billingPage.allTab} (${state.invoices.length})` },
          {
            id: 'UNPAID',
            label: t.billingPage.unpaidTab,
            count: state.invoices.filter((i) => i.balanceXAF > 0 && i.status !== 'CANCELLED').length,
          },
          {
            id: 'PAID',
            label: t.billingPage.paidTab,
            count: state.invoices.filter((i) => i.balanceXAF === 0).length,
          },
          {
            id: 'PROFORMA',
            label: t.billingPage.quotesTab,
            count: state.invoices.filter((i) => i.type === 'PROFORMA').length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
      />

      {/* Content: Cards or Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          title={t.billingPage.emptyInvoicesTitle}
          description={t.billingPage.emptyInvoicesDesc}
          icon={Receipt}
          action={
            hasEffectivePermission(currentUser, 'billing', 'create')
              ? { label: t.billingPage.newInvoice, onClick: () => setIsNewInvoiceModalOpen(true) }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((inv) => (
            <EntityCard
              key={inv.id}
              title={inv.invoiceNumber}
              subtitle={`${inv.customerName} • ${t.date} : ${inv.issueDate}`}
              referenceId={inv.invoiceNumber}
              fallbackIcon={Receipt}
              status={inv.balanceXAF === 0 ? 'PAID' : inv.status}
              statusLabel={
                inv.status === 'CANCELLED'
                  ? (lang === 'en' ? 'Cancelled' : 'Annulée')
                  : inv.balanceXAF === 0
                  ? t.billingPage.settledBadge
                  : inv.paidAmountXAF > 0
                  ? t.billingPage.partialBadge
                  : t.billingPage.unpaidBadge
              }
              onClick={() => setSelectedInvoice(inv)}
              metrics={[
                {
                  label: t.billingPage.ttcCol,
                  value: formatXAF(inv.totalAmountXAF),
                  icon: DollarSign,
                  highlight: true,
                },
                {
                  label: t.billingPage.paidCol,
                  value: formatXAF(inv.paidAmountXAF),
                  icon: CheckCircle2,
                },
                {
                  label: t.billingPage.balanceCol,
                  value: formatXAF(inv.balanceXAF),
                  icon: Clock,
                  highlight: inv.balanceXAF > 0,
                },
                {
                  label: t.billingPage.dueCol,
                  value: inv.dueDate,
                  icon: Calendar,
                },
              ]}
              quickActions={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintInvoice(inv);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title={t.billingPage.printInvoiceBtn}
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  {inv.balanceXAF > 0 && onNavigate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('cash', inv.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-2xs"
                      title={t.billingPage.payCashBtn}
                    >
                      {t.billingPage.payCashBtn}
                    </button>
                  )}
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t.billingPage.invoiceNumCol}</th>
                  <th className="py-3 px-4">{lang === 'en' ? 'Type / Origin' : 'Type / Origine'}</th>
                  <th className="py-3 px-4">{t.billingPage.customerCol}</th>
                  <th className="py-3 px-4">{lang === 'en' ? 'Issue / Due Date' : 'Émission / Échéance'}</th>
                  <th className="py-3 px-4 text-right">{t.billingPage.ttcCol}</th>
                  <th className="py-3 px-4 text-right">{t.billingPage.paidCol}</th>
                  <th className="py-3 px-4 text-right">{t.billingPage.balanceCol}</th>
                  <th className="py-3 px-4 text-center">{t.billingPage.statusCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.type === 'PROFORMA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {inv.type === 'PROFORMA' ? t.billingPage.proformaBadge.toUpperCase() : (lang === 'en' ? 'INVOICE' : 'FACTURE')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {inv.issueDate} ({lang === 'en' ? 'due' : 'éch.'} {inv.dueDate})
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatXAF(inv.totalAmountXAF)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {formatXAF(inv.paidAmountXAF)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        inv.balanceXAF > 0 ? 'text-rose-700 font-black' : 'text-slate-400'
                      }`}
                    >
                      {formatXAF(inv.balanceXAF)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <EntityStatusBadge
                        status={inv.balanceXAF === 0 ? 'PAID' : inv.status}
                        label={
                          inv.status === 'CANCELLED'
                            ? (lang === 'en' ? 'Cancelled' : 'Annulée')
                            : inv.balanceXAF === 0
                            ? t.billingPage.settledBadge
                            : inv.paidAmountXAF > 0
                            ? t.billingPage.partialBadge
                            : t.billingPage.unpaidBadge
                        }
                        size="sm"
                      />
                    </td>
                    <td
                      className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handlePrintInvoice(inv)}
                        title={t.billingPage.printInvoiceBtn}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer inline-flex items-center transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {inv.balanceXAF > 0 && onNavigate && (
                        <button
                          onClick={() => onNavigate('cash', inv.id)}
                          title={t.billingPage.payCashBtn}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition"
                        >
                          <Wallet className="w-3 h-3" />
                          <span>{t.billingPage.payCashBtn}</span>
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

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>{t.billingPage.createInvoiceTitle}</span>
            </h3>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.billingPage.docTypeLabel} *</label>
                <select
                  value={invForm.type}
                  onChange={(e) => setInvForm({ ...invForm, type: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                >
                  <option value="INVOICE">{t.billingPage.standardInvoice}</option>
                  <option value="PROFORMA">{t.billingPage.proforma}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.billingPage.clientLabel}</label>
                <select
                  value={invForm.customerId}
                  onChange={(e) => setInvForm({ ...invForm, customerId: e.target.value })}
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
                <label className="block text-slate-700 font-bold mb-1">{t.billingPage.serviceLabel}</label>
                <input
                  type="text"
                  value={invForm.description}
                  onChange={(e) => setInvForm({ ...invForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.billingPage.qtyLabel}</label>
                  <input
                    type="number"
                    min={1}
                    value={invForm.quantity}
                    onChange={(e) => setInvForm({ ...invForm, quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.billingPage.unitPriceLabel}</label>
                  <input
                    type="number"
                    value={invForm.unitPriceXAF}
                    onChange={(e) => setInvForm({ ...invForm, unitPriceXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="includeTVA"
                  checked={invForm.includeTVA}
                  onChange={(e) => setInvForm({ ...invForm, includeTVA: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-900"
                />
                <label htmlFor="includeTVA" className="font-bold text-slate-800 cursor-pointer">
                  {t.billingPage.includeVatLabel}
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t.billingPage.dueDateLabel}</label>
                <input
                  type="date"
                  value={invForm.dueDate}
                  onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  {t.billingPage.generateInvoiceBtn}
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
