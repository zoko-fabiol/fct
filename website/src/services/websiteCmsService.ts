/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Showroom & Espace Client CMS Client Service
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.ts';

export interface WebsiteTheme {
  blueDark: string;
  bluePrimary: string;
  blueLight: string;
  greenPrimary: string;
  amberPrimary: string;
  bgPage: string;
  bgSurface: string;
  textMain: string;
  textBody: string;
  borderSubtle: string;
}

export const DEFAULT_WEBSITE_THEME: WebsiteTheme = {
  blueDark: '#0f2a4a',
  bluePrimary: '#1e3a8a',
  blueLight: '#3b82f6',
  greenPrimary: '#059669',
  amberPrimary: '#d97706',
  bgPage: '#f8fafc',
  bgSurface: '#ffffff',
  textMain: '#0f172a',
  textBody: '#334155',
  borderSubtle: '#e2e8f0',
};

function hexToRgba(hex?: string, alpha: number = 0.1): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
    return `rgba(30, 58, 138, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyWebsiteThemeToDOM(theme: Partial<WebsiteTheme>): void {
  if (!theme || typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme.blueDark) {
    root.style.setProperty('--fct-blue-dark', theme.blueDark);
  }
  if (theme.bluePrimary) {
    root.style.setProperty('--fct-blue-primary', theme.bluePrimary);
    root.style.setProperty('--fct-blue-soft', hexToRgba(theme.bluePrimary, 0.08));
  }
  if (theme.blueLight) {
    root.style.setProperty('--fct-blue-light', theme.blueLight);
  }
  if (theme.greenPrimary) {
    root.style.setProperty('--fct-green-primary', theme.greenPrimary);
    root.style.setProperty('--fct-green-soft', hexToRgba(theme.greenPrimary, 0.08));
  }
  if (theme.amberPrimary) {
    root.style.setProperty('--fct-amber-primary', theme.amberPrimary);
    root.style.setProperty('--fct-amber-soft', hexToRgba(theme.amberPrimary, 0.08));
  }
  if (theme.bgPage) {
    root.style.setProperty('--bg-page', theme.bgPage);
    document.body.style.backgroundColor = theme.bgPage;
  }
  if (theme.bgSurface) {
    root.style.setProperty('--bg-surface', theme.bgSurface);
  }
  if (theme.textMain) {
    root.style.setProperty('--text-main', theme.textMain);
    document.body.style.color = theme.textMain;
  }
  if (theme.textBody) {
    root.style.setProperty('--text-body', theme.textBody);
  }
  if (theme.borderSubtle) {
    root.style.setProperty('--border-subtle', theme.borderSubtle);
  }
}

export function subscribeWebsiteTheme(callback: (theme: WebsiteTheme) => void): () => void {
  try {
    const docRef = doc(db, 'site_settings', 'theme');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const theme = { ...DEFAULT_WEBSITE_THEME, ...(snap.data() as Partial<WebsiteTheme>) };
          applyWebsiteThemeToDOM(theme);
          callback(theme);
        } else {
          applyWebsiteThemeToDOM(DEFAULT_WEBSITE_THEME);
          callback(DEFAULT_WEBSITE_THEME);
        }
      },
      (err) => {
        console.warn('[FCT Website CMS] Erreur écoute thème:', err);
        callback(DEFAULT_WEBSITE_THEME);
      }
    );
  } catch (err) {
    console.warn('[FCT Website CMS] Erreur init écouteur thème:', err);
    callback(DEFAULT_WEBSITE_THEME);
    return () => {};
  }
}

export function subscribeWebsiteContent(
  lang: 'fr' | 'en',
  callback: (content: Record<string, unknown> | null) => void
): () => void {
  try {
    const docRef = doc(db, 'site_content', lang);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as Record<string, unknown>);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn(`[FCT Website CMS] Erreur écoute contenu (${lang}):`, err);
        callback(null);
      }
    );
  } catch (err) {
    console.warn(`[FCT Website CMS] Erreur init écouteur contenu (${lang}):`, err);
    callback(null);
    return () => {};
  }
}

export function deepMergeWebsiteContent<T extends Record<string, any>>(base: T, override: Record<string, any> | null): T {
  if (!override) return base;
  const result: any = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(override)) {
    const val = override[key];
    if (val !== undefined && val !== null) {
      if (typeof val === 'object' && !Array.isArray(val) && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = deepMergeWebsiteContent(result[key], val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}
