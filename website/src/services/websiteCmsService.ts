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

export async function saveWebsiteTheme(theme: Partial<WebsiteTheme>): Promise<void> {
  try {
    const docRef = doc(db, 'site_settings', 'theme');
    await setDoc(docRef, theme, { merge: true });
  } catch (err) {
    console.warn('[FCT Website CMS] Erreur sauvegarde Firestore thème:', err);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('fct_cms_theme', JSON.stringify(theme));
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('fct_cms_channel');
      bc.postMessage({ type: 'CMS_THEME_UPDATE', theme });
      setTimeout(() => bc.close(), 100);
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && window.location) {
      const ports = ['3000', '3001', '3002'].filter((p) => p !== window.location.port);
      for (const port of ports) {
        fetch(`http://${window.location.hostname}:${port}/__cms_sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'CMS_THEME_UPDATE', theme }),
        }).catch(() => {});
      }
    }
  } catch {}
}

export function subscribeWebsiteTheme(callback: (theme: WebsiteTheme) => void): () => void {
  let unsubFirestore: () => void = () => {};
  try {
    const docRef = doc(db, 'site_settings', 'theme');
    unsubFirestore = onSnapshot(
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
  }

  let bc: BroadcastChannel | null = null;
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('fct_cms_channel');
      bc.onmessage = (event) => {
        const data = event.data;
        if (data?.type === 'CMS_THEME_UPDATE' && data.theme) {
          const theme = { ...DEFAULT_WEBSITE_THEME, ...(data.theme as Partial<WebsiteTheme>) };
          applyWebsiteThemeToDOM(theme);
          callback(theme);
        }
      };
    }
  } catch {}

  return () => {
    unsubFirestore();
    if (bc) bc.close();
  };
}

export async function saveWebsiteContent(lang: 'fr' | 'en', content: Record<string, unknown>): Promise<void> {
  try {
    const docRef = doc(db, 'site_content', lang);
    await setDoc(docRef, content, { merge: true });
  } catch (err) {
    console.warn(`[FCT Website CMS] Erreur écriture Firestore contenu (${lang}):`, err);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`fct_cms_content_${lang}`, JSON.stringify(content));
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('fct_cms_channel');
      bc.postMessage({ type: 'CMS_CONTENT_UPDATE', lang, content });
      setTimeout(() => bc.close(), 100);
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && window.location) {
      const ports = ['3000', '3001', '3002'].filter((p) => p !== window.location.port);
      for (const port of ports) {
        fetch(`http://${window.location.hostname}:${port}/__cms_sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'CMS_CONTENT_UPDATE', lang, content }),
        }).catch(() => {});
      }
    }
  } catch {}
}

export function subscribeWebsiteContent(
  lang: 'fr' | 'en',
  callback: (content: Record<string, unknown> | null) => void
): () => void {
  let unsubFirestore: () => void = () => {};
  try {
    const docRef = doc(db, 'site_content', lang);
    unsubFirestore = onSnapshot(
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
      }
    );
  } catch (err) {
    console.warn(`[FCT Website CMS] Erreur init écouteur contenu (${lang}):`, err);
  }

  let bc: BroadcastChannel | null = null;
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('fct_cms_channel');
      bc.onmessage = (event) => {
        const data = event.data;
        if (data?.type === 'CMS_CONTENT_UPDATE' && data.lang === lang && data.content) {
          callback(data.content as Record<string, unknown>);
        }
      };
    }
  } catch {}

  const storageHandler = (e: StorageEvent) => {
    if (e.key === `fct_cms_content_${lang}` && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler);
  }

  return () => {
    unsubFirestore();
    if (bc) bc.close();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageHandler);
    }
  };
}

export async function getWebsiteContent(lang: 'fr' | 'en'): Promise<Record<string, unknown> | null> {
  try {
    const docRef = doc(db, 'site_content', lang);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Record<string, unknown>;
    }
  } catch (err) {
    console.warn(`[FCT Website CMS] Erreur lecture Firestore contenu (${lang}):`, err);
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem(`fct_cms_content_${lang}`);
      if (cached) return JSON.parse(cached);
    }
  } catch {
    // Ignore
  }
  return null;
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
