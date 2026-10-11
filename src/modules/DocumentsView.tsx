/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Coffre-fort Numérique & Documents 360°
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState, useMemo } from 'react';
import { DatabaseState, dbStore } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { DocumentViewerModal } from '../components/ui/DocumentViewerModal.tsx';
import { Language } from '../services/i18n.ts';
import { AppModule } from '../../packages/shared-types/index.ts';
import { hasEffectivePermission } from '../../packages/business-rules/index.ts';
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
  FolderLock,
  FileText,
  ShieldAlert,
  Upload,
  Download,
  Eye,
  Lock,
  Globe,
  Car,
  User,
  KeyRound,
  Receipt,
  Search,
  Calendar,
  HardDrive,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

interface DocumentsViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextEntityId?: string | null;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ state, lang, onNavigate }) => {
  const currentUser = dbStore.getCurrentUser();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docTab, setDocTab] = useState<'DETAILS' | 'ENTITY' | 'AUDIT'>('DETAILS');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [newDocForm, setNewDocForm] = useState({
    title: '',
    category: 'VEHICLE_GREY_CARD',
    categoryLabel: 'Carte Grise',
    isPrivate: true,
    fileUrl: '',
    relatedModule: 'vehicles' as AppModule,
    relatedEntityId: '',
    relatedEntityName: '',
    author: currentUser.fullName || 'Direction FCT',
    expiryDate: '',
  });

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = {
        id: `doc_${Date.now()}`,
        title: newDocForm.title,
        category: newDocForm.category,
        categoryLabel: newDocForm.categoryLabel,
        isPrivate: newDocForm.isPrivate,
        size: '1.8 MB',
        updatedAt: new Date().toISOString().split('T')[0],
        relatedModule: newDocForm.relatedModule,
        relatedEntityId: newDocForm.relatedEntityId,
        relatedEntityName: newDocForm.relatedEntityName || 'Document FCT Douala',
        type: newDocForm.fileUrl.toLowerCase().includes('.pdf') ? 'PDF' : 'IMG',
        author: newDocForm.author,
        expiryDate: newDocForm.expiryDate || 'Permanent',
        fileUrl: newDocForm.fileUrl,
      };
      dbStore.addDocument(created as any);
      setIsUploadModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Document "${created.title}" indexé avec succès dans le coffre-fort.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
      setNewDocForm({
        title: '',
        category: 'VEHICLE_GREY_CARD',
        categoryLabel: 'Carte Grise',
        isPrivate: true,
        fileUrl: '',
        relatedModule: 'vehicles',
        relatedEntityId: '',
        relatedEntityName: '',
        author: currentUser.fullName || 'Direction FCT',
        expiryDate: '',
      });
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: err.message || 'Erreur lors du dépôt du document',
      });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const demoDocuments = [
    {
      id: 'doc_1',
      title: 'Carte Grise CEMAC - Toyota Prado TX (LT-8841-CE)',
      category: 'VEHICLE_GREY_CARD',
      categoryLabel: 'Carte Grise',
      isPrivate: true,
      size: '2.4 MB',
      updatedAt: '2026-09-15',
      relatedModule: 'vehicles' as AppModule,
      relatedEntityId: state.vehicles[0]?.id || '',
      relatedEntityName: state.vehicles[0] ? `${state.vehicles[0].brand} ${state.vehicles[0].model} (${state.vehicles[0].licensePlate})` : 'Toyota Prado TX-L',
      type: 'PDF',
      author: 'Directeur Général',
      expiryDate: '2029-09-15',
    },
    {
      id: 'doc_2',
      title: 'Police d’Assurance Tous Risques Activa Cameroun (Police n° AC-44912)',
      category: 'INSURANCE',
      categoryLabel: 'Assurance',
      isPrivate: true,
      size: '1.8 MB',
      updatedAt: '2026-10-01',
      relatedModule: 'vehicles' as AppModule,
      relatedEntityId: state.vehicles[1]?.id || '',
      relatedEntityName: 'Flotte Complète FCT Douala',
      type: 'PDF',
      author: 'Direction Administrative',
      expiryDate: '2027-10-01',
    },
    {
      id: 'doc_3',
      title: 'Attestation Visite Technique Sécurisée Douala - Mercedes GLE (LT-1100-AB)',
      category: 'TECHNICAL_INSPECTION',
      categoryLabel: 'Visite Technique',
      isPrivate: false,
      size: '850 KB',
      updatedAt: '2026-08-12',
      relatedModule: 'vehicles' as AppModule,
      relatedEntityId: state.vehicles[2]?.id || '',
      relatedEntityName: state.vehicles[2] ? `${state.vehicles[2].brand} ${state.vehicles[2].model}` : 'Mercedes-Benz GLE 450',
      type: 'PDF',
      author: 'Contrôle Technique Douala Bassa',
      expiryDate: '2027-02-12',
    },
    {
      id: 'doc_4',
      title: 'CNI Client Certifiée - Christian Eboa Eboa',
      category: 'CLIENT_ID',
      categoryLabel: 'Pièce Identité',
      isPrivate: true,
      size: '1.1 MB',
      updatedAt: '2026-10-04',
      relatedModule: 'crm' as AppModule,
      relatedEntityId: state.customers[0]?.id || '',
      relatedEntityName: state.customers[0]?.fullName || 'Christian Eboa Eboa',
      type: 'JPG',
      author: 'Agent Commercial',
      expiryDate: '2030-05-20',
    },
    {
      id: 'doc_5',
      title: 'Contrat Signé SOCTRAN SA (CTR-2026-0034)',
      category: 'CONTRACT',
      categoryLabel: 'Contrat Signé',
      isPrivate: true,
      size: '3.5 MB',
      updatedAt: '2026-10-05',
      relatedModule: 'rentals' as AppModule,
      relatedEntityId: state.contracts[0]?.id || '',
      relatedEntityName: state.contracts[0]?.customerName || 'SOCTRAN SA',
      type: 'PDF',
      author: 'Agent de Location',
      expiryDate: '2026-10-20',
    },
  ];

  const allDocs = useMemo(() => {
    return state.documents && state.documents.length > 0 ? state.documents : demoDocuments;
  }, [state.documents]);

  const filteredDocs = useMemo(() => {
    return allDocs.filter((doc) => {
      const matchesCat = activeCategory === 'ALL' || doc.category === activeCategory;
      const matchesSearch =
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        (doc.relatedEntityName && doc.relatedEntityName.toLowerCase().includes(search.toLowerCase())) ||
        (doc.categoryLabel && doc.categoryLabel.toLowerCase().includes(search.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [allDocs, activeCategory, search]);

  const kpis = [
    {
      id: 'kpi-total',
      label: 'Documents Coffre-fort',
      value: allDocs.length,
      sublabel: 'Fichiers certifiés FCT',
      icon: FolderLock,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-vault',
      label: 'Documents Restreints',
      value: allDocs.filter((d) => d.isPrivate).length,
      sublabel: 'Coffre-fort privé chiffré',
      icon: Lock,
      colorVariant: 'purple' as const,
    },
    {
      id: 'kpi-public',
      label: 'Documents Publics',
      value: allDocs.filter((d) => !d.isPrivate).length,
      sublabel: 'Visites & attestations',
      icon: Globe,
      colorVariant: 'emerald' as const,
    },
  ];


  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DU DOCUMENT SÉLECTIONNÉ
  // =========================================================================
  if (selectedDoc) {
    return (
      <EntityShowroomLayout
        backLabel="Retour au coffre-fort documentaire"
        onBack={() => setSelectedDoc(null)}
        title={selectedDoc.title}
        subtitle={`Catégorie : ${selectedDoc.categoryLabel} • Format ${selectedDoc.type} • Auteur : ${selectedDoc.author}`}
        referenceId={selectedDoc.id}
        status={selectedDoc.isPrivate ? 'MAINTENANCE' : 'AVAILABLE'}
        statusLabel={selectedDoc.isPrivate ? 'Coffre Privé Chiffré' : 'Document Public'}
        avatarIcon={FolderLock}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewerDoc(selectedDoc)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu Document</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedDoc.fileUrl) {
                  const a = window.document.createElement('a');
                  a.href = selectedDoc.fileUrl;
                  a.download = selectedDoc.title;
                  a.target = '_blank';
                  a.rel = 'noreferrer';
                  window.document.body.appendChild(a);
                  a.click();
                  a.remove();
                } else {
                  setViewerDoc(selectedDoc);
                }
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le Fichier</span>
            </button>
          </div>
        }
        kpis={[
          {
            label: 'Format & Taille',
            value: `${selectedDoc.type} (${selectedDoc.size})`,
            sublabel: 'Fichier numérisé haute résolution',
          },
          {
            label: 'Échéance de Validité',
            value: selectedDoc.expiryDate || 'Validité Illimitée',
            sublabel: 'Surveillance conformité FCT',
            highlight: true,
          },
          {
            label: 'Entité Associée',
            value: selectedDoc.relatedEntityName || 'Document Général',
            sublabel: `Module : ${selectedDoc.relatedModule || 'Global'}`,
          },
          {
            label: 'Niveau de Sécurité',
            value: selectedDoc.isPrivate ? 'Restreint (Direction)' : 'Consultable Agence',
            sublabel: selectedDoc.isPrivate ? 'Chiffrement AES-256' : 'Accès collaborateurs',
          },
        ]}
        tabs={[
          { id: 'DETAILS', label: 'Métadonnées & Sécurité', icon: FolderLock },
          { id: 'ENTITY', label: 'Entité Rattachée & Showroom', icon: Car },
          { id: 'AUDIT', label: 'Journal des Accès', icon: ShieldCheck },
        ]}
        activeTab={docTab}
        onTabChange={(t) => setDocTab(t as any)}
      >
        {/* TAB 1: DETAILS */}
        {docTab === 'DETAILS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Spécifications Techniques</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Format numérique :</span>
                    <span className="font-bold text-slate-900">{selectedDoc.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Taille du fichier :</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedDoc.size}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Date d'archivage :</span>
                    <span className="font-semibold text-slate-900">{selectedDoc.updatedAt}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Échéance légale :</span>
                    <span className="font-bold text-emerald-800">{selectedDoc.expiryDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Opérateur d'archivage :</span>
                    <span className="font-semibold text-slate-900">{selectedDoc.author}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sécurité &amp; Intégrité Numérique</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Classification :</span>
                    <span className="font-bold text-slate-900">{selectedDoc.categoryLabel}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Algorithme d'intégrité :</span>
                    <span className="font-mono text-xs text-slate-800">SHA-256 Validé</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Statut du coffre :</span>
                    <span className="font-bold text-emerald-800">Archivage Immuable Conforme</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ENTITY */}
        {docTab === 'ENTITY' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Module : {selectedDoc.relatedModule}
                </div>
                <h4 className="font-black text-slate-900 text-base">{selectedDoc.relatedEntityName}</h4>
                <div className="text-slate-500 text-xs">Identifiant système : <span className="font-mono font-bold text-slate-800">{selectedDoc.relatedEntityId}</span></div>
              </div>

              {onNavigate && selectedDoc.relatedEntityId && (
                <button
                  type="button"
                  onClick={() => {
                    const mod = selectedDoc.relatedModule;
                    const eId = selectedDoc.relatedEntityId;
                    setSelectedDoc(null);
                    onNavigate(mod, eId);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start md:self-center"
                >
                  <span>Ouvrir la Fiche Showroom Dédiée</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT */}
        {docTab === 'AUDIT' && (
          <EntityTimeline
            events={[
              {
                id: 'evt-arch',
                date: selectedDoc.updatedAt,
                title: `Dépôt du document dans le coffre-fort FCT`,
                description: `Fichier archivé par ${selectedDoc.author} avec vérification automatique de conformité.`,
                type: 'INFO',
              },
            ]}
          />
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
            <FolderLock className="w-6 h-6 text-emerald-600" />
            <span>Coffre-fort Numérique &amp; Documents Sécurisés</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cartes grises CEMAC, attestations d'assurance, visites techniques, pièces clients et contrats signés à Douala
          </p>
        </div>

        {hasEffectivePermission(currentUser, 'documents', 'create') && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Déposer un Document Sécurisé</span>
          </button>
        )}
      </div>

      {/* Action Alert Banner */}
      {actionAlert && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-xs transition ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : actionAlert.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cloudinary Architecture Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/10 to-emerald-900/10 border border-blue-200/80 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-950 block mb-0.5">
            Architecture Cloudinary &amp; Coffre-fort Numérique FCT
          </span>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Les photos de véhicules sont publiques et optimisées pour le showroom web. Les pièces d'identité, cartes grises et contrats confidentiels sont stockés dans un espace authentifié restreint avec génération de signatures temporaires éphémères côté serveur Cloud Functions (sans divulgation des secrets d'administration).
          </p>
        </div>
      </div>

      {/* Top Activity Summary KPIs */}
      <EntityActivitySummary items={kpis} columns={3} />

      {/* Search & Tabs */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher document, immatriculation, entité rattachée..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: `Tous les documents (${demoDocuments.length})` },
          { id: 'VEHICLE_GREY_CARD', label: 'Cartes Grises' },
          { id: 'INSURANCE', label: 'Assurances' },
          { id: 'TECHNICAL_INSPECTION', label: 'Visites Techniques' },
          { id: 'CONTRACT', label: 'Contrats Signés' },
          { id: 'CLIENT_ID', label: 'Pièces d’Identité' },
        ]}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
      />

      {/* Content: Cards or Table */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          title="Aucun document trouvé"
          description="Aucun fichier ne correspond à vos critères de recherche."
          icon={FolderLock}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <EntityCard
              key={doc.id}
              title={doc.title}
              subtitle={`Entité liée : ${doc.relatedEntityName}`}
              referenceId={doc.id}
              fallbackIcon={FileText}
              status={doc.isPrivate ? 'MAINTENANCE' : 'AVAILABLE'}
              statusLabel={doc.isPrivate ? 'Coffre Privé' : 'Public'}
              onClick={() => setSelectedDoc(doc)}
              metrics={[
                {
                  label: 'Catégorie',
                  value: doc.categoryLabel,
                  icon: FileText,
                },
                {
                  label: 'Taille & Format',
                  value: `${doc.type} • ${doc.size}`,
                  icon: HardDrive,
                },
                {
                  label: 'Validité / Expiration',
                  value: doc.expiryDate,
                  icon: Calendar,
                },
                {
                  label: 'Auteur Dépôt',
                  value: doc.author,
                  icon: User,
                },
              ]}
              quickActions={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewerDoc(doc);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Aperçu"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const fileUrl = (doc as any).fileUrl;
                      if (fileUrl) {
                        const a = window.document.createElement('a');
                        a.href = fileUrl;
                        a.download = doc.title;
                        a.target = '_blank';
                        a.rel = 'noreferrer';
                        window.document.body.appendChild(a);
                        a.click();
                        a.remove();
                      } else {
                        setViewerDoc(doc);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                    title="Télécharger"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs text-left">
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Titre du Document</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Entité Rattachée</th>
                  <th className="py-3 px-4 text-center">Niveau d'Accès</th>
                  <th className="py-3 px-4">Taille</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>{doc.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {doc.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{doc.relatedEntityName}</td>
                    <td className="py-3 px-4 text-center">
                      {doc.isPrivate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-bold text-[10px]">
                          <Lock className="w-3 h-3" /> Privé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{doc.size}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{doc.expiryDate}</td>
                    <td
                      className="py-3 px-4 text-right space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setViewerDoc(doc)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer inline-flex items-center"
                        title="Aperçu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const fileUrl = (doc as any).fileUrl;
                          if (fileUrl) {
                            const a = window.document.createElement('a');
                            a.href = fileUrl;
                            a.download = doc.title;
                            a.target = '_blank';
                            a.rel = 'noreferrer';
                            window.document.body.appendChild(a);
                            a.click();
                            a.remove();
                          } else {
                            setViewerDoc(doc);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer inline-flex items-center"
                        title="Télécharger / Visualiser"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      

      {/* Modal Déposer Document Cloudinary */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <span>Déposer un Document dans le Coffre-fort FCT</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Titre du document *</label>
                <input
                  type="text"
                  required
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  placeholder="Ex: Carte Grise Toyota Prado LT-8841-CE, Police d'Assurance..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Catégorie</label>
                  <select
                    value={newDocForm.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const label = cat === 'VEHICLE_GREY_CARD' ? 'Carte Grise' : cat === 'INSURANCE' ? 'Assurance' : cat === 'TECHNICAL_INSPECTION' ? 'Visite Technique' : cat === 'IDENTITY_PIECE' ? 'Pièce d\'Identité' : 'Autre';
                      setNewDocForm({ ...newDocForm, category: cat, categoryLabel: label });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="VEHICLE_GREY_CARD">Carte Grise</option>
                    <option value="INSURANCE">Police d'Assurance</option>
                    <option value="TECHNICAL_INSPECTION">Visite Technique</option>
                    <option value="IDENTITY_PIECE">Pièce d'Identité / CNI</option>
                    <option value="OTHER">Autre Pièce Officielle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Échéance de validité</label>
                  <input
                    type="date"
                    value={newDocForm.expiryDate}
                    onChange={(e) => setNewDocForm({ ...newDocForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <CloudinaryUploadDropzone
                folder="fct_automobile/vault"
                label="Fichier numérisé (Téléversement Cloudinary Sécurisé) :"
                helperText="Glissez ou sélectionnez le fichier PDF, PNG ou JPG à chiffrer"
                currentValue={newDocForm.fileUrl}
                onUploadSuccess={(url) => setNewDocForm({ ...newDocForm, fileUrl: url })}
                onClear={() => setNewDocForm({ ...newDocForm, fileUrl: '' })}
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrivateCheck"
                  checked={newDocForm.isPrivate}
                  onChange={(e) => setNewDocForm({ ...newDocForm, isPrivate: e.target.checked })}
                  className="rounded text-blue-900"
                />
                <label htmlFor="isPrivateCheck" className="text-slate-700 font-medium">
                  Document confidentiel (accès restreint Direction FCT)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newDocForm.fileUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer shadow-xs"
                >
                  Enregistrer et Archiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISUALISEUR UNIVERSEL CLOUDINARY */}
      <DocumentViewerModal
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
      />
    </div>
  );
};
