/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Notifications & Modèles E-mail (EmailJS Orchestration)
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState } from 'react';
import { DatabaseState } from '../services/dbStore.ts';
import { Language } from '../services/i18n.ts';
import { BellRing, Mail, CheckCircle2, Clock, Send, Eye, ShieldCheck, Loader2, AlertCircle, Key, Check } from 'lucide-react';
import { sendEmailViaEmailJS } from '../services/emailService.ts';

interface NotificationsViewProps {
  state: DatabaseState;
  lang: Language;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ state, lang }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'RESERVATION' | 'RETURN_REMINDER' | 'CASH_RECEIPT' | 'CONTACT'>('RESERVATION');
  const [testEmail, setTestEmail] = useState('fct.cmr@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const templates = {
    RESERVATION: {
      title: 'Confirmation de Réservation de Véhicule',
      subjectFR: 'FCT Automobile Douala - Confirmation de votre réservation {{reservation_number}}',
      subjectEN: 'FCT Automobile Douala - Confirmation of your booking {{reservation_number}}',
      bodyFR: `Cher(e) {{customer_name}},

Nous avons le plaisir de vous confirmer la réservation de votre véhicule {{vehicle_name}} pour la période du {{start_date}} au {{end_date}}.

- Numéro de dossier : {{reservation_number}}
- Acompte consigné en caisse : {{advance_amount}} FCFA
- Agence de retrait : Carrefour Santa Barbara, Bonamoussadi, Douala

Veuillez vous munir de votre pièce d'identité originale et de votre permis de conduire lors du retrait.

L'équipe Franchise Conseils Trading (FCT)
Tél : +237 699 45 88 12 | contact@fct-automobile.cm`,
    },
    RETURN_REMINDER: {
      title: 'Rappel d’Échéance de Restitution de Location',
      subjectFR: 'FCT Automobile - Rappel : Restitution de votre véhicule prévue le {{end_date}}',
      subjectEN: 'FCT Automobile - Reminder: Vehicle return scheduled on {{end_date}}',
      bodyFR: `Bonjour {{customer_name}},

Ce message vous rappelle que le contrat de location {{contract_number}} pour le véhicule {{vehicle_name}} arrive à échéance le {{end_date}} à 17h00.

Lieu de restitution : Agence FCT - Carrefour Santa Barbara, Bonamoussadi.
Merci de veiller à ce que le véhicule soit restitué avec le plein de carburant et dans un état propre afin de permettre la restitution intégrale de votre caution de {{deposit_amount}} FCFA.

En cas de prolongation souhaitée, contactez immédiatement notre service location au +237 699 45 88 12.`,
    },
    CASH_RECEIPT: {
      title: 'Confirmation d’Encaissement en Espèces (Reçu Numérique)',
      subjectFR: 'FCT Automobile - Reçu de paiement en espèces n° {{receipt_number}}',
      subjectEN: 'FCT Automobile - Cash Payment Receipt # {{receipt_number}}',
      bodyFR: `Bonjour {{customer_name}},

Nous confirmons la bonne réception en caisse certifiée de la somme de {{amount}} FCFA en espèces le {{date}}.

- Reçu n° : {{receipt_number}}
- Objet : {{category_label}}
- Caissier certifié : {{cashier_name}}

Ce reçu tient lieu de justificatif de paiement officiel auprès de Franchise Conseils Trading Douala.`,
    },
    CONTACT: {
      title: 'Notification Interne : Nouvelle Demande de Devis Client',
      subjectFR: 'FCT ERP - Nouvelle demande de contact web : {{prospect_name}}',
      subjectEN: 'FCT ERP - New web contact inquiry: {{prospect_name}}',
      bodyFR: `Alerte Commerciale FCT :

Un nouveau prospect a formulé une demande de renseignements :
- Nom : {{prospect_name}}
- Téléphone : {{prospect_phone}}
- Véhicule sollicité : {{requested_model}}
- Dates souhaitées : {{dates}}

Merci de prendre contact dans un délai maximum de 2 heures.`,
    },
  };

  const currentTpl = templates[selectedTemplate];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-emerald-600" />
            <span>Centre de Notifications &amp; Modèles EmailJS (FR / EN)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Orchestration backend des e-mails transactionnels, relances de restitution et quittances d'encaissement
          </p>
        </div>
      </div>

      {/* Grid: Template Selector & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Modèles EmailJS Configurés
          </div>
          {(Object.keys(templates) as (keyof typeof templates)[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key)}
              className={`w-full text-left p-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                selectedTemplate === key
                  ? 'bg-blue-900 text-white shadow'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>{templates[key].title}</span>
              </div>
            </button>
          ))}

          {/* EmailJS Security Note */}
          <div className="mt-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Protection Anti-Doublons &amp; Spam</span>
              <span>
                Les e-mails ne constituent jamais une preuve comptable autonome. Les envois sont tracés dans la file d'attente d'audit avec statut pending/sent/failed et protection idempotente.
              </span>
            </div>
          </div>
          {/* EmailJS Configuration Active Badge */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
              <Key className="w-4 h-4 text-emerald-600" />
              <span>Paramètres EmailJS Actifs (FCT)</span>
            </div>
            <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600">
              <div>Service : <code className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-emerald-800">service_b31sdja</code> (Gmail)</div>
              <div>Compte : <strong>fct.cmr@gmail.com</strong></div>
              <div>Modèle par défaut : <code className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-emerald-800">template_6gxkx2n</code></div>
              <div>Clé publique : <code className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">CCuR3Tr...</code></div>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Template Preview & Real Sending */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aperçu du Modèle</span>
              <h3 className="text-base font-black text-slate-900">{currentTpl.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Destinataire test..."
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs w-48 text-slate-800"
                title="Adresse e-mail destinataire pour le test"
              />
              <button
                type="button"
                disabled={isSending}
                onClick={async () => {
                  setIsSending(true);
                  setStatusMessage(null);
                  try {
                    const res = await sendEmailViaEmailJS({
                      to_email: testEmail,
                      reply_to: testEmail,
                      customer_name: 'Client Test FCT',
                      reservation_number: 'RES-2026-TEST',
                      vehicle_name: 'Toyota Prado TX 2024',
                      start_date: '10/10/2026',
                      end_date: '15/10/2026',
                      advance_amount: '150 000',
                      contract_number: 'CTR-2026-TEST',
                      deposit_amount: '250 000',
                      receipt_number: 'REC-2026-TEST',
                      amount: '100 000',
                      date: new Date().toLocaleDateString('fr-FR'),
                      category_label: 'Acompte Réservation',
                      cashier_name: 'Responsable Caisse FCT',
                      prospect_name: 'Client Test FCT',
                      prospect_phone: '+237 699 45 88 12',
                      requested_model: 'Toyota Prado TX',
                      dates: '10 au 15 Octobre',
                      message: currentTpl.bodyFR,
                      subject: currentTpl.subjectFR,
                    });

                    if (res.success) {
                      setStatusMessage({
                        type: 'success',
                        message: `E-mail envoyé avec succès via EmailJS vers ${testEmail} ! (${res.message})`,
                      });
                    } else {
                      setStatusMessage({
                        type: 'error',
                        message: `Échec de l'envoi EmailJS : ${res.message}`,
                      });
                    }
                  } catch (err: any) {
                    setStatusMessage({
                      type: 'error',
                      message: `Erreur : ${err?.message || 'Impossible d\'envoyer'}`,
                    });
                  } finally {
                    setIsSending(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white text-xs font-bold cursor-pointer transition shadow"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Envoi en cours…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Tester l'Envoi Réel</span>
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

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Objet E-mail (FR) :</span>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-mono text-slate-900">
                {currentTpl.subjectFR}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Objet E-mail (EN) :</span>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-mono text-slate-900">
                {currentTpl.subjectEN}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Corps du Message avec Variables Dynamiques :</span>
              <pre className="p-4 rounded bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {currentTpl.bodyFR}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
