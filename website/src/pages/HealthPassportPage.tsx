import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle2, Wrench, Calendar, Gauge, Award, FileText, ArrowRight } from 'lucide-react';
import { CERTIFIED_HEALTH_RECORDS } from '../data/defaultCatalog.ts';
import { formatDateFR } from '../utils/formatters.ts';

interface HealthPassportPageProps {
  initialPlate?: string;
  onOpenShowroom: (vehicleId: string) => void;
}

export const HealthPassportPage: React.FC<HealthPassportPageProps> = ({
  initialPlate = 'LT-8841-CE',
  onOpenShowroom,
}) => {
  const [inputPlate, setInputPlate] = useState(initialPlate);
  const [searchedPlate, setSearchedPlate] = useState(initialPlate);

  const cleanPlate = searchedPlate.trim().toUpperCase();
  const data = CERTIFIED_HEALTH_RECORDS[cleanPlate];

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
          <span className="fct-badge fct-badge-green">Innovation FCT Douala</span>
          <h2>Carnet de Santé Numérique & Traçabilité Véhicule</h2>
          <p>
            Chaque véhicule de la franchise FCT Douala dispose d'un passeport de maintenance certifié
            et horodaté. Consultez l'historique complet des vidanges, freins, pneumatiques et révisions.
          </p>
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
            Vérifier un Véhicule par Immatriculation Camerounaise
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 18 }}>
            Entrez la plaque (ex: LT-8841-CE, LT-5578-CD, LT-1100-AB) pour accéder au carnet d'atelier officiel.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="LT-XXXX-XX"
              value={inputPlate}
              onChange={(e) => setInputPlate(e.target.value)}
              className="fct-input"
              style={{
                fontSize: 18,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--fct-blue-dark)',
              }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 24px' }}>
              <Search size={18} />
              <span>Vérifier</span>
            </button>
          </form>

          {/* Raccourcis Plaques */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Plaques certifiées :</span>
            {['LT-8841-CE', 'LT-5578-CD', 'LT-1100-AB'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setInputPlate(p);
                  setSearchedPlate(p);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'var(--bg-surface-alt)',
                  border: '1px solid var(--border-medium)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--fct-blue-primary)',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Fiche Passeport Résultat */}
        {data ? (
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              border: '1.5px solid rgba(5, 150, 105, 0.3)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
              maxWidth: 900,
              margin: '0 auto',
            }}
          >
            {/* Bannière Certifiée */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--fct-green-soft) 0%, #d1fae5 100%)',
                padding: '24px 32px',
                borderBottom: '1px solid rgba(5, 150, 105, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    background: 'var(--fct-green-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--fct-green-primary)' }}>
                    Passeport Technique Certifié FCT
                  </span>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--fct-blue-dark)' }}>
                    {data.vehicle.brand} {data.vehicle.model} ({data.vehicle.year})
                  </h3>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 16,
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'white',
                    color: 'var(--fct-blue-dark)',
                    border: '1.5px solid var(--border-medium)',
                    display: 'inline-block',
                  }}
                >
                  {data.vehicle.licensePlate}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Homologué République du Cameroun
                </span>
              </div>
            </div>

            {/* Statistiques Clés du Véhicule */}
            <div style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                <div style={{ background: 'var(--bg-surface-alt)', padding: 14, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Kilométrage Actuel
                  </span>
                  <strong style={{ display: 'block', fontSize: 18, color: 'var(--fct-blue-dark)', marginTop: 2 }}>
                    {data.vehicle.mileage.toLocaleString('fr-FR')} km
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-surface-alt)', padding: 14, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Transmission
                  </span>
                  <strong style={{ display: 'block', fontSize: 18, color: 'var(--fct-blue-dark)', marginTop: 2 }}>
                    {data.vehicle.transmission}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-surface-alt)', padding: 14, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Carburant
                  </span>
                  <strong style={{ display: 'block', fontSize: 18, color: 'var(--fct-blue-dark)', marginTop: 2 }}>
                    {data.vehicle.fuel}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-surface-alt)', padding: 14, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Statut FCT
                  </span>
                  <strong style={{ display: 'block', fontSize: 18, color: 'var(--fct-green-primary)', marginTop: 2 }}>
                    Conforme 100%
                  </strong>
                </div>
              </div>

              {/* Historique Chronologique des Opérations en Atelier */}
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 16 }}>
                Historique des Révisions & Interventions en Atelier
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.records.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      padding: 20,
                      background: 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Wrench size={18} color="#059669" />
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                          {rec.type}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {formatDateFR(rec.date)}
                      </span>
                    </div>

                    <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>
                      {rec.workDescription}
                    </p>

                    {rec.partsReplaced && rec.partsReplaced.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                          Pièces d'origine :
                        </span>
                        {rec.partsReplaced.map((part, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'var(--fct-blue-soft)',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--fct-blue-primary)',
                            }}
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 10,
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Atelier : <strong>{rec.garageName}</strong></span>
                      <span>Compteur certifié : <strong>{rec.mileageKm.toLocaleString('fr-FR')} km</strong></span>
                      <span>Signé : <strong>{rec.certifiedBy}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bouton pour ouvrir le showroom de ce véhicule */}
              <div style={{ marginTop: 28, textAlign: 'center' }}>
                <button
                  onClick={() => onOpenShowroom(data.vehicle.id)}
                  className="btn-primary"
                  style={{ padding: '12px 28px' }}
                >
                  <ArrowRight size={16} />
                  <span>Voir la Fiche Complète dans le Showroom</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'white',
              padding: 40,
              borderRadius: 16,
              textAlign: 'center',
              maxWidth: 600,
              margin: '0 auto',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
              Aucun carnet public FCT pour la plaque <strong>{cleanPlate}</strong>.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
              Vérifiez la saisie ou contactez notre agence au +237 699 45 88 12.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
