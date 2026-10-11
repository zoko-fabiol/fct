import React from 'react';
import { MapPin, Phone, Clock, MessageSquare, ShieldCheck, Mail } from 'lucide-react';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

export const AgencySection: React.FC = () => {
  return (
    <section id="agence" className="fct-section">
      <div className="fct-container">
        <div className="fct-agency-grid">
          {/* Colonne Informations & Localisation */}
          <div className="fct-agency-info">
            <div className="fct-pill-badge">
              <MapPin size={13} />
              <span>Agence & Showroom Douala</span>
            </div>
            <h3 style={{ marginTop: 14 }}>Venez Découvrir Notre Flotte à Bonamoussadi</h3>
            <p className="fct-section-desc">
              Notre agence principale vous accueille au cœur de Bonamoussadi. Venez inspecter nos véhicules en showroom,
              échanger avec nos conseillers ou récupérer votre véhicule prêt au départ.
            </p>

            <div className="fct-contact-list">
              <div className="fct-contact-item">
                <div className="fct-contact-icon">
                  <MapPin size={20} />
                </div>
                <div className="fct-contact-detail">
                  <strong>Adresse Showroom :</strong>
                  <p>{FCT_AGENCY_INFO.address}</p>
                  <p style={{ color: 'var(--gold-light)', fontSize: 12 }}>{FCT_AGENCY_INFO.landmark}</p>
                </div>
              </div>

              <div className="fct-contact-item">
                <div className="fct-contact-icon">
                  <Clock size={20} />
                </div>
                <div className="fct-contact-detail">
                  <strong>Horaires d'ouverture :</strong>
                  <p>{FCT_AGENCY_INFO.hours}</p>
                </div>
              </div>

              <div className="fct-contact-item">
                <div className="fct-contact-icon">
                  <Phone size={20} />
                </div>
                <div className="fct-contact-detail">
                  <strong>Lignes Directes Agence :</strong>
                  <p>
                    <a href={`tel:${FCT_AGENCY_INFO.phone1}`}>{FCT_AGENCY_INFO.phone1}</a> /{' '}
                    <a href={`tel:${FCT_AGENCY_INFO.phone2}`}>{FCT_AGENCY_INFO.phone2}</a>
                  </p>
                  <p style={{ color: '#34d399', fontSize: 12 }}>{FCT_AGENCY_INFO.emergency}</p>
                </div>
              </div>

              <div className="fct-contact-item">
                <div className="fct-contact-icon">
                  <Mail size={20} />
                </div>
                <div className="fct-contact-detail">
                  <strong>Courriel Professionnel :</strong>
                  <p>
                    <a href={`mailto:${FCT_AGENCY_INFO.email}`}>{FCT_AGENCY_INFO.email}</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Action Directe & WhatsApp */}
          <div className="fct-agency-actions">
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1.5px solid #25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <MessageSquare size={30} color="#25D366" />
            </div>

            <h4 style={{ fontSize: 20, fontWeight: 800 }}>Assistance Immédiate WhatsApp</h4>
            <p style={{ fontSize: 13, color: 'var(--text-sub)' }}>
              Besoin d'un devis urgent pour un déplacement, d'une mise à disposition immédiate ou d'une réservation pour le week-end ?
            </p>

            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=Bonjour%20FCT%20Automobile,%20je%20souhaite%20une%20disponibilité%20véhicule%20à%20Douala.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <MessageSquare size={18} />
              <span>Échanger sur WhatsApp FCT</span>
            </a>

            <a
              href={`tel:${FCT_AGENCY_INFO.phone1}`}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Phone size={18} color="#fbbf24" />
              <span>Appel Téléphonique Direct</span>
            </a>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Agence agréée FCT · SARL enregistrée RC Douala</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
