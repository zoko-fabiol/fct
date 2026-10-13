/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Générateur de Diaporama PowerPoint de Prestige
 * Franchise Conseils Trading - Douala, Cameroun
 * Thème : "L'Effet Passerelle : Synergie Temps Réel entre le Site Public et l'ERP Interne"
 */

import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.resolve('scripts/presentation_pdf/screenshots');
const LOGO_PATH = path.resolve('public/fct-logo.png');
const PPTX_OUTPUT = path.resolve('FCT_AUTOMOBILE_PRESENTATION_OFFICIELLE_SYNERGIE_PORTAIL_ERP.pptx');

console.log('⚡ Initialisation du générateur PowerPoint de Direction FCT...');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 pouces
pptx.author = 'Franchise Conseils Trading';
pptx.company = 'FCT Automobile Douala';
pptx.title = 'FCT Automobile - Synergie Portail Web Public & Plateforme ERP';
pptx.subject = 'Présentation Officielle de Direction et Manuel d\'Exploitation 2026';

// Palette de Couleurs Officielles FCT
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

// Helper pour ajouter le bandeau d'en-tête officiel et le pied de page
function applyHeaderFooter(slide, sectionTag, slideTitle, pageNum, totalPages = 15) {
  // Bandeau supérieur
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 1.15,
    fill: { color: C.navyDark }
  });
  
  // Filet accent émeraude
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 1.15, w: 13.33, h: 0.05,
    fill: { color: C.emerald }
  });

  // Logo FCT
  if (fs.existsSync(LOGO_PATH)) {
    slide.addImage({
      path: LOGO_PATH,
      x: 0.6, y: 0.22, w: 1.8, h: 0.72
    });
  }

  // Section Tag & Titre
  slide.addText(sectionTag.toUpperCase(), {
    x: 2.7, y: 0.22, w: 9.0, h: 0.25,
    fontFace: 'Arial', fontSize: 9, bold: true, color: C.emerald,
    letterSpacing: 2
  });

  slide.addText(slideTitle, {
    x: 2.7, y: 0.47, w: 9.5, h: 0.55,
    fontFace: 'Arial', fontSize: 18, bold: true, color: C.white
  });

  // Badge Version
  slide.addText('ÉDITION DIRECTION 2026', {
    x: 10.6, y: 0.35, w: 2.2, h: 0.45,
    fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.emerald,
    align: 'center', fill: { color: '112240' },
    line: { color: C.emerald, width: 1 }
  });

  // Pied de page institutionnel
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.05, w: 13.33, h: 0.45,
    fill: { color: C.bgLight },
    line: { color: C.slateLight, width: 1 }
  });

  slide.addText('Franchise Conseils Trading (FCT) · Carrefour Santa Barbara, Bonamoussadi, Douala · Zone CEMAC (XAF)', {
    x: 0.6, y: 7.12, w: 9.0, h: 0.3,
    fontFace: 'Arial', fontSize: 8.5, color: C.slateMedium
  });

  slide.addText(`Slide ${pageNum} / ${totalPages}`, {
    x: 11.0, y: 7.12, w: 1.8, h: 0.3,
    fontFace: 'Arial', fontSize: 9, bold: true, color: C.navyPrimary, align: 'right'
  });
}

// -------------------------------------------------------------
// SLIDE 1 : PAGE DE GARDE EXECUTIVE
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  slide.background = { color: C.navyDark };

  // Forme de fond décorative
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 0.8, w: 11.73, h: 5.9,
    fill: { color: '0D1F3C' },
    line: { color: '1E3A8A', width: 1.5 }
  });

  // Logo FCT Principal
  if (fs.existsSync(LOGO_PATH)) {
    slide.addImage({
      path: LOGO_PATH,
      x: 1.5, y: 1.3, w: 2.8, h: 1.15
    });
  }

  slide.addText('RÉPUBLIQUE DU CAMEROUN · ZONE ÉCONOMIQUE CEMAC', {
    x: 1.5, y: 2.7, w: 10.0, h: 0.3,
    fontFace: 'Arial', fontSize: 10, bold: true, color: C.emerald,
    letterSpacing: 2.5
  });

  slide.addText('ÉCOSYSTÈME NUMÉRIQUE INTÉGRÉ\nERP, CRM & VITRINE CLIENT FCT', {
    x: 1.5, y: 3.05, w: 10.3, h: 1.3,
    fontFace: 'Arial', fontSize: 28, bold: true, color: C.white,
    lineSpacingMultiple: 1.15
  });

  slide.addText('L\'Effet Passerelle : Synergie et Synchronisation en Temps Réel entre le Portail Web Public et la Plateforme ERP d\'Exploitation', {
    x: 1.5, y: 4.45, w: 10.3, h: 0.6,
    fontFace: 'Arial', fontSize: 13, color: '94A3B8'
  });

  // 3 Cartouches Indicateurs
  const metrics = [
    { label: 'PÉRIMÈTRE MÉTIER', val: '19 Modules ERP + 7 Pages Web' },
    { label: 'CONFORMITÉ MONÉTAIRE', val: '100% XAF BEAC & TVA 19.25%' },
    { label: 'TEMPS DE SYNCHRONISATION', val: 'Instantané Cloud (< 200 ms)' }
  ];

  metrics.forEach((m, idx) => {
    const x = 1.5 + idx * 3.5;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 5.25, w: 3.3, h: 0.95,
      fill: { color: '112240' },
      line: { color: C.emerald, width: 1 }
    });
    slide.addText(m.label, {
      x: x + 0.15, y: 5.35, w: 3.0, h: 0.25,
      fontFace: 'Arial', fontSize: 8, bold: true, color: '94A3B8'
    });
    slide.addText(m.val, {
      x: x + 0.15, y: 5.6, w: 3.0, h: 0.45,
      fontFace: 'Arial', fontSize: 11, bold: true, color: C.white
    });
  });

  // Footer de couverture
  slide.addText('Franchise Conseils Trading (FCT SARL) · Capital 10 000 000 FCFA · Douala, Cameroun · Version 2.4.0', {
    x: 0.8, y: 6.9, w: 11.73, h: 0.35,
    fontFace: 'Arial', fontSize: 9, color: '64748B', align: 'center'
  });
}

// -------------------------------------------------------------
// SLIDE 2 : CADRE INSTITUTIONNEL & IDENTITÉ LÉGALE FCT
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Gouvernance & Statuts', 'Cadre Institutionnel, Légal & Monétaire CEMAC', 2);

  // Colonne Gauche : Données Juridiques
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.45, w: 5.6, h: 5.3,
    fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
  });

  slide.addText('Fiche Signalétique de la Concession', {
    x: 1.1, y: 1.65, w: 5.0, h: 0.35,
    fontFace: 'Arial', fontSize: 14, bold: true, color: C.navyPrimary
  });

  const legalItems = [
    { label: 'Raison Sociale :', val: 'Franchise Conseils Trading (FCT)' },
    { label: 'Forme Juridique :', val: 'SARL au capital de 10 000 000 FCFA' },
    { label: 'RCCM Douala :', val: 'RC/DLA/2022/B/4581 (Greffe TPI)' },
    { label: 'Identifiant NIU :', val: 'M052217894210L (DGI Cameroun)' },
    { label: 'Régime Fiscal :', val: 'Régime Réel Simplifié (TVA 19.25%)' },
    { label: 'Agrément Transports :', val: 'N° 00412/MINT/DTT (Ministère)' },
    { label: 'Implantation :', val: 'Carrefour Santa Barbara, Bonamoussadi' },
    { label: 'Banques d\'exploitation :', val: 'BICEC Douala Bonanjo & Afriland Akwa' }
  ];

  let currY = 2.15;
  legalItems.forEach(item => {
    slide.addText(item.label, {
      x: 1.1, y: currY, w: 2.1, h: 0.45,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: C.slateDark
    });
    slide.addText(item.val, {
      x: 3.2, y: currY, w: 3.0, h: 0.45,
      fontFace: 'Arial', fontSize: 9.5, color: C.slateMedium
    });
    currY += 0.52;
  });

  // Colonne Droite : Les 3 Piliers de Confiance
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 1.45, w: 5.7, h: 5.3,
    fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
  });

  slide.addText('Les 3 Piliers Fondateurs FCT Automobile', {
    x: 7.1, y: 1.65, w: 5.1, h: 0.35,
    fontFace: 'Arial', fontSize: 14, bold: true, color: C.navyPrimary
  });

  const pillars = [
    {
      tit: '1. ZÉRO ÉCART DE CAISSE (BILLETAGE BEAC)',
      desc: 'Comptage physique obligatoire par valeur faciale (10k à 500 FCFA) à l\'ouverture et à la clôture. Aucun centime toléré en conformité zone BEAC.'
    },
    {
      tit: '2. CARNET DE SANTÉ NUMÉRIQUE TRANSPARENT',
      desc: 'Passeport technique public infalsifiable accessible par la plaque CEMAC, listant chaque vidange et pièce changée en atelier certifié.'
    },
    {
      tit: '3. BILINGUISME STRICT INTÉGRAL [FR | EN]',
      desc: 'Bascule instantanée sur l\'ERP et le site pour servir avec excellence la clientèle corporate, diplomatique et les consortiums pétroliers.'
    }
  ];

  let pY = 2.15;
  pillars.forEach(p => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.1, y: pY, w: 5.1, h: 1.35,
      fill: { color: C.bgLight }, line: { color: C.emerald, width: 1 }
    });
    slide.addText(p.tit, {
      x: 7.25, y: pY + 0.1, w: 4.8, h: 0.3,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: C.emeraldDark
    });
    slide.addText(p.desc, {
      x: 7.25, y: pY + 0.42, w: 4.8, h: 0.8,
      fontFace: 'Arial', fontSize: 8.5, color: C.slateDark
    });
    pY += 1.5;
  });
}

// -------------------------------------------------------------
// SLIDE 3 : LE COEUR DU SUJET - L'EFFET PASSERELLE TEMPS RÉEL
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Architecture d\'Intégration', 'L\'Effet Passerelle : Synergie Temps Réel Site Web ⇄ ERP', 3);

  // Boîte Gauche : Portail Web Public
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.45, w: 3.7, h: 5.3,
    fill: { color: C.white }, line: { color: C.blueAccent, width: 1.5 }
  });
  slide.addText('VITRINE WEB GRAND PUBLIC\n(fct-automobile.cm)', {
    x: 1.0, y: 1.65, w: 3.3, h: 0.6,
    fontFace: 'Arial', fontSize: 12, bold: true, color: C.blueAccent, align: 'center'
  });
  const webP = [
    '• Consultation du catalogue en direct',
    '• Simulateur de réservation dynamique',
    '• Demande de facture proforma en ligne',
    '• Vérification Carnet de Santé par plaque',
    '• Espace client privé authentifié',
    '• Contact WhatsApp VIP immédiat'
  ];
  slide.addText(webP.join('\n\n'), {
    x: 1.0, y: 2.45, w: 3.3, h: 4.0,
    fontFace: 'Arial', fontSize: 9, color: C.slateDark
  });

  // Boîte Centrale : Le Moteur Passerelle Firestore
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.8, y: 1.45, w: 3.73, h: 5.3,
    fill: { color: C.navyDark }, line: { color: C.emerald, width: 2 }
  });
  slide.addText('MOTEUR PASSERELLE CLOUD\n(Google Firestore Temps Réel)', {
    x: 5.0, y: 1.65, w: 3.33, h: 0.6,
    fontFace: 'Arial', fontSize: 12, bold: true, color: C.emerald, align: 'center'
  });
  const hubP = [
    '⚡ Latence de propagation < 200 ms',
    '🔒 Sécurité RBAC & Schémas Zod stricts',
    '🔄 Synchronisation bi-directionnelle',
    '🛡️ Anti-Surbooking Déterministe',
    '📶 Cache Local persistant IndexedDB',
    '📑 Journal d\'Audit immuable 10 ans OHADA'
  ];
  slide.addText(hubP.join('\n\n'), {
    x: 5.0, y: 2.45, w: 3.33, h: 4.0,
    fontFace: 'Arial', fontSize: 9, bold: true, color: C.white
  });

  // Boîte Droite : ERP & CRM Interne
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.8, y: 1.45, w: 3.7, h: 5.3,
    fill: { color: C.white }, line: { color: C.navyPrimary, width: 1.5 }
  });
  slide.addText('PLATEFORME ERP & CRM\n(Direction & Collaborateurs)', {
    x: 9.0, y: 1.65, w: 3.3, h: 0.6,
    fontFace: 'Arial', fontSize: 12, bold: true, color: C.navyPrimary, align: 'center'
  });
  const erpP = [
    '• Cockpit & Tableau de bord Direction',
    '• Émission des contrats avec QR Code',
    '• Caisse certifiée avec Billetage BEAC',
    '• Gestion atelier & Ordres de Réparation',
    '• Suivi des chauffeurs VIP et missions',
    '• Facturation officielle avec TVA 19.25%'
  ];
  slide.addText(erpP.join('\n\n'), {
    x: 9.0, y: 2.45, w: 3.3, h: 4.0,
    fontFace: 'Arial', fontSize: 9, color: C.slateDark
  });
}

// -------------------------------------------------------------
// SLIDE 4 : FLUX OPÉRATIONNEL N°1 - DE LA RÉSERVATION WEB À LA CAISSE ERP
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Cas d\'Usage Transverse N°1', 'Cycle de Vie : Réservation en Ligne ➔ Contrat ➔ Caisse BEAC', 4);

  const steps = [
    {
      num: 'ÉTAPE 1',
      title: 'Réservation sur le Site',
      loc: 'Portail Client Web',
      text: 'Le client choisit son véhicule (ex: Prado TX-L), ses dates et l\'option chauffeur VIP (+15 000 FCFA/j). Devis calculé sans rechargement.'
    },
    {
      num: 'ÉTAPE 2',
      title: 'Verrouillage Instantané',
      loc: 'Google Cloud Firestore',
      text: 'Le véhicule passe automatiquement en statut "RÉSERVÉ" (< 200 ms). Aucune double réservation possible sur le parc automobile.'
    },
    {
      num: 'ÉTAPE 3',
      title: 'Alerte & Dossier ERP',
      loc: 'ERP Agence Bonamoussadi',
      text: 'Le commercial reçoit une notification push. Le dossier apparaît dans le planning Gantt et prépare le contrat de location vectoriel.'
    },
    {
      num: 'ÉTAPE 4',
      title: 'Encaissement & Billetage',
      loc: 'Caisse FCT Douala',
      text: 'À la prise en charge, la caution (300 000 FCFA) et le loyer sont enregistrés en caisse avec dénombrement de billets BEAC. Reçu certifié émis.'
    }
  ];

  steps.forEach((s, i) => {
    const x = 0.8 + i * 2.95;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: 2.8, h: 5.2,
      fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.5, w: 2.8, h: 0.6,
      fill: { color: i === 0 ? C.blueAccent : i === 1 ? C.emerald : i === 2 ? C.navyPrimary : C.emeraldDark }
    });

    slide.addText(s.num, {
      x, y: 1.6, w: 2.8, h: 0.35,
      fontFace: 'Arial', fontSize: 10, bold: true, color: C.white, align: 'center'
    });

    slide.addText(s.title, {
      x: x + 0.15, y: 2.25, w: 2.5, h: 0.55,
      fontFace: 'Arial', fontSize: 12, bold: true, color: C.navyPrimary, align: 'center'
    });

    slide.addText(s.loc.toUpperCase(), {
      x: x + 0.15, y: 2.85, w: 2.5, h: 0.3,
      fontFace: 'Arial', fontSize: 8, bold: true, color: C.emerald, align: 'center'
    });

    slide.addText(s.text, {
      x: x + 0.2, y: 3.25, w: 2.4, h: 3.2,
      fontFace: 'Arial', fontSize: 9.5, color: C.slateDark, lineSpacingMultiple: 1.2
    });
  });
}

// -------------------------------------------------------------
// SLIDE 5 : FLUX OPÉRATIONNEL N°2 - ATELIER ERP ➔ CARNET DE SANTÉ PUBLIC
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Cas d\'Usage Transverse N°2', 'Transparence Flotte : Atelier ERP ➔ Carnet de Santé Public', 5);

  // Bloc Explicatif Gauche
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.5, w: 5.6, h: 5.2,
    fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
  });

  slide.addText('Le Passeport Technique & Médical du Véhicule', {
    x: 1.1, y: 1.7, w: 5.0, h: 0.35,
    fontFace: 'Arial', fontSize: 13, bold: true, color: C.navyPrimary
  });

  const mntSteps = [
    { tit: '1. Ordre de Réparation (OR) dans l\'ERP :', desc: 'Le chef de parc saisit l\'intervention (vidange 10 000 km, changement filtre à huile et plaquettes avant) avec imputation de stock PMP.' },
    { tit: '2. Clôture & Visa du Mécanicien :', desc: 'Après contrôle des 110 points, le mécanicien signe la fiche d\'intervention. La date et le kilométrage exact sont verrouillés en base.' },
    { tit: '3. Exposition Publique Infalsifiable :', desc: 'Sur le site public (#/carnet-sante), tout client entrant la plaque d\'immatriculation (ex: LT-8841-CE) visualise immédiatement l\'historique intégral.' },
    { tit: '4. Impact Commercial Décisif :', desc: 'Confiance absolue des acheteurs et entreprises locataires : fin des compteurs trafiqués et des entretiens douteux au Cameroun.' }
  ];

  let mY = 2.15;
  mntSteps.forEach(ms => {
    slide.addText(ms.tit, {
      x: 1.1, y: mY, w: 5.0, h: 0.3,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: C.emeraldDark
    });
    slide.addText(ms.desc, {
      x: 1.1, y: mY + 0.28, w: 5.0, h: 0.75,
      fontFace: 'Arial', fontSize: 8.5, color: C.slateDark
    });
    mY += 1.15;
  });

  // Capture Écran Droite : Screenshot réel carnet santé ou maintenance
  const healthImg = path.join(SCREENSHOTS_DIR, 'web_health.png');
  const mntImg = path.join(SCREENSHOTS_DIR, 'maintenance.png');
  const chosenImg = fs.existsSync(healthImg) ? healthImg : mntImg;

  if (fs.existsSync(chosenImg)) {
    slide.addImage({
      path: chosenImg,
      x: 6.8, y: 1.5, w: 5.7, h: 4.2
    });
    slide.addText('Capture d\'écran réelle : Carnet de santé numérique certifié FCT (Données réelles sans simulation)', {
      x: 6.8, y: 5.8, w: 5.7, h: 0.6,
      fontFace: 'Arial', fontSize: 8.5, italic: true, color: C.slateMedium, align: 'center'
    });
  }
}

// -------------------------------------------------------------
// SLIDE 6 : REVUE DU COCKPIT DÉCISIONNEL ERP (DASHBOARD CONNECTÉ)
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Plateforme ERP & CRM', 'Cockpit Décisionnel de Direction & Pilotage Opérationnel', 6);

  const dashImg = path.join(SCREENSHOTS_DIR, 'dashboard.png');
  if (fs.existsSync(dashImg)) {
    slide.addImage({
      path: dashImg,
      x: 0.8, y: 1.45, w: 7.8, h: 5.2
    });
  }

  // Cartouche latéral de synthèse
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.9, y: 1.45, w: 3.6, h: 5.2,
    fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
  });

  slide.addText('Indicateurs du Cockpit', {
    x: 9.1, y: 1.65, w: 3.2, h: 0.35,
    fontFace: 'Arial', fontSize: 13, bold: true, color: C.navyPrimary
  });

  const dashItems = [
    '• Solde Caisse Session en temps réel',
    '• Taux d\'occupation de la flotte (SUV / 4x4)',
    '• Recettes de location et acomptes ventes',
    '• Contrats actifs et alertes de retours',
    '• Véhicules prêts à partir à Bonamoussadi',
    '• Surveillance des anomalies et stocks bas',
    '• Journal d\'activité immédiat de l\'équipe',
    '• Session active Super Administrateur'
  ];

  slide.addText(dashItems.join('\n\n'), {
    x: 9.1, y: 2.15, w: 3.2, h: 4.3,
    fontFace: 'Arial', fontSize: 9, color: C.slateDark
  });
}

// -------------------------------------------------------------
// SLIDE 7 : GESTION DE CAISSE CERTIFIÉE & BILLETAGE BEAC
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Trésorerie & Contrôle Monétaire', 'Gestion de Caisse Immuable & Billetage BEAC Obligatoire', 7);

  const cashImg = path.join(SCREENSHOTS_DIR, 'cash.png');
  if (fs.existsSync(cashImg)) {
    slide.addImage({
      path: cashImg,
      x: 0.8, y: 1.45, w: 7.8, h: 5.2
    });
  }

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.9, y: 1.45, w: 3.6, h: 5.2,
    fill: { color: C.white }, line: { color: C.emerald, width: 1.5 }
  });

  slide.addText('Protocole Anti-Écart BEAC', {
    x: 9.1, y: 1.65, w: 3.2, h: 0.35,
    fontFace: 'Arial', fontSize: 13, bold: true, color: C.emeraldDark
  });

  const cashRules = [
    '1. Dénombrement Physique :',
    'Saisie des coupures de 10k, 5k, 2k, 1k et 500 FCFA à l\'ouverture et clôture.',
    '2. Tolérance Zéro :',
    'Interdiction absolue de clôturer une session avec écart non justifié.',
    '3. Reçus Électroniques REC :',
    'Chaque entrée/sortie génère un reçu numérique avec horodatage et visa.',
    '4. Double Validation Gérant :',
    'Tout décaissement > 50 000 FCFA exige l\'autorisation explicite de la Direction.'
  ];

  slide.addText(cashRules.join('\n\n'), {
    x: 9.1, y: 2.15, w: 3.2, h: 4.3,
    fontFace: 'Arial', fontSize: 8.5, color: C.slateDark
  });
}

// -------------------------------------------------------------
// SLIDE 8 : PARC AUTOMOBILE, SHOWROOM & VALORISATION FLOTTE
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Flotte de Véhicules', 'Parc Automobile de Prestige & Fiches Showroom 3D', 8);

  const showImg = path.join(SCREENSHOTS_DIR, 'showroom.png');
  const vehImg = path.join(SCREENSHOTS_DIR, 'vehicles.png');

  if (fs.existsSync(vehImg)) {
    slide.addImage({
      path: vehImg,
      x: 0.8, y: 1.45, w: 5.7, h: 4.2
    });
    slide.addText('Inventaire Flotte Réelle FCT : Suivi des 5 SUV majeurs en circulation à Douala', {
      x: 0.8, y: 5.8, w: 5.7, h: 0.6,
      fontFace: 'Arial', fontSize: 8.5, italic: true, color: C.slateMedium, align: 'center'
    });
  }

  if (fs.existsSync(showImg)) {
    slide.addImage({
      path: showImg,
      x: 6.8, y: 1.45, w: 5.7, h: 4.2
    });
    slide.addText('Fiche Showroom : Toyota Corolla Cross Hybride (LT-3344-DE) avec galerie HD', {
      x: 6.8, y: 5.8, w: 5.7, h: 0.6,
      fontFace: 'Arial', fontSize: 8.5, italic: true, color: C.slateMedium, align: 'center'
    });
  }
}

// -------------------------------------------------------------
// SLIDE 9 : SÉCURITÉ, CONTRÔLE D'ACCÈS RBAC & CODE PIN
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Sécurité & Gouvernance', 'Contrôle d\'Accès RBAC à 5 Rôles & Sécurité PIN Firestore', 9);

  const usersImg = path.join(SCREENSHOTS_DIR, 'users.png');
  if (fs.existsSync(usersImg)) {
    slide.addImage({
      path: usersImg,
      x: 0.8, y: 1.45, w: 7.2, h: 5.2
    });
  }

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.3, y: 1.45, w: 4.2, h: 5.2,
    fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
  });

  slide.addText('Matrice des 5 Rôles FCT', {
    x: 8.5, y: 1.65, w: 3.8, h: 0.35,
    fontFace: 'Arial', fontSize: 13, bold: true, color: C.navyPrimary
  });

  const rbacRoles = [
    { r: '1. Super Administrateur :', d: 'Accès total sans restriction, gestion des utilisateurs, audits et paramètres généraux.' },
    { r: '2. Gérant d\'Agence (Manager) :', d: 'Validation des contrats, clôture de caisse, affectation des chauffeurs VIP.' },
    { r: '3. Commercial VIP :', d: 'Création des devis, prospection CRM, gestion des réservations et relation client.' },
    { r: '4. Caissier & Trésorier :', d: 'Encaissements, débours autorisés, émission des reçus et comptage billetage.' },
    { r: '5. Chef d\'Atelier & Mécanicien :', d: 'Exécution des 110 points, ordres de réparation, consommations de pièces.' }
  ];

  let rY = 2.1;
  rbacRoles.forEach(ro => {
    slide.addText(ro.r, {
      x: 8.5, y: rY, w: 3.8, h: 0.25,
      fontFace: 'Arial', fontSize: 9, bold: true, color: C.emeraldDark
    });
    slide.addText(ro.d, {
      x: 8.5, y: rY + 0.22, w: 3.8, h: 0.55,
      fontFace: 'Arial', fontSize: 8, color: C.slateDark
    });
    rY += 0.85;
  });
}

// -------------------------------------------------------------
// SLIDE 10 : PANORAMA DES 19 MODULES ERP MÉTIERS
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Cartographie Applicative', 'Les 19 Modules ERP Métiers de FCT Automobile', 10);

  const poles = [
    {
      title: 'PÔLE PILOTAGE & DIRECTION',
      color: C.navyPrimary,
      mods: ['1. Dashboard Exécutif', '2. Rapports & Analytics Excel', '3. Journal d\'Audit Immuable', '4. Centre d\'Assistance & SOP']
    },
    {
      title: 'PÔLE FLOTTE & LOGISTIQUE',
      color: C.emeraldDark,
      mods: ['5. Parc Automobile (110 pts)', '6. Showroom Virtuel 3D', '7. Maintenance & Garages', '8. Stock de Pièces & PMP', '9. Chauffeurs Professionnels VIP']
    },
    {
      title: 'PÔLE COMMERCIAL & CRM',
      color: C.blueAccent,
      mods: ['10. Locations Courte/Longue Durée', '11. Ventes Automobiles & Leasing', '12. CRM & Portefeuille Prospects', '13. Planning & Gantt Réservations']
    },
    {
      title: 'PÔLE FINANCE & CONFORMITÉ',
      color: C.slateDark,
      mods: ['14. Facturation Normée (TVA 19.25%)', '15. Caisse & Billetage BEAC', '16. GED & Fichiers Cloudinary', '17. Notifications Transactionnelles', '18. Utilisateurs & RBAC', '19. Paramètres Généraux']
    }
  ];

  poles.forEach((p, i) => {
    const x = 0.8 + i * 2.95;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: 2.8, h: 5.2,
      fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.5, w: 2.8, h: 0.55,
      fill: { color: p.color }
    });

    slide.addText(p.title, {
      x, y: 1.6, w: 2.8, h: 0.35,
      fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.white, align: 'center'
    });

    let modY = 2.25;
    p.mods.forEach(m => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.15, y: modY, w: 2.5, h: 0.55,
        fill: { color: C.bgLight }, line: { color: C.slateLight, width: 0.8 }
      });
      slide.addText(m, {
        x: x + 0.25, y: modY + 0.1, w: 2.3, h: 0.35,
        fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.slateDark
      });
      modY += 0.68;
    });
  });
}

// -------------------------------------------------------------
// SLIDE 11 : VITRINE WEB CLIENT (7 ÉCRANS CONNECTÉS)
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Portail Client Multicanal', 'La Vitrine Web Publique en 7 Écrans Connectés', 11);

  const webImg = path.join(SCREENSHOTS_DIR, 'web_home.png');
  const portalImg = path.join(SCREENSHOTS_DIR, 'web_portal.png');

  if (fs.existsSync(webImg)) {
    slide.addImage({
      path: webImg,
      x: 0.8, y: 1.45, w: 5.7, h: 4.2
    });
    slide.addText('Page d\'accueil officielle : Moteur de recherche et catalogue synchronisé', {
      x: 0.8, y: 5.8, w: 5.7, h: 0.6,
      fontFace: 'Arial', fontSize: 8.5, italic: true, color: C.slateMedium, align: 'center'
    });
  }

  if (fs.existsSync(portalImg)) {
    slide.addImage({
      path: portalImg,
      x: 6.8, y: 1.45, w: 5.7, h: 4.2
    });
    slide.addText('Espace client authentifié Firebase : Suivi des réservations et devis', {
      x: 6.8, y: 5.8, w: 5.7, h: 0.6,
      fontFace: 'Arial', fontSize: 8.5, italic: true, color: C.slateMedium, align: 'center'
    });
  }
}

// -------------------------------------------------------------
// SLIDE 12 : RÉSILIENCE & PLAN DE CONTINUITÉ D'ACTIVITÉ (PCA/PRA)
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Infrastructure & PCA/PRA', 'Plan de Continuité d\'Activité & Résilience Électrique/Réseau', 12);

  const pcaItems = [
    {
      tit: 'GROUPE ÉLECTROGÈNE 25 kVA AUTOMATIQUE',
      desc: 'Démarrage automatique sous 12 secondes lors des délestages Eneo. Alimentation ininterrompue de l\'ensemble des postes de travail, climatisation agence et serveurs.'
    },
    {
      tit: 'ONDULEURS ON-LINE DOUBLE CONVERSION',
      desc: 'Protection totale contre les micro-coupures et surtensions. Zéro redémarrage intempestif des terminaux de caisse et de facturation.'
    },
    {
      tit: 'DOUBLE ACCÈS INTERNET FIBRE + ROUTEUR 4G/5G',
      desc: 'Liaison fibre principale doublée d\'une bascule instantanée sur réseau cellulaire professionnel. Zéro rupture de synchronisation avec Google Cloud.'
    },
    {
      tit: 'FONCTIONNEMENT HORS-LIGNE (OFFLINE-FIRST)',
      desc: 'Si toutes les connexions chutent, l\'ERP continue de fonctionner en local sur IndexedDB. Réconciliation automatique des flux à la reconnexion.'
    }
  ];

  pcaItems.forEach((item, i) => {
    const x = i % 2 === 0 ? 0.8 : 6.8;
    const y = i < 2 ? 1.5 : 4.2;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 5.7, h: 2.4,
      fill: { color: C.white }, line: { color: C.slateLight, width: 1 }
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.2, y: y + 0.2, w: 5.3, h: 0.45,
      fill: { color: C.bgLight }, line: { color: C.emerald, width: 1 }
    });

    slide.addText(item.tit, {
      x: x + 0.3, y: y + 0.28, w: 5.1, h: 0.3,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: C.navyPrimary
    });

    slide.addText(item.desc, {
      x: x + 0.3, y: y + 0.8, w: 5.1, h: 1.4,
      fontFace: 'Arial', fontSize: 9, color: C.slateDark, lineSpacingMultiple: 1.25
    });
  });
}

// -------------------------------------------------------------
// SLIDE 13 : BILAN QUANTITATIF DE TRANSFORMATION DIGITALE
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Retour sur Investissement', 'Bilan Quantitatif & Gains Opérationnels Mesurés', 13);

  const kpis = [
    { val: '-90%', lab: 'Délai d\'Émission Contrat', desc: 'Passé de 45 minutes (papier) à moins de 3 minutes sur l\'ERP.' },
    { val: '0 FCFA', lab: 'Écart de Caisse Toléré', desc: 'Concordance totale certifiée entre physique et comptabilité.' },
    { val: '< 200 ms', lab: 'Synchronisation Web', desc: 'Disponibilité du parc actualisée en temps réel pour le client.' },
    { val: '100%', lab: 'Traçabilité Atelier', desc: 'Historique des pièces et vidanges visible en carnet de santé.' }
  ];

  kpis.forEach((k, idx) => {
    const x = 0.8 + idx * 2.95;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: 2.8, h: 5.2,
      fill: { color: C.navyDark }, line: { color: C.emerald, width: 1.5 }
    });

    slide.addText(k.val, {
      x, y: 2.1, w: 2.8, h: 0.9,
      fontFace: 'Arial', fontSize: 28, bold: true, color: C.emerald, align: 'center'
    });

    slide.addText(k.lab.toUpperCase(), {
      x: x + 0.15, y: 3.1, w: 2.5, h: 0.5,
      fontFace: 'Arial', fontSize: 10, bold: true, color: C.white, align: 'center'
    });

    slide.addText(k.desc, {
      x: x + 0.2, y: 3.8, w: 2.4, h: 2.2,
      fontFace: 'Arial', fontSize: 9.5, color: '94A3B8', align: 'center', lineSpacingMultiple: 1.2
    });
  });
}

// -------------------------------------------------------------
// SLIDE 14 : APPROBATION FORMELLE & VISAS DE DIRECTION
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  applyHeaderFooter(slide, 'Validation Institutionnelle', 'Registre d\'Approbation & Signatures Officielles', 14);

  // Cartouche de déclaration
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.5, w: 11.73, h: 1.2,
    fill: { color: C.bgLight }, line: { color: C.slateLight, width: 1 }
  });

  slide.addText('Le présent document de présentation et d\'architecture certifie l\'achèvement technique et la conformité fonctionnelle totale de la plateforme intégrée ERP, CRM et Vitrine Web de Franchise Conseils Trading (FCT Automobile Douala). Il constitue la référence officielle d\'exploitation pour l\'exercice 2026.', {
    x: 1.1, y: 1.65, w: 11.13, h: 0.9,
    fontFace: 'Arial', fontSize: 9.5, color: C.slateDark, lineSpacingMultiple: 1.25
  });

  // Signatures
  // Bloc 1 : Direction Générale
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.5, y: 3.1, w: 4.8, h: 3.3,
    fill: { color: C.white }, line: { color: C.navyPrimary, width: 1.5 }
  });
  slide.addText('POUR LA DIRECTION GÉNÉRALE FCT', {
    x: 1.7, y: 3.3, w: 4.4, h: 0.3,
    fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.slateMedium, align: 'center'
  });
  slide.addText('Claus Ephwandji', {
    x: 1.7, y: 3.65, w: 4.4, h: 0.4,
    fontFace: 'Arial', fontSize: 13, bold: true, color: C.navyPrimary, align: 'center'
  });
  slide.addText('Directeur Général Associé · FCT Douala', {
    x: 1.7, y: 4.05, w: 4.4, h: 0.3,
    fontFace: 'Arial', fontSize: 9, color: C.slateMedium, align: 'center'
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 2.2, y: 5.3, w: 3.4, h: 0,
    line: { color: C.slateMedium, width: 1, dashType: 'dash' }
  });
  slide.addText('Date et Cachet Officiel de Direction', {
    x: 1.7, y: 5.5, w: 4.4, h: 0.3,
    fontFace: 'Arial', fontSize: 8, italic: true, color: C.slateMedium, align: 'center'
  });

  // Bloc 2 : Direction Technique & Audit ECC
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.0, y: 3.1, w: 4.8, h: 3.3,
    fill: { color: C.white }, line: { color: C.emerald, width: 1.5 }
  });
  slide.addText('POUR L\'INGÉNIERIE & SÉCURITÉ APPLICATIVE', {
    x: 7.2, y: 3.3, w: 4.4, h: 0.3,
    fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.slateMedium, align: 'center'
  });
  slide.addText('Supervision Ingénierie ECC', {
    x: 7.2, y: 3.65, w: 4.4, h: 0.4,
    fontFace: 'Arial', fontSize: 13, bold: true, color: C.emeraldDark, align: 'center'
  });
  slide.addText('Audit Sécurité, Architecture Cloud & Fiabilité Vitest', {
    x: 7.2, y: 4.05, w: 4.4, h: 0.3,
    fontFace: 'Arial', fontSize: 9, color: C.slateMedium, align: 'center'
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 7.7, y: 5.3, w: 3.4, h: 0,
    line: { color: C.slateMedium, width: 1, dashType: 'dash' }
  });
  slide.addText('Visa de Conformité 100% Validé (107 Tests Vitest)', {
    x: 7.2, y: 5.5, w: 4.4, h: 0.3,
    fontFace: 'Arial', fontSize: 8, italic: true, color: C.emeraldDark, align: 'center'
  });
}

// -------------------------------------------------------------
// SLIDE 15 : CONTACTS INSTITUTIONNELS & CLÔTURE
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  slide.background = { color: C.navyDark };

  if (fs.existsSync(LOGO_PATH)) {
    slide.addImage({
      path: LOGO_PATH,
      x: 5.2, y: 1.3, w: 2.9, h: 1.15
    });
  }

  slide.addText('FRANCHISE CONSEILS TRADING (FCT)', {
    x: 1.0, y: 2.7, w: 11.33, h: 0.5,
    fontFace: 'Arial', fontSize: 20, bold: true, color: C.white, align: 'center'
  });

  slide.addText('L\'Excellence Automobile au Coeur de Douala', {
    x: 1.0, y: 3.25, w: 11.33, h: 0.4,
    fontFace: 'Arial', fontSize: 13, color: C.emerald, align: 'center'
  });

  const contacts = [
    { tit: 'AGENCE PRINCIPALE & SHOWROOM', det: 'Boulevard Principal de Bonamoussadi\nFace Station TotalEnergies Santa Barbara\nDouala, Cameroun' },
    { tit: 'STANDARDS TÉLÉPHONIQUES & WHATSAPP', det: '+237 699 45 88 12\n+237 677 32 19 04\nAssistance VIP 24h/24 & 7j/7' },
    { tit: 'CANAUX NUMÉRIQUES OFFICIELS', det: 'Site Public : https://fct-automobile.cm\nCourriel : contact@fct-automobile.cm\nPortail ERP : Interne Haute Sécurité' }
  ];

  contacts.forEach((c, idx) => {
    const x = 1.0 + idx * 3.9;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 4.0, w: 3.5, h: 2.0,
      fill: { color: '112240' }, line: { color: C.emerald, width: 1 }
    });
    slide.addText(c.tit, {
      x: x + 0.15, y: 4.15, w: 3.2, h: 0.35,
      fontFace: 'Arial', fontSize: 8.5, bold: true, color: C.emerald, align: 'center'
    });
    slide.addText(c.det, {
      x: x + 0.15, y: 4.55, w: 3.2, h: 1.3,
      fontFace: 'Arial', fontSize: 9, color: C.white, align: 'center', lineSpacingMultiple: 1.2
    });
  });

  slide.addText('Franchise Conseils Trading · SARL au capital de 10 000 000 FCFA · Tous droits réservés 2026', {
    x: 1.0, y: 6.8, w: 11.33, h: 0.35,
    fontFace: 'Arial', fontSize: 8.5, color: '64748B', align: 'center'
  });
}

// Enregistrement du fichier PPTX
pptx.writeFile({ fileName: PPTX_OUTPUT })
  .then(fileName => {
    console.log(`🎉 DIAPORAMA POWERPOINT OFFICIEL GÉNÉRÉ AVEC SUCCÈS !`);
    console.log(`📁 Fichier créé : ${fileName}`);
    const stats = fs.statSync(PPTX_OUTPUT);
    console.log(`📊 Taille : ${(stats.size / 1024).toFixed(1)} Ko (15 diapositives 16:9 HD de Direction)`);
  })
  .catch(err => {
    console.error('❌ Erreur génération PPTX :', err);
  });
