import React from 'react';
import { Car, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

interface FooterProps {
  onOpenHealth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHealth }) => {
  return (
    <footer className="fct-footer">
      <div className="fct-container">
        <div className="fct-footer-grid">
          {/* Colonne 1 : À Propos de FCT */}
          <div className="fct-footer-col">
            <div className="fct-brand" style={{ marginBottom: 16 }}>
              <div className="fct-logo-badge" style={{ width: 40, height: 40 }}>
                <Car size={22} color="#fbbf24" strokeWidth={2.2} />
              </div>
              <div className="fct-brand-text">
                <h1 style={{ fontSize: 18 }}>
                  FCT <span className="gold-text">Automobile</span>
                </h1>
                <span style={{ fontSize: 10 }}>Franchise Conseils Trading</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Référence automobile à Douala pour la location de 4x4, SUV et berlines VIP, la vente de véhicules
              certifiés 110 points et le suivi numérique de santé technique.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {FCT_AGENCY_INFO.legalInfo}
            </p>
          </div>

          {/* Colonne 2 : Liens Rapides */}
          <div className="fct-footer-col">
            <h4>Services</h4>
            <ul className="fct-footer-links">
              <li><a href="#location">Location avec Chauffeur</a></li>
              <li><a href="#location">Location sans Chauffeur</a></li>
              <li><a href="#vente">Vente Véhicules d'Occasion Certifiés</a></li>
              <li><button onClick={onOpenHealth} style={{ fontSize: 13, color: '#34d399', textAlign: 'left' }}>Carnet de Santé Numérique</button></li>
              <li><a href="#services">Flottes Entreprises & LLD</a></li>
            </ul>
          </div>

          {/* Colonne 3 : Navigation */}
          <div className="fct-footer-col">
            <h4>L'Entreprise</h4>
            <ul className="fct-footer-links">
              <li><a href="#agence">Agence Bonamoussadi</a></li>
              <li><a href="#services">Atelier Mécanique FCT Bassa</a></li>
              <li><a href="#services">Chauffeurs Certifiés FCT</a></li>
              <li><a href="#agence">Horaires & Accès</a></li>
              <li><a href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer">Contact WhatsApp VIP</a></li>
            </ul>
          </div>

          {/* Colonne 4 : Localisation Directe */}
          <div className="fct-footer-col">
            <h4>Nous Trouver</h4>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 8 }}>
              {FCT_AGENCY_INFO.address}
            </p>
            <p style={{ fontSize: 12, color: 'var(--gold-light)', marginBottom: 16 }}>
              {FCT_AGENCY_INFO.landmark}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                {FCT_AGENCY_INFO.phone1}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {FCT_AGENCY_INFO.email}
              </span>
            </div>
          </div>
        </div>

        {/* Barre Inférieure */}
        <div className="fct-footer-bottom">
          <div>
            © {new Date().getFullYear()} Franchise Conseils Trading (FCT) Automobile Douala. Tous droits réservés.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Plateforme Officielle FCT Cameroun · Douala</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
