/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service CMS & Personnalisation du Site Web Public
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Gère la synchronisation bidirectionnelle Firestore pour :
 * 1. Les textes multilingues dynamiques (site_content/fr & site_content/en)
 * 2. La palette de couleurs officielle (site_settings/theme)
 * Note stricte : Personnalisation des tuiles exclue par consigne métier.
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.ts';

export interface WebsiteTheme {
  blueDark: string;       // --fct-blue-dark (Entêtes, Hero, Footer)
  bluePrimary: string;    // --fct-blue-primary (Couleur de marque FCT principale)
  blueLight: string;      // --fct-blue-light (Accents vifs, liens hover)
  greenPrimary: string;   // --fct-green-primary (Boutons succès, badges vérifiés)
  amberPrimary: string;   // --fct-amber-primary (Or / Prestige, étoiles, mise en avant)
  bgPage: string;         // --bg-page (Fond général du site)
  bgSurface: string;      // --bg-surface (Cartes et conteneurs)
  textMain: string;       // --text-main (Titres et texte haute lisibilité)
  textBody: string;       // --text-body (Paragraphes et descriptions)
  borderSubtle: string;   // --border-subtle (Bordures discrètes)
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

export const THEME_PRESETS: { name: string; desc: string; theme: WebsiteTheme }[] = [
  {
    name: 'Bleu Nuit FCT (Officiel)',
    desc: 'Charte graphique officielle FCT Douala avec bleu impérial et or subtil.',
    theme: { ...DEFAULT_WEBSITE_THEME },
  },
  {
    name: 'Or Prestige & Saphir',
    desc: 'Nuances dorées chaudes et bleu saphir profond pour showroom haut de gamme.',
    theme: {
      blueDark: '#0a192f',
      bluePrimary: '#1d3557',
      blueLight: '#457b9d',
      greenPrimary: '#2a9d8f',
      amberPrimary: '#e9c46a',
      bgPage: '#faf8f5',
      bgSurface: '#ffffff',
      textMain: '#111827',
      textBody: '#374151',
      borderSubtle: '#e5e7eb',
    },
  },
  {
    name: 'Émeraude & Forêt Équatoriale',
    desc: 'Teintes vertes apaisantes inspirées de la zone CEMAC et finitions soignées.',
    theme: {
      blueDark: '#064e3b',
      bluePrimary: '#047857',
      blueLight: '#10b981',
      greenPrimary: '#059669',
      amberPrimary: '#f59e0b',
      bgPage: '#f7fee7',
      bgSurface: '#ffffff',
      textMain: '#064e3b',
      textBody: '#1f2937',
      borderSubtle: '#dcfce7',
    },
  },
  {
    name: 'Carbone Moderne & Nacre',
    desc: 'Contraste saisissant et finitions métalliques contemporaines.',
    theme: {
      blueDark: '#18181b',
      bluePrimary: '#27272a',
      blueLight: '#3b82f6',
      greenPrimary: '#10b981',
      amberPrimary: '#f59e0b',
      bgPage: '#f4f4f5',
      bgSurface: '#ffffff',
      textMain: '#09090b',
      textBody: '#27272a',
      borderSubtle: '#e4e4e7',
    },
  },
];

function hexToRgba(hex?: string, alpha: number = 0.1): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
    return `rgba(30, 58, 138, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Applique immédiatement les couleurs du thème aux variables CSS du document
 */
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

/**
 * Sauvegarde le thème dans Firestore (site_settings/theme)
 */
export async function saveWebsiteTheme(theme: Partial<WebsiteTheme>): Promise<void> {
  const docRef = doc(db, 'site_settings', 'theme');
  await setDoc(docRef, theme, { merge: true });
}

/**
 * Écoute en temps réel les changements de thème
 */
export function subscribeWebsiteTheme(callback: (theme: WebsiteTheme) => void): () => void {
  try {
    const docRef = doc(db, 'site_settings', 'theme');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback({ ...DEFAULT_WEBSITE_THEME, ...(snap.data() as Partial<WebsiteTheme>) });
        } else {
          callback(DEFAULT_WEBSITE_THEME);
        }
      },
      (err) => {
        console.warn('[FCT CMS] Erreur écoute thème:', err);
        callback(DEFAULT_WEBSITE_THEME);
      }
    );
  } catch (err) {
    console.warn('[FCT CMS] Erreur initialisation écouteur thème:', err);
    callback(DEFAULT_WEBSITE_THEME);
    return () => {};
  }
}

/**
 * Sauvegarde les textes du site pour une langue donnée (site_content/fr ou site_content/en)
 */
export async function saveWebsiteContent(lang: 'fr' | 'en', content: Record<string, unknown>): Promise<void> {
  const docRef = doc(db, 'site_content', lang);
  await setDoc(docRef, content, { merge: true });
}

/**
 * Écoute en temps réel les textes d'une langue
 */
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
        console.warn(`[FCT CMS] Erreur écoute contenu (${lang}):`, err);
        callback(null);
      }
    );
  } catch (err) {
    console.warn(`[FCT CMS] Erreur init écouteur contenu (${lang}):`, err);
    callback(null);
    return () => {};
  }
}

/**
 * Récupère le contenu enregistré d'une langue de manière asynchrone
 */
export async function getWebsiteContent(lang: 'fr' | 'en'): Promise<Record<string, unknown> | null> {
  try {
    const docRef = doc(db, 'site_content', lang);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch (err) {
    console.warn(`[FCT CMS] Erreur lecture contenu (${lang}):`, err);
    return null;
  }
}

export type WebsiteLanguage = 'fr' | 'en';

export const DEFAULT_WEBSITE_TRANSLATIONS = {
  fr: {
    nav: {
      home: 'Accueil',
      rentals: 'Location',
      sales: 'Vente',
      healthPassport: 'Carnet de Santé',
      agency: 'Notre Agence',
      whatsapp: 'WhatsApp VIP',
      clientPortal: 'Espace Adhérent',
      switchLang: 'Passer en Anglais',
    },
    footer: {
      aboutText: 'Société leader à Douala pour la location de SUV, 4x4 et berlines de prestige, la vente certifiée en 110 points et le suivi numérique de santé technique.',
      colFleet: 'Flotte & Services',
      withDriver: 'Location avec Chauffeur',
      withoutDriver: 'Location sans Chauffeur',
      certifiedSales: 'Vente de Véhicules Certifiés',
      healthPassport: 'Carnet de Santé Numérique',
      clientPortal: 'Espace Adhérent Client',
      colCompany: 'L\'Entreprise',
      agencyBonamoussadi: 'Agence Bonamoussadi',
      hoursAndMap: 'Horaires & Plan d\'Accès',
      whatsappVip: 'Contact WhatsApp VIP',
      directLine: 'Ligne Directe Douala',
      colLocation: 'Nous Trouver',
      tel: 'Tél :',
      emergency: 'Urgences :',
      copyright: 'Franchise Conseils Trading (FCT) Automobile Douala. Tous droits réservés.',
      officialPortal: 'Portail Officiel FCT Cameroun · RC/DLA/2020/B/1458',
    },
    home: {
      badge: 'PRESTIGE & CONFIANCE AUTOMOBILE À DOUALA',
      heroTitle: 'Louez ou Achetez des Véhicules d\'Exception à Douala',
      heroSubtitle: 'Parc automobile haut de gamme certifié, service chauffeur VIP bilingue, transparence comptable et carnet de santé numérique infalsifiable.',
      exploreFleet: 'Explorer la Flotte',
      viewSales: 'Véhicules en Vente',
      kpi1Title: 'Véhicules Certifiés',
      kpi1Sub: 'Inspectés en 110 points',
      kpi2Title: 'Caution Sécurisée',
      kpi2Sub: 'Restitution immédiate',
      kpi3Title: 'Assistance 24/7',
      kpi3Sub: 'Douala & Axes lourds',
      featuredVehicles: 'Véhicules Disponibles Immédiatement',
      featuredSubtitle: 'Sélectionnés pour leur fiabilité et leur confort sur les routes camerounaises',
      allCategories: 'Toutes Catégories',
      viewAllFleet: 'Voir Toute la Flotte',
      healthBannerTitle: 'Consultez le Carnet de Santé Numérique',
      healthBannerDesc: 'Transparence absolue : visualisez l\'historique d\'entretien complet, le kilométrage certifié et les révisions de chaque véhicule de notre flotte.',
      checkPlate: 'Vérifier une plaque',
      whyChooseUs: 'L\'Excellence FCT Automobile à Douala',
      reason1Title: 'Flotte Récente & Entretenue',
      reason1Desc: 'Toyota Prado TXL, Fortuner, Hilux Revo, RAV4 et berlines de prestige garantis sans défaut technique.',
      reason2Title: 'Chauffeurs Professionnels Agréés',
      reason2Desc: 'Conducteurs expérimentés, courtois et bilingues (FR/EN) connaissant parfaitement Douala et les axes interurbains.',
      reason3Title: 'Transparence & Zéro Surprise',
      reason3Desc: 'Contrats formels CEMAC, tarification claire en FCFA, reçus de caisse certifiés et restitution garantie de caution.',
    },
    rental: {
      title: 'Location de Véhicules de Prestige à Douala',
      subtitle: 'Pour vos déplacements d\'affaires, délégations, séjours touristiques ou cérémonies officielles.',
      filterAll: 'Tous les Véhicules',
      filterSuv: 'SUV & 4x4',
      filterBerline: 'Berlines VIP',
      filterPickup: 'Pick-up Utilitaires',
      dayRate: 'Jour',
      deposit: 'Caution :',
      withDriverOpt: 'Option Chauffeur VIP disponible (+15 000 FCFA/jour)',
      bookCTA: 'Réserver ce Véhicule',
      detailsCTA: 'Détails & Photos',
      noVehicles: 'Aucun véhicule ne correspond aux filtres actuels.',
    },
    sales: {
      title: 'Véhicules Certifiés en Vente Comptant',
      subtitle: 'Achetez en toute sérénité : historique vérifié, carnet technique complet et immatriculation légale au Cameroun.',
      filterAll: 'Tous les Modèles',
      salePrice: 'Prix Comptant :',
      mileage: 'Kilométrage :',
      year: 'Année :',
      fuel: 'Carburant :',
      contactForTest: 'Demander un Essai',
      viewShowroom: 'Voir la Fiche Complète',
      warrantyIncluded: 'Garantie mécanique 6 mois incluse avec suivi atelier FCT.',
    },
    agency: {
      title: 'Notre Agence FCT Automobile à Douala',
      subtitle: 'Idéalement située au Carrefour Santa Barbara à Bonamoussadi, au cœur du pôle résidentiel et d\'affaires.',
      addressTitle: 'Adresse Physique',
      addressDesc: 'Carrefour Santa Barbara, Boulevard Principal de Bonamoussadi, Douala, Cameroun',
      landmark: 'En face de la station TotalEnergies Santa Barbara',
      openingHoursTitle: 'Horaires d\'Ouverture',
      weekdays: 'Lundi au Vendredi : 07h30 – 19h00',
      saturday: 'Samedi : 08h00 – 18h00',
      sunday: 'Dimanche & Jours fériés : 09h00 – 16h00 (Permanence VIP)',
      contactDesk: 'Accueil Téléphonique',
      hotline: 'Ligne directe : +237 699 45 88 12',
      whatsappDesk: 'WhatsApp commercial : +237 677 12 34 56',
      email: 'E-mail : contact@fct-automobile.cm',
    },
  },
  en: {
    nav: {
      home: 'Home',
      rentals: 'Rental',
      sales: 'Sales',
      healthPassport: 'Health Record',
      agency: 'Our Agency',
      whatsapp: 'VIP WhatsApp',
      clientPortal: 'Client Portal',
      switchLang: 'Switch to French',
    },
    footer: {
      aboutText: 'Leading automotive provider in Douala for luxury SUV, 4x4 and executive sedan rentals, 110-point certified vehicle sales and digital maintenance traceability.',
      colFleet: 'Fleet & Services',
      withDriver: 'Rental with Chauffeur',
      withoutDriver: 'Self-Drive Rental',
      certifiedSales: 'Certified Vehicle Sales',
      healthPassport: 'Digital Health Record',
      clientPortal: 'Client Member Portal',
      colCompany: 'Company',
      agencyBonamoussadi: 'Bonamoussadi Agency',
      hoursAndMap: 'Opening Hours & Map',
      whatsappVip: 'VIP WhatsApp Contact',
      directLine: 'Douala Direct Hotline',
      colLocation: 'Locate Us',
      tel: 'Tel:',
      emergency: 'Emergency:',
      copyright: 'Franchise Conseils Trading (FCT) Automobile Douala. All rights reserved.',
      officialPortal: 'Official FCT Cameroon Portal · RC/DLA/2020/B/1458',
    },
    home: {
      badge: 'PRESTIGE & AUTOMOTIVE TRUST IN DOUALA',
      heroTitle: 'Rent or Buy Premium Vehicles in Douala',
      heroSubtitle: 'Certified high-end vehicle fleet, bilingual VIP chauffeur services, full accounting transparency and tamper-proof digital health records.',
      exploreFleet: 'Explore Fleet',
      viewSales: 'Vehicles for Sale',
      kpi1Title: 'Certified Fleet',
      kpi1Sub: '110-point technical check',
      kpi2Title: 'Secured Deposit',
      kpi2Sub: 'Immediate reimbursement',
      kpi3Title: '24/7 Road Assistance',
      kpi3Sub: 'Douala & intercity corridors',
      featuredVehicles: 'Immediately Available Vehicles',
      featuredSubtitle: 'Hand-picked for reliability, comfort and road resilience across Cameroon',
      allCategories: 'All Categories',
      viewAllFleet: 'View Full Fleet',
      healthBannerTitle: 'Check the Digital Vehicle Health Record',
      healthBannerDesc: 'Full transparency: examine complete workshop logs, certified odometer readings and service history for every vehicle in our fleet.',
      checkPlate: 'Verify a license plate',
      whyChooseUs: 'The FCT Automobile Commitment in Douala',
      reason1Title: 'Recent & Flawlessly Maintained Fleet',
      reason1Desc: 'Toyota Prado TXL, Fortuner, Hilux Revo, RAV4 and executive sedans tested to ensure top technical condition.',
      reason2Title: 'Certified Professional Chauffeurs',
      reason2Desc: 'Courteous, bilingual (EN/FR) drivers with extensive knowledge of Douala and regional transport corridors.',
      reason3Title: 'Transparency & Zero Hidden Fees',
      reason3Desc: 'Official CEMAC-compliant agreements, clear XAF pricing, certified cash register receipts and guaranteed security deposit return.',
    },
    rental: {
      title: 'Luxury & Reliable Car Rental in Douala',
      subtitle: 'Tailored for corporate missions, official delegations, tourism or special VIP ceremonies.',
      filterAll: 'All Vehicles',
      filterSuv: 'SUVs & 4x4s',
      filterBerline: 'VIP Sedans',
      filterPickup: 'Utility Pickups',
      dayRate: 'Day',
      deposit: 'Deposit:',
      withDriverOpt: 'VIP Chauffeur option available (+15,000 XAF/day)',
      bookCTA: 'Book This Vehicle',
      detailsCTA: 'Details & Photos',
      noVehicles: 'No vehicles match current filters.',
    },
    sales: {
      title: 'Certified Vehicles for Direct Sale',
      subtitle: 'Purchase with confidence: verified history, complete maintenance booklet and official Cameroon registration.',
      filterAll: 'All Models',
      salePrice: 'Cash Price:',
      mileage: 'Odometer:',
      year: 'Year:',
      fuel: 'Fuel:',
      contactForTest: 'Request Test Drive',
      viewShowroom: 'View Full Specs',
      warrantyIncluded: '6-month mechanical warranty included with FCT workshop coverage.',
    },
    agency: {
      title: 'Our FCT Automobile Agency in Douala',
      subtitle: 'Conveniently located at Carrefour Santa Barbara in Bonamoussadi, in the prime residential & business district.',
      addressTitle: 'Physical Address',
      addressDesc: 'Carrefour Santa Barbara, Main Boulevard of Bonamoussadi, Douala, Cameroon',
      landmark: 'Directly opposite TotalEnergies Santa Barbara station',
      openingHoursTitle: 'Business Hours',
      weekdays: 'Monday to Friday: 07:30 AM – 07:00 PM',
      saturday: 'Saturday: 08:00 AM – 06:00 PM',
      sunday: 'Sunday & Public Holidays: 09:00 AM – 04:00 PM (VIP on-duty)',
      contactDesk: 'Contact Desk',
      hotline: 'Direct Hotline: +237 699 45 88 12',
      whatsappDesk: 'Commercial WhatsApp: +237 677 12 34 56',
      email: 'Email: contact@fct-automobile.cm',
    },
  },
};

/**
 * Fusionne en profondeur deux objets de dictionnaires de traduction
 */
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

