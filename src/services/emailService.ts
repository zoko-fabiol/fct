/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service d'Envoi E-mails Transactionnels Stylisés (EmailJS)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import {
  buildReservationConfirmationEmail,
  buildReturnReminderEmail,
  buildCashReceiptEmail,
  buildContactLeadEmail,
  FCT_PHONE_PRIMARY,
  FCT_AGENCY_ADDRESS,
  FCT_EMAIL_OFFICIAL,
} from './emailTemplates.ts';

export interface EmailSendResult {
  success: boolean;
  status: number;
  message: string;
}

const GOOGLE_MAIL_GATEWAY_URL =
  import.meta.env.VITE_GOOGLE_MAIL_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycby9FGtr4OCIsGrjI6a8Zv8sdYKwbMAFnwEWvB6IdFhmSb-uLUbjsAhpmuoB_k9e1t62/exec';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_b31sdja';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_6gxkx2n';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'CCuR3TrZatt_47zpp';

/**
 * Remplace tous les marqueurs {{tag}} dans une chaîne par leur valeur
 */
function interpolateString(str: string, params: Record<string, any>): string {
  if (!str) return '';
  return str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : '';
  });
}

/**
 * Envoie un email transactionnel via la passerelle Google Gmail officielle (500 e-mails / jour)
 * avec basculement automatique de secours vers l'API EmailJS.
 */
export async function sendEmailViaEmailJS(
  templateParams: Record<string, any>,
  customTemplateId?: string
): Promise<EmailSendResult> {
  const serviceId = EMAILJS_SERVICE_ID;
  const templateId = customTemplateId || EMAILJS_TEMPLATE_ID;
  const publicKey = EMAILJS_PUBLIC_KEY;

  // Résoudre le sujet et le message en remplaçant les éventuels tags {{...}}
  const rawSubject = templateParams.subject || 'FCT Automobile Douala - Notification';
  const resolvedSubject = interpolateString(rawSubject, templateParams);

  const rawHtml = templateParams.message_html || templateParams.html_content || templateParams.message || '';
  const resolvedHtml = interpolateString(rawHtml, templateParams);

  const rawText = templateParams.message_text || templateParams.textContent || templateParams.text || resolvedSubject;
  const resolvedText = interpolateString(rawText, templateParams);

  const targetEmail =
    templateParams.to_email || templateParams.recipient_email || templateParams.email || '';

  // 1. PRIORITÉ : Envoi direct via la passerelle Google Apps Script (Quota 500 mails / jour)
  if (GOOGLE_MAIL_GATEWAY_URL && targetEmail) {
    try {
      await fetch(GOOGLE_MAIL_GATEWAY_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          to: targetEmail,
          subject: resolvedSubject,
          htmlBody: resolvedHtml || resolvedText,
          fromName: 'FCT Automobile Douala',
        }),
      });

      return {
        success: true,
        status: 200,
        message: 'E-mail transmis avec succès via la passerelle Google Gmail (500 mails/jour).',
      };
    } catch (gErr) {
      console.warn('[FCT Mail Engine] Échec passerelle Google, bascule vers EmailJS :', gErr);
    }
  }

  // 2. SECOURS : Passerelle EmailJS
  if (!publicKey || !serviceId || !templateId) {
    return {
      success: false,
      status: 400,
      message: 'Configuration EmailJS incomplète dans les variables d\'environnement.',
    };
  }

  // Payload exhaustif pour EmailJS : garantit qu'aucune balise ne soit ignorée
  const exhaustiveParams: Record<string, any> = {
    ...templateParams,
    // Coordonnées expéditeur & destinataire
    to_email: targetEmail,
    to_name: templateParams.to_name || templateParams.customer_name || templateParams.client_name || 'Client FCT',
    from_name: 'FCT Automobile Douala',
    reply_to: templateParams.reply_to || 'fct.cmr@gmail.com',

    // Sujet sous toutes les variations de nommage EmailJS
    subject: resolvedSubject,
    subject_line: resolvedSubject,
    email_subject: resolvedSubject,

    // Corps de message HTML & Texte sous toutes les variations EmailJS possibles
    message_html: resolvedHtml || resolvedText,
    html_content: resolvedHtml || resolvedText,
    message: resolvedHtml || resolvedText,
    content: resolvedHtml || resolvedText,
    body: resolvedHtml || resolvedText,
    message_text: resolvedText,
    textContent: resolvedText,

    // Métadonnées agence FCT
    agency_phone: FCT_PHONE_PRIMARY,
    agency_address: FCT_AGENCY_ADDRESS,
    agency_email: FCT_EMAIL_OFFICIAL,
  };

  try {
    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: exhaustiveParams,
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const text = await response.text();
      return {
        success: true,
        status: response.status,
        message: text || 'E-mail transmis avec succès via EmailJS (fct.cmr@gmail.com).',
      };
    } else {
      const errText = await response.text();
      return {
        success: false,
        status: response.status,
        message: errText || `Erreur EmailJS (${response.status})`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      status: 500,
      message: error?.message || 'Erreur réseau lors de la communication avec EmailJS.',
    };
  }
}

/**
 * Envoie un email transactionnel stylisé aux standards FCT Automobile
 */
export async function sendFctBrandedEmail(options: {
  type: 'RESERVATION' | 'RETURN_REMINDER' | 'CASH_RECEIPT' | 'CONTACT';
  toEmail: string;
  data: Record<string, any>;
  lang?: 'fr' | 'en';
}): Promise<EmailSendResult> {
  const { type, toEmail, data, lang = 'fr' } = options;

  let generated: { subject: string; html: string; text: string };

  switch (type) {
    case 'RESERVATION':
      generated = buildReservationConfirmationEmail({
        customerName: data.customerName || data.customer_name || 'Client FCT',
        reservationNumber: data.reservationNumber || data.reservation_number || 'RES-2026-FCT',
        vehicleName: data.vehicleName || data.vehicle_name || 'Toyota Prado TX-L',
        startDate: data.startDate || data.start_date || '',
        endDate: data.endDate || data.end_date || '',
        advanceAmountXAF: data.advanceAmountXAF || data.advance_amount || '100 000',
        totalDays: data.totalDays,
        lang,
      });
      break;

    case 'RETURN_REMINDER':
      generated = buildReturnReminderEmail({
        customerName: data.customerName || data.customer_name || 'Client FCT',
        contractNumber: data.contractNumber || data.contract_number || 'CTR-2026-FCT',
        vehicleName: data.vehicleName || data.vehicle_name || 'Toyota Prado TX-L',
        endDate: data.endDate || data.end_date || '',
        depositAmountXAF: data.depositAmountXAF || data.deposit_amount || '250 000',
        lang,
      });
      break;

    case 'CASH_RECEIPT':
      generated = buildCashReceiptEmail({
        customerName: data.customerName || data.customer_name || 'Client FCT',
        receiptNumber: data.receiptNumber || data.receipt_number || 'REC-2026-FCT',
        amountXAF: data.amountXAF || data.amount || '100 000',
        date: data.date || new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR'),
        categoryLabel: data.categoryLabel || data.category_label || 'Règlement Location',
        cashierName: data.cashierName || data.cashier_name || 'Caissier FCT',
        lang,
      });
      break;

    case 'CONTACT':
      generated = buildContactLeadEmail({
        prospectName: data.prospectName || data.prospect_name || 'Prospect Web',
        prospectPhone: data.prospectPhone || data.prospect_phone || '+237 699 45 88 12',
        requestedModel: data.requestedModel || data.requested_model || 'Véhicule SUV FCT',
        dates: data.dates || 'Créneau souhaité',
        notes: data.notes,
        lang,
      });
      break;
  }

  return sendEmailViaEmailJS({
    to_email: toEmail,
    to_name: data.customerName || data.customer_name || toEmail.split('@')[0],
    subject: generated.subject,
    message_html: generated.html,
    message_text: generated.text,
    message: generated.html,
    ...data,
  });
}
