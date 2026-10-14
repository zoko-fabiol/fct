import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppPage } from '../types/router.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
  lang?: WebsiteLanguage;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, lang = 'fr' }) => {
  const t = websiteTranslations[lang].footer;

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
              {t.aboutText}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {FCT_AGENCY_INFO.legalInfo}
            </p>
          </div>

          {/* Colonne 2 : Liens Location & Vente */}
          <div className="fct-footer-col">
            <h4>{t.colFleet}</h4>
            <ul className="fct-footer-links">
              <li><button onClick={() => handleNav('location')}>{t.withDriver}</button></li>
              <li><button onClick={() => handleNav('location')}>{t.withoutDriver}</button></li>
              <li><button onClick={() => handleNav('vente')}>{t.certifiedSales}</button></li>
              <li><button onClick={() => handleNav('carnet-sante')} style={{ color: 'var(--fct-green-primary)', fontWeight: 700 }}>{t.healthPassport}</button></li>
              <li><button onClick={() => handleNav('espace-client')}>{t.clientPortal}</button></li>
              <li><button onClick={() => handleNav('partenaires')} style={{ color: '#d97706', fontWeight: 700 }}>{lang === 'en' ? 'Partners & Affiliation' : 'Programme Partenaires & Affiliés'}</button></li>
            </ul>
          </div>

          {/* Colonne 3 : L'Agence */}
          <div className="fct-footer-col">
            <h4>{t.colCompany}</h4>
            <ul className="fct-footer-links">
              <li><button onClick={() => handleNav('agence')}>{t.agencyBonamoussadi}</button></li>
              <li><button onClick={() => handleNav('agence')}>{t.hoursAndMap}</button></li>
              <li><a href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer">{t.whatsappVip}</a></li>
              <li><a href={`tel:${FCT_AGENCY_INFO.phone1}`}>{t.directLine}</a></li>
            </ul>
          </div>

          {/* Colonne 4 : Localisation Directe */}
          <div className="fct-footer-col">
            <h4>{t.colLocation}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 700, marginBottom: 4 }}>
              {FCT_AGENCY_INFO.address}
            </p>
            <p style={{ fontSize: 12, color: 'var(--fct-green-primary)', marginBottom: 14 }}>
              {FCT_AGENCY_INFO.landmark}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <span>{t.tel} <strong>{FCT_AGENCY_INFO.phone1}</strong></span>
              <span>{t.emergency} <strong>{FCT_AGENCY_INFO.phone2}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>{FCT_AGENCY_INFO.email}</span>
            </div>
          </div>
        </div>

        {/* Barre Inférieure */}
        <div className="fct-footer-bottom">
          <div>
            © {new Date().getFullYear()} {t.copyright}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={15} color="#059669" />
            <span>{t.officialPortal}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
