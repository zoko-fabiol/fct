import React, { useState, useMemo } from 'react';
import { ShoppingBag, Award, CheckCircle2, Car, ArrowRight, ShieldCheck, Settings2, Fuel, Users, Gauge } from 'lucide-react';
import { Vehicle } from '../types/index.ts';
import { formatXAF } from '../utils/formatters.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';

interface SalesPageProps {
  vehicles: Vehicle[];
  onOpenShowroom: (vehicleId: string) => void;
  lang?: WebsiteLanguage;
}

export const SalesPage: React.FC<SalesPageProps> = ({ vehicles, onOpenShowroom, lang = 'fr' }) => {
  const t = websiteTranslations[lang].sales;
  const isEn = lang === 'en';

  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(100000000);
  const [searchQuery, setSearchQuery] = useState('');

  const salesList = useMemo(() => {
    return vehicles
      .filter((v) => v.isForSale)
      .filter((v) => {
        if (selectedCat !== 'ALL' && v.category !== selectedCat) return false;
        if (v.salePrice > maxPrice) return false;
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
  }, [vehicles, selectedCat, maxPrice, searchQuery]);

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* En-tête de la Page Vente */}
      <div className="fct-page-header">
        <div className="fct-container">
          <span className="fct-badge fct-badge-green">
            {(t as any).badge || (isEn ? 'FCT Certified Vehicles' : 'Véhicules Certifiés FCT')}
          </span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="fct-container">
        <div className="fct-catalog-layout">
          {/* Barre Latérale des Filtres */}
          <aside className="fct-filters-sidebar">
            <div className="fct-filter-group">
              <h4>{isEn ? 'Search' : 'Recherche'}</h4>
              <input
                type="text"
                placeholder={isEn ? 'Model, brand...' : 'Modèle, marque...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="fct-input"
                style={{ fontSize: 13, padding: '9px 12px' }}
              />
            </div>

            <div className="fct-filter-group">
              <h4>{isEn ? 'Category' : 'Catégorie'}</h4>
              <div className="fct-filter-options">
                <button
                  onClick={() => setSelectedCat('ALL')}
                  className={`fct-filter-btn ${selectedCat === 'ALL' ? 'active' : ''}`}
                >
                  {isEn ? `All (${vehicles.filter((v) => v.isForSale).length})` : `Toutes (${vehicles.filter((v) => v.isForSale).length})`}
                </button>
                <button
                  onClick={() => setSelectedCat('SUV')}
                  className={`fct-filter-btn ${selectedCat === 'SUV' ? 'active' : ''}`}
                >
                  {isEn ? 'SUV & Comfort' : 'SUV & Confort'}
                </button>
                <button
                  onClick={() => setSelectedCat('4X4')}
                  className={`fct-filter-btn ${selectedCat === '4X4' ? 'active' : ''}`}
                >
                  {isEn ? '4x4 All-Terrain' : '4x4 Tout-Terrain'}
                </button>
                <button
                  onClick={() => setSelectedCat('LUXE')}
                  className={`fct-filter-btn ${selectedCat === 'LUXE' ? 'active' : ''}`}
                >
                  {isEn ? 'Luxury & VIP' : 'Luxe & VIP'}
                </button>
              </div>
            </div>

            <div className="fct-filter-group">
              <h4>{isEn ? 'Maximum Budget' : 'Budget Maximal'}</h4>
              <div className="fct-filter-options">
                <button
                  onClick={() => setMaxPrice(100000000)}
                  className={`fct-filter-btn ${maxPrice === 100000000 ? 'active' : ''}`}
                >
                  {isEn ? 'All budgets' : 'Tous les budgets'}
                </button>
                <button
                  onClick={() => setMaxPrice(30000000)}
                  className={`fct-filter-btn ${maxPrice === 30000000 ? 'active' : ''}`}
                >
                  {isEn ? 'Under 30M XAF' : 'Moins de 30M FCFA'}
                </button>
                <button
                  onClick={() => setMaxPrice(50000000)}
                  className={`fct-filter-btn ${maxPrice === 50000000 ? 'active' : ''}`}
                >
                  {isEn ? 'Under 50M XAF' : 'Moins de 50M FCFA'}
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--fct-green-soft)', padding: 14, borderRadius: 10, border: '1px solid rgba(5, 150, 105, 0.2)', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--fct-green-primary)' }}>
                <ShieldCheck size={16} />
                <span>{isEn ? 'FCT Workshop Warranty' : 'Garantie Atelier FCT'}</span>
              </div>
              <p style={{ color: 'var(--text-sub)', marginTop: 4 }}>
                {isEn
                  ? 'Every vehicle sale includes a digital health record and a certified technical inspection.'
                  : 'Chaque vente comprend un carnet de santé numérique et un certificat d\'inspection valide.'}
              </p>
            </div>
          </aside>

          {/* Grille des Véhicules en Vente */}
          <main>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)' }}>
                {salesList.length} {isEn ? (salesList.length > 1 ? 'certified vehicles in stock' : 'certified vehicle in stock') : (salesList.length > 1 ? 'véhicules certifiés en stock' : 'véhicule certifié en stock')}
              </span>
              <span className="fct-badge fct-badge-amber">
                <Award size={12} />
                <span>{isEn ? '110-point inspection certified' : 'Inspection 110 points validée'}</span>
              </span>
            </div>

            {salesList.length > 0 ? (
              <div className="fct-vehicles-grid">
                {salesList.map((v) => (
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
                      {v.conditionGrade && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            padding: '4px 10px',
                            background: '#ecfdf5',
                            border: '1px solid rgba(5, 150, 105, 0.3)',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#059669',
                          }}
                        >
                          {v.conditionGrade}
                        </span>
                      )}
                    </div>

                    <div className="fct-card-content">
                      <div className="fct-card-title">
                        <h3>{v.brand} {v.model}</h3>
                        <p>{v.year} · {v.color} · {v.currentLocation}</p>
                      </div>

                      <div className="fct-card-specs-row">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Settings2 size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.transmission === 'AUTOMATIQUE' ? (isEn ? 'Automatic' : 'Automatique') : (isEn ? 'Manual' : 'Manuelle')}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Fuel size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.fuel}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Users size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.seats} {isEn ? 'Seats' : 'Places'}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Gauge size={13} style={{ color: 'var(--fct-blue-primary)', flexShrink: 0 }} />
                          <span>{v.mileage.toLocaleString(isEn ? 'en-US' : 'fr-FR')} km</span>
                        </span>
                      </div>

                      <div className="fct-card-price-row">
                        <div>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {t.salePrice || (isEn ? 'Direct Purchase Price' : 'Prix TTC Garanti')}
                          </span>
                          <div className="fct-price-tag">
                            {formatXAF(v.salePrice)}
                          </div>
                        </div>
                        <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
                          <span>{t.viewShowroom || (isEn ? 'Showroom' : 'Showroom')}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'white', padding: 50, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
                  {isEn ? 'No vehicles for sale match these criteria.' : 'Aucun véhicule en vente ne correspond à ces critères.'}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
