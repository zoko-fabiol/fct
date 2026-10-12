import React, { useState, useMemo } from 'react';
import { Search, Filter, KeyRound, CheckCircle2, Car, ArrowRight, Settings2, Fuel, Users, Gauge } from 'lucide-react';
import { Vehicle, VehicleCategory } from '../types/index.ts';
import { formatXAF } from '../utils/formatters.ts';

interface RentalPageProps {
  vehicles: Vehicle[];
  onOpenShowroom: (vehicleId: string) => void;
}

const CATEGORIES: { label: string; value: VehicleCategory | 'ALL' }[] = [
  { label: 'Toutes les Catégories', value: 'ALL' },
  { label: 'SUV Urbain & Confort', value: 'SUV' },
  { label: '4x4 Tout-Terrain', value: '4X4' },
  { label: 'Pick-up Chantier & Piste', value: 'PICKUP' },
  { label: 'Prestige & VIP', value: 'LUXE' },
];

export const RentalPage: React.FC<RentalPageProps> = ({ vehicles, onOpenShowroom }) => {
  const [selectedCat, setSelectedCat] = useState<VehicleCategory | 'ALL'>('ALL');
  const [selectedFuel, setSelectedFuel] = useState<string>('ALL');
  const [selectedTrans, setSelectedTrans] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const rentalList = useMemo(() => {
    return vehicles
      .filter((v) => v.isForRent)
      .filter((v) => {
        if (selectedCat !== 'ALL' && v.category !== selectedCat) return false;
        if (selectedFuel !== 'ALL' && v.fuel !== selectedFuel) return false;
        if (selectedTrans !== 'ALL' && v.transmission !== selectedTrans) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            (v.licensePlate && v.licensePlate.toLowerCase().includes(q))
          );
        }
        return true;
      });
  }, [vehicles, selectedCat, selectedFuel, selectedTrans, searchQuery]);

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* En-tête de la Page Location */}
      <div className="fct-page-header">
        <div className="fct-container">
          <span className="fct-badge fct-badge-blue">Catalogue Officiel</span>
          <h2>Location de Véhicules de Prestige à Douala</h2>
          <p>
            Sélectionnez votre véhicule parmi notre parc entretenu et inspecté. Tarifs dégressifs,
            caution sécurisée et option chauffeur professionnel pour vos déplacements.
          </p>
        </div>
      </div>

      <div className="fct-container">
        <div className="fct-catalog-layout">
          {/* Barre Latérale des Filtres */}
          <aside className="fct-filters-sidebar">
            <div className="fct-filter-group">
              <h4>Recherche</h4>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Modèle, marque, plaque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="fct-input"
                  style={{ fontSize: 13, padding: '9px 12px' }}
                />
              </div>
            </div>

            <div className="fct-filter-group">
              <h4>Catégorie</h4>
              <div className="fct-filter-options">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setSelectedCat(c.value)}
                    className={`fct-filter-btn ${selectedCat === c.value ? 'active' : ''}`}
                  >
                    <span>{c.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                      {c.value === 'ALL'
                        ? vehicles.filter((v) => v.isForRent).length
                        : vehicles.filter((v) => v.isForRent && v.category === c.value).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="fct-filter-group">
              <h4>Boîte de Vitesses</h4>
              <div className="fct-filter-options">
                <button
                  onClick={() => setSelectedTrans('ALL')}
                  className={`fct-filter-btn ${selectedTrans === 'ALL' ? 'active' : ''}`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setSelectedTrans('AUTOMATIQUE')}
                  className={`fct-filter-btn ${selectedTrans === 'AUTOMATIQUE' ? 'active' : ''}`}
                >
                  Automatique
                </button>
                <button
                  onClick={() => setSelectedTrans('MANUELLE')}
                  className={`fct-filter-btn ${selectedTrans === 'MANUELLE' ? 'active' : ''}`}
                >
                  Manuelle
                </button>
              </div>
            </div>

            <div className="fct-filter-group">
              <h4>Carburant</h4>
              <div className="fct-filter-options">
                <button
                  onClick={() => setSelectedFuel('ALL')}
                  className={`fct-filter-btn ${selectedFuel === 'ALL' ? 'active' : ''}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setSelectedFuel('DIESEL')}
                  className={`fct-filter-btn ${selectedFuel === 'DIESEL' ? 'active' : ''}`}
                >
                  Diesel
                </button>
                <button
                  onClick={() => setSelectedFuel('ESSENCE')}
                  className={`fct-filter-btn ${selectedFuel === 'ESSENCE' ? 'active' : ''}`}
                >
                  Essence
                </button>
                <button
                  onClick={() => setSelectedFuel('HYBRIDE')}
                  className={`fct-filter-btn ${selectedFuel === 'HYBRIDE' ? 'active' : ''}`}
                >
                  Hybride
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCat('ALL');
                setSelectedFuel('ALL');
                setSelectedTrans('ALL');
                setSearchQuery('');
              }}
              className="btn-secondary"
              style={{ fontSize: 12, justifyContent: 'center' }}
            >
              Réinitialiser les filtres
            </button>
          </aside>

          {/* Grille des Véhicules de Location */}
          <main>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)' }}>
                {rentalList.length} véhicule{rentalList.length > 1 ? 's' : ''} disponible{rentalList.length > 1 ? 's' : ''}
              </span>
              <span className="fct-badge fct-badge-green">
                <CheckCircle2 size={12} />
                <span>Véhicules prêts à partir</span>
              </span>
            </div>

            {rentalList.length > 0 ? (
              <div className="fct-vehicles-grid">
                {rentalList.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => onOpenShowroom(v.id)}
                    className="fct-vehicle-card-light"
                  >
                    <div className="fct-card-image-wrap">
                      {v.photoUrls && v.photoUrls.length > 0 ? (
                        <img src={v.photoUrls[0]} alt={`${v.brand} ${v.model}`} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fct-blue-primary)' }}>
                          <Car size={54} strokeWidth={1.5} />
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          padding: '4px 10px',
                          background: 'white',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 800,
                          color: 'var(--fct-blue-dark)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        {v.category}
                      </span>
                    </div>

                    <div className="fct-card-content">
                      <div className="fct-card-title">
                        <h3>{v.brand} {v.model}</h3>
                        <p>{v.year} · {v.color} · {v.currentLocation}</p>
                      </div>

                      <div className="fct-card-specs-row">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Settings2 size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.transmission === 'AUTOMATIQUE' ? 'Automatique' : 'Manuelle'}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Fuel size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.fuel}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Users size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.seats} Places</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Gauge size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.mileage.toLocaleString('fr-FR')} km</span>
                        </span>
                      </div>

                      <div className="fct-card-price-row">
                        <div>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Tarif journalier
                          </span>
                          <div className="fct-price-tag">
                            {formatXAF(v.rentalDailyRate)} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>/ j</span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Caution : {formatXAF(v.securityDepositRate)}
                          </span>
                        </div>
                        <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
                          <span>Showroom</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'white', padding: 50, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Aucun véhicule ne correspond à ces critères.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
