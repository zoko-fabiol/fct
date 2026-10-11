import React, { useMemo, useState } from 'react';
import { X, Loader2, CalendarDays, ShieldCheck, UserRound } from 'lucide-react';
import { PublicVehicle } from '../services/vehicleService.ts';
import { createRentalBooking, submitPurchaseInquiry } from '../services/bookingService.ts';
import { calculateRentalTotal, formatXAF } from '../utils/currency.ts';
import { getTodayDateString, getDefaultReturnDateString } from '../utils/date.ts';
import { useToast } from './Toast.tsx';

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition';
const labelCls = 'block text-xs font-semibold text-slate-300 mb-1.5';

const ModalShell: React.FC<{ title: string; subtitle: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  subtitle,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
    <div className="luxury-glass rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl my-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/* ------------------------------ Réservation ------------------------------ */
export const BookingModal: React.FC<{ vehicle: PublicVehicle; onClose: () => void; defaultName?: string; defaultEmail?: string }> = ({
  vehicle,
  onClose,
  defaultName = '',
  defaultEmail = '',
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: defaultName,
    customerPhone: '+237 ',
    customerEmail: defaultEmail,
    startDate: getTodayDateString(),
    endDate: getDefaultReturnDateString(3),
    withDriver: false,
    notes: '',
  });

  const calc = useMemo(
    () => calculateRentalTotal(vehicle.rentalDailyRate, form.startDate, form.endDate, form.withDriver),
    [vehicle.rentalDailyRate, form.startDate, form.endDate, form.withDriver]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const receipt = await createRentalBooking(vehicle, { ...form, notes: form.notes || undefined });
      toast(
        'success',
        `Demande envoyée (${receipt.days} jour(s), estimation ${formatXAF(receipt.estimatedTotalXAF)}). Un conseiller FCT vous contactera pour confirmer.`
      );
      onClose();
    } catch (err) {
      console.error('[FCT Website] Échec de la réservation :', err);
      toast('error', err instanceof Error ? err.message : "La demande n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={`Réserver ${vehicle.brand} ${vehicle.model}`} subtitle="Demande soumise à validation par l'agence FCT Douala" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="bk-start">Départ</label>
            <input id="bk-start" type="date" required min={getTodayDateString()} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="bk-end">Retour</label>
            <input id="bk-end" type="date" required min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="bk-name">Nom complet</label>
          <input id="bk-name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={inputCls} placeholder="Votre nom complet" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="bk-phone">Téléphone</label>
            <input id="bk-phone" type="tel" required value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="bk-email">E-mail</label>
            <input id="bk-email" type="email" required value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className={inputCls} placeholder="vous@exemple.com" />
          </div>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/10 cursor-pointer">
          <input type="checkbox" checked={form.withDriver} onChange={(e) => setForm({ ...form, withDriver: e.target.checked })} className="w-4 h-4 accent-amber-500" />
          <UserRound className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-200">Avec chauffeur FCT (+15 000 FCFA / jour)</span>
        </label>

        <div>
          <label className={labelCls} htmlFor="bk-notes">Message (optionnel)</label>
          <textarea id="bk-notes" rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Heure de prise en charge, destination…" />
        </div>

        <div className="rounded-2xl bg-slate-900/70 border border-amber-500/20 p-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300"><span>Durée</span><span className="font-bold">{calc.days} jour(s)</span></div>
          <div className="flex justify-between text-slate-300"><span>Véhicule</span><span>{formatXAF(calc.vehicleTotal)}</span></div>
          {form.withDriver && <div className="flex justify-between text-slate-300"><span>Chauffeur</span><span>{formatXAF(calc.driverTotal)}</span></div>}
          <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-extrabold text-amber-400"><span>Estimation totale</span><span>{formatXAF(calc.grandTotal)}</span></div>
          <div className="flex items-center gap-2 text-slate-400 pt-1"><ShieldCheck className="w-3.5 h-3.5" />Caution à prévoir à la remise : {formatXAF(vehicle.securityDepositRate)}</div>
        </div>

        <button type="submit" disabled={submitting} className="gold-gradient-btn w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
          {submitting ? 'Envoi en cours…' : 'Envoyer ma demande de réservation'}
        </button>
      </form>
    </ModalShell>
  );
};

/* ------------------------------ Achat ------------------------------ */
export const PurchaseModal: React.FC<{ vehicle: PublicVehicle; onClose: () => void; defaultName?: string; defaultEmail?: string }> = ({
  vehicle,
  onClose,
  defaultName = '',
  defaultEmail = '',
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: defaultName,
    phone: '+237 ',
    email: defaultEmail,
    financingNeeded: false,
    notes: '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitPurchaseInquiry(vehicle, { ...form, notes: form.notes || undefined });
      toast('success', 'Votre demande a bien été transmise. Un conseiller commercial FCT vous recontactera très prochainement.');
      onClose();
    } catch (err) {
      console.error("[FCT Website] Échec de la demande d'achat :", err);
      toast('error', err instanceof Error ? err.message : "La demande n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={`${vehicle.brand} ${vehicle.model}`} subtitle={`Demande d'information & d'acquisition · ${formatXAF(vehicle.salePrice)}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="pr-name">Nom complet</label>
          <input id="pr-name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} placeholder="Votre nom complet" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="pr-phone">Téléphone</label>
            <input id="pr-phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pr-email">E-mail</label>
            <input id="pr-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="vous@exemple.com" />
          </div>
        </div>
        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/10 cursor-pointer">
          <input type="checkbox" checked={form.financingNeeded} onChange={(e) => setForm({ ...form, financingNeeded: e.target.checked })} className="w-4 h-4 accent-amber-500" />
          <span className="text-xs text-slate-200">Je souhaite étudier une solution de financement</span>
        </label>
        <div>
          <label className={labelCls} htmlFor="pr-notes">Message (optionnel)</label>
          <textarea id="pr-notes" rows={3} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Souhaitez-vous un essai, une reprise, une visite au showroom ?" />
        </div>
        <button type="submit" disabled={submitting} className="gold-gradient-btn w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
        </button>
      </form>
    </ModalShell>
  );
};
