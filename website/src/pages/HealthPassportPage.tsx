import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, CheckCircle2, Wrench, Calendar, Gauge, Award, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { fetchVehicleHealthPassport } from '../services/firebase.ts';
import { Vehicle, MaintenanceRecordItem } from '../types/index.ts';
import { formatDateFR } from '../utils/formatters.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';

interface HealthPassportPageProps {
  initialPlate?: string;
  onOpenShowroom: (vehicleId: string) => void;
  lang?: WebsiteLanguage;
}

export const HealthPassportPage: React.FC<HealthPassportPageProps> = ({
  initialPlate = '',
  onOpenShowroom,
  lang = 'fr',
}) => {
  const t = websiteTranslations[lang].health;
  const isEn = lang === 'en';

  const [inputPlate, setInputPlate] = useState(initialPlate);
  const [searchedPlate, setSearchedPlate] = useState(initialPlate);
  const [data, setData] = useState<{ vehicle: Vehicle; records: MaintenanceRecordItem[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialPlate));

  useEffect(() => {
    if (!searchedPlate) {
      setData(null);
      return;
    }
    let active = true;
    setSearching(true);
    fetchVehicleHealthPassport(searchedPlate)
      .then((res) => {
        if (active) {
          setData(res);
          setSearching(false);
          setHasSearched(true);
        }
      })
      .catch(() => {
        if (active) {
          setData(null);
          setSearching(false);
          setHasSearched(true);
        }
      });
    return () => {
      active = false;
    };
  }, [searchedPlate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPlate.trim()) {
      setSearchedPlate(inputPlate.trim().toUpperCase());
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="fct-page-header">
        <div className="fct-container">
          <span className="fct-badge fct-badge-green">
            {isEn ? 'FCT Douala Innovation' : 'Innovation FCT Douala'}
          </span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="fct-container">
        {/* Module de Recherche Haute Lisibilité */}
        <div
          style={{
            background: 'white',
            padding: 32,
            borderRadius: 20,
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: 720,
            margin: '0 auto 40px',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 6 }}>
            {isEn ? 'Verify a Vehicle by License Plate' : 'Vérifier un Véhicule par Immatriculation Camerounaise'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 18 }}>
            {isEn
              ? 'Enter plate (e.g. LT-8841-CE, LT-5578-CD, LT-1100-AB) to access the official workshop log.'
              : 'Entrez la plaque (ex: LT-8841-CE, LT-5578-CD, LT-1100-AB) pour accéder au carnet d\'atelier officiel.'}
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={inputPlate}
                onChange={(e) => setInputPlate(e.target.value)}
                className="fct-input"
                style={{ paddingLeft: 42, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '1px' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '10px 22px' }}>
              <span>{t.searchBtn}</span>
            </button>
          </form>
        </div>

        {/* Résultat du Carnet de Santé */}
        {searching ? (
          <div style={{ background: 'white', padding: 48, borderRadius: 16, textAlign: 'center', border: '1.5px solid var(--border-subtle)', maxWidth: 600, margin: '0 auto', boxShadow: 'var(--shadow-sm)' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: 'var(--fct-blue-primary, #1e3a8a)' }} />
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--fct-blue-dark, #0f2a4a)', fontSize: 15 }}>
              {isEn ? 'Searching official FCT vehicle registry...' : 'Recherche en direct dans la base certifiée FCT...'}
            </p>
          </div>
        ) : data ? (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Carte Synthèse Véhicule */}
            <div
              style={{
                background: 'white',
                borderRadius: 20,
                border: '1px solid var(--border-subtle)',
                padding: 32,
                boxShadow: 'var(--shadow-sm)',
                marginBottom: 32,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        padding: '6px 14px',
                        background: '#0f2a4a',
                        color: 'white',
                        borderRadius: 8,
                        fontFamily: 'monospace',
                        fontSize: 16,
                        fontWeight: 900,
                        letterSpacing: '1px',
                      }}
                    >
                      {data.vehicle.licensePlate}
                    </span>
                    <span className="fct-badge fct-badge-green">
                      <ShieldCheck size={14} />
                      <span>{t.vehicleFound}</span>
                    </span>
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--fct-blue-dark)' }}>
                    {data.vehicle.brand} {data.vehicle.model} ({data.vehicle.year})
                  </h3>
                  <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>
                    {isEn ? 'VIN Chassis:' : 'Châssis VIN :'} <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{data.vehicle.vin || 'VF1-FCT-2026-CMR'}</span> · {isEn ? 'First registered:' : 'Mise en circulation :'} {data.vehicle.firstRegistrationDate || data.vehicle.year}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                    {t.generalCondition}
                  </span>
                  <strong style={{ fontSize: 20, color: 'var(--fct-green-primary)', fontWeight: 900 }}>
                    {data.vehicle.conditionGrade || '10/10'} / A+
                  </strong>
                </div>
              </div>

              {/* 3 Cartes de Métriques Clés */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 28 }}>
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {t.mileageCertified}
                  </span>
                  <strong style={{ fontSize: 18, color: 'var(--fct-blue-dark)' }}>
                    {data.vehicle.mileage.toLocaleString(isEn ? 'en-US' : 'fr-FR')} km
                  </strong>
                </div>
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {isEn ? 'Last Inspection' : 'Dernière Révision'}
                  </span>
                  <strong style={{ fontSize: 18, color: 'var(--fct-blue-dark)' }}>
                    {data.records[0]?.date || '2026-10-01'}
                  </strong>
                </div>
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {t.interventionsCount}
                  </span>
                  <strong style={{ fontSize: 18, color: 'var(--fct-green-primary)' }}>
                    {data.records.length} {isEn ? 'operations logged' : 'actes enregistrés'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Historique Détaillé des Interventions */}
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border-subtle)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Wrench size={22} color="var(--fct-blue-primary)" />
                <h4 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                  {t.historyTitle}
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {data.records.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 20,
                      borderRadius: 14,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--fct-blue-dark)' }}>
                            {r.type}
                          </span>
                          {r.isCertifiedFCT && (
                            <span className="fct-badge fct-badge-green" style={{ fontSize: 10, padding: '2px 8px' }}>
                              <Award size={11} />
                              <span>{t.certifiedStamp}</span>
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                          {isEn ? 'Performed at:' : 'Réalisé chez :'} <strong>{r.garageName}</strong> · {isEn ? 'Odometer:' : 'Kilométrage :'} <strong>{r.mileageKm.toLocaleString(isEn ? 'en-US' : 'fr-FR')} km</strong>
                        </p>
                      </div>

                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                        {r.date}
                      </span>
                    </div>

                    {r.partsReplaced && r.partsReplaced.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                          {t.colParts} :
                        </span>
                        {r.partsReplaced.map((part, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 700,
                            }}
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', padding: 50, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border-subtle)', maxWidth: 600, margin: '0 auto' }}>
            <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
              {t.noRecords}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
