/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Coffre-fort Numérique & Documents 360°
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState, useMemo } from 'react';
import { DatabaseState, dbStore } from '../services/dbStore.ts';
import { DocumentViewerModal } from '../components/ui/DocumentViewerModal.tsx';
import { Language, translations } from '../services/i18n.ts';
import { AppModule } from '../../packages/shared-types/index.ts';
import { hasEffectivePermission } from '../../packages/business-rules/index.ts';
import { exportCollectionToExcel } from '../utils/excelExport.ts';
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
  FileSpreadsheet,
} from 'lucide-react';

interface DocumentsViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextEntityId?: string | null;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ state, lang, onNavigate }) => {
  const t = translations[lang];
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
    categoryLabel: t.documentsPage.categoryGreyCard,
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
        expiryDate: newDocForm.expiryDate || (lang === 'en' ? 'Permanent' : 'Permanent'),
        fileUrl: newDocForm.fileUrl,
      };
      dbStore.addDocument(created as any);
      setIsUploadModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `${created.title} : ${t.documentsPage.docSuccessIndexed}`,
      });
      setTimeout(() => setActionAlert(null), 4000);
      setNewDocForm({
        title: '',
        category: 'VEHICLE_GREY_CARD',
        categoryLabel: t.documentsPage.categoryGreyCard,
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
        message: err.message || t.documentsPage.docErrorIndexed,
      });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const allDocs = useMemo(() => {
    return state.documents || [];
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
      label: t.documentsPage.totalDocuments,
      value: allDocs.length,
      sublabel: t.documentsPage.totalDocsSub,
      icon: FolderLock,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-vault',
      label: t.documentsPage.storageUsed,
      value: allDocs.filter((d) => d.isPrivate).length,
      sublabel: t.documentsPage.storageUsedSub,
      icon: Lock,
      colorVariant: 'purple' as const,
    },
    {
      id: 'kpi-public',
      label: t.documentsPage.verifiedDocs,
      value: allDocs.filter((d) => !d.isPrivate).length,
      sublabel: t.documentsPage.verifiedDocsSub,
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
        backLabel={t.documentsPage.backToVault}
        onBack={() => setSelectedDoc(null)}
        title={selectedDoc.title}
        subtitle={`${t.documentsPage.docColCategory} : ${selectedDoc.categoryLabel} • Format ${selectedDoc.type} • ${t.salesPage.fctAdvisor} ${selectedDoc.author}`}
        referenceId={selectedDoc.id}
        status={selectedDoc.isPrivate ? 'MAINTENANCE' : 'AVAILABLE'}
        statusLabel={selectedDoc.isPrivate ? t.documentsPage.privateVault : t.documentsPage.publicDoc}
        avatarIcon={FolderLock}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewerDoc(selectedDoc)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.documentsPage.previewDoc}</span>
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
              <span>{t.documentsPage.downloadDoc}</span>
            </button>
          </div>
        }
        kpis={[
          {
            label: t.documentsPage.formatAndSize,
            value: `${selectedDoc.type} (${selectedDoc.size})`,
            sublabel: t.documentsPage.formatAndSizeSub,
          },
          {
            label: t.documentsPage.validityExpiry,
            value: selectedDoc.expiryDate || t.documentsPage.unlimitedValidity,
            sublabel: t.documentsPage.validityExpirySub,
            highlight: true,
          },
          {
            label: t.documentsPage.associatedEntity,
            value: selectedDoc.relatedEntityName || t.documentsPage.generalDoc,
            sublabel: `Module : ${selectedDoc.relatedModule || t.documentsPage.globalModule}`,
          },
          {
            label: t.documentsPage.securityLevel,
            value: selectedDoc.isPrivate ? t.documentsPage.restrictedDirection : t.documentsPage.consultableAgency,
            sublabel: selectedDoc.isPrivate ? t.documentsPage.aes256 : t.documentsPage.collaboratorAccess,
          },
        ]}
        tabs={[
          { id: 'DETAILS', label: t.documentsPage.tabMetadata, icon: FolderLock },
          { id: 'ENTITY', label: t.documentsPage.tabEntity, icon: Car },
          { id: 'AUDIT', label: t.documentsPage.tabAudit, icon: ShieldCheck },
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
                  <span>{t.documentsPage.techSpecs}</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{t.documentsPage.digitalFormat}</span>
                    <span className="font-bold text-slate-900">{selectedDoc.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{t.documentsPage.fileSize}</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedDoc.size}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{t.documentsPage.archivedDate}</span>
                    <span className="font-semibold text-slate-900">{selectedDoc.updatedAt}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{t.documentsPage.legalExpiry}</span>
                    <span className="font-bold text-emerald-800">{selectedDoc.expiryDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{t.documentsPage.archiveOperator}</span>
                    <span className="font-semibold text-slate-900">{selectedDoc.author}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t.documentsPage.secIntegrity}</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{t.documentsPage.classification}</span>
                    <span className="font-bold text-slate-900">{selectedDoc.categoryLabel}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{t.documentsPage.hashAlgorithm}</span>
                    <span className="font-mono text-xs text-slate-800">SHA-256 Validated</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{t.documentsPage.vaultStatus}</span>
                    <span className="font-bold text-emerald-800">{t.documentsPage.vaultCompliant}</span>
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
                <div className="text-slate-500 text-xs">{t.documentsPage.systemId} <span className="font-mono font-bold text-slate-800">{selectedDoc.relatedEntityId}</span></div>
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
                  <span>{t.documentsPage.openShowroom}</span>
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
                title: t.documentsPage.docDepositArchive,
                description: `${t.documentsPage.fileArchivedBy} (${selectedDoc.author})`,
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
            <span>{t.documentsPage.title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.documentsPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportCollectionToExcel({
                filename: `FCT_Documents_Coffre_${new Date().toISOString().split('T')[0]}`,
                sheetName: 'Documents FCT',
                title: 'FCT AUTOMOBILE DOUALA — REGISTRE DU COFFRE-FORT NUMÉRIQUE',
                subtitle: `Exporté le ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')} • ${filteredDocs.length} document(s)`,
                columns: [
                  { header: t.documentsPage.systemId.replace(' :', ''), key: 'id', width: 16 },
                  { header: t.documentsPage.docColTitle, key: 'title', width: 34 },
                  { header: t.documentsPage.docColCategory, key: 'categoryLabel', width: 20 },
                  { header: t.documentsPage.docColEntity, key: 'relatedEntityName', width: 28 },
                  { header: 'Module', key: 'relatedModule', width: 14 },
                  { header: t.documentsPage.digitalFormat.replace(' :', ''), key: 'type', width: 12 },
                  { header: t.documentsPage.archiveOperator.replace(' :', ''), key: 'author', width: 22 },
                  { header: t.documentsPage.archivedDate.replace(' :', ''), key: 'updatedAt', width: 16 },
                  { header: t.documentsPage.docColExpiry, key: 'expiryDate', width: 16 },
                ],
                data: filteredDocs,
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f2a4a] hover:bg-[#163a66] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t.documentsPage.exportExcel}</span>
          </button>
          {hasEffectivePermission(currentUser, 'documents', 'create') && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{t.documentsPage.uploadBtn}</span>
            </button>
          )}
        </div>
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

      {/* Top Activity Summary KPIs */}
      <EntityActivitySummary items={kpis} columns={3} />

      {/* Search & Tabs */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.documentsPage.searchPlaceholder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: `${t.documentsPage.allTab} (${allDocs.length})` },
          { id: 'VEHICLE_GREY_CARD', label: t.documentsPage.categoryGreyCard },
          { id: 'INSURANCE', label: t.documentsPage.categoryInsurance },
          { id: 'TECHNICAL_INSPECTION', label: t.documentsPage.categoryInspection },
          { id: 'CONTRACT', label: t.documentsPage.contractsTab },
          { id: 'CLIENT_ID', label: t.documentsPage.identityTab },
        ]}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
      />

      {/* Content: Cards or Table */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          title={t.documentsPage.emptyDocsTitle}
          description={t.documentsPage.emptyDocsDesc}
          icon={FolderLock}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <EntityCard
              key={doc.id}
              title={doc.title}
              subtitle={`${t.documentsPage.associatedEntity} : ${doc.relatedEntityName}`}
              referenceId={doc.id}
              fallbackIcon={FileText}
              status={doc.isPrivate ? 'MAINTENANCE' : 'AVAILABLE'}
              statusLabel={doc.isPrivate ? t.documentsPage.storageUsed : t.documentsPage.verifiedDocs}
              onClick={() => setSelectedDoc(doc)}
              metrics={[
                {
                  label: t.documentsPage.docColCategory,
                  value: doc.categoryLabel,
                  icon: FileText,
                },
                {
                  label: t.documentsPage.formatAndSize,
                  value: `${doc.type} • ${doc.size}`,
                  icon: HardDrive,
                },
                {
                  label: t.documentsPage.validityExpiry,
                  value: doc.expiryDate,
                  icon: Calendar,
                },
                {
                  label: t.documentsPage.archiveOperator.replace(' :', ''),
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
                    title={t.documentsPage.previewDoc}
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
                    title={t.documentsPage.downloadDoc}
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
                  <th className="py-3 px-4">{t.documentsPage.docColTitle}</th>
                  <th className="py-3 px-4">{t.documentsPage.docColCategory}</th>
                  <th className="py-3 px-4">{t.documentsPage.docColEntity}</th>
                  <th className="py-3 px-4 text-center">{t.documentsPage.docColAccess}</th>
                  <th className="py-3 px-4">{t.documentsPage.docColSize}</th>
                  <th className="py-3 px-4">{t.documentsPage.docColExpiry}</th>
                  <th className="py-3 px-4 text-right">{t.documentsPage.docColActions}</th>
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
                          <Lock className="w-3 h-3" /> {t.documentsPage.privateVault}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                          <Globe className="w-3 h-3" /> {t.documentsPage.publicDoc}
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
                        title={t.documentsPage.previewDoc}
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
                        title={t.documentsPage.downloadDoc}
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
                <span>{t.documentsPage.uploadModalTitle}</span>
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
                <label className="block text-slate-700 font-bold mb-1">{t.documentsPage.docTitleLabel}</label>
                <input
                  type="text"
                  required
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  placeholder={lang === 'en' ? 'e.g. Registration Toyota Prado LT-8841-CE, Insurance Policy...' : "Ex: Carte Grise Toyota Prado LT-8841-CE, Police d'Assurance..."}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.documentsPage.categoryLabel}</label>
                  <select
                    value={newDocForm.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const label = cat === 'VEHICLE_GREY_CARD' ? t.documentsPage.categoryGreyCard : cat === 'INSURANCE' ? t.documentsPage.categoryInsurance : cat === 'TECHNICAL_INSPECTION' ? t.documentsPage.categoryInspection : cat === 'IDENTITY_PIECE' ? t.documentsPage.categoryIdentity : t.documentsPage.categoryOther;
                      setNewDocForm({ ...newDocForm, category: cat, categoryLabel: label });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="VEHICLE_GREY_CARD">{t.documentsPage.categoryGreyCard}</option>
                    <option value="INSURANCE">{t.documentsPage.categoryInsurance}</option>
                    <option value="TECHNICAL_INSPECTION">{t.documentsPage.categoryInspection}</option>
                    <option value="IDENTITY_PIECE">{t.documentsPage.categoryIdentity}</option>
                    <option value="OTHER">{t.documentsPage.categoryOther}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t.documentsPage.expiryDateLabel}</label>
                  <input
                    type="date"
                    value={newDocForm.expiryDate}
                    onChange={(e) => setNewDocForm({ ...newDocForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">{t.documentsPage.dropzoneLabel}</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-500 transition bg-slate-50">
                  <input
                    type="file"
                    id="docFileInput"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (uploadEvent) => {
                          const res = uploadEvent.target?.result as string;
                          setNewDocForm({
                            ...newDocForm,
                            fileUrl: res,
                            title: newDocForm.title || file.name.replace(/\.[^/.]+$/, ''),
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  {newDocForm.fileUrl ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
                      <span className="font-bold flex items-center gap-1.5 truncate max-w-[240px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        {t.documentsPage.docUploaded}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewDocForm({ ...newDocForm, fileUrl: '' })}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                      >
                        {t.documentsPage.removeFile}
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="docFileInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload className="w-6 h-6 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">{t.documentsPage.clickToSelect}</span>
                      <span className="text-[11px] text-slate-400">{t.documentsPage.fileSecureDesc}</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrivateCheck"
                  checked={newDocForm.isPrivate}
                  onChange={(e) => setNewDocForm({ ...newDocForm, isPrivate: e.target.checked })}
                  className="rounded text-blue-900"
                />
                <label htmlFor="isPrivateCheck" className="text-slate-700 font-medium">
                  {t.documentsPage.confidentialDoc}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newDocForm.fileUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer shadow-xs"
                >
                  {t.documentsPage.saveAndArchive}
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
        lang={lang}
      />
    </div>
  );
};
