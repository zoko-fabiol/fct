import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { websiteTranslations } from '../services/i18n.ts';

interface PinVerificationModalProps {
  isOpen: boolean;
  email: string;
  onVerify: (pin: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<void>;
  onCancel: () => void;
  isEn?: boolean;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  email,
  onVerify,
  onResend,
  onCancel,
  isEn = false,
}) => {
  const t = websiteTranslations[isEn ? 'en' : 'fr']?.auth || websiteTranslations.fr.auth;
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError('');
      return;
    }
    setResendCountdown(30);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, resendCountdown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length !== 6) {
      setError(isEn ? 'Please enter the 6-digit PIN code.' : 'Veuillez saisir le code PIN à 6 chiffres.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await onVerify(pin.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || (isEn ? 'Invalid verification code.' : 'Code de vérification invalide.'));
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    setError('');
    await onResend();
    setResending(false);
    setResendCountdown(30);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 42, 74, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#ffffff',
          borderRadius: 22,
          boxShadow: '0 25px 50px -12px rgba(15, 42, 74, 0.35)',
          border: '1.5px solid var(--border-subtle, #cbd5e1)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            background: 'linear-gradient(135deg, rgba(15,42,74,0.04) 0%, rgba(30,58,138,0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: 'var(--fct-blue-soft, #e0e7ff)',
              color: 'var(--fct-blue-dark, #0f2a4a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 16.5, fontWeight: 900, color: 'var(--fct-blue-dark, #0f2a4a)' }}>
              {t.pinModalTitle}
            </h4>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-sub, #475569)' }}>
              {t.pinExpiryNotice}
            </p>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '26px' }}>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-sub, #475569)', lineHeight: 1.55 }}>
            {t.pinModalDesc}{' '}
            <strong style={{ color: 'var(--fct-blue-dark, #0f2a4a)' }}>{email}</strong>
          </p>

          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                backgroundColor: '#fef2f2',
                border: '1px solid #ef4444',
                color: '#991b1b',
                fontSize: 12.5,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-sub, #475569)',
                  marginBottom: 8,
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                }}
              >
                {t.pinPlaceholder}
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="••••••"
                autoFocus
                style={{
                  width: '100%',
                  height: 56,
                  textAlign: 'center',
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: 10,
                  borderRadius: 12,
                  border: '2px solid var(--fct-blue-primary, #1e3a8a)',
                  backgroundColor: '#f8fafc',
                  color: 'var(--fct-blue-dark, #0f2a4a)',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(30, 58, 138, 0.1)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 22,
                fontSize: 12,
                color: 'var(--text-muted, #64748b)',
              }}
            >
              <span>{t.pinExpiryNotice}</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCountdown > 0 || resending}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: resendCountdown > 0 ? 'var(--text-muted, #94a3b8)' : 'var(--fct-blue-primary, #1e3a8a)',
                  fontWeight: 700,
                  cursor: resendCountdown > 0 ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <RefreshCw size={13} style={resending ? { animation: 'spin 1s linear infinite' } : {}} />
                <span>
                  {resendCountdown > 0
                    ? isEn
                      ? `Resend in ${resendCountdown}s`
                      : `Renvoyer (${resendCountdown}s)`
                    : t.resendPinBtn}
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onCancel}
                className="fct-btn fct-btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                <ArrowLeft size={14} />
                <span>{t.cancelBtn || (isEn ? 'Edit Info' : 'Modifier')}</span>
              </button>
              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="fct-btn fct-btn-primary"
                style={{ flex: 1.5, padding: '12px' }}
              >
                {loading ? (
                  <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{t.verifyPinBtn}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
