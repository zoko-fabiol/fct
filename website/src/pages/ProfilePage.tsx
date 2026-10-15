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
} from '../services/profileService.ts';
import { auth, onAuthStateChanged } from '../services/firebase.ts';
import { WebsiteLanguage } from '../services/i18n.ts';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';

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
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(initialProfile || null);
  const [loadingProfile, setLoadingProfile] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [phoneOperator, setPhoneOperator] = useState<'ORANGE' | 'MTN' | 'AUTRE'>('AUTRE');
  const [payoutOperator, setPayoutOperator] = useState<'ORANGE' | 'MTN' | 'AUTRE'>('AUTRE');

  // Chargement automatique si non fourni
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setLoadingProfile(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      // Vérifier d'abord s'il s'agit d'un partenaire
      const partnerData = await getUserProfile(u.uid, 'PARTNER');
      if (partnerData) {
        setProfile(partnerData);
        setLoadingProfile(false);
        return;
      }

      // Sinon client
      const clientData = await getUserProfile(u.uid, 'CLIENT');
      if (clientData) {
        setProfile(clientData);
        setLoadingProfile(false);
        return;
      }

      // Profil par défaut rattaché à Firebase Auth
      setProfile({
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
      });
      setLoadingProfile(false);
    });

    return () => unsub();
  }, [initialProfile]);

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
      onToast(isEn ? 'Profile updated successfully!' : 'Profil mis à jour avec succès dans FCT !');
    } else {
      onToast(res.error || (isEn ? 'Update error.' : 'Erreur de mise à jour.'));
    }
  };


  if (loadingProfile) {
    return (
      <div style={{ padding: '90px 20px', textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid #e2e8f0',
            borderTopColor: '#1e3a8a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ color: '#475569', fontSize: 15, fontWeight: 700 }}>
          {isEn ? 'Loading your FCT profile...' : 'Chargement de votre profil FCT Automobile...'}
        </p>
      </div>
    );
  }

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
          {isEn ? 'Access Your FCT Profile' : 'Accédez à votre profil FCT'}
        </h2>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          {isEn
            ? 'Sign in to update your personal contact details, WhatsApp contact, and Mobile Money payout accounts (Orange / MTN).'
            : 'Connectez-vous pour mettre à jour vos coordonnées, votre contact WhatsApp et vos comptes de versement Mobile Money (Orange Money / MTN MoMo).'}
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => (onNavigateToAuth ? onNavigateToAuth('client') : onBack())}
            className="fct-btn fct-btn-primary"
            style={{ padding: '12px 24px' }}
          >
            {isEn ? 'Client Space' : 'Espace Adhérent Client'}
          </button>
          <button
            type="button"
            onClick={() => (onNavigateToAuth ? onNavigateToAuth('partner') : onBack())}
            className="fct-btn fct-btn-secondary"
            style={{ padding: '12px 24px' }}
          >
            {isEn ? 'Partner Portal' : 'Portail Partenaire'}
          </button>
        </div>
      </div>
    );
  }

  const isPartner = profile.accountType === 'PARTNER';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px', fontFamily: 'inherit' }}>
      {/* 1. Header Profil & Identité FCT */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: '24px 28px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: 'linear-gradient(135deg, var(--fct-blue-primary), var(--fct-blue-dark))',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)',
            }}
          >
            {profile.fullName.charAt(0).toUpperCase() || 'F'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--fct-blue-dark)', margin: 0 }}>
                {profile.fullName || (isEn ? 'My FCT Account' : 'Mon Compte FCT')}
              </h1>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  backgroundColor: isPartner ? '#fffbeb' : '#eff6ff',
                  color: isPartner ? '#b45309' : '#1e3a8a',
                  border: isPartner ? '1px solid #fde68a' : '1px solid #bfdbfe',
                }}
              >
                {isPartner
                  ? (isEn ? 'Certified Partner' : 'Partenaire Apporteur Agréé')
                  : (isEn ? 'Verified Member' : 'Adhérent Client FCT')}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-sub)' }}>
              {profile.email} {profile.partnerCode ? `• Code Affilié : ${profile.partnerCode}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onBack}
            className="fct-btn fct-btn-secondary"
            style={{ padding: '9px 18px', fontSize: 12.5 }}
          >
            <ArrowLeft size={15} />
            <span>{isEn ? 'Back' : 'Retour'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            style={{
              padding: '9px 18px',
              borderRadius: 12,
              fontSize: 12.5,
              fontWeight: 700,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LogOut size={15} />
            <span>{isEn ? 'Log Out' : 'Se Déconnecter'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitProfile}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* CARTE 1 : Coordonnées Personnelles */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 18,
              padding: 24,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                {isEn ? 'Personal Information' : 'Coordonnées & Identité'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {isEn ? 'Full Name' : 'Nom Complet'} <span style={{ color: '#ef4444' }}>*</span>
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

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {isEn ? 'Primary Phone Number' : 'Numéro de Téléphone Principal'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
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
                  {phoneOperator !== 'AUTRE' && (
                    <span
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 9,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: phoneOperator === 'ORANGE' ? '#ffedd5' : '#fef9c3',
                        color: phoneOperator === 'ORANGE' ? '#c2410c' : '#854d0e',
                      }}
                    >
                      {phoneOperator === 'ORANGE' ? 'Orange' : 'MTN'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  <WhatsAppIcon size={14} color="#059669" />
                  <span>{isEn ? 'VIP WhatsApp Phone' : 'Numéro WhatsApp VIP'}</span>
                </label>
                <input
                  type="tel"
                  value={profile.whatsappPhone}
                  onChange={(e) => setProfile({ ...profile, whatsappPhone: e.target.value })}
                  placeholder="677 12 34 56"
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

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {isEn ? 'City / District in Cameroon' : 'Ville & Quartier (Cameroun)'}
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
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 18,
              padding: 24,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={18} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', margin: 0 }}>
                {isEn ? 'Payout & Mobile Money Settings' : 'Paiements & Mobile Money (OM / MoMo)'}
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
                ? (isEn
                    ? 'Your commissions are paid directly to this Mobile Money account upon request.'
                    : 'Vos commissions d’apporteur d’affaires sont versées directement sur ce compte Mobile Money.')
                : (isEn
                    ? 'Your security deposits are securely refunded to this account after vehicle return.'
                    : 'Vos cautions de location vous sont restituées sans délai sur ce compte après inspection de retour.')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {isEn ? 'Preferred Payment Channel' : 'Opérateur de Paiement'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, payoutMethod: 'ORANGE_MONEY' })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: profile.payoutMethod === 'ORANGE_MONEY' ? '2px solid #ea580c' : '1px solid var(--border-medium)',
                      backgroundColor: profile.payoutMethod === 'ORANGE_MONEY' ? '#fff7ed' : '#ffffff',
                      color: profile.payoutMethod === 'ORANGE_MONEY' ? '#c2410c' : 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    🟠 Orange Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, payoutMethod: 'MTN_MOMO' })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: profile.payoutMethod === 'MTN_MOMO' ? '2px solid #ca8a04' : '1px solid var(--border-medium)',
                      backgroundColor: profile.payoutMethod === 'MTN_MOMO' ? '#fefce8' : '#ffffff',
                      color: profile.payoutMethod === 'MTN_MOMO' ? '#854d0e' : 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    🟡 MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, payoutMethod: 'CASH' })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: profile.payoutMethod === 'CASH' ? '2px solid #059669' : '1px solid var(--border-medium)',
                      backgroundColor: profile.payoutMethod === 'CASH' ? '#ecfdf5' : '#ffffff',
                      color: profile.payoutMethod === 'CASH' ? '#065f46' : 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    💵 Guichet Caisse
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {isEn ? 'Mobile Money Phone Number' : 'Numéro Orange Money ou MTN MoMo'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={profile.payoutPhone}
                    onChange={(e) => handlePayoutPhoneChange(e.target.value)}
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
                        right: 12,
                        top: 9,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: payoutOperator === 'ORANGE' ? '#ffedd5' : '#fef9c3',
                        color: payoutOperator === 'ORANGE' ? '#c2410c' : '#854d0e',
                      }}
                    >
                      {payoutOperator === 'ORANGE' ? 'Orange Money' : 'MTN MoMo'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {isEn ? 'Account Holder Name' : 'Nom du Titulaire de la Carte SIM'}
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
        <div
          style={{
            marginTop: 24,
            backgroundColor: '#ffffff',
            borderRadius: 18,
            padding: '18px 24px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="submit"
            disabled={saving}
            className="fct-btn fct-btn-primary"
            style={{ padding: '12px 28px', fontSize: 13.5 }}
          >
            <Save size={16} />
            <span>{saving ? (isEn ? 'Saving...' : 'Enregistrement...') : (isEn ? 'Save Changes' : 'Enregistrer les Modifications')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
