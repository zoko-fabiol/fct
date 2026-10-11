import React, { useState } from 'react';
import { X, Search, Loader2, Wrench, ShieldCheck, Calendar, Gauge, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchVehicleHealthHistory, VehicleHealthPassport } from '../services/healthService.ts';
import { formatDateFR } from '../utils/date.ts';
import { useToast } from './Toast.tsx';

export const HealthPassportModal: React.FC<{ onClose: () => void; initialPlate?: string }> = ({
  onClose,
  initialPlate = '',
}) => {
  const toast = useToast();
  const [plateInput, setPlateInput] = useState(initialPlate);
  const [loading, setLoading] = useState(false);
  const [passport, setPassport] = useState<VehicleHealthPassport | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateInput.trim() || loading) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetchVehicleHealthHistory(plateInput);
      setPassport(res);
      if (!res) {
        toast('error', `Aucun carnet de santé trouvé pour l'immatriculation "${plateInput.trim().toUpperCase()}".`);
      } else {
        toast('success', `Passeport santé certifié FCT trouvé pour ${res.brand} ${res.model}.`);
      }
    } catch (err) {
      console.error('[HealthPassport] Erreur recherche :', err);
      toast('error', 'Impossible de récupérer le carnet de santé. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="luxury-glass rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-white">Carnet de Santé Numérique FCT</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Historique d’entretien, révisions mécaniques et traçabilité officielle
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire de recherche par plaque */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value)}
              placeholder="Ex: LT-8841-CE ou numéro d'immatriculation"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 uppercase font-mono tracking-wider font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Consulter</span>
          </button>
        </form>

        {/* Résultat de santé */}
        {passport && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
                  Certifié Garage FCT Douala
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-1">
                  {passport.brand} {passport.model}
                </h3>
                <p className="text-xs text-slate-400 font-mono">Plaque : {passport.licensePlate}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Kilométrage relevé</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    {passport.currentMileage.toLocaleString('fr-FR')} km
                  </span>
                </div>
                {passport.lastServiceDate && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Dernière révision</span>
                    <span className="font-bold text-white text-xs">{formatDateFR(passport.lastServiceDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Liste chronologique des révisions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Interventions & Révisions Enregistrées ({passport.records.length})</span>
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {passport.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold text-white">{rec.typeLabel}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({rec.recordNumber})</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{rec.description}</p>
                      <p className="text-[10px] text-slate-400">Atelier : {rec.garageName}</p>
                    </div>
                    <div className="text-right whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      <div>{formatDateFR(rec.date)}</div>
                      <div className="text-amber-400 font-bold">{rec.mileage.toLocaleString('fr-FR')} km</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasSearched && !passport && !loading && (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-semibold">Aucun historique d'entretien disponible</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Ce véhicule n'est pas encore enregistré dans le garage FCT ou l'immatriculation est incorrecte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
