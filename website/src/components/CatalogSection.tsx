import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, CheckCircle2 } from 'lucide-react';
import { Vehicle, VehicleCategory } from '../types/index.ts';
import { VehicleCard } from './VehicleCard.tsx';

interface CatalogSectionProps {
  id: string;
  title: string;
  subtitle: string;
  mode: 'rent' | 'sale';
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onOpenHealth: (plate: string) => void;
}

const CATEGORIES: { label: string; value: VehicleCategory | 'ALL' }[] = [
  { label: 'Tous les modèles', value: 'ALL' },
  { label: 'SUV Prestige', value: 'SUV' },
  { label: '4X4 Tout-Terrain', value: '4X4' },
  { label: 'Luxe VIP', value: 'LUXE' },
  { label: 'Pick-up Missions', value: 'PICKUP' },
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  id,
  title,
  subtitle,
  mode,
  vehicles,
  onSelectVehicle,
  onOpenHealth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => (mode === 'rent' ? v.isForRent : v.isForSale))
      .filter((v) => {
        if (selectedCategory !== 'ALL' && v.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            (v.licensePlate && v.licensePlate.toLowerCase().includes(q))
          );
        }
        return true;
      });
  }, [vehicles, mode, selectedCategory, searchQuery]);

  return (
    <section id={id} className={`fct-section ${mode === 'sale' ? 'fct-section-alt' : ''}`}>
      <div className="fct-container">
        {/* Section Heading & Category Filters */}
        <div className="fct-section-head">
          <div className="fct-section-title-wrap">
            <div className="fct-pill-badge">
              <Sparkles size={13} color="#f59e0b" />
              <span>{mode === 'rent' ? 'Flotte de Location Douala' : 'Vente Véhicules Certifiés'}</span>
            </div>
            <h2 className="fct-section-title">{title}</h2>
            <p className="fct-section-desc">{subtitle}</p>
          </div>

          {/* Search Input & Category Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              <Search
                size={16}
                color="#8092a8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Rechercher (ex: Prado, Hilux, GLE)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="fct-form-input"
                style={{ paddingLeft: 40, height: 42, fontSize: 13 }}
              />
            </div>

            <div className="fct-filter-bar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`fct-filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        {filteredVehicles.length > 0 ? (
          <div className="fct-grid-3">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                mode={mode}
                onSelect={onSelectVehicle}
                onOpenHealth={onOpenHealth}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>
              Aucun véhicule ne correspond à votre recherche actuelle.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="btn-secondary"
              style={{ marginTop: 16 }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
