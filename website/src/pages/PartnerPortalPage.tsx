import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Share2,
  TrendingUp,
  Wallet,
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Sparkles,
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
} from 'lucide-react';
import { auth, onAuthStateChanged, FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '../services/firebase.ts';
import {
  PartnerAccount,
  fetchCurrentPartnerProfile,
  registerPartnerAccount,
  logPartnerShare,
  generateAffiliateUrl,
  generateShareCopyText,
  SharePlatform,
} from '../services/partnerService.ts';
import { Vehicle } from '../types/index.ts';
import { AppPage } from '../types/router.ts';
import { WebsiteLanguage } from '../services/i18n.ts';

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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [partner, setPartner] = useState<PartnerAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentification
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH'>('ORANGE_MONEY');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [city, setCity] = useState('Douala');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Partage rapide depuis le dashboard
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Écoute de l'utilisateur connecté
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsLoading(true);
        const profile = await fetchCurrentPartnerProfile(user.uid, user.email || '');
        setPartner(profile);
        setIsLoading(false);
      } else {
        setPartner(null);
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  // Authentification / Inscription
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

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
          onToast(isEn ? 'Partner account created successfully!' : 'Compte Partenaire FCT créé avec succès !');
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const profile = await fetchCurrentPartnerProfile(cred.user.uid, cred.user.email || '');
        if (profile) {
          setPartner(profile);
          onToast(isEn ? `Welcome back, ${profile.fullName}!` : `Bienvenue ${profile.fullName} !`);
        } else {
          // L'utilisateur existe en auth mais n'est pas encore partenaire (compte client standard)
          onToast(isEn ? 'Logged in as client. Activate your partner profile below!' : 'Compte client connecté. Activez votre profil Partenaire ci-dessous !');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || (isEn ? 'Authentication error.' : "Erreur d'authentification."));
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
      onToast(isEn ? 'Congratulations! You are now an official FCT Partner.' : 'Félicitations ! Vous êtes désormais Partenaire officiel FCT.');
    } else {
      onToast(regRes.error || (isEn ? 'Activation error.' : "Erreur lors de l'activation."));
    }
    setAuthLoading(false);
  };

  // Déconnexion
  const handleLogout = async () => {
    await signOut(auth);
    setPartner(null);
    onToast(isEn ? 'Logged out.' : 'Déconnecté avec succès.');
  };

  // Gestion du partage d'un véhicule
  const handleTriggerShare = async (platform: SharePlatform) => {
    if (!partner || !selectedVehicle) return;

    const affUrl = generateAffiliateUrl(selectedVehicle.id, partner.partnerCode);
    const isRent = selectedVehicle.isForRent;
    const shareText = generateShareCopyText(selectedVehicle, affUrl, isRent);

    // Logging de l'activité dans Firestore
    await logPartnerShare(partner, selectedVehicle, platform);

    // Mise à jour optimiste de l'état local
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

    if (platform === 'WHATSAPP_STATUS' || platform === 'WHATSAPP_CHAT') {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
      onToast(isEn ? 'Opening WhatsApp with your partner link...' : 'Ouverture de WhatsApp avec votre lien affilié...');
    } else if (platform === 'FACEBOOK') {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affUrl)}`;
      window.open(fbUrl, '_blank');
      onToast(isEn ? 'Opening Facebook...' : 'Ouverture de Facebook...');
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
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* 1. HERO BANNER PROGRAMME PARTENAIRE */}
      <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'linear-gradient(135deg, rgba(15,42,74,0.06) 0%, rgba(200,90,40,0.05) 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border" style={{ backgroundColor: 'rgba(200,90,40,0.1)', color: 'var(--accent-orange)', borderColor: 'rgba(200,90,40,0.25)' }}>
                <Sparkles size={14} />
                <span>{isEn ? 'FCT Business Network • Partner Program' : 'Réseau d\'Apporteurs d\'Affaires FCT Automobile Douala'}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
                {isEn ? 'Earn commissions on every vehicle sale & rental' : 'Gagnez des commissions sur chaque location et vente de véhicule'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {isEn
                  ? 'Share our verified vehicles to your WhatsApp contacts, status, and Facebook networks. Get paid automatically on Orange Money, MTN MoMo, or cash at FCT Douala agency.'
                  : 'Partagez nos véhicules certifiés sur vos statuts WhatsApp, groupes et Facebook. Touchez vos commissions directement sur Orange Money, MTN MoMo ou à la caisse de l\'agence FCT.'}
              </p>
            </div>

            {partner && (
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                  {partner.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">{isEn ? 'Logged in as Partner' : 'Partenaire Connecté'}</div>
                  <div className="font-bold text-slate-900 text-sm">{partner.fullName}</div>
                  <div className="text-xs font-mono font-semibold text-orange-600">{partner.partnerCode}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title={isEn ? 'Log out' : 'Se déconnecter'}
                  className="ml-2 p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. CONTENU PRINCIPAL */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" />
            <p>{isEn ? 'Loading partner dashboard...' : 'Chargement de votre espace partenaire...'}</p>
          </div>
        ) : !partner ? (
          /* CAS 1 : NON CONNECTÉ OU NON ENREGISTRÉ EN PARTENAIRE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Colonne Explication & Avantages */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Award className="text-orange-500" size={24} />
                  <span>{isEn ? 'Why become an FCT Partner?' : 'Pourquoi devenir Partenaire FCT ?'}</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="text-orange-600 font-bold text-sm flex items-center gap-1.5">
                      <Car size={16} />
                      <span>{isEn ? 'Vehicle Rentals' : 'Location de Véhicules'}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {isEn
                        ? 'Earn 5% to 10% on every validated booking contract.'
                        : 'Gagnez de 5% à 10% sur chaque contrat de location validé.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="text-blue-600 font-bold text-sm flex items-center gap-1.5">
                      <TrendingUp size={16} />
                      <span>{isEn ? 'Vehicle Sales' : 'Vente de Véhicules'}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {isEn
                        ? 'Flat fee from 50,000 to 150,000 FCFA for every vehicle sold.'
                        : 'Forfait de 50 000 à 150 000 FCFA sur chaque vente de véhicule conclue.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="text-emerald-600 font-bold text-sm flex items-center gap-1.5">
                      <Smartphone size={16} />
                      <span>{isEn ? 'Instant Payout' : 'Paiement Mobile Money'}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {isEn
                        ? 'Withdraw your earnings via Orange Money, MTN MoMo, or cash in agency.'
                        : 'Retrait direct sur Orange Money, MTN MoMo ou en espèces à l\'agence FCT Douala.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="text-purple-600 font-bold text-sm flex items-center gap-1.5">
                      <BarChart3 size={16} />
                      <span>{isEn ? 'Live Tracking' : 'Suivi en Temps Réel'}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {isEn
                        ? 'Track daily shares, visitor clicks, and validated earnings live.'
                        : 'Suivez vos partages quotidiens, clics générés et commissions en direct.'}
                    </p>
                  </div>
                </div>

                {currentUser && !partner && (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-orange-900 text-sm">
                        {isEn ? 'You are logged in with your client account' : 'Vous êtes connecté avec votre compte client'}
                      </div>
                      <div className="text-xs text-orange-700">
                        {isEn
                          ? 'Activate your Partner profile in one click without re-registering.'
                          : 'Activez votre profil Partenaire en un seul clic sans recréer de compte.'}
                      </div>
                    </div>
                    <button
                      onClick={handleActivatePartner}
                      disabled={authLoading}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles size={14} />
                      <span>{isEn ? 'Activate in 1-Click' : 'Activer en 1 Clic'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Formulaire Inscription / Connexion */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setAuthError('');
                    }}
                    className={`font-bold text-sm pb-1 transition-colors ${
                      !isRegister ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isEn ? 'Partner Login' : 'Connexion Partenaire'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setAuthError('');
                    }}
                    className={`font-bold text-sm pb-1 transition-colors ${
                      isRegister ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isEn ? 'Become a Partner' : 'Créer un Compte'}
                  </button>
                </div>

                {authError && (
                  <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {isRegister && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isEn ? 'Full Name *' : 'Nom Complet *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="ex: Kevin Tagne"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isEn ? 'WhatsApp Phone *' : 'Téléphone WhatsApp *'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="ex: 699 90 28 89"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {isEn ? 'Payout Method' : 'Paiement Gains'}
                          </label>
                          <select
                            value={payoutMethod}
                            onChange={(e: any) => setPayoutMethod(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                          >
                            <option value="ORANGE_MONEY">Orange Money</option>
                            <option value="MTN_MOMO">MTN MoMo</option>
                            <option value="CASH">Caisse FCT</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {isEn ? 'City' : 'Ville'}
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isEn ? 'Email Address *' : 'Adresse Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre-email@domaine.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isEn ? 'Password *' : 'Mot de passe *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {authLoading ? (
                      <Clock size={16} className="animate-spin" />
                    ) : isRegister ? (
                      <>
                        <Sparkles size={16} />
                        <span>{isEn ? 'Create Partner Account' : 'Rejoindre le Programme Partenaire'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>{isEn ? 'Log in to Dashboard' : 'Accéder à mon Espace Partenaire'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* CAS 2 : PARTENAIRE CONNECTÉ - DASHBOARD COMPLET & ACTIVITÉ */
          <div className="space-y-8">
            {/* 2.A BANDEAU CODE PARTENAIRE & LIEN GÉNÉRAL */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">
                    <Award size={16} />
                    <span>{isEn ? `Status: ${partner.tier} Tier` : `Niveau Partenaire : ${partner.tier}`}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">{partner.fullName}</h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {isEn
                      ? 'Share vehicles on your networks. Every booking or purchase with your link earns you verified commissions.'
                      : 'Chaque personne qui réserve ou achète un véhicule grâce à votre lien vous rapporte une commission en FCFA.'}
                  </p>
                </div>

                {/* Badge Code & Copie Rapide */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-center sm:items-end gap-2">
                  <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                    {isEn ? 'Your Unique Partner Code' : 'Votre Code Partenaire'}
                  </div>
                  <div className="text-2xl font-mono font-black text-amber-400 tracking-wider">
                    {partner.partnerCode}
                  </div>
                  <button
                    onClick={() => {
                      const generalUrl = `${window.location.origin}/?ref=${partner.partnerCode}`;
                      navigator.clipboard.writeText(generalUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                      onToast(isEn ? 'General link copied!' : 'Lien catalogue général copié !');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {copiedLink ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedLink ? (isEn ? 'Copied!' : 'Copié !') : (isEn ? 'Copy General Link' : 'Copier mon lien général')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2.B CARTES STATISTIQUES & TAUX D'ACTIVITÉ DU JOUR */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Partages Effectués */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">{isEn ? 'Daily Shares' : 'Partages du jour'}</span>
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                    <Share2 size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{sharesToday}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {partner.stats.totalShares || 0} {isEn ? 'total shares' : 'partages au total'}
                </div>
              </div>

              {/* Clics Reçus */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">{isEn ? 'Visitor Clicks' : 'Clics reçus'}</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{partner.stats.totalClicks || 0}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {isEn ? 'Tracked visitors' : 'Visiteurs arrivés via votre lien'}
                </div>
              </div>

              {/* Prospects / Demandes Enregistrées */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">{isEn ? 'Leads / Bookings' : 'Réservations / Devis'}</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Users size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{partner.stats.totalLeads || 0}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {partner.stats.totalConversions || 0} {isEn ? 'validated deals' : 'ventes/locations conclues'}
                </div>
              </div>

              {/* Gains & Commissions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">{isEn ? 'Available Balance' : 'Solde disponible'}</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Wallet size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {(partner.stats.balanceAvailableXAF || 0).toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {isEn ? 'Paid to date: ' : 'Déjà versé : '} {(partner.stats.paidOutXAF || 0).toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>

            {/* 2.C OUTIL DE PARTAGE 1-CLIC SUR UN VÉHICULE EN DIRECT */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Send className="text-orange-500" size={20} />
                    <span>{isEn ? 'Share a vehicle in 1-Click' : 'Partager un véhicule en 1-Clic'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEn
                      ? 'Select a vehicle from our showroom, customize or share directly to your WhatsApp Status and Contacts.'
                      : 'Choisissez un véhicule disponible et partagez-le instantanément sur votre statut WhatsApp ou vos contacts.'}
                  </p>
                </div>

                {/* Sélecteur de véhicule */}
                <div className="w-full sm:w-72">
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:border-orange-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.year}) - {v.isForRent ? `${v.rentalDailyRate.toLocaleString('fr-FR')} F/j` : `${(v.salePrice || 0).toLocaleString('fr-FR')} F`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedVehicle && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Photo miniature */}
                  <div className="md:col-span-4">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      {selectedVehicle.photoUrls?.[0] ? (
                        <img
                          src={selectedVehicle.photoUrls[0]}
                          alt={selectedVehicle.model}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Car size={36} />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                        {selectedVehicle.isForRent ? 'Location' : 'Vente'}
                      </div>
                    </div>
                  </div>

                  {/* Actions de partage direct */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* WhatsApp Statut / Contact */}
                      <button
                        onClick={() => handleTriggerShare('WHATSAPP_STATUS')}
                        className="flex-1 min-w-[200px] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={18} />
                        <span>{isEn ? 'Share to WhatsApp Status' : 'Partager sur WhatsApp (Statut)'}</span>
                      </button>

                      {/* Facebook */}
                      <button
                        onClick={() => handleTriggerShare('FACEBOOK')}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 size={16} />
                        <span>Facebook</span>
                      </button>

                      {/* Copier le lien affilié */}
                      <button
                        onClick={() => handleTriggerShare('COPY_LINK')}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {copiedLink ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        <span>{copiedLink ? (isEn ? 'Copied' : 'Lien Copié') : (isEn ? 'Copy Link' : 'Copier Lien')}</span>
                      </button>
                    </div>

                    {/* Aperçu du texte généré */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
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

            {/* 2.D DEMANDE DE RETRAIT & PAIEMENT */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                  <Wallet size={24} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {isEn ? 'Withdraw your earned commissions' : 'Retirer vos commissions gagnées'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isEn
                      ? `Configured payout: ${partner.payoutMethod} (${partner.payoutPhone})`
                      : `Mode configuré : ${partner.payoutMethod} (${partner.payoutPhone})`}
                  </div>
                </div>
              </div>

              <button
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
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign size={15} />
                <span>{isEn ? 'Request Payout' : 'Demander le Retrait'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
