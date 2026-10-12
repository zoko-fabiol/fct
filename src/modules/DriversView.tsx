/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Chauffeurs Professionnels & Showroom des Affectations (Pleine Page)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { Language, translations } from '../services/i18n.ts';
import { Driver, AppModule, Vehicle } from '../../packages/shared-types/index.ts';
import { hasEffectivePermission } from '../../packages/business-rules/index.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
import { EntityShowroomLayout } from '../components/ui/EntityShowroomLayout.tsx';
import { DocumentViewerModal } from '../components/ui/DocumentViewerModal.tsx';
import {
  EntityActivitySummary,
  EntitySearchFilters,
  EntityStatusBadge,
  EmptyState,
} from '../components/ui/EntityComponents.tsx';
import {
  UserSquare2,
  Plus,
  Star,
  Phone,
  ShieldCheck,
  X,
  Pencil,
  Trash2,
  Search,
  Filter,
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ChevronRight,
  Clock,
  FileText,
  Activity,
  Briefcase,
  Layers,
  Upload,
  ExternalLink,
  MapPin,
  Fuel,
  Gauge,
  KeyRound,
  Download,
} from 'lucide-react';

interface DriversViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextEntityId?: string | null;
}

export const DriversView: React.FC<DriversViewProps> = ({
  state,
  lang,
  onNavigate,
  contextEntityId,
}) => {
  const currentUser = dbStore.getCurrentUser();
  const t = translations[lang];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Showroom Chauffeur sélectionné (Pleine Page)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverDetailTab, setDriverDetailTab] = useState<string>('OVERVIEW');

  // Auto-sélection si navigation contextuelle
  useEffect(() => {
    if (contextEntityId) {
      const target = state.drivers.find((d) => d.id === contextEntityId);
      if (target) {
        setSelectedDriver(target);
        setDriverDetailTab('OVERVIEW');
      }
    }
  }, [contextEntityId, state.drivers]);

  // Synchronisation si le chauffeur sélectionné change dans le store
  useEffect(() => {
    if (selectedDriver) {
      const updated = state.drivers.find((d) => d.id === selectedDriver.id);
      if (updated) {
        setSelectedDriver(updated);
      }
    }
  }, [state.drivers]);

  // Modals de formulaires (Ajout / Édition / Suppression / Ajout Document)
  const [isNewDriverModalOpen, setIsNewDriverModalOpen] = useState(false);
  const [isEditDriverModalOpen, setIsEditDriverModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isAssignVehicleModalOpen, setIsAssignVehicleModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteConfirmDriver, setDeleteConfirmDriver] = useState<Driver | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Formulaires
  const [driverForm, setDriverForm] = useState({
    fullName: '',
    phone: '+237 6',
    licenseNumber: 'PER-DLA-2024-',
    licenseCategories: ['B', 'C'],
    licenseExpiryDate: '2028-12-31',
    medicalExamExpiryDate: '2027-06-30',
    status: 'AVAILABLE' as const,
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    licenseNumber: '',
    licenseCategories: ['B'],
    licenseExpiryDate: '',
    medicalExamExpiryDate: '',
    status: 'AVAILABLE' as Driver['status'],
    rating: 5,
  });

  const [docForm, setDocForm] = useState({
    title: '',
    category: 'PERMIS_CONDUIRE',
    fileUrl: '',
    expiryDate: '',
    notes: '',
  });
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const total = state.drivers.length;
    const available = state.drivers.filter((d) => d.status === 'AVAILABLE').length;
    const onTrip = state.drivers.filter((d) => d.status === 'ON_TRIP').length;
    const leave = state.drivers.filter((d) => d.status === 'LEAVE').length;
    return { total, available, onTrip, leave };
  }, [state.drivers]);

  // Filtrage
  const filteredDrivers = useMemo(() => {
    return state.drivers.filter((drv) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        drv.fullName.toLowerCase().includes(q) ||
        drv.phone.includes(q) ||
        drv.licenseNumber.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || drv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [state.drivers, search, statusFilter]);

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dbStore.addDriver(driverForm);
      setIsNewDriverModalOpen(false);
      setDriverForm({
        fullName: '',
        phone: '+237 6',
        licenseNumber: 'PER-DLA-2024-',
        licenseCategories: ['B', 'C'],
        licenseExpiryDate: '2028-12-31',
        medicalExamExpiryDate: '2027-06-30',
        status: 'AVAILABLE',
      });
      setActionAlert({ type: 'success', message: `Chauffeur ${driverForm.fullName} enregistré avec succès.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la création' });
    }
  };

  const handleOpenEdit = (drv: Driver) => {
    setEditingDriver(drv);
    setEditForm({
      fullName: drv.fullName,
      phone: drv.phone,
      licenseNumber: drv.licenseNumber,
      licenseCategories: drv.licenseCategories,
      licenseExpiryDate: drv.licenseExpiryDate,
      medicalExamExpiryDate: drv.medicalExamExpiryDate,
      status: drv.status,
      rating: drv.rating,
    });
    setIsEditDriverModalOpen(true);
  };

  const handleSaveEditDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    try {
      dbStore.updateDriver(editingDriver.id, editForm);
      setIsEditDriverModalOpen(false);
      if (selectedDriver?.id === editingDriver.id) {
        setSelectedDriver({ ...selectedDriver, ...editForm });
      }
      setActionAlert({ type: 'success', message: `Chauffeur ${editForm.fullName} mis à jour avec succès.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la modification' });
      setTimeout(() => setActionAlert(null), 5000);
    }
  };

  const handleConfirmDelete = (reason: string) => {
    if (!deleteConfirmDriver) return;
    try {
      const name = deleteConfirmDriver.fullName;
      dbStore.deleteDriver(deleteConfirmDriver.id, reason);
      setDeleteConfirmDriver(null);
      if (selectedDriver?.id === deleteConfirmDriver.id) setSelectedDriver(null);
      setActionAlert({ type: 'success', message: `Chauffeur ${name} supprimé et archivé dans le journal d'audit.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const handleAddDocumentToDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    try {
      const newDocId = `doc_drv_${Date.now()}`;
      const newDoc = {
        id: newDocId,
        title: docForm.title || `Document ${docForm.category} - ${selectedDriver.fullName}`,
        category: docForm.category,
        fileUrl: docForm.fileUrl,
        fileSizeMb: 1.2,
        fileType: 'PDF / Image Certifiée',
        relatedEntityType: 'DRIVER',
        relatedEntityId: selectedDriver.id,
        relatedDriverId: selectedDriver.id,
        relatedDriverName: selectedDriver.fullName,
        confidentialityLevel: 'RESTRICTED',
        status: 'VALID',
        expiryDate: docForm.expiryDate || '2028-12-31',
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
        category: 'PERMIS_CONDUIRE',
        fileUrl: '',
        expiryDate: '',
        notes: '',
      });
      setActionAlert({ type: 'success', message: 'Nouveau document rattaché avec succès au profil du chauffeur.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'ajout du document' });
    }
  };

  const handleAssignVehicle = (vehicleId: string) => {
    if (!selectedDriver) return;
    try {
      dbStore.updateDriver(selectedDriver.id, { currentAssignedVehicleId: vehicleId || undefined });
      setSelectedDriver({ ...selectedDriver, currentAssignedVehicleId: vehicleId || undefined });
      setIsAssignVehicleModalOpen(false);
      setActionAlert({ type: 'success', message: 'Affectation du véhicule mise à jour avec succès.' });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'affectation' });
    }
  };

  // Modals partagés entre la vue Liste et le Showroom Chauffeur
  const renderSharedModals = () => (
    <>
      {isEditDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">{lang === 'en' ? 'Edit Driver' : 'Modifier le Chauffeur'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditDriverModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.fullNameLabel}</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.phoneLabel}</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.licenseNumberLabel}</label>
                <input
                  type="text"
                  required
                  value={editForm.licenseNumber}
                  onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-hidden font-mono font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.licenseCategoriesLabel}</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D', 'E'].map((cat) => {
                    const isChecked = (editForm.licenseCategories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = editForm.licenseCategories || [];
                          const next = isChecked ? current.filter((c) => c !== cat) : [...current, cat];
                          setEditForm({ ...editForm, licenseCategories: next.length > 0 ? next : ['B'] });
                        }}
                        className={`px-3 py-1 rounded-lg border font-bold text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t.driversPage.licenseExpiryLabel}</label>
                  <input
                    type="date"
                    value={editForm.licenseExpiryDate}
                    onChange={(e) => setEditForm({ ...editForm, licenseExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{lang === 'en' ? 'Medical Checkup Expiry' : 'Visite Médicale'}</label>
                  <input
                    type="date"
                    value={editForm.medicalExamExpiryDate}
                    onChange={(e) => setEditForm({ ...editForm, medicalExamExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{lang === 'en' ? 'Activity Status' : "Statut d'activité"}</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-semibold"
                  >
                    <option value="AVAILABLE">{lang === 'en' ? 'Available' : 'Disponible'}</option>
                    <option value="ON_TRIP">{lang === 'en' ? 'On Mission' : 'En Mission'}</option>
                    <option value="LEAVE">{lang === 'en' ? 'On Leave' : 'En Congé'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{lang === 'en' ? 'Rating (1 to 5)' : 'Note (1 à 5)'}</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) || 5 })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditDriverModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 cursor-pointer shadow-sm"
                >
                  {lang === 'en' ? 'Save Changes' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmDriver && (
        <DeleteConfirmModal
          isOpen={!!deleteConfirmDriver}
          title={lang === 'en' ? 'Delete Driver' : 'Supprimer le chauffeur'}
          itemName={deleteConfirmDriver.fullName}
          warningMessage={
            lang === 'en'
              ? 'Are you sure you want to permanently delete this driver? This action will be logged in the security audit journal.'
              : "Êtes-vous sûr de vouloir supprimer définitivement ce chauffeur ? Cette action sera tracée dans le journal d'audit."
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmDriver(null)}
        />
      )}

      {/* Modal Visualiseur Universel */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
      />
    </>
  );

  // =========================================================================
  // VUE NIVEAU B : SHOWROOM PLEINE PAGE DU CHAUFFEUR SÉLECTIONNÉ
  // =========================================================================
  if (selectedDriver) {
    const assignedVehicle = selectedDriver.currentAssignedVehicleId
      ? state.vehicles.find((v) => v.id === selectedDriver.currentAssignedVehicleId)
      : null;

    const driverDocs = (state.documents || []).filter(
      (d: any) => d.relatedDriverId === selectedDriver.id || d.relatedEntityId === selectedDriver.id
    );

    const driverTrips = state.contracts.filter(
      (c) => c.driverIncluded && (c.driverId === selectedDriver.id || c.driverName === selectedDriver.fullName)
    );

    return (
      <>
        <EntityShowroomLayout
        backLabel={t.driversPage.backToDrivers}
        onBack={() => setSelectedDriver(null)}
        title={selectedDriver.fullName}
        subtitle={lang === 'en' ? 'FCT Certified Professional Chauffeur — Douala, Cameroon' : 'Chauffeur Professionnel Agréé FCT — Douala, Cameroun'}
        referenceId={selectedDriver.licenseNumber}
        status={selectedDriver.status}
        statusLabel={
          selectedDriver.status === 'AVAILABLE'
            ? (lang === 'en' ? 'Available' : 'Disponible')
            : selectedDriver.status === 'ON_TRIP'
            ? (lang === 'en' ? 'On Mission' : 'En Mission')
            : (lang === 'en' ? 'On Leave' : 'En Congé')
        }
        avatarText={selectedDriver.fullName.charAt(0)}
        actions={
          <div className="flex items-center gap-2">
            {hasEffectivePermission(currentUser, 'drivers', 'update') && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Add Document' : 'Ajouter Document'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedDriver)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Edit Profile' : 'Modifier Profil'}</span>
                </button>
              </>
            )}
            {hasEffectivePermission(currentUser, 'drivers', 'delete') && (
              <button
                type="button"
                onClick={() => setDeleteConfirmDriver(selectedDriver)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.delete}</span>
              </button>
            )}
          </div>
        }
        kpis={[
          {
            label: lang === 'en' ? 'Official License #' : 'N° Permis Officiel',
            value: selectedDriver.licenseNumber,
            icon: ShieldCheck,
            sublabel: `${lang === 'en' ? 'Categories' : 'Catégories'} ${selectedDriver.licenseCategories.join(', ')}`,
          },
          {
            label: lang === 'en' ? 'Medical Checkup Validity' : 'Validité Visite Médicale',
            value: selectedDriver.medicalExamExpiryDate,
            icon: Activity,
            sublabel: lang === 'en' ? 'Fitness medical checkup' : "Visite médicale d'aptitude",
          },
          {
            label: lang === 'en' ? 'Assigned Vehicle' : 'Véhicule Assigné',
            value: assignedVehicle ? assignedVehicle.licensePlate : (lang === 'en' ? 'None' : 'Aucun'),
            icon: Car,
            sublabel: assignedVehicle ? `${assignedVehicle.brand} ${assignedVehicle.model}` : (lang === 'en' ? 'Free fleet' : 'Flotte libre'),
          },
          {
            label: lang === 'en' ? 'Completed Missions' : 'Missions Conclues',
            value: `${driverTrips.length} ${lang === 'en' ? 'trips' : 'missions'}`,
            icon: Briefcase,
            sublabel: `${lang === 'en' ? 'Certified rating' : 'Évaluation certifiée'} : ${selectedDriver.rating} / 5.0`,
          },
        ]}
        tabs={[
          { id: 'OVERVIEW', label: t.driversPage.tabProfile, icon: UserSquare2 },
          { id: 'DOCS', label: t.driversPage.tabDocs, icon: FileText, badge: driverDocs.length + 2 },
          { id: 'VEHICLE', label: t.driversPage.tabVehicle, icon: Car },
          { id: 'TRIPS', label: t.driversPage.tabMissions, icon: Briefcase, badge: driverTrips.length },
        ]}
        activeTab={driverDetailTab}
        onTabChange={(t) => setDriverDetailTab(t)}
      >
        {/* Alerte contextuelle d'action */}
        {actionAlert && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 mb-4 animate-fadeIn ${
              actionAlert.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
        )}

        {/* ONGLET 1 : PROFIL & PERMIS */}
        {driverDetailTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  <span>État Civil &amp; Coordonnées Professionnelles</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Nom complet</div>
                    <div className="font-black text-sm text-slate-900 mt-1">{selectedDriver.fullName}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Téléphone professionnel</div>
                    <div className="font-bold text-sm text-blue-900 mt-1 flex items-center justify-between">
                      <span>{selectedDriver.phone}</span>
                      <a
                        href={`tel:${selectedDriver.phone}`}
                        className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" /> Appeler
                      </a>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Statut d'activité</div>
                    <div className="mt-1">
                      <EntityStatusBadge status={selectedDriver.status} size="sm" />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Note d'évaluation FCT</div>
                    <div className="font-black text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{selectedDriver.rating} / 5.0 (Recommandé)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Détails du Permis de Conduire &amp; Aptitude Médicale</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Numéro d'immatriculation du Permis</div>
                    <div className="font-mono font-black text-sm text-slate-900 mt-1">{selectedDriver.licenseNumber}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Catégories autorisées</div>
                    <div className="font-bold text-sm text-blue-900 mt-1 flex gap-1">
                      {selectedDriver.licenseCategories.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Date d'expiration Permis</div>
                    <div className="font-bold text-sm text-slate-900 mt-1">{selectedDriver.licenseExpiryDate}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Visite Médicale Périodique</div>
                    <div className="font-black text-sm text-emerald-950 mt-1">{selectedDriver.medicalExamExpiryDate}</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Certificat valide délivré par médecin agréé</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              {/* Carte Véhicule Assigné Rapide */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-900" />
                    <span>Affectation Actuelle</span>
                  </h3>
                  {hasEffectivePermission(currentUser, 'drivers', 'update') && (
                    <button
                      type="button"
                      onClick={() => setIsAssignVehicleModalOpen(true)}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      {assignedVehicle ? 'Changer' : 'Assigner'}
                    </button>
                  )}
                </div>

                {assignedVehicle ? (
                  <div className="space-y-3">
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 relative">
                      {assignedVehicle.photoUrls && assignedVehicle.photoUrls[0] ? (
                        <img
                          src={assignedVehicle.photoUrls[0]}
                          alt={assignedVehicle.model}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-500">
                          <Car className="w-10 h-10 opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/70 text-white font-mono font-bold text-xs">
                        {assignedVehicle.licensePlate}
                      </div>
                    </div>
                    <div>
                      <div className="font-black text-slate-900">{assignedVehicle.brand} {assignedVehicle.model} ({assignedVehicle.year})</div>
                      <div className="text-xs text-slate-500 mt-0.5">{assignedVehicle.currentLocation}</div>
                    </div>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('vehicles', assignedVehicle.id)}
                        className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Car className="w-4 h-4" />
                        <span>Ouvrir dans le Parc Automobile</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                    <Car className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">Aucun véhicule affecté en permanence.</p>
                    {hasEffectivePermission(currentUser, 'drivers', 'update') && (
                      <button
                        type="button"
                        onClick={() => setIsAssignVehicleModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-bold cursor-pointer hover:bg-blue-800 transition"
                      >
                        Assigner un véhicule
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 2 : DOCUMENTS & PERMIS NUMÉRISÉS */}
        {driverDetailTab === 'DOCS' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Dossier Documentaire &amp; Pièces Numérisées</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permis de conduire officiel, certificat de visite médicale, contrat de travail et pièces d'identité
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Rattacher un Nouveau Document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Carte Permis de conduire officiel */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                    Permis de Conduire
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Valide
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Permis {selectedDriver.licenseCategories.join('+')}</h4>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedDriver.licenseNumber}</p>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div>Titulaire : <strong>{selectedDriver.fullName}</strong></div>
                  <div>Expiration : <strong>{selectedDriver.licenseExpiryDate}</strong></div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  {selectedDriver.licenseDocumentUrl ? (
                    <a
                      href={selectedDriver.licenseDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Consulter le scan</span>
                    </a>
                  ) : (
                    <span className="flex-1 text-center py-2 rounded-lg bg-slate-50 text-slate-400 text-xs italic">
                      Scan de permis non fourni
                    </span>
                  )}
                </div>
              </div>

              {/* Carte Visite médicale */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                    Aptitude Médicale
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Conforme
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Certificat Médical d'Aptitude à la Conduite</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Visite obligatoire FCT Fleet Safety</p>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div>Médecin : <strong>Centre Médical Agréé Bonanjo</strong></div>
                  <div>Validité jusqu'au : <strong>{selectedDriver.medicalExamExpiryDate}</strong></div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  {selectedDriver.medicalCertificateUrl ? (
                    <a
                      href={selectedDriver.medicalCertificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Consulter le certificat</span>
                    </a>
                  ) : (
                    <span className="flex-1 text-center py-2 rounded-lg bg-slate-50 text-slate-400 text-xs italic">
                      Certificat médical non téléversé
                    </span>
                  )}
                </div>
              </div>

              {/* Documents attachés dynamiques */}
              {driverDocs.map((doc: any) => (
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
                    {doc.expiryDate && <div>Expire le : <strong>{doc.expiryDate}</strong></div>}
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

        {/* ONGLET 3 : VÉHICULE ASSIGNÉ DÉTAILLÉ */}
        {driverDetailTab === 'VEHICLE' && (
          <div className="space-y-6">
            {assignedVehicle ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md">
                      {assignedVehicle.licensePlate}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {assignedVehicle.brand} {assignedVehicle.model} ({assignedVehicle.year})
                    </h3>
                    <p className="text-xs text-slate-500">{assignedVehicle.currentLocation}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('vehicles', assignedVehicle.id)}
                        className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Car className="w-4 h-4" />
                        <span>Ouvrir Fiche Complète du Véhicule</span>
                      </button>
                    )}
                    {hasEffectivePermission(currentUser, 'drivers', 'update') && (
                      <button
                        type="button"
                        onClick={() => handleAssignVehicle('')}
                        className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                      >
                        Dissocier le véhicule
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Kilométrage actuel</div>
                    <div className="text-lg font-black text-slate-900 mt-1">{assignedVehicle.mileage.toLocaleString()} km</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Motorisation &amp; Boîte</div>
                    <div className="text-lg font-black text-slate-900 mt-1">{assignedVehicle.fuel} • {assignedVehicle.transmission}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Places assises</div>
                    <div className="text-lg font-black text-slate-900 mt-1">{assignedVehicle.seats} Places</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Statut flotte</div>
                    <div className="mt-1">
                      <EntityStatusBadge status={assignedVehicle.status} size="sm" />
                    </div>
                  </div>
                </div>

                <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                  {assignedVehicle.photoUrls && assignedVehicle.photoUrls[0] ? (
                    <img
                      src={assignedVehicle.photoUrls[0]}
                      alt={assignedVehicle.model}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 py-8">
                      <Car className="w-12 h-12 opacity-50 mb-2" />
                      <span className="text-xs font-mono">{assignedVehicle.licensePlate} — {assignedVehicle.brand} {assignedVehicle.model}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
                <Car className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Aucun véhicule actuellement rattaché</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ce chauffeur peut être assigné ponctuellement aux contrats de location ou recevoir un véhicule de fonction permanent.
                </p>
                {hasEffectivePermission(currentUser, 'drivers', 'update') && (
                  <button
                    type="button"
                    onClick={() => setIsAssignVehicleModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Sélectionner un véhicule disponible
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 4 : MISSIONS & CONTRATS ASSOCIÉS */}
        {driverDetailTab === 'TRIPS' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Missions &amp; Contrats d'Affectation ({driverTrips.length})</h3>
                <p className="text-xs text-slate-500">Traçabilité complète des prestations avec chauffeur assuré</p>
              </div>
            </div>

            {driverTrips.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-semibold text-xs">
                Aucun contrat ou mission n'a encore été attribué à ce chauffeur.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[600px]">
                  <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">N° Contrat</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Véhicule</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driverTrips.map((contract) => (
                      <tr key={contract.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">{contract.contractNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{contract.customerName}</td>
                        <td className="py-3 px-4 text-slate-700">{contract.vehicleName}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {contract.startDate} → {contract.endDate}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <EntityStatusBadge status={contract.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('rentals', contract.id)}
                              className="text-xs text-blue-700 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Voir Contrat</span>
                              <ChevronRight className="w-3.5 h-3.5" />
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
          </div>
        )}

        {/* MODAL AJOUT DOCUMENT CHAUFFEUR */}
        {isAddDocModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Rattacher un Document au Chauffeur</h3>
                <button
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocumentToDriver} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Titre du document *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Permis de conduire recto-verso, Attestation médicale..."
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden focus:border-blue-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Type de Document</label>
                    <select
                      value={docForm.category}
                      onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="PERMIS_CONDUIRE">Permis de Conduire</option>
                      <option value="VISITE_MEDICALE">Visite Médicale</option>
                      <option value="CONTRAT_TRAVAIL">Contrat de Travail</option>
                      <option value="PIECE_IDENTITE">CNI / Passeport</option>
                      <option value="CASIER_JUDICIAIRE">Casier Judiciaire</option>
                      <option value="AUTRE">Autre Justificatif</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Date d'expiration</label>
                    <input
                      type="date"
                      value={docForm.expiryDate}
                      onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg outline-hidden"
                    />
                  </div>
                </div>

                <CloudinaryUploadDropzone
                  folder="fct_automobile/drivers"
                  label="Document numérisé (Téléversement Cloudinary FCT) :"
                  helperText="Glissez ou sélectionnez le scan du permis, CNI ou attestation (PDF, PNG, JPG)"
                  currentValue={docForm.fileUrl}
                  onUploadSuccess={(url) => setDocForm({ ...docForm, fileUrl: url })}
                  onClear={() => setDocForm({ ...docForm, fileUrl: '' })}
                />

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Observations / Notes</label>
                  <textarea
                    rows={2}
                    value={docForm.notes}
                    onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                    placeholder="Notes de vérification administrative..."
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
                    Enregistrer le Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL ASSIGNATION VÉHICULE */}
        {isAssignVehicleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Affecter un Véhicule au Chauffeur</h3>
                <button
                  onClick={() => setIsAssignVehicleModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
                {state.vehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleAssignVehicle(v.id)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-900 hover:bg-blue-50/50 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{v.brand} {v.model} ({v.year})</div>
                      <div className="text-[11px] font-mono text-slate-500">{v.licensePlate} • {v.status}</div>
                    </div>
                    <span className="text-blue-700 font-bold text-xs">Sélectionner</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAssignVehicleModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </EntityShowroomLayout>
      {renderSharedModals()}
    </>
  );
}

  // =========================================================================
  // VUE NIVEAU A : LISTE SHOWROOM / TABLEAU DE TOUS LES CHAUFFEURS
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserSquare2 className="w-6 h-6 text-emerald-600" />
            <span>{t.driversPage.title} ({state.drivers.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.driversPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasEffectivePermission(currentUser, 'drivers', 'create') && (
            <button
              onClick={() => setIsNewDriverModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.driversPage.newDriverBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerte contextuelle */}
      {actionAlert && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionAlert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionAlert.message}</span>
        </div>
      )}

      {/* KPIs standardisés */}
      <EntityActivitySummary
        items={[
          {
            id: 'total',
            label: t.driversPage.totalDrivers,
            value: kpis.total,
            icon: UserSquare2,
            sublabel: lang === 'en' ? 'FCT certified team' : 'Effectif certifié FCT',
            colorVariant: 'blue',
          },
          {
            id: 'available',
            label: t.driversPage.availableDrivers,
            value: kpis.available,
            icon: CheckCircle2,
            sublabel: lang === 'en' ? 'Ready for immediate dispatch' : 'Prêts pour départ immédiat',
            colorVariant: 'emerald',
          },
          {
            id: 'on_trip',
            label: t.driversPage.assignedDrivers,
            value: kpis.onTrip,
            icon: Car,
            sublabel: lang === 'en' ? 'Currently on road trip' : 'Sur les axes routiers',
            colorVariant: 'purple',
          },
          {
            id: 'leave',
            label: t.driversPage.onLeaveTab,
            value: kpis.leave,
            icon: Clock,
            sublabel: lang === 'en' ? 'Regulatory rest' : 'Repos réglementaire',
            colorVariant: 'amber',
          },
        ]}
        columns={4}
      />

      {/* Outils de recherche, filtre et bascule de vue */}
      <EntitySearchFilters
        searchPlaceholder={t.driversPage.searchPlaceholder}
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tabs={[
          { id: 'ALL', label: t.driversPage.allTab, count: state.drivers.length },
          { id: 'AVAILABLE', label: t.driversPage.availableTab, count: kpis.available },
          { id: 'ON_TRIP', label: t.driversPage.onMissionTab, count: kpis.onTrip },
          { id: 'LEAVE', label: t.driversPage.onLeaveTab, count: kpis.leave },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      {/* Grille Showroom ou Tableau */}
      {filteredDrivers.length === 0 ? (
        <EmptyState
          title={t.driversPage.emptyDriversTitle}
          description={t.driversPage.emptyDriversDesc}
          icon={UserSquare2}
          action={
            hasEffectivePermission(currentUser, 'drivers', 'create')
              ? { label: t.driversPage.newDriverBtn, onClick: () => setIsNewDriverModalOpen(true) }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((drv) => {
            const assignedVehicle = drv.currentAssignedVehicleId
              ? state.vehicles.find((v) => v.id === drv.currentAssignedVehicleId)
              : null;

            return (
              <div
                key={drv.id}
                onClick={() => setSelectedDriver(drv)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-900/40 transition-all p-5 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        drv.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : drv.status === 'ON_TRIP'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {drv.status === 'AVAILABLE'
                        ? (lang === 'en' ? 'Available' : 'Disponible')
                        : drv.status === 'ON_TRIP'
                        ? (lang === 'en' ? 'On Mission' : 'En Mission')
                        : (lang === 'en' ? 'On Leave' : 'En Congé')}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{drv.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-900 text-white font-black flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform">
                      {drv.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                        {drv.fullName}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{drv.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div>{lang === 'en' ? 'License # :' : 'Permis n° :'} <span className="font-mono font-semibold text-slate-800">{drv.licenseNumber}</span></div>
                    <div>{lang === 'en' ? 'Categories :' : 'Catégories :'} <span className="font-bold text-blue-900">{drv.licenseCategories.join(', ')}</span></div>
                    <div>{lang === 'en' ? 'Medical Validity :' : 'Validité médicale :'} <span className="font-semibold text-slate-800">{drv.medicalExamExpiryDate}</span></div>
                  </div>

                  {assignedVehicle && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-blue-900 font-bold flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span>{assignedVehicle.brand} {assignedVehicle.model} ({assignedVehicle.licensePlate})</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-bold group-hover:text-blue-800">
                  <span>{lang === 'en' ? 'View driver showroom' : 'Consulter le showroom chauffeur'}</span>
                  <div className="flex items-center gap-2">
                    {hasEffectivePermission(currentUser, 'drivers', 'update') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(drv);
                        }}
                        title={t.edit}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">{lang === 'en' ? 'Driver' : 'Chauffeur'}</th>
                <th className="py-3 px-4">{lang === 'en' ? 'Phone' : 'Téléphone'}</th>
                <th className="py-3 px-4">{lang === 'en' ? 'License #' : 'N° Permis'}</th>
                <th className="py-3 px-4">{lang === 'en' ? 'Categories' : 'Catégories'}</th>
                <th className="py-3 px-4">{lang === 'en' ? 'Medical Validity' : 'Validité Médicale'}</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrivers.map((drv) => (
                <tr
                  key={drv.id}
                  onClick={() => setSelectedDriver(drv)}
                  className="hover:bg-blue-50/50 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                      {drv.fullName.charAt(0)}
                    </div>
                    <span>{drv.fullName}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{drv.phone}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-900">{drv.licenseNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-700">{drv.licenseCategories.join(', ')}</td>
                  <td className="py-3 px-4 text-slate-600">{drv.medicalExamExpiryDate}</td>
                  <td className="py-3 px-4 text-center">
                    <EntityStatusBadge status={drv.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                    {hasEffectivePermission(currentUser, 'drivers', 'update') && (
                      <button
                        onClick={() => handleOpenEdit(drv)}
                        title={t.edit}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasEffectivePermission(currentUser, 'drivers', 'delete') && (
                      <button
                        onClick={() => setDeleteConfirmDriver(drv)}
                        title={t.delete}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modals Formulaires */}
      {isNewDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">{t.driversPage.newDriverModalTitle}</h3>
              <button onClick={() => setIsNewDriverModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.fullNameLabel}</label>
                <input
                  type="text"
                  required
                  value={driverForm.fullName}
                  onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                  placeholder={lang === 'en' ? 'e.g. Paul Mbarga' : 'Ex: Paul Mbarga'}
                  className="w-full px-3 py-2 border rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.phoneLabel}</label>
                <input
                  type="text"
                  required
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.licenseNumberLabel}</label>
                <input
                  type="text"
                  required
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">{t.driversPage.licenseCategoriesLabel}</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D', 'E'].map((cat) => {
                    const isChecked = (driverForm.licenseCategories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = driverForm.licenseCategories || [];
                          const next = isChecked ? current.filter((c) => c !== cat) : [...current, cat];
                          setDriverForm({ ...driverForm, licenseCategories: next.length > 0 ? next : ['B'] });
                        }}
                        className={`px-3 py-1 rounded-lg border font-bold text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{t.driversPage.licenseExpiryLabel}</label>
                  <input
                    type="date"
                    value={driverForm.licenseExpiryDate}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">{lang === 'en' ? 'Medical Checkup Expiry' : 'Visite Médicale'}</label>
                  <input
                    type="date"
                    value={driverForm.medicalExamExpiryDate}
                    onChange={(e) => setDriverForm({ ...driverForm, medicalExamExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewDriverModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 cursor-pointer"
                >
                  {lang === 'en' ? 'Create Driver' : 'Créer Chauffeur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals Partagés (Modification, Suppression, Visualisation) */}
      {renderSharedModals()}
    </div>
  );
};
