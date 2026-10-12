/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Modal Sécurisé de Confirmation de Suppression
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Language, translations } from '../services/i18n.ts';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemDetails?: string;
  warningMessage?: string;
  warningDetails?: string;
  confirmLabel?: string;
  requireReason?: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: (reason: string) => void;
  lang?: Language;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemDetails,
  warningMessage,
  warningDetails,
  confirmLabel,
  requireReason = false,
  onClose,
  onCancel,
  onConfirm,
  lang = 'fr',
}) => {
  const t = translations[lang];
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Veuillez indiquer un motif pour la traçabilité comptable/audit.');
      return;
    }
    setError(null);
    onConfirm(reason.trim());
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4 my-8 border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Action irréversible et auditée</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target item badge */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-800 break-words">{itemName}</div>
          {itemDetails && <div className="text-[11px] text-slate-500">{itemDetails}</div>}
        </div>

        {/* Warning text */}
        <p className="text-xs text-rose-700 bg-rose-50/80 p-2.5 rounded-lg border border-rose-200">
          {warningDetails ||
            warningMessage ||
            t.deleteModal.warning}
        </p>

        {/* Reason Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {lang === 'fr' ? 'Motif de suppression' : 'Reason for deletion'} {requireReason ? '*' : (lang === 'fr' ? '(optionnel)' : '(optional)')}
          </label>
          <input
            type="text"
            placeholder={lang === 'fr' ? 'Ex : Erreur de saisie, véhicule cédé, doublon...' : 'E.g.: Entry error, sold vehicle, duplicate...'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-300 focus:outline-none focus:border-rose-500"
          />
          {error && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel || t.deleteModal.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
