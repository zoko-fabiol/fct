import React, { useState } from 'react';
import {
  Home,
  ShieldCheck,
  UserCheck,
  Menu,
  X,
  KeyRound,
  ShoppingBag,
  MapPin,
  Globe,
  Handshake,
  User,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';
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

          {/* Liens de Navigation Desktop Multi-Pages — Tous harmonisés avec icônes taille 16 */}
          <nav className="fct-nav-links">
            <button
              onClick={() => handleNav('home')}
              className={`fct-nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            >
              <Home size={16} />
              <span>{t.home}</span>
            </button>
            <button
              onClick={() => handleNav('location')}
              className={`fct-nav-btn ${currentPage === 'location' ? 'active' : ''}`}
            >
              <KeyRound size={16} />
              <span>{t.rentals}</span>
            </button>
            <button
              onClick={() => handleNav('vente')}
              className={`fct-nav-btn ${currentPage === 'vente' ? 'active' : ''}`}
            >
              <ShoppingBag size={16} />
              <span>{t.sales}</span>
            </button>
            <button
              onClick={() => handleNav('carnet-sante')}
              className={`fct-nav-btn ${currentPage === 'carnet-sante' ? 'active' : ''}`}
            >
              <ShieldCheck size={16} />
              <span>{t.healthPassport}</span>
            </button>
            <button
              onClick={() => handleNav('agence')}
              className={`fct-nav-btn ${currentPage === 'agence' ? 'active' : ''}`}
            >
              <MapPin size={16} />
              <span>{t.agency}</span>
            </button>
          </nav>

          {/* Boutons d'Action, Devenir Partenaire, WhatsApp VIP & Espace Adhérent */}
          <div className="fct-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Bouton Toggle Langue (FR / EN) */}
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="fct-lang-btn"
                title={t.switchLang}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  height: 38,
                  padding: '0 10px',
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

            {/* Bouton Devenir Partenaire — Icône officielle de partenariat, dans le thème FCT */}
            <button
              type="button"
              onClick={() => handleNav('partenaires')}
              className={`fct-nav-partner-btn ${currentPage === 'partenaires' ? 'active' : ''}`}
              title={lang === 'en' ? 'Become a Partner (Earn 5% & 100k FCFA)' : 'Devenir Partenaire FCT (Commissions 5% & 100k FCFA)'}
              aria-label={lang === 'en' ? 'Become a Partner' : 'Devenir Partenaire'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 10,
                border: currentPage === 'partenaires' ? '1.5px solid var(--fct-blue-primary, #1e3a8a)' : '1.5px solid var(--border-medium, #cbd5e1)',
                backgroundColor: currentPage === 'partenaires' ? 'var(--fct-blue-primary, #1e3a8a)' : '#ffffff',
                color: currentPage === 'partenaires' ? '#ffffff' : 'var(--fct-blue-dark, #0f2a4a)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentPage === 'partenaires' ? '0 4px 12px rgba(30, 58, 138, 0.25)' : 'var(--shadow-sm)',
              }}
            >
              <Handshake size={19} />
            </button>

            {/* Bouton WhatsApp VIP — Icône WhatsApp pure sans texte */}
            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=Bonjour%20FCT%20Automobile,%20je%20souhaite%20un%20renseignement%20sur%20un%20véhicule.`}
              target="_blank"
              rel="noopener noreferrer"
              className="fct-nav-whatsapp-btn"
              title="WhatsApp VIP FCT Automobile (+237 690 00 00 00)"
              aria-label="WhatsApp VIP"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#25D366',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
              }}
            >
              <WhatsAppIcon size={20} color="#ffffff" />
            </a>

            {/* Bouton Espace Adhérent — Conservé avec icône et texte harmonisés */}
            <button
              onClick={() => handleNav('espace-client')}
              className={`btn-primary ${currentPage === 'espace-client' ? 'active' : ''}`}
              style={{ padding: '0 16px', height: 38, fontSize: 13 }}
            >
              <UserCheck size={16} />
              <span>{t.clientPortal}</span>
            </button>

            {/* Bouton Mon Profil & Paiements Mobile Money */}
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className={`fct-nav-partner-btn ${currentPage === 'profile' ? 'active' : ''}`}
              title={lang === 'en' ? 'My Profile & Payout Settings' : 'Mon Profil, Téléphones & Mobile Money'}
              aria-label={lang === 'en' ? 'My Profile' : 'Mon Profil'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 10,
                border: currentPage === 'profile' ? '1.5px solid var(--fct-blue-primary, #1e3a8a)' : '1.5px solid var(--border-medium, #cbd5e1)',
                backgroundColor: currentPage === 'profile' ? 'var(--fct-blue-primary, #1e3a8a)' : '#ffffff',
                color: currentPage === 'profile' ? '#ffffff' : 'var(--fct-blue-dark, #0f2a4a)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentPage === 'profile' ? '0 4px 12px rgba(30, 58, 138, 0.25)' : 'var(--shadow-sm)',
              }}
            >
              <User size={18} />
            </button>

            {/* Bouton Menu Burger Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-secondary fct-burger"
              style={{ width: 38, height: 38, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
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
              <Home size={16} />
              <span>{t.home}</span>
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
              <ShieldCheck size={16} />
              <span>{t.healthPassport}</span>
            </button>
            <button onClick={() => handleNav('agence')} className="fct-nav-btn" style={{ justifyContent: 'flex-start' }}>
              <MapPin size={16} />
              <span>{t.agency}</span>
            </button>
            <button
              onClick={() => handleNav('partenaires')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(15,42,74,0.06) 0%, rgba(30,58,138,0.09) 100%)',
                color: 'var(--fct-blue-dark, #0f2a4a)',
                fontWeight: 800,
                fontSize: 13,
                border: '1.5px solid rgba(15, 42, 74, 0.15)',
                cursor: 'pointer',
                margin: '4px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Handshake size={18} color="var(--fct-blue-primary, #1e3a8a)" />
                <span>{lang === 'en' ? 'Become a Partner (Earn 5% & 100k)' : 'Devenir Partenaire (Commissions 5% & 100k)'}</span>
              </div>
            </button>
            <button onClick={() => handleNav('espace-client')} className="btn-primary" style={{ justifyContent: 'center', marginTop: 10 }}>
              <UserCheck size={16} />
              <span>{t.clientPortal}</span>
            </button>
            <button
              onClick={() => handleNav('profile')}
              className="btn-secondary"
              style={{ justifyContent: 'center', marginTop: 6 }}
            >
              <User size={16} />
              <span>{lang === 'en' ? 'My Profile & Payouts' : 'Mon Profil & Paiements'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
