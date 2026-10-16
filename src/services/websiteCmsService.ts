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
 * Sauvegarde le thème dans Firestore (site_settings/theme) avec diffusion multi-canal immédiate
 */
export async function saveWebsiteTheme(theme: Partial<WebsiteTheme>): Promise<void> {
  try {
    const docRef = doc(db, 'site_settings', 'theme');
    await setDoc(docRef, theme, { merge: true });
  } catch (err) {
    console.warn('[FCT CMS] Erreur sauvegarde Firestore thème:', err);
  }

  // 1. Cache LocalStorage immédiat
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('fct_cms_theme', JSON.stringify(theme));
    }
  } catch {
    // Ignore
  }

  // 2. Diffusion BroadcastChannel (onglets même origine)
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('fct_cms_channel');
      bc.postMessage({ type: 'CMS_THEME_UPDATE', theme });
      setTimeout(() => bc.close(), 100);
    }
  } catch {
    // Ignore
  }

  // 3. Pont temps réel local inter-ports (Port 3000 ⇄ Port 3001)
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
  } catch {
    // Ignore
  }
}

/**
 * Écoute en temps réel les changements de thème (Firestore + BroadcastChannel + Storage)
 */
export function subscribeWebsiteTheme(callback: (theme: WebsiteTheme) => void): () => void {
  let unsubFirestore: () => void = () => {};
  try {
    const docRef = doc(db, 'site_settings', 'theme');
    unsubFirestore = onSnapshot(
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
  }

  let bc: BroadcastChannel | null = null;
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('fct_cms_channel');
      bc.onmessage = (event) => {
        const data = event.data;
        if (data?.type === 'CMS_THEME_UPDATE' && data.theme) {
          callback({ ...DEFAULT_WEBSITE_THEME, ...(data.theme as Partial<WebsiteTheme>) });
        }
      };
    }
  } catch {
    // Ignore
  }

  return () => {
    unsubFirestore();
    if (bc) bc.close();
  };
}

/**
 * Sauvegarde les textes du site pour une langue donnée (site_content/fr ou site_content/en)
 * avec diffusion multi-canal immédiate sans rechargement
 */
export async function saveWebsiteContent(lang: 'fr' | 'en', content: Record<string, unknown>): Promise<void> {
  // 1. Sauvegarde Cloud Firestore
  try {
    const docRef = doc(db, 'site_content', lang);
    await setDoc(docRef, content, { merge: true });
  } catch (err) {
    console.warn(`[FCT CMS] Erreur écriture Firestore contenu (${lang}):`, err);
  }

  // 2. Cache LocalStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`fct_cms_content_${lang}`, JSON.stringify(content));
    }
  } catch {
    // Ignore
  }

  // 3. Diffusion BroadcastChannel (onglets même origine)
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('fct_cms_channel');
      bc.postMessage({ type: 'CMS_CONTENT_UPDATE', lang, content });
      setTimeout(() => bc.close(), 100);
    }
  } catch {
    // Ignore
  }

  // 4. Pont temps réel local inter-ports (Port 3000 ⇄ Port 3001)
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
  } catch {
    // Ignore
  }
}

/**
 * Écoute en temps réel les textes d'une langue (Firestore + BroadcastChannel + Storage)
 */
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
        console.warn(`[FCT CMS] Erreur écoute contenu (${lang}):`, err);
      }
    );
  } catch (err) {
    console.warn(`[FCT CMS] Erreur init écouteur contenu (${lang}):`, err);
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
  } catch {
    // Ignore
  }

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

/**
 * Récupère le contenu enregistré d'une langue de manière asynchrone
 */
export async function getWebsiteContent(lang: 'fr' | 'en'): Promise<Record<string, unknown> | null> {
  try {
    const docRef = doc(db, 'site_content', lang);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Record<string, unknown>;
    }
  } catch (err) {
    console.warn(`[FCT CMS] Erreur lecture Firestore contenu (${lang}):`, err);
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
      badge: 'DOUALA · CARREFOUR SANTA BARBARA, BONAMOUSSADI',
      heroTitle: "L'Automobile de Prestige à Douala, en Location & Vente Certifiée.",
      heroSubtitle: 'Parc automobile haut de gamme certifié, service chauffeur VIP bilingue, transparence comptable et carnet de santé numérique infalsifiable.',
      exploreFleet: 'Explorer la Flotte',
      viewSales: 'Véhicules en Vente',
      healthPassportBtn: 'Carnet de Santé',
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
    showroom: {
      back: 'Retour aux Véhicules',
      certifiedFCT: 'Certifié FCT Douala',
      specsTitle: 'Caractéristiques Techniques',
      brand: 'Marque',
      model: 'Modèle',
      year: 'Année',
      transmission: 'Boîte de Vitesse',
      fuel: 'Carburant',
      mileage: 'Kilométrage',
      seats: 'Places Assises',
      status: 'Disponibilité',
      available: 'Disponible Immédiatement',
      rented: 'En cours de location',
      ratesTitle: 'Conditions Tarifaires',
      dailyRental: 'Tarif location / jour',
      depositRequired: 'Caution obligatoire consignée',
      fullPurchase: 'Prix d\'achat comptant',
      includedServices: 'Services Inclus',
      insurance: 'Assurance tous risques zone CEMAC',
      maintenanceFree: 'Entretien & vidanges pris en charge',
      assistance24: 'Assistance dépannage 24/7 sur Douala',
      bookNow: 'Confirmer la Réservation',
      contactWhatsapp: 'Contacter via WhatsApp',
      requestTestDrive: 'Programmer un Essai Routier',
      namePlaceholder: 'Votre nom complet...',
      phonePlaceholder: 'Téléphone WhatsApp (+237)...',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      withDriverCheckbox: 'Ajouter un chauffeur dédié (+15 000 FCFA/j)',
      submitBooking: 'Envoyer ma Demande de Réservation',
      successNotice: 'Votre demande a été enregistrée ! Un conseiller FCT vous contacte dans les 15 minutes.',
    },
    health: {
      title: 'Carnet de Santé Numérique Automobile',
      subtitle: 'Transparence totale et traçabilité inviolable des interventions techniques de la flotte FCT.',
      searchPlaceholder: 'Entrez une plaque d\'immatriculation (ex: LT-8841-CE)...',
      searchBtn: 'Rechercher le Carnet',
      vehicleFound: 'Véhicule Certifié par Franchise Conseils Trading',
      generalCondition: 'État Général Contrôlé',
      mileageCertified: 'Kilométrage Certifié',
      interventionsCount: 'Interventions Répertoriées',
      allClear: '100% Conforme aux Normes de Sécurité',
      historyTitle: 'Historique des Entretiens & Remplacements de Pièces',
      colDate: 'Date',
      colIntervention: 'Opération Effectuée',
      colGarage: 'Atelier / Garage',
      colMileage: 'Kilométrage',
      colParts: 'Pièces Remplacées',
      colCertificate: 'Validation FCT',
      certifiedStamp: 'Certifié Authentique',
      noRecords: 'Aucun enregistrement trouvé pour cette plaque.',
    },
    portal: {
      title: 'Espace Adhérent & Suivi des Dossiers',
      subtitle: 'Consultez vos locations actives, téléchargez vos factures certifiées et gérez vos cautions consignées.',
      phoneOrEmail: 'Téléphone ou E-mail client :',
      passwordPlaceholder: 'Mot de passe secret :',
      loginBtn: 'Accéder à mon Espace',
      welcome: 'Bienvenue dans votre espace,',
      activeContracts: 'Contrats de Location en Cours',
      pastContracts: 'Historique des Locations & Factures',
      contractNumber: 'Contrat n°',
      vehicle: 'Véhicule :',
      period: 'Période :',
      depositHeld: 'Caution consignée :',
      downloadInvoice: 'Télécharger la Facture PDF',
      extendContract: 'Demander une Prolongation',
      noActiveContract: 'Vous n\'avez aucun contrat actif pour le moment.',
      logout: 'Déconnexion',
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
    partners: {
      heroBadge: "Réseau d'Affiliation FCT Automobile Douala",
      heroTitle: "Devenez Apporteur d’Affaires FCT Automobile",
      heroSubtitle: "Monétisez votre carnet d’adresses à Douala et au Cameroun. Partagez nos véhicules certifiés et touchez vos commissions immédiatement par Orange Money, MTN MoMo ou à la caisse de l’agence.",
      connectedPartner: 'Partenaire Actif',
      joinNetwork: 'Rejoindre le Réseau Officiel FCT',
      joinSubtitle: 'Rentabilisez votre relationnel sans aucun stock ni investissement',
      pillar1Title: 'Location : 5% Direct',
      pillar1Desc: 'Touchez 5% de commission brute sur le montant total de chaque contrat de location validé.',
      pillar2Title: 'Vente : 100 000 FCFA',
      pillar2Desc: 'Prime forfaitaire garantie de 100 000 FCFA sur chaque vente de véhicule conclue via votre code.',
      pillar3Title: 'Paiement Mobile 24h',
      pillar3Desc: 'Virements directs sur Orange Money, MTN MoMo ou retrait en espèces à l’agence de Bonamoussadi.',
      pillar4Title: 'Partage 1-Clic Fluide',
      pillar4Desc: 'Fiches techniques et photos haute résolution préformatées pour vos statuts WhatsApp.',
      stepsTitle: 'Comment démarrer en 3 étapes :',
      step1Title: 'Créez votre profil en 30 secondes',
      step1Desc: 'Renseignez votre numéro WhatsApp et choisissez votre mode de paiement mobile.',
      step2Title: 'Obtenez votre Code Partenaire unique',
      step2Desc: 'Votre code d’apporteur d’affaires et vos liens personnalisés sont activés instantanément.',
      step3Title: 'Partagez sur WhatsApp & Encaissez',
      step3Desc: 'Publiez nos véhicules sur vos statuts. Dès validation du contrat, vos gains sont crédités.',
      createAccountTab: 'Créer un Compte',
      signInTab: 'Connexion',
      fullNameLabel: 'Nom & Prénom *',
      whatsappLabel: 'Numéro Téléphone WhatsApp *',
      payoutMethodLabel: 'Versement des Gains',
      cityLabel: 'Ville de Résidence',
      emailLabel: 'Adresse Email *',
      passwordLabel: 'Mot de Passe *',
      forgotPassword: 'Mot de passe oublié ?',
      registerSubmitBtn: 'Activer mon Compte Partenaire',
      loginSubmitBtn: 'Accéder à mon Espace Partenaire',
      dashboardWelcome: 'Espace Apporteur d’Affaires FCT',
      totalShares: 'Partages Réalisés',
      totalClicks: 'Visites Générées',
      activeContracts: 'Ventes & Locations Validées',
      balanceAvailable: 'Commissions Disponibles',
      selectVehicleToShare: 'Sélectionnez un véhicule à promouvoir',
      selectVehicleDesc: 'Sélectionnez un véhicule pour publier une annonce calibrée avec votre lien d’affiliation sur WhatsApp.',
      antiSpamNotice: 'Anti-spam actif : Déjà comptabilisé aujourd’hui (1 max/véhicule/24h). Nouveau quota dans ~24h (vous pouvez continuer à le partager librement).',
      shareWhatsappBtn: 'Statut WhatsApp',
      shareUniversalBtn: 'Partager le Lien',
      copyLinkBtn: 'Copier le Lien Affilié',
      sharePitchRentHeader: '*LOCATION VÉHICULE CERTIFIÉ - FCT AUTOMOBILE DOUALA*',
      sharePitchSaleHeader: '*VÉHICULE CERTIFIÉ À VENDRE - FCT AUTOMOBILE DOUALA*',
      sharePitchWarranty: 'Garantie : Assurance complète & Entretien certifié FCT',
      sharePitchAvailability: 'Disponibilité : Immédiate à Douala (avec ou sans chauffeur)',
      sharePitchSaleStatus: 'Statut : Certifié FCT, révisé et prêt à rouler',
      sharePitchSaleLocation: 'Emplacement : Showroom Bonamoussadi, Carrefour Santa Barbara',
      requestPayoutBtn: 'Demander un Retrait Mobile Money',
      payoutNotice: 'Paiement exécuté sous 24h ouvrées sur votre compte certifié.',
    },
    profile: {
      headerTitle: 'Mon Compte FCT',
      clientBadge: 'Adhérent Client FCT',
      partnerBadge: 'Partenaire Apporteur Agréé',
      backBtn: 'Retour',
      logoutBtn: 'Se Déconnecter',
      personalInfoTitle: 'Coordonnées & Identité',
      fullName: 'Nom Complet *',
      primaryPhone: 'Numéro de Téléphone Principal',
      whatsappPhone: 'Numéro WhatsApp VIP',
      city: 'Ville & Quartier (Cameroun)',
      payoutTitle: 'Paiements & Mobile Money (OM / MoMo)',
      payoutPartnerReassurance: 'Vos commissions d’apporteur d’affaires sont versées directement sur ce compte Mobile Money.',
      payoutClientReassurance: 'Vos cautions de location vous sont restituées sans délai sur ce compte après inspection de retour.',
      preferredChannel: 'Opérateur de Paiement',
      payoutPhone: 'Numéro Orange Money ou MTN MoMo',
      accountHolder: 'Nom du Titulaire de la Carte SIM',
      saveBtn: 'Enregistrer les Modifications',
      savingBtn: 'Enregistrement...',
      accessTitle: 'Accédez à votre profil FCT',
      accessSubtitle: 'Connectez-vous pour mettre à jour vos coordonnées, votre contact WhatsApp et vos comptes de versement Mobile Money (Orange Money / MTN MoMo).',
      clientSpaceBtn: 'Espace Adhérent Client',
      partnerPortalBtn: 'Portail Partenaire',
    },
    auth: {
      pinModalTitle: 'Vérification de Sécurité (2FA)',
      pinModalDesc: 'Un code de confirmation à 6 chiffres a été envoyé à votre adresse e-mail.',
      pinExpiryNotice: 'Ce code PIN est valable pendant 10 minutes. Ne le partagez avec personne.',
      pinPlaceholder: 'Entrez le code à 6 chiffres',
      verifyPinBtn: 'Confirmer & Valider',
      resendPinBtn: 'Renvoyer un nouveau code',
      forgotPasswordTitle: 'Réinitialisation de Mot de Passe',
      forgotPasswordDesc: 'Entrez votre adresse e-mail pour recevoir le lien de réinitialisation sécurisé.',
      sendResetBtn: 'Envoyer le Lien de Réinitialisation',
      cancelBtn: 'Annuler',
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
      badge: 'DOUALA · SANTA BARBARA JUNCTION, BONAMOUSSADI',
      heroTitle: 'Executive Automotive in Douala, Certified Rental & Sales.',
      heroSubtitle: 'Certified high-end vehicle fleet, bilingual VIP chauffeur services, full accounting transparency and tamper-proof digital health records.',
      exploreFleet: 'Explore Fleet',
      viewSales: 'Vehicles for Sale',
      healthPassportBtn: 'Health Record',
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
    showroom: {
      back: 'Back to Vehicles',
      certifiedFCT: 'FCT Douala Certified',
      specsTitle: 'Technical Specifications',
      brand: 'Brand',
      model: 'Model',
      year: 'Year',
      transmission: 'Transmission',
      fuel: 'Fuel',
      mileage: 'Mileage',
      seats: 'Seating Capacity',
      status: 'Availability',
      available: 'Available Now',
      rented: 'Currently Rented',
      ratesTitle: 'Pricing Terms',
      dailyRental: 'Rental rate / day',
      depositRequired: 'Mandatory security deposit',
      fullPurchase: 'Direct purchase price',
      includedServices: 'Included Benefits',
      insurance: 'Comprehensive insurance across CEMAC zone',
      maintenanceFree: 'All regular servicing and fluid changes covered',
      assistance24: '24/7 breakdown assistance across Douala',
      bookNow: 'Confirm Reservation',
      contactWhatsapp: 'Chat on WhatsApp',
      requestTestDrive: 'Schedule a Test Drive',
      namePlaceholder: 'Your full name...',
      phonePlaceholder: 'WhatsApp phone (+237)...',
      startDate: 'Start date',
      endDate: 'End date',
      withDriverCheckbox: 'Add a dedicated chauffeur (+15,000 XAF/day)',
      submitBooking: 'Submit Booking Request',
      successNotice: 'Your booking has been received! An FCT consultant will contact you within 15 minutes.',
    },
    health: {
      title: 'Digital Automotive Health Record',
      subtitle: 'Full transparency and tamper-proof traceability of all technical interventions in the FCT fleet.',
      searchPlaceholder: 'Enter license plate (e.g. LT-8841-CE)...',
      searchBtn: 'Search Record',
      vehicleFound: 'Vehicle Certified by Franchise Conseils Trading',
      generalCondition: 'Inspected Overall Condition',
      mileageCertified: 'Certified Mileage',
      interventionsCount: 'Recorded Interventions',
      allClear: '100% Compliant with Safety Standards',
      historyTitle: 'Maintenance History & Spare Parts Log',
      colDate: 'Date',
      colIntervention: 'Intervention',
      colGarage: 'Workshop / Garage',
      colMileage: 'Odometer',
      colParts: 'Replaced Parts',
      colCertificate: 'FCT Stamp',
      certifiedStamp: 'Authentic Certified',
      noRecords: 'No maintenance records found for this license plate.',
    },
    portal: {
      title: 'Client Member Portal & Rental Tracking',
      subtitle: 'Review active rentals, download certified invoices and monitor your security deposits.',
      phoneOrEmail: 'Client Phone or Email:',
      passwordPlaceholder: 'Secret password:',
      loginBtn: 'Log In to My Account',
      welcome: 'Welcome to your portal,',
      activeContracts: 'Active Rental Agreements',
      pastContracts: 'Past Rentals & Invoices',
      contractNumber: 'Agreement #',
      vehicle: 'Vehicle:',
      period: 'Period:',
      depositHeld: 'Recorded Deposit:',
      downloadInvoice: 'Download Invoice PDF',
      extendContract: 'Request Rental Extension',
      noActiveContract: 'You have no active rental agreement at this time.',
      logout: 'Log Out',
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
    partners: {
      heroBadge: 'FCT Business Network • Partner Program',
      heroTitle: 'Earn Guaranteed Commissions with FCT',
      heroSubtitle: 'Monetize your network in Douala and Cameroon. Share verified vehicles to your contacts and receive automatic payouts directly on Orange Money, MTN MoMo or agency cash desk.',
      connectedPartner: 'Connected Partner',
      joinNetwork: 'Join the Official FCT Network',
      joinSubtitle: 'Monetize your relations with zero investment or stock',
      pillar1Title: 'Rentals: 5% Direct',
      pillar1Desc: 'Earn 5% direct commission on the total value of each signed car rental contract.',
      pillar2Title: 'Sales: 100,000 FCFA',
      pillar2Desc: 'Fixed bonus of 100,000 FCFA guaranteed on every vehicle sale completed via your link.',
      pillar3Title: '24h Mobile Payout',
      pillar3Desc: 'Direct automated payouts on Orange Money, MTN MoMo, or cash desk at Bonamoussadi agency.',
      pillar4Title: '1-Click Sharing',
      pillar4Desc: 'Fiches and photos formatted automatically for immediate WhatsApp status publication.',
      stepsTitle: 'How to start in 3 simple steps:',
      step1Title: 'Register your Profile',
      step1Desc: 'Fill in your WhatsApp contact and choose your preferred mobile payout method.',
      step2Title: 'Receive your Unique Code',
      step2Desc: 'Your dedicated affiliate code and custom web link are generated immediately.',
      step3Title: 'Share & Cash In',
      step3Desc: 'Post verified cars to your status. When a deal closes, commissions are credited to your balance.',
      createAccountTab: 'Create Partner Account',
      signInTab: 'Sign In',
      fullNameLabel: 'Full Name *',
      whatsappLabel: 'WhatsApp Phone *',
      payoutMethodLabel: 'Payout Method',
      cityLabel: 'City',
      emailLabel: 'Email Address *',
      passwordLabel: 'Password *',
      forgotPassword: 'Forgot password?',
      registerSubmitBtn: 'Register & Activate Account',
      loginSubmitBtn: 'Sign in to Partner Portal',
      dashboardWelcome: 'FCT Affiliate Partner Space',
      totalShares: 'Shares Completed',
      totalClicks: 'Visits Generated',
      activeContracts: 'Validated Deals',
      balanceAvailable: 'Available Commissions',
      selectVehicleToShare: 'Select a vehicle to promote',
      selectVehicleDesc: 'Select a vehicle to publish an ad formatted with your affiliate link on WhatsApp.',
      antiSpamNotice: 'Anti-spam active: Already counted today (1 max/vehicle/24h). Next quota in ~24h (you may keep sharing freely).',
      shareWhatsappBtn: 'WhatsApp Status',
      shareUniversalBtn: 'Share Link',
      copyLinkBtn: 'Copy Affiliate Link',
      sharePitchRentHeader: '*CERTIFIED VEHICLE RENTAL - FCT AUTOMOBILE DOUALA*',
      sharePitchSaleHeader: '*CERTIFIED VEHICLE FOR SALE - FCT AUTOMOBILE DOUALA*',
      sharePitchWarranty: 'Warranty : Comprehensive insurance & FCT certified maintenance',
      sharePitchAvailability: 'Availability : Immediate in Douala (with or without driver)',
      sharePitchSaleStatus: 'Status : FCT certified, inspected and ready to drive',
      sharePitchSaleLocation: 'Location : Bonamoussadi Showroom, Carrefour Santa Barbara',
      requestPayoutBtn: 'Request Mobile Money Payout',
      payoutNotice: 'Transfers processed within 24 business hours to your verified account.',
    },
    profile: {
      headerTitle: 'My FCT Account',
      clientBadge: 'Verified Member',
      partnerBadge: 'Certified Partner',
      backBtn: 'Back',
      logoutBtn: 'Log Out',
      personalInfoTitle: 'Personal Information',
      fullName: 'Full Name *',
      primaryPhone: 'Primary Phone Number',
      whatsappPhone: 'VIP WhatsApp Phone',
      city: 'City / District in Cameroon',
      payoutTitle: 'Payout & Mobile Money Settings',
      payoutPartnerReassurance: 'Your commissions are paid directly to this Mobile Money account upon request.',
      payoutClientReassurance: 'Your security deposits are securely refunded to this account after vehicle return.',
      preferredChannel: 'Preferred Payment Channel',
      payoutPhone: 'Mobile Money Phone Number',
      accountHolder: 'Account Holder Name',
      saveBtn: 'Save Changes',
      savingBtn: 'Saving...',
      accessTitle: 'Access Your FCT Profile',
      accessSubtitle: 'Sign in to update your personal contact details, WhatsApp contact, and Mobile Money payout accounts (Orange / MTN).',
      clientSpaceBtn: 'Client Space',
      partnerPortalBtn: 'Partner Portal',
    },
    auth: {
      pinModalTitle: 'Security Verification (2FA)',
      pinModalDesc: 'A 6-digit confirmation code has been sent to your email address.',
      pinExpiryNotice: 'This PIN code is valid for 10 minutes. Never share it with anyone.',
      pinPlaceholder: 'Enter 6-digit PIN code',
      verifyPinBtn: 'Confirm & Validate',
      resendPinBtn: 'Resend new code',
      forgotPasswordTitle: 'Password Reset',
      forgotPasswordDesc: 'Enter your email address to receive secure reset instructions.',
      sendResetBtn: 'Send Reset Link',
      cancelBtn: 'Cancel',
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

