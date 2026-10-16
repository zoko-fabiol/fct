/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Composant Déposer & Téléverser Cloudinary
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, Image as ImageIcon, X, Link } from 'lucide-react';
import { uploadToCloudinary, CloudinaryUploadResult, getOptimizedCloudinaryUrl, getDocumentKind, isCloudinaryUrl } from '../../services/cloudinaryService.ts';
import { Language, translations } from '../../services/i18n.ts';

interface CloudinaryUploadDropzoneProps {
  onUploadSuccess: (secureUrl: string, result?: CloudinaryUploadResult) => void;
  onMultipleUploadSuccess?: (urls: string[]) => void;
  multiple?: boolean;
  folder?: string;
  accept?: string;
  label?: string;
  helperText?: string;
  currentValue?: string;
  onClear?: () => void;
  lang?: Language;
}

export const CloudinaryUploadDropzone: React.FC<CloudinaryUploadDropzoneProps> = ({
  onUploadSuccess,
  onMultipleUploadSuccess,
  multiple = false,
  folder = 'fct_automobile/documents',
  accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt',
  label,
  helperText,
  currentValue,
  onClear,
  lang = 'fr',
}) => {
  const t = translations[lang].uploadDropzone;
  const isEn = lang === 'en';
  const effectiveLabel = label || t.defaultLabel;
  const effectiveHelper = helperText || t.defaultHelper;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentValue || null);
  const [mode, setMode] = useState<'FILE' | 'URL'>('FILE');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      if (multiple && onMultipleUploadSuccess) {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadStatus(
            isEn
              ? `Uploading file ${i + 1}/${files.length} (${file.name})…`
              : `Téléversement du fichier ${i + 1}/${files.length} (${file.name})…`
          );
          const res = await uploadToCloudinary(file, {
            folder,
            onProgress: (p) => setProgress(Math.round(((i + p / 100) / files.length) * 100)),
          });
          uploadedUrls.push(res.secure_url);
        }
        setProgress(100);
        setUploadStatus('');
        onMultipleUploadSuccess(uploadedUrls);
        if (uploadedUrls.length > 0) {
          setUploadedUrl(uploadedUrls[0]);
        }
      } else {
        const file = files[0];
        setUploadStatus(
          isEn ? `Uploading ${file.name}…` : `Téléversement de ${file.name}…`
        );
        const res = await uploadToCloudinary(file, { folder, onProgress: setProgress });
        setUploadedUrl(res.secure_url);
        onUploadSuccess(res.secure_url, res);
      }
    } catch (err: any) {
      setError(
        err.message ||
          (isEn
            ? 'Error uploading file to Cloudinary'
            : 'Erreur lors du téléversement vers Cloudinary')
      );
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    if (multiple && onMultipleUploadSuccess) {
      const urls = urlInput
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.startsWith('http://') || u.startsWith('https://'));
      if (urls.length > 0) {
        onMultipleUploadSuccess(urls);
        setUploadedUrl(urls[0]);
        setUrlInput('');
      } else {
        setUploadedUrl(urlInput.trim());
        onUploadSuccess(urlInput.trim());
        setUrlInput('');
      }
    } else {
      setUploadedUrl(urlInput.trim());
      onUploadSuccess(urlInput.trim());
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear?.();
  };

  const kind = getDocumentKind(uploadedUrl);
  const showThumb = kind === 'IMAGE' || (kind === 'PDF' && isCloudinaryUrl(uploadedUrl));

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="block text-slate-700 font-bold">{effectiveLabel}</label>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setMode('FILE')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${
              mode === 'FILE' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.fileMode}
          </button>
          <button
            type="button"
            onClick={() => setMode('URL')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${
              mode === 'URL' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.urlMode}
          </button>
        </div>
      </div>

      {uploadedUrl ? (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {!showThumb ? (
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={getOptimizedCloudinaryUrl(uploadedUrl, { width: 80, height: 80 })}
                alt={isEn ? 'Preview' : 'Aperçu'}
                className="w-10 h-10 rounded-lg object-cover border border-emerald-300 shrink-0 bg-white"
              />
            )}
            <div className="overflow-hidden">
              <div className="flex items-center gap-1 font-bold text-emerald-950 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'File uploaded to Cloudinary FCT' : 'Fichier téléversé sur Cloudinary FCT'}</span>
              </div>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-800 hover:underline truncate block"
              >
                {uploadedUrl}
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-rose-600 border border-emerald-200 cursor-pointer shadow-2xs transition shrink-0"
            title={isEn ? 'Remove file' : 'Supprimer ce fichier'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : mode === 'FILE' ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isUploading
              ? 'bg-blue-50/60 border-blue-400'
              : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesSelected(e.target.files);
              }
            }}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="font-bold text-blue-900 text-xs text-center max-w-xs">
                {uploadStatus || `${t.uploadingFile} ${progress}%`}
              </span>
              <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">
                  {t.dragFilesHere} {t.orBrowse}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{effectiveHelper}</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={
              multiple
                ? (isEn ? 'https://... (or multiple comma-separated URLs)' : 'https://... (ou plusieurs URLs séparées par des virgules)')
                : 'https://res.cloudinary.com/...'
            }
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            {t.applyUrl}
          </button>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
