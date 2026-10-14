/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Notifications & Modèles E-mail (EmailJS Orchestration)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 * 
 * Interface inspirée du standard CGA-SPE :
 * - Catalogue des Gabarits Certifiés avec boutons "Prévisualiser ce Modèle"
 * - Modale interactive avec bascule Ordinateur (600px) / Smartphone (375px)
 * - Bascule Rendu Visuel / Code Source HTML
 * - Banc de test d'envoi réel en direct
 */

import React, { useState } from 'react';
import { DatabaseState } from '../services/dbStore.ts';
import { Language, translations } from '../services/i18n.ts';
import {
  BellRing,
  Mail,
  CheckCircle2,
  Send,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Key,
  Eye,
  FileText,
  Clock,
  Receipt,
  UserCheck,
  Car,
  Wrench,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { sendEmailViaEmailJS } from '../services/emailService.ts';
import { EmailPreviewModal, EmailPreviewData } from '../components/modals/EmailPreviewModal.tsx';
import {
  buildReservationConfirmationEmail,
  buildReturnReminderEmail,
  buildCashReceiptEmail,
  buildContactLeadEmail,
  buildContractActiveEmail,
  buildMaintenanceAlertEmail,
} from '../services/emailTemplates.ts';

interface NotificationsViewProps {
  state: DatabaseState;
  lang: Language;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ state, lang }) => {
  const t = translations[lang].notificationsPage;
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'TEST_BENCH'>('TEMPLATES');
  const [selectedPreview, setSelectedPreview] = useState<EmailPreviewData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pour le banc de test
  const [benchEmail, setBenchEmail] = useState('fct.cmr@gmail.com');
  const [benchTemplate, setBenchTemplate] = useState('RESERVATION');
  const [benchSending, setBenchSending] = useState(false);
  const [benchStatus, setBenchStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Génération dynamique des données de prévisualisation pour chaque modèle
  const getEmailDataForTemplate = (templateKey: string): EmailPreviewData => {
    switch (templateKey) {
      case 'RESERVATION': {
        const generated = buildReservationConfirmationEmail({
          customerName: 'M. Christian Eboa Eboa',
          reservationNumber: 'RES-2026-0089',
          vehicleName: 'Mercedes-Benz GLE 450 AMG (LT-1100-AB)',
          startDate: '14/10/2026',
          endDate: '21/10/2026',
          advanceAmountXAF: '150 000',
          totalDays: 7,
          lang: isEn ? 'en' : 'fr',
        });
        return {
          templateId: 'RESERVATION',
          title: isEn ? 'Vehicle Booking Confirmation' : 'Confirmation de Réservation de Véhicule',
          subject: generated.subject,
          html: generated.html,
          text: generated.text,
          recipientEmail: 'fct.cmr@gmail.com',
          recipientName: 'M. Christian Eboa Eboa',
          categoryBadge: 'Réservation VIP',
        };
      }

      case 'RETURN_REMINDER': {
        const generated = buildReturnReminderEmail({
          customerName: 'SOCTRAN SA (Dr. Samuel Ewane)',
          contractNumber: 'CTR-2026-0034',
          vehicleName: 'Toyota Land Cruiser Prado TX-L (LT-8841-CE)',
          endDate: '16/10/2026',
          depositAmountXAF: '350 000',
          lang: isEn ? 'en' : 'fr',
        });
        return {
          templateId: 'RETURN_REMINDER',
          title: isEn ? 'Rental Return Expiry Reminder' : 'Rappel d’Échéance de Restitution de Location',
          subject: generated.subject,
          html: generated.html,
          text: generated.text,
          recipientEmail: 'fct.cmr@gmail.com',
          recipientName: 'SOCTRAN SA',
          categoryBadge: 'Échéance Location',
        };
      }

      case 'CASH_RECEIPT': {
        const generated = buildCashReceiptEmail({
          customerName: 'SOCTRAN SA',
          receiptNumber: 'REC-2026-0245',
          amountXAF: '595 000',
          date: new Date().toLocaleDateString(isEn ? 'en-US' : 'fr-FR'),
          categoryLabel: isEn ? 'Official Rental Settlement (7 days)' : 'Règlement Intégral Location 7j',
          cashierName: 'Suzanne Ndongo (Caisse Principale)',
          lang: isEn ? 'en' : 'fr',
        });
        return {
          templateId: 'CASH_RECEIPT',
          title: isEn ? 'Cash Payment Confirmation (BEAC Receipt)' : 'Reçu Numérique de Paiement en Caisse',
          subject: generated.subject,
          html: generated.html,
          text: generated.text,
          recipientEmail: 'fct.cmr@gmail.com',
          recipientName: 'SOCTRAN SA',
          categoryBadge: 'Caisse Certifiée',
        };
      }

      case 'CONTACT': {
        const generated = buildContactLeadEmail({
          prospectName: 'Cabinet Avocats Associés Douala',
          prospectPhone: '+237 699 45 88 12',
          requestedModel: 'Toyota Land Cruiser Prado VIP',
          dates: '20 au 27 Octobre 2026',
          notes: 'Délégation étrangère en mission d\'affaires à Douala Bonanjo.',
          lang: isEn ? 'en' : 'fr',
        });
        return {
          templateId: 'CONTACT',
          title: isEn ? 'Internal Alert: Web Contact Inquiry' : 'Notification Commerciale : Nouveau Lead Web',
          subject: generated.subject,
          html: generated.html,
          text: generated.text,
          recipientEmail: 'fct.cmr@gmail.com',
          recipientName: 'Direction Commerciale FCT',
          categoryBadge: 'Lead Commercial',
        };
      }

      case 'CONTRACT_ACTIVE': {
        const generated = buildContractActiveEmail({
          customerName: 'SOCTRAN SA',
          contractNumber: 'CTR-2026-0034',
          vehicleName: 'Toyota Land Cruiser Prado TX-L',
          startDate: '10/10/2026',
          endDate: '17/10/2026',
          driverName: 'Éric Ngassa (Chauffeur VIP)',
          lang: isEn ? 'en' : 'fr',
        });
        return {
          templateId: 'CONTRACT_ACTIVE',
          title: isEn ? 'Rental Agreement Live & Handover' : 'Contrat de Location Activé & Remise Véhicule',
          subject: generated.subject,
          html: generated.html,
          text: generated.text,
          recipientEmail: 'fct.cmr@gmail.com',
          recipientName: 'SOCTRAN SA',
          categoryBadge: 'Contrat Actif',
        };
      }

      case 'MAINTENANCE_ALERT': {
        const generated = buildMaintenanceAlertEmail({
          vehicleName: 'Toyota Prado TX-L',
          licensePlate: 'LT-8841-CE',
          maintenanceType: 'Vidange 10 000 km + Filtres',
          dueDate: '25/10/2026',
          currentKm: 45200,
          lang: isEn ? 'en' : 'fr',
        });
        return {
          templateId: 'MAINTENANCE_ALERT',
          title: isEn ? 'Fleet Workshop Maintenance Due' : 'Alerte Entretien Périodique Flotte',
          subject: generated.subject,
          html: generated.html,
          text: generated.text,
          recipientEmail: 'fct.cmr@gmail.com',
          recipientName: 'Chef d\'Atelier Central FCT',
          categoryBadge: 'Atelier & Révision',
        };
      }

      default:
        return getEmailDataForTemplate('RESERVATION');
    }
  };

  const handleOpenPreview = (templateKey: string) => {
    const data = getEmailDataForTemplate(templateKey);
    setSelectedPreview(data);
    setIsModalOpen(true);
  };

  // Les 6 modèles officiels FCT Automobile
  const catalogTemplates = [
    {
      id: 'RESERVATION',
      title: isEn ? 'Vehicle Booking Confirmation' : 'Confirmation de Réservation de Véhicule',
      desc: isEn
        ? 'Sent automatically when a customer books a vehicle online or at the desk. Contains booking reference, deposit amount, and pickup instructions.'
        : 'Expédié automatiquement lors d\'une réservation web ou agence. Comprend la référence, l\'acompte consigné et les consignes de retrait.',
      icon: <Car className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-900 border-blue-200',
      badge: 'Client & Agence',
    },
    {
      id: 'RETURN_REMINDER',
      title: isEn ? 'Rental Expiry & Return Reminder' : 'Rappel d’Échéance de Restitution de Location',
      desc: isEn
        ? 'Reminder sent to the client on the scheduled return day at 17:00. Outlines fuel level check, clean state, and security deposit release.'
        : 'Rappel adressé au client le jour prévu de la restitution à 17h00. Rappelle le plein de carburant et les conditions de déconsignation de caution.',
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'Opérations VIP',
    },
    {
      id: 'CASH_RECEIPT',
      title: isEn ? 'Certified Cash Receipt (BEAC Voucher)' : 'Reçu Numérique de Paiement en Caisse',
      desc: isEn
        ? 'Voucher delivered when cash is collected at the certified cash desk. Mentions cash register session, cashier name, and zero-centime XAF amount.'
        : 'Reçu officiel délivré lors de tout encaissement d\'espèces. Mentionne la session de caisse, le caissier certifié et le montant net BEAC.',
      icon: <Receipt className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      badge: 'Caisse Certifiée',
    },
    {
      id: 'CONTRACT_ACTIVE',
      title: isEn ? 'Rental Agreement Activation' : 'Contrat de Location Activé & Remise Clés',
      desc: isEn
        ? 'Formal agreement confirmation confirming vehicle handover, designated VIP driver, and 24/7 roadside assistance hotline.'
        : 'Confirmation officielle confirmant la mise à disposition du véhicule, le chauffeur VIP assigné et la ligne d\'assistance 24/7.',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
      badge: 'Contrat Officiel',
    },
    {
      id: 'CONTACT',
      title: isEn ? 'Internal Lead & Showroom Inquiry' : 'Notification Commerciale : Nouveau Lead Web',
      desc: isEn
        ? 'Real-time alert transmitted to the sales desk whenever a visitor requests a vehicle quote from the public showroom.'
        : 'Alerte en temps réel transmise à l\'équipe commerciale lorsqu\'un visiteur formule une demande de devis sur le showroom public.',
      icon: <UserCheck className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-900 border-purple-200',
      badge: 'CRM & Ventes',
    },
    {
      id: 'MAINTENANCE_ALERT',
      title: isEn ? 'Fleet Workshop Maintenance Alert' : 'Alerte Entretien Périodique & Révision',
      desc: isEn
        ? 'Internal alert for fleet managers when a vehicle approaches its 10,000 km oil change or CEMAC roadworthiness inspection.'
        : 'Alerte interne destinée au chef d\'atelier lorsqu\'un SUV approche de l\'échéance de vidange 10 000 km ou du contrôle technique CEMAC.',
      icon: <Wrench className="w-5 h-5" />,
      color: 'bg-rose-50 text-rose-900 border-rose-200',
      badge: 'Atelier Central',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner Corporate FCT */}
      <div className="bg-gradient-to-r from-[#0f2a4a] via-[#1e3a8a] to-[#047857] rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/30">
            <BellRing className="w-3.5 h-3.5" />
            <span>FCT Messaging Engine · EmailJS & HTML5 Branded</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t.title}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isEn
              ? 'Catalog of certified HTML5 email templates for FCT Automobile Douala. Fully responsive, tested on Android, iOS, and PC with real-time test bench.'
              : 'Catalogue des gabarits d\'emails certifiés pour FCT Automobile Douala. 100% responsives, testés sur smartphone Android, iPhone et PC avec banc de test en direct.'}
          </p>
        </div>

        {/* Tab Controls Style CGA-SPE */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
              activeTab === 'TEMPLATES'
                ? 'bg-white text-[#0f2a4a] shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Catalogue des Gabarits ({catalogTemplates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TEST_BENCH')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
              activeTab === 'TEST_BENCH'
                ? 'bg-white text-[#0f2a4a] shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Banc de Test Réel</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOGUE DES GABARITS (Comme sur CGA SPE) */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200 gap-2">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Catalogue des Gabarits d'Emails Certifiés FCT Automobile (6 Modèles)
              </h3>
              <p className="text-xs text-slate-500">
                Chaque modèle est responsive, charté aux couleurs officielles avec bouton d'action et liens interactifs.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 font-extrabold text-xs border border-emerald-200">
              6 Modèles Actifs & Chartés
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {catalogTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${tpl.color}`}>
                      {tpl.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {tpl.badge}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{tpl.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{tpl.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPreview(tpl.id)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-[#0f2a4a] hover:text-white text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer group shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0f2a4a] group-hover:text-emerald-400 transition-colors" />
                  <span>Prévisualiser ce Modèle</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BANC DE TEST RÉEL EMAILJS */}
      {activeTab === 'TEST_BENCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Paramètres de la Passerelle EmailJS</h3>
            
            <div className="space-y-2 text-xs font-mono text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Service ID :</span>
                <span className="font-bold text-slate-900">service_b31sdja</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Template ID :</span>
                <span className="font-bold text-slate-900">template_6gxkx2n</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Compte Expéditeur :</span>
                <span className="font-bold text-emerald-700">fct.cmr@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Protocole :</span>
                <span className="font-bold text-blue-900">REST API v1.0 TLS</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Choisir un gabarit à tester :</label>
              <select
                value={benchTemplate}
                onChange={(e) => setBenchTemplate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50"
              >
                {catalogTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPreview(benchTemplate)}
              className="w-full py-2 bg-blue-50 text-blue-950 font-bold text-xs rounded-xl hover:bg-blue-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-900" />
              <span>Ouvrir l'Aperçu Complet (Desktop & Mobile)</span>
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Expédition Immédiate de Test</h3>
            
            <p className="text-xs text-slate-500">
              Saisissez votre adresse e-mail personnelle pour recevoir le gabarit sélectionné tel qu'il apparaîtra dans votre boîte de réception (Gmail, Outlook, smartphone Android).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                value={benchEmail}
                onChange={(e) => setBenchEmail(e.target.value)}
                placeholder="votre.email@domaine.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-900/20"
              />
              <button
                type="button"
                disabled={benchSending}
                onClick={async () => {
                  setBenchSending(true);
                  setBenchStatus(null);
                  try {
                    const data = getEmailDataForTemplate(benchTemplate);
                    const res = await sendEmailViaEmailJS({
                      to_email: benchEmail,
                      to_name: 'Administrateur FCT',
                      subject: data.subject,
                      message_html: data.html,
                      message: data.html,
                      html_content: data.html,
                      message_text: data.text || data.subject,
                    });

                    if (res.success) {
                      setBenchStatus({
                        type: 'success',
                        message: `E-mail transmis avec succès à ${benchEmail} ! (${res.message})`,
                      });
                    } else {
                      setBenchStatus({
                        type: 'error',
                        message: `Échec d'envoi EmailJS : ${res.message}`,
                      });
                    }
                  } catch (err: any) {
                    setBenchStatus({
                      type: 'error',
                      message: `Erreur: ${err?.message || 'Erreur réseau'}`,
                    });
                  } finally {
                    setBenchSending(false);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs shrink-0"
              >
                {benchSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Expédier le Test Réel</span>
                  </>
                )}
              </button>
            </div>

            {benchStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  benchStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {benchStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{benchStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALE DE PRÉVISUALISATION STYLE CGA-SPE */}
      <EmailPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        emailData={selectedPreview}
      />
    </div>
  );
};
