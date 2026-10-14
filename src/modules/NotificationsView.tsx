/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Notifications & Modèles E-mail (EmailJS Orchestration)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState } from 'react';
import { DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import { BellRing, Mail, CheckCircle2, Send, ShieldCheck, Loader2, AlertCircle, Key, Eye, Code, Smartphone } from 'lucide-react';
import { sendFctBrandedEmail } from '../services/emailService.ts';
import {
  buildReservationConfirmationEmail,
  buildReturnReminderEmail,
  buildCashReceiptEmail,
  buildContactLeadEmail,
} from '../services/emailTemplates.ts';

interface NotificationsViewProps {
  state: DatabaseState;
  lang: Language;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ state, lang }) => {
  const t = translations[lang].notificationsPage;
  const isEn = lang === 'en';

  const [selectedTemplate, setSelectedTemplate] = useState<'RESERVATION' | 'RETURN_REMINDER' | 'CASH_RECEIPT' | 'CONTACT'>('RESERVATION');
  const [testEmail, setTestEmail] = useState('fct.cmr@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewTab, setPreviewTab] = useState<'RENDER' | 'SOURCE'>('RENDER');

  // Génération dynamique des e-mails stylisés FCT selon le modèle sélectionné
  const getGeneratedEmail = () => {
    switch (selectedTemplate) {
      case 'RESERVATION':
        return buildReservationConfirmationEmail({
          customerName: isEn ? 'M. Christian Eboa Eboa' : 'M. Christian Eboa Eboa',
          reservationNumber: 'RES-2026-0089',
          vehicleName: 'Mercedes-Benz GLE 450 AMG (LT-1100-AB)',
          startDate: '14/10/2026',
          endDate: '21/10/2026',
          advanceAmountXAF: '150 000',
          totalDays: 7,
          lang: isEn ? 'en' : 'fr',
        });

      case 'RETURN_REMINDER':
        return buildReturnReminderEmail({
          customerName: 'SOCTRAN SA (Dr. Samuel Ewane)',
          contractNumber: 'CTR-2026-0034',
          vehicleName: 'Toyota Land Cruiser Prado TX-L (LT-8841-CE)',
          endDate: '16/10/2026',
          depositAmountXAF: '350 000',
          lang: isEn ? 'en' : 'fr',
        });

      case 'CASH_RECEIPT':
        return buildCashReceiptEmail({
          customerName: 'SOCTRAN SA',
          receiptNumber: 'REC-2026-0245',
          amountXAF: '595 000',
          date: new Date().toLocaleDateString(isEn ? 'en-US' : 'fr-FR'),
          categoryLabel: isEn ? 'Official Rental Settlement' : 'Règlement Intégral Location 7j',
          cashierName: 'Suzanne Ndongo (Caisse Principale)',
          lang: isEn ? 'en' : 'fr',
        });

      case 'CONTACT':
        return buildContactLeadEmail({
          prospectName: 'Cabinet Avocats Associés Douala',
          prospectPhone: '+237 699 45 88 12',
          requestedModel: 'Toyota Land Cruiser Prado VIP',
          dates: '20 au 27 Octobre 2026',
          notes: 'Délégation étrangère en mission d\'affaires à Douala Bonanjo.',
          lang: isEn ? 'en' : 'fr',
        });
    }
  };

  const currentEmail = getGeneratedEmail();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2a4a] via-[#1e3a8a] to-[#047857] rounded-xl p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/30">
            <BellRing className="w-3.5 h-3.5" />
            <span>FCT Messaging Engine (EmailJS)</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">{t.title}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isEn
              ? 'Real-time transactional email orchestration. All outgoing emails are automatically wrapped in FCT Automobile responsive HTML branding to avoid empty emails and truncated placeholders.'
              : 'Orchestration des e-mails transactionnels en direct. Tous les courriels sont automatiquement habillés aux couleurs officielles de FCT Automobile (HTML5 responsive) sans aucun placeholder {{...}} non résolu.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isEn ? 'Universal HTML5 Rendering' : 'Rendu HTML5 Universel'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Template Selector */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">{t.configuredTemplates}</h3>

            <div className="space-y-2">
              {[
                { id: 'RESERVATION', label: t.tplReservation, desc: 'Confirmation de réservation avec acompte et consignes' },
                { id: 'RETURN_REMINDER', label: t.tplReturnReminder, desc: 'Rappel de restitution à échéance et caution' },
                { id: 'CASH_RECEIPT', label: t.tplCashReceipt, desc: 'Reçu d\'encaissement numérique officiel BEAC' },
                { id: 'CONTACT', label: t.tplContact, desc: 'Alerte commerciale interne pour nouveau prospect' },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl.id as any);
                    setStatusMessage(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                    selectedTemplate === tpl.id
                      ? 'bg-blue-50/70 border-blue-900/30 text-blue-950 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{tpl.label}</span>
                    {selectedTemplate === tpl.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-900" />}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal mt-1">{tpl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* EmailJS Configuration Active Badge */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Key className="w-4 h-4 text-amber-600" />
              <span>{t.activeEmailJsParams}</span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Service :</span>
                <span className="font-bold text-slate-800">service_b31sdja</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Template ID :</span>
                <span className="font-bold text-slate-800">template_6gxkx2n</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Expéditeur :</span>
                <span className="font-bold text-emerald-700">fct.cmr@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sécurité :</span>
                <span className="text-emerald-600 font-bold">API REST HTTPS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Template Preview & Real Sending */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.templatePreview}</span>
              <h3 className="text-base font-black text-slate-900">{currentEmail.subject}</h3>
            </div>

            {/* Test Email & Send Button */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder={t.recipientPlaceholder}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs w-44 sm:w-52 text-slate-800 font-medium"
                title="Adresse e-mail destinataire pour le test en direct"
              />
              <button
                type="button"
                disabled={isSending}
                onClick={async () => {
                  setIsSending(true);
                  setStatusMessage(null);
                  try {
                    const res = await sendFctBrandedEmail({
                      type: selectedTemplate,
                      toEmail: testEmail,
                      data: {
                        customerName: isEn ? 'M. Christian Eboa Eboa' : 'M. Christian Eboa Eboa',
                        reservationNumber: 'RES-2026-0089',
                        vehicleName: 'Mercedes-Benz GLE 450 AMG',
                        startDate: '14/10/2026',
                        endDate: '21/10/2026',
                        advanceAmountXAF: '150 000',
                        totalDays: 7,
                        contractNumber: 'CTR-2026-0034',
                        depositAmountXAF: '350 000',
                        receiptNumber: 'REC-2026-0245',
                        amountXAF: '595 000',
                        categoryLabel: 'Règlement Intégral Location 7j',
                        cashierName: 'Suzanne Ndongo',
                        prospectName: 'Cabinet Avocats Associés Douala',
                        prospectPhone: '+237 699 45 88 12',
                        requestedModel: 'Toyota Land Cruiser Prado VIP',
                        dates: '20 au 27 Octobre 2026',
                      },
                      lang: isEn ? 'en' : 'fr',
                    });

                    if (res.success) {
                      setStatusMessage({
                        type: 'success',
                        message: `${t.sendSuccess} -> ${testEmail} (${res.message})`,
                      });
                    } else {
                      setStatusMessage({
                        type: 'error',
                        message: `${t.sendFailed} ${res.message}`,
                      });
                    }
                  } catch (err: any) {
                    setStatusMessage({
                      type: 'error',
                      message: `Erreur: ${err?.message || 'Erreur inconnue'}`,
                    });
                  } finally {
                    setIsSending(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white text-xs font-bold cursor-pointer transition shadow-xs"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.testingSend}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.testLiveSend}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.message}</span>
            </div>
          )}

          {/* Toggle Rendu Visuel HTML vs Code Source */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewTab('RENDER')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewTab === 'RENDER'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isEn ? 'Branded Email View' : 'Aperçu E-mail Stylisé'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('SOURCE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewTab === 'SOURCE'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>{isEn ? 'HTML Source' : 'Code Source HTML'}</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isEn ? 'Responsive Mobile & Desktop' : '100% Responsive Mobile'}</span>
            </span>
          </div>

          {/* Preview Container */}
          {previewTab === 'RENDER' ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 p-2 sm:p-4">
              <div
                className="bg-white rounded-xl shadow-xs overflow-hidden max-w-[600px] mx-auto"
                dangerouslySetInnerHTML={{ __html: currentEmail.html }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="font-bold text-slate-700 block mb-1 text-xs">Objet résolu :</span>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 font-bold">
                  {currentEmail.subject}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1 text-xs">Code HTML complet (expédié à EmailJS) :</span>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {currentEmail.html}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
