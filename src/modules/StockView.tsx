/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Stock de Pièces & Traçabilité Maintenance
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language } from '../services/i18n.ts';
import { formatXAF, hasEffectivePermission } from '../../packages/business-rules/index.ts';
import { StockItem, StockMovement, AppModule } from '../../packages/shared-types/index.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
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
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { DocumentViewerModal } from '../components/ui/DocumentViewerModal.tsx';
import { EntityCard } from '../components/ui/EntityCard.tsx';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  X,
  CheckCircle2,
  Pencil,
  Trash2,
  Wrench,
  Search,
  ExternalLink,
  DollarSign,
  TrendingUp,
  PackageCheck,
  History,
  Building,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Upload,
  FileText,
  Download,
  Eye,
} from 'lucide-react';

interface StockViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextItemId?: string | null;
  contextEntityId?: string | null;
}

export const StockView: React.FC<StockViewProps> = ({
  state,
  lang,
  onNavigate,
  contextItemId,
  contextEntityId,
}) => {
  const currentUser = dbStore.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'MOVEMENTS'>('ITEMS');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Selected item for Showroom / Fiche Détaillée
  const [selectedItemDetail, setSelectedItemDetail] = useState<StockItem | null>(null);
  const [itemDetailTab, setItemDetailTab] = useState<'SPECS' | 'MOVEMENTS' | 'MAINTENANCE' | 'SUPPLIER' | 'DOCS'>('SPECS');

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StockItem | null>(null);

  const [selectedAdjustItem, setSelectedAdjustItem] = useState<string>('');
  const [qtyDelta, setQtyDelta] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<StockMovement['type']>('INFLOW');
  const [reason, setReason] = useState<string>('Réapprovisionnement fournisseur');
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Item Form
  const [newItemForm, setNewItemForm] = useState({
    code: '',
    name: '',
    category: 'LUBRIFIANT' as StockItem['category'],
    quantityInStock: 10,
    minThresholdAlert: 3,
    unitCostXAF: 15000,
    unit: 'Litre',
    supplier: 'CFAO Motors Douala',
    locationBin: 'Rayon A-01',
  });

  // Edit Item Form
  const [editItemForm, setEditItemForm] = useState({
    code: '',
    name: '',
    category: 'LUBRIFIANT' as StockItem['category'],
    quantityInStock: 0,
    minThresholdAlert: 0,
    unitCostXAF: 0,
    unit: 'Pièce',
    supplier: '',
    locationBin: '',
  });

  // Focus context item
  useEffect(() => {
    const targetId = contextEntityId || contextItemId;
    if (targetId) {
      const target = state.stock.find((s) => s.id === targetId);
      if (target) {
        setSelectedItemDetail(target);
      }
    }
  }, [contextEntityId, contextItemId, state.stock]);

  // Calculations & KPIs
  const totalStockValue = state.stock.reduce((acc, s) => acc + s.quantityInStock * s.unitCostXAF, 0);
  const lowStockCount = state.stock.filter((s) => s.quantityInStock <= s.minThresholdAlert).length;
  const totalItemsCount = state.stock.length;
  const totalMovementsCount = state.stockMovements.length;

  const kpis = [
    {
      id: 'kpi-val',
      label: 'Valeur Totale Stock',
      value: formatXAF(totalStockValue),
      sublabel: 'Inventaire valorisé XAF',
      icon: DollarSign,
      colorVariant: 'emerald' as const,
    },
    {
      id: 'kpi-items',
      label: 'Références Actives',
      value: `${totalItemsCount} articles`,
      sublabel: 'Catalogue pièces FCT',
      icon: PackageCheck,
      colorVariant: 'blue' as const,
    },
    {
      id: 'kpi-alerts',
      label: 'Alertes Réappro.',
      value: lowStockCount,
      sublabel: 'Sous le seuil de sécurité',
      icon: AlertTriangle,
      colorVariant: lowStockCount > 0 ? ('amber' as const) : ('slate' as const),
    },
    {
      id: 'kpi-moves',
      label: 'Mouvements Traçés',
      value: totalMovementsCount,
      sublabel: 'Entrées / Sorties atelier',
      icon: History,
      colorVariant: 'purple' as const,
    },
  ];

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustItem) return;
    try {
      const delta = adjustType === 'OUTFLOW' ? -Math.abs(qtyDelta) : Math.abs(qtyDelta);
      dbStore.adjustStockQuantity(selectedAdjustItem, delta, reason, adjustType);
      setIsAdjustModalOpen(false);
      setReason('');
      setActionAlert({ type: 'success', message: 'Mouvement de stock enregistré avec succès et journalisé.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l’ajustement' });
    }
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = dbStore.addStockItem(newItemForm);
      setIsAddModalOpen(false);
      setActionAlert({ type: 'success', message: `Article "${created.name}" (${created.code}) ajouté au stock.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur' });
    }
  };

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setEditItemForm({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      dbStore.updateStockItem(editingItem.id, editItemForm);
      setIsEditModalOpen(false);
      if (selectedItemDetail?.id === editingItem.id) {
        setSelectedItemDetail({ ...selectedItemDetail, ...editItemForm });
      }
      setActionAlert({ type: 'success', message: `Article "${editItemForm.name}" mis à jour avec succès.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur' });
    }
  };

  const handleConfirmDelete = (deleteReason: string) => {
    if (!deleteConfirmItem) return;
    try {
      const name = deleteConfirmItem.name;
      dbStore.deleteStockItem(deleteConfirmItem.id, deleteReason);
      setDeleteConfirmItem(null);
      if (selectedItemDetail?.id === deleteConfirmItem.id) {
        setSelectedItemDetail(null);
      }
      setActionAlert({ type: 'success', message: `Article "${name}" supprimé et archivé dans le journal d'audit.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur' });
    }
  };

  // Filter items
  const filteredStock = useMemo(() => {
    return state.stock.filter((item) => {
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesLow = !onlyLowStock || item.quantityInStock <= item.minThresholdAlert;
      const matchesSearch =
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier.toLowerCase().includes(search.toLowerCase()) ||
        item.locationBin.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesLow && matchesSearch;
    });
  }, [state.stock, categoryFilter, onlyLowStock, search]);

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'FICHE_TECHNIQUE',
    fileUrl: '',
    notes: '',
  });

  const handleAddDocumentToStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemDetail) return;
    try {
      const newDoc = {
        id: `doc_stk_${Date.now()}`,
        title: docForm.title || `Fiche Technique - ${selectedItemDetail.name}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        fileSizeMb: 1.5,
        fileType: 'PDF / Document Technique',
        relatedEntityType: 'STOCK',
        relatedEntityId: selectedItemDetail.id,
        relatedPartId: selectedItemDetail.id,
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
        category: 'FICHE_TECHNIQUE',
        fileUrl: '',
        notes: '',
      });
      setActionAlert({ type: 'success', message: 'Document technique rattaché avec succès à la pièce.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du document' });
    }
  };

  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DE LA PIÈCE SÉLECTIONNÉE
  // =========================================================================
  if (selectedItemDetail) {
    const isCritical = selectedItemDetail.quantityInStock <= selectedItemDetail.minThresholdAlert;
    const isOutOfStock = selectedItemDetail.quantityInStock === 0;
    const moves = state.stockMovements.filter((m) => m.stockItemId === selectedItemDetail.id);
    const mnts = state.maintenance.filter((m) =>
      (m.partsUsed || []).some((p) => p.stockItemId === selectedItemDetail.id)
    );
    const stockDocs = (state.documents || []).filter(
      (d: any) => d.relatedEntityId === selectedItemDetail.id || d.relatedPartId === selectedItemDetail.id
    );

    return (
      <EntityShowroomLayout
        backLabel="Retour au Stock de Pièces"
        onBack={() => setSelectedItemDetail(null)}
        title={selectedItemDetail.name}
        subtitle={`Catégorie : ${selectedItemDetail.category} • Fournisseur Référencé : ${selectedItemDetail.supplier}`}
        referenceId={selectedItemDetail.code}
        status={isOutOfStock ? 'OUT_OF_STOCK' : isCritical ? 'LOW_STOCK' : 'AVAILABLE'}
        statusLabel={isOutOfStock ? 'Rupture' : isCritical ? 'Alerte Stock' : 'En Stock'}
        avatarIcon={Boxes}
        actions={
          <div className="flex items-center gap-2">
            {hasEffectivePermission(currentUser, 'stock', 'update') && (
              <>
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
                  onClick={() => {
                    setSelectedAdjustItem(selectedItemDetail.id);
                    setIsAdjustModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Ajuster Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedItemDetail)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Modifier Fiche</span>
                </button>
              </>
            )}
            {hasEffectivePermission(currentUser, 'stock', 'delete') && (
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(selectedItemDetail)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            )}
          </div>
        }
        kpis={[
          {
            label: 'Quantité Disponible',
            value: `${selectedItemDetail.quantityInStock} ${selectedItemDetail.unit}`,
            icon: PackageCheck,
            highlight: isCritical,
            sublabel: isOutOfStock ? 'Rupture immédiate' : isCritical ? 'Sous le seuil d\'alerte' : 'Stock nominal',
          },
          {
            label: 'Seuil Sécurité Alerte',
            value: `${selectedItemDetail.minThresholdAlert} ${selectedItemDetail.unit}`,
            icon: AlertTriangle,
            sublabel: 'Déclencheur réapprovisionnement',
          },
          {
            label: 'Prix Achat Unitaire HT',
            value: formatXAF(selectedItemDetail.unitCostXAF),
            icon: DollarSign,
            sublabel: 'Tarif fournisseur négocié',
          },
          {
            label: 'Valeur Immobilisée',
            value: formatXAF(selectedItemDetail.quantityInStock * selectedItemDetail.unitCostXAF),
            icon: TrendingUp,
            sublabel: `Emplacement : ${selectedItemDetail.locationBin}`,
          },
        ]}
        tabs={[
          { id: 'SPECS', label: 'Fiche Technique & Tarifs', icon: Layers },
          { id: 'DOCS', label: 'Documents & Fiches Produits', icon: FileText, badge: stockDocs.length + 1 },
          { id: 'MOVEMENTS', label: 'Historique des Mouvements', icon: History, badge: moves.length },
          { id: 'MAINTENANCE', label: 'Interventions Atelier Liées', icon: Wrench, badge: mnts.length },
          { id: 'SUPPLIER', label: 'Fournisseur & Emplacement Magasin', icon: Building },
        ]}
        activeTab={itemDetailTab}
        onTabChange={(t) => setItemDetailTab(t as any)}
      >
        {/* TAB 1: SPECS */}
        {itemDetailTab === 'SPECS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>Gestion des Volumes &amp; Emplacement</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Quantité physique en stock</div>
                    <div className="font-black text-lg text-slate-900 mt-1">{selectedItemDetail.quantityInStock} {selectedItemDetail.unit}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Seuil d'alerte sécurité</div>
                    <div className="font-black text-lg text-amber-700 mt-1">{selectedItemDetail.minThresholdAlert} {selectedItemDetail.unit}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Unité de gestion magasin</div>
                    <div className="font-bold text-sm text-slate-900 mt-1">{selectedItemDetail.unit}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <div className="text-[10px] text-blue-900 font-bold uppercase">Casier &amp; Rayonnage</div>
                    <div className="font-mono font-black text-sm text-blue-900 mt-1">{selectedItemDetail.locationBin}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-900" />
                  <span>Valorisation Comptable &amp; Approvisionnement</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Prix d’achat unitaire HT</div>
                    <div className="font-black text-lg text-slate-900 mt-1">{formatXAF(selectedItemDetail.unitCostXAF)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Valeur totale immobilisée</div>
                    <div className="font-black text-lg text-emerald-950 mt-1">
                      {formatXAF(selectedItemDetail.quantityInStock * selectedItemDetail.unitCostXAF)}
                    </div>
                  </div>
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Fournisseur partenaire</div>
                    <div className="font-bold text-sm text-slate-900 mt-1">{selectedItemDetail.supplier} (Douala)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCS */}
        {itemDetailTab === 'DOCS' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Documents Techniques &amp; Factures Fournisseur</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fiches constructeurs, certificats de conformité, bons de livraison et factures d'achat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Rattacher un Document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Carte Fiche Technique Fabricant par défaut */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                    Fiche Technique
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Certifié FCT
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Fiche Constructeur {selectedItemDetail.name}</h4>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedItemDetail.code}</p>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div>Origine : <strong>{selectedItemDetail.supplier}</strong></div>
                  <div>Catégorie : <strong>{selectedItemDetail.category}</strong></div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setViewerDoc({
                        title: `Fiche Technique - ${selectedItemDetail.name}`,
                        categoryLabel: 'Fiche Technique Constructeur',
                        fileUrl:
                          (selectedItemDetail as any).technicalSheetUrl ||
                          'https://res.cloudinary.com/c58pcgcp/image/upload/v1791555435/fct_automobile/_tests/fct_test_rpvnzf.pdf',
                        relatedEntityName: `${selectedItemDetail.name} (${selectedItemDetail.code})`,
                      })
                    }
                    className="flex-1 text-center py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Consulter le document</span>
                  </button>
                </div>
              </div>

              {/* Documents attachés dynamiques */}
              {stockDocs.map((doc: any) => (
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

        {/* TAB 3: MOVEMENTS */}
        {itemDetailTab === 'MOVEMENTS' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Journal d'Entrées, Sorties &amp; Mouvements ({moves.length})</h3>
            {moves.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold">
                Aucun mouvement de stock enregistré pour cette référence.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[600px]">
                  <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date &amp; Heure</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Quantité</th>
                      <th className="py-3 px-4">Motif &amp; Opération</th>
                      <th className="py-3 px-4">Auteur / Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {moves.map((mv) => (
                      <tr key={mv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{mv.timestamp}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mv.type === 'INFLOW'
                                ? 'bg-emerald-100 text-emerald-800'
                                : mv.type === 'OUTFLOW'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {mv.type === 'INFLOW' ? 'Entrée (+)' : mv.type === 'OUTFLOW' ? 'Sortie (-)' : 'Ajustement'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-slate-900">
                          {((mv as any).quantityDelta ?? (mv as any).deltaQuantity) > 0
                            ? `+${(mv as any).quantityDelta ?? (mv as any).deltaQuantity}`
                            : ((mv as any).quantityDelta ?? (mv as any).deltaQuantity)}{' '}
                          {selectedItemDetail.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{mv.reason}</td>
                        <td className="py-3 px-4 text-slate-500">{(mv as any).performedByName || (mv as any).createdByName || 'Système'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB 4: MAINTENANCE LINK */}
        {itemDetailTab === 'MAINTENANCE' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Dossiers d'Intervention Atelier Liés ({mnts.length})</h3>
            <p className="text-xs text-slate-500">Véhicules du parc ayant consommé cette pièce lors d'une révision</p>

            {mnts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold">
                Cette pièce n’a pas encore été consommée dans une intervention atelier enregistrée.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {mnts.map((mnt) => {
                  const partLine = (mnt.partsUsed || []).find((p) => p.stockItemId === selectedItemDetail.id);
                  return (
                    <div
                      key={mnt.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-4 shadow-2xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-blue-900 text-xs">{mnt.recordNumber}</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{mnt.vehicleName} ({mnt.licensePlate})</div>
                        <div className="text-xs text-slate-500">{mnt.garageName} • {mnt.startDate}</div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-slate-900 text-sm">
                          Consommé : {partLine?.quantity || 1} {selectedItemDetail.unit}
                        </div>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemDetail(null);
                              onNavigate('maintenance', mnt.id);
                            }}
                            className="text-xs text-blue-700 hover:text-blue-900 font-bold inline-flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <span>Consulter l'ordre de réparation</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SUPPLIER */}
        {itemDetailTab === 'SUPPLIER' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Partenaire Fournisseur Référencé</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Raison sociale</div>
                <div className="font-bold text-sm text-slate-900">{selectedItemDetail.supplier}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Bassin d'approvisionnement</div>
                <div className="font-bold text-sm text-slate-900">Zone Industrielle Bassa / Bonanjo, Douala</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Délai moyen d'approvisionnement</div>
                <div className="font-bold text-sm text-slate-900">24h à 48h ouvrées</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Garantie pièce</div>
                <div className="font-bold text-sm text-emerald-700">Pièce d'origine certifiée conforme constructeur</div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL AJOUT DOCUMENT STOCK */}
        {isAddDocModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Rattacher un Document à la Pièce</h3>
                <button
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToStock} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Titre du document *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fiche technique fabricant, Facture d'achat, Certificat d'origine..."
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden focus:border-blue-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Catégorie</label>
                    <select
                      value={docForm.category}
                      onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="FICHE_TECHNIQUE">Fiche Technique</option>
                      <option value="FACTURE_ACHAT">Facture Fournisseur</option>
                      <option value="BON_LIVRAISON">Bon de Livraison</option>
                      <option value="CERTIFICAT_ORIGINE">Certificat d'Origine</option>
                      <option value="AUTRE">Autre Document</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <CloudinaryUploadDropzone
                    folder="fct_automobile/stock"
                    label="Fiche technique / Facture (Téléversement Cloudinary FCT) :"
                    helperText="Glissez ou sélectionnez la fiche technique ou facture fournisseur (PDF, PNG, JPG)"
                    currentValue={docForm.fileUrl}
                    onUploadSuccess={(url) => setDocForm({ ...docForm, fileUrl: url })}
                    onClear={() => setDocForm({ ...docForm, fileUrl: '' })}
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Observations / Notes</label>
                  <textarea
                    rows={2}
                    value={docForm.notes}
                    onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                    placeholder="Référence commande d'approvisionnement..."
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
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            <span>Stock de Pièces, Consommables &amp; Inventaire</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lubrifiants, pneumatiques, filtres et traçabilité des consommations sur le parc automobile FCT (Douala)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasEffectivePermission(currentUser, 'stock', 'create') && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Référence</span>
            </button>
          )}

          {hasEffectivePermission(currentUser, 'stock', 'update') && (
            <button
              onClick={() => {
                setSelectedAdjustItem(state.stock[0]?.id || '');
                setIsAdjustModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Entrée / Sortie Stock</span>
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

      {/* Tab Controls: Items vs Movement Trail */}
      <EntitySearchFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par référence, désignation, fournisseur, emplacement..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ITEMS', label: 'Inventaire des Pièces', count: state.stock.length },
          { id: 'MOVEMENTS', label: 'Journal des Mouvements', count: state.stockMovements.length },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
        filters={
          activeTab === 'ITEMS'
            ? [
                {
                  label: 'Catégorie',
                  value: categoryFilter,
                  onChange: setCategoryFilter,
                  options: [
                    { label: 'Toutes', value: 'ALL' },
                    { label: 'Lubrifiants', value: 'LUBRIFIANT' },
                    { label: 'Freinage', value: 'FREINAGE' },
                    { label: 'Filtration', value: 'FILTRATION' },
                    { label: 'Suspension', value: 'SUSPENSION' },
                    { label: 'Pneumatique', value: 'PNEUMATIQUE' },
                    { label: 'Batterie', value: 'BATTERIE' },
                    { label: 'Autre', value: 'AUTRE' },
                  ],
                },
              ]
            : undefined
        }
      />

      {/* ========================================================= */}
      {/* TAB 1: INVENTAIRE DES PIÈCES                             */}
      {/* ========================================================= */}
      {activeTab === 'ITEMS' && (
        <>
          {filteredStock.length === 0 ? (
            <EmptyState
              title="Aucune pièce trouvée"
              description="Aucune référence ne correspond à votre recherche ou catégorie sélectionnée."
              icon={Boxes}
              action={
                hasEffectivePermission(currentUser, 'stock', 'create')
                  ? { label: 'Ajouter une pièce au stock', onClick: () => setIsAddModalOpen(true) }
                  : undefined
              }
            />
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStock.map((item) => {
                const isCritical = item.quantityInStock <= item.minThresholdAlert;
                const isOutOfStock = item.quantityInStock === 0;

                return (
                  <EntityCard
                    key={item.id}
                    title={item.name}
                    subtitle={`Catégorie: ${item.category} • Fournisseur: ${item.supplier}`}
                    referenceId={item.code}
                    fallbackIcon={Boxes}
                    status={isOutOfStock ? 'OUT_OF_STOCK' : isCritical ? 'LOW_STOCK' : 'AVAILABLE'}
                    statusLabel={
                      isOutOfStock ? 'Rupture' : isCritical ? `Alerte (${item.quantityInStock} ${item.unit})` : 'En Stock'
                    }
                    onClick={() => setSelectedItemDetail(item)}
                    metrics={[
                      {
                        label: 'Quantité Disponible',
                        value: `${item.quantityInStock} ${item.unit}`,
                        icon: PackageCheck,
                        highlight: isCritical,
                      },
                      {
                        label: 'Seuil Minimum',
                        value: `${item.minThresholdAlert} ${item.unit}`,
                        icon: AlertTriangle,
                      },
                      {
                        label: 'Coût Unitaire XAF',
                        value: formatXAF(item.unitCostXAF),
                        icon: DollarSign,
                      },
                      {
                        label: 'Emplacement Rayon',
                        value: item.locationBin,
                        icon: MapPin,
                      },
                    ]}
                    quickActions={
                      <div className="flex items-center gap-1">
                        {hasEffectivePermission(currentUser, 'stock', 'update') && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAdjustItem(item.id);
                                setIsAdjustModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 transition"
                              title="Ajuster le stock"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(item);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Modifier la fiche"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {hasEffectivePermission(currentUser, 'stock', 'delete') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmItem(item);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                            title="Supprimer la référence"
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
                      <th className="py-3 px-4">Référence</th>
                      <th className="py-3 px-4">Désignation</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4 text-center">Stock Actuel</th>
                      <th className="py-3 px-4 text-center">Seuil Min</th>
                      <th className="py-3 px-4 text-right">Coût Unitaire (XAF)</th>
                      <th className="py-3 px-4 text-right">Valeur Totale (XAF)</th>
                      <th className="py-3 px-4">Emplacement</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStock.map((item) => {
                      const isCritical = item.quantityInStock <= item.minThresholdAlert;
                      const isOutOfStock = item.quantityInStock === 0;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItemDetail(item)}
                          className="hover:bg-blue-50/40 transition cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">{item.code}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-500">Fournisseur: {item.supplier}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-black text-slate-900">
                            {item.quantityInStock} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            {item.minThresholdAlert} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-700">
                            {formatXAF(item.unitCostXAF)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                            {formatXAF(item.quantityInStock * item.unitCostXAF)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{item.locationBin}</td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <EntityStatusBadge
                              status={isOutOfStock ? 'OUT_OF_STOCK' : isCritical ? 'LOW_STOCK' : 'AVAILABLE'}
                              label={
                                isOutOfStock ? 'Rupture' : isCritical ? 'Alerte' : 'Normal'
                              }
                              size="sm"
                            />
                          </td>
                          <td
                            className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {hasEffectivePermission(currentUser, 'stock', 'update') && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedAdjustItem(item.id);
                                    setIsAdjustModalOpen(true);
                                  }}
                                  title="Ajuster quantité"
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer inline-flex"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  title="Modifier"
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer inline-flex"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {hasEffectivePermission(currentUser, 'stock', 'delete') && (
                              <button
                                onClick={() => setDeleteConfirmItem(item)}
                                title="Supprimer"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer inline-flex"
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
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: JOURNAL DES MOUVEMENTS DE STOCK                    */}
      {/* ========================================================= */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4">Motif &amp; Justificatif</th>
                  <th className="py-3 px-4">Auteur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                      Aucun mouvement de stock enregistré.
                    </td>
                  </tr>
                ) : (
                  state.stockMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {m.timestamp}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.stockItemName}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.type === 'INFLOW'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'OUTFLOW'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.type === 'INFLOW' ? 'Entrée (+)' : m.type === 'OUTFLOW' ? 'Sortie (-)' : 'Ajustement'}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-center font-black ${
                          ((m as any).quantityDelta ?? (m as any).deltaQuantity) > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {((m as any).quantityDelta ?? (m as any).deltaQuantity) > 0
                          ? `+${(m as any).quantityDelta ?? (m as any).deltaQuantity}`
                          : ((m as any).quantityDelta ?? (m as any).deltaQuantity)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{m.reason}</td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{(m as any).performedByName || (m as any).createdByName || 'Système'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Adjust Stock Quantity Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-blue-900" />
              <span>Ajustement de Stock &amp; Mouvement</span>
            </h3>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Article *</label>
                <select
                  value={selectedAdjustItem}
                  onChange={(e) => setSelectedAdjustItem(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                >
                  {state.stock.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - Stock actuel: {s.quantityInStock} {s.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Sens du Mouvement *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                >
                  <option value="INFLOW">Entrée en stock (+ Réapprovisionnement)</option>
                  <option value="OUTFLOW">Sortie de stock (- Consommation / Perte)</option>
                  <option value="ADJUSTMENT">Ajustement inventaire physique</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quantité *</label>
                <input
                  type="number"
                  min={1}
                  value={qtyDelta}
                  onChange={(e) => setQtyDelta(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Motif / Réf. Bon de livraison *</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Facture BL-994 CFAO Motors"
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Enregistrer Mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>Créer une Référence Pièce</span>
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Code Référence *</label>
                  <input
                    type="text"
                    value={newItemForm.code}
                    onChange={(e) => setNewItemForm({ ...newItemForm, code: e.target.value })}
                    placeholder="Ex: FILT-HUILE-TOY"
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Catégorie *</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  >
                    <option value="LUBRIFIANT">Lubrifiant</option>
                    <option value="FREINAGE">Freinage</option>
                    <option value="FILTRATION">Filtration</option>
                    <option value="SUSPENSION">Suspension</option>
                    <option value="PNEUMATIQUE">Pneumatique</option>
                    <option value="BATTERIE">Batterie</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Désignation complète *</label>
                <input
                  type="text"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="Ex: Filtre à Huile Original Toyota Land Cruiser"
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stock Initial</label>
                  <input
                    type="number"
                    value={newItemForm.quantityInStock}
                    onChange={(e) => setNewItemForm({ ...newItemForm, quantityInStock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Seuil Min. Alerte</label>
                  <input
                    type="number"
                    value={newItemForm.minThresholdAlert}
                    onChange={(e) => setNewItemForm({ ...newItemForm, minThresholdAlert: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unité</label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Coût Unitaire (XAF) *</label>
                  <input
                    type="number"
                    value={newItemForm.unitCostXAF}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitCostXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Emplacement Rayon</label>
                  <input
                    type="text"
                    value={newItemForm.locationBin}
                    onChange={(e) => setNewItemForm({ ...newItemForm, locationBin: e.target.value })}
                    placeholder="Rayon A-01"
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fournisseur</label>
                <input
                  type="text"
                  value={newItemForm.supplier}
                  onChange={(e) => setNewItemForm({ ...newItemForm, supplier: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  Créer la Pièce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-900" />
              <span>Modifier la Pièce {editingItem.code}</span>
            </h3>

            <form onSubmit={handleSaveEditItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Désignation *</label>
                <input
                  type="text"
                  value={editItemForm.name}
                  onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Seuil Min. Alerte</label>
                  <input
                    type="number"
                    value={editItemForm.minThresholdAlert}
                    onChange={(e) => setEditItemForm({ ...editItemForm, minThresholdAlert: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Coût Unitaire (XAF)</label>
                  <input
                    type="number"
                    value={editItemForm.unitCostXAF}
                    onChange={(e) => setEditItemForm({ ...editItemForm, unitCostXAF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Emplacement</label>
                  <input
                    type="text"
                    value={editItemForm.locationBin}
                    onChange={(e) => setEditItemForm({ ...editItemForm, locationBin: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={editItemForm.supplier}
                    onChange={(e) => setEditItemForm({ ...editItemForm, supplier: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
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
                  Enregistrer Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteConfirmItem)}
          title="Supprimer la Référence Stock"
          itemName={`Article ${deleteConfirmItem.name} (${deleteConfirmItem.code})`}
          itemDetails={`Stock actuel : ${deleteConfirmItem.quantityInStock} ${deleteConfirmItem.unit} d'une valeur de ${formatXAF(deleteConfirmItem.quantityInStock * deleteConfirmItem.unitCostXAF)}.`}
          warningMessage="La suppression d'un article en stock est irréversible et sera consignée dans le journal d'audit de sécurité."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmItem(null)}
        />
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
