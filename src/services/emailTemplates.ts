/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Modèles d'Emails HTML Professionnels & Stylisés
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 * 
 * Thème Corporate : #0F2A4A (Bleu Nuit FCT), #047857 (Vert Émeraude), #E2E8F0 (Bordures), #F8FAFC (Fond épuré)
 */

export const FCT_OFFICIAL_URL = 'https://fct-automobile.cm';
export const FCT_PHONE_PRIMARY = '+237 699 45 88 12';
export const FCT_PHONE_SECONDARY = '+237 677 32 19 04';
export const FCT_EMAIL_OFFICIAL = 'contact@fct-automobile.cm';
export const FCT_AGENCY_ADDRESS = 'Carrefour Santa Barbara, Bonamoussadi, Douala - Cameroun';

export interface EmailLayoutOptions {
  title: string;
  preheader?: string;
  headerBadge?: string;
  contentHtml: string;
  callToAction?: {
    text: string;
    url: string;
  } | null;
  lang?: 'fr' | 'en';
}

/**
 * Wrapper HTML5 universel responsive compatible tous clients de messagerie
 * (Gmail Android/iOS/Web, Outlook, Apple Mail, Yahoo)
 */
export function wrapFctEmailLayout({
  title,
  preheader,
  headerBadge = 'Franchise Conseils Trading · Douala Automobile',
  contentHtml,
  callToAction = null,
  lang = 'fr',
}: EmailLayoutOptions): string {
  const isEn = lang === 'en';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .email-container {
      max-width: 600px;
      margin: 24px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 42, 74, 0.1), 0 8px 10px -6px rgba(15, 42, 74, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f2a4a 0%, #1e3a8a 60%, #047857 100%);
      padding: 36px 28px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      background-color: rgba(255, 255, 255, 0.15);
      color: #a7f3d0;
      border: 1px solid rgba(167, 243, 208, 0.3);
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 12px;
      color: #cbd5e1;
      font-weight: 500;
    }
    .body {
      padding: 32px 28px;
      line-height: 1.65;
      font-size: 14px;
      color: #334155;
    }
    .card-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 22px 0;
    }
    .highlight-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      font-family: monospace;
      background-color: #0f2a4a;
      color: #ffffff;
    }
    .table-data {
      width: 100%;
      margin-top: 12px;
    }
    .table-data td {
      padding: 9px 0;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .table-data td.label {
      color: #64748b;
      font-weight: 500;
    }
    .table-data td.value {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
    }
    .table-data td.amount {
      text-align: right;
      font-weight: 900;
      color: #047857;
      font-size: 14px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #0f2a4a 0%, #1e3a8a 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 13px;
      text-align: center;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 12px rgba(15, 42, 74, 0.25);
    }
    .alert-notice {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 20px 0;
      font-size: 12px;
      color: #1e40af;
    }
    .footer {
      background-color: #0f2a4a;
      color: #94a3b8;
      padding: 28px 24px;
      text-align: center;
      font-size: 11px;
      border-top: 1px solid #1e3a8a;
    }
    .footer strong {
      color: #ffffff;
    }
    .footer a {
      color: #38bdf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>

  <div class="email-container">
    <!-- Header FCT -->
    <div class="header">
      <div class="logo-badge">${headerBadge}</div>
      <h1>FCT AUTOMOBILE DOUALA</h1>
      <p>Franchise Conseils Trading · Concession & Location VIP · Bonamoussadi</p>
    </div>

    <!-- Body -->
    <div class="body">
      ${contentHtml}

      ${callToAction ? `
      <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
        <a href="${callToAction.url}" target="_blank" rel="noopener noreferrer" class="btn">
          ${callToAction.text}
        </a>
      </div>` : ''}
    </div>

    <!-- Footer FCT -->
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Franchise Conseils Trading (FCT) SARL</strong></p>
      <p style="margin: 0 0 6px 0;">${FCT_AGENCY_ADDRESS}</p>
      <p style="margin: 0 0 6px 0;">
        ${isEn ? 'Direct Hotline' : 'Assistance & Réservations'} : <strong>${FCT_PHONE_PRIMARY}</strong> / ${FCT_PHONE_SECONDARY}
      </p>
      <p style="margin: 0 0 10px 0;">
        Email : <a href="mailto:${FCT_EMAIL_OFFICIAL}">${FCT_EMAIL_OFFICIAL}</a> · Web : <a href="${FCT_OFFICIAL_URL}">${FCT_OFFICIAL_URL}</a>
      </p>
      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 10px; color: #64748b;">
        RC/DLA/2022/B/4581 · NIU : M052217894210L · Conformité Fiscale Régime Réel TVA 19.25% CEMAC
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Modèle Confirmation de Réservation (HTML Stylisé)
 */
export function buildReservationConfirmationEmail(params: {
  customerName: string;
  reservationNumber: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  advanceAmountXAF: string | number;
  totalDays?: number;
  lang?: 'fr' | 'en';
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';
  const advance = typeof params.advanceAmountXAF === 'number' 
    ? `${params.advanceAmountXAF.toLocaleString()} FCFA` 
    : `${params.advanceAmountXAF} FCFA`;

  const subject = isEn
    ? `FCT Automobile Douala - Booking Confirmation #${params.reservationNumber}`
    : `FCT Automobile Douala - Confirmation de votre réservation ${params.reservationNumber}`;

  const contentHtml = `
    <p style="margin-top:0; font-size: 15px;">
      ${isEn ? 'Dear' : 'Cher(e)'} <strong>${params.customerName}</strong>,
    </p>
    <p>
      ${isEn 
        ? 'We are pleased to confirm your vehicle booking with Franchise Conseils Trading Douala. Your vehicle is held and prepared according to the details below:'
        : 'Nous avons le plaisir de vous confirmer la prise en compte de votre réservation auprès de Franchise Conseils Trading Douala. Votre véhicule est réservé selon les détails ci-après :'
      }
    </p>

    <div class="card-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">
          ${isEn ? 'Booking Reference' : 'Dossier de Réservation'}
        </span>
        <span class="highlight-badge">${params.reservationNumber}</span>
      </div>

      <table class="table-data">
        <tr>
          <td class="label">${isEn ? 'Reserved Vehicle' : 'Véhicule Réservé'}</td>
          <td class="value">${params.vehicleName}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Rental Period' : 'Période Prévue'}</td>
          <td class="value">${params.startDate} ${isEn ? 'to' : 'au'} ${params.endDate}</td>
        </tr>
        ${params.totalDays ? `
        <tr>
          <td class="label">${isEn ? 'Duration' : 'Durée estimée'}</td>
          <td class="value">${params.totalDays} ${isEn ? 'day(s)' : 'jour(s)'}</td>
        </tr>` : ''}
        <tr>
          <td class="label">${isEn ? 'Recorded Deposit' : 'Acompte Consigné'}</td>
          <td class="amount">${advance}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Pickup Agency' : 'Agence de Retrait'}</td>
          <td class="value">${FCT_AGENCY_ADDRESS}</td>
        </tr>
      </table>
    </div>

    <div class="alert-notice">
      <strong>${isEn ? 'Important Requirements' : 'Consignes de Retrait'} :</strong><br/>
      ${isEn 
        ? 'Please bring your valid national identity card or original passport, alongside your valid driving license when picking up the vehicle at our Bonamoussadi agency.'
        : 'Veuillez vous munir de votre pièce d\'identité originale (CNI ou passeport) ainsi que de votre permis de conduire valide lors du retrait du véhicule en agence.'}
    </div>

    <p style="margin-bottom:0; font-size: 13px; color: #475569;">
      ${isEn
        ? 'For any assistance or questions, our team is available 24/7 at +237 699 45 88 12.'
        : 'Pour toute modification ou renseignement complémentaire, notre équipe d\'astreinte reste à votre disposition au +237 699 45 88 12.'}
    </p>
  `;

  const html = wrapFctEmailLayout({
    title: subject,
    preheader: `${isEn ? 'Booking Confirmation' : 'Confirmation de Réservation'} : ${params.vehicleName} (${params.reservationNumber})`,
    headerBadge: isEn ? 'Official Booking Confirmation' : 'Confirmation Officielle de Réservation',
    contentHtml,
    callToAction: {
      text: isEn ? 'View My Booking on Client Portal' : 'Accéder à mon Espace Client',
      url: `${FCT_OFFICIAL_URL}/portal`,
    },
    lang: params.lang,
  });

  const text = `${subject}\n\n${isEn ? 'Dear' : 'Cher(e)'} ${params.customerName},\n\n`
    + `${isEn ? 'Vehicle' : 'Véhicule'} : ${params.vehicleName}\n`
    + `${isEn ? 'Period' : 'Période'} : ${params.startDate} -> ${params.endDate}\n`
    + `${isEn ? 'Deposit' : 'Acompte'} : ${advance}\n`
    + `${isEn ? 'Agency' : 'Agence'} : ${FCT_AGENCY_ADDRESS}\n\n`
    + `FCT Automobile Douala - ${FCT_PHONE_PRIMARY}`;

  return { subject, html, text };
}

/**
 * 2. Modèle Rappel d'Échéance de Restitution de Location
 */
export function buildReturnReminderEmail(params: {
  customerName: string;
  contractNumber: string;
  vehicleName: string;
  endDate: string;
  depositAmountXAF: string | number;
  lang?: 'fr' | 'en';
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';
  const deposit = typeof params.depositAmountXAF === 'number'
    ? `${params.depositAmountXAF.toLocaleString()} FCFA`
    : `${params.depositAmountXAF} FCFA`;

  const subject = isEn
    ? `FCT Automobile - Reminder: Vehicle return scheduled on ${params.endDate}`
    : `FCT Automobile - Rappel : Restitution de votre véhicule prévue le ${params.endDate}`;

  const contentHtml = `
    <p style="margin-top:0;">
      ${isEn ? 'Hello' : 'Bonjour'} <strong>${params.customerName}</strong>,
    </p>
    <p>
      ${isEn
        ? `This reminder informs you that rental agreement <strong>${params.contractNumber}</strong> for vehicle <strong>${params.vehicleName}</strong> expires on <strong>${params.endDate} at 17:00</strong>.`
        : `Ce message vous rappelle que votre contrat de location <strong>${params.contractNumber}</strong> pour le véhicule <strong>${params.vehicleName}</strong> arrive à échéance le <strong>${params.endDate} à 17h00</strong>.`}
    </p>

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">${isEn ? 'Contract Number' : 'Contrat N°'}</td>
          <td class="value"><span class="highlight-badge">${params.contractNumber}</span></td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Vehicle' : 'Véhicule'}</td>
          <td class="value">${params.vehicleName}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Return Date & Time' : 'Date & Heure Limite'}</td>
          <td class="value">${params.endDate} (17h00)</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Return Agency' : 'Lieu de Restitution'}</td>
          <td class="value">${FCT_AGENCY_ADDRESS}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Security Deposit under Escrow' : 'Caution sous Séquestre'}</td>
          <td class="amount">${deposit}</td>
        </tr>
      </table>
    </div>

    <div class="alert-notice">
      <strong>${isEn ? 'Check-in Notice' : 'Modalités de Restitution'} :</strong><br/>
      ${isEn
        ? 'Please return the vehicle with a full fuel tank and clean interior/exterior to allow instant release of your security deposit.'
        : 'Merci de veiller à ce que le véhicule soit restitué avec le niveau de carburant initial et dans un état propre afin de permettre la restitution immédiate de votre caution.'}
    </div>

    <p style="font-size: 13px;">
      ${isEn
        ? 'If you wish to extend your rental agreement, please notify our team before expiry at +237 699 45 88 12.'
        : 'Si vous souhaitez prolonger votre contrat de mission, veuillez contacter immédiatement notre service commercial au +237 699 45 88 12.'}
    </p>
  `;

  const html = wrapFctEmailLayout({
    title: subject,
    preheader: `${isEn ? 'Return reminder' : 'Rappel restitution'} : ${params.vehicleName} (${params.endDate})`,
    headerBadge: isEn ? 'Rental Expiry Notification' : 'Échéance de Location FCT',
    contentHtml,
    callToAction: {
      text: isEn ? 'Contact Rental Agency' : 'Contacter l\'Agence FCT',
      url: `tel:${FCT_PHONE_PRIMARY.replace(/\s/g, '')}`,
    },
    lang: params.lang,
  });

  const text = `${subject}\n\n${params.customerName}, rappel échéance contrat ${params.contractNumber} (${params.vehicleName}) le ${params.endDate}.\nFCT Douala: ${FCT_PHONE_PRIMARY}`;
  return { subject, html, text };
}

/**
 * 3. Modèle Reçu Numérique de Paiement en Caisse
 */
export function buildCashReceiptEmail(params: {
  customerName: string;
  receiptNumber: string;
  amountXAF: string | number;
  date: string;
  categoryLabel: string;
  cashierName: string;
  lang?: 'fr' | 'en';
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';
  const amountFormatted = typeof params.amountXAF === 'number'
    ? `${params.amountXAF.toLocaleString()} FCFA`
    : `${params.amountXAF} FCFA`;

  const subject = isEn
    ? `FCT Automobile - Cash Payment Receipt #${params.receiptNumber}`
    : `FCT Automobile - Reçu de paiement en espèces n° ${params.receiptNumber}`;

  const contentHtml = `
    <p style="margin-top:0;">
      ${isEn ? 'Hello' : 'Bonjour'} <strong>${params.customerName}</strong>,
    </p>
    <p>
      ${isEn
        ? `We acknowledge the proper receipt at our certified cash desk of the amount of <strong>${amountFormatted}</strong> in cash on ${params.date}.`
        : `Nous vous confirmons la bonne réception en caisse certifiée de la somme de <strong>${amountFormatted}</strong> en espèces le ${params.date}.`}
    </p>

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">${isEn ? 'Receipt Number' : 'Reçu de Caisse N°'}</td>
          <td class="value"><span class="highlight-badge">${params.receiptNumber}</span></td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Transaction Purpose' : 'Motif d\'Encaissement'}</td>
          <td class="value">${params.categoryLabel}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Payment Date' : 'Date de Règlement'}</td>
          <td class="value">${params.date}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Certified Cashier' : 'Caissier Enregistreur'}</td>
          <td class="value">${params.cashierName}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Amount Received' : 'Montant Encaissé'}</td>
          <td class="amount">${amountFormatted}</td>
        </tr>
      </table>
    </div>

    <div class="alert-notice">
      <strong>${isEn ? 'Legal Notice' : 'Valeur Justificative'} :</strong><br/>
      ${isEn
        ? 'This digital confirmation serves as official proof of payment for Franchise Conseils Trading Douala.'
        : 'Ce reçu numérique tient lieu de justificatif de paiement certifié auprès de Franchise Conseils Trading Douala.'}
    </div>
  `;

  const html = wrapFctEmailLayout({
    title: subject,
    preheader: `Reçu de caisse ${params.receiptNumber} : ${amountFormatted}`,
    headerBadge: isEn ? 'Certified Cash Voucher' : 'Reçu de Caisse Certifié BEAC',
    contentHtml,
    callToAction: {
      text: isEn ? 'Access My Invoices' : 'Consulter mes Factures & Quittances',
      url: `${FCT_OFFICIAL_URL}/portal`,
    },
    lang: params.lang,
  });

  const text = `${subject}\n\nReçu ${params.receiptNumber} : ${amountFormatted} (${params.categoryLabel}) reçu par ${params.cashierName} le ${params.date}.\nFCT Douala.`;
  return { subject, html, text };
}

/**
 * 4. Modèle Alerte Commerciale Interne (Lead / Devis Web)
 */
export function buildContactLeadEmail(params: {
  prospectName: string;
  prospectPhone: string;
  requestedModel: string;
  dates: string;
  notes?: string;
  lang?: 'fr' | 'en';
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';

  const subject = isEn
    ? `FCT ERP - New web inquiry from ${params.prospectName}`
    : `FCT ERP - Nouvelle demande de contact web : ${params.prospectName}`;

  const contentHtml = `
    <p style="margin-top:0;">
      <strong>${isEn ? 'Commercial Alert' : 'Alerte Commerciale Agence'} :</strong>
    </p>
    <p>
      ${isEn
        ? 'A new prospect has submitted an inquiry on the FCT Automobile showroom portal:'
        : 'Un nouveau prospect a formulé une demande de réservation ou d\'information sur le showroom FCT :'}
    </p>

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">${isEn ? 'Client Name' : 'Nom du Prospect'}</td>
          <td class="value">${params.prospectName}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Telephone' : 'Téléphone'}</td>
          <td class="value"><strong>${params.prospectPhone}</strong></td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Requested Vehicle' : 'Modèle Sollicité'}</td>
          <td class="value">${params.requestedModel}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Desired Dates' : 'Dates Souhaitées'}</td>
          <td class="value">${params.dates}</td>
        </tr>
        ${params.notes ? `
        <tr>
          <td class="label">${isEn ? 'Client Notes' : 'Remarques'}</td>
          <td class="value">${params.notes}</td>
        </tr>` : ''}
      </table>
    </div>

    <div class="alert-notice">
      ${isEn
        ? 'Action required: Please contact the client within a maximum of 2 hours to confirm vehicle availability.'
        : 'Action requise : Merci de prendre contact avec le prospect dans un délai de 2 heures maximum pour confirmer la disponibilité.'}
    </div>
  `;

  const html = wrapFctEmailLayout({
    title: subject,
    preheader: `Nouveau lead : ${params.prospectName} (${params.requestedModel})`,
    headerBadge: isEn ? 'Internal Commercial Alert' : 'Alerte Commerciale Interne FCT',
    contentHtml,
    callToAction: {
      text: isEn ? 'Call Client Now' : 'Appeler le Client Immédiatement',
      url: `tel:${params.prospectPhone.replace(/\s/g, '')}`,
    },
    lang: params.lang,
  });

  const text = `${subject}\n\nLead : ${params.prospectName} (${params.prospectPhone})\nModèle : ${params.requestedModel}\nDates : ${params.dates}`;
  return { subject, html, text };
}

/**
 * 5. Modèle Contrat de Location Officiel & Remise des Clés
 */
export function buildContractActiveEmail(params: {
  customerName: string;
  contractNumber: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  driverName?: string;
  lang?: 'fr' | 'en';
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';

  const subject = isEn
    ? `FCT Automobile - Rental Agreement Activated #${params.contractNumber}`
    : `FCT Automobile - Votre contrat de location ${params.contractNumber} est actif`;

  const contentHtml = `
    <p style="margin-top:0;">
      ${isEn ? 'Dear' : 'Cher(e)'} <strong>${params.customerName}</strong>,
    </p>
    <p>
      ${isEn
        ? `We are pleased to confirm that rental agreement <strong>${params.contractNumber}</strong> is now officially active. Your vehicle <strong>${params.vehicleName}</strong> has been handed over in certified condition.`
        : `Nous avons le plaisir de vous confirmer que votre contrat de location <strong>${params.contractNumber}</strong> est désormais actif. Votre véhicule <strong>${params.vehicleName}</strong> a été mis à votre disposition après inspection de départ.`}
    </p>

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">${isEn ? 'Contract Reference' : 'Numéro de Contrat'}</td>
          <td class="value"><span class="highlight-badge">${params.contractNumber}</span></td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Assigned Vehicle' : 'Véhicule Assigné'}</td>
          <td class="value">${params.vehicleName}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Mission Period' : 'Période de Location'}</td>
          <td class="value">${params.startDate} ${isEn ? 'to' : 'au'} ${params.endDate}</td>
        </tr>
        ${params.driverName ? `
        <tr>
          <td class="label">${isEn ? 'VIP Assigned Driver' : 'Chauffeur Professionnel FCT'}</td>
          <td class="value"><strong>${params.driverName}</strong></td>
        </tr>` : ''}
        <tr>
          <td class="label">${isEn ? '24/7 Roadside Assistance' : 'Assistance Dépannage 24/7'}</td>
          <td class="value"><strong>${FCT_PHONE_PRIMARY}</strong></td>
        </tr>
      </table>
    </div>

    <div class="alert-notice">
      <strong>${isEn ? 'Important Guidelines' : 'Consignes de Sécurité'} :</strong><br/>
      ${isEn
        ? 'Please keep your copy of the rental agreement and vehicle registration in the glove box throughout the mission.'
        : 'Veuillez conserver l\'exemplaire du contrat et le dossier de bord du véhicule dans la boîte à gants durant toute la mission.'}
    </div>
  `;

  const html = wrapFctEmailLayout({
    title: subject,
    preheader: `Contrat actif : ${params.vehicleName} (${params.contractNumber})`,
    headerBadge: isEn ? 'Rental Agreement Live' : 'Contrat de Mission Actif',
    contentHtml,
    callToAction: {
      text: isEn ? 'View Digital Health Record' : 'Consulter le Carnet de Santé Véhicule',
      url: `${FCT_OFFICIAL_URL}/health`,
    },
    lang: params.lang,
  });

  const text = `${subject}\n\nContrat ${params.contractNumber} actif pour ${params.vehicleName}.\nFCT Douala: ${FCT_PHONE_PRIMARY}`;
  return { subject, html, text };
}

/**
 * 6. Modèle Alerte Révision & Entretien Atelier Flotte
 */
export function buildMaintenanceAlertEmail(params: {
  vehicleName: string;
  licensePlate: string;
  maintenanceType: string;
  dueDate: string;
  currentKm: number | string;
  lang?: 'fr' | 'en';
}): { subject: string; html: string; text: string } {
  const isEn = params.lang === 'en';

  const subject = isEn
    ? `FCT Workshop Alert - Maintenance Due for ${params.licensePlate}`
    : `FCT Atelier - Échéance d'entretien pour le véhicule ${params.licensePlate}`;

  const contentHtml = `
    <p style="margin-top:0;">
      <strong>${isEn ? 'Technical Service Notification' : 'Alerte Technique Atelier Central FCT'} :</strong>
    </p>
    <p>
      ${isEn
        ? `A scheduled maintenance intervention is required for vehicle <strong>${params.vehicleName}</strong> (${params.licensePlate}):`
        : `Une intervention d'entretien périodique est requise pour le véhicule <strong>${params.vehicleName}</strong> (${params.licensePlate}) :`}
    </p>

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">${isEn ? 'Vehicle' : 'Véhicule'}</td>
          <td class="value">${params.vehicleName}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Registration' : 'Immatriculation CEMAC'}</td>
          <td class="value"><span class="highlight-badge">${params.licensePlate}</span></td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Intervention Type' : 'Type d\'Intervention'}</td>
          <td class="value">${params.maintenanceType}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Current Mileage' : 'Kilométrage Actuel'}</td>
          <td class="value">${typeof params.currentKm === 'number' ? params.currentKm.toLocaleString() : params.currentKm} km</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Scheduled Deadline' : 'Date Limite Prévue'}</td>
          <td class="value"><strong>${params.dueDate}</strong></td>
        </tr>
      </table>
    </div>

    <div class="alert-notice">
      ${isEn
        ? 'Action: Please book the vehicle into the central workshop at Bonamoussadi for inspection and consumable replacement.'
        : 'Action requise : Merci de planifier l\'entrée du véhicule à l\'Atelier Central pour vidange et points de contrôle.'}
    </div>
  `;

  const html = wrapFctEmailLayout({
    title: subject,
    preheader: `Entretien : ${params.licensePlate} (${params.maintenanceType})`,
    headerBadge: isEn ? 'Workshop Fleet Maintenance' : 'Maintenance Flotte & Sécurité',
    contentHtml,
    callToAction: {
      text: isEn ? 'Open Workshop Module' : 'Accéder au Module Atelier ERP',
      url: `${FCT_OFFICIAL_URL}/app`,
    },
    lang: params.lang,
  });

  const text = `${subject}\n\nVéhicule : ${params.vehicleName} (${params.licensePlate})\nIntervention : ${params.maintenanceType}\nÉchéance : ${params.dueDate}`;
  return { subject, html, text };
}

