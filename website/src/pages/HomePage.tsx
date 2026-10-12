import React from 'react';
import {
  Car,
  KeyRound,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Award,
  Wrench,
  UserCheck,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Settings2,
  Fuel,
  Users,
  Gauge,
} from 'lucide-react';
import { Vehicle } from '../types/index.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';
import { formatXAF } from '../utils/formatters.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';

interface HomePageProps {
  vehicles: Vehicle[];
  onNavigate: (page: 'location' | 'vente' | 'carnet-sante' | 'showroom', vehicleId?: string) => void;
  lang?: WebsiteLanguage;
}

export const HomePage: React.FC<HomePageProps> = ({ vehicles, onNavigate, lang = 'fr' }) => {
  const t = websiteTranslations[lang].home;
  const isEn = lang === 'en';
  const featuredRentals = vehicles.filter((v) => v.isForRent).slice(0, 3);
  const featuredSales = vehicles.filter((v) => v.isForSale).slice(0, 3);

  return (
    <div>
      {/* Hero Lumineux de Prestige */}
      <section className="fct-hero-light">
        <div className="fct-container">
          <div className="fct-hero-grid">
            <div className="fct-hero-text">
              <div className="fct-badge fct-badge-green" style={{ marginBottom: 12 }}>
                <MapPin size={13} />
                <span>Douala · Carrefour Santa Barbara, Bonamoussadi</span>
              </div>
              <h1>
                {isEn ? (
                  <>
                    Executive Automotive in Douala,{' '}
                    <span style={{ color: 'var(--fct-blue-primary)' }}>Certified Rental & Sales</span>.
                  </>
                ) : (
                  <>
                    L'Automobile de Prestige à Douala,{' '}
                    <span style={{ color: 'var(--fct-blue-primary)' }}>en Location & Vente Certifiée</span>.
                  </>
                )}
              </h1>
              <p className="fct-hero-lead">
                {t.heroSubtitle}
              </p>

              <div className="fct-hero-buttons">
                <button onClick={() => onNavigate('location')} className="btn-primary">
                  <KeyRound size={17} />
                  <span>{t.exploreFleet}</span>
                </button>
                <button onClick={() => onNavigate('vente')} className="btn-secondary">
                  <ShoppingBag size={17} />
                  <span>{t.viewSales}</span>
                </button>
                <button onClick={() => onNavigate('carnet-sante')} className="btn-emerald">
                  <ShieldCheck size={17} />
                  <span>{isEn ? 'Health Record' : 'Carnet de Santé'}</span>
                </button>
              </div>
            </div>

            {/* Carte Visuelle Prestige */}
            <div className="fct-hero-visual">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span className="fct-badge fct-badge-amber">
                    {isEn ? 'Signature Vehicle' : 'Véhicule Signature'}
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: 'var(--fct-blue-dark)' }}>
                    Toyota Land Cruiser Prado TX-L
                  </h3>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--fct-blue-primary)' }}>
                  85 000 FCFA / {isEn ? 'day' : 'j'}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: 240,
                  borderRadius: 16,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <img
                  src="https://res.cloudinary.com/c58pcgcp/image/upload/v1791746448/fct_automobile/vehicles/toyota_prado_txl.jpg"
                  alt="Toyota Land Cruiser Prado TX-L"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    padding: '4px 10px',
                    borderRadius: 99,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {isEn ? 'A+ Inspection Passed' : 'Inspection A+ Validée'}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#0f172a',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  LT-8841-CE
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16, fontSize: 12, textAlign: 'center' }}>
                <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong>{isEn ? '7 Seats' : '7 Places'}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)' }}>{isEn ? 'VIP Leather' : 'Cuir VIP'}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong>{isEn ? 'Full-Time 4WD' : '4x4 Permanent'}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)' }}>{isEn ? 'All-Terrain' : 'Tout-terrain'}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong>{isEn ? 'Tri-Zone A/C' : 'Clim Tri-Zone'}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)' }}>{isEn ? 'Tropicalized' : 'Tropicalisée'}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('showroom', 'veh_prado')}
                className="btn-primary"
                style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
              >
                <span>{isEn ? 'Open Virtual Showroom' : 'Accéder au Showroom Dédié'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Barre des Statistiques Officielles */}
          <div className="fct-stats-bar-light">
            <div className="fct-stat-cell">
              <strong>110 Points</strong>
              <span>{isEn ? 'Certified Workshop Inspection' : 'Contrôle Atelier Certifié'}</span>
            </div>
            <div className="fct-stat-cell">
              <strong>500+</strong>
              <span>{isEn ? 'Corporate & VIP Clients' : 'Clients Entreprises & Particuliers'}</span>
            </div>
            <div className="fct-stat-cell">
              <strong style={{ color: 'var(--fct-green-primary)' }}>24/7</strong>
              <span>{isEn ? 'Douala Roadside Assistance' : 'Assistance Dépannage Douala'}</span>
            </div>
            <div className="fct-stat-cell">
              <strong>100% XAF</strong>
              <span>{isEn ? 'Transparent Pricing Without Surprises' : 'Tarifs Clairs Sans Frais Cachés'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Vedettes : Flotte de Location */}
      <section style={{ padding: '70px 0', background: 'var(--bg-surface)' }}>
        <div className="fct-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="fct-badge fct-badge-blue">
                {isEn ? 'Immediate Rental' : 'Location Immédiate'}
              </span>
              <h2 style={{ fontSize: 32, fontWeight: 900, marginTop: 8, color: 'var(--fct-blue-dark)' }}>
                {t.featuredVehicles}
              </h2>
              <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
                {t.featuredSubtitle}
              </p>
            </div>
            <button onClick={() => onNavigate('location')} className="btn-secondary">
              <span>{isEn ? `View Full Fleet (${vehicles.filter((v) => v.isForRent).length})` : `Voir toute la flotte (${vehicles.filter((v) => v.isForRent).length})`}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="fct-vehicles-grid">
            {featuredRentals.map((v) => (
              <div
                key={v.id}
                onClick={() => onNavigate('showroom', v.id)}
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
                        {isEn ? 'Daily Rate' : 'Tarif journalier'}
                      </span>
                      <div className="fct-price-tag">
                        {formatXAF(v.rentalDailyRate)} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>/ {isEn ? 'day' : 'j'}</span>
                      </div>
                    </div>
                    <span className="btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
                      {isEn ? 'View Showroom' : 'Voir Showroom'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Les 4 Engagements FCT Douala */}
      <section style={{ padding: '70px 0', background: 'var(--bg-page)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="fct-container">
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 48px' }}>
            <span className="fct-badge fct-badge-green">
              {isEn ? 'Excellence & Security' : 'Excellence & Sécurité'}
            </span>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginTop: 8, color: 'var(--fct-blue-dark)' }}>
              {t.whyChooseUs}
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
              {isEn
                ? 'Certified contracts, responsive breakdown dispatch and full fleet coverage across Douala-Yaoundé, Kribi and West corridors.'
                : 'Des garanties contractuelles claires et une assistance réactive sur les axes Douala-Yaoundé, Kribi et Ouest.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            <div style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Wrench size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 8 }}>
                {isEn ? 'Certified Bassa Workshop' : 'Atelier Agréé FCT Bassa'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6 }}>
                {t.reason1Desc}
              </p>
            </div>

            <div style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--fct-green-soft)', color: 'var(--fct-green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <UserCheck size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 8 }}>
                {isEn ? 'Certified VIP Chauffeurs' : 'Chauffeurs VIP Certifiés'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6 }}>
                {t.reason2Desc}
              </p>
            </div>

            <div style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FileSpreadsheet size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 8 }}>
                {isEn ? 'Formal Invoices & Proformas' : 'Devis & Factures Proforma'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6 }}>
                {isEn
                  ? 'Full Cameroonian tax and legal compliance (VAT 19.25%, RC/DLA, official Tax ID) for corporate accounting departments.'
                  : 'Conformité fiscale camerounaise intégrale (TVA 19.25%, RC/DLA, NIU officiel) pour vos comptabilités d\'entreprise.'}
              </p>
            </div>

            <div style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--fct-amber-soft)', color: 'var(--fct-amber-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 8 }}>
                {isEn ? 'Digital Vehicle Health Record' : 'Carnet de Santé Numérique'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6 }}>
                {t.reason3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
