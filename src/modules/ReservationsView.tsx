/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Réservations Centralisées & Conversion Contrats
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useEffect } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language } from '../services/i18n.ts';
import { Reservation, AppModule } from '../../packages/shared-types/index.ts';
import { formatXAF, calculateRentalDays, checkVehicleAvailability } from '../../packages/business-rules/index.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
import { exportCollectionToExcel } from '../utils/excelExport.ts';
import {
  CalendarCheck2,
  Plus,
  ArrowRightCircle,
  X,
  Pencil,
  Ban,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Car,
  User,
  Banknote,
  ExternalLink,
  ShieldAlert,
  Clock,
  KeyRound,
} from 'lucide-react';

interface ReservationsViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
  contextReservationId?: string | null;
  contextEntityId?: string | null;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  state,
  lang,
  onNavigate,
  contextReservationId,
  contextEntityId,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingRes, setConvertingRes] = useState<Reservation | null>(null);
  const [driverIncluded, setDriverIncluded] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [cancelConfirmRes, setCancelConfirmRes] = useState<Reservation | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // New Reservation Form
  const [resForm, setResForm] = useState({
    customerId: state.customers[0]?.id || '',
    vehicleId: state.vehicles[0]?.id || '',
    startDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    advanceDepositXAF: 100000,
    source: 'WALK_IN' as Reservation['source'],
    notes: 'Demande client agence Santa Barbara',
  });

  // Calculate estimated total based on real rental days
  const selectedVehicle = state.vehicles.find((v) => v.id === resForm.vehicleId);
  const rentalDays = calculateRentalDays(resForm.startDate, resForm.endDate);
  const estimatedTotal = (selectedVehicle?.rentalDailyRate || 0) * rentalDays;

  // Auto-focus context reservation or prefill from customer/vehicle
  useEffect(() => {
    const targetId = contextEntityId || contextReservationId;
    if (targetId) {
      // 1. Is it a Customer ID? (e.g. from CRM "Nouvelle Réservation")
      const cust = state.customers.find((c) => c.id === targetId);
      if (cust) {
        setResForm((prev) => ({
          ...prev,
          customerId: cust.id,
        }));
        setIsNewModalOpen(true);
        return;
      }

      // 2. Is it a Vehicle ID? (e.g. from Showroom "Réserver ce véhicule")
      const veh = state.vehicles.find((v) => v.id === targetId);
      if (veh) {
        setResForm((prev) => ({
          ...prev,
          vehicleId: veh.id,
        }));
        setIsNewModalOpen(true);
        return;
      }

      // 3. Is it a Reservation ID?
      const target = state.reservations.find((r) => r.id === targetId);
      if (target) {
        setSearch(target.reservationNumber);
        return;
      }
    }
  }, [contextEntityId, contextReservationId, state.customers, state.vehicles, state.reservations]);

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const customer = state.customers.find((c) => c.id === resForm.customerId);
    const vehicle = state.vehicles.find((v) => v.id === resForm.vehicleId);
    if (!customer || !vehicle) return;

    try {
      const newRes = dbStore.addReservation({
        customerId: customer.id,
        customerName: customer.companyName || customer.fullName,
        customerPhone: customer.phone,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
        startDate: resForm.startDate,
        endDate: resForm.endDate,
        estimatedTotalXAF: estimatedTotal,
        advanceDepositXAF: resForm.advanceDepositXAF,
        status: 'CONFIRMED',
        source: resForm.source,
        notes: resForm.notes,
      });

      setIsNewModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Réservation ${newRes.reservationNumber} confirmée avec succès (${rentalDays} jours, total: ${formatXAF(estimatedTotal)}).`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la réservation');
    }
  };

  // Convert Reservation into Official Rental Contract
  const handleOpenConvert = (res: Reservation) => {
    setConvertingRes(res);
    setDriverIncluded(false);
    setSelectedDriverId(state.drivers.find((d) => d.status === 'AVAILABLE')?.id || '');
    setFormError(null);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = () => {
    if (!convertingRes) return;
    try {
      const contract = dbStore.convertReservationToContract(convertingRes.id, {
        driverIncluded,
        driverId: driverIncluded ? selectedDriverId : undefined,
      });

      setIsConvertModalOpen(false);
      setConvertingRes(null);
      setActionAlert({
        type: 'success',
        message: `Réservation convertie avec succès en Contrat ${contract.contractNumber}. Véhicule ${contract.licensePlate} placé en location active. Acompte de ${formatXAF(contract.paidAmountXAF)} reporté sans double comptage.`,
      });
      setTimeout(() => setActionAlert(null), 6000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la conversion');
    }
  };

  const handleConfirmCancel = (reason: string) => {
    if (!cancelConfirmRes) return;
    try {
      const num = cancelConfirmRes.reservationNumber;
      dbStore.cancelReservation(cancelConfirmRes.id, reason);
      setCancelConfirmRes(null);
      setActionAlert({
        type: 'success',
        message: `Réservation ${num} annulée avec succès. Le véhicule est libéré sur cette période.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Erreur lors de l\'annulation' });
    }
  };

  const filteredReservations = state.reservations.filter((res) => {
    const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
    const matchesSearch =
      res.reservationNumber.toLowerCase().includes(search.toLowerCase()) ||
      res.customerName.toLowerCase().includes(search.toLowerCase()) ||
      res.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
      res.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      (res.notes && res.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-emerald-600" />
            <span>Réservations Centralisées &amp; Planning</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prises de commande (Agence, WhatsApp, Téléphone, Web), contrôle anti-chevauchement et conversion en contrats
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportCollectionToExcel({
                filename: `FCT_Reservations_${new Date().toISOString().split('T')[0]}`,
                sheetName: 'Réservations',
                title: 'FCT AUTOMOBILE DOUALA — PLANNING DES RÉSERVATIONS',
                subtitle: `Exporté le ${new Date().toLocaleDateString('fr-FR')} • ${filteredReservations.length} réservation(s)`,
                columns: [
                  { header: 'N° Réservation', key: 'reservationNumber', width: 16 },
                  { header: 'Client', key: 'customerName', width: 26 },
                  { header: 'Téléphone', key: 'customerPhone', width: 18 },
                  { header: 'Véhicule', key: 'vehicleName', width: 28 },
                  { header: 'Début', key: 'startDate', width: 14 },
                  { header: 'Fin', key: 'endDate', width: 14 },
                  { header: 'Acompte (XAF)', key: 'advanceDepositXAF', width: 16 },
                  { header: 'Canal', key: 'source', width: 14 },
                  { header: 'Statut', key: 'status', width: 14 },
                  { header: 'Notes', key: 'notes', width: 30 },
                ],
                data: filteredReservations,
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f2a4a] hover:bg-[#163a66] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exporter Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Réservation</span>
          </button>
        </div>
      </div>

      {/* Action Alerts */}
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

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro de réservation (RES), client, téléphone, véhicule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'CONFIRMED', 'PENDING', 'CONVERTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === st ? 'bg-blue-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'Toutes'
                : st === 'CONFIRMED'
                ? 'Confirmées'
                : st === 'PENDING'
                ? 'En attente'
                : st === 'CONVERTED'
                ? 'Converties en Contrat'
                : 'Annulées'}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-xs text-left">
            <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">N° Réservation</th>
                <th className="py-3 px-4">Client &amp; Contact</th>
                <th className="py-3 px-4">Véhicule Réservé</th>
                <th className="py-3 px-4">Période Prévue</th>
                <th className="py-3 px-4 text-center">Canal</th>
                <th className="py-3 px-4 text-right">Acompte Consigné</th>
                <th className="py-3 px-4 text-right">Total Estimé</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                    Aucune réservation ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => {
                  const isConverted = res.status === 'CONVERTED';
                  const isCancelled = res.status === 'CANCELLED';

                  return (
                    <tr key={res.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{res.reservationNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{res.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{res.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{res.vehicleName}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {res.startDate} au {res.endDate}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {calculateRentalDays(res.startDate, res.endDate)} jour(s)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {res.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 whitespace-nowrap">
                        {formatXAF(res.advanceDepositXAF)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatXAF(res.estimatedTotalXAF)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConverted
                              ? 'bg-purple-100 text-purple-800'
                              : res.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isConverted ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isCancelled ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {isConverted ? 'Convertie en Contrat' : res.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {!isConverted && !isCancelled && (
                          <button
                            onClick={() => handleOpenConvert(res)}
                            title="Convertir directement en contrat de location officiel"
                            className="px-2.5 py-1 rounded bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs transition"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Convertir</span>
                          </button>
                        )}

                        {isConverted && res.convertedContractId && onNavigate && (
                          <button
                            onClick={() => onNavigate('rentals', res.convertedContractId)}
                            title="Ouvrir le contrat généré"
                            className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Voir Contrat</span>
                          </button>
                        )}

                        {!isConverted && !isCancelled && (
                          <button
                            onClick={() => setCancelConfirmRes(res)}
                            title="Annuler la réservation"
                            className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 transition"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Annuler</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert to Contract Modal */}
      {isConvertModalOpen && convertingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-900" />
                <span>Conversion en Contrat : {convertingRes.reservationNumber}</span>
              </h3>
              <button onClick={() => setIsConvertModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div><strong>Client :</strong> {convertingRes.customerName}</div>
              <div><strong>Véhicule :</strong> {convertingRes.vehicleName}</div>
              <div><strong>Période :</strong> {convertingRes.startDate} au {convertingRes.endDate}</div>
              <div>
                <strong>Acompte consigné reporté :</strong>{' '}
                <span className="font-bold text-emerald-700">{formatXAF(convertingRes.advanceDepositXAF)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={driverIncluded}
                  onChange={(e) => setDriverIncluded(e.target.checked)}
                  className="rounded text-blue-900 w-4 h-4 cursor-pointer"
                />
                <span>Mise à disposition d'un chauffeur professionnel FCT</span>
              </label>

              {driverIncluded && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Affecter un chauffeur :</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-xs"
                  >
                    {state.drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="px-4 py-2 rounded bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                className="px-5 py-2 rounded bg-blue-900 hover:bg-blue-800 text-white font-bold cursor-pointer shadow transition"
              >
                Émettre le Contrat Officiel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-800 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Enregistrer une Nouvelle Réservation</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReservation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client *</label>
                <select
                  value={resForm.customerId}
                  onChange={(e) => setResForm({ ...resForm, customerId: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 font-semibold"
                >
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.fullName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Véhicule souhaité *</label>
                <select
                  value={resForm.vehicleId}
                  onChange={(e) => setResForm({ ...resForm, vehicleId: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 font-semibold"
                >
                  {state.vehicles
                    .filter((v) => v.status !== 'SOLD')
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.licensePlate} — {v.brand} {v.model} ({formatXAF(v.rentalDailyRate)}/jour) [{v.status}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date de début *</label>
                  <input
                    type="date"
                    required
                    value={resForm.startDate}
                    onChange={(e) => setResForm({ ...resForm, startDate: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date de restitution prévue *</label>
                  <input
                    type="date"
                    required
                    value={resForm.endDate}
                    onChange={(e) => setResForm({ ...resForm, endDate: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Acompte versé en espèces (XAF) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={resForm.advanceDepositXAF}
                    onChange={(e) => setResForm({ ...resForm, advanceDepositXAF: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded border border-slate-300 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Canal de réservation</label>
                  <select
                    value={resForm.source}
                    onChange={(e) => setResForm({ ...resForm, source: e.target.value as any })}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="WALK_IN">Agence Bonamoussadi (Sur place)</option>
                    <option value="WHATSAPP">WhatsApp Business</option>
                    <option value="PHONE">Appel Téléphonique</option>
                    <option value="WEBSITE">Site Web Public FCT</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Estimated Total Calculation */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-blue-700 font-bold uppercase">Durée &amp; Montant Estimé</div>
                  <div className="text-xs text-blue-900 font-semibold">{rentalDays} jour(s) de location</div>
                </div>
                <div className="text-base font-black text-blue-950">{formatXAF(estimatedTotal)}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes et demandes particulières</label>
                <textarea
                  rows={2}
                  value={resForm.notes}
                  onChange={(e) => setResForm({ ...resForm, notes: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 rounded font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow transition cursor-pointer"
                >
                  Valider la Réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Annulation Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!cancelConfirmRes}
        title="Annuler une Réservation"
        itemName={cancelConfirmRes ? `${cancelConfirmRes.reservationNumber} (${cancelConfirmRes.customerName})` : ''}
        itemDetails={
          cancelConfirmRes
            ? `Véhicule : ${cancelConfirmRes.vehicleName} — Période : ${cancelConfirmRes.startDate} au ${cancelConfirmRes.endDate}`
            : undefined
        }
        warningMessage="Le statut de la réservation passera à ANNULÉE. Le véhicule redeviendra immédiatement disponible sur cette période dans le planning FCT."
        requireReason={true}
        confirmLabel="Confirmer l'Annulation"
        onClose={() => setCancelConfirmRes(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};
