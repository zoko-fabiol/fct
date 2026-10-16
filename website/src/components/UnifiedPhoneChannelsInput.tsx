import React, { useState, useEffect } from 'react';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';
import { OrangeMoneyLogo, MtnMomoLogo, OrangeLogo, MtnLogo } from './PaymentLogos.tsx';
import { validateCameroonPhone } from '../services/profileService.ts';
import { CheckCircle2, Plus, RefreshCw, Smartphone, PhoneCall, AlertCircle } from 'lucide-react';

export interface UnifiedPhoneChannelsProps {
  phone: string;
  whatsappPhone: string;
  payoutPhone?: string;
  payoutMethod?: 'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH';
  onChange: (values: {
    phone: string;
    whatsappPhone: string;
    payoutPhone: string;
    payoutMethod?: 'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH';
    isWhatsappSame: boolean;
    isPayoutSame: boolean;
  }) => void;
  disabled?: boolean;
  showPayoutChannel?: boolean;
  lang?: 'fr' | 'en';
  labelPhone?: string;
}

export const UnifiedPhoneChannelsInput: React.FC<UnifiedPhoneChannelsProps> = ({
  phone,
  whatsappPhone,
  payoutPhone = '',
  payoutMethod = 'ORANGE_MONEY',
  onChange,
  disabled = false,
  showPayoutChannel = true,
  lang = 'fr',
  labelPhone,
}) => {
  const isEn = lang === 'en';

  // Détection si les numéros secondaires sont identiques au numéro principal
  const isWhatsappInitiallySame = !whatsappPhone || whatsappPhone.trim() === phone.trim();
  const isPayoutInitiallySame = !payoutPhone || payoutPhone.trim() === phone.trim();

  const [isWhatsappSame, setIsWhatsappSame] = useState<boolean>(isWhatsappInitiallySame);
  const [isPayoutSame, setIsPayoutSame] = useState<boolean>(isPayoutInitiallySame);

  // Synchronisation interne si l'état parent change
  useEffect(() => {
    if (whatsappPhone && phone && whatsappPhone.trim() !== phone.trim()) {
      setIsWhatsappSame(false);
    }
  }, [whatsappPhone, phone]);

  useEffect(() => {
    if (payoutPhone && phone && payoutPhone.trim() !== phone.trim()) {
      setIsPayoutSame(false);
    }
  }, [payoutPhone, phone]);

  // Analyse et validation de l'opérateur pour le numéro principal
  const mainPhoneAnalysis = validateCameroonPhone(phone);
  const detectedOperator = mainPhoneAnalysis.operator;

  // Gestion de la saisie du numéro principal
  const handleMainPhoneChange = (newPhone: string) => {
    const updatedWhatsapp = isWhatsappSame ? newPhone : whatsappPhone;
    const updatedPayout = isPayoutSame ? newPhone : payoutPhone;

    // Détection automatique de l'opérateur de paiement si "même numéro"
    let updatedPayoutMethod = payoutMethod;
    if (isPayoutSame && payoutMethod !== 'CASH') {
      const analysis = validateCameroonPhone(newPhone);
      if (analysis.operator === 'ORANGE') {
        updatedPayoutMethod = 'ORANGE_MONEY';
      } else if (analysis.operator === 'MTN') {
        updatedPayoutMethod = 'MTN_MOMO';
      }
    }

    onChange({
      phone: newPhone,
      whatsappPhone: updatedWhatsapp,
      payoutPhone: updatedPayout,
      payoutMethod: updatedPayoutMethod,
      isWhatsappSame,
      isPayoutSame,
    });
  };

  // Bascule du canal WhatsApp (même numéro vs numéro séparé)
  const toggleWhatsappSame = (makeSame: boolean) => {
    setIsWhatsappSame(makeSame);
    const newWhatsappPhone = makeSame ? phone : (whatsappPhone || phone);
    onChange({
      phone,
      whatsappPhone: newWhatsappPhone,
      payoutPhone,
      payoutMethod,
      isWhatsappSame: makeSame,
      isPayoutSame,
    });
  };

  // Bascule du canal Mobile Money (même numéro vs numéro séparé)
  const togglePayoutSame = (makeSame: boolean) => {
    setIsPayoutSame(makeSame);
    const newPayoutPhone = makeSame ? phone : (payoutPhone || phone);
    onChange({
      phone,
      whatsappPhone,
      payoutPhone: newPayoutPhone,
      payoutMethod,
      isWhatsappSame,
      isPayoutSame: makeSame,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Champ Numéro Principal (Appel) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--text-body)' }}>
            <PhoneCall size={14} style={{ color: '#1e3a8a' }} />
            <span>{labelPhone || (isEn ? 'Primary Phone Number (Calls)' : 'Numéro de téléphone principal (Appels)')}</span>
          </label>

          {/* Badge opérateur détecté en temps réel */}
          {phone.trim().length >= 4 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 999,
                backgroundColor:
                  detectedOperator === 'ORANGE'
                    ? '#fff7ed'
                    : detectedOperator === 'MTN'
                    ? '#fefce8'
                    : '#f1f5f9',
                color:
                  detectedOperator === 'ORANGE'
                    ? '#c2410c'
                    : detectedOperator === 'MTN'
                    ? '#854d0e'
                    : '#64748b',
                border:
                  detectedOperator === 'ORANGE'
                    ? '1px solid #ffedd5'
                    : detectedOperator === 'MTN'
                    ? '1px solid #fef08a'
                    : '1px solid #e2e8f0',
              }}
            >
              {detectedOperator === 'ORANGE' && <OrangeLogo size={15} />}
              {detectedOperator === 'MTN' && <MtnLogo size={15} />}
              <span>
                {detectedOperator === 'ORANGE'
                  ? isEn
                    ? 'Orange Network'
                    : 'Réseau Orange'
                  : detectedOperator === 'MTN'
                  ? isEn
                    ? 'MTN Network'
                    : 'Réseau MTN'
                  : isEn
                  ? 'Other / Landline'
                  : 'Autre réseau'}
              </span>
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="tel"
            disabled={disabled}
            value={phone}
            onChange={(e) => handleMainPhoneChange(e.target.value)}
            placeholder={isEn ? '699 45 88 12 or +237 ...' : '699 45 88 12 ou +237 ...'}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-medium)',
              fontSize: 13.5,
              fontWeight: 600,
              backgroundColor: disabled ? '#f8fafc' : '#ffffff',
            }}
          />
        </div>

        {/* 2. Barre intelligente des Canaux Connectés (WhatsApp & Mobile Money) */}
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)', marginRight: 2 }}>
            {isEn ? 'Connected Channels:' : 'Canaux connectés :'}
          </span>

          {/* Badge WhatsApp */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => toggleWhatsappSame(!isWhatsappSame)}
            title={
              isWhatsappSame
                ? isEn
                  ? 'Click to set a separate WhatsApp number'
                  : 'Cliquez pour définir un numéro WhatsApp distinct'
                : isEn
                  ? 'Click to use the same number as primary phone'
                  : 'Cliquez pour réutiliser le même numéro que l’appel'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.18s ease',
              border: isWhatsappSame
                ? '1px solid #86efac'
                : '1px dashed #cbd5e1',
              backgroundColor: isWhatsappSame
                ? '#f0fdf4'
                : '#f8fafc',
              color: isWhatsappSame ? '#15803d' : '#64748b',
            }}
          >
            <WhatsAppIcon size={14} color={isWhatsappSame ? '#16a34a' : '#94a3b8'} />
            <span>WhatsApp</span>
            {isWhatsappSame ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#16a34a' }}>
                <CheckCircle2 size={13} />
                <span style={{ fontSize: 10.5, fontWeight: 800 }}>
                  {isEn ? 'Same' : 'Même n°'}
                </span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#0284c7' }}>
                <Plus size={12} />
                <span style={{ fontSize: 10.5, fontWeight: 800 }}>
                  {isEn ? 'Different' : 'Autre n°'}
                </span>
              </span>
            )}
          </button>

          {/* Badge Mobile Money (Orange Money / MTN MoMo) */}
          {showPayoutChannel && payoutMethod !== 'CASH' && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => togglePayoutSame(!isPayoutSame)}
              title={
                isPayoutSame
                  ? isEn
                    ? 'Click to set a separate Mobile Money number'
                    : 'Cliquez pour définir un numéro Mobile Money distinct'
                  : isEn
                    ? 'Click to use the same number as primary phone'
                    : 'Cliquez pour réutiliser le même numéro que l’appel'
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.18s ease',
                border: isPayoutSame
                  ? payoutMethod === 'ORANGE_MONEY'
                    ? '1px solid #fed7aa'
                    : '1px solid #fef08a'
                  : '1px dashed #cbd5e1',
                backgroundColor: isPayoutSame
                  ? payoutMethod === 'ORANGE_MONEY'
                    ? '#fff7ed'
                    : '#fefce8'
                  : '#f8fafc',
                color: isPayoutSame
                  ? payoutMethod === 'ORANGE_MONEY'
                    ? '#c2410c'
                    : '#854d0e'
                  : '#64748b',
              }}
            >
              {payoutMethod === 'ORANGE_MONEY' ? (
                <OrangeMoneyLogo size={14} className={!isPayoutSame ? 'opacity-50 grayscale' : ''} />
              ) : (
                <MtnMomoLogo size={14} className={!isPayoutSame ? 'opacity-50 grayscale' : ''} />
              )}
              <span>{payoutMethod === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo'}</span>
              {isPayoutSame ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle2 size={13} />
                  <span style={{ fontSize: 10.5, fontWeight: 800 }}>
                    {isEn ? 'Same' : 'Même n°'}
                  </span>
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#0284c7' }}>
                  <Plus size={12} />
                  <span style={{ fontSize: 10.5, fontWeight: 800 }}>
                    {isEn ? 'Different' : 'Autre n°'}
                  </span>
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3. Champ dynamique WhatsApp dédié (si dissocié) */}
      {!isWhatsappSame && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#166534' }}>
              <WhatsAppIcon size={14} color="#16a34a" />
              <span>{isEn ? 'Specific WhatsApp Number:' : 'Numéro WhatsApp spécifique :'}</span>
            </label>
            <button
              type="button"
              onClick={() => toggleWhatsappSame(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 700,
                color: '#15803d',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              <RefreshCw size={11} />
              <span>{isEn ? 'Use primary phone' : 'Réaligner sur le téléphone principal'}</span>
            </button>
          </div>
          <input
            type="tel"
            disabled={disabled}
            value={whatsappPhone}
            onChange={(e) =>
              onChange({
                phone,
                whatsappPhone: e.target.value,
                payoutPhone,
                payoutMethod,
                isWhatsappSame: false,
                isPayoutSame,
              })
            }
            placeholder="677 12 34 56 (WhatsApp)"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #86efac',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      )}

      {/* 4. Champ dynamique Mobile Money dédié (si dissocié) */}
      {showPayoutChannel && !isPayoutSame && payoutMethod !== 'CASH' && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            backgroundColor: payoutMethod === 'ORANGE_MONEY' ? '#fff7ed' : '#fefce8',
            border:
              payoutMethod === 'ORANGE_MONEY'
                ? '1px solid #fed7aa'
                : '1px solid #fef08a',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: payoutMethod === 'ORANGE_MONEY' ? '#9a3412' : '#854d0e',
              }}
            >
              {payoutMethod === 'ORANGE_MONEY' ? (
                <OrangeMoneyLogo size={14} />
              ) : (
                <MtnMomoLogo size={14} />
              )}
              <span>
                {payoutMethod === 'ORANGE_MONEY'
                  ? isEn
                    ? 'Specific Orange Money Number:'
                    : 'Numéro Orange Money spécifique :'
                  : isEn
                    ? 'Specific MTN MoMo Number:'
                    : 'Numéro MTN MoMo spécifique :'}
              </span>
            </label>
            <button
              type="button"
              onClick={() => togglePayoutSame(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 700,
                color: payoutMethod === 'ORANGE_MONEY' ? '#c2410c' : '#854d0e',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              <RefreshCw size={11} />
              <span>{isEn ? 'Use primary phone' : 'Réaligner sur le téléphone principal'}</span>
            </button>
          </div>
          <input
            type="tel"
            disabled={disabled}
            value={payoutPhone}
            onChange={(e) =>
              onChange({
                phone,
                whatsappPhone,
                payoutPhone: e.target.value,
                payoutMethod,
                isWhatsappSame,
                isPayoutSame: false,
              })
            }
            placeholder={
              payoutMethod === 'ORANGE_MONEY'
                ? '699 00 00 00 (Orange Money)'
                : '677 00 00 00 (MTN MoMo)'
            }
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border:
                payoutMethod === 'ORANGE_MONEY'
                  ? '1px solid #fdba74'
                  : '1px solid #fde047',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      )}
    </div>
  );
};
