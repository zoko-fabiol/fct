import React from 'react';
import { Settings2, Fuel, Users, Gauge, KeyRound, ShoppingBag, CheckCircle, ShieldCheck } from 'lucide-react';
import { Vehicle } from '../types/index.ts';
import { formatXAF } from '../utils/formatters.ts';

interface VehicleCardProps {
  vehicle: Vehicle;
  mode: 'rent' | 'sale';
  onSelect: (vehicle: Vehicle) => void;
  onOpenHealth?: (plate: string) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  mode,
  onSelect,
  onOpenHealth,
}) => {
  const isRent = mode === 'rent';
  const hasPhotos = vehicle.photoUrls && vehicle.photoUrls.length > 0;

  return (
    <article className="fct-card" id={`vehicle-${vehicle.id}`}>
      {/* Media Visual */}
      <div className="fct-card-media">
        {hasPhotos ? (
          <img
            src={vehicle.photoUrls[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            loading="lazy"
          />
        ) : (
          <div className="fct-media-placeholder">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.85 }}
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
            <span>{vehicle.brand} {vehicle.model}</span>
          </div>
        )}

        {/* Badges Overlays */}
        <span className="fct-badge-overlay-left">{vehicle.category}</span>
        {vehicle.conditionGrade && (
          <span className="fct-badge-overlay-right">
            {vehicle.conditionGrade}
          </span>
        )}
      </div>

      {/* Card Content Body */}
      <div className="fct-card-body">
        <div className="fct-card-header">
          <h3>
            {vehicle.brand} {vehicle.model}
          </h3>
          <div className="fct-card-meta">
            <span>{vehicle.year}</span>
            <span>•</span>
            <span>{vehicle.color}</span>
            <span>•</span>
            <span>{vehicle.currentLocation}</span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="fct-specs-grid">
          <div className="fct-spec-item">
            <Settings2 size={16} className="fct-spec-icon" />
            <span>{vehicle.transmission === 'AUTOMATIQUE' ? 'Automatique' : 'Manuelle'}</span>
          </div>
          <div className="fct-spec-item">
            <Fuel size={16} className="fct-spec-icon" />
            <span>{vehicle.fuel}</span>
          </div>
          <div className="fct-spec-item">
            <Users size={16} className="fct-spec-icon" />
            <span>{vehicle.seats} Places</span>
          </div>
          <div className="fct-spec-item">
            <Gauge size={16} className="fct-spec-icon" />
            <span>{vehicle.mileage.toLocaleString('fr-FR')} km</span>
          </div>
        </div>

        {/* Description Excerpt */}
        {vehicle.description && (
          <p className="fct-card-desc">{vehicle.description}</p>
        )}

        {/* Carnet de Santé Quick Link if plate is available */}
        {vehicle.licensePlate && onOpenHealth && (
          <button
            onClick={() => onOpenHealth(vehicle.licensePlate!)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(16, 185, 129, 0.2)',
              marginTop: 4,
            }}
          >
            <ShieldCheck size={14} />
            <span>Carnet d'entretien : plaque {vehicle.licensePlate}</span>
          </button>
        )}

        {/* Footer Pricing & CTA */}
        <div className="fct-card-footer">
          <div className="fct-price-block">
            <span className="fct-price-label">
              {isRent ? 'Tarif journalier' : 'Prix certifié'}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="fct-price-val">
                {formatXAF(isRent ? vehicle.rentalDailyRate : vehicle.salePrice)}
              </span>
              {isRent && <span className="fct-price-unit">/ j</span>}
            </div>
            {isRent && (
              <span className="fct-deposit-note">
                Caution : {formatXAF(vehicle.securityDepositRate)}
              </span>
            )}
          </div>

          <button
            onClick={() => onSelect(vehicle)}
            className="btn-gold"
            style={{ padding: '11px 20px', fontSize: 13 }}
          >
            {isRent ? <KeyRound size={15} /> : <ShoppingBag size={15} />}
            <span>{isRent ? 'Réserver' : 'Demander devis'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
