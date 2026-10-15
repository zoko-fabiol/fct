import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Search, Wrench, Calendar, Gauge, Award, FileText, Loader2 } from 'lucide-react';
import { fetchVehicleHealthPassport } from '../services/firebase.ts';
import { Vehicle, MaintenanceRecordItem } from '../types/index.ts';
import { formatXAF, formatDateFR } from '../utils/formatters.ts';

interface HealthPassportProps {
  initialPlate?: string;
}

export const HealthPassport: React.FC<HealthPassportProps> = ({ initialPlate = '' }) => {
  const [plate, setPlate] = useState(initialPlate);
  const [searchedPlate, setSearchedPlate] = useState(initialPlate);
  const [data, setData] = useState<{ vehicle: Vehicle; records: MaintenanceRecordItem[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchedPlate) {
      setData(null);
      return;
    }
    let active = true;
    setLoading(true);
    fetchVehicleHealthPassport(searchedPlate)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [searchedPlate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim()) {
      setSearchedPlate(plate.trim().toUpperCase());
    }
  };

  return (
    <section id="carnet-sante" className="fct-section">
      <div className="fct-container">
        <div className="fct-health-box">
          {/* Colonne Explicative */}
          <div className="fct-health-info">
            <div className="fct-pill-badge emerald">
              <Award size={14} />
              <span>Innovation FCT Douala</span>
            </div>
            <h2>
              Le <span className="emerald-text">Carnet de Santé Numérique</span> FCT Automobile.
            </h2>
            <p className="fct-section-desc">
              Chaque véhicule de notre parc dispose d'un passeport d'entretien certifié et infalsifiable.
              Consultez en temps réel l'historique des vidanges, le suivi des organes de sécurité
              (freins, suspension, pneumatiques) et la conformité administrative avant de louer ou d'acheter.
            </p>

            <div className="fct-health-bullets">
              <div className="fct-health-bullet">
                <CheckCircle2 size={18} className="fct-health-bullet-icon" />
                <span>Traçabilité complète des interventions dans notre atelier central FCT Bassa.</span>
              </div>
              <div className="fct-health-bullet">
                <CheckCircle2 size={18} className="fct-health-bullet-icon" />
                <span>Pièces d'origine constructeur certifiées (Toyota OEM, Mercedes Genuine Parts).</span>
              </div>
              <div className="fct-health-bullet">
                <CheckCircle2 size={18} className="fct-health-bullet-icon" />
                <span>Kilométrage certifié conforme sans modification possible.</span>
              </div>
            </div>
          </div>

          {/* Module Interactif de Recherche & Fiche */}
          <div className="fct-health-search-card">
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              Vérification immédiate par immatriculation
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Format camerounais (ex: LT-8841-CE, LT-5578-CD, LT-1100-AB)
            </p>

            <form onSubmit={handleSearch} className="fct-plate-input-wrap">
              <input
                type="text"
                placeholder="LT-XXXX-XX"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="fct-plate-input"
              />
              <button type="submit" className="btn-gold" style={{ padding: '0 22px' }}>
                <Search size={18} />
                <span>Vérifier</span>
              </button>
            </form>

            {/* Plaques Rapides Démo */}
            <div className="fct-quick-plates">
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Exemples vérifiés :</span>
              {['LT-8841-CE', 'LT-5578-CD', 'LT-1100-AB'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlate(p);
                    setSearchedPlate(p);
                  }}
                  className="fct-quick-plate-btn"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Résultat du Carnet de Santé */}
            {data ? (
              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>
                      Passeport Certifié FCT
                    </span>
                    <h4 style={{ fontSize: 16, fontWeight: 800 }}>
                      {data.vehicle.brand} {data.vehicle.model} ({data.vehicle.year})
                    </h4>
                  </div>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--gold-light)',
                      border: '1px solid var(--border-gold)',
                    }}
                  >
                    {data.vehicle.licensePlate}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12, marginBottom: 16 }}>
                  <div style={{ color: 'var(--text-sub)' }}>
                    Kilométrage actuel : <strong style={{ color: 'var(--text-main)' }}>{data.vehicle.mileage.toLocaleString('fr-FR')} km</strong>
                  </div>
                  <div style={{ color: 'var(--text-sub)' }}>
                    Statut : <strong style={{ color: '#34d399' }}>Certifié Conforme</strong>
                  </div>
                </div>

                {/* Historique des Interventions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Dernières interventions validées en atelier :
                  </span>
                  {data.records.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        padding: 12,
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--gold-light)' }}>
                        <span>{rec.type}</span>
                        <span>{formatDateFR(rec.date)}</span>
                      </div>
                      <p style={{ color: 'var(--text-sub)', marginTop: 4 }}>{rec.workDescription}</p>
                      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 11 }}>
                        <span>Atelier : {rec.garageName}</span>
                        <span>Compteur : {rec.mileageKm.toLocaleString('fr-FR')} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                  Aucun dossier public FCT trouvé pour la plaque <strong>{searchedPlate}</strong>.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                  Contactez notre agence au +237 699 45 88 12 pour vérifier un véhicule privé.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
