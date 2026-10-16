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
  Search,
  Eye,
  Sparkles,
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
  calculatePartnerImpactScore,
  checkVehicleShareEligibility,
} from '../services/partnerService.ts';
import { Vehicle } from '../types/index.ts';
import { AppPage } from '../types/router.ts';
import { WebsiteLanguage, websiteTranslations } from '../services/i18n.ts';
import { UnifiedPhoneChannelsInput } from '../components/UnifiedPhoneChannelsInput.tsx';
import { getSharedContactInfo, saveSharedContactInfo } from '../services/profileService.ts';

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

  // Pré-remplissage automatique depuis le socle de contact partagé (Client ⇄ Partenaire)
  const sharedContact = getSharedContactInfo();

  // Authentification & Formulaire
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState(() => sharedContact.email || auth.currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(() => sharedContact.fullName || '');
  const [phone, setPhone] = useState(() => sharedContact.phone || '');
  const [payoutMethod, setPayoutMethod] = useState<'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH'>(() => sharedContact.payoutMethod || 'ORANGE_MONEY');
  const [payoutPhone, setPayoutPhone] = useState(() => sharedContact.payoutPhone || sharedContact.phone || '');
  const [city, setCity] = useState(() => sharedContact.city || 'Douala');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 2FA Code PIN & Mot de passe oublié
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | undefined>('123456');

  // Partage et catalogue multi-véhicules du showroom
  const [shareFilter, setShareFilter] = useState<'ALL' | 'RENT' | 'SALE'>('ALL');
  const [shareSearch, setShareSearch] = useState<string>('');
  const [copiedVehicleId, setCopiedVehicleId] = useState<string | null>(null);
  const [expandedPreviewVehicleId, setExpandedPreviewVehicleId] = useState<string | null>(null);
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

  // Décompte pour les onglets de filtrage
  const shareCounts = useMemo(() => {
    const valid = vehicles.filter((v) => v.status !== 'MAINTENANCE');
    return {
      all: valid.length,
      rent: valid.filter((v) => v.isForRent).length,
      sale: valid.filter((v) => v.isForSale).length,
    };
  }, [vehicles]);

  // Véhicules filtrés pour la visualisation complète
  const displayedShareVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === 'MAINTENANCE') return false;
      if (shareFilter === 'RENT' && !v.isForRent) return false;
      if (shareFilter === 'SALE' && !v.isForSale) return false;
      if (shareSearch.trim()) {
        const q = shareSearch.toLowerCase();
        const match = `${v.brand} ${v.model} ${v.year} ${v.category} ${v.fuel}`.toLowerCase();
        if (!match.includes(q)) return false;
      }
      return true;
    });
  }, [vehicles, shareFilter, shareSearch]);

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

  // Déclencher le partage traqué pour un véhicule ciblé
  const handleTriggerShare = async (targetVehicle: Vehicle, platform: SharePlatform) => {
    if (!partner || !targetVehicle) return;

    const affUrl = generateAffiliateUrl(targetVehicle.id, partner.partnerCode);
    const isRent = targetVehicle.isForRent;
    const shareText = generateShareCopyText(targetVehicle, affUrl, isRent, lang);

    const shareRes = await logPartnerShare(partner, targetVehicle, platform);

    if (shareRes.logged) {
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
            vehicleLastSharedAt: {
              ...(prev.stats.vehicleLastSharedAt || {}),
              [targetVehicle.id]: new Date().toISOString(),
            },
          },
        };
      });
      onToast(isEn ? 'Share counted! +1 to your impact.' : 'Partage validé ! +1 ajouté à votre score d’impact.');
    } else if (shareRes.reason === 'COOLDOWN_ACTIVE') {
      onToast(
        isEn
          ? `Anti-spam: Vehicle already counted today (1 max/car/24h). Next quota in ~${shareRes.remainingHours}h.`
          : `Anti-spam : Véhicule déjà comptabilisé aujourd'hui (1 max/véhicule/24h). Nouveau quota dans ~${shareRes.remainingHours}h.`
      );
    }

    const photoUrl = targetVehicle.photoUrls?.[0] || '';

    if (platform === 'WHATSAPP_STATUS' || platform === 'WHATSAPP_CHAT') {
      // Priorité au partage média natif : photo en premier avec texte en légende
      if (typeof navigator !== 'undefined' && navigator.share && photoUrl) {
        try {
          const imageFile = await fetchVehicleImageFile(photoUrl, `${targetVehicle.brand}_${targetVehicle.model}.jpg`);
          if (imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
              files: [imageFile],
              title: `FCT Automobile - ${targetVehicle.brand} ${targetVehicle.model}`,
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
          downloadVehiclePhoto(photoUrl, `fct-${targetVehicle.brand}-${targetVehicle.model}.jpg`);
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
            const imageFile = await fetchVehicleImageFile(photoUrl, `${targetVehicle.brand}_${targetVehicle.model}.jpg`);
            if (imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] })) {
              filesToShare = [imageFile];
            }
          }

          await navigator.share({
            title: `FCT Automobile - ${targetVehicle.brand} ${targetVehicle.model}`,
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
        setCopiedVehicleId(targetVehicle.id);
        setTimeout(() => setCopiedVehicleId(null), 3000);
        onToast(isEn ? 'Affiliate link and vehicle card copied!' : 'Lien affilié et fiche véhicule copiés !');
      } catch {
        onToast(isEn ? 'Could not share.' : 'Impossible de partager.');
      }
    } else if (platform === 'COPY_LINK') {
      try {
        await navigator.clipboard.writeText(affUrl);
        setCopiedVehicleId(targetVehicle.id);
        setTimeout(() => setCopiedVehicleId(null), 3000);
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
                          onChange={(e) => {
                            setFullName(e.target.value);
                            saveSharedContactInfo({ fullName: e.target.value });
                          }}
                          placeholder="ex: Jean-Paul Mvogo"
                          className="fct-input"
                        />
                      </div>

                      <div className="fct-field">
                        <UnifiedPhoneChannelsInput
                          phone={phone}
                          whatsappPhone={phone}
                          payoutPhone={payoutPhone || phone}
                          payoutMethod={payoutMethod}
                          lang={lang}
                          labelPhone={isEn ? 'Primary Phone Number (Calls & WhatsApp)' : 'Numéro de téléphone principal (Appels & WhatsApp) :'}
                          showPayoutChannel={payoutMethod !== 'CASH'}
                          onChange={({ phone: newPhone, payoutPhone: newPayout, payoutMethod: newMethod }) => {
                            setPhone(newPhone);
                            if (newPayout) setPayoutPhone(newPayout);
                            if (newMethod) setPayoutMethod(newMethod);
                            saveSharedContactInfo({ phone: newPhone, payoutPhone: newPayout, payoutMethod: newMethod });
                          }}
                        />
                      </div>

                      <div className="fct-form-row">
                        <div className="fct-field">
                          <label className="fct-label">{t.payoutMethodLabel}</label>
                          <select
                            value={payoutMethod}
                            onChange={(e: any) => {
                              setPayoutMethod(e.target.value);
                              saveSharedContactInfo({ payoutMethod: e.target.value });
                            }}
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
                            onChange={(e) => {
                              setCity(e.target.value);
                              saveSharedContactInfo({ city: e.target.value });
                            }}
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
                    const clicks30d = getSharesInLast30Days(partner.stats?.dailyClicksCount);
                    const impact30d = Math.max(shares30d, clicks30d);
                    const quotaMin = partner.tier === 'GOLD' ? 25 : partner.tier === 'SILVER' ? 10 : 0;
                    const isSafe = quotaMin === 0 || impact30d >= quotaMin;
                    const targetMax = quotaMin > 0 ? quotaMin : 10;
                    const progressPercent = Math.min(100, Math.round((impact30d / targetMax) * 100));

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
                                ? `Gold 30-Day Impact: ${impact30d}/25 pts (${clicks30d} real clicks)`
                                : `Quota Maintien Gold : ${impact30d}/25 pts (${clicks30d} clics réels)`
                              : partner.tier === 'SILVER'
                              ? isEn
                                ? `Silver 30-Day Impact: ${impact30d}/10 pts (${clicks30d} real clicks)`
                                : `Quota Maintien Silver : ${impact30d}/10 pts (${clicks30d} clics réels)`
                              : isEn
                              ? `Progress toward Silver: ${impact30d}/10 pts (${clicks30d} real clicks)`
                              : `Objectif Rang Silver : ${impact30d}/10 pts (${clicks30d} clics réels)`}
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
            {(() => {
              const impact = calculatePartnerImpactScore(partner.stats.totalShares, partner.stats.totalClicks);
              return (
                <div className="fct-partner-stats-grid">
                  {/* 1. VRAIS CLICS / VISITEURS RÉELS (Priorité Absolue) */}
                  <div
                    className="fct-partner-stat-card"
                    style={{
                      border: '2px solid rgba(16, 185, 129, 0.4)',
                      background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)',
                    }}
                  >
                    <div className="fct-partner-stat-header">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="fct-partner-stat-label" style={{ color: '#047857', fontWeight: 800 }}>
                          {isEn ? 'REAL CLICKS' : 'VRAIS CLICS RÉELS'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {isEn ? 'Unique Visitors' : 'Visiteurs Uniques Vérifiés'}
                        </span>
                      </div>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} />
                      </div>
                    </div>
                    <div className="fct-partner-stat-val" style={{ color: '#065f46', fontSize: '28px' }}>
                      {partner.stats.totalClicks || 0}
                    </div>
                    <div className="fct-partner-stat-sub" style={{ color: '#047857', fontWeight: 600 }}>
                      {isEn ? 'People opened your referral link' : 'Personnes réelles ayant ouvert votre lien'}
                    </div>
                  </div>

                  {/* 2. SCORE DE PORTÉE & SURPLUS D'IMPACT */}
                  <div
                    className="fct-partner-stat-card"
                    style={{
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
                    }}
                  >
                    <div className="fct-partner-stat-header">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="fct-partner-stat-label" style={{ color: '#1d4ed8', fontWeight: 800 }}>
                          {isEn ? 'AUDIENCE REACH' : 'PORTÉE & IMPACT TOTAL'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {impact.surplusClicks > 0 ? `+${impact.surplusClicks} clics bonus` : (isEn ? 'Base + Surplus' : 'Partages valorisés')}
                        </span>
                      </div>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={18} />
                      </div>
                    </div>
                    <div className="fct-partner-stat-val" style={{ color: '#1e3a8a', fontSize: '28px' }}>
                      {impact.totalImpactScore}
                    </div>
                    <div className="fct-partner-stat-sub" style={{ color: '#1e40af', fontWeight: 600 }}>
                      {impact.displayBreakdown}
                    </div>
                  </div>

                  {/* 3. PARTAGES CERTIFIÉS (Anti-Spam 1/véhicule/24h) */}
                  <div className="fct-partner-stat-card">
                    <div className="fct-partner-stat-header">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="fct-partner-stat-label">{t.totalShares}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Anti-spam 1/véhicule/24h
                        </span>
                      </div>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'var(--fct-blue-soft)', color: 'var(--fct-blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Share2 size={18} />
                      </div>
                    </div>
                    <div className="fct-partner-stat-val">{sharesToday}</div>
                    <div className="fct-partner-stat-sub">
                      {partner.stats.totalShares || 0} {isEn ? 'certified shares' : 'partages certifiés au total'}
                    </div>
                  </div>

                  {/* 4. RÉSERVATIONS / CONTRATS */}
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

                  {/* 5. SOLDE DISPONIBLE */}
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
              );
            })()}

            {/* 2.C NOUVEAU CATALOGUE MULTI-VÉHICULES DU SHOWROOM À PARTAGER */}
            <div className="fct-partner-share-panel">
              <div className="fct-partner-share-header">
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 900, color: 'var(--fct-blue-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={19} color="var(--fct-blue-primary)" />
                    <span>{isEn ? 'Showroom Vehicles to Share & Promote' : 'Véhicules du Showroom à Partager & Promouvoir'}</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-sub)' }}>
                    {isEn
                      ? 'Select any vehicle below. Share directly to WhatsApp or copy the link with your affiliate tracking code.'
                      : 'Choisissez n’importe quel véhicule ci-dessous. Partagez en 1 clic vers votre statut WhatsApp ou copiez votre lien affilié certifié.'}
                  </p>
                </div>

                {/* Filtres par type : TOUS / À LOUER / EN VENTE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div className="fct-partner-filter-tabs">
                    <button
                      type="button"
                      onClick={() => setShareFilter('ALL')}
                      className={`fct-partner-filter-btn ${shareFilter === 'ALL' ? 'active' : ''}`}
                    >
                      <Car size={15} />
                      <span>{isEn ? 'All' : 'Tous'}</span>
                      <span className="fct-partner-filter-badge">{shareCounts.all}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareFilter('RENT')}
                      className={`fct-partner-filter-btn ${shareFilter === 'RENT' ? 'active' : ''}`}
                    >
                      <Sparkles size={14} color={shareFilter === 'RENT' ? '#ffffff' : '#2563eb'} />
                      <span>{isEn ? 'For Rent' : 'À Louer'}</span>
                      <span className="fct-partner-filter-badge">{shareCounts.rent}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareFilter('SALE')}
                      className={`fct-partner-filter-btn ${shareFilter === 'SALE' ? 'active' : ''}`}
                    >
                      <Award size={14} color={shareFilter === 'SALE' ? '#ffffff' : '#d97706'} />
                      <span>{isEn ? 'For Sale' : 'En Vente'}</span>
                      <span className="fct-partner-filter-badge">{shareCounts.sale}</span>
                    </button>
                  </div>

                  {/* Recherche rapide */}
                  <div style={{ position: 'relative', width: '180px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder={isEn ? 'Search model...' : 'Rechercher...'}
                      value={shareSearch}
                      onChange={(e) => setShareSearch(e.target.value)}
                      className="fct-input"
                      style={{ padding: '7px 10px 7px 30px', fontSize: '12px', borderRadius: '9999px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Grille dynamique des véhicules */}
              {displayedShareVehicles.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Car size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                    {isEn ? 'No vehicles match your current filter.' : 'Aucun véhicule ne correspond à ce filtre.'}
                  </p>
                </div>
              ) : (
                <div className="fct-partner-catalog-grid">
                  {displayedShareVehicles.map((v) => {
                    const affUrl = generateAffiliateUrl(v.id, partner.partnerCode);
                    const shareText = generateShareCopyText(v, affUrl, v.isForRent, lang);
                    const isPreviewExpanded = expandedPreviewVehicleId === v.id;
                    const isCopied = copiedVehicleId === v.id;
                    const eligibility = checkVehicleShareEligibility(partner, v.id);

                    const priceStr = v.isForRent
                      ? `${(v.rentalDailyRate || 0).toLocaleString('fr-FR')} FCFA / jour`
                      : `${(v.salePrice || (v as any).sellingPrice || 0).toLocaleString('fr-FR')} FCFA`;

                    const commissionStr = v.isForRent
                      ? `~${Math.round((v.rentalDailyRate || 0) * 0.05).toLocaleString('fr-FR')} FCFA / j (5%)`
                      : '100 000 FCFA forfaitaire';

                    return (
                      <div key={v.id} className="fct-partner-vcard">
                        {/* Photo avec Badges */}
                        <div className="fct-partner-vcard-media">
                          {v.photoUrls?.[0] ? (
                            <img src={v.photoUrls[0]} alt={`${v.brand} ${v.model}`} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              <Car size={40} />
                            </div>
                          )}

                          {/* Badge Type & Tarif */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: v.isForRent ? 'rgba(15, 42, 74, 0.9)' : 'rgba(180, 83, 9, 0.9)',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 800,
                              letterSpacing: '0.03em',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            {v.isForRent ? (isEn ? 'LOCATION' : 'LOCATION') : (isEn ? 'VENTE' : 'VENTE')} • {priceStr}
                          </div>

                          {/* Badge Anti-Spam Quota 24h */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              padding: '3px 9px',
                              borderRadius: '9999px',
                              backgroundColor: eligibility.canCount ? 'rgba(16, 185, 129, 0.92)' : 'rgba(245, 158, 11, 0.92)',
                              color: '#ffffff',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backdropFilter: 'blur(4px)',
                            }}
                            title={
                              eligibility.canCount
                                ? 'Prêt pour comptabilisation (+1 partage)'
                                : `Déjà comptabilisé aujourd'hui (prochain dans ~${eligibility.remainingHours}h)`
                            }
                          >
                            {eligibility.canCount ? (
                              <>
                                <CheckCircle2 size={12} />
                                <span>{isEn ? '+1 Quota ready' : '+1 Quota actif'}</span>
                              </>
                            ) : (
                              <>
                                <Clock size={12} />
                                <span>{isEn ? `Shared (~${eligibility.remainingHours}h)` : `Partagé (~${eligibility.remainingHours}h)`}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Corps de la carte */}
                        <div className="fct-partner-vcard-body">
                          <div>
                            <h4 className="fct-partner-vcard-title">{v.brand} {v.model} ({v.year})</h4>
                            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span>{v.category}</span>
                              <span>•</span>
                              <span>{v.transmission || 'Automatique'}</span>
                              <span>•</span>
                              <span>{v.fuel || 'Essence'}</span>
                              <span>•</span>
                              <span>{v.currentLocation || 'Douala'}</span>
                            </div>
                          </div>

                          {/* Aperçu Commission Partenaire */}
                          <div className="fct-partner-commission-badge">
                            <span style={{ fontWeight: 700, color: '#047857' }}>
                              {isEn ? 'Your Commission:' : 'Votre Commission :'}
                            </span>
                            <span style={{ fontWeight: 900, color: '#065f46' }}>
                              {commissionStr}
                            </span>
                          </div>

                          {/* Boutons d'Action 1-Clic */}
                          <div className="fct-partner-vcard-actions">
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                              {/* Bouton WhatsApp direct */}
                              <button
                                type="button"
                                onClick={() => handleTriggerShare(v, 'WHATSAPP_STATUS')}
                                className="fct-btn"
                                style={{
                                  backgroundColor: '#25D366',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '10px 12px',
                                  fontSize: '12.5px',
                                  fontWeight: 800,
                                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                                }}
                                title={isEn ? 'Share on WhatsApp with photo and pitch' : 'Partager sur WhatsApp avec photo et annonce'}
                              >
                                <WhatsAppIcon size={16} color="#ffffff" />
                                <span>WhatsApp</span>
                              </button>

                              {/* Partage Universel */}
                              <button
                                type="button"
                                onClick={() => handleTriggerShare(v, 'UNIVERSAL_SHARE')}
                                className="fct-btn fct-btn-primary"
                                style={{
                                  padding: '10px 12px',
                                  fontSize: '12.5px',
                                  fontWeight: 800,
                                }}
                                title={isEn ? 'Share to other apps' : 'Partager vers d’autres applications'}
                              >
                                <Share2 size={14} />
                                <span>{isEn ? 'Share' : 'Partager'}</span>
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              {/* Copier le lien affilié */}
                              <button
                                type="button"
                                onClick={() => handleTriggerShare(v, 'COPY_LINK')}
                                className="fct-btn fct-btn-secondary"
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                }}
                              >
                                {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                                <span>{isCopied ? (isEn ? 'Copied ✓' : 'Lien Copié ✓') : (isEn ? 'Copy Link' : 'Copier Lien')}</span>
                              </button>

                              {/* Toggle texte d'annonce */}
                              <button
                                type="button"
                                onClick={() => setExpandedPreviewVehicleId(isPreviewExpanded ? null : v.id)}
                                className="fct-btn fct-btn-secondary"
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  backgroundColor: isPreviewExpanded ? '#f1f5f9' : '#ffffff',
                                }}
                              >
                                <Eye size={13} />
                                <span>{isPreviewExpanded ? (isEn ? 'Hide Text' : 'Masquer') : (isEn ? 'View Pitch' : 'Voir Annonce')}</span>
                              </button>
                            </div>

                            {/* Aperçu déroulant du texte de l'annonce */}
                            {isPreviewExpanded && (
                              <div
                                style={{
                                  marginTop: '6px',
                                  padding: '10px 12px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '11.5px',
                                  fontFamily: 'monospace',
                                  color: '#334155',
                                  whiteSpace: 'pre-wrap',
                                  lineHeight: 1.5,
                                  maxHeight: '160px',
                                  overflowY: 'auto',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(shareText);
                                      onToast(isEn ? 'Marketing text copied!' : 'Texte de l’annonce copié !');
                                    }}
                                    style={{
                                      fontSize: '10.5px',
                                      padding: '2px 8px',
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isEn ? 'Copy Text' : 'Copier Texte'}
                                  </button>
                                </div>
                                {shareText}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
