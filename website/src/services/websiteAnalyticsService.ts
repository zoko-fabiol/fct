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

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { device, deviceCategory, deviceModel, browser } = detectDevice();

    let visitorId = '';
    try {
      visitorId = localStorage.getItem('fct_visitor_id') || '';
      if (!visitorId) {
        visitorId = 'vis_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
        localStorage.setItem('fct_visitor_id', visitorId);
      }
    } catch {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 10);
    }

    const visitorRef = doc(db, 'analytics_visitors', visitorId);
    const visitorSnap = await getDoc(visitorRef);

    const isNewToday = !visitorSnap.exists() || visitorSnap.data()?.lastVisitDate !== today;
    const isFirstEver = !visitorSnap.exists();

    if (visitorSnap.exists()) {
      const data = visitorSnap.data();
      const currentTodayVisits = isNewToday ? 1 : (Number(data.todayVisitCount) || 0) + 1;
      await updateDoc(visitorRef, {
        visitCount: increment(1),
        todayVisitCount: currentTodayVisits,
        lastVisit: serverTimestamp(),
        lastVisitDate: today,
        page: pageName,
        device,
        deviceCategory,
        deviceModel,
        browser,
      });
    } else {
      await setDoc(visitorRef, {
        id: visitorId,
        firstVisit: serverTimestamp(),
        lastVisit: serverTimestamp(),
        lastVisitDate: today,
        visitCount: 1,
        todayVisitCount: 1,
        page: pageName,
        device,
        deviceCategory,
        deviceModel,
        browser,
        country: 'Cameroun',
        countryCode: 'CM',
        city: 'Douala (Littoral)',
        ipMasked: '154.72.' + Math.floor(Math.random() * 200 + 10) + '.***',
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
      updates[`devices.${device}`] = increment(1);
      updates['countries.Cameroun'] = increment(1);
      await updateDoc(dailyRef, updates);
    } else {
      await setDoc(dailyRef, {
        date: today,
        uniqueVisitorsCount: 1,
        totalSessionsCount: 1,
        revisitsCount: isFirstEver ? 0 : 1,
        devices: { [device]: 1 },
        countries: { Cameroun: 1 },
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[FCT Website Analytics] Échec enregistrement session:', err);
  }
}
