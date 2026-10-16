/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Parc Automobile & Gestion de Flotte
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { Vehicle, VehicleCategory, VehicleStatus, UserRole } from '../../packages/shared-types/index.ts';
import { formatXAF, hasPermission } from '../../packages/business-rules/index.ts';
import { VehicleSchema } from '../../packages/validation/index.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { summarizeText } from '../services/textUtils.ts';
import {
  Car,
  Search,
  Filter,
  Plus,
  Wrench,
  KeyRound,
  ShieldAlert,
  Fuel,
  Gauge,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Pencil,
  Trash2,
  Share2,
  Activity,
  FileText,
  Printer,
  Clock,
  ArrowRight,
  Check,
} from 'lucide-react';
import { AppModule } from '../../packages/shared-types/index.ts';

interface VehiclesViewProps {
  state: DatabaseState;
  lang: Language;
  currentUserRole: UserRole;
  onOpenShowroom: (vehicle: Vehicle) => void;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextVehicleId?: string | null;
  contextEntityId?: string | null;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  state,
  lang,
  currentUserRole,
  onOpenShowroom,
  onNavigate,
  contextVehicleId,
  contextEntityId,
}) => {
  const t = translations[lang];
  const isEn = lang === 'en';
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDetailTab, setVehicleDetailTab] = useState<'SPECS' | 'HEALTH' | 'RENTALS' | 'SALES'>('SPECS');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirmVehicle, setDeleteConfirmVehicle] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-sélection si navigation contextuelle
  React.useEffect(() => {
    const targetId = contextEntityId || contextVehicleId;
    if (targetId) {
      const target = state.vehicles.find((v) => v.id === targetId);
      if (target) {
        onOpenShowroom(target);
      }
    }
  }, [contextEntityId, contextVehicleId, state.vehicles, onOpenShowroom]);

  const canAddVehicle = hasPermission(currentUserRole, 'vehicles', 'create');
  const canEditVehicle = hasPermission(currentUserRole, 'vehicles', 'update');
  const canDeleteVehicle = hasPermission(currentUserRole, 'vehicles', 'delete');

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle({ ...vehicle });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEditVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setFormError(null);

    const validation = VehicleSchema.safeParse(editingVehicle);
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Erreur de validation');
      return;
    }

    // Contrôle d'intégrité strict de la disponibilité
    if (editingVehicle.status === 'AVAILABLE') {
      const activeContract = state.contracts.find((c) => c.vehicleId === editingVehicle.id && c.status === 'ACTIVE');
      if (activeContract) {
        setFormError(`Impossible de passer en "AVAILABLE" : ce véhicule est sous contrat de location actif (${activeContract.contractNumber}).`);
        return;
      }
      const activeMnt = state.maintenance.find((m) => m.vehicleId === editingVehicle.id && m.status !== 'COMPLETED');
      if (activeMnt) {
        setFormError(`Impossible de passer en "AVAILABLE" : ce véhicule est actuellement immobilisé en maintenance (${activeMnt.recordNumber}). Clôturez d'abord l'intervention.`);
        return;
      }
    }

    const currentVeh = state.vehicles.find((v) => v.id === editingVehicle.id);
    if (currentVeh && currentVeh.status === 'SOLD' && editingVehicle.status !== 'SOLD') {
      setFormError('Ce véhicule a été vendu définitivement. Son statut ne peut plus être réinitialisé.');
      return;
    }

    try {
      dbStore.updateVehicle(editingVehicle.id, editingVehicle);
      setIsEditModalOpen(false);
      if (selectedVehicle?.id === editingVehicle.id) {
        setSelectedVehicle(editingVehicle);
      }
      setActionAlert({ type: 'success', message: `Véhicule ${editingVehicle.licensePlate} mis à jour avec succès.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleConfirmDelete = (reason: string) => {
    if (!deleteConfirmVehicle) return;
    try {
      const plate = deleteConfirmVehicle.licensePlate;
      dbStore.deleteVehicle(deleteConfirmVehicle.id, reason);
      setDeleteConfirmVehicle(null);
      if (selectedVehicle?.id === deleteConfirmVehicle.id) {
        setSelectedVehicle(null);
      }
      setActionAlert({ type: 'success', message: `Véhicule ${plate} supprimé et archivé dans le journal d'audit.` });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' });
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  // Form State for New Vehicle
  const [newVehicle, setNewVehicle] = useState({
    vin: '',
    licensePlate: '',
    brand: '',
    model: '',
    year: 2023,
    category: 'SUV' as VehicleCategory,
    transmission: 'AUTOMATIQUE' as const,
    fuel: 'DIESEL' as const,
    seats: 5,
    mileage: 25000,
    acquisitionCost: 25000000,
    rentalDailyRate: 65000,
    securityDepositRate: state.settings?.defaultDepositXAF || 250000,
    salePrice: 28000000,
    isForRent: true,
    isForSale: true,
    status: 'AVAILABLE' as VehicleStatus,
    currentLocation: 'Agence FCT Bonamoussadi',
    color: 'Noir Métallisé',
    photoUrls: [] as string[],
    nextTechnicalInspectionDate: '2027-01-01',
    insuranceExpiryDate: '2027-01-01',
  });

  // Filtering
  const filteredVehicles = state.vehicles.filter((v) => {
    const matchesSearch =
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      v.vin.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = VehicleSchema.safeParse(newVehicle);
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Erreur de validation');
      return;
    }

    try {
      dbStore.addVehicle(newVehicle);
      setIsAddModalOpen(false);
      // Reset form
      setNewVehicle({
        ...newVehicle,
        vin: '',
        licensePlate: '',
        brand: '',
        model: '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-emerald-600" />
            <span>{t.vehiclesPage.title} ({state.vehicles.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.vehiclesPage.subtitle}
          </p>
        </div>

        {canAddVehicle && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.vehiclesPage.addVehicleBtn}</span>
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
            className="cursor-pointer text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-black/5"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.vehiclesPage.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">{t.vehiclesPage.allCategories}</option>
            <option value="SUV">SUV</option>
            <option value="4X4">4X4 Tout-Terrain</option>
            <option value="BERLINE">Berline</option>
            <option value="PICKUP">Pick-up Double Cabine</option>
            <option value="LUXE">Luxe / VIP</option>
            <option value="UTILITAIRE">Utilitaire</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none cursor-pointer"
        >
          <option value="ALL">{t.vehiclesPage.allStatuses}</option>
          <option value="AVAILABLE">{t.vehicleStatus.AVAILABLE}</option>
          <option value="RENTED">{t.vehicleStatus.RENTED}</option>
          <option value="MAINTENANCE">{t.vehicleStatus.MAINTENANCE}</option>
          <option value="RESERVED">{t.vehicleStatus.RESERVED}</option>
          <option value="SOLD">{t.vehicleStatus.SOLD}</option>
        </select>

        {/* Toggle Cartes / Tableau */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'en' ? 'Cards' : 'Cartes'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-[#0f2a4a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'en' ? 'Table' : 'Tableau'}
          </button>
        </div>
      </div>

      {/* Vehicles Grid Cards */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">{t.vehiclesPage.emptyVehiclesTitle}</h3>
          <p className="text-xs text-slate-500 mt-1">{t.vehiclesPage.emptyVehiclesDesc}</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => onOpenShowroom(vehicle)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between group"
            >
            {/* Vehicle Image & Badges */}
            <div className="relative h-44 bg-slate-900 overflow-hidden flex items-center justify-center">
              {vehicle.photoUrls && vehicle.photoUrls[0] ? (
                <img
                  src={vehicle.photoUrls[0]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center select-none">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Car className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">{vehicle.brand} {vehicle.model}</span>
                  <span className="text-[10px] text-slate-400 font-medium">FCT Automobile Douala</span>
                </div>
              )}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-blue-900/90 text-white font-bold text-[10px] tracking-wide uppercase">
                  {vehicle.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-semibold text-[10px]">
                  {vehicle.year}
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] shadow-sm ${
                    vehicle.status === 'AVAILABLE'
                      ? 'bg-emerald-500 text-white'
                      : vehicle.status === 'RENTED'
                      ? 'bg-blue-600 text-white'
                      : vehicle.status === 'MAINTENANCE'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {t.vehicleStatus[vehicle.status]}
                </span>
              </div>

              {/* License Plate Banner and Quick Action Buttons */}
              <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                <div className="bg-white/95 px-2.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-xs text-slate-900 shadow">
                  {vehicle.licensePlate}
                </div>
                <div className="flex items-center gap-1">
                  {canEditVehicle && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(vehicle);
                      }}
                      title={t.vehiclesPage.editVehicle}
                      className="p-1 rounded bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 shadow-sm transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDeleteVehicle && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmVehicle(vehicle);
                      }}
                      title={t.vehiclesPage.deleteVehicle}
                      className="p-1 rounded bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-sm transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Content */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span>{vehicle.currentLocation}</span>
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-blue-500" />
                    <span>{vehicle.fuel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                    <span>{vehicle.transmission}</span>
                  </div>
                </div>
              </div>

              {/* Pricing & Showroom CTA */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {t.showroom.dailyRate}
                    </div>
                    <div className="font-black text-emerald-700 text-sm privacy-blur">
                      {formatXAF(vehicle.rentalDailyRate)}
                    </div>
                  </div>

                  {vehicle.isForSale && (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {t.showroom.salePrice}
                      </div>
                      <div className="font-bold text-blue-900 text-xs privacy-blur">
                        {formatXAF(vehicle.salePrice)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Showroom Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShowroom(vehicle);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#0f2a4a] hover:bg-[#163b65] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-300" />
                  <span>{t.vehiclesPage.showroomShareBtn}</span>
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW POUR LE PARC AUTOMOBILE */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-xs text-left">
              <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">{lang === 'en' ? 'Vehicle' : 'Véhicule'}</th>
                  <th className="py-3 px-4">{lang === 'en' ? 'Plate' : 'Immatriculation'}</th>
                  <th className="py-3 px-4">{lang === 'en' ? 'Category' : 'Catégorie'}</th>
                  <th className="py-3 px-4">{lang === 'en' ? 'Mileage' : 'Kilométrage'}</th>
                  <th className="py-3 px-4 text-right">{lang === 'en' ? 'Daily Rate' : 'Tarif / Jour'}</th>
                  <th className="py-3 px-4 text-center">{t.status}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    onClick={() => onOpenShowroom(vehicle)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                          {vehicle.photoUrls && vehicle.photoUrls[0] ? (
                            <img
                              src={vehicle.photoUrls[0]}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Année {vehicle.year} • {vehicle.fuel || 'Essence'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {vehicle.licensePlate}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[10px]">
                        {vehicle.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {vehicle.mileage.toLocaleString()} km
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-emerald-700 whitespace-nowrap privacy-blur">
                      {formatXAF(vehicle.rentalDailyRate)}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          vehicle.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : vehicle.status === 'RENTED'
                            ? 'bg-blue-100 text-blue-800'
                            : vehicle.status === 'MAINTENANCE'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.vehicleStatus[vehicle.status]}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onOpenShowroom(vehicle)}
                        title="Ouvrir Fiche Showroom"
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canEditVehicle && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(vehicle)}
                          title={t.vehiclesPage.editVehicle}
                          className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteVehicle && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmVehicle(vehicle)}
                          title={t.vehiclesPage.deleteVehicle}
                          className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 inline-flex items-center transition cursor-pointer"
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

      {/* Add Vehicle Modal with Zod Validation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-600" />
                <span>{t.vehiclesPage.newVehicleModalTitle}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.brandLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Toyota, Mercedes-Benz"
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.modelLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Land Cruiser Prado TX"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.licensePlateLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: LT-4589-AB"
                    value={newVehicle.licensePlate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.vinLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? '17 characters' : '17 caractères'}
                    value={newVehicle.vin}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.yearLabel}</label>
                  <input
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || 2023 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.categoryLabel}</label>
                  <select
                    value={newVehicle.category}
                    onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="SUV">SUV</option>
                    <option value="4X4">4X4</option>
                    <option value="BERLINE">Berline</option>
                    <option value="PICKUP">Pick-up</option>
                    <option value="LUXE">Luxe / VIP</option>
                    <option value="UTILITAIRE">Utilitaire</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.transmissionLabel}</label>
                  <select
                    value={newVehicle.transmission}
                    onChange={(e) => setNewVehicle({ ...newVehicle, transmission: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="AUTOMATIQUE">Automatique</option>
                    <option value="MANUELLE">Manuelle</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.fuelLabel}</label>
                  <select
                    value={newVehicle.fuel}
                    onChange={(e) => setNewVehicle({ ...newVehicle, fuel: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="ESSENCE">Essence</option>
                    <option value="HYBRIDE">Hybride</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.dailyRateLabel}</label>
                  <input
                    type="number"
                    required
                    value={newVehicle.rentalDailyRate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, rentalDailyRate: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.depositRateLabel}</label>
                  <input
                    type="number"
                    required
                    value={newVehicle.securityDepositRate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, securityDepositRate: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.salePriceLabel}</label>
                  <input
                    type="number"
                    value={newVehicle.salePrice}
                    onChange={(e) => setNewVehicle({ ...newVehicle, salePrice: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              {/* Photo Upload & Gallery */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{t.vehiclesPage.photoDropzoneLabel}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {newVehicle.photoUrls.length} photo(s)
                  </span>
                </div>
                {newVehicle.photoUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {newVehicle.photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-300 shrink-0 group">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewVehicle({ ...newVehicle, photoUrls: newVehicle.photoUrls.filter((_, i) => i !== idx) })}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <CloudinaryUploadDropzone
                  folder="fct_automobile/vehicles"
                  label={t.vehiclesPage.photoDropzoneLabel}
                  helperText={t.vehiclesPage.photoDropzoneHelper}
                  accept="image/*"
                  onUploadSuccess={(url) => {
                    setNewVehicle((prev) => ({ ...prev, photoUrls: [...prev.photoUrls, url] }));
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow"
                >
                  {t.vehiclesPage.saveVehicleBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {isEditModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <span>{t.vehiclesPage.editVehicleModalTitle} {editingVehicle.licensePlate}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.brandLabel}</label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.brand}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, brand: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.modelLabel}</label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.model}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.licensePlateLabel}</label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.licensePlate}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, licensePlate: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.yearLabel}</label>
                  <input
                    type="number"
                    value={editingVehicle.year}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, year: parseInt(e.target.value) || 2023 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{lang === 'en' ? 'Fleet Status' : 'Statut Flotte'}</label>
                  <select
                    value={editingVehicle.status}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300 font-semibold"
                  >
                    <option value="AVAILABLE">{t.vehicleStatus.AVAILABLE}</option>
                    <option value="RENTED">{t.vehicleStatus.RENTED}</option>
                    <option value="MAINTENANCE">{t.vehicleStatus.MAINTENANCE}</option>
                    <option value="RESERVED">{t.vehicleStatus.RESERVED}</option>
                    <option value="SOLD">{t.vehicleStatus.SOLD}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.categoryLabel}</label>
                  <select
                    value={editingVehicle.category}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, category: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="SUV">SUV</option>
                    <option value="4X4">4X4</option>
                    <option value="BERLINE">Berline</option>
                    <option value="PICKUP">Pick-up</option>
                    <option value="LUXE">Luxe / VIP</option>
                    <option value="UTILITAIRE">Utilitaire</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.transmissionLabel}</label>
                  <select
                    value={editingVehicle.transmission}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, transmission: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="AUTOMATIQUE">Automatique</option>
                    <option value="MANUELLE">Manuelle</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.fuelLabel}</label>
                  <select
                    value={editingVehicle.fuel}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, fuel: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="ESSENCE">Essence</option>
                    <option value="HYBRIDE">Hybride</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.mileageLabel}</label>
                  <input
                    type="number"
                    value={editingVehicle.mileage}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, mileage: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.dailyRateLabel}</label>
                  <input
                    type="number"
                    value={editingVehicle.rentalDailyRate}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, rentalDailyRate: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.depositRateLabel}</label>
                  <input
                    type="number"
                    value={editingVehicle.securityDepositRate}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, securityDepositRate: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.locationLabel}</label>
                  <input
                    type="text"
                    value={editingVehicle.currentLocation}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, currentLocation: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.vehiclesPage.colorLabel}</label>
                  <input
                    type="text"
                    value={editingVehicle.color}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, color: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              {/* Photo Upload & Gallery for Edit */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{t.vehiclesPage.photoDropzoneLabel}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {(editingVehicle.photoUrls || []).length} photo(s)
                  </span>
                </div>
                {(editingVehicle.photoUrls || []).length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(editingVehicle.photoUrls || []).map((url, idx) => (
                      <div key={idx} className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-300 shrink-0 group">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingVehicle({
                            ...editingVehicle,
                            photoUrls: (editingVehicle.photoUrls || []).filter((_, i) => i !== idx)
                          })}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <CloudinaryUploadDropzone
                  folder="fct_automobile/vehicles"
                  label={t.vehiclesPage.photoDropzoneLabel}
                  helperText={t.vehiclesPage.photoDropzoneHelper}
                  accept="image/*"
                  onUploadSuccess={(url) => {
                    setEditingVehicle((prev) => prev ? {
                      ...prev,
                      photoUrls: [...(prev.photoUrls || []), url]
                    } : prev);
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow"
                >
                  {t.vehiclesPage.saveChangesBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Audit Trail */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmVehicle}
        title={isEn ? 'Remove Vehicle from Fleet' : 'Supprimer un Véhicule du Parc'}
        itemName={deleteConfirmVehicle ? `${deleteConfirmVehicle.brand} ${deleteConfirmVehicle.model}` : ''}
        itemDetails={deleteConfirmVehicle ? `${isEn ? 'Plate:' : 'Immatriculation :'} ${deleteConfirmVehicle.licensePlate} | VIN : ${deleteConfirmVehicle.vin}` : undefined}
        warningMessage={isEn ? 'Warning: this action will permanently remove this vehicle from the fleet and log it in the audit trail. Vehicles with active rental contracts cannot be deleted.' : "Attention : cette action retirera définitivement ce véhicule du parc automobile et l'enregistrera dans le journal d'audit. Les véhicules avec contrat de location actif ne peuvent pas être supprimés."}
        requireReason={true}
        onClose={() => setDeleteConfirmVehicle(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
