import React from 'react';
import { Car, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { AppPage } from '../types/router.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (p: AppPage) => {
    onNavigate(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="fct-footer-light">
      <div className="fct-container">
        <div className="fct-footer-grid">
          {/* Colonne 1 : À Propos */}
          <div className="fct-footer-col">
            <div className="fct-brand" style={{ marginBottom: 14 }}>
              <img
                src="/fct-logo.png"
                alt="FCT - Franchise Conseils Trading Automobile Douala"
                style={{
                  height: 44,
                  width: 'auto',
                  maxWidth: 190,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 16 }}>
              Société leader à Douala pour la location de SUV, 4x4 et berlines de prestige, la vente certifiée
              en 110 points et le suivi numérique de santé technique.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {FCT_AGENCY_INFO.legalInfo}
            </p>
          </div>

          {/* Colonne 2 : Liens Location & Vente */}
          <div className="fct-footer-col">
            <h4>Flotte & Services</h4>
            <ul className="fct-footer-links">
              <li><button onClick={() => handleNav('location')}>Location avec Chauffeur</button></li>
              <li><button onClick={() => handleNav('location')}>Location sans Chauffeur</button></li>
              <li><button onClick={() => handleNav('vente')}>Vente de Véhicules Certifiés</button></li>
              <li><button onClick={() => handleNav('carnet-sante')} style={{ color: 'var(--fct-green-primary)', fontWeight: 700 }}>Carnet de Santé Numérique</button></li>
              <li><button onClick={() => handleNav('espace-client')}>Espace Adhérent Client</button></li>
            </ul>
          </div>

          {/* Colonne 3 : L'Agence */}
          <div className="fct-footer-col">
            <h4>L'Entreprise</h4>
            <ul className="fct-footer-links">
              <li><button onClick={() => handleNav('agence')}>Agence Bonamoussadi</button></li>
              <li><button onClick={() => handleNav('agence')}>Horaires & Plan d'Accès</button></li>
              <li><a href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer">Contact WhatsApp VIP</a></li>
              <li><a href={`tel:${FCT_AGENCY_INFO.phone1}`}>Ligne Directe Douala</a></li>
            </ul>
          </div>

          {/* Colonne 4 : Localisation Directe */}
          <div className="fct-footer-col">
            <h4>Nous Trouver</h4>
            <p style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 700, marginBottom: 4 }}>
              {FCT_AGENCY_INFO.address}
            </p>
            <p style={{ fontSize: 12, color: 'var(--fct-green-primary)', marginBottom: 14 }}>
              {FCT_AGENCY_INFO.landmark}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <span>Tél : <strong>{FCT_AGENCY_INFO.phone1}</strong></span>
              <span>Urgences : <strong>{FCT_AGENCY_INFO.phone2}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>{FCT_AGENCY_INFO.email}</span>
            </div>
          </div>
        </div>

        {/* Barre Inférieure */}
        <div className="fct-footer-bottom">
          <div>
            © {new Date().getFullYear()} Franchise Conseils Trading (FCT) Automobile Douala. Tous droits réservés.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={15} color="#059669" />
            <span>Portail Officiel FCT Cameroun · RC/DLA/2020/B/1458</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
