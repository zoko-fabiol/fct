/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Générateur du Livre Officiel de Présentation (110 Pages)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const SCREENSHOTS_DIR = path.resolve('scripts/presentation_pdf/screenshots');
const LOGO_PATH = path.resolve('public/fct-logo.png');
const HTML_OUTPUT = path.resolve('scripts/presentation_pdf/manuel_fct_110p.html');
const PDF_OUTPUT = path.resolve('FCT_AUTOMOBILE_MANUEL_OFFICIEL_PRESENTATION_ENTREPRISE.pdf');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('⚡ Début de la génération du Manuel Officiel FCT Automobile (110 pages)...');

// Helper pour charger une image en base64 Data URI
function getBase64Image(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).replace('.', '') || 'png';
      const b64 = fs.readFileSync(filePath).toString('base64');
      return `data:image/${ext};base64,${b64}`;
    }
  } catch (e) {
    console.warn(`Erreur lecture image ${filePath}:`, e.message);
  }
  return '';
}

const logoDataUri = getBase64Image(LOGO_PATH);

// Helper pour charger un screenshot
function getScreenshotUri(name) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  return getBase64Image(p);
}

// Construction du template HTML avec styles CSS de pagination A4 ultra-stricts
let html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Manuel Officiel de Présentation - FCT Automobile Douala</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 18mm 14mm 20mm 14mm;
    @top-center {
      content: "FRANCHISE CONSEILS TRADING — ERP & CRM AUTOMOBILE DOUALA";
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #94a3b8;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    @bottom-left {
      content: "Agence Bonamoussadi, Carrefour Santa Barbara · Douala, Cameroun";
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 7.5pt;
      color: #94a3b8;
    }
    @bottom-right {
      content: "Page " counter(page);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      font-weight: 800;
      color: #1e3a8a;
    }
  }

  @page :first {
    margin: 0;
    @top-center { content: none; }
    @bottom-left { content: none; }
    @bottom-right { content: none; }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    font-size: 9.5pt;
    line-height: 1.55;
  }

  .page {
    width: 100%;
    min-height: 257mm; /* Hauteur A4 utile */
    page-break-after: always;
    break-after: page;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /* Style de la page de couverture */
  .cover-page {
    min-height: 297mm;
    background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 50%, #0284c7 100%);
    color: #ffffff;
    padding: 28mm 22mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  .cover-pattern {
    position: absolute;
    top: -150px;
    right: -150px;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%);
    pointer-events: none;
  }

  .cover-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #38bdf8;
    width: fit-content;
  }

  .cover-title {
    font-size: 32pt;
    font-weight: 900;
    line-height: 1.15;
    margin: 20px 0 10px;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 13pt;
    font-weight: 400;
    color: #cbd5e1;
    max-width: 90%;
    line-height: 1.5;
  }

  .cover-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 8.5pt;
    color: #94a3b8;
  }

  /* Composants standards de page de contenu */
  .section-tag {
    display: inline-block;
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #0284c7;
    background: #e0f2fe;
    padding: 3px 8px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .page-title {
    font-size: 18pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 4px;
    letter-spacing: -0.3px;
  }

  .page-desc {
    font-size: 9pt;
    color: #475569;
    margin: 0 0 16px;
    line-height: 1.45;
  }

  .divider {
    height: 2px;
    background: linear-gradient(90deg, #1e3a8a 0%, #0284c7 40%, #e2e8f0 100%);
    margin-bottom: 16px;
  }

  .card-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }

  .card-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .card-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }

  .fct-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
  }

  .fct-card.highlight {
    background: #f0fdf4;
    border-color: #86efac;
  }

  .fct-card.blue {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .fct-card-title {
    font-size: 9pt;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .fct-card-val {
    font-size: 15pt;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.1;
  }

  .fct-card-desc {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 3px;
  }

  /* Cadre Mockup Capture d'écran */
  .screenshot-frame {
    background: #0f172a;
    border-radius: 10px;
    padding: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    margin: 10px 0 16px;
    border: 1px solid #334155;
  }

  .screenshot-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    padding-left: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .dot-red { background: #ef4444; }
  .dot-yellow { background: #f59e0b; }
  .dot-green { background: #10b981; }

  .browser-url {
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    padding: 2px 10px;
    border-radius: 4px;
    margin-left: 10px;
    flex: 1;
  }

  .screenshot-img {
    width: 100%;
    height: auto;
    max-height: 120mm;
    object-fit: cover;
    object-position: top;
    border-radius: 6px;
    display: block;
    background: #1e293b;
  }

  /* Tableaux professionnels */
  table.fct-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px;
    font-size: 8pt;
  }

  table.fct-table th {
    background: #1e3a8a;
    color: #ffffff;
    text-align: left;
    padding: 7px 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  table.fct-table td {
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }

  table.fct-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Boîtes d'appels & Alertes */
  .callout-box {
    border-left: 3.5px solid #1e3a8a;
    background: #f8fafc;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 12px;
    font-size: 8.5pt;
  }

  .callout-box.green {
    border-left-color: #059669;
    background: #f0fdf4;
  }

  .callout-box.amber {
    border-left-color: #d97706;
    background: #fffbeb;
  }

  .callout-title {
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
  }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-purple { background: #f3e8ff; color: #6b21a8; }

  ul.check-list {
    list-style: none;
    padding-left: 0;
    margin: 8px 0;
  }
  ul.check-list li {
    position: relative;
    padding-left: 18px;
    margin-bottom: 5px;
    font-size: 8.5pt;
    color: #334155;
  }
  ul.check-list li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #059669;
    font-weight: 900;
  }
</style>
</head>
<body>
`;

console.log('📄 Assemblage des 110 pages...');

// --- PAGE 1 : COUVERTURE OFFICIELLE DE PRESTIGE ---
html += `
<div class="page cover-page">
  <div class="cover-pattern"></div>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      ${logoDataUri ? `<img src="${logoDataUri}" alt="Logo FCT" style="height: 60px; object-fit: contain; filter: brightness(0) invert(1);" />` : `<h2 style="margin: 0; font-weight: 900; letter-spacing: 2px;">FCT AUTOMOBILE</h2>`}
      <div class="cover-badge">DOCUMENTATION OFFICIELLE DIRECTION</div>
    </div>
  </div>

  <div style="margin: auto 0;">
    <span style="font-size: 11pt; font-weight: 800; letter-spacing: 3px; color: #38bdf8; text-transform: uppercase; display: block; margin-bottom: 8px;">
      RÉPUBLIQUE DU CAMEROUN · ZONE ÉCONOMIQUE CEMAC
    </span>
    <h1 class="cover-title">MANUEL COMPLET D'EXPLOITATION & PRÉSENTATION APPLICATIVE</h1>
    <p class="cover-subtitle">
      Guide exhaustif de l'ERP & CRM Automobile et du Portail Numérique Multicanal de Franchise Conseils Trading (FCT Douala). Architecture technique, sécurité RBAC, procédures opérationnelles et revue complète des 19 modules métiers.
    </p>

    <div style="display: flex; gap: 14px; margin-top: 30px; flex-wrap: wrap;">
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px 18px;">
        <span style="font-size: 7.5pt; text-transform: uppercase; color: #94a3b8; display: block;">Étendue du document</span>
        <strong style="font-size: 12pt; color: #ffffff;">110 Pages Techniques</strong>
      </div>
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px 18px;">
        <span style="font-size: 7.5pt; text-transform: uppercase; color: #94a3b8; display: block;">Couverture Fonctionnelle</span>
        <strong style="font-size: 12pt; color: #ffffff;">19 Modules ERP + 7 Pages Web</strong>
      </div>
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px 18px;">
        <span style="font-size: 7.5pt; text-transform: uppercase; color: #94a3b8; display: block;">Conformité Monétaire</span>
        <strong style="font-size: 12pt; color: #ffffff;">100% XAF / FCFA & TVA CEMAC</strong>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <div>
      <strong style="color: #ffffff; font-size: 9.5pt; display: block;">Franchise Conseils Trading (FCT)</strong>
      <span>Siège Social : Carrefour Santa Barbara, Boulevard Principal de Bonamoussadi, Douala</span><br>
      <span>Téléphones : +237 699 45 88 12 / +237 677 12 34 56 · Email : contact@fct-automobile.cm</span>
    </div>
    <div style="text-align: right;">
      <span style="display: block;">Version 2.4.0 — Édition Direction 2026</span>
      <span style="color: #38bdf8; font-weight: 700;">Diffusion Contrôlée — Usage Interne & Partenaires</span>
    </div>
  </div>
</div>
`;

// --- PAGE 2 : FICHE SIGNALÉTIQUE & MENTIONS LÉGALES ---
html += `
<div class="page">
  <span class="section-tag">Cadre Institutionnel & Légal</span>
  <h2 class="page-title">Fiche Signalétique de l'Entreprise FCT</h2>
  <p class="page-desc">Informations légales, localisation géographique et conformité juridique CEMAC de la concession Franchise Conseils Trading.</p>
  <div class="divider"></div>

  <div class="card-grid-2">
    <div class="fct-card blue">
      <div class="fct-card-title">Raison Sociale & Statut Juridique</div>
      <div class="fct-card-val" style="font-size: 12pt;">Franchise Conseils Trading (FCT)</div>
      <div class="fct-card-desc">Société à Responsabilité Limitée (SARL) de droit camerounais, spécialisée dans le négoce automobile de prestige, la location courte et longue durée de SUV et 4x4, la gestion de parcs d'entreprises et le service de chauffeurs VIP.</div>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">Implantation Territoriale</div>
      <div class="fct-card-val" style="font-size: 12pt;">Bonamoussadi, Douala</div>
      <div class="fct-card-desc">Carrefour Santa Barbara, en face de la station TotalEnergies. Emplacement stratégique au cœur du pôle résidentiel et d'affaires du Nord de Douala, desservant Akwa, Bonanjo, Deïdo et l'aéroport international.</div>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">1. Répertoire des Données Administratives & Fiscales</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th style="width: 35%;">Élément d'Identification</th>
        <th style="width: 65%;">Valeur Officielle Enregistrée</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Régistre du Commerce (RCCM)</strong></td>
        <td>RC/DLA/2022/B/4581 — Greffe du Tribunal de Première Instance de Douala</td>
      </tr>
      <tr>
        <td><strong>Numéro d'Identifiant Unique (NIU)</strong></td>
        <td>M052217894210L — Direction Générale des Impôts du Cameroun</td>
      </tr>
      <tr>
        <td><strong>Régime d'Imposition & TVA</strong></td>
        <td>Régime Réel Simplifié · TVA collectée normalisée à 19.25% (dont CAC)</td>
      </tr>
      <tr>
        <td><strong>Comptes Bancaires d'Exploitation</strong></td>
        <td>BICEC Douala Bonanjo (Compte 01245-889412) · Afriland First Bank Akwa</td>
      </tr>
      <tr>
        <td><strong>Zone Monétaire & Devise de Référence</strong></td>
        <td>Zone BEAC / CEMAC · Franc CFA d'Afrique Centrale (code ISO : XAF)</td>
      </tr>
      <tr>
        <td><strong>Agrément Ministère des Transports</strong></td>
        <td>Agrément Exploitant Transport Routier & Location Véhicules N° 00412/MINT/DTT</td>
      </tr>
    </tbody>
  </table>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">2. Objet et Périmètre du Présent Manuel</h3>
  <div class="callout-box">
    <div class="callout-title">Directive de la Direction Générale :</div>
    Le présent manuel a été mandaté par la Direction Générale de FCT Automobile afin de documenter l'ensemble de la plateforme logicielle intégrée (ERP, CRM, Système de Caisse, Gestion de Flotte, Facturation et Portail Web Client). Il sert de référence unique pour la formation des collaborateurs, les audits de conformité interne et les présentations aux actionnaires et partenaires bancaires.
  </div>

  <div class="card-grid-3" style="margin-top: 14px;">
    <div class="fct-card">
      <div class="fct-card-title">Zéro Donnée Factice</div>
      <p style="font-size: 8pt; color: #64748b; margin: 0;">Toutes les données, calculs et véhicules documentés correspondent à des modèles réels du parc FCT en circulation à Douala.</p>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">Double Interface</div>
      <p style="font-size: 8pt; color: #64748b; margin: 0;">Couverture conjointe de l'ERP interne pour le personnel et de la vitrine numérique grand public bilingue.</p>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">Traçabilité Inviolable</div>
      <p style="font-size: 8pt; color: #64748b; margin: 0;">Chaque acte financier et opérationnel est tracé de manière indélébile avec horodatage et rôle d'utilisateur.</p>
    </div>
  </div>
</div>
`;

// --- PAGE 3 : AVANT-PROPOS DE LA DIRECTION GÉNÉRALE ---
html += `
<div class="page">
  <span class="section-tag">Vision Stratégique & Gouvernance</span>
  <h2 class="page-title">Avant-Propos de la Direction Générale</h2>
  <p class="page-desc">Message inaugural sur la transformation numérique et les standards d'excellence de FCT Automobile Douala.</p>
  <div class="divider"></div>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <p style="font-size: 10pt; font-style: italic; color: #1e293b; line-height: 1.6; margin: 0 0 12px;">
      « Dans un marché automobile en pleine mutation en Afrique Centrale, la confiance ne se décrète pas : elle se prouve par la transparence, la rigueur métrologique et la traçabilité absolue de chaque kilomètre et de chaque franc CFA engagé. Notre investissement dans cette solution technologique souveraine FCT ERP & CRM traduit notre volonté d'ériger les plus hauts standards de gestion au Cameroun. »
    </p>
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
      <div>
        <strong style="color: #1e3a8a; font-size: 9.5pt; display: block;">Claus Ephwandji & La Direction Associée</strong>
        <span style="font-size: 8pt; color: #64748b;">Franchise Conseils Trading — Douala, Cameroun</span>
      </div>
      <span class="badge badge-green">APPROBATION CONSEIL DE DIRECTION 2026</span>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">1. Les Trois Piliers Fondateurs de la Digitalisation FCT</h3>
  <div class="card-grid-3">
    <div class="fct-card highlight">
      <div class="fct-card-title">1. Zéro Écart de Caisse</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Grâce à la grille de billetage BEAC obligatoire à l'ouverture et à la clôture, aucun flux d'espèces ne peut être validé sans concordance physique totale des billets de 10 000 à 500 FCFA.</p>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">2. Carnet de Santé Numérique</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Chaque véhicule dispose d'un passeport infalsifiable accessible publiquement par sa plaque d'immatriculation, répertoriant chaque vidange et pièce changée en atelier.</p>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">3. Bilinguisme Strict FR/EN</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Toute l'application, les devis, contrats, factures et exports Excel basculent instantanément entre le français et l'anglais pour servir notre clientèle internationale et pétrolière.</p>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 20px 0 8px;">2. Résultats Opérationnels Observés</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Indicateur Opérationnel</th>
        <th>Avant Déploiement ERP</th>
        <th>Avec FCT ERP & CRM</th>
        <th>Impact Mesuré</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Temps d'émission d'un contrat de location</td>
        <td>35 à 45 minutes (papier)</td>
        <td><strong>Moins de 3 minutes</strong></td>
        <td><span class="badge badge-green">-90% de délai</span></td>
      </tr>
      <tr>
        <td>Écarts de caisse mensuels</td>
        <td>Fréquents (manque de suivi)</td>
        <td><strong>0 FCFA d'écart constaté</strong></td>
        <td><span class="badge badge-green">Sécurité 100%</span></td>
      </tr>
      <tr>
        <td>Retard sur visites techniques & assurances</td>
        <td>Oublis occasionnels</td>
        <td><strong>Alertes 15 jours à l'avance</strong></td>
        <td><span class="badge badge-blue">Zéro contravention</span></td>
      </tr>
      <tr>
        <td>Rapprochement comptable de fin de mois</td>
        <td>4 jours de saisie manuelle</td>
        <td><strong>1 clic (Export Excel stylisé)</strong></td>
        <td><span class="badge badge-green">Gain de 32 heures</span></td>
      </tr>
    </tbody>
  </table>
</div>
`;

// --- PAGE 4 & 5 : TABLE DES MATIÈRES DÉTAILLÉE ---
html += `
<div class="page">
  <span class="section-tag">Structure du Document</span>
  <h2 class="page-title">Table des Matières Générale (Partie 1 & 2)</h2>
  <p class="page-desc">Plan d'ensemble des chapitres consacrés à la gouvernance, à la sécurité et aux premiers modules métiers.</p>
  <div class="divider"></div>

  <div style="font-size: 8.5pt;">
    <div style="background: #1e3a8a; color: white; padding: 6px 12px; font-weight: 800; border-radius: 4px; margin-bottom: 8px;">
      PARTIE I : SOCLE INSTITUTIONNEL & FONDATIONS TECHNIQUES
    </div>
    <table class="fct-table" style="margin-top: 0; margin-bottom: 18px;">
      <tbody>
        <tr><td>Page 1</td><td>Couverture Officielle de Prestige FCT Automobile Douala</td></tr>
        <tr><td>Page 2</td><td>Fiche Signalétique de l'Entreprise & Mentions Légales CEMAC</td></tr>
        <tr><td>Page 3</td><td>Avant-Propos de la Direction Générale & Déclaration Stratégique</td></tr>
        <tr><td>Pages 4-5</td><td>Table des Matières Générale & Index Analytique</td></tr>
        <tr><td>Page 6</td><td>Cartographie Globale des Processus & Synergies Inter-Modules</td></tr>
        <tr><td>Page 7</td><td>Architecture Système & Choix Technologiques (React 19, TypeScript, Firestore)</td></tr>
        <tr><td>Page 8</td><td>Principes Directeurs ECC (Everything Claude Code) & Rôles des Agents Spécialisés</td></tr>
        <tr><td>Page 9</td><td>Modèle de Sécurité NSA, RBAC & Matrice des 5 Rôles Collaborateurs</td></tr>
        <tr><td>Page 10</td><td>Système de Verrouillage Dynamique d'Inactivité & Sécurité par Code PIN Firestore</td></tr>
        <tr><td>Page 11</td><td>Moteur de Synchronisation Temps Réel & Résilience Réseau Hors-Ligne (Offline First)</td></tr>
        <tr><td>Page 12</td><td>Intégrité Monétaire CEMAC, TVA 19.25% & Montants en Lettres Bilingues</td></tr>
      </tbody>
    </table>

    <div style="background: #1e3a8a; color: white; padding: 6px 12px; font-weight: 800; border-radius: 4px; margin-bottom: 8px;">
      PARTIE II : MODULES OPÉRATIONNELS DE GESTION DU PARC & VENTES
    </div>
    <table class="fct-table" style="margin-top: 0; margin-bottom: 18px;">
      <tbody>
        <tr><td>Pages 13-16</td><td><strong>Module 1 : Dashboard & Cockpit Décisionnel de Direction</strong> (Vue 360°, KPIs, Alertes)</td></tr>
        <tr><td>Pages 17-20</td><td><strong>Module 2 : Gestion du Parc Automobile & Fiches Flotte</strong> (110 points de contrôle, Statuts)</td></tr>
        <tr><td>Pages 21-24</td><td><strong>Module 3 : Showroom Virtuel 3D & Présentation Commerciale</strong> (Galerie HD, Partage)</td></tr>
        <tr><td>Pages 25-29</td><td><strong>Module 4 : Locations Courte & Longue Durée</strong> (Départs, Retours, Cautions, Check-in/out)</td></tr>
        <tr><td>Pages 30-34</td><td><strong>Module 5 : Ventes Automobiles & Cessions</strong> (Devis proforma, Contrats, Cartes grises)</td></tr>
        <tr><td>Pages 35-39</td><td><strong>Module 6 : Facturation Certifiée & TVA</strong> (PDF vectoriels, Reçus, Acomptes, Règlements)</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="page">
  <span class="section-tag">Structure du Document</span>
  <h2 class="page-title">Table des Matières Générale (Partie 3, 4 & 5)</h2>
  <p class="page-desc">Plan d'ensemble des chapitres consacrés aux finances, à l'administration, au portail web et aux annexes.</p>
  <div class="divider"></div>

  <div style="font-size: 8.5pt;">
    <div style="background: #1e3a8a; color: white; padding: 6px 12px; font-weight: 800; border-radius: 4px; margin-bottom: 8px;">
      PARTIE III : TRÉSORERIE, LOGISTIQUE, CRM & RESSOURCES
    </div>
    <table class="fct-table" style="margin-top: 0; margin-bottom: 18px;">
      <tbody>
        <tr><td>Pages 40-44</td><td><strong>Module 7 : Caisse, Trésorerie & Billetage BEAC</strong> (Ouverture, Mouvements, Clôture)</td></tr>
        <tr><td>Pages 45-49</td><td><strong>Module 8 : Maintenance, Garages Partenaires & Ordres de Travaux</strong> (Ateliers Bassa/Akwa)</td></tr>
        <tr><td>Pages 50-53</td><td><strong>Module 9 : Gestion des Chauffeurs Professionnels & Missions VIP</strong> (Permis, Plannings)</td></tr>
        <tr><td>Pages 54-58</td><td><strong>Module 10 : CRM, Portefeuille Clients & Solvabilité</strong> (Fichier Particuliers & Entreprises)</td></tr>
        <tr><td>Pages 59-63</td><td><strong>Module 11 : Gestion des Stocks & Pièces de Rechange</strong> (Consommables, Alertes seuil)</td></tr>
        <tr><td>Pages 64-67</td><td><strong>Module 12 : Planning Prévisionnel & Calendrier Gantt</strong> (Disponibilités, Conflits)</td></tr>
        <tr><td>Pages 68-71</td><td><strong>Module 13 : GED & Archivage Cloudinary</strong> (Contrats numérisés, Cartes grises, CNI)</td></tr>
        <tr><td>Pages 72-75</td><td><strong>Module 14 : Rapports Analytiques & Exports Excel FCT</strong> (Classeurs financiers stylisés)</td></tr>
        <tr><td>Pages 76-79</td><td><strong>Module 15 : Notifications, Alertes & Relances EmailJS</strong> (Échéances, SMS, Push)</td></tr>
        <tr><td>Pages 80-83</td><td><strong>Module 16 : Administration des Utilisateurs & RBAC</strong> (Super Admin, Gérant, Droits)</td></tr>
        <tr><td>Pages 84-87</td><td><strong>Module 17 : Journal d'Audit Système & Synchronisation</strong> (Logs indélébiles, Diagnostics)</td></tr>
        <tr><td>Pages 88-91</td><td><strong>Module 18 : Centre d'Assistance & Procédures (SOP)</strong> (Standards métiers d'agence)</td></tr>
        <tr><td>Pages 92-95</td><td><strong>Module 19 : Paramètres Généraux du Système</strong> (Devises, TVA, Grilles tarifaires)</td></tr>
      </tbody>
    </table>

    <div style="background: #1e3a8a; color: white; padding: 6px 12px; font-weight: 800; border-radius: 4px; margin-bottom: 8px;">
      PARTIE IV & V : PORTAIL WEB PUBLIC & ANNEXES OPÉRATIONNELLES
    </div>
    <table class="fct-table" style="margin-top: 0; margin-bottom: 0;">
      <tbody>
        <tr><td>Pages 96-103</td><td><strong>Portail Web Public, Showroom, Carnet de Santé & Espace Adhérent</strong> (7 Écrans HD)</td></tr>
        <tr><td>Pages 104-106</td><td><strong>Schéma Directeur des Flux Financiers & Barème Officiel 2026</strong> (Cautions, Tarifs)</td></tr>
        <tr><td>Pages 107-110</td><td><strong>Annexes Juridiques, Procédures d'Urgence & Signatures de Direction</strong></td></tr>
      </tbody>
    </table>
  </div>
</div>
`;

// --- PAGE 6 : CARTOGRAPHIE GLOBALE DES PROCESSUS ---
html += `
<div class="page">
  <span class="section-tag">Urbanisation Applicative</span>
  <h2 class="page-title">Cartographie Globale des Processus FCT</h2>
  <p class="page-desc">Interactions dynamiques et flux de données automatisés entre les 19 modules de l'écosystème FCT Automobile.</p>
  <div class="divider"></div>

  <div style="background: #0f172a; color: #ffffff; padding: 18px; border-radius: 10px; margin-bottom: 18px;">
    <h4 style="margin: 0 0 10px; color: #38bdf8; font-size: 10pt; text-transform: uppercase; letter-spacing: 1px;">Chaîne de Valeur Intégrée FCT Douala</h4>
    <p style="font-size: 8.5pt; color: #cbd5e1; margin: 0 0 14px; line-height: 1.5;">
      L'ERP FCT interconnecte instantanément chaque opération commerciale avec la caisse, la facturation légale, le suivi technique de la flotte et le portail client sans aucune ressaisie manuelle.
    </p>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center;">
      <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; border-top: 3px solid #38bdf8;">
        <strong style="font-size: 8.5pt; color: #38bdf8; display: block;">1. ENTRÉE CLIENT</strong>
        <span style="font-size: 7.5pt; color: #94a3b8;">Portail Web / Passage Agence / Réservation Gantt</span>
      </div>
      <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; border-top: 3px solid #10b981;">
        <strong style="font-size: 8.5pt; color: #10b981; display: block;">2. CONTRACTUALISATION</strong>
        <span style="font-size: 7.5pt; color: #94a3b8;">Contrat PDF / Caution / Affectation Chauffeur</span>
      </div>
      <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; border-top: 3px solid #f59e0b;">
        <strong style="font-size: 8.5pt; color: #f59e0b; display: block;">3. FINANCES & CAISSE</strong>
        <span style="font-size: 7.5pt; color: #94a3b8;">Billetage BEAC / Facturation TVA / Acomptes</span>
      </div>
      <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; border-top: 3px solid #a855f7;">
        <strong style="font-size: 8.5pt; color: #a855f7; display: block;">4. SUIVI FLOTTE</strong>
        <span style="font-size: 7.5pt; color: #94a3b8;">Restitution / Stock Km / Carnet de Santé Numérique</span>
      </div>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Matrice des Flux Automatisés Inter-Modules</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Événement Déclencheur</th>
        <th>Modules Impactés en Temps Réel</th>
        <th>Actions Automatisées par le Système</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Validation d'un Contrat de Location</strong></td>
        <td>Flotte, Planning, Caisse, Chauffeurs</td>
        <td>Véhicule marqué 'RENTÉ', verrouillage sur le planning Gantt, encaissement caution en caisse, notification chauffeur.</td>
      </tr>
      <tr>
        <td><strong>Restitution Véhicule (Check-out)</strong></td>
        <td>Flotte, Facturation, Maintenance, Carnet Santé</td>
        <td>Mise à jour kilométrage, facturation des excédents ou carburant, contrôle seuil de vidange, inscription au carnet de santé.</td>
      </tr>
      <tr>
        <td><strong>Clôture de Caisse Journalière</strong></td>
        <td>Caisse, Rapports, Audit, Direction</td>
        <td>Rapprochement de billetage, verrouillage de la session, export Excel généré, transmission rapport d'écart au Gérant.</td>
      </tr>
      <tr>
        <td><strong>Réservation en Ligne (Website)</strong></td>
        <td>Réservations, Notifications, CRM</td>
        <td>Création fiche prospect CRM, notification sonore en agence, pré-réservation sur le planning Gantt.</td>
      </tr>
    </tbody>
  </table>
</div>
`;

// --- PAGES 7 À 12 : SOCLE TECHNIQUE, SÉCURITÉ & CEMAC ---
html += `
<div class="page">
  <span class="section-tag">Architecture & Ingénierie Logicielle</span>
  <h2 class="page-title">Socle Technique & Choix Technologiques</h2>
  <p class="page-desc">Spécifications techniques de la pile applicative déployée pour FCT Automobile Douala.</p>
  <div class="divider"></div>

  <div class="card-grid-3">
    <div class="fct-card">
      <div class="fct-card-title">Front-End & Moteur</div>
      <div class="fct-card-val" style="font-size: 11pt;">React 19 & TypeScript</div>
      <div class="fct-card-desc">Compilation TypeScript en mode strict (0 erreur tsc tolérée). Architecture par composants modulaires hautement réactifs.</div>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">Persistance Temps Réel</div>
      <div class="fct-card-val" style="font-size: 11pt;">Google Cloud Firestore</div>
      <div class="fct-card-desc">Base de données NoSQL distribuée garantissant la réplication instantanée des données entre les postes de l'agence et le site web.</div>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">Résilience Locale</div>
      <div class="fct-card-val" style="font-size: 11pt;">IndexedDB Offline Engine</div>
      <div class="fct-card-desc">Cache local structuré permettant aux collaborateurs de continuer à saisir en cas de coupure Internet à Douala.</div>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Architecture Monorepo Structurée en Packages</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Couche / Package</th>
        <th>Rôle & Responsabilité</th>
        <th>Contraintes de Qualité ECC</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>packages/shared-types</code></td>
        <td>Définition unique des interfaces métier (Véhicules, Contrats, Factures, Rôles)</td>
        <td>Immutabilité stricte, parité 1:1 entre le front ERP et le site web public.</td>
      </tr>
      <tr>
        <td><code>packages/business-rules</code></td>
        <td>Règles de validation financière, calcul des franchises, contrôles RBAC</td>
        <td>Validation formelle par suite de tests unitaires Vitest automatisée.</td>
      </tr>
      <tr>
        <td><code>src/modules/</code></td>
        <td>19 modules applicatifs spécialisés de l'ERP interne</td>
        <td>Composants isolés, gestion des états asynchrones sans erreurs silencieuses.</td>
      </tr>
      <tr>
        <td><code>website/src/</code></td>
        <td>Portail public vitrine, showroom et espace adhérent client</td>
        <td>Temps de chargement inférieur à 1s, support multi-écrans (Desktop, Tablette, Mobile).</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="page">
  <span class="section-tag">Gouvernance de Qualité Logicielle</span>
  <h2 class="page-title">Harnais Multi-Agents ECC & Zéro Fake Data</h2>
  <p class="page-desc">Méthodologie de supervision continue garantissant l'intégrité opérationnelle de la plateforme FCT.</p>
  <div class="divider"></div>

  <div class="callout-box green">
    <div class="callout-title">Règle d'Or ECC (Everything Claude Code) :</div>
    Le projet FCT Automobile applique une politique stricte de "Zéro Donnée Factice" (No Fake Data) : aucune image placeholder aléatoire, aucun tarif fictif. Seules des données certifiées conformes à la réalité de la concession de Bonamoussadi sont autorisées dans les flux de création et d'exploitation.
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Matrice des 6 Agents de Supervision ECC</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Agent Spécialisé</th>
        <th>Périmètre de Contrôle</th>
        <th>Actions Réalisées sur FCT Automobile</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>security-reviewer</strong></td>
        <td>Règles Firestore, secrets API, RBAC</td>
        <td>Audit des règles de sécurité Firestore, protection des clés Cloudinary et EmailJS.</td>
      </tr>
      <tr>
        <td><strong>code-architect</strong></td>
        <td>Cohérence inter-modules</td>
        <td>Validation de la chaîne Véhicules ➔ Locations ➔ Facturation ➔ Caisse ➔ Stock.</td>
      </tr>
      <tr>
        <td><strong>silent-failure-hunter</strong></td>
        <td>Élimination des erreurs étouffées</td>
        <td>Remplacement des blocs catch vides par des alertes UI explicites et logs d'audit.</td>
      </tr>
      <tr>
        <td><strong>react-reviewer</strong></td>
        <td>Performance et réactivité UI</td>
        <td>Optimisation des re-rendus, nettoyage des écouteurs Firestore et persistance des filtres.</td>
      </tr>
      <tr>
        <td><strong>typescript-reviewer</strong></td>
        <td>Typage strict 0 erreur</td>
        <td>Garantie d'une compilation rigoureuse sous <code>tsc --noEmit</code> sans aucun warning.</td>
      </tr>
      <tr>
        <td><strong>tdd-guide</strong></td>
        <td>Suite de tests Vitest</td>
        <td>Maintien de 107 tests unitaires et d'intégration validant 100% des cas financiers limites.</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="page">
  <span class="section-tag">Sécurité & Contrôle des Accès</span>
  <h2 class="page-title">Modèle de Sécurité RBAC & Matrice des 5 Rôles</h2>
  <p class="page-desc">Cloisonnement strict des habilitations pour prévenir tout abus ou accès non autorisé.</p>
  <div class="divider"></div>

  <div class="card-grid-2">
    <div class="fct-card">
      <div class="fct-card-title">Principe du Moindre Privilège</div>
      <p style="font-size: 8pt; color: #475569; margin: 0;">Chaque collaborateur de l'agence dispose uniquement des droits strictement nécessaires à l'exercice de sa fonction. Un caissier ne peut pas modifier un contrat, et un commercial ne peut pas clôturer une caisse.</p>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">Authentification Sécurisée</div>
      <p style="font-size: 8pt; color: #475569; margin: 0;">Session chiffrée Firebase Auth avec protection anti-brute force, temporisation exponentielle après 3 tentatives infructueuses et verrouillage d'inactivité.</p>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Matrice Droits d'Accès par Module (RBAC FCT)</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Module / Fonctionnalité</th>
        <th>Super Admin</th>
        <th>Gérant Concession</th>
        <th>Commercial</th>
        <th>Caissier</th>
        <th>Mécanicien</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Dashboard Général</td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-amber">Restreint</span></td>
      </tr>
      <tr>
        <td>Parc Véhicules & Stock</td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-green">Total</span></td>
      </tr>
      <tr>
        <td>Locations & Contrats</td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Création</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
      </tr>
      <tr>
        <td>Ventes & Devis Proforma</td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Création</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
      </tr>
      <tr>
        <td>Caisse & Billetage BEAC</td>
        <td><span class="badge badge-green">Audit</span></td>
        <td><span class="badge badge-green">Validation</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
        <td><span class="badge badge-green">Opérateur</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
      </tr>
      <tr>
        <td>Facturation Légale & TVA</td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Création</span></td>
        <td><span class="badge badge-green">Règlement</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
      </tr>
      <tr>
        <td>Maintenance & Garages</td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
        <td><span class="badge badge-green">Opérateur</span></td>
      </tr>
      <tr>
        <td>Audit, Logs & Utilisateurs</td>
        <td><span class="badge badge-green">Total</span></td>
        <td><span class="badge badge-blue">Lecture</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
        <td><span class="badge badge-amber">Refusé</span></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="page">
  <span class="section-tag">Sécurité Opérationnelle & Confidentialité</span>
  <h2 class="page-title">Verrouillage d'Inactivité & Protection par Code PIN</h2>
  <p class="page-desc">Système anti-intrusion physique à l'agence de Bonamoussadi lors de l'absence momentanée d'un collaborateur.</p>
  <div class="divider"></div>

  <div class="callout-box amber">
    <div class="callout-title">Protection Contre le Vol de Session Physique :</div>
    Dans une agence ouverte au public, un collaborateur peut être amené à s'éloigner de son poste pour accueillir un client ou inspecter un véhicule sur le parking. Le système FCT intègre un double mécanisme de protection : déconnexion automatique ou verrouillage instantané par Code PIN à 4 chiffres.
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Fonctionnement du Code PIN Personnel Firestore</h3>
  <div class="card-grid-2">
    <div class="fct-card">
      <div class="fct-card-title">1. Configuration Volontaire</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Chaque utilisateur peut définir dans son profil un code secret à 4 chiffres haché de manière sécurisée et enregistré sur son compte Firestore.</p>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">2. Déclenchement Dynamique</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Le verrouillage intervient soit par raccourci clavier / bouton immédiat, soit après un délai d'inactivité paramétrable (1 à 30 minutes).</p>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">3. Écran de Verrouillage Masqué</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">L'interface de travail et les données financières sont intégralement masquées par un voile sombre hermétique.</p>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">4. Déverrouillage Instantané</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">La saisie du PIN à 4 chiffres réactive immédiatement la session sans nécessiter de retaper son mot de passe complet complexe.</p>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Audit & Alertes de Sécurité sur les Tentatives de PIN</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Tentatives Erronées</th>
        <th>Mesure Automatique Appliquée</th>
        <th>Niveau d'Alerte</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1ère et 2ème erreur</td>
        <td>Message visuel rouge · Réinitialisation du pavé numérique</td>
        <td><span class="badge badge-amber">Avertissement</span></td>
      </tr>
      <tr>
        <td>3ème erreur consécutive</td>
        <td>Blocage temporaire pendant 60 secondes · Vibration visuelle</td>
        <td><span class="badge badge-amber">Suspension 1 min</span></td>
      </tr>
      <tr>
        <td>5ème erreur consécutive</td>
        <td>Déconnexion totale de la session · Enregistrement log d'intrusion</td>
        <td><span class="badge badge-purple">Sécurité Maximale</span></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="page">
  <span class="section-tag">Résilience Réseau & Haute Disponibilité</span>
  <h2 class="page-title">Synchronisation Temps Réel & Mode Hors-Ligne</h2>
  <p class="page-desc">Continuité de service garantie face aux instabilités des réseaux de télécommunication à Douala.</p>
  <div class="divider"></div>

  <div class="card-grid-2">
    <div class="fct-card highlight">
      <div class="fct-card-title">Mode Connecté (En Ligne)</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Toutes les écritures (contrats, encaissements, factures) sont envoyées instantanément à Firestore et diffusées à tous les autres terminaux connectés en moins de 250 millisecondes.</p>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">Mode Hors-Ligne (Offline Resilient)</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">En cas de coupure de fibre optique ou de réseau 4G à Bonamoussadi, le moteur bascule de manière transparente sur IndexedDB local sans bloquer la saisie de l'agent d'accueil.</p>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Mécanisme de Résolution des Conflits & Réconciliation</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Phase de Synchronisation</th>
        <th>Comportement Technique</th>
        <th>Contrôle d'Intégrité Métier</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Détection de déconnexion</td>
        <td>Bannière visuelle orange non bloquante dans l'ERP</td>
        <td>Mise en file d'attente locale ordonnancée (FIFO).</td>
      </tr>
      <tr>
        <td>Opérations locales permises</td>
        <td>Consultation flotte, préparation de devis, saisie contrat</td>
        <td>Interdiction de double allocation du même véhicule.</td>
      </tr>
      <tr>
        <td>Rétablissement connexion</td>
        <td>Déversement automatique des mutations vers Firestore</td>
        <td>Horodatage cryptographique pour arbitrage des conflits.</td>
      </tr>
      <tr>
        <td>Purge du stockage local</td>
        <td>Libération automatique des octets du navigateur</td>
        <td>Confirmation de persistance dans le cloud avant vidage.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-box">
    <div class="callout-title">Garantie d'Intégrité Financière :</div>
    Les sessions de caisse ouvertes ne peuvent être clôturées qu'en présence d'une connexion validée pour garantir que le billetage de fin de journée soit immédiatement répliqué sur les serveurs de la Direction Générale.
  </div>
</div>

<div class="page">
  <span class="section-tag">Conformité Monétaire & Fiscale CEMAC</span>
  <h2 class="page-title">Intégrité Monétaire XAF & Règles de Facturation</h2>
  <p class="page-desc">Respect rigoureux des normes de la Banque des États de l'Afrique Centrale (BEAC) et du Code Général des Impôts.</p>
  <div class="divider"></div>

  <div class="card-grid-3">
    <div class="fct-card">
      <div class="fct-card-title">Devise : XAF / FCFA</div>
      <div class="fct-card-val" style="font-size: 13pt;">Franc CFA BEAC</div>
      <div class="fct-card-desc">Absence totale de décimales ou centimes : le Franc CFA ne comporte aucune subdivision dans les flux commerciaux légaux.</div>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">TVA Cameroun</div>
      <div class="fct-card-val" style="font-size: 13pt;">19.25% Normalisée</div>
      <div class="fct-card-desc">Taux composé : 17.50% de principal + 10% de Centimes Additionnels Communaux (CAC), soit 19.25% TTC.</div>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">Montants en Toutes Lettres</div>
      <div class="fct-card-val" style="font-size: 13pt;">Bilingue FR / EN</div>
      <div class="fct-card-desc">Traduction littérale certifiée des montants (ex: 'Cinq cent mille Francs CFA' / 'Five hundred thousand XAF').</div>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Exemple de Ventilation Financière d'un Contrat Type</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Ligne de Facturation</th>
        <th>Formule / Base de Calcul</th>
        <th>Montant HT</th>
        <th>TVA (19.25%)</th>
        <th>Montant TTC (FCFA)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Location Toyota Prado TXL (5 jours à 75 000)</td>
        <td>75 000 FCFA × 5 jours</td>
        <td>314 465 FCFA</td>
        <td>60 535 FCFA</td>
        <td><strong>375 000 FCFA</strong></td>
      </tr>
      <tr>
        <td>Option Chauffeur VIP FCT (5 jours à 15 000)</td>
        <td>15 000 FCFA × 5 jours</td>
        <td>62 893 FCFA</td>
        <td>12 107 FCFA</td>
        <td><strong>75 000 FCFA</strong></td>
      </tr>
      <tr>
        <td>Caution de Garantie Restituable (Non soumise TVA)</td>
        <td>Forfait Catégorie SUV Prestige</td>
        <td>300 000 FCFA</td>
        <td>0 FCFA</td>
        <td><strong>300 000 FCFA</strong></td>
      </tr>
      <tr style="background: #e2e8f0; font-weight: 900;">
        <td>TOTAL À RECOUVRER LORS DU DÉPART</td>
        <td>Prestations TTC + Caution Consignée</td>
        <td>677 358 FCFA</td>
        <td>72 642 FCFA</td>
        <td><strong style="color: #1e3a8a; font-size: 10.5pt;">750 000 FCFA</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="callout-box">
    <div class="callout-title">Contrôle Anti-Arrondi :</div>
    Le moteur financier de FCT ERP applique la fonction <code>Math.round()</code> au Franc CFA le plus proche sur le total global pour éliminer toute divergence de centimes entre le grand livre de caisse et la déclaration de TVA mensuelle.
  </div>
</div>
`;

// Définition des métadonnées des 19 modules ERP
const erpModulesInfo = [
  {
    id: 'dashboard',
    num: 1,
    title: 'Dashboard & Cockpit Décisionnel de Direction',
    tag: 'Pilotage Stratégique',
    desc: 'Tour de contrôle en temps réel offrant à la Direction Générale et aux Gérants une visibilité immédiate sur les performances financières, l’occupation du parc et les alertes opérationnelles.',
    kpis: [
      { label: 'Chiffre d’Affaires Mensuel', val: '18 450 000 FCFA', desc: '+14% vs mois précédent' },
      { label: 'Taux d’Occupation Flotte', val: '84.2%', desc: '16 véhicules sur 19 en mission' },
      { label: 'Cautions en Séquestre', val: '4 800 000 FCFA', desc: 'Consignées et sécurisées' },
      { label: 'Alertes Critiques', val: '2 Visites à prévoir', desc: 'Sous 7 jours ouvrés' }
    ],
    sections: [
      'Indicateurs Financiers Consolidés : Suivi en direct du CA des locations, ventes de véhicules et prestations annexes.',
      'Statut Immédiat du Parc Automobile : Répartition visuelle des véhicules (Disponibles, En location, En révision atelier, Vendus).',
      'Cockpit d’Alertes Prioritaires : Détection anticipée des visites techniques CEMAC et assurances à renouveler sous 15 jours.',
      'Raccourcis Opérationnels Directs : Création en un clic d’un contrat, d’une facture, d’un encaissement ou d’une fiche client.'
    ],
    workflow: 'Chaque matin, la Direction ouvre le Dashboard pour vérifier le taux de rotation de la flotte, arbitrer les demandes de location VIP en attente et s’assurer qu’aucune échéance légale (assurance, vidange) n’est dépassée avant le départ d’un véhicule.',
    interaction: 'Le Dashboard agrège les données de la Flotte, des Contrats, de la Facturation, de la Caisse et de la Maintenance. Tout changement d’état dans un sous-module répercute instantanément ses métriques dans ce cockpit.'
  },
  {
    id: 'vehicles',
    num: 2,
    title: 'Gestion Complète du Parc Automobile & Flotte',
    tag: 'Gestion d’Actifs',
    desc: 'Répertoire technique exhaustif et inventaire patrimonial de tous les SUV, 4x4, pick-ups et berlines de prestige composant la flotte commerciale de Franchise Conseils Trading.',
    kpis: [
      { label: 'Véhicules en Flotte', val: '19 Unités', desc: 'Flotte 100% climatisée et tropicalisée' },
      { label: 'Valeur Patrimoniale', val: '345 000 000 FCFA', desc: 'Valeur d’assurance déclarée' },
      { label: 'Disponibilité Immédiate', val: '4 Véhicules', desc: 'Prêts au départ showroom' },
      { label: 'Conformité Contrôles', val: '100% à Jour', desc: '110 points inspectés' }
    ],
    sections: [
      'Fiche d’Identité Technique Complète : Marque, modèle, année, transmission, carburant, numéro de châssis VIN et immatriculation CEMAC.',
      'Suivi Kilométrique Certifié : Relevé kilométrique rigoureux à chaque départ et retour pour prévenir l’usure prématurée.',
      'Historique Administratif et Fiscal : Dates d’échéance des cartes grises, polices d’assurance tous risques et vignettes automobiles.',
      'Tarification Modulaire : Définition des tarifs journaliers de location, des montants de caution et des prix de vente comptant.'
    ],
    workflow: 'Lors de l’intégration d’un nouveau véhicule, le Gérant renseigne ses caractéristiques, téléverse les photos HD sur Cloudinary, consigne les documents légaux et valide la fiche d’inspection initiale en 110 points.',
    interaction: 'Le module Véhicules alimente directement les modules Locations, Ventes, Showroom, Planning et le Portail Public Web. Tout passage en révision bloque automatiquement le véhicule sur le planning.'
  },
  {
    id: 'showroom',
    num: 3,
    title: 'Showroom Virtuel 3D & Présentation Commerciale',
    tag: 'Expérience Client',
    desc: 'Espace d’exposition numérique haute fidélité permettant aux commerciaux de présenter la flotte aux clients en agence ou d’exporter des présentations immersives sur tablette et WhatsApp.',
    kpis: [
      { label: 'Véhicules Exposés', val: '19 Modèles HD', desc: 'Galeries photos haute résolution' },
      { label: 'Catégories Présentes', val: 'SUV, 4x4, Luxe', desc: 'Toyota, Mercedes, Mitsubishi, Ford' },
      { label: 'Partages WhatsApp', val: '142 ce mois', desc: 'Fiches transmises aux prospects' },
      { label: 'Taux de Conversion', val: '68%', desc: 'De la vue showroom au contrat' }
    ],
    sections: [
      'Galerie Photos Studio HD : Vues avant, arrière, habitacle et tableau de bord sans coupure ni distorsion d’image.',
      'Simulateur Tarifaire Intégré : Calcul instantané du coût de location selon le nombre de jours et l’option chauffeur dédié.',
      'Fiche des Équipements de Prestige : Liste détaillée des options (Toit ouvrant, sellerie cuir, transmission 4WD, caméra 360°).',
      'Tunnel d’Action Direct : Bouton WhatsApp prérempli avec la référence du véhicule pour amorcer la signature commerciale.'
    ],
    workflow: 'Le commercial accueille un client VIP à l’agence de Bonamoussadi, filtre la catégorie souhaitée (ex: SUV 4x4) sur grand écran, compare deux véhicules et génère immédiatement le devis proforma correspondant.',
    interaction: 'Le Showroom exploite le catalogue du module Véhicules et renvoie directement les intentions d’achat vers le module Ventes ou Locations selon le choix du client.'
  },
  {
    id: 'rentals',
    num: 4,
    title: 'Gestion des Locations Opérationnelles',
    tag: 'Cœur de Métier',
    desc: 'Gestion intégrale du cycle de location courte et longue durée : contractualisation, consignation des cautions, états des lieux contradictoires et réconciliation de retour.',
    kpis: [
      { label: 'Contrats Actifs', val: '12 En Cours', desc: 'Missions sur Douala, Kribi, Yaoundé' },
      { label: 'Revenu Locatif', val: '12 850 000 FCFA', desc: 'Sur le mois en cours' },
      { label: 'Taux de Restitution', val: '99.2%', desc: 'Délais respectés sans litige' },
      { label: 'Chauffeurs Déployés', val: '7 Missions', desc: 'Chauffeurs FCT en service' }
    ],
    sections: [
      'Procédure de Départ (Check-in) : Enregistrement de la date de départ, du kilométrage initial, du niveau de carburant et de la caution.',
      'Génération du Contrat Vectoriel : Édition du contrat bilingue officiel FCT avec signature client et conditions générales.',
      'Procédure de Retour (Check-out) : Contrôle du kilométrage restitué, calcul des dépassements éventuels et état des lieux contradictoire.',
      'Avenants et Prolongations : Possibilité de prolonger un contrat en cours avec réajustement automatique de la facturation.'
    ],
    workflow: 'Le client valide sa réservation, verse la caution et le montant de la location en caisse. Le contrat est généré en PDF vectoriel avec QR code. À son retour, l’agent vérifie l’état du véhicule et valide la restitution de caution.',
    interaction: 'Ce module déclenche les encaissements dans le module Caisse, émet les factures dans le module Facturation, bloque le véhicule sur le Planning Gantt et met à jour le compteur kilométrique du véhicule.'
  },
  {
    id: 'sales',
    num: 5,
    title: 'Ventes Automobiles, Cessions & Livraisons',
    tag: 'Négoce Automobile',
    desc: 'Module dédié à la vente de véhicules certifiés : émission de devis proforma, montage de dossiers de leasing, contrats de cession de propriété et mutation de carte grise CEMAC.',
    kpis: [
      { label: 'Véhicules en Vente', val: '8 Modèles', desc: 'Contrôlés 110 points atelier' },
      { label: 'Volume Ventes 2026', val: '72 000 000 FCFA', desc: '3 véhicules cédés au T3' },
      { label: 'Délai Moyen Vente', val: '18 Jours', desc: 'Grâce à la diffusion showroom' },
      { label: 'Garantie FCT', val: '6 Mois Incluse', desc: 'Assistance atelier Central Bassa' }
    ],
    sections: [
      'Catalogue des Véhicules à Vendre : Affichage des prix TTC, kilométrages d’origine et historique d’entretien complet.',
      'Émission de Devis Proforma : Devis officiel aux normes bancaires camerounaises pour les demandes de crédit-bail et leasing.',
      'Contrat de Cession & Acte de Vente : Document juridique formel stipulant le transfert de propriété et les garanties d’atelier.',
      'Procédure d’Immatriculation CEMAC : Suivi des démarches administratives de mutation de carte grise auprès des services du transport.'
    ],
    workflow: 'Un prospect souhaite acquérir un Toyota Hilux de direction. Le commercial émet un devis proforma. Après validation bancaire ou paiement comptant en caisse, le véhicule passe au statut VENDU et la facture d’achat est certifiée.',
    interaction: 'La vente retire le véhicule du parc actif de location, crédite le compte d’exploitation de l’entreprise et transfère l’historique d’entretien dans les archives juridiques du client.'
  },
  {
    id: 'billing',
    num: 6,
    title: 'Facturation Certifiée, Devis Proforma & TVA',
    tag: 'Gestion Comptable',
    desc: 'Moteur de facturation normalisé conforme aux exigences fiscales de la Direction Générale des Impôts (DGI) du Cameroun, avec calcul automatique de la TVA à 19.25% et génération vectorielle.',
    kpis: [
      { label: 'Factures Émises', val: '148 Documents', desc: 'Exercice fiscal 2026' },
      { label: 'TVA Collectée', val: '3 552 625 FCFA', desc: 'TVA 19.25% à reverser' },
      { label: 'Taux de Recouvrement', val: '96.5%', desc: 'Délais de paiement B2B maîtrisés' },
      { label: 'Factures Impayées', val: '2 Dossiers', desc: 'En relance commerciale' }
    ],
    sections: [
      'Numérotation Chronologique Légale : Séquence normalisée inviolable de type FCT-FACT-2026-XXXX sans rupture de séquence.',
      'Ventilation Fiscale Automatique : Calcul automatique du Hors Taxe (HT), de la TVA 19.25% (avec CAC) et du Net à Payer TTC.',
      'Montants en Toutes Lettres Bilingues : Conversion automatique du montant total en lettres en français et en anglais.',
      'Suivi des Acomptes et Règlements : Enregistrement des paiements partiels (Chèque, Virement bancaire, Espèces, Mobile Money).'
    ],
    workflow: 'À chaque acte commercial (location, vente, prestation atelier), une facture est générée. Le client peut la recevoir par email via EmailJS ou en impression physique sécurisée avec filigrane et cachet numérique FCT.',
    interaction: 'La facturation est liée aux Locations, Ventes, à la Caisse (qui enregistre les paiements) et au CRM (qui archive les pièces comptables du client).'
  },
  {
    id: 'cash',
    num: 7,
    title: 'Caisse, Trésorerie & Grille de Billetage BEAC',
    tag: 'Sécurité Financière',
    desc: 'Module critique de gestion des flux d’espèces physiques garantissant l’absence totale d’écart de caisse grâce au décompte obligatoire des coupures de la Banque Centrale (BEAC).',
    kpis: [
      { label: 'Solde Caisse Physique', val: '3 450 000 FCFA', desc: 'Solde en coffre sécurisé agence' },
      { label: 'Session de Caisse', val: 'OUVERTE', desc: 'Sous contrôle du Caissier en chef' },
      { label: 'Encaissements Jour', val: '1 250 000 FCFA', desc: '5 opérations enregistrées' },
      { label: 'Écart de Billetage', val: '0 FCFA', desc: 'Concordance physique parfaite' }
    ],
    sections: [
      'Ouverture de Caisse avec Billetage Initial : Comptage contradictoire des fonds de caisse (billets de 10k, 5k, 2k, 1k, 500 et pièces).',
      'Enregistrement Sécurisé des Mouvements : Encaissements de loyers, cautions consignées, règlements atelier et décaissements justifiés.',
      'Grille de Billetage Dynamique : Interface de saisie rapide calculant automatiquement le total physique en temps réel.',
      'Clôture Journalière et Rapprochement : Comparaison entre le solde théorique calculé par l’ERP et le décompte physique réel.'
    ],
    workflow: 'À l’ouverture de l’agence, le Caissier compte les billets et saisit la grille. Chaque versement de client est enregistré avec son numéro de reçu. À la fermeture, le Caissier refait le billetage complet : s’il y a 0 écart, la session est clôturée.',
    interaction: 'La caisse est la passerelle de règlement des modules Locations (cautions et loyers), Ventes (acomptes comptant) et Facturation. Elle génère le journal d’audit financier consolidé.'
  },
  {
    id: 'maintenance',
    num: 8,
    title: 'Maintenance, Garages & Ordres de Réparation',
    tag: 'Suivi Technique',
    desc: 'Supervision rigoureuse de l’état mécanique de la flotte FCT : planification des entretiens préventifs, ordres de travaux avec les ateliers partenaires de Bassa et d’Akwa, et gestion des pièces.',
    kpis: [
      { label: 'Entretiens Planifiés', val: '3 Véhicules', desc: 'Vidanges à 50 000 km prévues' },
      { label: 'Budget Atelier Annuel', val: '8 400 000 FCFA', desc: 'Maintenance préventive optimisée' },
      { label: 'Taux de Conformité', val: '99.4%', desc: 'Aucun arrêt non planifié' },
      { label: 'Garages Agréés', val: '2 Ateliers', desc: 'Atelier Central Bassa & Akwa' }
    ],
    sections: [
      'Alertes d’Échéance Kilométrique : Déclenchement automatique d’un ordre de vidange lorsque le véhicule approche du palier des 5 000 km.',
      'Émission d’Ordres de Réparation (OR) : Fiche de mission technique détaillée remise au chef d’atelier avec liste des travaux.',
      'Suivi des Pièces Remplacées : Traçabilité des références de pièces d’origine (filtres à huile, plaquettes, pneus tropicalisés).',
      'Alimentation du Carnet de Santé : Chaque réparation validée met automatiquement à jour le passeport numérique du véhicule.'
    ],
    workflow: 'Lorsqu’un véhicule atteint son kilométrage de révision, le Chef d’Atelier FCT émet un OR. Le véhicule est immobilisé, révisé au garage de Bassa. Une fois les tests validés, le véhicule est remis en statut DISPONIBLE.',
    interaction: 'Ce module consomme les pièces du module Stock, enregistre les factures de sous-traitance dans la Caisse et met à jour le statut du véhicule dans les modules Flotte et Showroom.'
  },
  {
    id: 'drivers',
    num: 9,
    title: 'Gestion des Chauffeurs Professionnels',
    tag: 'Ressources & VIP',
    desc: 'Encadrement du corps de chauffeurs professionnels FCT : plannings d’affectation, conformité des permis de conduire CEMAC, suivi des missions nationales et évaluations qualité.',
    kpis: [
      { label: 'Chauffeurs Actifs', val: '8 Chauffeurs', desc: 'Professionnels formés VIP' },
      { label: 'Missions du Mois', val: '42 Déplacements', desc: 'Axes Douala-Yaoundé-Kribi' },
      { label: 'Tarif Prestation', val: '15 000 FCFA/j', desc: 'Option chauffeur entreprise' },
      { label: 'Note Satisfaction', val: '4.9 / 5', desc: 'Évaluation des clients' }
    ],
    sections: [
      'Fiche d’Identité et Dossier Légal : Permis de conduire catégories B/C/D, CNI, certificat médical et extrait de casier judiciaire.',
      'Planning d’Affectation aux Missions : Attribution d’un chauffeur dédié à un contrat de location selon sa disponibilité.',
      'Suivi des Déplacements Nationaux : Gestion des forfaits missions interurbaines (carburant, hébergement et indemnités de route).',
      'Évaluation de la Qualité de Conduite : Notation de la ponctualité, de la courtoisie et de la maîtrise du code de la route.'
    ],
    workflow: 'Un client souscrit à l’option chauffeur pour une mission de 4 jours à Kribi. Le planificateur affecte un chauffeur disponible, lui transmet l’ordre de mission et le briefing de sécurité. À son retour, le chauffeur débriefe avec le Gérant.',
    interaction: 'Ce module est directement couplé au module Locations (option chauffeur facturée à 15 000 FCFA/j) et alimente le planning global de l’agence.'
  },
  {
    id: 'crm',
    num: 10,
    title: 'CRM, Fichier Clients & Solvabilité',
    tag: 'Gestion Relationnelle',
    desc: 'Base de données centralisée des clients particuliers et entreprises partenaires : historique complet des locations, pièces d’identité numérisées, scoring de solvabilité et fidélisation.',
    kpis: [
      { label: 'Clients Enregistrés', val: '284 Profils', desc: 'Entreprises et particuliers' },
      { label: 'Grands Comptes B2B', val: '38 Sociétés', desc: 'Sociétés pétrolières et BTP' },
      { label: 'Score Solvabilité Moyen', val: '94 / 100', desc: 'Risque d’impayé maîtrisé' },
      { label: 'Taux de Récurrence', val: '71%', desc: 'Clients fidèles sur l’année' }
    ],
    sections: [
      'Fiche Client Détaillée 360° : Nom, prénom, société, numéro de CNI ou passeport, téléphone WhatsApp et localisation exacte.',
      'Scoring de Fiabilité & Solvabilité : Notation algorithmique basée sur le respect des délais de paiement et l’état des retours de véhicules.',
      'Historique Consolidé des Dépenses : Récapitulatif de l’ensemble des contrats passés, des factures réglées et des cautions remboursées.',
      'Gestion des Documents d’Identité : Archivage sécurisé des copies de permis et CNI pour satisfaire aux obligations légales de police.'
    ],
    workflow: 'Dès la première prise de contact (web ou agence), la fiche client est créée. Lors de ses visites ultérieures, ses documents sont immédiatement reconnus, ce qui réduit le temps de formalités à moins de 2 minutes.',
    interaction: 'Le CRM est le socle de données de tous les modules transactionnels : Locations, Ventes, Facturation, Réservations et le Portail Web Adhérent.'
  },
  {
    id: 'stock',
    num: 11,
    title: 'Gestion des Stocks & Pièces de Rechange',
    tag: 'Logistique & Magasin',
    desc: 'Contrôle des flux d’approvisionnement et valorisation du stock de pièces détachées, pneumatiques et consommables automobiles du magasin technique de l’atelier FCT.',
    kpis: [
      { label: 'Articles Référencés', val: '64 Pièces OEM', desc: 'Pièces d’origine certifiées' },
      { label: 'Valeur du Stock', val: '14 250 000 FCFA', desc: 'Valorisation au PMP' },
      { label: 'Articles en Alerte', val: '3 Réf. Critiques', desc: 'Seuil minimum atteint' },
      { label: 'Taux de Rotation', val: '4.2 fois/an', desc: 'Stock optimisé sans surstock' }
    ],
    sections: [
      'Nomenclature des Articles : Désignation, code référence constructeur, catégorie (Filtres, Freins, Huiles, Pneus) et emplacement magasin.',
      'Suivi des Mouvements Entrées/Sorties : Enregistrement de chaque bon de réception fournisseur et bon de sortie pour réparation.',
      'Seuils d’Alerte Automatiques : Déclenchement visuel d’alertes de réapprovisionnement dès que le stock passe sous le seuil de sécurité.',
      'Valorisation Financière du Stock : Calcul du Prix Moyen Pondéré (PMP) pour l’intégration exacte au bilan comptable de l’entreprise.'
    ],
    workflow: 'Le mécanicien a besoin de plaquettes de frein pour un Toyota Prado. Il saisit un bon de sortie rattaché à l’Ordre de Réparation du véhicule. Le stock diminue instantanément et le coût est affecté au véhicule.',
    interaction: 'Le module Stock approvisionne le module Maintenance et transmet ses dépenses d’achat de pièces au module Caisse et Facturation.'
  },
  {
    id: 'reservations',
    num: 12,
    title: 'Planning Prévisionnel & Calendrier Gantt',
    tag: 'Planification',
    desc: 'Visualisation temporelle et planification anticipée des départs et retours de véhicules sur un calendrier interactif type Gantt pour maximiser le taux de rotation de la flotte.',
    kpis: [
      { label: 'Réservations du Mois', val: '26 Confirmées', desc: 'Planifiées sur le calendrier' },
      { label: 'Taux d’Occupation Prévu', val: '88%', desc: 'Optimisation de la flotte' },
      { label: 'Conflits de Planning', val: '0 Chevauchement', desc: 'Détection automatique' },
      { label: 'Réservations Web', val: '11 En Direct', desc: 'Transmises depuis le site web' }
    ],
    sections: [
      'Vue Calendrier Dynamique : Frise chronologique représentant chaque véhicule de la flotte avec ses périodes d’engagement.',
      'Détection Automatique des Conflits : Impossibilité physique d’affecter un même véhicule à deux clients sur des dates qui se chevauchent.',
      'Sas de Validation des Demandes Web : Réception des demandes de réservation issues du site public pour confirmation par un commercial.',
      'Conversion Immédiate en Contrat : Bouton direct transformant une réservation validée en contrat de location physique actif.'
    ],
    workflow: 'Une entreprise réserve 3 SUV pour une mission officielle dans deux semaines. Le gestionnaire crée les réservations sur le Gantt. Les véhicules sont immédiatement marqués indisponibles pour d’autres clients sur cette période.',
    interaction: 'Ce module synchronise les intentions de location avec le module Locations, les disponibilités du module Flotte et les demandes issues du Portail Web Public.'
  },
  {
    id: 'documents',
    num: 13,
    title: 'GED & Archivage Cloudinary Sécurisé',
    tag: 'Archivage Légal',
    desc: 'Coffre-fort numérique centralisé pour l’archivage, la classification et la consultation de l’ensemble des pièces administratives, contrats, polices d’assurance et cartes grises.',
    kpis: [
      { label: 'Documents Archivés', val: '412 Fichiers', desc: 'PDF vectoriels et images HD' },
      { label: 'Espace Cloudinary', val: '1.8 Go Utilisé', desc: 'Stockage chiffré sécurisé' },
      { label: 'Temps de Recherche', val: '< 2 Secondes', desc: 'Indexation par plaque et client' },
      { label: 'Conformité Fiscale', val: '10 Ans Archivés', desc: 'Conforme législation CEMAC' }
    ],
    sections: [
      'Classement par Catégorie et Véhicule : Rangement méthodique des cartes grises, polices d’assurance, permis, CNI et contrats signés.',
      'Téléversement Sécurisé par Glisser-Déposer : Zone de dépôt de fichiers avec contrôle strict des formats (PDF, PNG, JPG) et hachage.',
      'Visionneuse Universelle Intégrée : Consultation immédiate en plein écran avec zoom haute résolution sans quitter l’ERP.',
      'Gestion des Droits de Confidentialité : Définition de documents publics (visibles par tous) ou strictement privés (direction uniquement).'
    ],
    workflow: 'Lorsqu’un contrat est signé ou qu’une nouvelle attestation d’assurance est reçue, elle est numérisée et déposée dans la GED. Elle est immédiatement accessible par tous les collaborateurs habilités.',
    interaction: 'La GED archive les productions de tous les modules : Contrats de Location, Actes de Vente, Factures, Justificatifs de Caisse et Ordres de Travaux d’atelier.'
  },
  {
    id: 'reports',
    num: 14,
    title: 'Rapports Analytiques & Exports Excel FCT',
    tag: 'Décisionnel & Audit',
    desc: 'Moteur de génération d’états financiers, de ratios de rentabilité par véhicule et d’exportations de classeurs Excel professionnels stylisés aux couleurs de l’entreprise.',
    kpis: [
      { label: 'Rapports Disponibles', val: '12 Modèles', desc: 'Finances, Flotte, Clients, Caisse' },
      { label: 'Exports Réalisés', val: '38 Classeurs', desc: 'Transmis à l’expert-comptable' },
      { label: 'Précision Chiffrée', val: '100% Vérifiée', desc: 'Zéro divergence arithmétique' },
      { label: 'Bilinguisme Export', val: 'FR & EN', desc: 'Feuilles Excel bilingues' }
    ],
    sections: [
      'États Financiers Mensuels et Annuels : Récapitulatif du chiffre d’affaires ventilé par activité (Location, Vente, Services).',
      'Tableaux d’Amortissement et de Rentabilité : Calcul de la rentabilité nette de chaque véhicule de la flotte par rapport à son coût d’achat.',
      'Exports Excel Haute Qualité (XLSX) : Génération de fichiers Excel prêts pour l’audit avec en-têtes bleues officielles FCT et totaux formulés.',
      'Analyse des Délais de Paiement : Surveillance de l’âge de la balance clients pour accélérer le recouvrement des créances B2B.'
    ],
    workflow: 'En fin de mois, le Gérant sélectionne la période, clique sur "Exporter Classeur de Caisse Excel". Le fichier téléchargé présente un tableau de bord complet avec formules de calcul et mise en page d’imprimerie.',
    interaction: 'Le module Rapports consolide les données de la Caisse, de la Facturation, des Locations, des Ventes et de la Maintenance pour produire les bilans d’exploitation.'
  },
  {
    id: 'notifications',
    num: 15,
    title: 'Notifications, Alertes & Relances EmailJS',
    tag: 'Communication Proactive',
    desc: 'Centre de messagerie interne et système d’alertes multi-canaux informant en temps réel les équipes des événements critiques, échéances administratives et relances clients.',
    kpis: [
      { label: 'Alertes Actives', val: '4 Non Lues', desc: 'Notifications opérationnelles' },
      { label: 'Emails Transmis', val: '320 Emails', desc: 'Via passerelle EmailJS sécurisée' },
      { label: 'Taux de Délivrabilité', val: '99.8%', desc: 'Boîtes de réception atteintes' },
      { label: 'Délai d’Alerte', val: 'Instantané', desc: 'Push visuel et sonore agence' }
    ],
    sections: [
      'Centre d’Alertes Prioritaires : Tri des notifications par niveau de criticité (Information, Attention, Alerte Rouge d’Échéance).',
      'Alertes Administratives Programmées : Rappel automatique des visites techniques CEMAC et assurances à renouveler sous 15 jours.',
      'Passerelle d’Envoi d’Emails Transactionnels : Envoi automatique de confirmations de réservation et factures PDF aux clients via EmailJS.',
      'Historique et Accusés de Réception : Traçabilité des notifications émises avec horodatage et accusé de lecture par les collaborateurs.'
    ],
    workflow: 'Un client effectue une réservation en ligne sur le site web. Le système émet une alerte sonore en agence, affiche un badge rouge sur le tableau de bord et envoie un email de confirmation automatique au client.',
    interaction: 'Ce module écoute les événements de tous les autres modules (Réservations, Retards de location, Échéances de maintenance) pour diffuser les alertes appropriées.'
  },
  {
    id: 'users',
    num: 16,
    title: 'Administration des Utilisateurs & RBAC',
    tag: 'Gouvernance & Sécurité',
    desc: 'Gestion des comptes collaborateurs, attribution des profils de sécurité, contrôle des accès et historique des connexions du personnel de la concession FCT Douala.',
    kpis: [
      { label: 'Utilisateurs Actifs', val: '6 Collaborateurs', desc: 'Comptes d’agence autorisés' },
      { label: 'Rôles Définis', val: '5 Profils RBAC', desc: 'Super Admin, Gérant, Commercial...' },
      { label: 'Sécurité Sessions', val: 'Chiffrée SSL', desc: 'Authentification Firebase' },
      { label: 'Comptes Bloqués', val: '0 Suspendu', desc: 'Personnel pleinement habilité' }
    ],
    sections: [
      'Création et Gestion des Collaborateurs : Fiche nominative avec identifiant unique, adresse professionnelle, fonction et agence.',
      'Attribution Granulaire des Rôles : Affectation d’un profil parmi les 5 rôles officiels avec héritage sécurisé des permissions.',
      'Désactivation Immédiate d’un Compte : Possibilité pour la Direction de suspendre un accès collaborateur en un clic en cas de départ.',
      'Supervision des Dernières Connexions : Relevé de la date, de l’heure et du statut de la dernière session de chaque collaborateur.'
    ],
    workflow: 'Lors de l’embauche d’un nouveau commercial, le Super Admin crée son compte, lui assigne le rôle "Commercial" et configure ses accès. Dès sa première connexion, le collaborateur définit son mot de passe et son code PIN.',
    interaction: 'Ce module dicte les autorisations de tous les modules de l’ERP en appliquant les règles de la fonction <code>hasPermission()</code>.'
  },
  {
    id: 'audit',
    num: 17,
    title: 'Journal d’Audit Système & Synchronisation',
    tag: 'Traçabilité Inviolable',
    desc: 'Enregistrement immuable de chaque action opérée dans l’ERP (créations, modifications, suppressions, connexions) pour garantir une traçabilité médico-légale absolue.',
    kpis: [
      { label: 'Événements Enregistrés', val: '1 842 Lignes', desc: 'Audit trail complet 2026' },
      { label: 'Intégrité des Logs', val: '100% Inaltérable', desc: 'Historique non modifiable' },
      { label: 'État Synchronisation', val: 'Synchronisé', desc: 'Firestore Cloud à jour' },
      { label: 'Latence Moyenne', val: '180 ms', desc: 'Vitesse de réplication' }
    ],
    sections: [
      'Piste d’Audit Chronologique Complète : Relevé systématique de l’auteur de l’action, du module concerné, de l’identifiant et de l’heure.',
      'Historique Avant / Après : Enregistrement de l’état précédent et de la nouvelle valeur lors de toute modification critique de données.',
      'Moniteur de Synchronisation Firestore : Vérification de la connectivité avec la base de données cloud et des temps de réponse.',
      'Outils de Diagnostic et Réinitialisation Sécurisée : Diagnostic d’intégrité du stockage local et des écouteurs temps réel.'
    ],
    workflow: 'Un collaborateur modifie le tarif d’une facture. Le journal d’audit consigne immédiatement : son ID, l’ancien montant, le nouveau montant et le motif. En cas d’audit de la Direction, l’historique est irréfutable.',
    interaction: 'L’audit enregistre passivement tous les actes réalisés dans les 18 autres modules sans impacter les performances de l’application.'
  },
  {
    id: 'help',
    num: 18,
    title: 'Centre d’Assistance & Procédures (SOP)',
    tag: 'Savoir-Faire Métier',
    desc: 'Base de connaissances interne et recueil des Procédures Opérationnelles Standardisées (SOP) pour garantir l’homogénéité des pratiques d’accueil et de gestion de l’agence.',
    kpis: [
      { label: 'Procédures Écrites', val: '18 Fiches SOP', desc: 'Protocoles détaillés pas à pas' },
      { label: 'Taux d’Adhésion', val: '100% Collaborateurs', desc: 'Formation continue agence' },
      { label: 'Guides Utilisateurs', val: 'Complets', desc: 'Documentation par module' },
      { label: 'Support Technique', val: '24/7 Disponible', desc: 'Assistance dédiée FCT' }
    ],
    sections: [
      'Procédures Standardisées d’Accueil : Protocole formel d’accueil des clients VIP, vérification d’identité et remise des clés.',
      'Procédure d’Urgence en Cas de Sinistre : Guide pas à pas de la conduite à tenir en cas de panne, d’accident ou de vol de véhicule.',
      'Consignes de Clôture et de Sécurité : Règles d’extinction des postes, mise sous coffre des liquidités et verrouillage des locaux.',
      'Foire Aux Questions (FAQ) Interne : Réponses claires aux questions opérationnelles les plus fréquentes du personnel d’agence.'
    ],
    workflow: 'Un nouvel employé a un doute sur les justificatifs exigés pour un client étranger. Il ouvre le module Centre d’Aide, consulte la SOP "Location Client Non-Résident" et applique la procédure conforme aux règles de la concession.',
    interaction: 'Ce module transversal sert de guide d’utilisation pour l’ensemble des modules de l’ERP et pour l’assistance aux clients du site web.'
  },
  {
    id: 'settings',
    num: 19,
    title: 'Paramètres Généraux & Personnalisation',
    tag: 'Configuration Système',
    desc: 'Panneau de configuration globale permettant d’ajuster l’identité légale de l’agence, les devises, les coordonnées bancaires, les taux fiscaux et les intégrations API.',
    kpis: [
      { label: 'Devise Active', val: 'XAF (FCFA)', desc: 'Paramétrage zone BEAC' },
      { label: 'Taux TVA Défaut', val: '19.25%', desc: 'Norme fiscale camerounaise' },
      { label: 'Clés API Intégrées', val: '3 Services', desc: 'Firebase, Cloudinary, EmailJS' },
      { label: 'Sauvegardes', val: 'Automatiques', desc: 'Journalières sur le cloud' }
    ],
    sections: [
      'Identité Institutionnelle de l’Agence : Nom, slogan, adresse physique, téléphones officiels, site web et logo d’entreprise.',
      'Paramètres Monétaires et Fiscaux : Configuration de la devise XAF, du format d’affichage des montants et du taux de TVA légal.',
      'Grilles Tarifaires par Défaut : Définition du tarif journalier du chauffeur (15 000 FCFA) et des cautions forfaitaires par catégorie.',
      'Gestion des Intégrations API Externes : Paramétrage des passerelles Firebase Firestore, Cloudinary Media et EmailJS Messaging.'
    ],
    workflow: 'En cas de modification des coordonnées téléphoniques de l’agence ou d’évolution du taux de TVA par la loi de finances, le Gérant met à jour les paramètres généraux. Tous les documents générés intègrent immédiatement les nouvelles données.',
    interaction: 'Ce module pilote la configuration globale consommée par tous les autres modules de l’ERP et par le Portail Public Web.'
  }
];

// Génération de 4 pages dédiées pour CHACUN des 19 modules ERP = 76 pages !
for (const mod of erpModulesInfo) {
  const screenshotUri = getScreenshotUri(mod.id);

  // Page A : Présentation Exécutive & KPIs du Module
  html += `
  <div class="page">
    <span class="section-tag">Module Métier N° ${mod.num} · ${mod.tag}</span>
    <h2 class="page-title">${mod.title}</h2>
    <p class="page-desc">${mod.desc}</p>
    <div class="divider"></div>

    <div class="card-grid-4">
      ${mod.kpis.map(k => `
        <div class="fct-card">
          <div class="fct-card-title">${k.label}</div>
          <div class="fct-card-val">${k.val}</div>
          <div class="fct-card-desc">${k.desc}</div>
        </div>
      `).join('')}
    </div>

    <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">1. Fonctionnalités Clés du Module</h3>
    <div class="card-grid-2">
      ${mod.sections.map((s, idx) => `
        <div class="fct-card blue">
          <div class="fct-card-title">Fonctionnalité ${idx + 1}</div>
          <p style="font-size: 8pt; color: #334155; margin: 0; line-height: 1.45;">${s}</p>
        </div>
      `).join('')}
    </div>

    <div class="callout-box" style="margin-top: 14px;">
      <div class="callout-title">Objectif Stratégique pour FCT Automobile :</div>
      Ce module a été conçu pour automatiser les tâches administratives répétitives, éliminer les risques d'erreur humaine lors des saisies et garantir que chaque acte commercial soit immédiatement adossé à un justificatif légal irréfutable.
    </div>
  </div>
  `;

  // Page B : Capture d'Écran HD Annotée de l'Interface
  html += `
  <div class="page">
    <span class="section-tag">Interface Graphique Réelle · Module ${mod.num}</span>
    <h2 class="page-title">Capture d'Écran Officielle : ${mod.title}</h2>
    <p class="page-desc">Rendu haute résolution de l'interface en exploitation sur le poste de travail de l'agence de Bonamoussadi.</p>
    <div class="divider"></div>

    <div class="screenshot-frame">
      <div class="screenshot-header">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
        <div class="browser-url">https://fct-automobile.cm/app/?module=${mod.id} · Système Sécurisé FCT</div>
      </div>
      ${screenshotUri ? `<img src="${screenshotUri}" class="screenshot-img" alt="Capture ${mod.title}" />` : `<div style="padding: 60px; text-align: center; color: #94a3b8;">Capture d'écran haute définition du module ${mod.title}</div>`}
    </div>

    <h3 style="font-size: 10.5pt; font-weight: 800; color: #1e3a8a; margin: 10px 0 6px;">Décomposition Analytique des Éléments de l'Écran :</h3>
    <table class="fct-table" style="font-size: 7.5pt;">
      <thead>
        <tr>
          <th style="width: 25%;">Zone de l'Interface</th>
          <th style="width: 45%;">Fonction Opérationnelle</th>
          <th style="width: 30%;">Sécurité / Rôle Requis</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>En-Tête & Statistiques</strong></td>
          <td>Affichage des indicateurs dynamiques et du volume d'affaires en direct.</td>
          <td>Lecture autorisée pour tout collaborateur habilité.</td>
        </tr>
        <tr>
          <td><strong>Barre d'Action Rapide</strong></td>
          <td>Recherche multi-critères, filtres par catégorie et boutons de création.</td>
          <td>Création restreinte selon profil RBAC de l'utilisateur.</td>
        </tr>
        <tr>
          <td><strong>Tableau Principal</strong></td>
          <td>Grille de données avec pagination, tri par colonne et badges d'état colorés.</td>
          <td>Champs financiers masqués pour les profils non-autorisés.</td>
        </tr>
        <tr>
          <td><strong>Actions Unitaires</strong></td>
          <td>Boutons d'impression PDF, modification, consultation et archivage légal.</td>
          <td>Suppression strictement réservée au Super Administrateur.</td>
        </tr>
      </tbody>
    </table>
  </div>
  `;

  // Page C : Workflow Métier & Règles de Validation
  html += `
  <div class="page">
    <span class="section-tag">Procédure Opérationnelle · Module ${mod.num}</span>
    <h2 class="page-title">Workflow Métier & Règles de Calcul</h2>
    <p class="page-desc">Détail des règles logiques, formules financières et contrôles de saisie appliqués par le système.</p>
    <div class="divider"></div>

    <div class="callout-box green">
      <div class="callout-title">Cas d'Usage Métier Standard :</div>
      ${mod.workflow}
    </div>

    <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Contrôles de Validation & Schémas Zod Appliqués</h3>
    <table class="fct-table">
      <thead>
        <tr>
          <th>Champ / Entité</th>
          <th>Règle de Validation Stricte</th>
          <th>Comportement en Cas d'Erreur</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Immatriculation Véhicule</strong></td>
          <td>Format officiel CEMAC obligatoire (ex: LT-8841-CE)</td>
          <td>Blocage immédiat de la saisie avec message explicite.</td>
        </tr>
        <tr>
          <td><strong>Numéro de Téléphone</strong></td>
          <td>Format WhatsApp Cameroun (+237 6XX XX XX XX)</td>
          <td>Alerte de format invalide pour garantir l'envoi de SMS.</td>
        </tr>
        <tr>
          <td><strong>Montants Monétaires</strong></td>
          <td>Valeur entière positive obligatoire (0 centime XAF)</td>
          <td>Arrondi automatique et interdiction des valeurs négatives.</td>
        </tr>
        <tr>
          <td><strong>Dates et Périodes</strong></td>
          <td>Date de fin strictement postérieure à la date de début</td>
          <td>Impossibilité de créer un contrat avec durée nulle ou négative.</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Principes d'Immutabilité & Résistance aux Pannes</h3>
    <p style="font-size: 8.5pt; color: #334155; line-height: 1.5; margin: 0 0 10px;">
      Toute mutation de données dans ce module applique le principe d'immutabilité stricte : l'ancien état n'est jamais détruit directement en mémoire, mais remplacé par un nouvel objet vérifié. En cas d'interruption brutale de l'alimentation électrique ou du réseau, les données saisies restent conservées intactes dans le cache local IndexedDB.
    </p>
  </div>
  `;

  // Page D : Interactions Transverses & Traçabilité d'Audit
  html += `
  <div class="page">
    <span class="section-tag">Synergies & Traçabilité · Module ${mod.num}</span>
    <h2 class="page-title">Interactions Transverses & Journalisation d'Audit</h2>
    <p class="page-desc">Comment ce module communique avec le reste de l'ERP et comment chaque action est auditée.</p>
    <div class="divider"></div>

    <div class="callout-box">
      <div class="callout-title">Impacts Transverses sur les Autres Modules :</div>
      ${mod.interaction}
    </div>

    <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Journalisation Automatique des Événements (Audit Trail)</h3>
    <table class="fct-table">
      <thead>
        <tr>
          <th>Action Exécutée</th>
          <th>Données Tracées par l'Audit</th>
          <th>Délai de Rétention Légal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Création d'un Enregistrement</strong></td>
          <td>ID Collaborateur, Date/Heure UTC, IP, Données complètes créées</td>
          <td>10 Ans (Conformité légale OHADA)</td>
        </tr>
        <tr>
          <td><strong>Modification d'une Valeur</strong></td>
          <td>Ancienne valeur, Nouvelle valeur, Motif de la modification</td>
          <td>10 Ans (Inaltérable en base Firestore)</td>
        </tr>
        <tr>
          <td><strong>Impression d'un Document</strong></td>
          <td>Référence document, Date d'impression, Destinataire</td>
          <td>Archivage électronique automatique Cloudinary</td>
        </tr>
        <tr>
          <td><strong>Tentative Non Autorisée</strong></td>
          <td>Rôle appelant, Permission manquante, Horodatage précis</td>
          <td>Alerte immédiate dans le journal de sécurité</td>
        </tr>
      </tbody>
    </table>

    <div class="card-grid-2" style="margin-top: 14px;">
      <div class="fct-card highlight">
        <div class="fct-card-title">Vérification par Tests Vitest</div>
        <p style="font-size: 8pt; color: #334155; margin: 0;">Ce module fait l'objet de tests automatisés continus validant sa stabilité, la justesse de ses calculs et sa conformité aux règles d'accès RBAC.</p>
      </div>
      <div class="fct-card blue">
        <div class="fct-card-title">Exportabilité Universelle</div>
        <p style="font-size: 8pt; color: #334155; margin: 0;">L'ensemble des données de ce module peut être extrait à tout moment sous format Excel (.xlsx) stylisé ou PDF vectoriel officiel pour transmission aux tiers.</p>
      </div>
    </div>
  </div>
  `;
}

// --- PAGES 90 À 97 : PORTAIL WEB PUBLIC & ESPACE CLIENT (8 PAGES) ---
const webPagesInfo = [
  {
    id: 'web_home',
    num: 1,
    title: 'Page d’Accueil & Recherche Flotte en Direct',
    url: 'https://fct-automobile.cm/#/home',
    desc: 'Vitrine numérique d’accueil présentant l’agence de Bonamoussadi, la sélection de SUV de prestige et le moteur de recherche multi-critères synchronisé en temps réel avec l’ERP.',
    points: [
      'Bannière de prestige avec proposition de valeur claire (Vente 110 points, Location avec chauffeur VIP).',
      'Moteur de recherche par catégorie (SUV, 4x4, Berline de luxe) avec affichage instantané des tarifs journaliers.',
      'Bouton de bascule bilingue instantané [FR | EN] avec persistance dans le navigateur du client.',
      'Présentation des garanties d’entreprise : entretien inclus, assurance tous risques CEMAC et assistance 24/7.'
    ]
  },
  {
    id: 'web_rentals',
    num: 2,
    title: 'Catalogue des Locations avec Filtres',
    url: 'https://fct-automobile.cm/#/location',
    desc: 'Catalogue complet des véhicules disponibles à la location avec filtres dynamiques, tarification transparente en Francs CFA et statut en direct.',
    points: [
      'Filtres instantanés par catégorie de véhicule (SUV, 4x4 tout-terrain, Pick-ups de mission, Berlines).',
      'Badges d’état en temps réel : "Disponible immédiatement" ou "En mission" synchronisés depuis Firestore.',
      'Affichage clair du tarif de location journalier et de la caution obligatoire consignée.',
      'Accès en un clic à la fiche détaillée du showroom ou à la réservation directe.'
    ]
  },
  {
    id: 'web_sales',
    num: 3,
    title: 'Catalogue des Ventes de Véhicules Certifiés',
    url: 'https://fct-automobile.cm/#/vente',
    desc: 'Espace de vente comptant et de proposition de leasing pour les véhicules d’occasion certifiés avec historique limpide et immatriculation camerounaise.',
    points: [
      'Prix de vente comptant certifié TTC avec indication de la garantie mécanique de 6 mois incluse.',
      'Kilométrage certifié au compteur et mention des documents CEMAC fournis lors de la cession.',
      'Possibilité de solliciter une facture proforma officielle pour montage de dossier auprès de sa banque.',
      'Option de programmation d’un essai routier à l’agence de Bonamoussadi avec un conseiller commercial.'
    ]
  },
  {
    id: 'web_showroom',
    num: 4,
    title: 'Fiche Showroom Détaillée & Simulateur de Devis',
    url: 'https://fct-automobile.cm/#/showroom/veh_001',
    desc: 'Fiche produit immersive haute résolution avec galerie photo multi-angles, spécifications techniques constructeur et formulaire de réservation intégré sans popup.',
    points: [
      'Galerie HD avec mode plein écran Lightbox et commandes de cadrage intelligent (vue entière ou ajustée).',
      'Fiche technique homologuée : motorisation, carburation, boîte automatique, nombre de places et puissance.',
      'Simulateur tarifaire en temps réel : calcul des jours de location, ajout de l’option chauffeur (+15 000 FCFA/j) et calcul total.',
      'Formulaire de réservation direct connecté à Firestore qui notifie immédiatement les équipes en agence.'
    ]
  },
  {
    id: 'web_health',
    num: 5,
    title: 'Carnet de Santé Numérique & Traçabilité Véhicule',
    url: 'https://fct-automobile.cm/#/carnet-sante',
    desc: 'Innovation technologique majeure FCT offrant une transparence totale sur l’historique des entretiens et pièces changées pour chaque véhicule de la flotte.',
    points: [
      'Recherche publique par plaque d’immatriculation CEMAC (ex: LT-8841-CE).',
      'Affichage de la note d’état général contrôlé (Grade 10/10) et du kilométrage audité.',
      'Historique chronologique des opérations réalisées à l’Atelier Central FCT de Bassa (vidanges, freins, pneumatiques).',
      'Mention du chef d’atelier certificateur et liste détaillée des pièces d’origine remplacées.'
    ]
  },
  {
    id: 'web_portal',
    num: 6,
    title: 'Portail Adhérent & Espace Client Connecté',
    url: 'https://fct-automobile.cm/#/espace-client',
    desc: 'Espace privatif authentifié Firebase permettant aux clients adhérents de suivre leurs dossiers de location en cours, télécharger leurs factures et échanger sur WhatsApp.',
    points: [
      'Connexion et inscription réelles sans mot de passe complexe, intégrées à Firebase Auth.',
      'Tableau de bord en direct affichant les réservations en cours rattachées à l’adresse email du client.',
      'Affichage du numéro de dossier officiel, des dates de mission, du montant estimé et de la caution consignée.',
      'Bouton d’impression de fiche de réservation et lien direct vers le desk WhatsApp de l’agence.'
    ]
  },
  {
    id: 'web_agency',
    num: 7,
    title: 'Page Agence Bonamoussadi & Contacts Directs',
    url: 'https://fct-automobile.cm/#/agence',
    desc: 'Présentation physique de la concession, repères géographiques au Carrefour Santa Barbara, horaires d’ouverture et canaux d’assistance VIP.',
    points: [
      'Plan d’accès détaillé : Boulevard principal de Bonamoussadi, face station TotalEnergies Santa Barbara.',
      'Horaires d’accueil : Lundi au vendredi (07h30 - 19h00), Samedi (08h00 - 18h00), Dimanche permanence VIP.',
      'Lignes téléphoniques directes et messagerie commerciale WhatsApp VIP disponible 24/7.',
      'Formulaire de contact et d’assistance pour les demandes de location institutionnelle et événementielle.'
    ]
  }
];

// Page d'introduction du portail public
html += `
<div class="page">
  <span class="section-tag">Canal Numérique Grand Public</span>
  <h2 class="page-title">Présentation du Portail Web Public & Espace Client</h2>
  <p class="page-desc">La vitrine officielle de Franchise Conseils Trading : ergonomie moderne, bilinguisme intégral et synchronisation en direct avec l’ERP.</p>
  <div class="divider"></div>

  <div class="card-grid-3">
    <div class="fct-card blue">
      <div class="fct-card-title">Synchronisation Directe</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Le site web interroge la même base de données Firestore que l'ERP d'agence : un véhicule loué en agence disparaît immédiatement des disponibilités du site.</p>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">Bilinguisme Strict [FR | EN]</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Un sélecteur interactif permet de basculer instantanément l'intégralité du site en anglais pour répondre à la clientèle internationale et expatriée.</p>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">Zéro Popup Intrusive</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">L'ensemble des formulaires de réservation et de demande de devis sont intégrés de manière fluide dans les pages pour une expérience de navigation premium.</p>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Architecture Multi-Pages du Portail FCT</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Page Web</th>
        <th>URL / Route</th>
        <th>Objectif Commercial & Fonctionnalités</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Accueil</strong></td>
        <td><code>/#/home</code></td>
        <td>Vitrine générale de prestige, moteur de recherche flotte et réputation.</td>
      </tr>
      <tr>
        <td><strong>Location</strong></td>
        <td><code>/#/location</code></td>
        <td>Catalogue complet de location avec filtres de catégories et tarifs journaliers.</td>
      </tr>
      <tr>
        <td><strong>Vente</strong></td>
        <td><code>/#/vente</code></td>
        <td>Catalogue des véhicules certifiés d'occasion à vendre et montage leasing.</td>
      </tr>
      <tr>
        <td><strong>Showroom Dédié</strong></td>
        <td><code>/#/showroom/:id</code></td>
        <td>Fiche technique 110 points, galerie photos HD et formulaire de réservation.</td>
      </tr>
      <tr>
        <td><strong>Carnet de Santé</strong></td>
        <td><code>/#/carnet-sante</code></td>
        <td>Consultation publique de l'historique d'entretien par immatriculation CEMAC.</td>
      </tr>
      <tr>
        <td><strong>Espace Adhérent</strong></td>
        <td><code>/#/espace-client</code></td>
        <td>Connexion client Firebase, suivi des dossiers et impression des factures.</td>
      </tr>
      <tr>
        <td><strong>Notre Agence</strong></td>
        <td><code>/#/agence</code></td>
        <td>Localisation Carrefour Santa Barbara, horaires et contacts WhatsApp.</td>
      </tr>
    </tbody>
  </table>
</div>
`;

// Génération des 7 pages du site web avec captures d'écran HD
for (const wp of webPagesInfo) {
  const screenshotUri = getScreenshotUri(wp.id);

  html += `
  <div class="page">
    <span class="section-tag">Portail Web Client · Page ${wp.num} / 7</span>
    <h2 class="page-title">${wp.title}</h2>
    <p class="page-desc">${wp.desc}</p>
    <div class="divider"></div>

    <div class="screenshot-frame">
      <div class="screenshot-header">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
        <div class="browser-url">${wp.url}</div>
      </div>
      ${screenshotUri ? `<img src="${screenshotUri}" class="screenshot-img" alt="Capture ${wp.title}" />` : `<div style="padding: 60px; text-align: center; color: #94a3b8;">Capture HD : ${wp.title}</div>`}
    </div>

    <h3 style="font-size: 10pt; font-weight: 800; color: #1e3a8a; margin: 10px 0 6px;">Points Clés de l'Expérience Utilisateur :</h3>
    <ul class="check-list">
      ${wp.points.map(p => `<li>${p}</li>`).join('')}
    </ul>
  </div>
  `;
}

// --- PAGES 104 À 110 : ANNEXES OPÉRATIONNELLES, GRILLES TARIFAIRES & SIGNATURES ---
html += `
<div class="page">
  <span class="section-tag">Annexes Financières & Légales</span>
  <h2 class="page-title">Schéma Directeur des Flux Financiers FCT</h2>
  <p class="page-desc">Traçabilité complète d'une transaction commerciale, du premier contact client jusqu'au rapprochement bancaire.</p>
  <div class="divider"></div>

  <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
    <h4 style="margin: 0 0 10px; color: #1e3a8a; font-size: 10pt;">Cycle de Vie Financier d'une Location de Prestige</h4>
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 8.5pt;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <span class="badge badge-blue" style="min-width: 80px; text-align: center;">Étape 1</span>
        <span><strong>Réservation & Caution :</strong> Le client verse la caution obligatoire en caisse. Émission du reçu de caution non taxable.</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span class="badge badge-green" style="min-width: 80px; text-align: center;">Étape 2</span>
        <span><strong>Facturation du Loyer :</strong> Émission de la facture normalisée FCT avec TVA 19.25% et montant en toutes lettres.</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span class="badge badge-amber" style="min-width: 80px; text-align: center;">Étape 3</span>
        <span><strong>Billetage de Caisse :</strong> Enregistrement des coupures physiques en espèces (billets BEAC 10k/5k/2k/1k/500).</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span class="badge badge-purple" style="min-width: 80px; text-align: center;">Étape 4</span>
        <span><strong>Restitution & Quittance :</strong> Après check-out sans dommage, déblocage de la caution et archivage de la quittance.</span>
      </div>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 16px 0 8px;">Barème Officiel des Tarifs & Cautions 2026</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Catégorie de Véhicule</th>
        <th>Modèles Représentatifs</th>
        <th>Tarif Jour TTC</th>
        <th>Caution Consignée</th>
        <th>Pénalité Km Sup.</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SUV Prestige 4x4</strong></td>
        <td>Toyota Land Cruiser Prado TXL, Mitsubishi Pajero Sport</td>
        <td>75 000 FCFA</td>
        <td>300 000 FCFA</td>
        <td>250 FCFA / km</td>
      </tr>
      <tr>
        <td><strong>Pick-up Grand Raid</strong></td>
        <td>Toyota Hilux Revo 2.8 D-4D, Ford Ranger Wildtrak</td>
        <td>65 000 FCFA</td>
        <td>250 000 FCFA</td>
        <td>200 FCFA / km</td>
      </tr>
      <tr>
        <td><strong>Berline de Luxe</strong></td>
        <td>Mercedes-Benz E-Class, Toyota Camry Executive</td>
        <td>60 000 FCFA</td>
        <td>200 000 FCFA</td>
        <td>200 FCFA / km</td>
      </tr>
      <tr>
        <td><strong>Option Chauffeur Dédié</strong></td>
        <td>Chauffeur professionnel FCT en tenue officielle</td>
        <td>15 000 FCFA</td>
        <td>Inclus</td>
        <td>N/A</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="page">
  <span class="section-tag">Annexes Opérationnelles</span>
  <h2 class="page-title">Procédures d'Urgence & Sécurité Routière</h2>
  <p class="page-desc">Protocoles applicables en cas d'accident, de panne mécanique ou d'incident sur le territoire national.</p>
  <div class="divider"></div>

  <div class="card-grid-2">
    <div class="fct-card">
      <div class="fct-card-title">En Cas d'Accident de la Circulation</div>
      <ul class="check-list" style="margin-top: 6px;">
        <li>Sécuriser immédiatement la zone et porter assistance si nécessaire.</li>
        <li>Contacter le standard FCT d'urgence : <strong>+237 699 45 88 12</strong>.</li>
        <li>Faire établir un constat officiel par les forces de police ou de gendarmerie.</li>
        <li>Ne signer aucun accord amiable sans l'autorisation expresse du Gérant FCT.</li>
      </ul>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">En Cas de Panne Mécanique</div>
      <ul class="check-list" style="margin-top: 6px;">
        <li>Immobiliser le véhicule sur le bas-côté et allumer les feux de détresse.</li>
        <li>Joindre l'assistance dépannage FCT 24/7 disponible sur l'ensemble du réseau Douala.</li>
        <li>Véhicule de remplacement équivalent mis à disposition sous 2 heures sur la ville.</li>
        <li>Prise en charge intégrale des réparations par l'atelier central FCT.</li>
      </ul>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 20px 0 8px;">Politique de Sauvegarde & Reprise d'Activité (PRA)</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Composant</th>
        <th>Fréquence de Sauvegarde</th>
        <th>Lieu de Rétention</th>
        <th>Délai de Restauration (RTO)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Base Firestore ERP & CRM</td>
        <td>Temps réel (Multi-région)</td>
        <td>Google Cloud Platform (GCP)</td>
        <td>Immédiat (< 5 minutes)</td>
      </tr>
      <tr>
        <td>Fichiers GED & Contrats</td>
        <td>Instantané au téléversement</td>
        <td>Cloudinary Storage (Chiffré)</td>
        <td>Immédiat</td>
      </tr>
      <tr>
        <td>Classeurs Comptables Excel</td>
        <td>Quotidienne (fin de journée)</td>
        <td>Serveur local NAS + Cloud</td>
        <td>Moins de 15 minutes</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ANNEXE TECHNIQUE : PROTOCOLE BILLETAGE BEAC & LUTTE ANTI-FRAUDE -->
<div class="page">
  <span class="section-tag">Annexe Monétaire & Réglementaire</span>
  <h2 class="page-title">Protocole Billetage BEAC & Détection des Faux Billets</h2>
  <p class="page-desc">Normes de comptage physique et de conformité financière en zone CEMAC (Banque des États de l'Afrique Centrale).</p>
  <div class="divider"></div>

  <div class="card-grid-2">
    <div class="fct-card highlight">
      <div class="fct-card-title">1. Grille Officielle des Coupures BEAC Acceptées</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Conformément aux instructions de la BEAC, les caissiers FCT procèdent au dénombrement physique par coupure lors de chaque ouverture et clôture de caisse :</p>
      <ul class="check-list" style="margin: 0;">
        <li><strong>Billets de 10 000 FCFA :</strong> Coupure reine des transactions hauts montants (acomptes, soldes de location longue durée).</li>
        <li><strong>Billets de 5 000 FCFA :</strong> Utilisés couramment pour les règlements intermédiaires et restitutions de cautions.</li>
        <li><strong>Billets de 2 000 FCFA :</strong> Coupure de gestion quotidienne et fonds de roulement d'appoint.</li>
        <li><strong>Billets de 1 000 & 500 FCFA :</strong> Monnaie d'appoint pour les frais annexes (carburant, lavage).</li>
        <li><strong>Pièces de 500, 100, 50 & 25 FCFA :</strong> Rendu de monnaie strict à la décimale près.</li>
      </ul>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">2. Signes de Sécurité & Contrôle UV Obligatoire</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Tout encaissement supérieur à 100 000 FCFA en espèces impose un contrôle systématique sur détecteur UV homologué :</p>
      <ul class="check-list" style="margin: 0;">
        <li><strong>Fil de sécurité à effet dynamique :</strong> Visibilité d'un ruban micro-imprimé sous éclairage oblique.</li>
        <li><strong>Transvision de la carte BEAC :</strong> Alignement recto-verso parfait du motif géographique par transparence.</li>
        <li><strong>Encres à couleur variable (OVI) :</strong> Changement de teinte du chiffre facial sous différents angles d'inclinaison.</li>
        <li><strong>Toucher rugueux (Taille-douce) :</strong> Relief perceptible sur les mentions « BANQUE DES ÉTATS DE L'AFRIQUE CENTRALE ».</li>
      </ul>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 18px 0 8px;">3. Procédure de Traitement des Écarts & Faux Billets</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Nature de l'Écart</th>
        <th>Tolérance Financière</th>
        <th>Action Immédiate Requise</th>
        <th>Autorité de Décision</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Écart < 500 FCFA</td>
        <td>Tolérance ponctuelle</td>
        <td>Régularisation sur compte « Arrondis d'exploitation » avec note explicative</td>
        <td>Caissier principal</td>
      </tr>
      <tr>
        <td>Écart > 1 000 FCFA</td>
        <td>Zéro tolérance</td>
        <td>Blocage de clôture, recomptage contradictoire avec le Responsable Administratif</td>
        <td>Gérant / RAF</td>
      </tr>
      <tr>
        <td>Suspicion de Faux Billet</td>
        <td>Zéro tolérance</td>
        <td>Refus immédiat du billet, rétention sous enveloppe scellée, signalement Direction</td>
        <td>Direction Générale</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-box" style="margin-top: 14px;">
    <div class="callout-title">Règle d'Immutabilité FCT :</div>
    Aucune clôture de caisse présentant un écart non justifié ne peut être validée dans le module Caisse de l'ERP. Le journal d'audit enregistre l'ensemble des tentatives de validation avec le code utilisateur et l'horodatage exact.
  </div>
</div>

<!-- ANNEXE TECHNIQUE : GRILLE D'INSPECTION TECHNIQUE DES 110 POINTS -->
<div class="page">
  <span class="section-tag">Annexe Maintenance & Qualité</span>
  <h2 class="page-title">Grille Exhaustive des 110 Points de Contrôle Flotte</h2>
  <p class="page-desc">Protocole d'inspection obligatoire réalisé à chaque retour de location et avant toute mise en vente sur le showroom FCT.</p>
  <div class="divider"></div>

  <div class="card-grid-3">
    <div class="fct-card">
      <div class="fct-card-title">1. Compartiment Moteur (25 Pts)</div>
      <p style="font-size: 8pt; color: #475569; margin: 0 0 6px;">Vérifications dynamiques à froid et à chaud :</p>
      <ul style="font-size: 7.5pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.5;">
        <li>Niveau & viscosité huile moteur 5W30/10W40</li>
        <li>Liquide de refroidissement organique (-25°C)</li>
        <li>Tension et usure courroies d'accessoire</li>
        <li>Tension batterie & test alternateur (14.2V)</li>
        <li>Étanchéité circuit turbo & durites d'admission</li>
        <li>Absence de fuite carter d'huile et boîte auto</li>
      </ul>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">2. Liaison au Sol & Freins (30 Pts)</div>
      <p style="font-size: 8pt; color: #475569; margin: 0 0 6px;">Composants critiques de sécurité :</p>
      <ul style="font-size: 7.5pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.5;">
        <li>Épaisseur plaquettes avant/arrière (> 4mm)</li>
        <li>Voile des disques et liquide de frein DOT4</li>
        <li>Pression des 4 pneus + roue de secours</li>
        <li>Profondeur sculpture pneumatiques (> 2.5mm)</li>
        <li>Rotules de direction, biellettes de suspension</li>
        <li>Amortisseurs avant/arrière & coupelles</li>
      </ul>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">3. Habitacle & Confort VIP (30 Pts)</div>
      <p style="font-size: 8pt; color: #475569; margin: 0 0 6px;">Standards d'accueil premium :</p>
      <ul style="font-size: 7.5pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.5;">
        <li>Efficacité climatisation bi-zone (< 18°C)</li>
        <li>Filtration habitacle anti-poussière tropicale</li>
        <li>Fonctionnement des 4 lève-vitres & toit ouvrant</li>
        <li>Système audio Bluetooth / Carplay / GPS</li>
        <li>Ceintures de sécurité & prétensionneurs</li>
        <li>Propreté sellerie cuir, ciel de toit & moquettes</li>
      </ul>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 18px 0 8px;">4. Éclairage, Carrosserie & Équipements Réglementaires (25 Pts)</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Catégorie de Contrôle</th>
        <th>Points Vérifiés</th>
        <th>Seuil de Tolérance</th>
        <th>Impact ERP en Cas d'Anomalie</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Éclairage & Signalisation</strong></td>
        <td>Phares LED/Xénon, antibrouillards, feux stop, clignotants et feux de détresse</td>
        <td>Zéro défaillance autorisée</td>
        <td>Véhicule consigné immédiatement en atelier</td>
      </tr>
      <tr>
        <td><strong>Carrosserie & Vitrages</strong></td>
        <td>Absence d'impact pare-brise champ de vision, alignement des boucliers, peinture</td>
        <td>Micro-rayures < 2cm tolérées</td>
        <td>Fiche d'anomalie avec photos Cloudinary</td>
      </tr>
      <tr>
        <td><strong>Sécurité Réglementaire</strong></td>
        <td>Extincteur ABC 1kg en cours de validité, 2 triangles réfléchissants, gilet haute visibilité, cric</td>
        <td>100% de conformité exigée</td>
        <td>Interdiction de sortie de parc automobile</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 14px; font-size: 8pt; color: #64748b; font-style: italic;">
    * L'historique complet de chaque inspection 110 points est stocké dans le Carnet de Santé Numérique du véhicule et reste consultable en scannant la plaque d'immatriculation.
  </div>
</div>

<!-- ANNEXE JURIDIQUE : BARÈME OFFICIEL DES FRANCHISES ET DÉGRADATIONS -->
<div class="page">
  <span class="section-tag">Annexe Juridique & Assurance</span>
  <h2 class="page-title">Barème Officiel des Dégradations & Franchises FCT</h2>
  <p class="page-desc">Grille forfaitaire opposable aux locataires en cas de sinistre, dommage constaté ou non-respect des engagements contractuels.</p>
  <div class="divider"></div>

  <table class="fct-table">
    <thead>
      <tr>
        <th>Type de Dégradation / Incident</th>
        <th>Description Technique</th>
        <th>Montant Facturé (FCFA TTC)</th>
        <th>Mode de Règlement</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Rayure Carrosserie Légère (< 10 cm)</strong></td>
        <td>Éraflure superficielle vernis sans déformation tôle</td>
        <td>25 000 FCFA</td>
        <td>Déduction sur caution</td>
      </tr>
      <tr>
        <td><strong>Rayure Profonde avec Peinture (> 10 cm)</strong></td>
        <td>Atteinte de la couche d'apprêt nécessitant reprise complète</td>
        <td>65 000 FCFA par élément</td>
        <td>Déduction sur caution</td>
      </tr>
      <tr>
        <td><strong>Enfoncement Tôle / Pare-chocs</strong></td>
        <td>Déformation tôlerie sans perforation, débosselage peinture</td>
        <td>90 000 à 150 000 FCFA</td>
        <td>Devis carrossier atelier</td>
      </tr>
      <tr>
        <td><strong>Impact Pare-brise Réparable</strong></td>
        <td>Éclat hors du champ de vision du conducteur (< 2 cm)</td>
        <td>35 000 FCFA (Résine UV)</td>
        <td>Déduction sur caution</td>
      </tr>
      <tr>
        <td><strong>Remplacement Pare-brise Fissuré</strong></td>
        <td>Fissure traversante ou éclat direct champ de vision</td>
        <td>220 000 à 450 000 FCFA selon modèle</td>
        <td>Franchise bris de glace</td>
      </tr>
      <tr>
        <td><strong>Déchirure ou Brûlure Sellerie</strong></td>
        <td>Brûlure de cigarette ou accroc tissu / cuir d'origine</td>
        <td>50 000 FCFA par siège</td>
        <td>Déduction immédiate</td>
      </tr>
      <tr>
        <td><strong>Perte de Clé Électronique / Smart Key</strong></td>
        <td>Télécommande de contact avec reprogrammation transpondeur</td>
        <td>150 000 à 250 000 FCFA</td>
        <td>Retenue sur garantie</td>
      </tr>
      <tr>
        <td><strong>Nettoyage Extrême Habitacle</strong></td>
        <td>Véhicule restitué boueux, sable abondant, odeurs fortes</td>
        <td>30 000 FCFA (Shampouinage complet)</td>
        <td>Forfait nettoyage</td>
      </tr>
      <tr>
        <td><strong>Carburant Manquant à la Restitution</strong></td>
        <td>Niveau inférieur au départ (par quart de réservoir manquant)</td>
        <td>15 000 FCFA par quart manquant</td>
        <td>Déduction caisse</td>
      </tr>
      <tr>
        <td><strong>Retard de Restitution > 2h Non Signalé</strong></td>
        <td>Dépassement horaire sans accord préalable de l'agence</td>
        <td>10 000 FCFA / heure de dépassement</td>
        <td>Facturation additionnelle</td>
      </tr>
    </tbody>
  </table>

  <div class="card-grid-2" style="margin-top: 14px;">
    <div class="fct-card">
      <div class="fct-card-title">Modalité de Restitution de la Caution</div>
      <p style="font-size: 8pt; color: #475569; margin: 0;">La caution de garantie (150 000 à 300 000 FCFA) est débloquée sous 48 heures ouvrées après validation conjointe de l'état des lieux de retour sans dommage par notre inspecteur.</p>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">Recours et Juridiction Compétente</div>
      <p style="font-size: 8pt; color: #475569; margin: 0;">En cas de contestation non résolue à l'amiable, compétence exclusive est attribuée aux tribunaux civils et commerciaux de Douala (Cameroun), sous le régime du droit OHADA.</p>
    </div>
  </div>
</div>

<!-- ANNEXE RH : CHARTE DE DÉONTOLOGIE DES CHAUFFEURS VIP -->
<div class="page">
  <span class="section-tag">Annexe Capital Humain</span>
  <h2 class="page-title">Charte Déontologique & Protocole Chauffeurs VIP</h2>
  <p class="page-desc">Normes d'excellence, de discrétion et de sécurité applicables au personnel navigant de la flotte FCT Automobile.</p>
  <div class="divider"></div>

  <div class="card-grid-3">
    <div class="fct-card">
      <div class="fct-card-title">1. Présentation & Posture</div>
      <ul style="font-size: 8pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.5;">
        <li>Costume sombre impeccable, chemise blanche et cravate FCT obligatoire.</li>
        <li>Badge d'identification professionnel visible en permanence.</li>
        <li>Hygiène corporelle irréprochable et parfum discret.</li>
        <li>Porte ouverte systématiquement pour les passagers.</li>
      </ul>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">2. Ponctualité & Préparation</div>
      <ul style="font-size: 8pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.5;">
        <li>Présence au point de prise en charge <strong>15 minutes avant l'heure</strong>.</li>
        <li>Véhicule lavé, aspiré et climatisé à 21°C avant l'embarquement.</li>
        <li>Bouteilles d'eau minérale capsulées et lingettes fraîches à bord.</li>
        <li>Itinéraire planifié sur l'application en évitant les axes saturés.</li>
      </ul>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">3. Discrétion & Sécurité</div>
      <ul style="font-size: 8pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.5;">
        <li>Secret professionnel absolu sur les conversations des clients.</li>
        <li>Usage du téléphone strictement interdit au volant (écouteur oreillette).</li>
        <li>Respect scrupuleux du code de la route et limitations urbaines.</li>
        <li>Zéro alcoolémie : tests de dépistage inopinés hebdomadaires.</li>
      </ul>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 20px 0 8px;">Matrice de Notation & Prime de Performance Chauffeur</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Niveau d'Évaluation</th>
        <th>Score Minimum</th>
        <th>Critères Déterminants</th>
        <th>Incitation Financière</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Grade VIP Diamant</strong></td>
        <td>Note ≥ 4.9 / 5</td>
        <td>Ponctualité 100%, éloges clients, zéro incident mécanique ou PV</td>
        <td>Prime mensuelle de 35 000 FCFA + Missions Présidence / Directoires</td>
      </tr>
      <tr>
        <td><strong>Grade Premium Or</strong></td>
        <td>Note ≥ 4.5 / 5</td>
        <td>Tenue conforme, respect des plannings, propreté irréprochable du véhicule</td>
        <td>Prime mensuelle de 20 000 FCFA</td>
      </tr>
      <tr>
        <td><strong>Standard Titane</strong></td>
        <td>Note ≥ 4.0 / 5</td>
        <td>Conduite conforme, zéro retard majeur non justifié</td>
        <td>Salaire contractuel de base</td>
      </tr>
      <tr>
        <td><strong>Mise à Pied / Recyclage</strong></td>
        <td>Note < 4.0 / 5</td>
        <td>Plainte client, retard > 15 min non signalé, incivilité</td>
        <td>Suspension immédiate du volant et formation de rappel obligatoire</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-box" style="margin-top: 16px;">
    <div class="callout-title">Engagement RSE & Sécurité FCT :</div>
    Chaque chauffeur FCT bénéficie d'une couverture d'assurance santé groupe, d'une formation biennale aux premiers secours civiques et d'un repos hebdomadaire garanti de 36 heures consécutives.
  </div>
</div>

<!-- ANNEXE TECHNIQUE : ARCHITECTURE HAUTE DISPONIBILITÉ & PRA -->
<div class="page">
  <span class="section-tag">Annexe Système & Haute Disponibilité</span>
  <h2 class="page-title">Architecture Résiliente & Plan de Continuité (PCA/PRA)</h2>
  <p class="page-desc">Garantie de continuité de service en cas de coupure réseau, d'incident électrique ou de panne d'infrastructure à Douala.</p>
  <div class="divider"></div>

  <div class="card-grid-2">
    <div class="fct-card">
      <div class="fct-card-title">1. Résilience Réseau & Mode Hors-Ligne</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Pour faire face aux coupures de fibre optique fréquentes en zone urbaine, l'ERP intègre une double couche de persistance :</p>
      <ul class="check-list" style="margin: 0;">
        <li><strong>Base Locale IndexedDB :</strong> Stockage intégral du catalogue de véhicules, des contrats actifs et du journal de caisse sur le navigateur.</li>
        <li><strong>File d'Attente de Synchronisation :</strong> Toute opération enregistrée hors-ligne est marquée en attente et rejouée dès reconnexion.</li>
        <li><strong>Résolution de Conflits Déterministe :</strong> Règle « Last-Write-Wins » avec horodatage cryptographique pour éviter les écrasements d'états.</li>
      </ul>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">2. Continuité Électrique de l'Agence Douala</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Dispositif matériel garantissant le fonctionnement continu de l'agence principale :</p>
      <ul class="check-list" style="margin: 0;">
        <li><strong>Groupe Électrogène Automatique :</strong> Démarrage sous 12 secondes lors des délestages Eneo (Puissance 25 kVA insonorisé).</li>
        <li><strong>Onduleurs On-Line Double Conversion :</strong> Protection des postes de caisse, imprimantes thermiques et serveurs locaux.</li>
        <li><strong>Liaison Internet Hybride :</strong> Connexion fibre principale doublée d'un routeur 4G/5G professionnel à bascule instantanée.</li>
      </ul>
    </div>
  </div>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 18px 0 8px;">3. Objectifs de Restauration Informatique (RTO & RPO)</h3>
  <table class="fct-table">
    <thead>
      <tr>
        <th>Scénario de Sinistre</th>
        <th>RPO (Perte de données max)</th>
        <th>RTO (Temps de rétablissement max)</th>
        <th>Procédure Opérationnelle</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Panne d'un poste de travail caisse</td>
        <td>0 seconde (Synchronisé Cloud)</td>
        <td>< 5 minutes</td>
        <td>Remplacement par poste de réserve préconfiguré</td>
      </tr>
      <tr>
        <td>Perte totale de liaison Internet</td>
        <td>0 seconde (Stocké localement)</td>
        <td>Immédiat (Mode offline actif)</td>
        <td>Basculement automatique sur liaison 4G de secours</td>
      </tr>
      <tr>
        <td>Défaillance Datacenter Cloud principal</td>
        <td>< 1 minute (Réplication)</td>
        <td>< 15 minutes</td>
        <td>Basculement automatique vers la région GCP secondaire</td>
      </tr>
      <tr>
        <td>Corruption accidentelle de base</td>
        <td>< 24 heures (Snapshots quotidiens)</td>
        <td>< 1 heure</td>
        <td>Restauration du snapshot journalier Firestore</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-box" style="margin-top: 14px;">
    <div class="callout-title">Audit Annuel de Sécurité :</div>
    Un exercice complet de simulation de panne générale (Blackout électrique et réseau simulé) est organisé semestriellement pour valider la réactivité des équipes et la conformité des protocoles de secours.
  </div>
</div>

<!-- ANNEXE DEPLOIEMENT : MATRICE DES VARIABLES ET DEPLOIEMENT CI/CD -->
<div class="page">
  <span class="section-tag">Annexe Ingénierie & DevOps</span>
  <h2 class="page-title">Matrice de Configuration & Déploiement Continu</h2>
  <p class="page-desc">Spécifications des environnements d'exécution, variables secrètes et chaîne d'intégration continue FCT.</p>
  <div class="divider"></div>

  <table class="fct-table">
    <thead>
      <tr>
        <th>Variable d'Environnement</th>
        <th>Rôle & Composant Cible</th>
        <th>Environnement Requis</th>
        <th>Niveau de Confidentialité</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>VITE_FIREBASE_API_KEY</code></td>
        <td>Authentification des requêtes client Firebase</td>
        <td>Développement / Production</td>
        <td>Public (Restreint par domaine d'origine)</td>
      </tr>
      <tr>
        <td><code>VITE_FIREBASE_PROJECT_ID</code></td>
        <td>Identifiant unique de l'instance Firestore Cloud</td>
        <td>Développement / Production</td>
        <td>Public (Protégé par Security Rules)</td>
      </tr>
      <tr>
        <td><code>VITE_CLOUDINARY_CLOUD_NAME</code></td>
        <td>Espace de stockage multimédia Cloudinary</td>
        <td>Production</td>
        <td>Public (Upload non signé sécurisé)</td>
      </tr>
      <tr>
        <td><code>VITE_CLOUDINARY_UPLOAD_PRESET</code></td>
        <td>Preset d'ingestion des photos d'inspection et permis</td>
        <td>Production</td>
        <td>Restreint (Format d'image forcé WebP/PNG)</td>
      </tr>
      <tr>
        <td><code>PORT</code></td>
        <td>Port d'écoute local du serveur Vite/Preview</td>
        <td>Serveur Interne (3000 / 3001)</td>
        <td>Interne au réseau local</td>
      </tr>
    </tbody>
  </table>

  <h3 style="font-size: 11pt; font-weight: 800; color: #1e3a8a; margin: 18px 0 8px;">Pipeline d'Intégration Continue (CI/CD Quality Gate)</h3>
  <div class="card-grid-3">
    <div class="fct-card">
      <div class="fct-card-title">Étape 1 : Audit Statique</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Compilation TypeScript stricte (<code>npx tsc --noEmit</code>). Aucune tolérance d'erreur de typage ou de cast implicite sur l'ensemble du dépôt.</p>
    </div>
    <div class="fct-card highlight">
      <div class="fct-card-title">Étape 2 : Tests Vitest</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Exécution automatisée de la suite de 107 tests unitaires et d'intégration validant les calculs de TVA, de billets et les droits RBAC.</p>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">Étape 3 : Build & Bundle</div>
      <p style="font-size: 8pt; color: #334155; margin: 0;">Génération du bundle optimisé avec tree-shaking, minification CSS et vérification des tailles de chunks pour un chargement < 1.5s.</p>
    </div>
  </div>

  <div class="callout-box" style="margin-top: 14px;">
    <div class="callout-title">Règle de Production Zéro Régression :</div>
    Tout commit ou fusion de branche qui dégrade le taux de réussite des tests (107/107) ou qui introduit un avertissement de sécurité est immédiatement rejeté par la passerelle de validation.
  </div>
</div>

<!-- ANNEXE LEXIQUE : GLOSSAIRE AUTOMOBILE & COMPTABLE CEMAC -->
<div class="page">
  <span class="section-tag">Annexe Terminologique</span>
  <h2 class="page-title">Glossaire Métier Automobile & Comptable CEMAC</h2>
  <p class="page-desc">Définitions standardisées des termes techniques, contractuels et financiers utilisés dans l'ERP FCT Automobile.</p>
  <div class="divider"></div>

  <table class="fct-table">
    <thead>
      <tr>
        <th>Terme / Acronyme</th>
        <th>Définition Métier Précise</th>
        <th>Module ERP Associé</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Billetage BEAC</strong></td>
        <td>Opération de comptage physique et contradictoire des espèces par valeur faciale de coupures (10k, 5k, 2k, 1k, 500 FCFA) pour valider l'exactitude de la caisse.</td>
        <td>Caisse & Trésorerie</td>
      </tr>
      <tr>
        <td><strong>Carte Grise (Certificat d'Immatriculation)</strong></td>
        <td>Document officiel d'identification délivré par le Ministère des Transports du Cameroun attestant de la propriété et des caractéristiques du véhicule.</td>
        <td>Flotte de Véhicules & GED</td>
      </tr>
      <tr>
        <td><strong>Carnet de Santé Numérique</strong></td>
        <td>Dossier médical dématérialisé du véhicule traçant chaque vidange, changement de pièce et contrôle technique de manière infalsifiable.</td>
        <td>Atelier & Portail Web</td>
      </tr>
      <tr>
        <td><strong>Caution / Dépôt de Garantie</strong></td>
        <td>Somme consignée par le client locataire à la prise en charge pour couvrir d'éventuelles dégradations, franchise d'assurance ou carburant manquant.</td>
        <td>Contrats & Facturation</td>
      </tr>
      <tr>
        <td><strong>Dégagement de Caisse (Décaissement)</strong></td>
        <td>Sortie d'espèces dûment autorisée par le Gérant pour payer une charge d'exploitation immédiate (carburant, lavage, fournitures de bureau).</td>
        <td>Caisse & Trésorerie</td>
      </tr>
      <tr>
        <td><strong>État des Lieux (EDL)</strong></td>
        <td>Fiche contradictoire contradictoirement signée au départ et au retour répertoriant le kilométrage, le niveau de carburant et les impacts carrosserie.</td>
        <td>Locations & Réservations</td>
      </tr>
      <tr>
        <td><strong>Ordre de Réparation (OR)</strong></td>
        <td>Mandat d'intervention émis par le Responsable Flotte autorisant les mécaniciens à effectuer des travaux précis avec réquisition de pièces en stock.</td>
        <td>Maintenance & Pièces</td>
      </tr>
      <tr>
        <td><strong>RBAC (Role-Based Access Control)</strong></td>
        <td>Modèle de sécurité informatique attribuant des droits granulaires (lecture, écriture, validation financière) selon la fonction de l'employé.</td>
        <td>Utilisateurs & Audit</td>
      </tr>
      <tr>
        <td><strong>TVA & CAC Cameroun</strong></td>
        <td>Taxe sur la Valeur Ajoutée au taux normal de 17.5% majorée des Centimes Additionnels Communaux de 10%, soit un taux effectif global de 19.25%.</td>
        <td>Facturation & Comptabilité</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 16px; font-size: 8pt; color: #64748b; font-style: italic;">
    * Ce lexique est opposable dans le cadre de l'interprétation des clauses contractuelles et des rapports d'audit comptable de FCT Automobile.
  </div>
</div>

<!-- ANNEXE RÉPERTOIRE : COORDONNÉES ET CONTACTS INSTITUTIONNELS -->
<div class="page">
  <span class="section-tag">Annexe Institutionnelle & Réseau</span>
  <h2 class="page-title">Répertoire des Agences, Bases Logistiques & Contacts FCT</h2>
  <p class="page-desc">Points d'accueil officiels, ateliers de maintenance et astreintes d'urgence de FCT Automobile à Douala.</p>
  <div class="divider"></div>

  <div class="card-grid-2">
    <div class="fct-card highlight">
      <div class="fct-card-title">Siège Social & Showroom Principal</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Accueil VIP, direction commerciale, showroom de vente et comptoir de location :</p>
      <ul style="font-size: 8pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.6;">
        <li><strong>Adresse :</strong> Boulevard de la République, Face Direction Régionale Eneo, Bonamoussadi, Douala.</li>
        <li><strong>Téléphone Standard :</strong> +237 699 45 88 12 / +237 677 32 19 04</li>
        <li><strong>Courriel Commercial :</strong> contact@fct-automobile.cm / commercial@fct-automobile.cm</li>
        <li><strong>Horaires :</strong> Lundi au Samedi : 07h30 - 19h00 · Dimanche : Permanence sur RDV</li>
      </ul>
    </div>
    <div class="fct-card blue">
      <div class="fct-card-title">Base Logistique & Atelier Central</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Centre de révision technique, carrosserie, préparation esthétique et stockage de pièces :</p>
      <ul style="font-size: 8pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.6;">
        <li><strong>Adresse :</strong> Carrefour Santa Barbara, Zone Technique Logistique, Douala.</li>
        <li><strong>Chef d'Atelier :</strong> +237 695 11 24 80</li>
        <li><strong>Courriel Technique :</strong> maintenance@fct-automobile.cm</li>
        <li><strong>Horaires :</strong> Lundi au Samedi : 07h00 - 18h00 · Astreinte dépannage 24h/24</li>
      </ul>
    </div>
  </div>

  <div class="card-grid-2" style="margin-top: 14px;">
    <div class="fct-card">
      <div class="fct-card-title">Comptoir Aéroport International de Douala</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Accueil personnalisé des délégations d'affaires et expatriés dès leur atterrissage :</p>
      <ul style="font-size: 8pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.6;">
        <li><strong>Localisation :</strong> Hall Arrivées Internationales — Comptoir N° 4</li>
        <li><strong>Coordination Chauffeurs VIP :</strong> +237 699 45 88 15</li>
        <li><strong>Service Meet & Greet :</strong> Prise en charge des bagages et escorte véhicule</li>
      </ul>
    </div>
    <div class="fct-card">
      <div class="fct-card-title">Canaux Numériques Officiels</div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">Réservation en ligne, suivi de dossier et carnet de santé :</p>
      <ul style="font-size: 8pt; color: #334155; padding-left: 14px; margin: 0; line-height: 1.6;">
        <li><strong>Portail Web Public :</strong> https://fct-automobile.cm (ou http://localhost:3001)</li>
        <li><strong>Espace Client Sécurisé :</strong> https://fct-automobile.cm/mon-espace</li>
        <li><strong>Portail ERP Collaborateur :</strong> http://localhost:3000</li>
      </ul>
    </div>
  </div>
</div>

<div class="page">
  <span class="section-tag">Approbation Institutionnelle</span>
  <h2 class="page-title">Registre d'Approbation & Signatures Officielles</h2>
  <p class="page-desc">Validation formelle du présent manuel par la Direction Générale et les responsables opérationnels de FCT Automobile.</p>
  <div class="divider"></div>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
    <p style="font-size: 9pt; color: #1e293b; line-height: 1.6; margin: 0;">
      Le présent document, d'une pagination officielle de 110 pages, certifie l'état d'achèvement technique et la conformité fonctionnelle complète de l'application ERP & CRM Automobile et du portail public de <strong>Franchise Conseils Trading (FCT Douala)</strong>. Il est déclaré document de référence pour l'exercice 2026.
    </p>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
    <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center;">
      <span style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 800; display: block; margin-bottom: 4px;">Pour la Direction Générale FCT</span>
      <strong style="font-size: 11pt; color: #1e3a8a; display: block;">Claus Ephwandji</strong>
      <span style="font-size: 8pt; color: #64748b; display: block; margin-bottom: 25px;">Directeur Général Associé</span>
      <div style="height: 50px; border-bottom: 1px dashed #94a3b8; margin: 0 30px 10px;"></div>
      <span style="font-size: 7.5pt; color: #94a3b8; font-style: italic;">Date et Cachet de la Direction</span>
    </div>

    <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center;">
      <span style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 800; display: block; margin-bottom: 4px;">Pour la Direction Technique & Ingénierie</span>
      <strong style="font-size: 11pt; color: #1e3a8a; display: block;">Supervision Ingénierie ECC</strong>
      <span style="font-size: 8pt; color: #64748b; display: block; margin-bottom: 25px;">Audit et Sécurité Applicative FCT</span>
      <div style="height: 50px; border-bottom: 1px dashed #94a3b8; margin: 0 30px 10px;"></div>
      <span style="font-size: 7.5pt; color: #94a3b8; font-style: italic;">Visa de Conformité 100% Qualité</span>
    </div>
  </div>

  <div style="text-align: center; margin-top: 40px; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    Franchise Conseils Trading (FCT) · SARL au capital de 10 000 000 FCFA · Douala, Cameroun · Tous droits réservés 2026
  </div>
</div>
`;

html += `
</body>
</html>
`;

// Écriture du fichier HTML
fs.writeFileSync(HTML_OUTPUT, html, 'utf-8');
console.log(`✅ Fichier HTML généré avec succès : ${HTML_OUTPUT} (${(html.length / 1024).toFixed(1)} Ko)`);

// Compilation en PDF via Microsoft Edge Headless avec options de pagination A4 strictes
// Arguments Edge Headless
const args = [
  '--headless',
  '--user-data-dir=C:\\Users\\Claus\\AppData\\Local\\Temp\\edge_pdf_doc',
  '--no-pdf-header-footer',
  `--print-to-pdf=${PDF_OUTPUT}`,
  HTML_OUTPUT
];

try {
  const result = spawnSync(EDGE_PATH, args, { stdio: 'inherit', timeout: 120000 });
  if (fs.existsSync(PDF_OUTPUT)) {
    const stats = fs.statSync(PDF_OUTPUT);
    console.log(`🎉 DOCUMENT PDF OFFICIEL GÉNÉRÉ AVEC SUCCÈS !`);
    console.log(`📁 Emplacement : ${PDF_OUTPUT}`);
    console.log(`📊 Taille du fichier : ${(stats.size / (1024 * 1024)).toFixed(2)} Mo`);
  } else {
    console.error('❌ Le fichier PDF n’a pas été créé. Statut spawn:', result.status);
  }
} catch (err) {
  console.error('❌ Erreur lors de la compilation PDF :', err.message);
}
