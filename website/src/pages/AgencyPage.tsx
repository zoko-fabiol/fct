import React from 'react';
import { MapPin, Phone, Clock, Mail, MessageSquare, ShieldCheck, Navigation } from 'lucide-react';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

export const AgencyPage: React.FC = () => {
  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="fct-page-header">
        <div className="fct-container">
          <span className="fct-badge fct-badge-green">Siège & Showroom Douala</span>
          <h2>Notre Agence de Bonamoussadi</h2>
          <p>
            Rencontrez nos conseillers, visitez notre showroom et retirez votre véhicule en toute sérénité.
          </p>
        </div>
      </div>

      <div className="fct-container">
        <div className="fct-agency-layout">
          {/* Informations Complètes Agence */}
          <div style={{ background: 'white', padding: 36, borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--fct-blue-dark)', marginBottom: 20 }}>
              Franchise Conseils Trading (FCT) Automobile
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>Adresse Physique :</strong>
                  <p style={{ color: 'var(--text-body)', marginTop: 2 }}>{FCT_AGENCY_INFO.address}</p>
                  <p style={{ color: 'var(--fct-green-primary)', fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                    {FCT_AGENCY_INFO.landmark}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>Horaires d'Ouverture :</strong>
                  <p style={{ color: 'var(--text-body)', marginTop: 2 }}>{FCT_AGENCY_INFO.hours}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>Standards Téléphoniques :</strong>
                  <p style={{ marginTop: 2 }}>
                    <a href={`tel:${FCT_AGENCY_INFO.phone1}`} style={{ color: 'var(--fct-blue-primary)', fontWeight: 700 }}>
                      {FCT_AGENCY_INFO.phone1}
                    </a>{' '}
                    / {' '}
                    <a href={`tel:${FCT_AGENCY_INFO.phone2}`} style={{ color: 'var(--fct-blue-primary)', fontWeight: 700 }}>
                      {FCT_AGENCY_INFO.phone2}
                    </a>
                  </p>
                  <p style={{ color: 'var(--fct-green-primary)', fontSize: 13, marginTop: 2 }}>
                    {FCT_AGENCY_INFO.emergency}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>Courriel Professionnel :</strong>
                  <p style={{ color: 'var(--text-body)', marginTop: 2 }}>{FCT_AGENCY_INFO.email}</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
              {FCT_AGENCY_INFO.legalInfo}
            </div>
          </div>

          {/* Action Rapide WhatsApp & Itinéraire */}
          <div style={{ background: 'white', padding: 36, borderRadius: 20, border: '1.5px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--fct-green-soft)',
                color: 'var(--fct-green-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <MessageSquare size={32} />
            </div>

            <h4 style={{ fontSize: 20, fontWeight: 900, color: 'var(--fct-blue-dark)', marginBottom: 8 }}>
              Assistance & Réservation Immédiate
            </h4>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 24, lineHeight: 1.6 }}>
              Échangez directement avec un conseiller FCT à Douala pour réserver un véhicule sous 15 minutes.
            </p>

            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=Bonjour%20FCT%20Automobile,%20je%20souhaite%20des%20renseignements%20sur%20vos%20véhicules.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', marginBottom: 12 }}
            >
              <MessageSquare size={18} />
              <span>Contacter sur WhatsApp (+237)</span>
            </a>

            <a
              href={`tel:${FCT_AGENCY_INFO.phone1}`}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px 20px' }}
            >
              <Phone size={18} />
              <span>Appeler : {FCT_AGENCY_INFO.phone1}</span>
            </a>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>
              <ShieldCheck size={16} color="#059669" />
              <span>Agence officielle certifiée FCT Douala</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
