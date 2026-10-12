import React, { useState } from 'react';
import { Car, Phone, ShieldCheck, UserCheck, Menu, X, MessageSquare, KeyRound, ShoppingBag, MapPin, Globe } from 'lucide-react';
import { AppPage } from '../types/router.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  lang?: WebsiteLanguage;
  onToggleLang?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  lang = 'fr',
  onToggleLang,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = websiteTranslations[lang].nav;

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
          <button onClick={() => handleNav('home')} className="fct-brand" style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
            <img
              src="/fct-logo.png"
              alt="FCT - Franchise Conseils Trading Automobile Douala"
              style={{
                height: 46,
                width: 'auto',
                maxWidth: 200,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </button>

          {/* Liens de Navigation Desktop Multi-Pages */}
          <nav className="fct-nav-links">
            <button
              onClick={() => handleNav('home')}
              className={`fct-nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            >
              {t.home}
            </button>
            <button
              onClick={() => handleNav('location')}
              className={`fct-nav-btn ${currentPage === 'location' ? 'active' : ''}`}
            >
              <KeyRound size={15} />
              <span>{t.rentals}</span>
            </button>
            <button
              onClick={() => handleNav('vente')}
              className={`fct-nav-btn ${currentPage === 'vente' ? 'active' : ''}`}
            >
              <ShoppingBag size={15} />
              <span>{t.sales}</span>
            </button>
            <button
              onClick={() => handleNav('carnet-sante')}
              className={`fct-nav-btn ${currentPage === 'carnet-sante' ? 'active' : ''}`}
            >
              <ShieldCheck size={15} color="#059669" />
              <span>{t.healthPassport}</span>
            </button>
            <button
              onClick={() => handleNav('agence')}
              className={`fct-nav-btn ${currentPage === 'agence' ? 'active' : ''}`}
            >
              <MapPin size={15} />
              <span>{t.agency}</span>
            </button>
          </nav>

          {/* Boutons d'Action, Espace Adhérent & Sélecteur de Langue */}
          <div className="fct-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Bouton Toggle Langue (FR / EN) */}
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="fct-lang-btn"
                title={t.switchLang}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 11px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Globe size={14} color="#0284c7" />
                <span style={{ letterSpacing: '0.5px' }}>{lang.toUpperCase()}</span>
              </button>
            )}

            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=Bonjour%20FCT%20Automobile,%20je%20souhaite%20un%20renseignement%20sur%20un%20véhicule.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald"
              style={{ padding: '9px 16px', fontSize: 13 }}
            >
              <MessageSquare size={15} />
              <span>{t.whatsapp}</span>
            </a>

            <button
              onClick={() => handleNav('espace-client')}
              className={`btn-primary ${currentPage === 'espace-client' ? 'active' : ''}`}
              style={{ padding: '9px 18px', fontSize: 13 }}
            >
              <UserCheck size={15} />
              <span>{t.clientPortal}</span>
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
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="fct-nav-btn"
                style={{ justifyContent: 'space-between', backgroundColor: '#f1f5f9', fontWeight: 800 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Globe size={16} color="#0284c7" />
                  <span>{lang === 'fr' ? 'Langue : Français (Passer en EN)' : 'Language: English (Switch to FR)'}</span>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: '#0284c7', color: 'white', fontSize: 11 }}>
                  {lang.toUpperCase()}
                </span>
              </button>
            )}
            <button onClick={() => handleNav('home')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              {t.home}
            </button>
            <button onClick={() => handleNav('location')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <KeyRound size={16} />
              <span>{t.rentals}</span>
            </button>
            <button onClick={() => handleNav('vente')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <ShoppingBag size={16} />
              <span>{t.sales}</span>
            </button>
            <button onClick={() => handleNav('carnet-sante')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>{t.healthPassport}</span>
            </button>
            <button onClick={() => handleNav('agence')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <MapPin size={16} />
              <span>{t.agency}</span>
            </button>
            <button onClick={() => handleNav('espace-client')} className="btn-primary" style={{ justifyContent: 'center', marginTop: 10 }}>
              <UserCheck size={16} />
              <span>{t.clientPortal}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
