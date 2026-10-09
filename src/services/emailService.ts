/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service d'Envoi E-mails Transactionnels (EmailJS)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

export interface EmailSendResult {
  success: boolean;
  status: number;
  message: string;
}

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_b31sdja';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_6gxkx2n';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'CCuR3TrZatt_47zpp';

/**
 * Envoie un email transactionnel via l'API REST officielle d'EmailJS.
 */
export async function sendEmailViaEmailJS(
  templateParams: Record<string, any>,
  customTemplateId?: string
): Promise<EmailSendResult> {
  const serviceId = EMAILJS_SERVICE_ID;
  const templateId = customTemplateId || EMAILJS_TEMPLATE_ID;
  const publicKey = EMAILJS_PUBLIC_KEY;

  if (!publicKey || !serviceId || !templateId) {
    return {
      success: false,
      status: 400,
      message: 'Configuration EmailJS incomplète dans les variables d\'environnement.',
    };
  }

  try {
    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams,
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
