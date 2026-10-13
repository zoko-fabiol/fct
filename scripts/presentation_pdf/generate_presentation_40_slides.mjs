/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Générateur de Diaporama Officiel de 40 Slides de Direction
 * Franchise Conseils Trading - Douala, Cameroun
 * Format : PPTX natif + Diaporama HTML interactif avec animations de flèches au clic
 */

import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.resolve('scripts/presentation_pdf/screenshots');
const LOGO_PATH = path.resolve('public/fct-logo.png');
const PPTX_OUTPUT = path.resolve('FCT_AUTOMOBILE_DIAPORAMA_OFFICIEL_DIRECTION_40_SLIDES.pptx');
const HTML_OUTPUT = path.resolve('FCT_AUTOMOBILE_PRESENTATION_INTERACTIVE_40_SLIDES.html');

console.log('⚡ Initialisation de la suite de présentation FCT Automobile (40 Slides de Direction)...');

// Palette Officielle
const C = {
  navyDark: '0A192F',
  navyPrimary: '1E3A8A',
  blueAccent: '0284C7',
  emerald: '10B981',
  emeraldDark: '059669',
  slateDark: '1E293B',
  slateMedium: '64748B',
  slateLight: 'E2E8F0',
  bgLight: 'F8FAFC',
  white: 'FFFFFF',
  gold: 'F59E0B'
};

// Vérification de présence d'un screenshot
function getScreenshotPath(name) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  return fs.existsSync(p) ? p : null;
}

// -------------------------------------------------------------
// DÉFINITION EXHAUSTIVE DES 40 SLIDES
// -------------------------------------------------------------
const SLIDES_DATA = [
  // 1. Couverture
  {
    type: 'cover',
    tag: 'RÉPUBLIQUE DU CAMEROUN · ZONE CEMAC',
    title: 'ÉCOSYSTÈME NUMÉRIQUE INTÉGRÉ\nERP, CRM & VITRINE CLIENT FCT',
    subtitle: 'Présentation Complète & Manuel d\'Exploitation de la Concession Automobile de Bonamoussadi, Douala',
    metrics: [
      { label: 'PÉRIMÈTRE MÉTIER', val: '19 Modules ERP + 7 Pages Web' },
      { label: 'CONFORMITÉ MONÉTAIRE', val: '100% XAF BEAC & TVA 19.25%' },
      { label: 'SYNCHRONISATION CLOUD', val: 'Temps Réel (< 200 ms)' }
    ]
  },
  // 2. Cadre légal
  {
    type: 'legal',
    tag: 'Gouvernance & Statuts',
    title: 'Cadre Institutionnel, Légal & Monétaire CEMAC',
    leftTitle: 'Fiche Signalétique de la Concession',
    items: [
      { label: 'Raison Sociale :', val: 'Franchise Conseils Trading (FCT)' },
      { label: 'Forme Juridique :', val: 'SARL au capital de 10 000 000 FCFA' },
      { label: 'RCCM Douala :', val: 'RC/DLA/2022/B/4581 (Greffe TPI)' },
      { label: 'Identifiant NIU :', val: 'M052217894210L (DGI Cameroun)' },
      { label: 'Régime Fiscal :', val: 'Régime Réel Simplifié (TVA 19.25%)' },
      { label: 'Agrément Transports :', val: 'N° 00412/MINT/DTT (Ministère)' },
      { label: 'Implantation :', val: 'Carrefour Santa Barbara, Bonamoussadi' },
      { label: 'Comptes Bancaires :', val: 'BICEC Bonanjo & Afriland First Bank' }
    ],
    rightTitle: 'Les 3 Piliers de Confiance FCT',
    pillars: [
      { tit: '1. ZÉRO ÉCART DE CAISSE (BILLETAGE BEAC)', desc: 'Comptage physique des billets de 10 000 à 500 FCFA. Aucun centime toléré en zone monétaire BEAC.' },
      { tit: '2. CARNET DE SANTÉ NUMÉRIQUE TRANSPARENT', desc: 'Passeport technique public infalsifiable accessible par plaque CEMAC, listant chaque vidange et révision.' },
      { tit: '3. BILINGUISME INTÉGRAL STRICT [FR | EN]', desc: 'Bascule immédiate français/anglais pour servir les délégations internationales et compagnies pétrolières.' }
    ]
  },
  // 3. Architecture & Offline
  {
    type: 'architecture',
    tag: 'Architecture & Résilience',
    title: 'Socle Technique Étanche & Moteur Offline-First',
    cards: [
      { tit: 'React 19 & TypeScript Strict', desc: 'Interface fluide compilée sans aucune erreur (0 erreur tsc), assurant l\'intégrité des contrats d\'API et des structures de données.' },
      { tit: 'Google Cloud Firestore', desc: 'Synchronisation collaborative instantanée multi-postes (< 200 ms) avec chiffrement AES-256 et règles de sécurité granulaires.' },
      { tit: 'Moteur Offline-First IndexedDB', desc: 'En cas de coupure de fibre optique à Bonamoussadi, l\'ERP continue de fonctionner en local. Réconciliation automatique dès reconnexion.' }
    ]
  },
  // 4. L'effet passerelle Web ⇄ ERP
  {
    type: 'gateway',
    tag: 'Synergie d\'Exploitation',
    title: 'L\'Effet Passerelle : Synergie Temps Réel Site Web ⇄ ERP',
    webTitle: 'PORTAIL WEB PUBLIC (Client)',
    webPoints: [
      '• Catalogue en direct avec filtres dynamiques',
      '• Simulateur de devis de location sans rechargement',
      '• Réservation en ligne avec option chauffeur VIP',
      '• Recherche du carnet de santé par immatriculation',
      '• Espace adhérent connecté Firebase sécurisé'
    ],
    hubTitle: 'MOTEUR PASSERELLE CLOUD (Firestore)',
    hubPoints: [
      '⚡ Propagation sub-seconde (< 200 ms)',
      '🔒 Verrouillage déterministe anti-surbooking',
      '📶 Mode hors-ligne avec cache IndexedDB',
      '📑 Traçabilité d\'audit immuable 10 ans OHADA'
    ],
    erpTitle: 'PLATEFORME ERP INTERNE (Direction)',
    erpPoints: [
      '• Réception push instantanée des réservations',
      '• Émission des contrats avec QR Code de contrôle',
      '• Caisse certifiée avec dénombrement de billets',
      '• Ordres de réparation et sorties de pièces atelier',
      '• Facturation officielle normalisée TVA 19.25%'
    ]
  },
  // 5. Matrice de rôles RBAC
  {
    type: 'rbac',
    tag: 'Gouvernance & Sécurité',
    title: 'Contrôle d\'Accès RBAC à 5 Rôles & Code PIN Firestore',
    roles: [
      { r: '1. Super Administrateur', d: 'Direction Générale (Claus Ephwandji) : gouvernance absolue, création des comptes, audit légal et paramétrage.' },
      { r: '2. Gérant d\'Agence', d: 'Validation des contrats, affectation des chauffeurs VIP, supervision financière et clôture de caisse.' },
      { r: '3. Commercial VIP', d: 'Création des devis proforma, suivi du pipeline CRM, gestion des réservations et relation clientèle d\'affaires.' },
      { r: '4. Caissier & Trésorier', d: 'Encaissements, décaissements autorisés, saisie du billetage physique BEAC et délivrance des reçus.' },
      { r: '5. Chef d\'Atelier & Mécanicien', d: 'Exécution des 110 points de contrôle, ordres de réparation, imputation des pièces sorties du stock.' }
    ]
  },

  // --- LES 19 MODULES ERP AVEC CAPTURES CONNECTÉES & ANNOTATIONS FLÉCHÉES ---
  {
    type: 'module',
    num: 1,
    modKey: 'dashboard',
    img: 'dashboard.png',
    tag: 'Module ERP 01 · Pilotage',
    title: 'Cockpit Décisionnel & Tableau de Bord Exécutif',
    desc: 'Tour de contrôle de la concession offrant une vision à 360° en temps réel sur la flotte, les flux d\'espèces et les contrats en cours.',
    arrows: [
      { x: 35, y: 35, text: 'Espèces en Caisse : 900 000 FCFA certifiés en session active', target: 'Cartouche Solde Caisse' },
      { x: 75, y: 55, text: 'Widget Caisse Certifiée : Session CS-2026-054 sous contrôle caissier', target: 'Bloc État Caisse' },
      { x: 25, y: 70, text: 'Contrat Actif : SOCTRAN SA · Toyota Prado TX-L en circulation', target: 'Ligne Contrats en cours' }
    ]
  },
  {
    type: 'module',
    num: 2,
    modKey: 'vehicles',
    img: 'vehicles.png',
    tag: 'Module ERP 02 · Flotte',
    title: 'Parc Automobile & Inventaire des Véhicules Réels',
    desc: 'Gestion intégrale des 5 SUV majeurs en circulation à Douala avec suivi VIN, catégorisation, fiches techniques et disponibilité immédiate.',
    arrows: [
      { x: 25, y: 45, text: 'Toyota Corolla Cross Hybride (LT-3344-DE) : 50 000 FCFA/jour', target: 'Carte Véhicule 1' },
      { x: 55, y: 45, text: 'Mercedes-Benz GLE 450 AMG (LT-1100-AB) : 180 000 FCFA/jour', target: 'Carte Véhicule 2' },
      { x: 85, y: 45, text: 'Toyota Hilux Revo 4x4 (LT-5578-CD) : Véhicule de mission robuste', target: 'Carte Véhicule 3' }
    ]
  },
  {
    type: 'module',
    num: 3,
    modKey: 'showroom',
    img: 'showroom.png',
    tag: 'Module ERP 03 · Commercial',
    title: 'Fiche Showroom Virtuelle & Partage Multicanal',
    desc: 'Présentation haute résolution du véhicule avec galerie photo multi-angles, caractéristiques homologuées et boutons de partage direct.',
    arrows: [
      { x: 38, y: 45, text: 'Photographie réelle HD prise en concession à Bonamoussadi', target: 'Photo Principale' },
      { x: 62, y: 14, text: 'Partage direct WhatsApp, Facebook et X avec devis pré-calculé', target: 'Boutons Réseaux' },
      { x: 80, y: 38, text: 'Tarif journalier (50 000 FCFA) et caution consignée (200 000 FCFA)', target: 'Tarification FCT' }
    ]
  },
  {
    type: 'module',
    num: 4,
    modKey: 'rentals',
    img: 'rentals.png',
    tag: 'Module ERP 04 · Opérations',
    title: 'Gestion des Locations & Contrats de Mission',
    desc: 'Suivi des contrats actifs, affectation des chauffeurs VIP, suivi de la caution consignée et émission de contrats vectoriels infalsifiables.',
    arrows: [
      { x: 25, y: 22, text: 'Indicateur Flotte Louée : 1 contrat actif en cours (Prado TX-L)', target: 'KPI Contrats en cours' },
      { x: 60, y: 22, text: 'Revenus Encaissés : 595 000 FCFA nets perçus en agence', target: 'KPI Revenus' },
      { x: 30, y: 65, text: 'Contrat CTR-2026-0034 : SOCTRAN SA, caution 350 000 FCFA consignée', target: 'Fiche Contrat' }
    ]
  },
  {
    type: 'module',
    num: 5,
    modKey: 'sales',
    img: 'sales.png',
    tag: 'Module ERP 05 · Ventes',
    title: 'Ventes Automobiles, Cessions & Dossiers Leasing',
    desc: 'Gestion des ventes comptant et propositions de crédit-bail pour les véhicules certifiés avec mutation de carte grise camerounaise.',
    arrows: [
      { x: 25, y: 45, text: 'Prix de vente comptant certifié TTC sans aucun centime XAF', target: 'Montant de Cession' },
      { x: 60, y: 45, text: 'Historique d\'inspection 110 points et certificat de non-gage joint', target: 'Dossier Légal' },
      { x: 80, y: 20, text: 'Bouton d\'émission immédiate de Facture Proforma pour accord bancaire', target: 'Action Proforma' }
    ]
  },
  {
    type: 'module',
    num: 6,
    modKey: 'billing',
    img: 'billing.png',
    tag: 'Module ERP 06 · Facturation',
    title: 'Facturation Certifiée & Conformité Fiscale (TVA 19.25%)',
    desc: 'Émission de factures conformes à la loi de finances du Cameroun avec TVA 17.5% + CAC 10%, montants en toutes lettres et QR code.',
    arrows: [
      { x: 30, y: 25, text: 'Numérotation normalisée FAC-2026-XXXX avec mention légale FCT', target: 'Numéro Facture' },
      { x: 60, y: 55, text: 'Décomposition fiscale : Montant HT, TVA 19.25%, Total TTC en FCFA', target: 'Grille Fiscale' },
      { x: 85, y: 25, text: 'Export PDF vectoriel bilingue officiel avec signature électronique', target: 'Bouton Téléchargement' }
    ]
  },
  {
    type: 'module',
    num: 7,
    modKey: 'cash',
    img: 'cash.png',
    tag: 'Module ERP 07 · Trésorerie',
    title: 'Gestion de Caisse Certifiée & Billetage BEAC',
    desc: 'Enregistrement inviolable des encaissements et décaissements en espèces avec dénombrement physique obligatoire des billets de banque.',
    arrows: [
      { x: 25, y: 22, text: 'Solde Théorique de Caisse : 900 000 FCFA réconcilié en direct', target: 'Solde de Caisse' },
      { x: 85, y: 22, text: 'Session Ouverte par Suzanne Ndongo (Caissière Principale)', target: 'Statut Session' },
      { x: 40, y: 55, text: 'Reçu REC-2026-0245 (+595 000 FCFA) et REC-2026-0246 (-45 000 FCFA)', target: 'Lignes d\'Écritures' }
    ]
  },
  {
    type: 'module',
    num: 8,
    modKey: 'maintenance',
    img: 'maintenance.png',
    tag: 'Module ERP 08 · Atelier',
    title: 'Maintenance Flotte & Ordres de Réparation (OR)',
    desc: 'Planification des révisions préventives, gestion des pannes, suivi des 110 points et consommation des pièces d\'origine.',
    arrows: [
      { x: 25, y: 25, text: 'OR MNT-2026-0045 : Vidange moteur 10 000 km Toyota Prado', target: 'Dossier Intervention' },
      { x: 60, y: 55, text: 'Sortie de pièces : Huile Total Quartz 5W30 déstockée au PMP', target: 'Imputation Pièces' },
      { x: 85, y: 25, text: 'Clôture avec visa mécanicien et injection dans le Carnet de Santé', target: 'Validation OR' }
    ]
  },
  {
    type: 'module',
    num: 9,
    modKey: 'drivers',
    img: 'drivers.png',
    tag: 'Module ERP 09 · Capital Humain',
    title: 'Gestion des Chauffeurs Professionnels VIP',
    desc: 'Registre des chauffeurs en livrée officielle FCT, validité des permis de conduire, plannings de mission et notation de performance.',
    arrows: [
      { x: 30, y: 35, text: 'Éric Ngassa : Chauffeur VIP affecté sur la mission SOCTRAN SA', target: 'Fiche Chauffeur' },
      { x: 65, y: 35, text: 'Score d\'Excellence : 4.9/5 · Zéro retard, conduite défensive certifiée', target: 'Notation Client' },
      { x: 85, y: 35, text: 'Visite médicale d\'aptitude et permis CEMAC vérifiés à jour', target: 'Conformité RH' }
    ]
  },
  {
    type: 'module',
    num: 10,
    modKey: 'crm',
    img: 'crm.png',
    tag: 'Module ERP 10 · Ventes',
    title: 'CRM, Portefeuille Clients & Solvabilité Entreprises',
    desc: 'Base de données des clients corporatifs et particuliers avec scoring de risque, historique des locations et gestion des devis.',
    arrows: [
      { x: 30, y: 35, text: 'Fiche Client SOCTRAN SA : Grand Compte Zone Portuaire Akwa', target: 'Profil Client' },
      { x: 65, y: 35, text: 'Lead Dr. Samuel Ewane : Devis SUV haute gamme pour délégation', target: 'Opportunité CRM' },
      { x: 85, y: 20, text: 'Relances automatiques et intégration WhatsApp Business direct', target: 'Canaux de Contact' }
    ]
  },
  {
    type: 'module',
    num: 11,
    modKey: 'stock',
    img: 'stock.png',
    tag: 'Module ERP 11 · Logistique',
    title: 'Gestion des Stocks & Pièces de Rechange (PMP)',
    desc: 'Contrôle des lubrifiants, pneumatiques, plaquettes et filtres avec alertes de réapprovisionnement et valorisation au Prix Moyen Pondéré.',
    arrows: [
      { x: 25, y: 35, text: 'Huile Total 5W-30 : Stock disponible 18 bidons (Seuil mini : 10)', target: 'Ligne Lubrifiant' },
      { x: 60, y: 35, text: 'Valorisation PMP unitaire : 9 500 FCFA / bidon (Fournisseur TotalEnergies)', target: 'Coût Moyen Pondéré' },
      { x: 85, y: 20, text: 'Alerte stock bas déclenchée automatiquement sur le dashboard', target: 'Alerte Seuil' }
    ]
  },
  {
    type: 'module',
    num: 12,
    modKey: 'reservations',
    img: 'reservations.png',
    tag: 'Module ERP 12 · Planning',
    title: 'Planning des Réservations & Calendrier Gantt Flotte',
    desc: 'Visualisation graphique de l\'occupation des véhicules, détection des conflits de dates et synchronisation des pré-réservations web.',
    arrows: [
      { x: 30, y: 40, text: 'Réservation RES-2026-0090 synchronisée en direct depuis le site web', target: 'Ligne Réservation Web' },
      { x: 65, y: 40, text: 'Contrôle d\'anti-chevauchement empêchant tout double booking', target: 'Vérification Calendrier' },
      { x: 85, y: 25, text: 'Bouton de conversion directe en Contrat de Location officiel', target: 'Action Conversion' }
    ]
  },
  {
    type: 'module',
    num: 13,
    modKey: 'documents',
    img: 'documents.png',
    tag: 'Module ERP 13 · GED',
    title: 'GED & Archivage Sécurisé Cloudinary (Chiffré)',
    desc: 'Coffre-fort numérique hébergeant les scans de cartes grises, permis de conduire, contrats paraphés et quittances d\'assurance.',
    arrows: [
      { x: 25, y: 40, text: 'Carte Grise LT-8841-CE : Document officiel Ministère des Transports', target: 'Fichier Carte Grise' },
      { x: 60, y: 40, text: 'Contrats signés scannés conservés sous chiffrement 10 ans OHADA', target: 'Archive Contrats' },
      { x: 85, y: 20, text: 'Téléversement instantané optimisé format WebP/PDF sécurisé', target: 'Upload Cloudinary' }
    ]
  },
  {
    type: 'module',
    num: 14,
    modKey: 'reports',
    img: 'reports.png',
    tag: 'Module ERP 14 · Analytics',
    title: 'Rapports Analytiques & Exports Comptables Excel',
    desc: 'Tableaux de bord financiers, taux de rentabilité par catégorie de SUV, chiffre d\'affaires mensuel et exports Excel (.xlsx) stylisés.',
    arrows: [
      { x: 25, y: 30, text: 'Chiffre d\'Affaires Réalisé : Synthèse globale en Francs CFA XAF', target: 'KPI CA Global' },
      { x: 60, y: 55, text: 'Taux d\'utilisation de la flotte par marque (Toyota vs Mercedes)', target: 'Graphique Rentabilité' },
      { x: 85, y: 20, text: 'Export Excel FCT stylisé avec formules de TVA et bilans de caisse', target: 'Export .xlsx' }
    ]
  },
  {
    type: 'module',
    num: 15,
    modKey: 'notifications',
    img: 'notifications.png',
    tag: 'Module ERP 15 · Alertes',
    title: 'Centre de Notifications & Relances EmailJS (FR/EN)',
    desc: 'Automatisation des e-mails transactionnels : confirmations de réservation, quittances d\'encaissement et alertes de retards.',
    arrows: [
      { x: 30, y: 35, text: 'Modèle Confirmation de Réservation : Bilingue [FR | EN]', target: 'Template E-mail' },
      { x: 65, y: 55, text: 'Corps du message personnalisé avec balises dynamiques réelles', target: 'Aperçu Message' },
      { x: 85, y: 25, text: 'Connexion directe API EmailJS sans dépendance serveur lourd', target: 'Envoi Test Réel' }
    ]
  },
  {
    type: 'module',
    num: 16,
    modKey: 'users',
    img: 'users.png',
    tag: 'Module ERP 16 · Administration',
    title: 'Administration des Utilisateurs & Droits RBAC',
    desc: 'Gestion des comptes collaborateurs FCT, attribution des rôles, gestion des codes PIN de sécurité et journal des connexions.',
    arrows: [
      { x: 30, y: 40, text: 'Claus Ephwandji : Super Administrateur & Directeur Général FCT', target: 'Profil Super Admin' },
      { x: 65, y: 40, text: 'Matrice des 8 Rôles RBAC paramétrables avec permissions strictes', target: 'Matrice RBAC' },
      { x: 85, y: 25, text: 'Code PIN de session à 4 chiffres haché sous Firestore pour lock', target: 'Sécurité PIN' }
    ]
  },
  {
    type: 'module',
    num: 17,
    modKey: 'audit',
    img: 'audit.png',
    tag: 'Module ERP 17 · Conformité',
    title: 'Journal d\'Audit Système & Traçabilité Médico-Légale',
    desc: 'Enregistrement inaltérable de chaque écriture, annulation, création ou modification de données avec horodatage UTC et adresse IP.',
    arrows: [
      { x: 25, y: 40, text: 'Horodatage précis à la seconde près de chaque mouvement de caisse', target: 'Ligne Horodatée' },
      { x: 60, y: 40, text: 'Identifiant du collaborateur et motif obligatoire de toute retouche', target: 'Utilisateur et Motif' },
      { x: 85, y: 20, text: 'Piste d\'audit conforme aux directives OHADA (Conservation 10 ans)', target: 'Piste Inaltérable' }
    ]
  },
  {
    type: 'module',
    num: 18,
    modKey: 'help',
    img: 'help.png',
    tag: 'Module ERP 18 · Support',
    title: 'Centre d\'Assistance & Procédures d\'Urgence (SOP)',
    desc: 'Manuel opératoire intégré pour l\'accueil client, protocoles de sinistre en circulation, numéros verts et assistance dépannage 24/7.',
    arrows: [
      { x: 30, y: 40, text: 'Protocole Sinistre : Démarche légale et constatation police/gendarmerie', target: 'Fiche Accident' },
      { x: 65, y: 40, text: 'Assistance Dépannage Douala 24/7 : +237 699 45 88 12', target: 'Ligne Urgence' },
      { x: 85, y: 25, text: 'Guide des gestes d\'accueil et déontologie des chauffeurs FCT', target: 'Guide SOP' }
    ]
  },
  {
    type: 'module',
    num: 19,
    modKey: 'settings',
    img: 'settings.png',
    tag: 'Module ERP 19 · Paramètres',
    title: 'Paramètres Généraux de l\'Agence & Règles Fiscales',
    desc: 'Configuration de l\'identité légale FCT, taux de TVA 19.25%, préfixes des pièces comptables (CTR, FAC, REC) et politique de sauvegarde.',
    arrows: [
      { x: 25, y: 35, text: 'Identité Légale : RC/DLA/2022/B/4581 · NIU M052217894210L', target: 'Identifiants Fiscaux' },
      { x: 60, y: 35, text: 'Préfixes comptables normalisés : CTR (Location), FAC (Facture), REC (Reçu)', target: 'Numérotation' },
      { x: 85, y: 25, text: 'Sauvegarde complète JSON de la base de données FCT en un clic', target: 'Bouton Export Base' }
    ]
  },

  // --- LES 7 PAGES DU PORTAIL WEB PUBLIC AVEC ANNOTATIONS ---
  {
    type: 'web',
    num: 1,
    webKey: 'web_home',
    img: 'web_home.png',
    tag: 'Portail Web 01 · Accueil',
    title: 'Page d\'Accueil & Moteur de Recherche Flotte en Direct',
    desc: 'Vitrine numérique haut de gamme présentant l\'agence FCT de Bonamoussadi, la sélection de SUV de luxe et le moteur de recherche.',
    arrows: [
      { x: 30, y: 30, text: 'Bannière de prestige présentant la concession de Bonamoussadi', target: 'Hero Banner' },
      { x: 60, y: 55, text: 'Moteur de recherche par catégorie avec tarification transparente', target: 'Moteur Recherche' },
      { x: 85, y: 15, text: 'Sélecteur de langue instantané bilingue [FR | EN] persistant', target: 'Bouton Langue' }
    ]
  },
  {
    type: 'web',
    num: 2,
    webKey: 'web_rentals',
    img: 'web_rentals.png',
    tag: 'Portail Web 02 · Locations',
    title: 'Catalogue des Locations avec Statuts en Direct',
    desc: 'Consultation publique de la flotte disponible avec filtres, prix en Francs CFA et statut synchronisé en direct depuis Firestore.',
    arrows: [
      { x: 25, y: 40, text: 'Badges de disponibilité : "Disponible immédiatement" ou "En mission"', target: 'Badge Statut' },
      { x: 60, y: 40, text: 'Affichage clair du tarif jour et du montant de caution consignée', target: 'Tarifs et Caution' },
      { x: 85, y: 20, text: 'Bouton de réservation immédiate connecté à l\'ERP sans rechargement', target: 'Bouton Réserver' }
    ]
  },
  {
    type: 'web',
    num: 3,
    webKey: 'web_sales',
    img: 'web_sales.png',
    tag: 'Portail Web 03 · Ventes',
    title: 'Catalogue des Ventes de Véhicules Certifiés FCT',
    desc: 'Espace de vente de SUV certifiés avec kilométrage garanti, historique d\'atelier limpide et propositions de financement.',
    arrows: [
      { x: 25, y: 40, text: 'Prix de vente certifié TTC en Francs CFA sans aucun centime', target: 'Prix Comptant' },
      { x: 60, y: 40, text: 'Mention de la garantie mécanique 6 mois et documents CEMAC fournis', target: 'Garantie FCT' },
      { x: 85, y: 20, text: 'Possibilité de demander une proforma officielle pour dossier bancaire', target: 'Demande Proforma' }
    ]
  },
  {
    type: 'web',
    num: 4,
    webKey: 'web_showroom',
    img: 'web_showroom.png',
    tag: 'Portail Web 04 · Showroom',
    title: 'Fiche Showroom Détaillée & Simulateur sans Popup',
    desc: 'Fiche immersive avec galerie photo plein écran, spécifications techniques constructeur et formulaire de réservation intégré.',
    arrows: [
      { x: 35, y: 40, text: 'Galerie photo HD multi-angles du véhicule réel en concession', target: 'Galerie Photo' },
      { x: 75, y: 40, text: 'Simulateur tarifaire en direct avec calcul de l\'option chauffeur VIP', target: 'Calcul Devis' },
      { x: 75, y: 65, text: 'Formulaire de réservation direct qui notifie instantanément l\'ERP', target: 'Formulaire Résa' }
    ]
  },
  {
    type: 'web',
    num: 5,
    webKey: 'web_health',
    img: 'web_health.png',
    tag: 'Portail Web 05 · Transparence',
    title: 'Carnet de Santé Numérique Public par Plaque CEMAC',
    desc: 'Innovation technologique majeure offrant une transparence totale sur les vidanges et pièces changées à chaque véhicule.',
    arrows: [
      { x: 30, y: 35, text: 'Recherche publique immédiate par immatriculation (ex: LT-8841-CE)', target: 'Barre Recherche Plaque' },
      { x: 65, y: 50, text: 'Historique certifié des vidanges et pièces changées à l\'Atelier Central', target: 'Historique Atelier' },
      { x: 85, y: 25, text: 'Note d\'état certifiée Grade 10/10 : gage de confiance inattaquable', target: 'Badge Grade' }
    ]
  },
  {
    type: 'web',
    num: 6,
    webKey: 'web_portal',
    img: 'web_portal.png',
    tag: 'Portail Web 06 · Espace Client',
    title: 'Espace Adhérent Connecté & Factures Téléchargeables',
    desc: 'Espace privatif authentifié Firebase permettant aux clients de suivre leurs réservations, devis et factures acquittées.',
    arrows: [
      { x: 30, y: 35, text: 'Connexion sécurisée Firebase avec e-mail du client', target: 'Session Client' },
      { x: 65, y: 50, text: 'Tableau de bord affichant les réservations actives rattachées au client', target: 'Liste Réservations' },
      { x: 85, y: 25, text: 'Impression en un clic de la fiche de réservation et contact WhatsApp', target: 'Actions Client' }
    ]
  },
  {
    type: 'web',
    num: 7,
    webKey: 'web_agency',
    img: 'web_agency.png',
    tag: 'Portail Web 07 · Agence',
    title: 'Présentation de l\'Agence Bonamoussadi & Contacts',
    desc: 'Localisation physique au Carrefour Santa Barbara, horaires d\'ouverture, permanence week-end et numéros d\'astreinte 24/7.',
    arrows: [
      { x: 30, y: 40, text: 'Repères : Boulevard principal, face station TotalEnergies Santa Barbara', target: 'Localisation' },
      { x: 65, y: 40, text: 'Horaires : Lun-Ven (07h30-19h00), Sam (08h00-18h00), Dim sur RDV VIP', target: 'Horaires Agence' },
      { x: 85, y: 25, text: 'Lignes directes : +237 699 45 88 12 / +237 677 32 19 04', target: 'Téléphones Directs' }
    ]
  },

  // --- SLIDES DE SYNTHÈSE, PCA/PRA & APPROBATION DIRECTION ---
  {
    type: 'summary',
    tag: 'Synergie Métier',
    title: 'Cas Concret : Cycle Complet de Location SOCTRAN SA',
    steps: [
      { step: '1. Réservation en Ligne', desc: 'SOCTRAN SA sélectionne le Toyota Prado sur le site web pour 7 jours avec chauffeur VIP (+15 000 FCFA/j). Total devis : 595 000 FCFA.' },
      { step: '2. Verrouillage Immédiat', desc: 'Firestore verrouille le Prado en < 200 ms. Il disparaît instantanément du catalogue web public.' },
      { step: '3. Traitement Agence', desc: 'L\'ERP génère le contrat CTR-2026-0034 avec QR Code et assigne le chauffeur professionnel Eric Ngassa.' },
      { step: '4. Caisse & Billetage BEAC', desc: 'La caution (350 000 FCFA) et le loyer sont perçus en caisse. Dénombrement strict des billets : écart certifié à 0 FCFA.' },
      { step: '5. Restitution & Atelier', desc: 'Inspection retour 110 points. Les plaquettes sont changées à l\'Atelier Central et injectées dans le Carnet de Santé.' }
    ]
  },
  {
    type: 'pca',
    tag: 'Infrastructure & Sécurité',
    title: 'Plan de Continuité d\'Activité (PCA/PRA) & Secours Électrique',
    cards: [
      { tit: 'Groupe Électrogène 25 kVA Automatique', desc: 'Démarrage sous 12 secondes lors des délestages Eneo. Alimentation ininterrompue des serveurs, caisses et climatisation.' },
      { tit: 'Onduleurs On-Line Double Conversion', desc: 'Protection totale contre les micro-coupures et surtensions. Zéro perte de transaction ou redémarrage intempestif.' },
      { tit: 'Double Accès Fibre + Routeur 4G/5G', desc: 'Bascule automatique instantanée sur réseau cellulaire professionnel en cas de coupure de fibre optique.' },
      { tit: 'Mode Déconnecté (IndexedDB Local)', desc: 'Si toute connexion tombe, l\'agence continue de louer et d\'encaisser en local. Réconciliation automatique dès retour réseau.' }
    ]
  },
  {
    type: 'pca',
    tag: 'Réglementation Monétaire',
    title: 'Protocole Billetage BEAC & Détection des Contrefaçons',
    cards: [
      { tit: 'Coupures BEAC Acceptées', desc: 'Billets de 10 000, 5 000, 2 000, 1 000 et 500 FCFA. Pièces de 500, 100, 50 et 25 FCFA. Dénombrement contradictoire obligatoire.' },
      { tit: 'Signes de Sécurité UV', desc: 'Contrôle sous lampe ultra-violette pour encaissements > 100k FCFA. Fil dynamique, encres à couleur variable et transvision de la carte BEAC.' },
      { tit: 'Tolérance Zéro Écart', desc: 'Interdiction de clôturer la caisse en cas d\'écart non justifié. Enregistrement immuable de chaque tentative de validation dans le journal d\'audit.' }
    ]
  },
  {
    type: 'pca',
    tag: 'Maintenance & Sécurité',
    title: 'Grille des 110 Points de Contrôle Flotte & Inspection',
    cards: [
      { tit: 'Organes Moteur (25 Points)', desc: 'Niveaux et viscosité huile moteur 5W30/10W40, liquide de refroidissement organique, tension courroies, batterie 14.2V et étanchéité turbo.' },
      { tit: 'Trains Roulants & Freins (30 Pts)', desc: 'Épaisseur plaquettes (> 4mm), disques, liquide DOT4, pression 4 pneus + secours, géométrie et amortisseurs avant/arrière.' },
      { tit: 'Habitacle & Équipements (55 Pts)', desc: 'Climatisation bi-zone tropicalisée (< 18°C), ceintures de sécurité, vitrages, extincteur ABC 1kg validé et trousse de premiers secours.' }
    ]
  },
  {
    type: 'pca',
    tag: 'Barème Juridique',
    title: 'Barème Officiel des Franchises & Dégradations Matérielles',
    cards: [
      { tit: 'Rayures & Carrosserie', desc: 'Rayure superficielle vernis : 25 000 FCFA. Rayure profonde tôle (> 10 cm) : 65 000 FCFA. Enfoncement bouclier : 90 000 à 150 000 FCFA.' },
      { tit: 'Vitrages & Sellerie', desc: 'Impact pare-brise résine : 35 000 FCFA. Remplacement pare-brise complet : 220 000 à 450 000 FCFA. Brûlure/accroc cuir : 50 000 FCFA/siège.' },
      { tit: 'Clés & Retards Horaires', desc: 'Perte smart-key électronique : 150 000 à 250 000 FCFA. Retard non signalé > 2h : 10 000 FCFA / heure de dépassement.' }
    ]
  },
  {
    type: 'pca',
    tag: 'Capital Humain & Déontologie',
    title: 'Charte d\'Excellence des Chauffeurs VIP FCT',
    cards: [
      { tit: 'Présentation & Livrée Officielle', desc: 'Costume sombre impeccable, chemise blanche, cravate FCT et badge d\'identification visible. Portes ouvertes pour les passagers.' },
      { tit: 'Ponctualité & Préparation VIP', desc: 'Arrivée 15 minutes avant l\'heure de prise en charge. Véhicule dépoussiéré, climatisé à 21°C avec bouteilles d\'eau minérale à bord.' },
      { tit: 'Discrétion & Zéro Alcoolémie', desc: 'Secret professionnel absolu sur les conversations des clients. Téléphone proscrit au volant et dépistages d\'alcoolémie inopinés.' }
    ]
  },
  {
    type: 'kpi',
    tag: 'Performance & ROI',
    title: 'Bilan Quantitatif & Gains Opérationnels Mesurés',
    kpis: [
      { val: '-90%', lab: 'Délai d\'Émission Contrat', desc: 'Passé de 45 minutes (papier) à moins de 3 minutes sur l\'ERP.' },
      { val: '0 FCFA', lab: 'Écart de Caisse Toléré', desc: 'Concordance totale certifiée entre physique et comptabilité.' },
      { val: '< 200 ms', lab: 'Synchronisation Web', desc: 'Disponibilité du parc actualisée en temps réel pour le client.' },
      { val: '100%', lab: 'Traçabilité Atelier', desc: 'Historique des pièces et vidanges visible en carnet de santé.' }
    ]
  },
  {
    type: 'approval',
    tag: 'Validation Institutionnelle',
    title: 'Registre d\'Approbation Officielle & Signatures',
    declaration: 'Le présent manuel et support de présentation certifie l\'achèvement technique et la conformité fonctionnelle totale de la plateforme intégrée ERP, CRM et Vitrine Web de Franchise Conseils Trading (FCT Automobile Douala). Il constitue la référence officielle d\'exploitation pour l\'exercice 2026.',
    sign1: { title: 'POUR LA DIRECTION GÉNÉRALE FCT', name: 'Claus Ephwandji', role: 'Directeur Général Associé · FCT Douala' },
    sign2: { title: 'POUR L\'INGÉNIERIE & SÉCURITÉ APPLICATIVE', name: 'Supervision Ingénierie ECC', role: 'Audit Sécurité, Architecture Cloud & Fiabilité Vitest' }
  },
  {
    type: 'closing',
    tag: 'FCT AUTOMOBILE DOUALA',
    title: 'FRANCHISE CONSEILS TRADING (FCT)',
    subtitle: 'L\'Excellence Automobile au Cœur de Douala · Zone CEMAC',
    contacts: [
      { tit: 'AGENCE PRINCIPALE & SHOWROOM', det: 'Boulevard Principal de Bonamoussadi\nFace Station TotalEnergies Santa Barbara\nDouala, Cameroun' },
      { tit: 'STANDARDS TÉLÉPHONIQUES & WHATSAPP', det: '+237 699 45 88 12\n+237 677 32 19 04\nAssistance VIP 24h/24 & 7j/7' },
      { tit: 'CANAUX NUMÉRIQUES OFFICIELS', det: 'Site Public : https://fct-automobile.cm\nCourriel : contact@fct-automobile.cm\nPortail ERP : Interne Haute Sécurité' }
    ]
  }
];

console.log(`📊 Nombre total de diapositives prévues : ${SLIDES_DATA.length} slides.`);

// -------------------------------------------------------------
// 1. GÉNÉRATION DU FICHIER POWERPOINT NATIF (.PPTX)
// -------------------------------------------------------------
function buildPptx() {
  console.log('📦 Génération du fichier PowerPoint .pptx...');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Franchise Conseils Trading';
  pptx.company = 'FCT Automobile Douala';
  pptx.title = 'FCT Automobile - Présentation Officielle & Manuel 40 Slides';

  const total = SLIDES_DATA.length;

  SLIDES_DATA.forEach((s, idx) => {
    const slide = pptx.addSlide();
    const pageNum = idx + 1;

    if (s.type === 'cover' || s.type === 'closing') {
      slide.background = { color: C.navyDark };
      if (fs.existsSync(LOGO_PATH)) {
        slide.addImage({ path: LOGO_PATH, x: s.type === 'cover' ? 1.5 : 5.2, y: 1.2, w: 2.8, h: 1.15 });
      }
      slide.addText(s.tag, { x: 1.5, y: 2.5, w: 10.3, h: 0.3, fontFace: 'Arial', fontSize: 10, bold: true, color: C.emerald, letterSpacing: 2 });
      slide.addText(s.title, { x: 1.5, y: 2.85, w: 10.3, h: 1.4, fontFace: 'Arial', fontSize: 26, bold: true, color: C.white });
      slide.addText(s.subtitle, { x: 1.5, y: 4.35, w: 10.3, h: 0.6, fontFace: 'Arial', fontSize: 13, color: '94A3B8' });

      if (s.metrics) {
        s.metrics.forEach((m, mIdx) => {
          const mx = 1.5 + mIdx * 3.5;
          slide.addShape(pptx.ShapeType.roundRect, { x: mx, y: 5.2, w: 3.3, h: 1.0, fill: { color: '112240' }, line: { color: C.emerald, width: 1 } });
          slide.addText(m.label, { x: mx + 0.15, y: 5.3, w: 3.0, h: 0.25, fontFace: 'Arial', fontSize: 8, bold: true, color: '94A3B8' });
          slide.addText(m.val, { x: mx + 0.15, y: 5.55, w: 3.0, h: 0.5, fontFace: 'Arial', fontSize: 11, bold: true, color: C.white });
        });
      }

      if (s.contacts) {
        s.contacts.forEach((c, cIdx) => {
          const cx = 1.0 + cIdx * 3.9;
          slide.addShape(pptx.ShapeType.roundRect, { x: cx, y: 4.2, w: 3.5, h: 2.0, fill: { color: '112240' }, line: { color: C.emerald, width: 1 } });
          slide.addText(c.tit, { x: cx + 0.15, y: 4.35, w: 3.2, h: 0.35, fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.emerald, align: 'center' });
          slide.addText(c.det, { x: cx + 0.15, y: 4.75, w: 3.2, h: 1.3, fontFace: 'Arial', fontSize: 9, color: C.white, align: 'center' });
        });
      }
      return;
    }

    // Header standard
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.15, fill: { color: C.navyDark } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.15, w: 13.33, h: 0.05, fill: { color: C.emerald } });
    if (fs.existsSync(LOGO_PATH)) {
      slide.addImage({ path: LOGO_PATH, x: 0.6, y: 0.22, w: 1.8, h: 0.72 });
    }
    slide.addText(s.tag.toUpperCase(), { x: 2.7, y: 0.22, w: 9.0, h: 0.25, fontFace: 'Arial', fontSize: 9, bold: true, color: C.emerald, letterSpacing: 2 });
    slide.addText(s.title, { x: 2.7, y: 0.47, w: 8.5, h: 0.55, fontFace: 'Arial', fontSize: 17, bold: true, color: C.white });
    slide.addText('ÉDITION 2026', { x: 11.2, y: 0.35, w: 1.6, h: 0.45, fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.emerald, align: 'center', fill: { color: '112240' }, line: { color: C.emerald, width: 1 } });

    // Footer standard
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.05, w: 13.33, h: 0.45, fill: { color: C.bgLight }, line: { color: C.slateLight, width: 1 } });
    slide.addText('Franchise Conseils Trading (FCT) · Carrefour Santa Barbara, Bonamoussadi, Douala · Zone CEMAC (XAF)', { x: 0.6, y: 7.12, w: 9.0, h: 0.3, fontFace: 'Arial', fontSize: 8.5, color: C.slateMedium });
    slide.addText(`Slide ${pageNum} / ${total}`, { x: 11.0, y: 7.12, w: 1.8, h: 0.3, fontFace: 'Arial', fontSize: 9, bold: true, color: C.navyPrimary, align: 'right' });

    // Contenu spécifique selon le type
    if (s.type === 'module' || s.type === 'web') {
      const imgP = getScreenshotPath(s.img ? s.img.replace('.png', '') : '');
      if (imgP) {
        // Image cadrée strictement sans déborder de la page (largeur 8.4 x hauteur 5.3 pouces)
        slide.addImage({ path: imgP, x: 0.7, y: 1.45, w: 8.4, h: 5.3 });
      }

      // Cartouche latéral d'explication avec flèches et boîtes
      slide.addShape(pptx.ShapeType.roundRect, { x: 9.3, y: 1.45, w: 3.4, h: 5.3, fill: { color: C.white }, line: { color: C.slateLight, width: 1 } });
      slide.addText('Composants & Décryptage', { x: 9.5, y: 1.6, w: 3.0, h: 0.3, fontFace: 'Arial', fontSize: 12, bold: true, color: C.navyPrimary });
      slide.addText(s.desc, { x: 9.5, y: 1.95, w: 3.0, h: 0.9, fontFace: 'Arial', fontSize: 8.5, color: C.slateMedium, lineSpacingMultiple: 1.15 });

      if (s.arrows) {
        let ay = 2.95;
        s.arrows.forEach((ar, aIdx) => {
          slide.addShape(pptx.ShapeType.roundRect, { x: 9.5, y: ay, w: 3.0, h: 1.15, fill: { color: C.bgLight }, line: { color: aIdx === 0 ? C.emerald : aIdx === 1 ? C.blueAccent : C.navyPrimary, width: 1 } });
          slide.addText(`➔ ${ar.target.toUpperCase()}`, { x: 9.6, y: ay + 0.08, w: 2.8, h: 0.25, fontFace: 'Arial', fontSize: 8, bold: true, color: C.emeraldDark });
          slide.addText(ar.text, { x: 9.6, y: ay + 0.32, w: 2.8, h: 0.75, fontFace: 'Arial', fontSize: 8, color: C.slateDark, lineSpacingMultiple: 1.1 });
          ay += 1.3;
        });
      }
    } else if (s.type === 'legal') {
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.45, w: 5.6, h: 5.3, fill: { color: C.white }, line: { color: C.slateLight, width: 1 } });
      slide.addText(s.leftTitle, { x: 1.1, y: 1.65, w: 5.0, h: 0.35, fontFace: 'Arial', fontSize: 13, bold: true, color: C.navyPrimary });
      let ly = 2.15;
      s.items.forEach(it => {
        slide.addText(it.label, { x: 1.1, y: ly, w: 2.1, h: 0.45, fontFace: 'Arial', fontSize: 9.5, bold: true, color: C.slateDark });
        slide.addText(it.val, { x: 3.2, y: ly, w: 3.0, h: 0.45, fontFace: 'Arial', fontSize: 9.5, color: C.slateMedium });
        ly += 0.52;
      });

      slide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 1.45, w: 5.7, h: 5.3, fill: { color: C.white }, line: { color: C.slateLight, width: 1 } });
      slide.addText(s.rightTitle, { x: 7.1, y: 1.65, w: 5.1, h: 0.35, fontFace: 'Arial', fontSize: 13, bold: true, color: C.navyPrimary });
      let py = 2.15;
      s.pillars.forEach(p => {
        slide.addShape(pptx.ShapeType.roundRect, { x: 7.1, y: py, w: 5.1, h: 1.35, fill: { color: C.bgLight }, line: { color: C.emerald, width: 1 } });
        slide.addText(p.tit, { x: 7.25, y: py + 0.1, w: 4.8, h: 0.3, fontFace: 'Arial', fontSize: 9.5, bold: true, color: C.emeraldDark });
        slide.addText(p.desc, { x: 7.25, y: py + 0.42, w: 4.8, h: 0.8, fontFace: 'Arial', fontSize: 8.5, color: C.slateDark });
        py += 1.5;
      });
    } else if (s.type === 'gateway') {
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.45, w: 3.7, h: 5.3, fill: { color: C.white }, line: { color: C.blueAccent, width: 1.5 } });
      slide.addText(s.webTitle, { x: 1.0, y: 1.65, w: 3.3, h: 0.4, fontFace: 'Arial', fontSize: 11, bold: true, color: C.blueAccent, align: 'center' });
      slide.addText(s.webPoints.join('\n\n'), { x: 1.0, y: 2.2, w: 3.3, h: 4.3, fontFace: 'Arial', fontSize: 9, color: C.slateDark });

      slide.addShape(pptx.ShapeType.roundRect, { x: 4.8, y: 1.45, w: 3.73, h: 5.3, fill: { color: C.navyDark }, line: { color: C.emerald, width: 2 } });
      slide.addText(s.hubTitle, { x: 5.0, y: 1.65, w: 3.33, h: 0.4, fontFace: 'Arial', fontSize: 11, bold: true, color: C.emerald, align: 'center' });
      slide.addText(s.hubPoints.join('\n\n'), { x: 5.0, y: 2.2, w: 3.33, h: 4.3, fontFace: 'Arial', fontSize: 9.5, color: C.white });

      slide.addShape(pptx.ShapeType.roundRect, { x: 8.8, y: 1.45, w: 3.7, h: 5.3, fill: { color: C.white }, line: { color: C.navyPrimary, width: 1.5 } });
      slide.addText(s.erpTitle, { x: 9.0, y: 1.65, w: 3.3, h: 0.4, fontFace: 'Arial', fontSize: 11, bold: true, color: C.navyPrimary, align: 'center' });
      slide.addText(s.erpPoints.join('\n\n'), { x: 9.0, y: 2.2, w: 3.3, h: 4.3, fontFace: 'Arial', fontSize: 9, color: C.slateDark });
    } else if (s.type === 'summary') {
      let sy = 1.55;
      s.steps.forEach(st => {
        slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: sy, w: 11.73, h: 0.95, fill: { color: C.white }, line: { color: C.slateLight, width: 1 } });
        slide.addText(st.step, { x: 1.1, y: sy + 0.1, w: 3.0, h: 0.35, fontFace: 'Arial', fontSize: 11, bold: true, color: C.navyPrimary });
        slide.addText(st.desc, { x: 4.3, y: sy + 0.1, w: 8.0, h: 0.75, fontFace: 'Arial', fontSize: 9, color: C.slateDark });
        sy += 1.05;
      });
    } else if (s.type === 'pca' || s.type === 'architecture') {
      const cards = s.cards;
      cards.forEach((cd, cIdx) => {
        const cx = 0.8 + cIdx * 3.95;
        slide.addShape(pptx.ShapeType.roundRect, { x: cx, y: 1.5, w: 3.8, h: 5.2, fill: { color: C.white }, line: { color: C.slateLight, width: 1 } });
        slide.addText(cd.tit, { x: cx + 0.2, y: 1.8, w: 3.4, h: 0.7, fontFace: 'Arial', fontSize: 13, bold: true, color: C.navyPrimary });
        slide.addText(cd.desc, { x: cx + 0.2, y: 2.6, w: 3.4, h: 3.8, fontFace: 'Arial', fontSize: 9.5, color: C.slateDark, lineSpacingMultiple: 1.25 });
      });
    } else if (s.type === 'kpi') {
      s.kpis.forEach((k, kIdx) => {
        const kx = 0.8 + kIdx * 2.95;
        slide.addShape(pptx.ShapeType.roundRect, { x: kx, y: 1.5, w: 2.8, h: 5.2, fill: { color: C.navyDark }, line: { color: C.emerald, width: 1.5 } });
        slide.addText(k.val, { x: kx, y: 2.1, w: 2.8, h: 0.9, fontFace: 'Arial', fontSize: 28, bold: true, color: C.emerald, align: 'center' });
        slide.addText(k.lab.toUpperCase(), { x: kx + 0.15, y: 3.1, w: 2.5, h: 0.5, fontFace: 'Arial', fontSize: 10, bold: true, color: C.white, align: 'center' });
        slide.addText(k.desc, { x: kx + 0.2, y: 3.8, w: 2.4, h: 2.2, fontFace: 'Arial', fontSize: 9.5, color: '94A3B8', align: 'center', lineSpacingMultiple: 1.2 });
      });
    } else if (s.type === 'approval') {
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.5, w: 11.73, h: 1.2, fill: { color: C.bgLight }, line: { color: C.slateLight, width: 1 } });
      slide.addText(s.declaration, { x: 1.1, y: 1.65, w: 11.13, h: 0.9, fontFace: 'Arial', fontSize: 9.5, color: C.slateDark, lineSpacingMultiple: 1.25 });

      [s.sign1, s.sign2].forEach((sg, sIdx) => {
        const sx = sIdx === 0 ? 1.5 : 7.0;
        slide.addShape(pptx.ShapeType.roundRect, { x: sx, y: 3.1, w: 4.8, h: 3.3, fill: { color: C.white }, line: { color: sIdx === 0 ? C.navyPrimary : C.emerald, width: 1.5 } });
        slide.addText(sg.title, { x: sx + 0.2, y: 3.3, w: 4.4, h: 0.3, fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.slateMedium, align: 'center' });
        slide.addText(sg.name, { x: sx + 0.2, y: 3.65, w: 4.4, h: 0.4, fontFace: 'Arial', fontSize: 13, bold: true, color: sIdx === 0 ? C.navyPrimary : C.emeraldDark, align: 'center' });
        slide.addText(sg.role, { x: sx + 0.2, y: 4.05, w: 4.4, h: 0.3, fontFace: 'Arial', fontSize: 9, color: C.slateMedium, align: 'center' });
        slide.addShape(pptx.ShapeType.line, { x: sx + 0.7, y: 5.3, w: 3.4, h: 0, line: { color: C.slateMedium, width: 1, dashType: 'dash' } });
        slide.addText(sIdx === 0 ? 'Date et Cachet Officiel' : 'Visa de Conformité 100%', { x: sx + 0.2, y: 5.5, w: 4.4, h: 0.3, fontFace: 'Arial', fontSize: 8, italic: true, color: C.slateMedium, align: 'center' });
      });
    }
  });

  return pptx.writeFile({ fileName: PPTX_OUTPUT });
}

// -------------------------------------------------------------
// 2. GÉNÉRATION DU DIAPORAMA HTML INTERACTIF AVEC ANIMATIONS DE FLÈCHES
// -------------------------------------------------------------
function buildHtmlSlides() {
  console.log('🌐 Génération du Diaporama HTML interactif avec animations de flèches...');

  const slidesJson = JSON.stringify(SLIDES_DATA);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FCT Automobile - Diaporama Officiel de Direction (40 Slides)</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy-dark: #0a192f;
    --navy-primary: #1e3a8a;
    --blue-accent: #0284c7;
    --emerald: #10b981;
    --emerald-dark: #059669;
    --slate-dark: #1e293b;
    --slate-medium: #64748b;
    --slate-light: #e2e8f0;
    --bg-light: #f8fafc;
    --white: #ffffff;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #030712;
    color: #0f172a;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    user-select: none;
  }

  /* Barre de Contrôle Supérieure */
  header.nav-strip {
    height: 52px;
    background: rgba(10, 25, 47, 0.98);
    border-bottom: 2px solid var(--emerald);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    color: white;
    z-index: 100;
  }

  .nav-left { display: flex; align-items: center; gap: 16px; font-size: 13px; font-weight: 700; }
  .nav-left img { height: 28px; background: white; padding: 2px 6px; border-radius: 4px; }

  .nav-controls { display: flex; align-items: center; gap: 12px; font-size: 12px; }
  .btn-ctrl {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.25);
    color: white;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
  }
  .btn-ctrl:hover { background: var(--emerald); border-color: var(--emerald); }
  .btn-ctrl.active { background: var(--emerald); }

  /* Conteneur Plein Écran de Présentation */
  main.presentation-viewport {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    position: relative;
  }

  .slide-stage {
    width: 100%;
    max-width: 1400px;
    aspect-ratio: 16 / 9;
    max-height: calc(100vh - 90px);
    background: white;
    border-radius: 14px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.6);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }

  /* Slide En-tête */
  .stage-header {
    background: var(--navy-dark);
    color: white;
    padding: 14px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid var(--emerald);
    flex-shrink: 0;
  }
  .stage-tag { font-size: 10px; font-weight: 800; letter-spacing: 2px; color: var(--emerald); text-transform: uppercase; }
  .stage-title { font-size: 18px; font-weight: 800; color: white; margin-top: 2px; }

  /* Slide Corps */
  .stage-body {
    flex: 1;
    min-height: 0;
    padding: 20px 28px;
    background: var(--bg-light);
    display: flex;
    position: relative;
    overflow: hidden;
  }

  /* Slide Pied */
  .stage-footer {
    height: 38px;
    background: white;
    border-top: 1px solid var(--slate-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 28px;
    font-size: 11px;
    color: var(--slate-medium);
    flex-shrink: 0;
  }

  /* Layout Spécifique Module / Web */
  .module-layout {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 20px;
  }

  .screen-wrapper {
    flex: 1.85;
    height: 100%;
    border-radius: 10px;
    overflow: hidden;
    border: 1.5px solid #cbd5e1;
    position: relative;
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    background: #000;
  }

  .screen-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }

  .panel-wrapper {
    flex: 1;
    height: 100%;
    background: white;
    border-radius: 10px;
    border: 1px solid var(--slate-light);
    padding: 18px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  /* FLÈCHES ANIMÉES ET BOÎTES DE DIALOGUE INTERACTIVES */
  .annot-pointer {
    position: absolute;
    transform: translate(-50%, -100%);
    pointer-events: none;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0;
    transform-origin: bottom center;
  }

  .annot-pointer.active {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
    animation: bounceDown 1.8s infinite alternate ease-in-out;
  }

  @keyframes bounceDown {
    0% { transform: translate(-50%, -100%) translateY(0); }
    100% { transform: translate(-50%, -100%) translateY(10px); }
  }

  .dialog-box {
    background: rgba(10, 25, 47, 0.95);
    color: white;
    backdrop-filter: blur(12px);
    border: 1.5px solid var(--emerald);
    padding: 10px 14px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    max-width: 260px;
    font-size: 11px;
    line-height: 1.4;
    text-align: center;
  }

  .dialog-box strong { color: var(--emerald); display: block; margin-bottom: 4px; font-size: 12px; }

  .arrow-svg {
    width: 32px;
    height: 38px;
    fill: var(--emerald);
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
    margin-top: -2px;
  }

  /* Indicateur d'étape d'animation dans la slide */
  .click-hint {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    font-size: 11px;
    padding: 6px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
  }

  /* Slide Cover */
  .cover-stage {
    background: linear-gradient(135deg, #0a192f 0%, #0d2757 60%, #0369a1 100%);
    color: white;
    padding: 40px 60px;
    justify-content: space-between;
  }

  /* Responsive & Fullscreen */
  :fullscreen .stage-stage {
    max-height: 100vh;
    border-radius: 0;
  }
</style>
</head>
<body>

<header class="nav-strip">
  <div class="nav-left">
    <img src="/fct-logo.png" alt="Logo FCT">
    <span>Franchise Conseils Trading · Manuel & Diaporama Officiel de Direction (40 Slides)</span>
  </div>

  <div class="nav-controls">
    <span id="slideCounter" style="font-weight: 800; color: var(--emerald);">1 / 40</span>
    <button class="btn-ctrl" onclick="prevSlide()">◀ Précédent</button>
    <button class="btn-ctrl" onclick="nextSlide()">Suivant ▶</button>
    <button class="btn-ctrl" id="btnAuto" onclick="toggleAuto()">⏱️ Auto : OFF</button>
    <button class="btn-ctrl" onclick="toggleFullscreen()">⛶ Plein Écran</button>
  </div>
</header>

<main class="presentation-viewport">
  <div class="slide-stage" id="slideStage" onclick="handleStageClick()">
    <!-- Le contenu de la slide courante est injecté ici dynamiquement -->
  </div>
</main>

<script>
const slides = ${slidesJson};
let currentIdx = 0;
let currentStep = 0; // Étape d'animation fléchée dans la slide courante
let autoTimer = null;

function renderSlide() {
  const s = slides[currentIdx];
  const total = slides.length;
  document.getElementById('slideCounter').innerText = (currentIdx + 1) + ' / ' + total;
  const stage = document.getElementById('slideStage');

  if (s.type === 'cover' || s.type === 'closing') {
    stage.className = 'slide-stage cover-stage';
    stage.innerHTML = \`
      <div>
        <div style="display:flex; align-items:center; gap:16px;">
          <img src="/fct-logo.png" style="height:48px; background:white; padding:4px 8px; border-radius:6px;">
          <span style="color:var(--emerald); font-weight:800; font-size:12px; letter-spacing:2px;">\${s.tag}</span>
        </div>
        <h1 style="font-size:32px; font-weight:900; margin:16px 0 8px; line-height:1.2;">\${s.title.replace('\\n', '<br>')}</h1>
        <p style="font-size:15px; color:#94a3b8; max-width:900px;">\${s.subtitle}</p>
      </div>

      \${s.metrics ? \`
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin-top:20px;">
          \${s.metrics.map(m => \`
            <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); padding:16px; border-radius:8px;">
              <div style="font-size:10px; color:#94a3b8; font-weight:700;">\${m.label}</div>
              <div style="font-size:16px; font-weight:900; color:white; margin-top:4px;">\${m.val}</div>
            </div>
          \`).join('')}
        </div>
      \` : ''}

      \${s.contacts ? \`
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin-top:20px;">
          \${s.contacts.map(c => \`
            <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); padding:16px; border-radius:8px;">
              <div style="font-size:11px; color:var(--emerald); font-weight:800;">\${c.tit}</div>
              <div style="font-size:12px; color:white; margin-top:6px; line-height:1.4;">\${c.det.replace(/\\n/g, '<br>')}</div>
            </div>
          \`).join('')}
        </div>
      \` : ''}

      <div style="font-size:11px; color:#64748b; border-top:1px solid rgba(255,255,255,0.15); padding-top:12px; display:flex; justify-content:space-between;">
        <span>Franchise Conseils Trading (FCT SARL) · Bonamoussadi, Douala</span>
        <span style="color:var(--emerald); font-weight:700;">Édition Direction 2026 · Clic souris pour avancer</span>
      </div>
    \`;
    return;
  }

  // Slide Standard
  stage.className = 'slide-stage';

  let bodyContent = '';

  if (s.type === 'module' || s.type === 'web') {
    const arrows = s.arrows || [];
    bodyContent = \`
      <div class="module-layout">
        <div class="screen-wrapper">
          <img src="scripts/presentation_pdf/screenshots/\${s.img}" class="screen-img" alt="\${s.title}">
          
          <!-- Flèches Animées Interactives -->
          \${arrows.map((ar, aIdx) => \`
            <div class="annot-pointer \${aIdx < currentStep ? 'active' : ''}" style="left:\${ar.x}%; top:\${ar.y}%;">
              <div class="dialog-box">
                <strong>\${ar.target}</strong>
                \${ar.text}
              </div>
              <svg class="arrow-svg" viewBox="0 0 24 24">
                <path d="M12 24l-8-10h5v-14h6v14h5z"/>
              </svg>
            </div>
          \`).join('')}
        </div>

        <div class="panel-wrapper">
          <h3 style="font-size:15px; font-weight:800; color:var(--navy-primary); margin-bottom:8px;">\${s.title}</h3>
          <p style="font-size:11px; color:var(--slate-dark); line-height:1.5; margin-bottom:12px;">\${s.desc}</p>
          
          <div style="font-size:11px; font-weight:800; color:var(--emerald-dark); margin-bottom:8px; text-transform:uppercase;">
            Éléments Clés & Annotations :
          </div>

          \${arrows.map((ar, aIdx) => \`
            <div style="padding:8px 10px; border-radius:6px; margin-bottom:8px; border:1px solid \${aIdx < currentStep ? 'var(--emerald)' : 'var(--slate-light)'}; background:\${aIdx < currentStep ? '#ecfdf5' : 'var(--bg-light)'}; transition:0.3s;">
              <strong style="font-size:10.5px; color:\${aIdx < currentStep ? 'var(--emerald-dark)' : 'var(--slate-dark)'};">
                \${aIdx + 1}. \${ar.target}
              </strong>
              <div style="font-size:10px; color:var(--slate-medium); margin-top:2px;">\${ar.text}</div>
            </div>
          \`).join('')}

          <div class="click-hint" style="margin-top:auto;">
            💡 <span>Cliquez sur l'écran pour afficher la flèche suivante (\${currentStep} / \${arrows.length})</span>
          </div>
        </div>
      </div>
    \`;
  } else if (s.type === 'gateway') {
    bodyContent = \`
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; width:100%; height:100%;">
        <div style="background:white; border-radius:8px; padding:18px; border-top:4px solid var(--blue-accent);">
          <h4 style="color:var(--blue-accent); font-size:13px; font-weight:800; margin-bottom:10px;">\${s.webTitle}</h4>
          <div style="font-size:11px; color:var(--slate-dark); line-height:1.8;">\${s.webPoints.join('<br>')}</div>
        </div>
        <div style="background:var(--navy-dark); color:white; border-radius:8px; padding:18px; border:2px solid var(--emerald);">
          <h4 style="color:var(--emerald); font-size:13px; font-weight:800; margin-bottom:10px;">\${s.hubTitle}</h4>
          <div style="font-size:11px; color:#e2e8f0; line-height:1.8;">\${s.hubPoints.join('<br>')}</div>
        </div>
        <div style="background:white; border-radius:8px; padding:18px; border-top:4px solid var(--navy-primary);">
          <h4 style="color:var(--navy-primary); font-size:13px; font-weight:800; margin-bottom:10px;">\${s.erpTitle}</h4>
          <div style="font-size:11px; color:var(--slate-dark); line-height:1.8;">\${s.erpPoints.join('<br>')}</div>
        </div>
      </div>
    \`;
  } else if (s.type === 'legal') {
    bodyContent = \`
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; width:100%; height:100%;">
        <div style="background:white; border-radius:8px; padding:18px; border:1px solid var(--slate-light);">
          <h4 style="font-size:14px; font-weight:800; color:var(--navy-primary); margin-bottom:12px;">\${s.leftTitle}</h4>
          \${s.items.map(it => \`
            <div style="display:flex; justify-content:space-between; font-size:11px; padding:6px 0; border-bottom:1px dashed #e2e8f0;">
              <strong>\${it.label}</strong>
              <span style="color:var(--slate-medium);">\${it.val}</span>
            </div>
          \`).join('')}
        </div>
        <div style="background:white; border-radius:8px; padding:18px; border:1px solid var(--slate-light);">
          <h4 style="font-size:14px; font-weight:800; color:var(--navy-primary); margin-bottom:12px;">\${s.rightTitle}</h4>
          \${s.pillars.map(p => \`
            <div style="background:var(--bg-light); border-left:3px solid var(--emerald); padding:10px; border-radius:6px; margin-bottom:10px;">
              <strong style="color:var(--emerald-dark); font-size:11px;">\${p.tit}</strong>
              <p style="font-size:10px; color:var(--slate-dark); margin-top:2px;">\${p.desc}</p>
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  } else if (s.type === 'summary') {
    bodyContent = \`
      <div style="display:flex; flex-direction:column; gap:10px; width:100%; height:100%;">
        \${s.steps.map(st => \`
          <div style="background:white; border-radius:8px; padding:12px 18px; border:1px solid var(--slate-light); display:flex; gap:20px; align-items:center;">
            <strong style="color:var(--navy-primary); font-size:13px; min-width:200px;">\${st.step}</strong>
            <span style="font-size:11px; color:var(--slate-dark); line-height:1.4;">\${st.desc}</span>
          </div>
        \`).join('')}
      </div>
    \`;
  } else if (s.type === 'approval') {
    bodyContent = \`
      <div style="display:flex; flex-direction:column; gap:20px; width:100%; height:100%;">
        <div style="background:white; border-radius:8px; padding:14px 20px; border:1px solid var(--slate-light); font-size:12px; line-height:1.6;">
          \${s.declaration}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; flex:1;">
          <div style="background:white; border-radius:8px; padding:20px; border:1.5px solid var(--navy-primary); text-align:center; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-size:10px; color:var(--slate-medium); font-weight:800;">\${s.sign1.title}</div>
              <div style="font-size:16px; font-weight:900; color:var(--navy-primary); margin-top:6px;">\${s.sign1.name}</div>
              <div style="font-size:11px; color:var(--slate-medium);">\${s.sign1.role}</div>
            </div>
            <div style="border-bottom:1px dashed #94a3b8; height:40px; margin:0 40px;"></div>
            <div style="font-size:10px; color:#94a3b8; font-style:italic;">Date et Cachet Officiel de Direction</div>
          </div>
          <div style="background:white; border-radius:8px; padding:20px; border:1.5px solid var(--emerald); text-align:center; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-size:10px; color:var(--slate-medium); font-weight:800;">\${s.sign2.title}</div>
              <div style="font-size:16px; font-weight:900; color:var(--emerald-dark); margin-top:6px;">\${s.sign2.name}</div>
              <div style="font-size:11px; color:var(--slate-medium);">\${s.sign2.role}</div>
            </div>
            <div style="border-bottom:1px dashed #94a3b8; height:40px; margin:0 40px;"></div>
            <div style="font-size:10px; color:var(--emerald-dark); font-style:italic;">Visa de Conformité 100% Validé (107 Tests Vitest)</div>
          </div>
        </div>
      </div>
    \`;
  } else {
    bodyContent = \`
      <div style="display:grid; grid-template-columns:repeat(\${(s.cards || s.kpis || []).length}, 1fr); gap:16px; width:100%; height:100%;">
        \${(s.cards || []).map(cd => \`
          <div style="background:white; border-radius:8px; padding:20px; border:1px solid var(--slate-light);">
            <h4 style="font-size:14px; font-weight:800; color:var(--navy-primary); margin-bottom:8px;">\${cd.tit}</h4>
            <p style="font-size:11px; color:var(--slate-dark); line-height:1.6;">\${cd.desc}</p>
          </div>
        \`).join('')}
        \${(s.kpis || []).map(k => \`
          <div style="background:var(--navy-dark); border:1.5px solid var(--emerald); border-radius:8px; padding:24px; text-align:center; color:white; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:36px; font-weight:900; color:var(--emerald); margin-bottom:6px;">\${k.val}</div>
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:6px;">\${k.lab}</div>
            <div style="font-size:10px; color:#94a3b8;">\${k.desc}</div>
          </div>
        \`).join('')}
      </div>
    \`;
  }

  stage.innerHTML = \`
    <div class="stage-header">
      <div>
        <div class="stage-tag">\${s.tag}</div>
        <div class="stage-title">\${s.title}</div>
      </div>
      <div style="font-size:10px; font-weight:800; background:#112240; color:var(--emerald); border:1px solid var(--emerald); padding:4px 10px; border-radius:20px;">
        ÉDITION DIRECTION 2026
      </div>
    </div>
    <div class="stage-body">
      \${bodyContent}
    </div>
    <div class="stage-footer">
      <span>Franchise Conseils Trading · Carrefour Santa Barbara, Bonamoussadi, Douala</span>
      <span style="font-weight:700; color:var(--navy-primary);">Slide \${currentIdx + 1} / \${slides.length}</span>
    </div>
  \`;
}

function handleStageClick() {
  const s = slides[currentIdx];
  const maxSteps = (s.arrows || []).length;

  if (maxSteps > 0 && currentStep < maxSteps) {
    currentStep++;
    renderSlide();
  } else {
    nextSlide();
  }
}

function nextSlide() {
  if (currentIdx < slides.length - 1) {
    currentIdx++;
    currentStep = 0;
    renderSlide();
  }
}

function prevSlide() {
  if (currentIdx > 0) {
    currentIdx--;
    currentStep = 0;
    renderSlide();
  }
}

function toggleAuto() {
  const btn = document.getElementById('btnAuto');
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btn.innerText = '⏱️ Auto : OFF';
    btn.classList.remove('active');
  } else {
    autoTimer = setInterval(handleStageClick, 3500);
    btn.innerText = '⏱️ Auto : ON (3.5s)';
    btn.classList.add('active');
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') handleStageClick();
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});

// Lancement
renderSlide();
</script>
</body>
</html>
`;

  fs.writeFileSync(HTML_OUTPUT, html, 'utf-8');
  console.log(`✅ Diaporama HTML interactif généré : ${HTML_OUTPUT}`);
}

async function main() {
  try {
    await buildPptx();
    console.log(`🎉 DIAPORAMA PPTX CRÉÉ : ${PPTX_OUTPUT}`);
    buildHtmlSlides();
    console.log(`🎉 SUITE DE PRÉSENTATION COMPLÈTE (40 SLIDES) ACHEVÉE AVEC SUCCÈS !`);
  } catch (err) {
    console.error('❌ Erreur lors de la génération :', err);
  }
}

main();
