/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Modale de Prévisualisation & Test d'E-mails Stylisés
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 * 
 * Inspiré de l'architecture CGA-SPE :
 * - Double mode d'affichage : Ordinateur (Desktop) & Mobile (Smartphone w-[375px])
 * - Double vue : Visuel (Rendu e-mail réel) & Code Source HTML (Copiable en un clic)
 * - Expédition de test réel direct via EmailJS avec retour visuel d'état
 */

import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Eye,
  Code2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { sendEmailViaEmailJS } from '../../services/emailService.ts';

export interface EmailPreviewData {
  templateId: string;
  title: string;
  subject: string;
  html: string;
  text?: string;
  recipientEmail: string;
  recipientName: string;
  categoryBadge?: string;
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: EmailPreviewData | null;
  onSendSuccess?: (message: string) => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  emailData,
  onSendSuccess,
}) => {
  const [activeView, setActiveView] = useState<'PREVIEW' | 'HTML'>('PREVIEW');
  const [deviceMode, setDeviceMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [copied, setCopied] = useState(false);
  const [testEmail, setTestEmail] = useState(emailData?.recipientEmail || 'fct.cmr@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Synchroniser testEmail si les données changent
  React.useEffect(() => {
    if (emailData?.recipientEmail) {
      setTestEmail(emailData.recipientEmail);
    }
    setSendStatus(null);
  }, [emailData]);

  if (!isOpen || !emailData) return null;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(emailData.html || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setSendStatus({ type: 'error', message: 'Veuillez saisir une adresse e-mail valide.' });
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const res = await sendEmailViaEmailJS({
        to_email: testEmail,
        to_name: emailData.recipientName || 'Destinataire FCT',
        subject: emailData.subject,
        message_html: emailData.html,
        message: emailData.html,
        html_content: emailData.html,
        message_text: emailData.text || emailData.subject,
      });

      if (res.success) {
        setSendStatus({
          type: 'success',
          message: `E-mail transmis avec succès à ${testEmail} !`,
        });
        if (onSendSuccess) onSendSuccess(testEmail);
      } else {
        setSendStatus({
          type: 'error',
          message: `Échec d'envoi : ${res.message}`,
        });
      }
    } catch (err: any) {
      setSendStatus({
        type: 'error',
        message: `Erreur réseau : ${err?.message || 'Impossible de joindre le serveur'}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header - Thème Bleu Nuit Corporate FCT */}
        <div className="bg-[#0f2a4a] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/10 text-emerald-400 border border-white/15 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {emailData.title}
                </h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                  {emailData.categoryBadge || 'FCT Branded'}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                Destinataire modèle : <strong className="text-white">{emailData.recipientName}</strong> ({emailData.recipientEmail})
              </p>
            </div>
          </div>

          {/* Controls : Desktop / Mobile & Visuel / HTML */}
          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            {/* Device Mode Toggle */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setDeviceMode('DESKTOP')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'DESKTOP' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Aperçu Écran Ordinateur (600px)"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('MOBILE')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'MOBILE' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Aperçu Écran Smartphone (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('PREVIEW')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                  activeView === 'PREVIEW' ? 'bg-white text-[#0f2a4a] font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[11px]">Visuel</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('HTML')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                  activeView === 'HTML' ? 'bg-white text-[#0f2a4a] font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">HTML</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Fermer la prévisualisation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Metadata Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 overflow-hidden">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] shrink-0">Objet :</span>
            <span className="font-extrabold text-slate-900 truncate">
              {emailData.subject}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Garantie responsive universelle (Gmail, Outlook, Apple Mail)</span>
          </div>
        </div>

        {/* Status Message */}
        {sendStatus && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center space-x-2 border-b ${
              sendStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {sendStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{sendStatus.message}</span>
          </div>
        )}

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 flex justify-center items-start min-h-[420px]">
          {activeView === 'PREVIEW' ? (
            <div
              className={`bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden transition-all duration-300 ${
                deviceMode === 'MOBILE' ? 'w-[375px]' : 'w-full max-w-[620px]'
              }`}
            >
              {/* Fake Client Header in Mobile Mode */}
              {deviceMode === 'MOBILE' && (
                <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-mono flex items-center justify-between border-b border-slate-800">
                  <span>9:41</span>
                  <span>FCT Mail Client · 100%</span>
                </div>
              )}

              <div
                className="overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: emailData.html }}
              />
            </div>
          ) : (
            <div className="w-full max-w-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Code Source HTML5 Complet (Généré par le moteur FCT) :
                </span>
                <button
                  type="button"
                  onClick={handleCopyHtml}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copié dans le presse-papier !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copier le Code HTML</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto border border-slate-800 shadow-inner">
                {emailData.html}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'HTML Copié !' : 'Copier HTML'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="votre.email@domaine.com"
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 w-44 sm:w-56 font-medium focus:ring-2 focus:ring-blue-900/20"
              title="Adresse destinataire pour le test en direct"
            />
            <button
              type="button"
              disabled={isSending}
              onClick={handleSendTest}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Envoi en cours...</span>
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
      </div>
    </div>
  );
};
