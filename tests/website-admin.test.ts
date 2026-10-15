/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests Unitaires Administration Site Web & CMS
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WEBSITE_THEME,
  THEME_PRESETS,
  deepMergeWebsiteContent,
  WebsiteTheme,
} from '../src/services/websiteCmsService.ts';
import { detectDevice } from '../src/services/websiteAnalyticsService.ts';

describe('Administration Site Web & CMS FCT Automobile', () => {
  it('devrait définir les couleurs par défaut conformes à la charte officielle FCT', () => {
    expect(DEFAULT_WEBSITE_THEME.blueDark).toBe('#0f2a4a');
    expect(DEFAULT_WEBSITE_THEME.bluePrimary).toBe('#1e3a8a');
    expect(DEFAULT_WEBSITE_THEME.greenPrimary).toBe('#059669');
    expect(DEFAULT_WEBSITE_THEME.amberPrimary).toBe('#d97706');
    expect(DEFAULT_WEBSITE_THEME.bgPage).toBe('#f8fafc');
  });

  it('devrait inclure au moins 4 préréglages de thèmes prêts à l\'emploi', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(4);
    THEME_PRESETS.forEach((preset) => {
      expect(preset.name).toBeDefined();
      expect(preset.theme.blueDark).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.theme.bluePrimary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('devrait fusionner intelligemment les dictionnaires CMS sans écraser les clés non modifiées', () => {
    const defaultDict = {
      nav: {
        home: 'Accueil',
        rentals: 'Location',
        sales: 'Vente',
      },
      hero: {
        title: 'Titre Original',
        subtitle: 'Sous-titre Original',
      },
    };

    const customUpdate = {
      hero: {
        title: 'Nouveau Titre Personnalisé FCT',
      },
    };

    const merged = deepMergeWebsiteContent(defaultDict, customUpdate);

    // Titre modifié
    expect(merged.hero.title).toBe('Nouveau Titre Personnalisé FCT');
    // Sous-titre préservé intact
    expect(merged.hero.subtitle).toBe('Sous-titre Original');
    // Nav préservée intacte
    expect(merged.nav.home).toBe('Accueil');
    expect(merged.nav.rentals).toBe('Location');
  });

  it('devrait détecter l\'appareil et le navigateur avec des valeurs par défaut sécurisées', () => {
    const detection = detectDevice();
    expect(detection).toBeDefined();
    expect(['Mobile', 'Tablette', 'Desktop']).toContain(detection.deviceCategory);
    expect(typeof detection.device).toBe('string');
    expect(typeof detection.browser).toBe('string');
  });

  it('devrait effectuer le rendu du composant WebsiteAdminTab sans lever d\'exception', async () => {
    const React = await import('react');
    const ReactDOMServer = await import('react-dom/server');
    const { WebsiteAdminTab } = await import('../src/components/settings/WebsiteAdminTab.tsx');

    expect(() => {
      const html = ReactDOMServer.renderToString(React.createElement(WebsiteAdminTab));
      expect(html).toContain('Administration du Site Web FCT Automobile');
    }).not.toThrow();
  });
});
