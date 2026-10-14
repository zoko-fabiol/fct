/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Visualiseur Universel de Documents Stockés
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 *
 * Fonctionnalités inspirées de CGA SPE (ViewQuittanceModal / OfficialReceiptModal) :
 * - Rendu haute-fidélité pour Images (zoom, rotation, plein écran, commandes tactiles)
 * - Rendu PDF avec navigation par pages via Cloudinary (pg_X) et carte native mobile sur Android
 * - Rendu Documents Office (Excel, Word) via visionneuse sécurisée
 * - Actions directes : Partage natif Android, Impression isolée, Téléchargement haute résolution, Copie d'URL
 * - 100% Responsive : Onglets mobiles ("Aperçu" / "Détails & Audit") sans débordement horizontal
 */

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ShieldCheck,
  Calendar,
  User,
  HardDrive,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Share2,
  Eye,
  Info,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import {
  getDocumentKind,
  getPdfPageImageUrl,
  getDownloadUrl,
  getImagePreviewUrl,
  isCloudinaryUrl,
} from '../../services/cloudinaryService.ts';
import { printElementById } from '../../utils/printDocument.ts';
import { isNativeMobile } from '../../services/mobileFileService.ts';
import { Share } from '@capacitor/share';
import { Language, translations } from '../../services/i18n.ts';

export interface ViewerDocument {
  id?: string;
  title: string;
  fileUrl: string;
  category?: string;
  categoryLabel?: string;
  size?: string;
  uploadedAt?: string;
  updatedAt?: string;
  author?: string;
  notes?: string;
  relatedEntityName?: string;
  isPrivate?: boolean;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ViewerDocument | null;
  lang?: Language;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  lang = 'fr',
}) => {
  const t = translations[lang].viewerModal;
  const isEn = lang === 'en';
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pdfRenderMode, setPdfRenderMode] = useState<'IMAGE_PAGE' | 'IFRAME'>('IMAGE_PAGE');
  const [mobileTab, setMobileTab] = useState<'VIEWER' | 'DETAILS'>('VIEWER');

  if (!isOpen || !doc || !doc.fileUrl) return null;

  const kind = getDocumentKind(doc.fileUrl);
  const isCloudinary = isCloudinaryUrl(doc.fileUrl);
  const isMobile = isNativeMobile();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(doc.fileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    const downloadUrl = isCloudinary ? getDownloadUrl(doc.fileUrl, doc.title) : doc.fileUrl;
    if (isMobile) {
      try {
        await Share.share({
          title: doc.title,
          text: `Document FCT Automobile — ${doc.title}`,
          url: downloadUrl,
          dialogTitle: isEn ? 'Open or share document' : 'Ouvrir ou partager le document',
        });
        return;
      } catch (err) {
        console.warn('Partage natif annulé:', err);
      }
    }
    const a = window.document.createElement('a');
    a.href = downloadUrl;
    a.download = doc.title || 'document';
    a.target = '_blank';
    a.rel = 'noreferrer';
    window.document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePrint = async () => {
    if (isMobile) {
      await handleDownload();
      return;
    }
    printElementById('fct-viewer-printable-content', doc.title || 'Document FCT');
  };

  const resetControls = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div
        className={`relative w-full bg-slate-900 border-0 sm:border border-slate-700/80 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 my-auto ${
          isFullscreen
            ? 'h-full max-h-full rounded-none'
            : 'max-w-5xl h-full sm:h-[90vh] sm:max-h-[calc(100dvh-2rem)]'
        }`}
      >
        {/* BARRE SUPÉRIEURE - ACTIONS PRINCIPALES & IDENTIFICATION */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#0a1e36] to-[#0f2a4a] text-white flex items-center justify-between gap-2 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0">
              {kind === 'PDF' ? (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
              ) : kind === 'OFFICE' ? (
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              ) : (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-slate-100 truncate" title={doc.title}>
                {doc.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {doc.categoryLabel || doc.category || 'Document Officiel FCT'}{' '}
                {doc.relatedEntityName ? `• ${doc.relatedEntityName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Commandes zoom & rotation desktop (pour mobile, elles sont dans la barre tactile en bas) */}
            {(kind === 'IMAGE' || (kind === 'PDF' && pdfRenderMode === 'IMAGE_PAGE')) && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg p-1 mr-1 text-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title={t.zoomOut}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[11px] text-slate-400 font-mono w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title={t.zoomIn}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white ml-1 border-l border-slate-700 pl-1.5"
                  title={t.rotate}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bouton Imprimer / Partager */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title={isMobile ? 'Partager / Imprimer' : t.print}
            >
              {isMobile ? (
                <Share2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-blue-400" />
              ) : (
                <Printer className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-blue-400" />
              )}
              <span className="hidden md:inline">{isMobile ? 'Partager' : t.print}</span>
            </button>

            {/* Bouton Télécharger */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title={t.download}
            >
              <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden md:inline">{isEn ? 'Download' : 'Télécharger'}</span>
            </button>

            {/* Bouton Copier le lien */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 sm:p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title={copied ? t.linkCopied : t.copyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Bouton Ouvrir externe */}
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 sm:p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition hidden sm:inline-flex"
              title={isEn ? 'Open in new tab' : 'Ouvrir dans un nouvel onglet'}
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Bouton Plein Écran (Desktop) */}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition hidden lg:inline-flex"
              title={isFullscreen ? t.exitFullscreen : t.fullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-600/80 transition ml-0.5 cursor-pointer"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ONGLETS MOBILES (< md:) : APERÇU vs DÉTAILS */}
        <div className="flex md:hidden border-b border-slate-800 bg-slate-900/95 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('VIEWER')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 font-bold transition border-b-2 ${
              mobileTab === 'VIEWER'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isEn ? 'Document Preview' : 'Aperçu Document'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('DETAILS')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 font-bold transition border-b-2 ${
              mobileTab === 'DETAILS'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{isEn ? 'Details & Audit' : 'Détails & Audit'}</span>
          </button>
        </div>

        {/* ZONE CENTRALE (VISUALISEUR + MÉTADONNÉES) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          {/* 1. ZONE D'AFFICHAGE DU DOCUMENT */}
          <div
            className={`flex-1 flex flex-col items-center justify-between relative select-none overflow-hidden ${
              mobileTab === 'VIEWER' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div
              id="fct-viewer-printable-content"
              className="flex-1 overflow-auto w-full p-2 sm:p-4 flex items-center justify-center"
            >
              {/* CAS 1 : IMAGE */}
              {kind === 'IMAGE' && (
                <div className="overflow-auto max-w-full max-h-full flex items-center justify-center p-1 sm:p-2">
                  <img
                    src={getImagePreviewUrl(doc.fileUrl, 1800)}
                    alt={doc.title}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-[62vh] sm:max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl bg-white/5"
                  />
                </div>
              )}

              {/* CAS 2 : PDF */}
              {kind === 'PDF' && (
                <div className="w-full h-full flex flex-col items-center justify-between gap-2">
                  {pdfRenderMode === 'IMAGE_PAGE' && isCloudinary ? (
                    <div className="flex-1 overflow-auto flex items-center justify-center w-full p-1 sm:p-2">
                      <img
                        src={getPdfPageImageUrl(doc.fileUrl, currentPage, 1400)}
                        alt={`Page ${currentPage} - ${doc.title}`}
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          transition: 'transform 0.15s ease-out',
                        }}
                        className="max-h-[60vh] sm:max-h-[66vh] max-w-full object-contain rounded-lg shadow-2xl bg-white border border-slate-700"
                        onError={() => setPdfRenderMode('IFRAME')}
                      />
                    </div>
                  ) : isMobile ? (
                    /* CARTE NATIVE SUR MOBILE LORSQUE LE PDF N'EST PAS UNE PAGE CLOUDINARY OU EN MODE NATIF */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 max-w-md mx-auto space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                          PDF Officiel FCT
                        </span>
                        <h4 className="font-bold text-slate-100 text-sm sm:text-base leading-snug">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {isEn
                            ? 'Open with your Android PDF viewer or share directly with clients.'
                            : 'Consultez ce document avec votre lecteur PDF Android officiel ou partagez-le directement.'}
                        </p>
                      </div>

                      <div className="flex flex-col w-full gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>{isEn ? 'Open in Android Reader' : 'Ouvrir dans Lecteur Android'}</span>
                        </button>

                        <a
                          href={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.fileUrl)}&embedded=true`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Google Docs Web Preview' : 'Aperçu Web Google Docs'}</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* IFRAME DESKTOP CLASSIQUE */
                    <div className="w-full h-full flex-1 overflow-hidden p-1 sm:p-2">
                      <iframe
                        src={doc.fileUrl}
                        title={doc.title}
                        className="w-full h-full min-h-[420px] rounded-lg border border-slate-700 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CAS 3 : OFFICE (EXCEL, WORD) */}
              {kind === 'OFFICE' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm sm:text-base leading-snug">{doc.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {isEn
                        ? 'Office workbook (Excel / Word). Download or preview in Google Docs.'
                        : 'Document bureautique (Excel / Word). Téléchargez ou visualisez en ligne.'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      {isEn ? 'Download Document' : 'Télécharger le classeur'}
                    </button>
                    <a
                      href={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.fileUrl)}&embedded=true`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
                    >
                      {isEn ? 'Google Docs Preview' : 'Aperçu Google Docs'}
                    </a>
                  </div>
                </div>
              )}

              {/* CAS 4 : AUTRE TYPE */}
              {kind === 'OTHER' && (
                <div className="text-center space-y-3 p-6 max-w-sm mx-auto">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300">
                    {isEn ? 'File format not directly previewable' : 'Format de fichier non prévisualisable directement'}
                  </p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                  >
                    {isEn ? 'Download file' : 'Télécharger le document'}
                  </button>
                </div>
              )}
            </div>

            {/* BARRE TACTILE DU BAS : ZOOM, PAGINATION ET CONTRÔLES (ACCESSIBLE AU POUCE SUR MOBILE & DESKTOP) */}
            <div className="w-full bg-slate-900/90 border-t border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
              {/* Contrôles de zoom tactiles (pour Images et Pages PDF) */}
              {(kind === 'IMAGE' || (kind === 'PDF' && pdfRenderMode === 'IMAGE_PAGE')) && (
                <div className="flex items-center gap-1 bg-slate-800 border border-slate-700/80 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title={t.zoomOut}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetControls}
                    className="px-1 text-[11px] text-slate-300 font-mono hover:text-white"
                    title="Réinitialiser"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title={t.zoomIn}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white border-l border-slate-700 ml-0.5"
                    title={t.rotate}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Pagination PDF Cloudinary */}
              {kind === 'PDF' && isCloudinary && (
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-xl text-slate-200">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded cursor-pointer"
                    title="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-slate-300 text-[11px]">
                    Page <span className="text-white font-bold">{currentPage}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                    title="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bascule de mode PDF */}
              {kind === 'PDF' && isCloudinary && !isMobile && (
                <button
                  type="button"
                  onClick={() =>
                    setPdfRenderMode((m) => (m === 'IMAGE_PAGE' ? 'IFRAME' : 'IMAGE_PAGE'))
                  }
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  {pdfRenderMode === 'IMAGE_PAGE' ? 'Vue navigateur' : 'Vue HD Cloudinary'}
                </button>
              )}
            </div>
          </div>

          {/* 2. VOLET LATÉRAL : MÉTADONNÉES & AUDIT (CÔTE À CÔTE SUR DESKTOP, ONGLET SUR MOBILE) */}
          <div
            className={`w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-slate-300 ${
              mobileTab === 'DETAILS' ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-slate-100 text-xs border-b border-slate-800 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? 'FCT Vault Douala' : 'Coffre-fort FCT Douala'}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  {isEn ? 'Document title' : 'Titre du document'}
                </label>
                <p className="font-semibold text-slate-100 break-words">{doc.title}</p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  {t.category}
                </label>
                <span className="inline-block px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-semibold text-[11px]">
                  {doc.categoryLabel || doc.category || (isEn ? 'Commercial Document' : 'Document Commercial')}
                </span>
              </div>

              {doc.relatedEntityName && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    {t.relatedEntity}
                  </label>
                  <p className="text-slate-200 font-medium">{doc.relatedEntityName}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" /> {t.uploadDate}
                  </label>
                  <p className="text-slate-300">
                    {doc.uploadedAt ? doc.uploadedAt.split('T')[0] : doc.updatedAt || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                    <HardDrive className="w-3 h-3 text-slate-400" /> {isEn ? 'Size' : 'Taille'}
                  </label>
                  <p className="text-slate-300">{doc.size || (isEn ? 'Cloudinary Certified' : 'Certifié Cloudinary')}</p>
                </div>
              </div>

              {doc.author && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                    <User className="w-3 h-3 text-slate-400" /> {t.uploadedBy}
                  </label>
                  <p className="text-slate-300">{doc.author}</p>
                </div>
              )}

              {doc.notes && (
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
                  <span className="font-bold text-slate-200 block">{isEn ? 'Remarks:' : 'Observations :'}</span>
                  <p className="italic text-slate-400">{doc.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isEn ? 'Cloud Storage' : 'Stockage Cloud'}</span>
                  <span className="font-mono text-emerald-400 font-bold">Cloudinary FCT</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isEn ? 'SSL Encryption' : 'Chiffrement SSL'}</span>
                  <span className="text-slate-300">HTTPS TLS 1.3</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isEn ? 'Privacy' : 'Protection'}</span>
                  <span className="text-amber-300 font-semibold">
                    {doc.isPrivate !== false ? (isEn ? 'Internal Confidential' : 'Confidentiel Interne') : (isEn ? 'Public' : 'Public')}
                  </span>
                </div>
              </div>

              {/* Bouton pour revenir à la vue document sur mobile */}
              <div className="md:hidden pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMobileTab('VIEWER')}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isEn ? 'Back to Document' : 'Retourner au Document'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
