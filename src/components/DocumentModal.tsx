/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Official Document Modal & Print Engine
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 *
 * Reproduit la qualité d'impression de CGA SPE :
 * - Impression A4 isolée par iframe (aucun élément de l'application imprimé, pas d'en-tête navigateur parasite)
 * - Export direct PDF vectoriel fidèle (jspdf-autotable, pagination et en-tête répété)
 * - QR code de vérification authenticité FCT (QRCodeSVG)
 * - Montant officiel en toutes lettres (FCFA)
 * - Archivage sécurisé en 1 clic dans Cloudinary FCT & rattachement au coffre-fort
 */

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X, FileSpreadsheet } from 'lucide-react';
import { printElementById } from '../utils/printDocument.ts';
import {
  amountInWordsFCFA,
  buildVerificationPayload,
  formatAmountPlain,
  buildPdfFileName,
} from '../utils/invoiceFormat.ts';
import { downloadInvoicePdf } from '../utils/invoicePdf.ts';
import { FCT_LOGO_BASE64 } from '../utils/logoBase64.ts';
import { exportDocumentToExcel } from '../utils/excelExport.ts';
import { isNativeMobile } from '../services/mobileFileService.ts';

import { Language } from '../services/i18n.ts';

export interface DocumentPrintData {
  title: string;
  docNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNiu?: string;
  items: {
    description: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal?: number;
  tax?: number;
  total?: number;
  totalAmountXAF?: number;
  depositAmount?: number;
  notes?: string;
  signatureRole1?: string;
  signatureRole2?: string;
}

interface DocumentModalProps {
  data: DocumentPrintData | null;
  onClose: () => void;
  lang?: Language;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ data, onClose, lang = 'fr' }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  // Convertit le QR SVG en Data URL PNG pour l'export vectoriel PDF
  const getQrDataUrl = async (): Promise<string | undefined> => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) return undefined;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = window.document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 128, 128);
          resolve();
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });
      return canvas.toDataURL('image/png');
    } catch {
      return undefined;
    }
  };

  const handlePrint = async () => {
    if (isNativeMobile()) {
      await handleDownloadPdf();
      return;
    }
    await printElementById('fct-official-doc-sheet', `${data.title}_${data.docNumber}`);
  };

  const handleDownloadPdf = async () => {
    const qrDataUrl = await getQrDataUrl();
    downloadInvoicePdf(data, { qrDataUrl, logoDataUrl: FCT_LOGO_BASE64, lang });
  };

  const handleDownloadExcel = () => {
    exportDocumentToExcel(data, lang);
  };

  const qrPayload = buildVerificationPayload(data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden text-slate-800 my-auto flex flex-col max-h-[calc(100dvh-2rem)]">
        {/* BARRE D'ACTIONS SUPÉRIEURE (NON IMPRIMÉE) */}
        <div className="no-print bg-gradient-to-r from-[#0a1e36] to-[#0f2a4a] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 tracking-wider">
              {lang === 'en' ? 'FCT COMMERCIAL EDITION:' : 'ÉDITION COMMERCIALE FCT :'}
            </span>
            <span className="font-mono text-white">{data.docNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title={lang === 'en' ? 'Print A4 seamless document' : 'Imprimer au format A4 sans coupure'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Print A4' : 'Imprimer A4'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title={lang === 'en' ? 'Download high-definition vector PDF' : 'Télécharger le PDF vectoriel haute définition'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Download PDF' : 'Télécharger PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title={lang === 'en' ? 'Download document in Microsoft Excel format (.xlsx)' : 'Télécharger ce document sous format Microsoft Excel (.xlsx)'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Download Excel' : 'Télécharger Excel'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
              title={lang === 'en' ? 'Close' : 'Fermer'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEUILLE OFFICIELLE IMPRIMABLE (A4 NORMÉE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div
            id="fct-official-doc-sheet"
            className="w-full max-w-[210mm] bg-white p-8 sm:p-10 shadow-lg border border-slate-200 text-slate-900 text-xs font-sans rounded-sm space-y-6"
          >
            {/* EN-TÊTE OFFICIEL DE L'ENTREPRISE */}
            <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-5">
              <div className="flex items-start gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-1 shadow-xs shrink-0 flex items-center justify-center">
                  <img
                    src="/fct-logo.png"
                    alt="FCT - Franchise Conseils Trading"
                    className="h-14 w-auto max-w-[160px] object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-black text-[#0f2a4a] tracking-tight">
                    FRANCHISE CONSEILS TRADING (FCT)
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold">
                    {lang === 'en' ? 'Car Sales & Rental - Fleet Management - Douala' : 'Vente & Location Automobile - Gestion de Flotte - Douala'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Carrefour Santa Barbara, Bonamoussadi, Douala, Cameroun
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    RC/DLA/2020/B/1458 | NIU : M052014587963P | Tél : +237 699 45 88 12
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded bg-blue-50 text-[#0f2a4a] border border-blue-200 font-bold text-xs uppercase tracking-wider mb-1.5">
                  {data.title}
                </span>
                <div className="text-base font-black text-slate-900 font-mono">
                  {data.docNumber}
                </div>
                <div className="text-xs text-slate-500">Date : {data.date}</div>
              </div>
            </div>

            {/* BLOC CLIENT ET CONTEXTE */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {lang === 'en' ? 'Client / Recipient' : 'Client / Destinataire'}
                </span>
                <div className="text-sm font-bold text-slate-900">{data.customerName}</div>
                {data.customerAddress && (
                  <div className="text-slate-600 mt-0.5">{data.customerAddress}</div>
                )}
                {data.customerPhone && (
                  <div className="text-slate-600">{lang === 'en' ? 'Phone:' : 'Tél :'} {data.customerPhone}</div>
                )}
                {data.customerNiu && (
                  <div className="text-slate-600 font-mono">NIU : {data.customerNiu}</div>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {lang === 'en' ? 'Issuing Agency & Currency' : 'Lieu d\'émission & Devise'}
                </span>
                <div className="font-semibold text-slate-800">
                  {lang === 'en' ? 'FCT Agency Bonamoussadi' : 'Agence FCT Bonamoussadi'}
                </div>
                <div className="text-slate-600">
                  {lang === 'en' ? 'Currency: CFA Franc (XAF)' : 'Devise : Franc CFA (XAF)'}
                </div>
                <div className="text-slate-500 text-[11px] mt-1">Douala, Littoral - Cameroun</div>
              </div>
            </div>

            {/* TABLEAU DES LIGNES (AVEC EN-TÊTE RÉPÉTÉ SUR SAUT DE PAGE) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full min-w-[480px] print:min-w-full text-xs text-left border-collapse">
                <thead className="bg-[#0f2a4a] text-white">
                  <tr>
                    <th className="py-2.5 px-3.5 font-bold">{lang === 'en' ? 'Description' : 'Désignation'}</th>
                    <th className="py-2.5 px-3 text-center font-bold w-16">{lang === 'en' ? 'Qty' : 'Qté'}</th>
                    <th className="py-2.5 px-3.5 text-right font-bold w-36">{lang === 'en' ? 'Unit Price' : 'Prix Unitaire'}</th>
                    <th className="py-2.5 px-3.5 text-right font-bold w-40">{lang === 'en' ? 'Total (XAF)' : 'Total (FCFA)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3.5 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                        {item.qty}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-slate-700">
                        {formatAmountPlain(item.unitPrice, false)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold font-mono text-slate-900">
                        {formatAmountPlain(item.total, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION TOTAUX ET MONTANT EN TOUTES LETTRES */}
            {(() => {
              const totalAmount = data.total ?? data.totalAmountXAF ?? 0;
              const subtotalAmount = data.subtotal ?? totalAmount;
              const taxAmount = data.tax ?? 0;
              return (
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                  <div className="flex-1 space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block mb-0.5">
                        {lang === 'en' ? 'Amount certified in words:' : 'Montant arrêté en toutes lettres :'}
                      </span>
                      <p className="italic text-slate-800 leading-relaxed">
                        {lang === 'en' ? (
                          <>
                            “Certified this official document to the sum of{' '}
                            <strong>{amountInWordsFCFA(totalAmount, 'en')}</strong>.”
                          </>
                        ) : (
                          <>
                            « Arrêtée la présente pièce à la somme de{' '}
                            <strong>{amountInWordsFCFA(totalAmount, 'fr')}</strong>. »
                          </>
                        )}
                      </p>
                    </div>

                    {data.notes && (
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-slate-700">
                        <span className="font-bold text-amber-900">{lang === 'en' ? 'Notes:' : 'Observations :'} </span>
                        {data.notes}
                      </div>
                    )}
                  </div>

                  <div className="w-full sm:w-72 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">{lang === 'en' ? 'Subtotal (excl. tax):' : 'Sous-total HT :'}</span>
                      <span className="font-mono font-semibold">{formatAmountPlain(subtotalAmount)}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">{lang === 'en' ? 'VAT (19.25%):' : 'TVA (19,25 %) :'}</span>
                        <span className="font-mono font-semibold">{formatAmountPlain(taxAmount)}</span>
                      </div>
                    )}
                    {data.depositAmount !== undefined && data.depositAmount > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-200 text-blue-900 font-semibold">
                        <span>{lang === 'en' ? 'Security deposit:' : 'Caution consignée :'}</span>
                        <span className="font-mono">{formatAmountPlain(data.depositAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 text-sm font-black text-[#0f2a4a] border-t-2 border-[#0f2a4a]">
                      <span>{lang === 'en' ? 'TOTAL NET (INCL. TAX):' : 'TOTAL NET TTC :'}</span>
                      <span className="text-emerald-700 font-mono font-black">
                        {formatAmountPlain(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* BAS DU DOCUMENT : SIGNATURES, CACHET ET QR CODE DE SÉCURITÉ */}
            <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="grid grid-cols-2 print:grid-cols-2 gap-4 sm:gap-8 text-center text-xs flex-1 w-full">
                <div>
                  <div className="font-bold text-slate-800 mb-10">
                    {data.signatureRole1 || (lang === 'en' ? 'For the Client (Approved & Agreed)' : 'Pour le Client (Bon pour accord)')}
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    {lang === 'en' ? 'Handwritten signature & notice' : 'Signature & mention manuscrite'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 mb-10">
                    {data.signatureRole2 || (lang === 'en' ? 'For FCT Automobile (Management)' : 'Pour FCT Automobile (Direction)')}
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    {lang === 'en' ? 'Official stamp & certified signature' : 'Cachet humide & signature certifiée'}
                  </div>
                </div>
              </div>

              {/* QR Code de vérification de sécurité */}
              <div ref={qrRef} className="flex flex-col items-center justify-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0 text-center">
                <QRCodeSVG
                  value={qrPayload}
                  size={68}
                  level="M"
                  includeMargin={false}
                  className="rounded"
                />
                <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  {lang === 'en' ? 'FCT Verification' : 'Vérification FCT'}
                </span>
              </div>
            </div>

            {/* MENTION LÉGALE BAS DE PAGE */}
            <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-between">
              <span>Franchise Conseils Trading SARL — Douala, Cameroun</span>
              <span>{lang === 'en' ? 'Tamper-proof document certified by FCT Automobile ERP' : 'Document infalsifiable certifié par FCT ERP Automobile'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
