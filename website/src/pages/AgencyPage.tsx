import React from 'react';
import { MapPin, Phone, Clock, Mail, MessageSquare, ShieldCheck, Navigation } from 'lucide-react';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';

interface AgencyPageProps {
  lang?: WebsiteLanguage;
}

export const AgencyPage: React.FC<AgencyPageProps> = ({ lang = 'fr' }) => {
  const t = websiteTranslations[lang].agency;
  const isEn = lang === 'en';

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className="fct-page-header">
        <div className="fct-container">
          <span className="fct-badge fct-badge-green">
            {isEn ? 'Douala Headquarters & Showroom' : 'Siège & Showroom Douala'}
          </span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
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
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>
                    {t.addressTitle} :
                  </strong>
                  <p style={{ color: 'var(--text-body)', marginTop: 2 }}>{t.addressDesc}</p>
                  <p style={{ color: 'var(--fct-green-primary)', fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                    {t.landmark}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>
                    {t.openingHoursTitle} :
                  </strong>
                  <p style={{ color: 'var(--text-body)', marginTop: 2 }}>{t.weekdays}</p>
                  <p style={{ color: 'var(--text-body)', marginTop: 1 }}>{t.saturday}</p>
                  <p style={{ color: 'var(--fct-blue-primary)', fontWeight: 600, marginTop: 1 }}>{t.sunday}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>
                    {t.contactDesk} :
                  </strong>
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
                    {isEn ? '24/7 Roadside Assistance: +237 677 12 34 56' : FCT_AGENCY_INFO.emergency}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fct-blue-soft)', color: 'var(--fct-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={22} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--fct-blue-dark)' }}>
                    {isEn ? 'Corporate Email:' : 'Courriel Professionnel :'}
                  </strong>
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
              <Navigation size={32} />
            </div>
            <h4 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 8 }}>
              {isEn ? 'Easy Access in Bonamoussadi' : 'Accès Facile à Bonamoussadi'}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 24 }}>
              {isEn
                ? 'Prime location at Carrefour Santa Barbara with dedicated customer parking and immediate vehicle pickup.'
                : 'Emplacement stratégique au Carrefour Santa Barbara avec parking sécurisé pour vos véhicules de location et d\'essai.'}
            </p>
            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=${encodeURIComponent(
                isEn ? 'Hello FCT Automobile, I would like to locate your agency.' : 'Bonjour FCT Automobile, je souhaite obtenir l\'itinéraire vers votre agence.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald"
              style={{ display: 'inline-flex', width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}
            >
              <MessageSquare size={18} />
              <span>{isEn ? 'Open WhatsApp Chat' : 'Contacter sur WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
