/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - CRM, Prospects & Fiches Clients 360°
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useEffect } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { Language } from '../services/i18n.ts';
import { Customer, CustomerType, CrmLead, LeadStage, VehicleCategory, AppModule } from '../../packages/shared-types/index.ts';
import { formatXAF } from '../../packages/business-rules/index.ts';
import { CustomerSchema } from '../../packages/validation/index.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
import { EntityActivitySummary, EntityTimeline } from '../components/ui/EntityComponents.tsx';
import { EntityShowroomLayout } from '../components/ui/EntityShowroomLayout.tsx';
import { DocumentViewerModal } from '../components/ui/DocumentViewerModal.tsx';
import {
  Upload,
  Eye,
  Download,
  ShieldCheck,
  Clock,
  Users2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  X,
  AlertCircle,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  UserCheck,
  TrendingUp,
  FileText,
  KeyRound,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Receipt,
  Car,
} from 'lucide-react';

interface CrmViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextCustomerId?: string | null;
  contextEntityId?: string | null;
}

export const CrmView: React.FC<CrmViewProps> = ({
  state,
  lang,
  onNavigate,
  contextCustomerId,
  contextEntityId,
}) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'LEADS'>('CUSTOMERS');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [leadStageFilter, setLeadStageFilter] = useState<string>('ALL');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isConvertLeadModalOpen, setIsConvertLeadModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<CrmLead | null>(null);


  const [customerDetailTab, setCustomerDetailTab] = useState<'PROFILE' | 'DOCS' | 'RENTALS' | 'SALES' | 'INVOICES' | 'TIMELINE'>('PROFILE');
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'CNI_PASSEPORT',
    fileUrl: '',
    notes: '',
  });

  const handleAddDocumentToCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const newDoc = {
        id: `doc_cust_${Date.now()}`,
        title: docForm.title || `Pièce Client - ${selectedCustomer.fullName}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        uploadedAt: new Date().toISOString(),
        relatedEntityId: selectedCustomer.id,
        relatedCustomerId: selectedCustomer.id,
        notes: docForm.notes || `Document client ${selectedCustomer.companyName || selectedCustomer.fullName}`,
      };
      dbStore.addDocument(newDoc as any);
      setIsAddDocModalOpen(false);
      setDocForm({ title: '', category: 'CNI_PASSEPORT', fileUrl: '', notes: '' });
      setActionAlert({ type: 'success', message: 'Document rattaché avec succès au dossier client.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du document' });
    }
  };

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmCustomer, setDeleteConfirmCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-focus customer if passed from context
  React.useEffect(() => {
    const targetId = contextEntityId || contextCustomerId;
    if (targetId) {
      const target = state.customers.find((c) => c.id === targetId);
      if (target) {
        setSelectedCustomer(target);
        setActiveTab('CUSTOMERS');
      }
    }
  }, [contextEntityId, contextCustomerId, state.customers]);

  // New Customer Form State
  const [customerForm, setCustomerForm] = useState({
    type: 'COMPANY' as CustomerType,
    fullName: '',
    companyName: '',
    phone: '+237 6',
    email: '',
    address: 'Douala, Cameroun',
    city: 'Douala',
    idCardNumber: '',
    taxNumber: '',
    rccmNumber: '',
    notes: '',
  });

  // Edit Customer Form State
  const [editForm, setEditForm] = useState({
    type: 'COMPANY' as CustomerType,
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Douala',
    idCardNumber: '',
    taxNumber: '',
    rccmNumber: '',
    notes: '',
  });

  // New Lead Form State
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    companyName: '',
    phone: '+237 6',
    email: '',
    interestType: 'RENTAL' as 'RENTAL' | 'PURCHASE',
    interestedCategory: 'SUV' as VehicleCategory,
    budgetXAF: 500000,
    stage: 'PROSPECT' as LeadStage,
    notes: 'Contact initié à l’agence Bonamoussadi',
  });

  // Auto-focus customer if passed in context
  useEffect(() => {
    if (contextCustomerId) {
      const target = state.customers.find((c) => c.id === contextCustomerId);
      if (target) {
        setSelectedCustomer(target);
        setActiveTab('CUSTOMERS');
      }
    }
  }, [contextCustomerId, state.customers]);

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditForm({
      type: cust.type,
      fullName: cust.fullName,
      companyName: cust.companyName || '',
      phone: cust.phone,
      email: cust.email,
      address: cust.address,
      city: cust.city,
      idCardNumber: cust.idCardNumber || '',
      taxNumber: cust.taxNumber || '',
      rccmNumber: cust.rccmNumber || '',
      notes: cust.notes || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = CustomerSchema.safeParse(customerForm);
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Erreur de validation');
      return;
    }

    try {
      const created = dbStore.addCustomer(customerForm);
      setIsAddModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Fiche client créée avec succès pour "${created.companyName || created.fullName}".`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setFormError(null);

    const validation = CustomerSchema.safeParse(editForm);
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Erreur de validation');
      return;
    }

    try {
      dbStore.updateCustomer(editingCustomer.id, editForm);
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, ...editForm });
      }
      setIsEditModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Fiche client "${editForm.companyName || editForm.fullName}" mise à jour avec succès.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la modification');
    }
  };

  const handleConfirmDelete = (reason: string) => {
    if (!deleteConfirmCustomer) return;
    try {
      const name = deleteConfirmCustomer.companyName || deleteConfirmCustomer.fullName;
      dbStore.deleteCustomer(deleteConfirmCustomer.id, reason);
      if (selectedCustomer?.id === deleteConfirmCustomer.id) {
        setSelectedCustomer(null);
      }
      setDeleteConfirmCustomer(null);
      setActionAlert({
        type: 'success',
        message: `Client "${name}" supprimé et archivé dans le journal d'audit FCT.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  // Lead Management
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lead = dbStore.addLead({
        ...leadForm,
        assignedAgentId: dbStore.getCurrentUser().id,
        assignedAgentName: dbStore.getCurrentUser().fullName,
      });
      setIsNewLeadModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Prospect "${lead.fullName}" ajouté au pipeline commercial FCT.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleOpenConvertLead = (lead: CrmLead) => {
    setConvertingLead(lead);
    setIsConvertLeadModalOpen(true);
  };

  const handleConfirmConvertLead = () => {
    if (!convertingLead) return;
    try {
      const customer = dbStore.convertLeadToCustomer(convertingLead.id, {
        type: convertingLead.companyName ? 'COMPANY' : 'INDIVIDUAL',
        fullName: convertingLead.fullName,
        companyName: convertingLead.companyName,
        phone: convertingLead.phone,
        email: convertingLead.email || 'client@fct-douala.cm',
        address: 'Douala, Cameroun',
        city: 'Douala',
        notes: `Converti depuis le prospect CRM (${convertingLead.interestType} - Budget: ${formatXAF(convertingLead.budgetXAF)})`,
      });

      setIsConvertLeadModalOpen(false);
      setConvertingLead(null);
      setSelectedCustomer(customer);
      setActiveTab('CUSTOMERS');
      setActionAlert({
        type: 'success',
        message: `Prospect "${customer.fullName}" converti en client officiel FCT avec succès.`,
      });
      setTimeout(() => setActionAlert(null), 5000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur de conversion' });
    }
  };

  // Filtered lists
  const filteredCustomers = state.customers.filter((c) => {
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.taxNumber && c.taxNumber.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const filteredLeads = state.leads.filter((l) => {
    const matchesStage = leadStageFilter === 'ALL' || l.stage === leadStageFilter;
    const matchesSearch =
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.toLowerCase().includes(search.toLowerCase()) ||
      (l.companyName && l.companyName.toLowerCase().includes(search.toLowerCase())) ||
      l.notes.toLowerCase().includes(search.toLowerCase());
    return matchesStage && matchesSearch;
  });


  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DU CLIENT SÉLECTIONNÉ
  // =========================================================================
  if (selectedCustomer) {
    const custContracts = state.contracts.filter((c) => c.customerId === selectedCustomer.id);
    const custInvoices = state.invoices.filter((i) => i.customerId === selectedCustomer.id);
    const custSales = (state.sales || []).filter((s) => s.customerId === selectedCustomer.id);
    const custDocs = (state.documents || []).filter(
      (d: any) => d.relatedEntityId === selectedCustomer.id || d.relatedCustomerId === selectedCustomer.id
    );

    return (
      <>
        <EntityShowroomLayout
          backLabel="Retour au répertoire des clients"
          onBack={() => setSelectedCustomer(null)}
          title={selectedCustomer.companyName || selectedCustomer.fullName}
          subtitle={`${selectedCustomer.type === 'COMPANY' ? 'Client Entreprise' : 'Client Particulier'} • Contact Référent : ${selectedCustomer.fullName} • ${selectedCustomer.phone}`}
          referenceId={selectedCustomer.id}
          status={selectedCustomer.type}
          statusLabel={selectedCustomer.type === 'COMPANY' ? 'Entreprise' : 'Particulier'}
          avatarText={(selectedCustomer.companyName || selectedCustomer.fullName).charAt(0)}
          avatarIcon={User}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
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
                onClick={() => handleOpenEdit(selectedCustomer)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Modifier Client</span>
              </button>
              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedCustomer.id;
                      setSelectedCustomer(null);
                      onNavigate('rentals', cid);
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Nouveau Contrat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedCustomer.id;
                      setSelectedCustomer(null);
                      onNavigate('sales', cid);
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Nouvelle Vente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedCustomer.id;
                      setSelectedCustomer(null);
                      onNavigate('billing', cid);
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Émettre Facture</span>
                  </button>
                </>
              )}
            </div>
          }
          kpis={[
            {
              label: 'Chiffre d\'Affaires Cumulé',
              value: formatXAF(selectedCustomer.totalSpentXAF),
              sublabel: 'Total dépenses enregistrées XAF',
              highlight: true,
            },
            {
              label: 'Contrats de Location',
              value: custContracts.length,
              sublabel: `${custContracts.filter((c) => c.status === 'ACTIVE').length} contrat(s) en cours`,
            },
            {
              label: 'Factures Émises',
              value: custInvoices.length,
              sublabel: `${custInvoices.filter((i) => i.balanceXAF > 0).length} impayée(s)`,
            },
            {
              label: 'Immatriculation Fiscale',
              value: selectedCustomer.taxNumber || 'Non renseigné',
              sublabel: 'NIU Entreprise / Particulier',
            },
          ]}
          tabs={[
            { id: 'PROFILE', label: 'Profil & Coordonnées', icon: User },
            { id: 'DOCS', label: 'Documents & Justificatifs', icon: FileText, badge: custDocs.length },
            { id: 'RENTALS', label: 'Contrats de Location', icon: KeyRound, badge: custContracts.length },
            { id: 'SALES', label: 'Dossiers de Vente', icon: TrendingUp, badge: custSales.length },
            { id: 'INVOICES', label: 'Factures & Règlements', icon: Receipt, badge: custInvoices.length },
            { id: 'TIMELINE', label: 'Historique & Relation Client', icon: Clock },
          ]}
          activeTab={customerDetailTab}
          onTabChange={(t) => setCustomerDetailTab(t as any)}
        >
          {/* TAB 1: PROFILE */}
          {customerDetailTab === 'PROFILE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Identité &amp; Coordonnées</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Nom complet / Raison sociale :</span>
                      <span className="font-bold text-slate-900">{selectedCustomer.companyName || selectedCustomer.fullName}</span>
                    </div>
                    {selectedCustomer.companyName && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Contact référent :</span>
                        <span className="font-semibold text-slate-900">{selectedCustomer.fullName}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Numéro de téléphone :</span>
                      <span className="font-bold text-slate-900">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Adresse e-mail :</span>
                      <span className="font-mono text-slate-900">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Adresse physique :</span>
                      <span className="font-medium text-slate-900">{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Paramètres Fiscaux &amp; Statut FCT</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Type de compte client :</span>
                      <span className="font-bold text-slate-900">
                        {selectedCustomer.type === 'COMPANY' ? 'Client Entreprise (B2B)' : 'Particulier (B2C)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Numéro d'Identifiant Unique (NIU) :</span>
                      <span className="font-mono font-bold text-blue-900">{selectedCustomer.taxNumber || 'Non renseigné'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Date d'enregistrement :</span>
                      <span className="font-mono text-slate-600">{selectedCustomer.createdAt}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Statut portefeuille :</span>
                      <span className="font-bold text-emerald-800">Client Actif Conforme</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCS */}
          {customerDetailTab === 'DOCS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Dossier Numérique &amp; Justificatifs Client</h3>
                  <p className="text-xs text-slate-500">Scan CNI ou Passeport, Registre du Commerce (RCCM), Permis de conduire, Justificatif de domicile</p>
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

              {custDocs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Aucun document numérique archivé pour ce client</p>
                  <p className="text-xs text-slate-400">Cliquez sur « Rattacher un document » pour joindre une copie de CNI, RCCM ou permis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {custDocs.map((doc: any) => (
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
                          title="Visualiser le document"
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

          {/* TAB 3: RENTALS */}
          {customerDetailTab === 'RENTALS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Historique des Locations</h3>
                  <p className="text-xs text-slate-500">Tous les contrats de location passés ou en cours pour ce client</p>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedCustomer.id;
                      setSelectedCustomer(null);
                      onNavigate('rentals', cid);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Créer une Location</span>
                  </button>
                )}
              </div>

              {custContracts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <KeyRound className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Aucun contrat de location enregistré pour ce client</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0f2a4a] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">N° Contrat</th>
                        <th className="py-3 px-4">Véhicule Loué</th>
                        <th className="py-3 px-4">Période</th>
                        <th className="py-3 px-4 text-right">Montant Total</th>
                        <th className="py-3 px-4 text-right">Encaissé</th>
                        <th className="py-3 px-4 text-right">Solde Dû</th>
                        <th className="py-3 px-4 text-center">Statut</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {custContracts.map((ctr) => (
                        <tr key={ctr.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">{ctr.contractNumber}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{ctr.vehicleName}</td>
                          <td className="py-3 px-4 text-slate-600">{ctr.startDate} au {ctr.endDate}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{formatXAF(ctr.totalAmountXAF)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatXAF(ctr.paidAmountXAF)}</td>
                          <td className="py-3 px-4 text-right font-black text-rose-700">{formatXAF(ctr.remainingAmountXAF)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ctr.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {ctr.status === 'ACTIVE' ? 'En cours' : ctr.status === 'RETURNED' ? 'Restitué' : 'Annulé'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {onNavigate && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  onNavigate('rentals', ctr.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Fiche</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SALES */}
          {customerDetailTab === 'SALES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Commandes &amp; Achats de Véhicules</h3>
                  <p className="text-xs text-slate-500">Bons de commande signés et véhicules achetés par ce client</p>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedCustomer.id;
                      setSelectedCustomer(null);
                      onNavigate('sales', cid);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Nouvelle Vente</span>
                  </button>
                )}
              </div>

              {custSales.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Aucun dossier de vente lié à ce client</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {custSales.map((sale) => (
                    <div key={sale.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-900 text-xs">{sale.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {sale.stage}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-sm">{sale.vehicleName}</h4>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Prix de vente : <strong className="text-slate-900">{formatXAF(sale.negotiatedPriceXAF)}</strong></div>
                        <div>Acompte encaissé : <strong className="text-emerald-700">{formatXAF(sale.paidAmountXAF)}</strong></div>
                        <div>Solde restant : <strong className="text-rose-700">{formatXAF(sale.balanceXAF)}</strong></div>
                      </div>
                      {onNavigate && (
                        <div className="pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(null);
                              onNavigate('sales', sale.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                          >
                            <span>Consulter Showroom Vente</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INVOICES */}
          {customerDetailTab === 'INVOICES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Factures &amp; Créances Clients</h3>
                  <p className="text-xs text-slate-500">Toutes les factures et règlements associés à ce client</p>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      const cid = selectedCustomer.id;
                      setSelectedCustomer(null);
                      onNavigate('billing', cid);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Émettre une Facture</span>
                  </button>
                )}
              </div>

              {custInvoices.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Aucune facture enregistrée pour ce client</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0f2a4a] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">N° Facture</th>
                        <th className="py-3 px-4">Émise le</th>
                        <th className="py-3 px-4 text-right">Total TTC</th>
                        <th className="py-3 px-4 text-right">Encaissé</th>
                        <th className="py-3 px-4 text-right">Solde Restant</th>
                        <th className="py-3 px-4 text-center">Statut</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {custInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{inv.issueDate}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">{formatXAF(inv.totalAmountXAF)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatXAF(inv.paidAmountXAF)}</td>
                          <td className="py-3 px-4 text-right font-black text-rose-700">{formatXAF(inv.balanceXAF)}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status === 'PAID' ? 'Soldée' : 'En attente'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {onNavigate && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  onNavigate('billing', inv.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Fiche</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TIMELINE */}
          {customerDetailTab === 'TIMELINE' && (
            <EntityTimeline
              events={[
                {
                  id: 'evt-create',
                  date: selectedCustomer.createdAt,
                  title: `Création de la fiche client dans le CRM`,
                  description: `Enregistrement initial de ${selectedCustomer.companyName || selectedCustomer.fullName} par l'équipe commerciale FCT.`,
                  type: 'INFO',
                },
                ...custContracts.map((ctr) => ({
                  id: `evt-ctr-${ctr.id}`,
                  date: ctr.createdAt,
                  title: `Contrat de Location ${ctr.contractNumber}`,
                  description: `Véhicule loué : ${ctr.vehicleName} pour un montant de ${formatXAF(ctr.totalAmountXAF)}.`,
                  type: 'SUCCESS' as const,
                })),
              ]}
            />
          )}
        </EntityShowroomLayout>

        {/* Modal d'ajout de document client */}
        {isAddDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Rattacher un Document au Client</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Intitulé du document *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="Ex: Scan CNI, Registre de Commerce RCCM, Permis..."
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
                    <option value="CNI_PASSEPORT">CNI / Passeport</option>
                    <option value="PERMIS_CONDUIRE">Permis de Conduire</option>
                    <option value="RCCM">Registre du Commerce (RCCM)</option>
                    <option value="ATTESTATION_DOMICILE">Attestation de Domiciliation</option>
                    <option value="AUTRE">Autre Document</option>
                  </select>
                </div>

                <CloudinaryUploadDropzone
                  folder="fct_automobile/customers"
                  label="Pièce justificative client (Téléversement Cloudinary FCT) :"
                  helperText="Glissez ou sélectionnez la CNI, RCCM, passeport ou attestation de domicile"
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
                    placeholder="Annotations..."
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

        {/* Modal d'édition du client */}
        {isEditModalOpen && editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-600" />
                  <span>Modifier le Profil Client</span>
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nom Complet / Contact Référent *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                {editingCustomer.type === 'COMPANY' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Raison Sociale Entreprise *</label>
                    <input
                      type="text"
                      required
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Adresse à Douala *</label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIU Fiscal Cameroun</label>
                  <input
                    type="text"
                    value={editForm.taxNumber}
                    onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                    placeholder="M012345678901A"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-xs"
                  >
                    Enregistrer Modifications
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-emerald-600" />
            <span>CRM, Répertoire Clients &amp; Pipeline Prospects</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion du cycle client complet : du premier contact commercial au contrat de location ou vente
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CUSTOMERS' ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNewLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Prospect</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Alert */}
      {actionAlert && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <span>{actionAlert.message}</span>
          <button onClick={() => setActionAlert(null)} className="cursor-pointer text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top CRM Activity Summary KPIs */}
      {(() => {
        const totalSpentAll = state.customers.reduce((acc, c) => acc + (c.totalSpentXAF || 0), 0);
        const companyCount = state.customers.filter((c) => c.type === 'COMPANY').length;
        const individualCount = state.customers.filter((c) => c.type === 'INDIVIDUAL').length;
        const activeLeadsCount = state.leads.filter((l) => l.stage !== 'CONVERTED' && l.stage !== 'LOST').length;

        const crmKpis = [
          {
            id: 'kpi-customers',
            label: 'Clients Portefeuille',
            value: state.customers.length,
            sublabel: `${companyCount} Entreprises • ${individualCount} Particuliers`,
            icon: Users2,
            colorVariant: 'blue' as const,
          },
          {
            id: 'kpi-spent',
            label: 'Chiffre d’Affaires Total',
            value: formatXAF(totalSpentAll),
            sublabel: 'Dépenses cumulées clients XAF',
            icon: DollarSign,
            colorVariant: 'emerald' as const,
          },
          {
            id: 'kpi-leads',
            label: 'Pipeline Prospects',
            value: state.leads.length,
            sublabel: `${activeLeadsCount} en cours de conversion`,
            icon: TrendingUp,
            colorVariant: 'purple' as const,
          },
          {
            id: 'kpi-rentals',
            label: 'Locations Conclues',
            value: state.contracts.length,
            sublabel: `${state.contracts.filter((c) => c.status === 'ACTIVE').length} actives en circulation`,
            icon: KeyRound,
            colorVariant: 'amber' as const,
          },
        ];

        return <EntityActivitySummary items={crmKpis} columns={4} />;
      })()}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`pb-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
            activeTab === 'CUSTOMERS'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Portefeuille Clients Officiels ({state.customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEADS')}
          className={`pb-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
            activeTab === 'LEADS'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Pipeline Prospects &amp; Leads ({state.leads.length})</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMERS DIRECTORY */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, entreprise, téléphone, e-mail, NIU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['ALL', 'COMPANY', 'INDIVIDUAL'].map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTypeFilter(tp)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    typeFilter === tp ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tp === 'ALL' ? 'Tous' : tp === 'COMPANY' ? 'Entreprises' : 'Particuliers'}
                </button>
              ))}
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Nom / Raison Sociale</th>
                    <th className="py-3 px-4">Téléphone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Adresse</th>
                    <th className="py-3 px-4 text-center">Locations</th>
                    <th className="py-3 px-4 text-right">Dépenses Totales (XAF)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                        Aucun client ne correspond aux critères.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isCompany = cust.type === 'COMPANY';
                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustomer(cust)}
                          className="hover:bg-blue-50/50 cursor-pointer transition"
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCompany ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isCompany ? 'Entreprise' : 'Particulier'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{cust.companyName || cust.fullName}</div>
                            {isCompany && <div className="text-[10px] text-slate-500 font-normal">Contact : {cust.fullName}</div>}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">{cust.phone}</td>
                          <td className="py-3 px-4 text-slate-600">{cust.email}</td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{cust.address}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {state.contracts.filter((c) => c.customerId === cust.id).length}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-800 whitespace-nowrap">
                            {formatXAF(cust.totalSpentXAF)}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEdit(cust)}
                              title="Modifier"
                              className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer inline-flex items-center transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmCustomer(cust)}
                              title="Supprimer"
                              className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer inline-flex items-center transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEADS & PIPELINE */}
      {activeTab === 'LEADS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un prospect par nom, téléphone, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'PROSPECT', 'QUALIFIED', 'OPPORTUNITY', 'OFFER', 'NEGOTIATION', 'CONVERTED'].map((stg) => (
                <button
                  key={stg}
                  onClick={() => setLeadStageFilter(stg)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                    leadStageFilter === stg ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {stg === 'ALL' ? 'Tous' : stg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => {
              const isConverted = lead.stage === 'CONVERTED';
              return (
                <div
                  key={lead.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-blue-400 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {lead.interestType === 'RENTAL' ? 'Location' : 'Achat Véhicule'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isConverted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lead.stage}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 mt-2 text-sm">{lead.fullName}</h4>
                    {lead.companyName && <div className="text-xs text-slate-500 font-semibold">{lead.companyName}</div>}

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.interestedCategory && (
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>Catégorie : {lead.interestedCategory}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-900">Budget : {formatXAF(lead.budgetXAF)}</span>
                      </div>
                    </div>

                    {lead.notes && (
                      <div className="mt-2.5 p-2 bg-slate-50 rounded text-[11px] text-slate-600 italic">
                        "{lead.notes}"
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Agent : {lead.assignedAgentName || 'Équipe FCT'}
                    </span>

                    {!isConverted && (
                      <button
                        onClick={() => handleOpenConvertLead(lead)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Convertir en Client</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Convert Lead to Customer Modal */}
      {isConvertLeadModalOpen && convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Conversion Prospect → Client Officiel</span>
              </h3>
              <button onClick={() => setIsConvertLeadModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vous êtes sur le point de convertir le prospect <strong>{convertingLead.fullName}</strong> ({convertingLead.phone})
              en client officiel FCT. S'il existe déjà un compte client avec ce numéro de téléphone, il sera automatiquement
              fusionné pour éviter tout doublon dans le répertoire de Douala.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setIsConvertLeadModalOpen(false)}
                className="px-4 py-2 rounded bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertLead}
                className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow transition"
              >
                Confirmer la Conversion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Ajouter un Nouveau Client</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Type de client *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerForm({ ...customerForm, type: 'COMPANY' })}
                    className={`flex-1 py-2 rounded font-bold border cursor-pointer ${
                      customerForm.type === 'COMPANY'
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Entreprise
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerForm({ ...customerForm, type: 'INDIVIDUAL' })}
                    className={`flex-1 py-2 rounded font-bold border cursor-pointer ${
                      customerForm.type === 'INDIVIDUAL'
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Particulier
                  </button>
                </div>
              </div>

              {customerForm.type === 'COMPANY' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Raison Sociale / Entreprise *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: TotalEnergies Cameroun, CFAO Motors"
                    value={customerForm.companyName}
                    onChange={(e) => setCustomerForm({ ...customerForm, companyName: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom complet du contact / gérant *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Jean-Paul Mvogo"
                  value={customerForm.fullName}
                  onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+237 6..."
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@entreprise.cm"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIU Fiscal (Cameroun)</label>
                  <input
                    type="text"
                    placeholder="ex: M052014587963P"
                    value={customerForm.taxNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, taxNumber: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">RCCM</label>
                  <input
                    type="text"
                    placeholder="ex: RC/DLA/2021/B/145"
                    value={customerForm.rccmNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, rccmNumber: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Adresse à Douala *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Bonamoussadi, Carrefour Santa Barbara, Douala"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 rounded font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow transition cursor-pointer"
                >
                  Créer le Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Lead Modal */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-900" />
                <span>Nouveau Prospect CRM</span>
              </h3>
              <button onClick={() => setIsNewLeadModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom complet du prospect *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Paul Biya Junior"
                  value={leadForm.fullName}
                  onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Entreprise (facultatif)</label>
                <input
                  type="text"
                  placeholder="ex: Société Générale Cameroun"
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intérêt principal</label>
                  <select
                    value={leadForm.interestType}
                    onChange={(e) => setLeadForm({ ...leadForm, interestType: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="RENTAL">Location automobile</option>
                    <option value="PURCHASE">Achat de véhicule</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie souhaitée</label>
                  <select
                    value={leadForm.interestedCategory}
                    onChange={(e) => setLeadForm({ ...leadForm, interestedCategory: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="SUV">SUV</option>
                    <option value="4X4">4X4</option>
                    <option value="PICKUP">Pick-up</option>
                    <option value="BERLINE">Berline</option>
                    <option value="LUXE">Luxe</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget prévisionnel (XAF)</label>
                  <input
                    type="number"
                    value={leadForm.budgetXAF}
                    onChange={(e) => setLeadForm({ ...leadForm, budgetXAF: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes et besoins exprimés</label>
                <textarea
                  rows={2}
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 rounded font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded shadow transition cursor-pointer"
                >
                  Enregistrer Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmCustomer}
        title="Supprimer un Client du Répertoire"
        itemName={deleteConfirmCustomer ? deleteConfirmCustomer.companyName || deleteConfirmCustomer.fullName : ''}
        itemDetails={
          deleteConfirmCustomer
            ? `Téléphone : ${deleteConfirmCustomer.phone} — Dépenses : ${formatXAF(deleteConfirmCustomer.totalSpentXAF)}`
            : undefined
        }
        warningMessage="Attention : la suppression d'un client vérifie qu'aucun contrat actif n'est en cours. Cette opération sera inscrite dans le journal d'audit FCT."
        requireReason={true}
        onClose={() => setDeleteConfirmCustomer(null)}
        onConfirm={handleConfirmDelete}
      />
      {/* Modal Visualiseur Universel */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
      />
    </div>
  );
};
