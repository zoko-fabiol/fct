import React, { useState } from 'react';
import { Car, Fuel, Gauge, Settings2, Users, CalendarDays, ShoppingBag } from 'lucide-react';
import { PublicVehicle } from '../services/vehicleService.ts';
import { formatXAF } from '../utils/currency.ts';

interface VehicleCardProps {
  vehicle: PublicVehicle;
  mode: 'rent' | 'sale';
  onAction: (vehicle: PublicVehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, mode, onAction }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = vehicle.photoUrls || [];
  const hasPhoto = photos.length > 0;
  const isRent = mode === 'rent';

  return (
    <article className="luxury-card overflow-hidden flex flex-col" id={`vehicle-${vehicle.id}`}>
      <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden group">
        {hasPhoto ? (
          <img
            src={photos[photoIndex]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500">
            <Car className="w-12 h-12" />
            <span className="text-xs font-semibold tracking-wide uppercase">Photos bientôt disponibles</span>
          </div>
        )}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-amber-400 border border-amber-500/30 backdrop-blur">
          {vehicle.category}
        </span>
        {vehicle.conditionGrade && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur">
            {vehicle.conditionGrade}
          </span>
        )}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === photoIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div>
          <h3 className="font-display text-xl font-bold text-white leading-tight">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {vehicle.year} · {vehicle.color} · {vehicle.currentLocation}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <span className="flex items-center gap-2"><Settings2 className="w-3.5 h-3.5 text-amber-400" />{vehicle.transmission === 'AUTOMATIQUE' ? 'Automatique' : 'Manuelle'}</span>
          <span className="flex items-center gap-2"><Fuel className="w-3.5 h-3.5 text-amber-400" />{vehicle.fuel}</span>
          <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-amber-400" />{vehicle.seats} places</span>
          <span className="flex items-center gap-2"><Gauge className="w-3.5 h-3.5 text-amber-400" />{vehicle.mileage.toLocaleString('fr-FR')} km</span>
        </div>

        {vehicle.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{vehicle.description}</p>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              {isRent ? 'Tarif journalier' : 'Prix de vente'}
            </p>
            <p className="font-display text-lg font-extrabold gold-gradient-text">
              {formatXAF(isRent ? vehicle.rentalDailyRate : vehicle.salePrice)}
              {isRent && <span className="text-[11px] font-medium text-slate-400"> / jour</span>}
            </p>
            {isRent && (
              <p className="text-[10px] text-slate-500">Caution : {formatXAF(vehicle.securityDepositRate)}</p>
            )}
          </div>
          <button
            onClick={() => onAction(vehicle)}
            id={`action-${mode}-${vehicle.id}`}
            className="gold-gradient-btn px-4 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
          >
            {isRent ? <CalendarDays className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            {isRent ? 'Réserver' : 'Je suis intéressé'}
          </button>
        </div>
      </div>
    </article>
  );
};
