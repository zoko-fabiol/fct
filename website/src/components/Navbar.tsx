import React, { useState } from 'react';
import { Car, Phone, ShieldCheck, UserCheck, Menu, X, MessageSquare } from 'lucide-react';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenHealth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fct-nav">
      <div className="fct-container">
        <div className="fct-nav-inner">
          {/* Logo & Marque */}
          <a href="#" className="fct-brand">
            <div className="fct-logo-badge">
              <Car size={26} color="#fbbf24" strokeWidth={2.2} />
            </div>
            <div className="fct-brand-text">
              <h1>
                FCT <span className="gold-text">Automobile</span>
              </h1>
              <span>Franchise Conseils Trading · Douala</span>
            </div>
          </a>

          {/* Navigation Links Desktop */}
          <nav className="fct-nav-links">
            <a href="#location" className="fct-nav-link">
              Location Prestige
            </a>
            <a href="#vente" className="fct-nav-link">
              Vente Certifiée
            </a>
            <button onClick={onOpenHealth} className="fct-nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#10b981" />
              Carnet de Santé
            </button>
            <a href="#services" className="fct-nav-link">
              Services & Chauffeurs
            </a>
            <a href="#agence" className="fct-nav-link">
              Notre Agence
            </a>
          </nav>

          {/* Actions & Contact */}
          <div className="fct-nav-actions">
            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=Bonjour%20FCT%20Automobile,%20je%20souhaite%20des%20renseignements%20sur%20un%20véhicule.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              title="Discuter sur WhatsApp"
            >
              <MessageSquare size={16} color="#25D366" />
              <span style={{ fontSize: 13 }}>WhatsApp</span>
            </a>

            <button onClick={onOpenAuth} className="btn-gold">
              <UserCheck size={16} />
              <span>Espace Client</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-icon-subtle fct-burger"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="fct-mobile-menu">
            <a
              href="#location"
              className="fct-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Location Prestige
            </a>
            <a
              href="#vente"
              className="fct-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Vente Certifiée
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHealth();
              }}
              className="fct-nav-link"
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ShieldCheck size={18} color="#10b981" />
              Carnet de Santé Numérique
            </button>
            <a
              href="#services"
              className="fct-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services & Chauffeurs FCT
            </a>
            <a
              href="#agence"
              className="fct-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Notre Agence (Bonamoussadi)
            </a>
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`tel:${FCT_AGENCY_INFO.phone1}`} className="btn-secondary">
                <Phone size={16} color="#fbbf24" />
                <span>Appeler : {FCT_AGENCY_INFO.phone1}</span>
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="btn-gold"
              >
                <UserCheck size={16} />
                <span>Connexion Espace Client</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
