/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Visualiseur Universel de Documents Stockés
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 *
 * Fonctionnalités inspirées de CGA SPE (ViewQuittanceModal / OfficialReceiptModal) :
 * - Rendu haute-fidélité pour Images (zoom, rotation, plein écran)
 * - Rendu PDF avec navigation par pages via Cloudinary (pg_X) et iframe de lecture
 * - Rendu Documents Office (Excel, Word) via visionneuse sécurisée
 * - Actions directes : Impression isolée, Téléchargement haute résolution, Copie d'URL
 * - Métadonnées d'audit (auteur, entité rattachée, date, conformité)
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
} from 'lucide-react';
import {
  getDocumentKind,
  getPdfPageImageUrl,
  getDownloadUrl,
  getImagePreviewUrl,
  isCloudinaryUrl,
} from '../../services/cloudinaryService.ts';
import { printElementById } from '../../utils/printDocument.ts';

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
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfRenderMode, setPdfRenderMode] = useState<'IMAGE_PAGE' | 'IFRAME'>('IMAGE_PAGE');

  if (!isOpen || !doc || !doc.fileUrl) return null;

  const kind = getDocumentKind(doc.fileUrl);
  const isCloudinary = isCloudinaryUrl(doc.fileUrl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(doc.fileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const downloadUrl = isCloudinary ? getDownloadUrl(doc.fileUrl, doc.title) : doc.fileUrl;
    const a = window.document.createElement('a');
    a.href = downloadUrl;
    a.download = doc.title || 'document';
    a.target = '_blank';
    a.rel = 'noreferrer';
    window.document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePrint = () => {
    printElementById('fct-viewer-printable-content', doc.title || 'Document FCT');
  };

  const resetControls = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'h-full max-h-full' : 'max-w-5xl max-h-[92vh] h-[85vh]'
        }`}
      >
        {/* BARRE SUPÉRIEURE - ACTIONS PRINCIPALES */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0a1e36] to-[#0f2a4a] text-white flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0">
              {kind === 'PDF' ? (
                <FileText className="w-5 h-5 text-rose-400" />
              ) : kind === 'OFFICE' ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              ) : (
                <FileText className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="truncate">
              <h3 className="font-bold text-sm text-slate-100 truncate" title={doc.title}>
                {doc.title}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {doc.categoryLabel || doc.category || 'Document Officiel FCT'}{' '}
                {doc.relatedEntityName ? `• ${doc.relatedEntityName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Commandes zoom & rotation pour images et pages PDF */}
            {(kind === 'IMAGE' || (kind === 'PDF' && pdfRenderMode === 'IMAGE_PAGE')) && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg p-1 mr-2 text-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="Zoom arrière"
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
                  title="Zoom avant"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white ml-1 border-l border-slate-700 pl-1.5"
                  title="Pivoter de 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Imprimer ce document"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Imprimer</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="Télécharger le fichier original"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Télécharger</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Copier le lien du document"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition hidden sm:block"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600/80 transition ml-1"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ZONE DE CONTENU CENTRAL (VISUALISEUR + MÉTADONNÉES) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          {/* ZONE D'AFFICHAGE DU DOCUMENT */}
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center relative select-none">
            <div id="fct-viewer-printable-content" className="flex items-center justify-center w-full h-full">
              {kind === 'IMAGE' && (
                <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={getImagePreviewUrl(doc.fileUrl, 1800)}
                    alt={doc.title}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl bg-white/5"
                  />
                </div>
              )}

              {kind === 'PDF' && (
                <div className="w-full h-full flex flex-col items-center justify-between gap-3">
                  {pdfRenderMode === 'IMAGE_PAGE' && isCloudinary ? (
                    <div className="flex-1 overflow-auto flex items-center justify-center w-full">
                      <img
                        src={getPdfPageImageUrl(doc.fileUrl, currentPage, 1400)}
                        alt={`Page ${currentPage} - ${doc.title}`}
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          transition: 'transform 0.15s ease-out',
                        }}
                        className="max-h-[66vh] max-w-full object-contain rounded-lg shadow-2xl bg-white border border-slate-700"
                        onError={() => setPdfRenderMode('IFRAME')}
                      />
                    </div>
                  ) : (
                    <iframe
                      src={doc.fileUrl}
                      title={doc.title}
                      className="w-full h-full min-h-[500px] rounded-lg border border-slate-700 bg-white"
                    />
                  )}

                  {/* Contrôles pagination PDF */}
                  {isCloudinary && (
                    <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded cursor-pointer"
                        title="Page précédente"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-slate-300">
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
                      <span className="text-slate-500">|</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPdfRenderMode((m) => (m === 'IMAGE_PAGE' ? 'IFRAME' : 'IMAGE_PAGE'))
                        }
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium"
                      >
                        {pdfRenderMode === 'IMAGE_PAGE' ? 'Vue navigateur' : 'Vue HD Cloudinary'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {kind === 'OFFICE' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{doc.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      Document bureautique (Excel / Word). Pour l'afficher ou le modifier, ouvrez-le
                      directement ou téléchargez le fichier original.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      Télécharger le classeur
                    </button>
                    <a
                      href={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.fileUrl)}&embedded=true`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
                    >
                      Aperçu Google Docs
                    </a>
                  </div>
                </div>
              )}

              {kind === 'OTHER' && (
                <div className="text-center space-y-3 p-6">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300">Format de fichier non prévisualisable directement</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                  >
                    Télécharger le document
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* VOLET LATÉRAL : MÉTADONNÉES & AUDIT */}
          <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-xs border-b border-slate-800 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Coffre-fort FCT Douala</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  Titre du document
                </label>
                <p className="font-semibold text-slate-100 break-words">{doc.title}</p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  Catégorie
                </label>
                <span className="inline-block px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-semibold text-[11px]">
                  {doc.categoryLabel || doc.category || 'Document Commercial'}
                </span>
              </div>

              {doc.relatedEntityName && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Entité rattachée
                  </label>
                  <p className="text-slate-200 font-medium">{doc.relatedEntityName}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" /> Date d'ajout
                  </label>
                  <p className="text-slate-300">
                    {doc.uploadedAt ? doc.uploadedAt.split('T')[0] : doc.updatedAt || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                    <HardDrive className="w-3 h-3 text-slate-400" /> Taille
                  </label>
                  <p className="text-slate-300">{doc.size || 'Certifié Cloudinary'}</p>
                </div>
              </div>

              {doc.author && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                    <User className="w-3 h-3 text-slate-400" /> Opérateur / Dépositaire
                  </label>
                  <p className="text-slate-300">{doc.author}</p>
                </div>
              )}

              {doc.notes && (
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
                  <span className="font-bold text-slate-200 block">Observations :</span>
                  <p className="italic text-slate-400">{doc.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Stockage Cloud</span>
                  <span className="font-mono text-emerald-400 font-bold">Cloudinary FCT</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Chiffrement SSL</span>
                  <span className="text-slate-300">HTTPS TLS 1.3</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Protection</span>
                  <span className="text-amber-300 font-semibold">
                    {doc.isPrivate !== false ? 'Confidentiel Interne' : 'Public'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
