/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Page Profil & Mon Compte (Adhérents & Partenaires)
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  CreditCard,
  LogOut,
  ArrowLeft,
  Smartphone,
  Share2,
  TrendingUp,
  Award,
  Lock,
} from 'lucide-react';
import {
  UnifiedUserProfile,
  validateCameroonPhone,
  saveUserProfile,
  getUserProfile,
  getCachedUserProfile,
  setCachedUserProfile,
} from '../services/profileService.ts';
import { auth, onAuthStateChanged } from '../services/firebase.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';
import { OrangeMoneyLogo, MtnMomoLogo, CashDeskLogo } from '../components/PaymentLogos.tsx';
import { UnifiedPhoneChannelsInput } from '../components/UnifiedPhoneChannelsInput.tsx';

interface ProfilePageProps {
  initialProfile?: UnifiedUserProfile | null;
  lang?: WebsiteLanguage;
  onLogout: () => void;
  onBack: () => void;
  onToast: (msg: string) => void;
  onNavigateToAuth?: (type: 'client' | 'partner') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  initialProfile,
  lang = 'fr',
  onLogout,
  onBack,
  onToast,
  onNavigateToAuth,
}) => {
  const isEn = lang === 'en';
  const t = websiteTranslations[lang]?.profile || websiteTranslations.fr.profile;
  const cachedProf = initialProfile || getCachedUserProfile();
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(() => {
    if (cachedProf) return cachedProf;
    if (auth.currentUser) {
      return {
        id: auth.currentUser.uid,
        accountType: 'CLIENT',
        fullName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Adhérent FCT',
        email: auth.currentUser.email || '',
        phone: auth.currentUser.phoneNumber || '',
        whatsappPhone: auth.currentUser.phoneNumber || '',
        city: 'Douala',
        payoutMethod: 'ORANGE_MONEY',
        payoutPhone: auth.currentUser.phoneNumber || '',
        payoutAccountName: auth.currentUser.displayName || '',
      };
    }
    return null;
  });
  const [saving, setSaving] = useState(false);
  const [phoneOperator, setPhoneOperator] = useState<'ORANGE' | 'MTN' | 'AUTRE'>('AUTRE');
  const [payoutOperator, setPayoutOperator] = useState<'ORANGE' | 'MTN' | 'AUTRE'>('AUTRE');

  // Synchronisation silencieuse en arrière-plan sans bloquer l'affichage
  useEffect(() => {
    if (cachedProf) {
      setProfile(cachedProf);
    }

    let isMounted = true;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!isMounted) return;
      if (!u) {
        setProfile(null);
        setCachedUserProfile(null);
        return;
      }

      try {
        // Recherche en parallèle dans le cache local / Firestore
        const [partnerData, clientData] = await Promise.all([
          getUserProfile(u.uid, 'PARTNER'),
          getUserProfile(u.uid, 'CLIENT'),
        ]);

        if (!isMounted) return;

        if (partnerData) {
          setProfile(partnerData);
          setCachedUserProfile(partnerData);
          return;
        }

        if (clientData) {
          setProfile(clientData);
          setCachedUserProfile(clientData);
          return;
        }

        // Profil par défaut rattaché à Firebase Auth
        const defaultProf: UnifiedUserProfile = {
          id: u.uid,
          accountType: 'CLIENT',
          fullName: u.displayName || u.email?.split('@')[0] || 'Adhérent FCT',
          email: u.email || '',
          phone: u.phoneNumber || '',
          whatsappPhone: u.phoneNumber || '',
          city: 'Douala',
          payoutMethod: 'ORANGE_MONEY',
          payoutPhone: u.phoneNumber || '',
          payoutAccountName: u.displayName || '',
        };
        setProfile((prev) => prev || defaultProf);
        setCachedUserProfile(defaultProf);
      } catch (err) {
        console.warn('[FCT Profile] Erreur hydratation profil :', err);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Détection automatique opérateur
  useEffect(() => {
    if (profile?.phone) {
      const v = validateCameroonPhone(profile.phone);
      setPhoneOperator(v.operator);
    }
    if (profile?.payoutPhone) {
      const v = validateCameroonPhone(profile.payoutPhone);
      setPayoutOperator(v.operator);
    }
  }, [profile?.phone, profile?.payoutPhone]);

  const handlePhoneChange = (val: string) => {
    setProfile((prev) => (prev ? { ...prev, phone: val } : null));
    const v = validateCameroonPhone(val);
    setPhoneOperator(v.operator);
  };

  const handlePayoutPhoneChange = (val: string) => {
    setProfile((prev) => (prev ? { ...prev, payoutPhone: val } : null));
    const v = validateCameroonPhone(val);
    setPayoutOperator(v.operator);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!profile.fullName.trim()) {
      onToast(isEn ? 'Full name is required.' : 'Le nom complet est obligatoire.');
      return;
    }

    setSaving(true);
    const res = await saveUserProfile(profile);
    setSaving(false);

    if (res.success) {
      setCachedUserProfile(profile);
      onToast(isEn ? 'Profile updated successfully!' : 'Profil mis à jour avec succès dans FCT !');
    } else {
      onToast(res.error || (isEn ? 'Update error.' : 'Erreur de mise à jour.'));
    }
  };

  if (!profile) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: '60px auto',
          padding: '40px 32px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(15, 42, 74, 0.08)',
          border: '1.5px solid #e2e8f0',
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            backgroundColor: '#eff6ff',
            color: '#1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <User size={34} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f2a4a', marginBottom: 10 }}>
          {t.accessTitle}
        </h2>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          {t.accessSubtitle}
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => (onNavigateToAuth ? onNavigateToAuth('client') : onBack())}
            className="fct-btn fct-btn-primary"
            style={{ padding: '12px 24px' }}
          >
            {t.clientSpaceBtn}
          </button>
          <button
            type="button"
            onClick={() => (onNavigateToAuth ? onNavigateToAuth('partner') : onBack())}
            className="fct-btn fct-btn-secondary"
            style={{ padding: '12px 24px' }}
          >
            {t.partnerPortalBtn}
          </button>
        </div>
      </div>
    );
  }

  const isPartner = profile.accountType === 'PARTNER';

  return (
    <div className="fct-profile-wrapper">
      {/* 1. Header Profil & Identité FCT (Ultra-Responsive) */}
      <div className="fct-profile-header-card">
        <div className="fct-profile-identity-group">
          <div className="fct-profile-avatar">
            {profile.fullName.charAt(0).toUpperCase() || 'F'}
          </div>
          <div className="fct-profile-names-wrap">
            <div className="fct-profile-title-row">
              <h1 className="fct-profile-fullname">
                {profile.fullName || t.headerTitle}
              </h1>
              <span className={`fct-profile-badge ${isPartner ? 'partner' : 'client'}`}>
                {isPartner ? <Award size={13} /> : <Shield size={13} />}
                <span>
                  {isPartner
                    ? t.partnerBadge
                    : t.clientBadge}
                </span>
              </span>
            </div>
            <p className="fct-profile-email">
              {profile.email} {profile.partnerCode ? `• Code Affilié : ${profile.partnerCode}` : ''}
            </p>
          </div>
        </div>

        <div className="fct-profile-actions">
          <button
            type="button"
            onClick={onBack}
            className="fct-btn fct-btn-secondary fct-profile-btn"
          >
            <ArrowLeft size={15} />
            <span>{t.backBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCachedUserProfile(null);
              onLogout();
            }}
            className="fct-profile-logout-btn fct-profile-btn"
          >
            <LogOut size={15} />
            <span>{t.logoutBtn}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitProfile}>
        <div className="fct-profile-grid">
          {/* CARTE 1 : Coordonnées Personnelles */}
          <div className="fct-profile-card">
            <div className="fct-profile-card-header">
              <div className="fct-profile-card-icon" style={{ backgroundColor: '#eff6ff', color: '#1e3a8a' }}>
                <User size={18} />
              </div>
              <h3 className="fct-profile-card-title">
                {t.personalInfoTitle}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {t.fullName} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-medium)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  required
                />
              </div>

              {/* Composant Unifié Intelligent Téléphone & Canaux Connectés (WhatsApp & Mobile Money) */}
              <UnifiedPhoneChannelsInput
                phone={profile.phone}
                whatsappPhone={profile.whatsappPhone}
                payoutPhone={profile.payoutPhone}
                payoutMethod={profile.payoutMethod}
                lang={lang}
                labelPhone={t.primaryPhone}
                onChange={({ phone: newPhone, whatsappPhone: newWa, payoutPhone: newPayout, payoutMethod: newMethod, isWhatsappSame, isPayoutSame }) => {
                  setProfile((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      phone: newPhone,
                      whatsappPhone: newWa,
                      payoutPhone: newPayout,
                      payoutMethod: newMethod || prev.payoutMethod,
                      isWhatsappSame,
                      isPayoutSame,
                    };
                  });
                  setPhoneOperator(validateCameroonPhone(newPhone).operator);
                  if (newPayout) {
                    setPayoutOperator(validateCameroonPhone(newPayout).operator);
                  }
                }}
              />

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {t.city}
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Douala (Bonamoussadi)"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-medium)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>
          </div>

          {/* CARTE 2 : Coordonnées Financières & Mobile Money */}
          <div className="fct-profile-card">
            <div className="fct-profile-card-header">
              <div className="fct-profile-card-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                <CreditCard size={18} />
              </div>
              <h3 className="fct-profile-card-title">
                {t.payoutTitle}
              </h3>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 12,
                color: 'var(--text-sub)',
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              {isPartner
                ? t.payoutPartnerReassurance
                : t.payoutClientReassurance}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 8 }}>
                  {t.preferredChannel}
                </label>
                <div className="fct-operator-selector-grid">
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, payoutMethod: 'ORANGE_MONEY' })}
                    className={`fct-operator-card ${profile.payoutMethod === 'ORANGE_MONEY' ? 'active-orange' : ''}`}
                  >
                    <div className="fct-operator-header">
                      <OrangeMoneyLogo size={26} />
                      {profile.payoutMethod === 'ORANGE_MONEY' && (
                        <div className="fct-operator-check orange">
                          <CheckCircle2 size={15} />
                        </div>
                      )}
                    </div>
                    <div className="fct-operator-info">
                      <div className="fct-operator-name">Orange Money</div>
                      <div className="fct-operator-sub">{isEn ? 'Instant · 0 fees' : 'Instantané · 0 frais'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, payoutMethod: 'MTN_MOMO' })}
                    className={`fct-operator-card ${profile.payoutMethod === 'MTN_MOMO' ? 'active-mtn' : ''}`}
                  >
                    <div className="fct-operator-header">
                      <MtnMomoLogo size={26} />
                      {profile.payoutMethod === 'MTN_MOMO' && (
                        <div className="fct-operator-check mtn">
                          <CheckCircle2 size={15} />
                        </div>
                      )}
                    </div>
                    <div className="fct-operator-info">
                      <div className="fct-operator-name">MTN MoMo</div>
                      <div className="fct-operator-sub">{isEn ? 'Mobile Money 24/7' : 'Mobile Money 24/7'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, payoutMethod: 'CASH' })}
                    className={`fct-operator-card ${profile.payoutMethod === 'CASH' ? 'active-cash' : ''}`}
                  >
                    <div className="fct-operator-header">
                      <CashDeskLogo size={26} />
                      {profile.payoutMethod === 'CASH' && (
                        <div className="fct-operator-check cash">
                          <CheckCircle2 size={15} />
                        </div>
                      )}
                    </div>
                    <div className="fct-operator-info">
                      <div className="fct-operator-name">{isEn ? 'Agency Cash Desk' : 'Guichet Caisse'}</div>
                      <div className="fct-operator-sub">{isEn ? 'Douala Agency' : 'Agence Douala'}</div>
                    </div>
                  </button>
                </div>
              </div>

              {profile.payoutMethod !== 'CASH' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)' }}>
                      {t.payoutPhone}
                    </label>
                    {profile.payoutPhone && profile.phone && profile.payoutPhone.trim() === profile.phone.trim() ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} />
                        <span>{isEn ? 'Synced with main phone' : 'Synchronisé avec l\'appel'}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7' }}>
                        {isEn ? 'Dedicated payout number' : 'Numéro dédié'}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      value={profile.payoutPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        handlePayoutPhoneChange(val);
                        setProfile((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            payoutPhone: val,
                            isPayoutSame: val.trim() === prev.phone.trim(),
                          };
                        });
                      }}
                      placeholder="699 45 88 12"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid var(--border-medium)',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    />
                    {payoutOperator !== 'AUTRE' && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: 7,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 8,
                          backgroundColor: payoutOperator === 'ORANGE' ? '#fff7ed' : '#fefce8',
                          color: payoutOperator === 'ORANGE' ? '#c2410c' : '#854d0e',
                          border: payoutOperator === 'ORANGE' ? '1px solid #ffedd5' : '1px solid #fef08a',
                        }}
                      >
                        {payoutOperator === 'ORANGE' ? (
                          <>
                            <OrangeMoneyLogo size={16} />
                            <span>Orange Money</span>
                          </>
                        ) : (
                          <>
                            <MtnMomoLogo size={16} />
                            <span>MTN MoMo</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {t.accountHolder}
                </label>
                <input
                  type="text"
                  value={profile.payoutAccountName}
                  onChange={(e) => setProfile({ ...profile, payoutAccountName: e.target.value })}
                  placeholder="Ex: TCHAMBA FABIOL"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-medium)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Barre d'action inférieure : Sauvegarder */}
        <div className="fct-profile-submit-bar">
          <button
            type="submit"
            disabled={saving}
            className="fct-btn fct-btn-primary"
            style={{ padding: '12px 28px', fontSize: 13.5 }}
          >
            <Save size={16} />
            <span>{saving ? t.savingBtn : t.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
