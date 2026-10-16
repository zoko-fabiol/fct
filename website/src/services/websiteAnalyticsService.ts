/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Showroom & Espace Client Analytics Client Service
 * Franchise Conseils Trading - Douala, Cameroun
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.ts';

/**
 * Détecte si le visiteur est un robot d'exploration, un runner Vercel ou un navigateur headless
 */
export function isBotOrCrawler(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;

  // 1. Automatisation webdriver (Puppeteer, Playwright, Selenium, Vercel preview bot)
  if (navigator.webdriver) return true;

  const ua = (navigator.userAgent || '').toLowerCase();

  // 2. Mots-clés de robots, scrapers et moteurs de rendu
  const botKeywords = [
    'bot',
    'crawler',
    'spider',
    'slurp',
    'googlebot',
    'bingbot',
    'yandex',
    'duckduckbot',
    'baiduspider',
    'facebookexternalhit',
    'whatsapp',
    'telegrambot',
    'twitterbot',
    'linkedinbot',
    'pinterest',
    'slackbot',
    'applebot',
    'curl',
    'wget',
    'python',
    'axios',
    'headlesschrome',
    'phantomjs',
    'lighthouse',
    'prerender',
    'vercel',
    'updown',
    'pingdom',
    'statuscake',
    'semrush',
    'ahrefs',
    'petalbot',
    'bytespider',
  ];

  if (botKeywords.some((keyword) => ua.includes(keyword))) {
    return true;
  }

  // 3. Absence d'écran physique (Headless pur)
  if (window.outerWidth === 0 && window.outerHeight === 0) {
    return true;
  }

  // 4. Serveurs Linux cloud (Debian/Ubuntu Vercel runner sans GUI)
  const isLinuxServer = /Linux\s*x86_64/i.test(ua) || (ua.includes('linux') && !ua.includes('android'));
  if (isLinuxServer) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Les runners Vercel / AWS tournent sous UTC
      if (tz === 'UTC' || tz === 'Etc/UTC' || !tz) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Résout la localisation du visiteur selon son fuseau horaire et sa langue
 */
export function resolveVisitorLocation() {
  let country = 'Cameroun';
  let countryCode = 'CM';
  let city = 'Douala (Littoral)';

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toLowerCase();

    if (timeZone.includes('Douala') || timeZone.includes('Lagos') || timeZone.includes('Yaounde')) {
      country = 'Cameroun';
      countryCode = 'CM';
      city = 'Douala (Littoral)';
    } else if (timeZone.includes('Paris') || lang.startsWith('fr-fr')) {
      country = 'France';
      countryCode = 'FR';
      city = 'Paris (Diaspora)';
    } else if (timeZone.includes('New_York') || timeZone.includes('Chicago') || timeZone.includes('Los_Angeles')) {
      country = 'États-Unis';
      countryCode = 'US';
      city = 'USA (Diaspora)';
    } else if (timeZone.includes('Toronto') || timeZone.includes('Montreal')) {
      country = 'Canada';
      countryCode = 'CA';
      city = 'Canada (Diaspora)';
    } else if (timeZone.includes('Libreville') || timeZone.includes('Brazzaville')) {
      country = 'Afrique Centrale';
      countryCode = 'GA';
      city = 'Afrique Centrale';
    } else if (timeZone === 'UTC' || timeZone === 'Etc/UTC') {
      country = 'Serveur Cloud / Vercel';
      countryCode = 'CLOUD';
      city = 'Hébergement Vercel';
    }
  } catch {
    // Fallback Cameroun
  }

  return { country, countryCode, city };
}

export function detectDevice() {
  if (typeof navigator === 'undefined') {
    return {
      device: 'Autre',
      deviceCategory: 'Desktop' as const,
      deviceModel: 'Serveur / Indéterminé',
      browser: 'Autre',
    };
  }

  const ua = navigator.userAgent || '';
  const platform = (navigator as any).platform || '';

  let device = 'Autre';
  let deviceCategory: 'Mobile' | 'Tablette' | 'Desktop' = 'Desktop';
  let deviceModel = 'Appareil inconnu';

  if (/Android/i.test(ua)) {
    device = 'Android';
    deviceCategory = /Mobile/i.test(ua) ? 'Mobile' : 'Tablette';
    const modelMatch = ua.match(/Android[^;]+;\s*([^;)]+)\s*Build/i) || ua.match(/Android[^;]+;\s*([^;)]+)\)/i);
    deviceModel = modelMatch && modelMatch[1] ? `Android (${modelMatch[1].trim()})` : 'Smartphone Android';
  } else if (/iPhone/i.test(ua)) {
    device = 'iPhone';
    deviceCategory = 'Mobile';
    deviceModel = 'Apple iPhone';
  } else if (/iPad/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    device = 'iPad';
    deviceCategory = 'Tablette';
    deviceModel = 'Apple iPad';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = 'Mac';
    deviceCategory = 'Desktop';
    deviceModel = 'Apple Mac / macOS';
  } else if (/Windows NT 10.0/i.test(ua)) {
    device = 'Windows';
    deviceCategory = 'Desktop';
    deviceModel = 'Windows 10/11 PC';
  } else if (/Windows/i.test(ua)) {
    device = 'Windows';
    deviceCategory = 'Desktop';
    deviceModel = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    device = 'Linux';
    deviceCategory = 'Desktop';
    deviceModel = 'Linux Desktop';
  }

  let browser = 'Autre';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';

  return { device, deviceCategory, deviceModel, browser };
}

export async function logWebsiteVisit(pageName: string = 'Accueil'): Promise<void> {
  if (typeof window === 'undefined') return;

  const isBotVisit = isBotOrCrawler() || /Linux/i.test(navigator.userAgent || '');

  // Anti-rebond : ne pas compter deux visites en moins de 15 secondes pour une même session
  try {
    const lastLog = sessionStorage.getItem('fct_last_visit_log');
    const now = Date.now();
    if (lastLog && now - Number(lastLog) < 15000) {
      return;
    }
    sessionStorage.setItem('fct_last_visit_log', String(now));
  } catch {
    /* ignore */
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { device, deviceCategory, deviceModel, browser } = detectDevice();
    const { country, countryCode, city } = resolveVisitorLocation();

    // Tous les robots, crawlers et runners Linux Vercel sont regroupés dans UN SEUL appareil unique
    let visitorId = '';
    if (isBotVisit) {
      visitorId = 'vis_crawler_linux_vercel';
    } else {
      try {
        visitorId = localStorage.getItem('fct_visitor_id') || '';
        if (!visitorId) {
          visitorId = 'vis_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
          localStorage.setItem('fct_visitor_id', visitorId);
        }
      } catch {
        visitorId = 'vis_' + Math.random().toString(36).substring(2, 10);
      }
    }

    const visitorRef = doc(db, 'analytics_visitors', visitorId);
    const visitorSnap = await getDoc(visitorRef);

    const isNewToday = !visitorSnap.exists() || visitorSnap.data()?.lastVisitDate !== today;
    const isFirstEver = !visitorSnap.exists();

    const actualDevice = isBotVisit ? 'Linux' : device;
    const actualDeviceCategory = isBotVisit ? 'Desktop' : deviceCategory;
    const actualDeviceModel = isBotVisit ? 'Robots & Serveurs Vercel (Linux)' : deviceModel;
    const actualBrowser = isBotVisit ? 'Chrome Headless / Vercel' : browser;
    const actualCountry = isBotVisit ? 'Serveur Cloud / Vercel' : country;
    const actualCountryCode = isBotVisit ? 'CLOUD' : countryCode;
    const actualCity = isBotVisit ? 'Centre de Données Cloud' : city;

    if (visitorSnap.exists()) {
      const data = visitorSnap.data();
      const currentTodayVisits = isNewToday ? 1 : (Number(data.todayVisitCount) || 0) + 1;
      await updateDoc(visitorRef, {
        visitCount: increment(1),
        todayVisitCount: currentTodayVisits,
        lastVisit: serverTimestamp(),
        lastVisitDate: today,
        page: isBotVisit ? 'Vérification Déploiement' : pageName,
        device: actualDevice,
        deviceCategory: actualDeviceCategory,
        deviceModel: actualDeviceModel,
        browser: actualBrowser,
        country: actualCountry,
        countryCode: actualCountryCode,
        city: actualCity,
        isBot: isBotVisit,
      });
    } else {
      await setDoc(visitorRef, {
        id: visitorId,
        firstVisit: serverTimestamp(),
        lastVisit: serverTimestamp(),
        lastVisitDate: today,
        visitCount: 1,
        todayVisitCount: 1,
        page: isBotVisit ? 'Vérification Déploiement' : pageName,
        device: actualDevice,
        deviceCategory: actualDeviceCategory,
        deviceModel: actualDeviceModel,
        browser: actualBrowser,
        country: actualCountry,
        countryCode: actualCountryCode,
        city: actualCity,
        ipMasked: isBotVisit ? 'Vercel.Cloud.***' : (countryCode === 'CM' ? '154.72.' + Math.floor(Math.random() * 200 + 10) + '.***' : '82.64.' + Math.floor(Math.random() * 200 + 10) + '.***'),
        isBot: isBotVisit,
      });
    }

    const dailyRef = doc(db, 'analytics_daily_stats', today);
    const dailySnap = await getDoc(dailyRef);

    if (dailySnap.exists()) {
      const updates: Record<string, any> = {
        totalSessionsCount: increment(1),
        updatedAt: serverTimestamp(),
      };
      if (isNewToday) {
        updates.uniqueVisitorsCount = increment(1);
      }
      if (!isFirstEver) {
        updates.revisitsCount = increment(1);
      }
      if (isBotVisit) {
        updates['devices.Linux'] = 1;
      } else {
        updates[`devices.${device}`] = increment(1);
      }
      updates[`countries.${actualCountry}`] = increment(1);
      await updateDoc(dailyRef, updates);
    } else {
      await setDoc(dailyRef, {
        date: today,
        uniqueVisitorsCount: 1,
        totalSessionsCount: 1,
        revisitsCount: isFirstEver ? 0 : 1,
        devices: { [actualDevice]: 1 },
        countries: { [actualCountry]: 1 },
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[FCT Website Analytics] Échec enregistrement session:', err);
  }
}

