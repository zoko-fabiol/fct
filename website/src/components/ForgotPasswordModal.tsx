import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, X, ArrowLeft, Send, Clock } from 'lucide-react';
import { sendPasswordReset } from '../services/authSecurityService.ts';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  isEn?: boolean;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  isEn = false,
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({
        type: 'error',
        text: isEn ? 'Please enter a valid email address.' : 'Veuillez saisir une adresse e-mail valide.',
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const res = await sendPasswordReset(email.trim());
    setLoading(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: isEn
          ? `A secure reset email was sent to ${email.trim()}. Please check your inbox or spam folder.`
          : `Un e-mail de réinitialisation sécurisé a été envoyé à ${email.trim()}. Vérifiez votre boîte de réception ou vos courriers indésirables.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 42, 74, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 40px -10px rgba(15, 42, 74, 0.3)',
          border: '1.5px solid var(--border-subtle, #cbd5e1)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(15,42,74,0.03) 0%, rgba(30,58,138,0.05) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'var(--fct-blue-soft, #e0e7ff)',
                color: 'var(--fct-blue-dark, #0f2a4a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--fct-blue-dark, #0f2a4a)' }}>
                {isEn ? 'Password Recovery' : 'Mot de Passe Oublié'}
              </h4>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-sub, #475569)' }}>
                {isEn ? 'Official FCT secure link' : 'Lien sécurisé officiel FCT'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          {statusMessage ? (
            <div>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: statusMessage.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
                  color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                )}
                <div>{statusMessage.text}</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {statusMessage.type === 'error' && (
                  <button
                    type="button"
                    onClick={() => setStatusMessage(null)}
                    className="fct-btn fct-btn-secondary"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    <ArrowLeft size={14} />
                    <span>{isEn ? 'Retry' : 'Réessayer'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="fct-btn fct-btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  <span>{isEn ? 'Back to Sign In' : 'Retour à la Connexion'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-sub, #475569)', lineHeight: 1.5 }}>
                {isEn
                  ? 'Enter your account email. We will send you an official secure link allowing you to reset your password.'
                  : 'Saisissez l’adresse e-mail de votre compte. Nous vous transmettrons un lien officiel sécurisé pour réinitialiser votre mot de passe.'}
              </p>

              <div className="fct-field" style={{ marginBottom: 20 }}>
                <label className="fct-label">{isEn ? 'Email Address *' : 'Adresse Email *'}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="fct-input"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="fct-btn fct-btn-secondary"
                  style={{ flex: 1, padding: '11px' }}
                >
                  <span>{isEn ? 'Cancel' : 'Annuler'}</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="fct-btn fct-btn-primary"
                  style={{ flex: 1.5, padding: '11px' }}
                >
                  {loading ? (
                    <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <Send size={15} />
                      <span>{isEn ? 'Send Reset Link' : 'Envoyer le Lien'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
