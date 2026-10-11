import React, { useState } from 'react';
import { Car, Phone, ShieldCheck, UserCheck, Menu, X, MessageSquare, KeyRound, ShoppingBag, MapPin } from 'lucide-react';
import { AppPage } from '../types/router.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (p: AppPage) => {
    onNavigate(p);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fct-navbar">
      <div className="fct-container">
        <div className="fct-nav-inner">
          {/* Logo & Identité Visuelle FCT */}
          <button onClick={() => handleNav('home')} className="fct-brand" style={{ cursor: 'pointer' }}>
            <div className="fct-brand-logo">
              <Car size={24} strokeWidth={2.2} />
            </div>
            <div className="fct-brand-info" style={{ textAlign: 'left' }}>
              <h1>FCT Automobile</h1>
              <span>Franchise Conseils Trading · Douala</span>
            </div>
          </button>

          {/* Liens de Navigation Desktop Multi-Pages */}
          <nav className="fct-nav-links">
            <button
              onClick={() => handleNav('home')}
              className={`fct-nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            >
              Accueil
            </button>
            <button
              onClick={() => handleNav('location')}
              className={`fct-nav-btn ${currentPage === 'location' ? 'active' : ''}`}
            >
              <KeyRound size={15} />
              <span>Location</span>
            </button>
            <button
              onClick={() => handleNav('vente')}
              className={`fct-nav-btn ${currentPage === 'vente' ? 'active' : ''}`}
            >
              <ShoppingBag size={15} />
              <span>Vente</span>
            </button>
            <button
              onClick={() => handleNav('carnet-sante')}
              className={`fct-nav-btn ${currentPage === 'carnet-sante' ? 'active' : ''}`}
            >
              <ShieldCheck size={15} color="#059669" />
              <span>Carnet de Santé</span>
            </button>
            <button
              onClick={() => handleNav('agence')}
              className={`fct-nav-btn ${currentPage === 'agence' ? 'active' : ''}`}
            >
              <MapPin size={15} />
              <span>Notre Agence</span>
            </button>
          </nav>

          {/* Boutons d'Action & Espace Adhérent */}
          <div className="fct-nav-actions">
            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=Bonjour%20FCT%20Automobile,%20je%20souhaite%20un%20renseignement%20sur%20un%20véhicule.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald"
              style={{ padding: '9px 16px', fontSize: 13 }}
            >
              <MessageSquare size={15} />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => handleNav('espace-client')}
              className={`btn-primary ${currentPage === 'espace-client' ? 'active' : ''}`}
              style={{ padding: '9px 18px', fontSize: 13 }}
            >
              <UserCheck size={15} />
              <span>Espace Adhérent</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-secondary fct-burger"
              style={{ padding: 8 }}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu Déroulant Mobile */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '16px 0',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <button onClick={() => handleNav('home')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              Accueil
            </button>
            <button onClick={() => handleNav('location')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <KeyRound size={16} />
              <span>Location de Véhicules</span>
            </button>
            <button onClick={() => handleNav('vente')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <ShoppingBag size={16} />
              <span>Vente de Véhicules Certifiés</span>
            </button>
            <button onClick={() => handleNav('carnet-sante')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>Carnet de Santé Numérique</span>
            </button>
            <button onClick={() => handleNav('agence')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <MapPin size={16} />
              <span>Agence Bonamoussadi</span>
            </button>
            <button onClick={() => handleNav('espace-client')} className="btn-primary" style={{ justifyContent: 'center', marginTop: 10 }}>
              <UserCheck size={16} />
              <span>Espace Adhérent Client</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
