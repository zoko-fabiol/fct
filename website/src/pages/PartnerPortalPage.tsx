import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  User,
  Share2,
  TrendingUp,
  Wallet,
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Handshake,
  ArrowRight,
  Send,
  Clock,
  Car,
  DollarSign,
  AlertCircle,
  Smartphone,
  ChevronRight,
  LogOut,
  BarChart3,
  UserCheck,
  Check,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  BadgePercent,
  CircleDollarSign,
  Zap,
} from 'lucide-react';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';
import { fetchVehicleImageFile, copyImageToClipboard, downloadVehiclePhoto } from '../utils/imageShareHelper.ts';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal.tsx';
import { PinVerificationModal } from '../components/PinVerificationModal.tsx';
import { sendEmailVerificationPin, verifyEmailPin, sendFirebaseEmailVerification } from '../services/authSecurityService.ts';
import { auth, onAuthStateChanged, FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '../services/firebase.ts';
import {
  PartnerAccount,
  fetchCurrentPartnerProfile,
  registerPartnerAccount,
  logPartnerShare,
  generateAffiliateUrl,
  generateShareCopyText,
  SharePlatform,
  getCachedPartnerAccount,
  setCachedPartnerAccount,
  getSharesInLast30Days,
} from '../services/partnerService.ts';
import { Vehicle } from '../types/index.ts';
import { AppPage } from '../types/router.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';

interface PartnerPortalPageProps {
  vehicles: Vehicle[];
  onToast: (msg: string) => void;
  onNavigate: (page: AppPage, vehicleId?: string) => void;
  lang?: WebsiteLanguage;
}

export const PartnerPortalPage: React.FC<PartnerPortalPageProps> = ({
  vehicles,
  onToast,
  onNavigate,
  lang = 'fr',
}) => {
  const isEn = lang === 'en';
  const t = websiteTranslations[lang]?.partners || websiteTranslations.fr.partners;
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [partner, setPartner] = useState<PartnerAccount | null>(() => getCachedPartnerAccount());

  // Authentification & Formulaire
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH'>('ORANGE_MONEY');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [city, setCity] = useState('Douala');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 2FA Code PIN & Mot de passe oublié
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | undefined>('123456');

  // Partage d'un véhicule du showroom
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronisation silencieuse en arrière-plan sans bloquer l'affichage
  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await fetchCurrentPartnerProfile(user.uid, user.email || '');
          if (isMounted && profile) {
            setPartner(profile);
            setCachedPartnerAccount(profile);
          }
        } catch (e) {
          console.warn('[FCT Partner] Erreur profil :', e);
        }
      } else {
        if (isMounted) {
          setPartner(null);
          setCachedPartnerAccount(null);
        }
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  // Validation du code PIN 2FA et création effective du compte
  const handleVerifyPinRegistration = async (inputPin: string) => {
    const check = await verifyEmailPin(email.trim(), inputPin, generatedPin);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Le code PIN a déjà vérifié l'e-mail du partenaire
      const regRes = await registerPartnerAccount({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        payoutMethod,
        payoutPhone: payoutPhone.trim() || phone.trim(),
        userId: cred.user.uid,
      });

      if (regRes.success && regRes.partner) {
        setPartner(regRes.partner);
        setShowPinVerification(false);
        onToast(isEn ? 'Email verified & partner account activated!' : 'E-mail certifié et compte Partenaire FCT activé !');
        return { success: true };
      } else {
        return { success: false, error: regRes.error || (isEn ? 'Activation error.' : "Erreur lors de l'activation.") };
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: isEn ? 'This email is already in use with FCT.' : 'Cette adresse e-mail est déjà associée à un compte FCT.' };
      }
      return { success: false, error: err?.message || (isEn ? 'Registration error.' : "Erreur lors de l'inscription.") };
    }
  };

  // Renvoi d'un nouveau code PIN
  const handleResendPin = async () => {
    const pinRes = await sendEmailVerificationPin(email.trim());
    setGeneratedPin(pinRes.pin || '123456');
    onToast(isEn ? 'New PIN code ready!' : 'Nouveau code PIN disponible !');
  };

  // Connexion ou Inscription Partenaire (avec déclenchement 2FA PIN si inscription)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError(isEn ? 'Please fill in email and password.' : 'Veuillez renseigner un email et un mot de passe.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (isRegister) {
        if (!fullName.trim() || !phone.trim()) {
          setAuthError(isEn ? 'Please fill in full name and phone number.' : 'Veuillez renseigner votre nom complet et votre numéro de téléphone.');
          setAuthLoading(false);
          return;
        }

        if (password.length < 6) {
          setAuthError(isEn ? 'Password must be at least 6 characters.' : 'Le mot de passe doit comporter au moins 6 caractères.');
          setAuthLoading(false);
          return;
        }

        // Déclenchement de la double authentification par e-mail
        const pinRes = await sendEmailVerificationPin(email.trim());
        setGeneratedPin(pinRes.pin || '123456');
        setShowPinVerification(true);
        onToast(isEn ? `Verification PIN code sent to ${email.trim()}` : `Code PIN de vérification envoyé à ${email.trim()}`);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const profile = await fetchCurrentPartnerProfile(cred.user.uid, cred.user.email || '');
        if (profile) {
          setPartner(profile);
          onToast(isEn ? `Welcome back, ${profile.fullName}!` : `Bienvenue ${profile.fullName} !`);
        } else {
          onToast(isEn ? 'Logged in as client. Activate your partner profile below!' : 'Compte client connecté. Activez votre profil Partenaire ci-dessous !');
        }
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setAuthError(isEn ? 'Incorrect email address or password.' : 'Adresse e-mail ou mot de passe incorrect.');
      } else {
        setAuthError(err?.message || (isEn ? 'Authentication error.' : "Erreur d'authentification."));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Convertir le compte client connecté en Partenaire
  const handleActivatePartner = async () => {
    if (!currentUser) return;
    setAuthLoading(true);
    const regRes = await registerPartnerAccount({
      fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Partenaire FCT',
      phone: currentUser.phoneNumber || '690000000',
      email: currentUser.email || '',
      city: 'Douala',
      payoutMethod: 'ORANGE_MONEY',
      userId: currentUser.uid,
    });

    if (regRes.success && regRes.partner) {
      setPartner(regRes.partner);
      onToast(isEn ? 'Congratulations! Your partner account is active.' : 'Félicitations ! Votre compte Partenaire est activé.');
    } else {
      onToast(regRes.error || (isEn ? 'Activation error.' : "Erreur lors de l'activation."));
    }
    setAuthLoading(false);
  };

  // Déconnexion
  const handleLogout = async () => {
    await signOut(auth);
    setPartner(null);
    setCachedPartnerAccount(null);
    onToast(isEn ? 'Logged out.' : 'Déconnecté avec succès.');
  };

  // Déclencher le partage traqué
  const handleTriggerShare = async (platform: SharePlatform) => {
    if (!partner || !selectedVehicle) return;

    const affUrl = generateAffiliateUrl(selectedVehicle.id, partner.partnerCode);
    const isRent = selectedVehicle.isForRent;
    const shareText = generateShareCopyText(selectedVehicle, affUrl, isRent);

    await logPartnerShare(partner, selectedVehicle, platform);

    setPartner((prev) => {
      if (!prev) return prev;
      const todayStr = new Date().toISOString().split('T')[0];
      const currentDaily = prev.stats.dailySharesCount || {};
      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalShares: (prev.stats.totalShares || 0) + 1,
          dailySharesCount: {
            ...currentDaily,
            [todayStr]: (currentDaily[todayStr] || 0) + 1,
          },
        },
      };
    });

    const photoUrl = selectedVehicle.photoUrls?.[0] || '';

    if (platform === 'WHATSAPP_STATUS' || platform === 'WHATSAPP_CHAT') {
      // Priorité au partage média natif : photo en premier avec texte en légende
      if (typeof navigator !== 'undefined' && navigator.share && photoUrl) {
        try {
          const imageFile = await fetchVehicleImageFile(photoUrl, `${selectedVehicle.brand}_${selectedVehicle.model}.jpg`);
          if (imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
              files: [imageFile],
              title: `FCT Automobile - ${selectedVehicle.brand} ${selectedVehicle.model}`,
              text: shareText,
            });
            onToast(isEn ? 'Photo and description sent to WhatsApp!' : 'Photo et description envoyées vers WhatsApp !');
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
          console.info('[FCT Partner WhatsApp] Fallback URL :', shareErr);
        }
      }

      // Fallback ordinateur : photo copiée / téléchargée + ouverture WhatsApp
      if (photoUrl) {
        const copied = await copyImageToClipboard(photoUrl);
        if (!copied) {
          downloadVehiclePhoto(photoUrl, `fct-${selectedVehicle.brand}-${selectedVehicle.model}.jpg`);
        }
      }
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
      onToast(
        isEn
          ? 'Photo ready & text copied! Paste the photo into WhatsApp (image sent first with text below).'
          : 'Photo prête & texte copié ! Collez l’image dans WhatsApp (l’image part d’abord avec le texte en dessous).'
      );
    } else if (platform === 'UNIVERSAL_SHARE' || platform === 'FACEBOOK') {
      // Partage universel natif vers n'importe quelle application (overlay OS)
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          let filesToShare: File[] | undefined = undefined;
          if (photoUrl) {
            const imageFile = await fetchVehicleImageFile(photoUrl, `${selectedVehicle.brand}_${selectedVehicle.model}.jpg`);
            if (imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] })) {
              filesToShare = [imageFile];
            }
          }

          await navigator.share({
            title: `FCT Automobile - ${selectedVehicle.brand} ${selectedVehicle.model}`,
            text: shareText,
            url: affUrl,
            ...(filesToShare && filesToShare.length > 0 ? { files: filesToShare } : {}),
          });
          onToast(isEn ? 'Shared successfully!' : 'Fiche véhicule partagée avec succès !');
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          console.warn('[FCT Share] Erreur navigator.share :', err);
        }
      }

      try {
        await navigator.clipboard.writeText(`${shareText}\n\nPhoto : ${photoUrl || affUrl}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
        onToast(isEn ? 'Affiliate link and vehicle card copied!' : 'Lien affilié et fiche véhicule copiés !');
      } catch {
        onToast(isEn ? 'Could not share.' : 'Impossible de partager.');
      }
    } else if (platform === 'COPY_LINK') {
      try {
        await navigator.clipboard.writeText(affUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
        onToast(isEn ? 'Partner affiliate link copied to clipboard!' : 'Lien affilié copié dans le presse-papier !');
      } catch {
        onToast(isEn ? 'Could not copy link.' : 'Impossible de copier le lien.');
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const sharesToday = partner?.stats.dailySharesCount?.[todayStr] || 0;

  return (
    <div className="fct-page-wrapper" style={{ minHeight: '100vh', paddingBottom: '80px', backgroundColor: 'var(--bg-page)' }}>
      {/* 1. EN-TÊTE DE SECTION PRINCIPALE (CHARTE FCT PRESTIGE) */}
      <section className="fct-page-header">
        <div className="fct-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="fct-hero-badge" style={{ marginBottom: '14px' }}>
                <Zap size={14} />
                <span>{t.heroBadge}</span>
              </div>
              <h1 style={{ margin: '0 0 10px 0' }}>
                {t.heroTitle}
              </h1>
              <p style={{ maxWidth: '680px', margin: 0 }}>
                {t.heroSubtitle}
              </p>
            </div>

            {partner && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: '#ffffff',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--fct-blue-soft)',
                    color: 'var(--fct-blue-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '15px',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {partner.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.connectedPartner}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fct-blue-dark)' }}>{partner.fullName}</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--fct-amber-primary)' }}>
                    {partner.partnerCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title={isEn ? 'Log out' : 'Se déconnecter'}
                  style={{
                    marginLeft: '8px',
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. CORPS PRINCIPAL DE LA PAGE */}
      <div className="fct-container" style={{ marginTop: '36px' }}>
        {!partner ? (
          /* =================================================================
             CAS 1 : NON CONNECTÉ OU NON ACTIVÉ EN TANT QUE PARTENAIRE
             ================================================================= */
          <div className="fct-partner-intro-grid">
            {/* Colonne Gauche : Présentation du Programme & Avantages */}
            <div>
              <div
                className="fct-partner-intro-card"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--fct-blue-soft)',
                      color: 'var(--fct-blue-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Award size={22} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--fct-blue-dark)' }}>
                      {t.joinNetwork}
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-sub)' }}>
                      {t.joinSubtitle}
                    </p>
                  </div>
                </div>

                {/* Grille des 4 Piliers de Rémunération */}
                <div className="fct-partner-benefits-grid">
                  {/* Pilier 1 : Location */}
                  <div className="fct-partner-benefit-card">
                    <div className="fct-partner-benefit-icon" style={{ backgroundColor: 'var(--fct-blue-soft)', color: 'var(--fct-blue-dark)' }}>
                      <BadgePercent size={22} />
                    </div>
                    <h4 className="fct-partner-benefit-title">{t.pillar1Title}</h4>
                    <p className="fct-partner-benefit-desc">
                      {t.pillar1Desc}
                    </p>
                  </div>

                  {/* Pilier 2 : Vente */}
                  <div className="fct-partner-benefit-card">
                    <div className="fct-partner-benefit-icon" style={{ backgroundColor: 'var(--fct-amber-soft)', color: 'var(--fct-amber-primary)' }}>
                      <CircleDollarSign size={22} />
                    </div>
                    <h4 className="fct-partner-benefit-title">{t.pillar2Title}</h4>
                    <p className="fct-partner-benefit-desc">
                      {t.pillar2Desc}
                    </p>
                  </div>

                  {/* Pilier 3 : Paiement 24h */}
                  <div className="fct-partner-benefit-card">
                    <div className="fct-partner-benefit-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                      <Smartphone size={22} />
                    </div>
                    <h4 className="fct-partner-benefit-title">{t.pillar3Title}</h4>
                    <p className="fct-partner-benefit-desc">
                      {t.pillar3Desc}
                    </p>
                  </div>

                  {/* Pilier 4 : Partage 1-Clic */}
                  <div className="fct-partner-benefit-card">
                    <div className="fct-partner-benefit-icon" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                      <Share2 size={22} />
                    </div>
                    <h4 className="fct-partner-benefit-title">{t.pillar4Title}</h4>
                    <p className="fct-partner-benefit-desc">
                      {t.pillar4Desc}
                    </p>
                  </div>
                </div>

                {/* 3 Étapes Claires */}
                <div className="fct-partner-steps-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <CheckCircle2 size={16} color="var(--fct-blue-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fct-blue-dark)' }}>
                      {t.stepsTitle}
                    </span>
                  </div>

                  <div className="fct-partner-step-row">
                    <div className="fct-partner-step-num">1</div>
                    <div className="fct-partner-step-content">
                      <h5>{t.step1Title}</h5>
                      <p>{t.step1Desc}</p>
                    </div>
                  </div>

                  <div className="fct-partner-step-row">
                    <div className="fct-partner-step-num">2</div>
                    <div className="fct-partner-step-content">
                      <h5>{t.step2Title}</h5>
                      <p>{t.step2Desc}</p>
                    </div>
                  </div>

                  <div className="fct-partner-step-row">
                    <div className="fct-partner-step-num">3</div>
                    <div className="fct-partner-step-content">
                      <h5>{t.step3Title}</h5>
                      <p>{t.step3Desc}</p>
                    </div>
                  </div>
                </div>

                {/* Raccourci pour utilisateur déjà connecté comme client */}
                {currentUser && !partner && (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '18px 22px',
                      backgroundColor: 'var(--fct-blue-soft)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid rgba(15,42,74,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                        {isEn ? 'Already signed in with client account' : 'Vous êtes connecté avec votre compte FCT'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px' }}>
                        {isEn ? 'Activate your Partner capabilities with one single click.' : 'Activez vos fonctionnalités Apporteur d’Affaires immédiatement.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleActivatePartner}
                      disabled={authLoading}
                      className="fct-btn fct-btn-primary"
                      style={{ fontSize: '13px', padding: '10px 18px' }}
                    >
                      <UserCheck size={16} />
                      <span>{isEn ? 'Activate Partner Status' : 'Activer mon Profil Partenaire'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Droite : Formulaire d'Inscription / Connexion */}
            <div>
              <div className="fct-partner-auth-card">
                <div className="fct-auth-tabs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setAuthError('');
                    }}
                    className={`fct-auth-tab-btn ${isRegister ? 'active' : ''}`}
                  >
                    <UserCheck size={15} />
                    <span>{t.createAccountTab}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setAuthError('');
                    }}
                    className={`fct-auth-tab-btn ${!isRegister ? 'active' : ''}`}
                  >
                    <KeyRound size={15} />
                    <span>{t.signInTab}</span>
                  </button>
                </div>

                {authError && (
                  <div className="fct-alert-error">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {isRegister && (
                    <>
                      <div className="fct-field">
                        <label className="fct-label">{t.fullNameLabel}</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="ex: Jean-Paul Mvogo"
                          className="fct-input"
                        />
                      </div>

                      <div className="fct-field">
                        <label className="fct-label">{t.whatsappLabel}</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="ex: 699 90 28 89"
                          className="fct-input"
                        />
                      </div>

                      <div className="fct-form-row">
                        <div className="fct-field">
                          <label className="fct-label">{t.payoutMethodLabel}</label>
                          <select
                            value={payoutMethod}
                            onChange={(e: any) => setPayoutMethod(e.target.value)}
                            className="fct-select"
                          >
                            <option value="ORANGE_MONEY">Orange Money</option>
                            <option value="MTN_MOMO">MTN Mobile Money</option>
                            <option value="CASH">Caisse Agence FCT Douala</option>
                          </select>
                        </div>
                        <div className="fct-field">
                          <label className="fct-label">{t.cityLabel}</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="fct-input"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="fct-field">
                    <label className="fct-label">{t.emailLabel}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="fct-input"
                    />
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{t.passwordLabel}</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="fct-input"
                    />
                  </div>

                  {!isRegister && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: 'var(--fct-blue-primary, #1e3a8a)',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {t.forgotPassword}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="fct-btn fct-btn-primary"
                    style={{ width: '100%', marginTop: '8px', padding: '13px' }}
                  >
                    {authLoading ? (
                      <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : isRegister ? (
                      <>
                        <ShieldCheck size={16} />
                        <span>{t.registerSubmitBtn}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>{t.loginSubmitBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================
             CAS 2 : PARTENAIRE CONNECTÉ - DASHBOARD COMPLET & OUTIL DE PARTAGE
             ================================================================= */
          <div className="fct-partner-dashboard">
            {/* 2.A BANNIÈRE PARTENAIRE OFFICIEL */}
            <div className="fct-partner-banner">
              <div className="fct-partner-banner-info">
                <div className="fct-partner-banner-avatar">
                  <Award size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                        color: '#fbbf24',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {partner.tier}
                    </span>
                    <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 600 }}>
                      {isEn ? 'Verified FCT Partner' : 'Partenaire Officiel Certifié'}
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                    {partner.fullName}
                  </h2>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#cbd5e1' }}>
                    {isEn
                      ? 'Share our showroom vehicles and track all visitor clicks and commissions in real-time.'
                      : 'Partagez les véhicules du showroom et suivez l’ensemble de vos clics et commissions en direct.'}
                  </p>

                  {/* Jauge Quota Mensuel de Maintien de Rang (30 jours glissants) */}
                  {(() => {
                    const shares30d = getSharesInLast30Days(partner.stats?.dailySharesCount);
                    const quotaMin = partner.tier === 'GOLD' ? 25 : partner.tier === 'SILVER' ? 10 : 0;
                    const isSafe = quotaMin === 0 || shares30d >= quotaMin;
                    const targetMax = quotaMin > 0 ? quotaMin : 10;
                    const progressPercent = Math.min(100, Math.round((shares30d / targetMax) * 100));

                    return (
                      <div
                        style={{
                          background: 'rgba(15, 23, 42, 0.45)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          maxWidth: 380,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 5 }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                            {partner.tier === 'GOLD'
                              ? isEn
                                ? `Gold 30-Day Quota: ${shares30d}/25 shares`
                                : `Quota Maintien Gold : ${shares30d}/25 partages (30j)`
                              : partner.tier === 'SILVER'
                              ? isEn
                                ? `Silver 30-Day Quota: ${shares30d}/10 shares`
                                : `Quota Maintien Silver : ${shares30d}/10 partages (30j)`
                              : isEn
                              ? `Progress toward Silver: ${shares30d}/10 shares`
                              : `Objectif Rang Silver : ${shares30d}/10 partages (30j)`}
                          </span>
                          <span style={{ fontWeight: 800, color: isSafe ? '#34d399' : '#f87171' }}>
                            {quotaMin > 0
                              ? isSafe
                                ? isEn ? 'Rank Secured ✓' : 'Rang Garanti ✓'
                                : isEn ? 'Demotion Risk' : 'Risque de Chute'
                              : `${progressPercent}%`}
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.2)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progressPercent}%`,
                              height: '100%',
                              backgroundColor: isSafe ? '#10b981' : '#f59e0b',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Code d'affiliation et bouton de copie */}
              <div className="fct-partner-code-card">
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.04em' }}>
                  {isEn ? 'Your Referral Code' : 'Votre Code Partenaire'}
                </span>
                <span className="fct-partner-code-number">{partner.partnerCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    const generalUrl = `${window.location.origin}/?ref=${partner.partnerCode}`;
                    navigator.clipboard.writeText(generalUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                    onToast(isEn ? 'General link copied!' : 'Lien catalogue général copié !');
                  }}
                  className="fct-btn fct-btn-secondary"
                  style={{
                    fontSize: '12px',
                    padding: '8px 14px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  {copiedLink ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copiedLink ? (isEn ? 'Copied' : 'Lien Copié') : (isEn ? 'Copy General Link' : 'Copier Lien Général')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="fct-btn fct-btn-secondary"
                  style={{
                    fontSize: '12px',
                    padding: '8px 14px',
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.35)',
                    marginTop: 6,
                  }}
                >
                  <User size={14} />
                  <span>{isEn ? 'Edit Profile & Payouts' : 'Mon Profil & Paiements'}</span>
                </button>
              </div>
            </div>

            {/* 2.B GRILLE DES STATISTIQUES & KPIS */}
            <div className="fct-partner-stats-grid">
              {/* Partages du jour */}
              <div className="fct-partner-stat-card">
                <div className="fct-partner-stat-header">
                  <span className="fct-partner-stat-label">{t.totalShares}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--fct-blue-soft)', color: 'var(--fct-blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Share2 size={16} />
                  </div>
                </div>
                <div className="fct-partner-stat-val">{sharesToday}</div>
                <div className="fct-partner-stat-sub">
                  {partner.stats.totalShares || 0} {isEn ? 'total shares' : 'partages au total'}
                </div>
              </div>

              {/* Clics reçus */}
              <div className="fct-partner-stat-card">
                <div className="fct-partner-stat-header">
                  <span className="fct-partner-stat-label">{t.totalClicks}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--fct-blue-soft)', color: 'var(--fct-blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="fct-partner-stat-val">{partner.stats.totalClicks || 0}</div>
                <div className="fct-partner-stat-sub">
                  {isEn ? 'Interested visitors' : 'Visiteurs arrivés sur le showroom'}
                </div>
              </div>

              {/* Réservations / Devis */}
              <div className="fct-partner-stat-card">
                <div className="fct-partner-stat-header">
                  <span className="fct-partner-stat-label">{t.activeContracts}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} />
                  </div>
                </div>
                <div className="fct-partner-stat-val">{partner.stats.totalLeads || 0}</div>
                <div className="fct-partner-stat-sub">
                  {partner.stats.totalConversions || 0} {isEn ? 'conversions closed' : 'contrats conclus'}
                </div>
              </div>

              {/* Solde Disponible */}
              <div className="fct-partner-stat-card">
                <div className="fct-partner-stat-header">
                  <span className="fct-partner-stat-label">{t.balanceAvailable}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={16} />
                  </div>
                </div>
                <div className="fct-partner-stat-val" style={{ color: '#059669' }}>
                  {(partner.stats.balanceAvailableXAF || 0).toLocaleString('fr-FR')}{' '}
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>FCFA</span>
                </div>
                <div className="fct-partner-stat-sub">
                  {isEn ? 'Paid out: ' : 'Déjà encaissé : '} {(partner.stats.paidOutXAF || 0).toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>

            {/* 2.C OUTIL DE PARTAGE 1-CLIC D'UN VÉHICULE DU SHOWROOM */}
            <div className="fct-partner-share-panel">
              <div className="fct-partner-share-header">
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 900, color: 'var(--fct-blue-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={18} color="var(--fct-blue-primary)" />
                    <span>{t.selectVehicleToShare}</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-sub)' }}>
                    {isEn
                      ? 'Select any available vehicle to publish formatted messages and tracked photos on your WhatsApp status.'
                      : 'Sélectionnez un véhicule pour publier une annonce calibrée avec votre lien d’affiliation sur WhatsApp.'}
                  </p>
                </div>

                {/* Sélecteur de véhicule */}
                <div style={{ minWidth: 0, width: '100%', maxWidth: '360px' }}>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="fct-select"
                    style={{ fontWeight: 700 }}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.year}) • {v.isForRent ? `${v.rentalDailyRate.toLocaleString('fr-FR')} F/j` : `${(v.salePrice || 0).toLocaleString('fr-FR')} F`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedVehicle && (
                <div className="fct-partner-share-body">
                  {/* Photo miniature */}
                  <div className="fct-partner-share-photo">
                    {selectedVehicle.photoUrls?.[0] ? (
                      <img
                        src={selectedVehicle.photoUrls[0]}
                        alt={selectedVehicle.model}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Car size={40} />
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {selectedVehicle.isForRent ? (isEn ? 'For Rent' : 'Location') : (isEn ? 'For Sale' : 'Vente')}
                    </span>
                  </div>

                  {/* Actions & Boutons de Partage */}
                  <div className="fct-partner-share-actions">
                    <div className="fct-partner-share-buttons">
                      {/* WhatsApp Statut */}
                      <button
                        type="button"
                        onClick={() => handleTriggerShare('WHATSAPP_STATUS')}
                        className="fct-btn"
                        style={{
                          backgroundColor: '#25D366',
                          color: '#ffffff',
                          border: 'none',
                          flex: '1 1 200px',
                          padding: '12px 18px',
                          boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                        }}
                      >
                        <WhatsAppIcon size={18} color="#ffffff" />
                        <span>{t.shareWhatsappBtn}</span>
                      </button>

                      {/* Partage Universel */}
                      <button
                        type="button"
                        onClick={() => handleTriggerShare('UNIVERSAL_SHARE')}
                        className="fct-btn fct-btn-primary"
                        style={{
                          padding: '12px 18px',
                        }}
                        title={isEn ? 'Share to any application (WhatsApp, Telegram, Facebook...)' : 'Partager vers n’importe quelle application'}
                      >
                        <Share2 size={16} />
                        <span>{t.shareUniversalBtn}</span>
                      </button>

                      {/* Copie de Lien */}
                      <button
                        type="button"
                        onClick={() => handleTriggerShare('COPY_LINK')}
                        className="fct-btn fct-btn-secondary"
                        style={{ padding: '12px 18px' }}
                      >
                        {copiedLink ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                        <span>{copiedLink ? (isEn ? 'Copied' : 'Lien Copié') : t.copyLinkBtn}</span>
                      </button>
                    </div>

                    {/* Aperçu du texte généré */}
                    <div className="fct-partner-share-preview">
                      {generateShareCopyText(
                        selectedVehicle,
                        generateAffiliateUrl(selectedVehicle.id, partner.partnerCode),
                        selectedVehicle.isForRent
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2.D DEMANDE DE RETRAIT DES COMMISSIONS */}
            <div className="fct-partner-payout-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--fct-amber-soft)',
                    color: 'var(--fct-amber-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Wallet size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                    {isEn ? 'Withdraw your accumulated commissions' : 'Retirer vos commissions acquises'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-sub)', marginTop: '2px' }}>
                    {isEn
                      ? `Active payout destination: ${partner.payoutMethod} (${partner.payoutPhone})`
                      : `Canal de versement enregistré : ${partner.payoutMethod} (${partner.payoutPhone})`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if ((partner.stats.balanceAvailableXAF || 0) < 10000) {
                    onToast(
                      isEn
                        ? 'Minimum payout threshold is 10,000 FCFA.'
                        : 'Le seuil minimum de retrait est de 10 000 FCFA.'
                    );
                    return;
                  }
                  onToast(
                    isEn
                      ? 'Withdrawal request transmitted to FCT Cashier.'
                      : 'Demande de retrait transmise à la caisse FCT avec succès.'
                  );
                }}
                className="fct-btn fct-btn-primary"
                style={{ padding: '12px 22px' }}
              >
                <CircleDollarSign size={16} />
                <span>{t.requestPayoutBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Récupération Mot de passe oublié */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        defaultEmail={email}
        isEn={isEn}
      />

      {/* Modal Double Authentification Code PIN par Email */}
      <PinVerificationModal
        isOpen={showPinVerification}
        email={email}
        onVerify={handleVerifyPinRegistration}
        onResend={handleResendPin}
        onCancel={() => setShowPinVerification(false)}
        isEn={isEn}
      />
    </div>
  );
};
