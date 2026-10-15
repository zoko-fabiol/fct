import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Fuel,
  Users,
  Gauge,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  KeyRound,
  ShoppingBag,
  Wrench,
  Clock,
  MapPin,
  Award,
  Maximize2,
  X,
  Eye,
  Shield,
  Share2,
  Copy,
  Sparkles,
  Wallet,
  Handshake,
} from 'lucide-react';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';
import { fetchVehicleImageFile, copyImageToClipboard, downloadVehiclePhoto } from '../utils/imageShareHelper.ts';
import { Vehicle, MaintenanceRecordItem } from '../types/index.ts';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';
import { formatXAF, formatDateFR } from '../utils/formatters.ts';
import { submitBooking, submitPurchaseLead, auth, onAuthStateChanged, fetchVehicleHealthPassport } from '../services/firebase.ts';
import {
  PartnerAccount,
  fetchCurrentPartnerProfile,
  logPartnerShare,
  generateAffiliateUrl,
  generateShareCopyText,
  SharePlatform,
} from '../services/partnerService.ts';
import { WebsiteLanguage, websiteI18n } from '../services/i18n.ts';

interface VehicleShowroomPageProps {
  vehicle: Vehicle;
  onBack: () => void;
  onNavigateToHealth: (plate: string) => void;
  onToast: (msg: string) => void;
  lang?: WebsiteLanguage;
}

export const VehicleShowroomPage: React.FC<VehicleShowroomPageProps> = ({
  vehicle,
  onBack,
  onNavigateToHealth,
  onToast,
  lang = 'fr',
}) => {
  const t = websiteI18n[lang].showroom;
  const isEn = lang === 'en';
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFitCover, setIsFitCover] = useState(false);
  const [activeTab, setActiveTab] = useState<'rent' | 'buy'>(vehicle.isForRent ? 'rent' : 'buy');

  // Dates par défaut pour réservation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 4);

  const [startDate, setStartDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(inThreeDays.toISOString().split('T')[0]);
  const [withDriver, setWithDriver] = useState(false);
  const [destination, setDestination] = useState(isEn ? 'Douala City Center' : 'Douala intra-muros');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [financingNeeded, setFinancingNeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // État du Partenaire Connecté
  const [partner, setPartner] = useState<PartnerAccount | null>(null);
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);

  // Vérification de la session Partenaire
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const p = await fetchCurrentPartnerProfile(u.uid, u.email || '');
        setPartner(p);
      } else {
        setPartner(null);
      }
    });
    return () => unsub();
  }, []);

  // Injection des balises OpenGraph dynamiques pour que l'image apparaisse lors du partage
  React.useEffect(() => {
    if (!vehicle) return;
    const photo = vehicle.photoUrls?.[0] || '';
    const setMeta = (attr: string, key: string, content: string) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMeta('property', 'og:title', `${vehicle.brand} ${vehicle.model} (${vehicle.year}) • FCT Automobile Douala`);
    setMeta('property', 'og:description', `${vehicle.category} • Garanti & certifié FCT Automobile Douala.`);
    if (photo) {
      setMeta('property', 'og:image', photo);
      setMeta('name', 'twitter:image', photo);
      setMeta('property', 'og:image:alt', `${vehicle.brand} ${vehicle.model}`);
    }
    setMeta('name', 'twitter:card', 'summary_large_image');
  }, [vehicle]);

  // Déclenchement du partage avec tracking Firestore
  const handlePartnerShare = async (platform: SharePlatform) => {
    if (!partner) return;
    const affUrl = generateAffiliateUrl(vehicle.id, partner.partnerCode);
    const isRent = activeTab === 'rent';
    const copyText = generateShareCopyText(vehicle, affUrl, isRent);
    const photoUrl = vehicle.photoUrls?.[0] || '';

    await logPartnerShare(partner, vehicle, platform);

    if (platform === 'WHATSAPP_STATUS' || platform === 'WHATSAPP_CHAT') {
      // Priorité absolue au partage média natif : l'image part d'abord et le texte vient en légende en dessous
      if (typeof navigator !== 'undefined' && navigator.share && photoUrl) {
        try {
          const imageFile = await fetchVehicleImageFile(photoUrl, `${vehicle.brand}_${vehicle.model}.jpg`);
          if (imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
              files: [imageFile],
              title: `FCT Automobile - ${vehicle.brand} ${vehicle.model}`,
              text: copyText,
            });
            onToast(isEn ? 'Photo and description sent to WhatsApp!' : 'Photo et description envoyées vers WhatsApp !');
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
          console.info('[FCT WhatsApp] Fallback URL :', shareErr);
        }
      }

      // Fallback ordinateur ou sans Web Share fichiers : copie de la photo + ouverture WhatsApp
      if (photoUrl) {
        const copied = await copyImageToClipboard(photoUrl);
        if (!copied) {
          downloadVehiclePhoto(photoUrl, `fct-${vehicle.brand}-${vehicle.model}.jpg`);
        }
      }
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(copyText)}`, '_blank');
      onToast(
        isEn
          ? 'Photo ready & text copied! Paste into WhatsApp (image is sent first with text below).'
          : 'Photo prête & texte copié ! Collez l’image dans WhatsApp (l’image part d’abord avec le texte en dessous).'
      );
    } else if (platform === 'UNIVERSAL_SHARE' || platform === 'FACEBOOK') {
      // Partage universel natif (ouvre l'overlay OS avec toutes les applications installées)
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          let filesToShare: File[] | undefined = undefined;
          if (photoUrl) {
            const imageFile = await fetchVehicleImageFile(photoUrl, `${vehicle.brand}_${vehicle.model}.jpg`);
            if (imageFile && typeof navigator.canShare === 'function' && navigator.canShare({ files: [imageFile] })) {
              filesToShare = [imageFile];
            }
          }

          const shareData: ShareData = {
            title: `FCT Automobile - ${vehicle.brand} ${vehicle.model}`,
            text: copyText,
            url: affUrl,
            ...(filesToShare && filesToShare.length > 0 ? { files: filesToShare } : {}),
          };

          await navigator.share(shareData);
          onToast(isEn ? 'Vehicle link shared!' : 'Lien et fiche véhicule partagés !');
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return; // Annulation volontaire par l'utilisateur
          console.warn('[FCT Share] Erreur navigator.share :', err);
        }
      }

      // Fallback si navigateur de bureau sans share sheet
      try {
        await navigator.clipboard.writeText(`${copyText}\n\nPhoto : ${photoUrl || affUrl}`);
        setCopiedAffiliate(true);
        setTimeout(() => setCopiedAffiliate(false), 3000);
        onToast(isEn ? 'Affiliate link and vehicle card copied!' : 'Lien affilié et fiche véhicule copiés !');
      } catch {
        onToast(isEn ? 'Could not share link.' : 'Impossible de copier le lien.');
      }
    } else if (platform === 'COPY_LINK') {
      try {
        await navigator.clipboard.writeText(affUrl);
        setCopiedAffiliate(true);
        setTimeout(() => setCopiedAffiliate(false), 3000);
        onToast(isEn ? 'Partner affiliate link copied!' : 'Lien affilié copié avec succès !');
      } catch {
        onToast(isEn ? 'Could not copy link.' : 'Impossible de copier le lien.');
      }
    }
  };

  // Photos réelles ou aperçu stylisé
  const photos = vehicle.photoUrls && vehicle.photoUrls.length > 0 ? vehicle.photoUrls : [];

  // Données de maintenance certifiée associées
  const hasHealthPassport = Boolean(vehicle.licensePlate);
  const [healthRecords, setHealthRecords] = useState<MaintenanceRecordItem[]>([]);

  useEffect(() => {
    if (!vehicle.licensePlate) {
      setHealthRecords([]);
      return;
    }
    let active = true;
    fetchVehicleHealthPassport(vehicle.licensePlate).then((res) => {
      if (active && res) {
        setHealthRecords(res.records);
      }
    });
    return () => {
      active = false;
    };
  }, [vehicle.licensePlate]);

  // Calcul du nombre de jours et des montants
  const totalDays = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [startDate, endDate]);

  const rentalTotal = vehicle.rentalDailyRate * totalDays;
  const driverTotal = withDriver ? FCT_AGENCY_INFO.driverDailyRateXAF * totalDays : 0;
  const totalRentalAmount = rentalTotal + driverTotal;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert(isEn ? 'Please provide your full name and phone number.' : 'Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    setSubmitting(true);
    const res = await submitBooking({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
      clientName,
      clientPhone,
      clientEmail,
      startDate,
      endDate,
      withDriver,
      destination,
      dailyRate: vehicle.rentalDailyRate,
      driverFee: FCT_AGENCY_INFO.driverDailyRateXAF,
      totalDays,
      totalAmount: totalRentalAmount,
      depositAmount: vehicle.securityDepositRate,
      notes,
    });
    setSubmitting(false);

    if (res.success) {
      onToast(
        isEn
          ? `Booking request submitted for ${vehicle.brand} ${vehicle.model}! Our team will contact you promptly.`
          : `Demande de réservation enregistrée pour ${vehicle.brand} ${vehicle.model} ! Nos équipes vous contactent sans délai.`
      );
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert(isEn ? 'Please provide your full name and phone number.' : 'Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    setSubmitting(true);
    const res = await submitPurchaseLead({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
      clientName,
      clientPhone,
      clientEmail,
      financingNeeded,
      notes,
    });
    setSubmitting(false);

    if (res.success) {
      onToast(
        isEn
          ? `Your proforma quote request for ${vehicle.brand} ${vehicle.model} has been received!`
          : `Votre demande de devis proforma pour ${vehicle.brand} ${vehicle.model} a été reçue !`
      );
    }
  };

  return (
    <div className="fct-showroom-page">
      <div className="fct-container">
        {/* Navigation Supérieure Épurée */}
        <div className="fct-showroom-top-nav">
          <button onClick={onBack} className="fct-back-link">
            <ChevronLeft size={16} />
            <span>{isEn ? 'Back to fleet' : 'Retour au catalogue'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="fct-badge fct-badge-blue">{vehicle.category}</span>
            {vehicle.conditionGrade && (
              <span className="fct-badge fct-badge-green">
                <Award size={13} />
                {vehicle.conditionGrade}
              </span>
            )}
            {vehicle.licensePlate && (
              <div className="fct-showroom-plate-badge" title={isEn ? 'Certified CEMAC plate' : 'Immatriculation CEMAC certifiée'}>
                <Shield size={12} style={{ color: '#38bdf8' }} />
                <span>{vehicle.licensePlate}</span>
              </div>
            )}
          </div>
        </div>

        {/* En-tête Prestigieux du Showroom */}
        <div className="fct-showroom-header">
          <div className="fct-showroom-title-wrap">
            <h1 className="fct-showroom-title">
              {vehicle.brand} {vehicle.model}{' '}
              <span style={{ color: 'var(--fct-blue-primary)', fontWeight: 700 }}>({vehicle.year})</span>
            </h1>
            <div className="fct-showroom-subtitle">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color="var(--fct-blue-primary)" />
                {vehicle.currentLocation || (isEn ? 'FCT Bonamoussadi Agency, Douala' : 'Agence FCT Bonamoussadi, Douala')}
              </span>
              <span>•</span>
              <span>{isEn ? 'Color:' : 'Couleur :'} <strong>{vehicle.color}</strong></span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--fct-green-primary)', fontWeight: 700 }}>
                <CheckCircle2 size={13} />
                <span>{vehicle.status === 'AVAILABLE' ? (isEn ? 'Available in showroom' : 'Disponible au showroom') : (isEn ? 'In servicing' : 'En révision')}</span>
              </span>
            </div>
          </div>

          {/* Boutons d'Action Rapide */}
          <div className="fct-showroom-actions-fast">
            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=${encodeURIComponent(
                isEn
                  ? `Hello FCT Automobile, I would like more information regarding the showroom vehicle ${vehicle.brand} ${vehicle.model}.`
                  : `Bonjour FCT Automobile, je souhaite des informations sur le showroom du véhicule ${vehicle.brand} ${vehicle.model}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald"
            >
              <MessageSquare size={16} />
              <span>WhatsApp Showroom</span>
            </a>
            <a href={`tel:${FCT_AGENCY_INFO.phone1}`} className="btn-secondary">
              <Phone size={16} />
              <span>{isEn ? 'Call Agency' : "Appeler l'Agence"}</span>
            </a>
          </div>
        </div>

        {/* Grille Principale Showroom */}
        <div className="fct-showroom-grid">
          {/* Colonne de Gauche : Galerie Studio HD + Fiche Technique + Carnet */}
          <div>
            {/* Galerie d'Images Showroom Studio (Zéro Coupe) */}
            <div className="fct-showroom-gallery">
              <div
                className={`fct-gallery-main ${isFitCover ? 'fit-cover' : ''}`}
                onClick={() => photos.length > 0 && setIsLightboxOpen(true)}
                title={isEn ? 'Click to view full screen high resolution' : 'Cliquer pour afficher en plein écran haute résolution'}
              >
                {photos.length > 0 ? (
                  <img
                    src={photos[activePhotoIdx]}
                    alt={`${vehicle.brand} ${vehicle.model} - ${isEn ? 'Official FCT Showroom' : 'Vue Showroom Officielle FCT'}`}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
                    <Car size={72} strokeWidth={1.4} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
                      {isEn ? 'Official FCT Automobile Douala Showroom' : 'Showroom Officiel FCT Automobile Douala'}
                    </span>
                  </div>
                )}

                {/* Flèches de navigation si plusieurs photos */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="fct-gallery-arrow left"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                      }}
                      aria-label={isEn ? 'Previous photo' : 'Photo précédente'}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="fct-gallery-arrow right"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                      }}
                      aria-label={isEn ? 'Next photo' : 'Photo suivante'}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Contrôles de Galerie Overlay */}
                <div className="fct-gallery-controls" onClick={(e) => e.stopPropagation()}>
                  {photos.length > 1 && (
                    <span className="fct-gallery-btn" style={{ cursor: 'default' }}>
                      {activePhotoIdx + 1} / {photos.length}
                    </span>
                  )}
                  <button
                    type="button"
                    className="fct-gallery-btn"
                    onClick={() => setIsFitCover(!isFitCover)}
                    title={isFitCover ? (isEn ? 'Show whole image' : "Afficher l'image entière sans coupure") : (isEn ? 'Fill frame' : 'Remplir le cadre')}
                  >
                    <Eye size={13} />
                    <span>{isFitCover ? (isEn ? 'Full View' : 'Vue Entière') : (isEn ? 'Fill' : 'Remplir')}</span>
                  </button>
                  <button
                    type="button"
                    className="fct-gallery-btn"
                    onClick={() => setIsLightboxOpen(true)}
                    title={isEn ? 'Zoom full screen' : 'Agrandir en plein écran'}
                  >
                    <Maximize2 size={13} />
                    <span>Zoom HD</span>
                  </button>
                </div>
              </div>

              {/* Miniatures cliquables */}
              {photos.length > 1 && (
                <div className="fct-gallery-thumbs">
                  {photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`fct-thumb-btn ${idx === activePhotoIdx ? 'active' : ''}`}
                      title={`${isEn ? 'Photo' : 'Photo'} ${idx + 1}`}
                    >
                      <img src={p} alt={`${isEn ? 'View' : 'Vue'} ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Puces Clés du Véhicule sous la photo */}
              <div className="fct-showroom-quick-specs">
                <div className="fct-quick-spec-item">
                  <div className="fct-quick-spec-icon">
                    <Settings2 size={18} />
                  </div>
                  <div className="fct-quick-spec-info">
                    <small>{isEn ? 'Gearbox' : 'Boîte'}</small>
                    <strong>
                      {vehicle.transmission === 'AUTOMATIQUE'
                        ? (isEn ? 'Automatic' : 'Automatique')
                        : (isEn ? 'Manual' : 'Manuelle')}
                    </strong>
                  </div>
                </div>

                <div className="fct-quick-spec-item">
                  <div className="fct-quick-spec-icon">
                    <Fuel size={18} />
                  </div>
                  <div className="fct-quick-spec-info">
                    <small>{isEn ? 'Fuel' : 'Énergie'}</small>
                    <strong>{vehicle.fuel}</strong>
                  </div>
                </div>

                <div className="fct-quick-spec-item">
                  <div className="fct-quick-spec-icon">
                    <Users size={18} />
                  </div>
                  <div className="fct-quick-spec-info">
                    <small>{isEn ? 'Capacity' : 'Capacité'}</small>
                    <strong>{vehicle.seats} {isEn ? 'Seats' : 'Places'}</strong>
                  </div>
                </div>

                <div className="fct-quick-spec-item">
                  <div className="fct-quick-spec-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="fct-quick-spec-info">
                    <small>{isEn ? 'Warranty' : 'Garantie'}</small>
                    <strong>{isEn ? '110 Checked Pts' : '110 Pts Contrôlés'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Détaillée */}
            <div className="fct-showroom-specs-box" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                {isEn ? 'Vehicle Overview' : 'Présentation du Véhicule'}
              </h3>
              <p style={{ marginTop: 12, fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7 }}>
                {vehicle.description}
              </p>

              {/* Équipements de Série */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: 'var(--fct-blue-dark)', marginBottom: 12 }}>
                    {isEn ? 'Standard & Premium Equipment' : 'Équipements & Options de Prestige'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {vehicle.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-sub)' }}>
                        <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fiche Technique Complète */}
            <div className="fct-showroom-specs-box">
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                {isEn ? 'Certified Technical Specs' : 'Fiche Technique Homologuée'}
              </h3>
              <div className="fct-specs-grid-full">
                <div className="fct-spec-box">
                  <strong>{isEn ? 'Transmission' : 'Transmission'}</strong>
                  <span>
                    {vehicle.transmission === 'AUTOMATIQUE'
                      ? (isEn ? 'Automatic Gearbox' : 'Boîte Automatique')
                      : (isEn ? 'Manual Gearbox' : 'Boîte Manuelle')}
                  </span>
                </div>
                <div className="fct-spec-box">
                  <strong>{isEn ? 'Fuel Type' : 'Carburation'}</strong>
                  <span>{vehicle.fuel}</span>
                </div>
                <div className="fct-spec-box">
                  <strong>{isEn ? 'Seating Capacity' : "Capacité d'Accueil"}</strong>
                  <span>{vehicle.seats} {isEn ? 'Seats' : 'Places Assises'}</span>
                </div>
                <div className="fct-spec-box">
                  <strong>{isEn ? 'Odometer' : 'Kilométrage Compteur'}</strong>
                  <span>{vehicle.mileage.toLocaleString(isEn ? 'en-US' : 'fr-FR')} {isEn ? 'certified km' : 'km certifiés'}</span>
                </div>
                <div className="fct-spec-box">
                  <strong>{isEn ? 'Engine' : 'Motorisation'}</strong>
                  <span>{vehicle.engineDisplacement || (isEn ? 'Manufacturer standard' : 'Conforme fiche constructeur')}</span>
                </div>
                <div className="fct-spec-box">
                  <strong>{isEn ? 'Power' : 'Puissance'}</strong>
                  <span>{vehicle.horsepower || (isEn ? 'Tropicalized' : 'Tropicalisé')}</span>
                </div>
              </div>
            </div>

            {/* Historique du Carnet de Santé Associé */}
            {hasHealthPassport && (
              <div className="fct-showroom-specs-box" style={{ borderLeft: '4px solid var(--fct-green-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={24} color="#059669" />
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                        {isEn ? 'Guaranteed Service Booklet' : "Passeport d'Entretien Garanti"}
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {isEn
                          ? 'Certified operations performed at FCT Central Bassa workshop'
                          : 'Interventions certifiées réalisées au garage FCT Central Bassa'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateToHealth(vehicle.licensePlate!)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    {isEn ? 'View full booklet' : 'Voir carnet complet'}
                  </button>
                </div>

                {healthRecords.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    {healthRecords.slice(0, 3).map((rec: MaintenanceRecordItem) => (
                      <div
                        key={rec.id}
                        style={{
                          padding: '12px 16px',
                          background: 'var(--bg-surface-alt)',
                          borderRadius: 10,
                          border: '1px solid var(--border-subtle)',
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--fct-blue-dark)' }}>
                          <span>{rec.type}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{formatDateFR(rec.date)}</span>
                        </div>
                        <p style={{ color: 'var(--text-sub)', marginTop: 4 }}>{rec.workDescription}</p>
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                          {isEn ? 'Approved by:' : 'Validé par :'} <strong>{rec.certifiedBy}</strong> ({rec.mileageKm.toLocaleString(isEn ? 'en-US' : 'fr-FR')} km)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne de Droite : Bloc d'Action Intégré dans la Page (Zéro Popup) */}
          <div>
            {/* Widget Espace Partenaire FCT */}
            {/* Widget Espace Partenaire FCT — Redesign officiel prestige dans le thème */}
            {partner ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(15,42,74,0.04) 0%, rgba(30,58,138,0.07) 100%)',
                  border: '1.5px solid rgba(15,42,74,0.15)',
                  boxShadow: '0 4px 16px rgba(15,42,74,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: 'var(--fct-blue-soft, #e0e7ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--fct-blue-dark, #0f2a4a)',
                      }}
                    >
                      <Handshake size={16} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--fct-blue-dark, #0f2a4a)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isEn ? 'FCT Partner Area' : 'Espace Partenaire FCT'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      backgroundColor: '#ffffff',
                      color: 'var(--fct-blue-primary, #1e3a8a)',
                      padding: '3px 10px',
                      borderRadius: 6,
                      border: '1.5px solid rgba(30, 58, 138, 0.2)',
                      boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                    }}
                  >
                    {partner.partnerCode}
                  </span>
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--text-sub, #475569)', marginBottom: 14, lineHeight: 1.45 }}>
                  {isEn
                    ? 'Share this vehicle to earn verified commissions on rental or purchase.'
                    : 'Republiez ce véhicule pour toucher vos commissions sur location ou vente.'}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handlePartnerShare('WHATSAPP_STATUS')}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '0 14px',
                      borderRadius: 10,
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <WhatsAppIcon size={16} color="#ffffff" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePartnerShare('UNIVERSAL_SHARE')}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '0 14px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, var(--fct-blue-primary, #1e3a8a) 0%, var(--fct-blue-dark, #0f2a4a) 100%)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(15, 42, 74, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                    title={isEn ? 'Share via any app (WhatsApp, Facebook, Telegram, SMS...)' : 'Partager via toute application (WhatsApp, Facebook, Telegram, SMS...)'}
                  >
                    <Share2 size={15} />
                    <span>{isEn ? 'Share' : 'Partager'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePartnerShare('COPY_LINK')}
                    style={{
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '0 14px',
                      borderRadius: 10,
                      backgroundColor: '#ffffff',
                      color: 'var(--fct-blue-dark, #0f2a4a)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      border: '1.5px solid var(--border-medium, #cbd5e1)',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedAffiliate ? <CheckCircle2 size={15} color="#059669" /> : <Copy size={15} />}
                    <span>{copiedAffiliate ? (isEn ? 'Copied' : 'Copié') : (isEn ? 'Link' : 'Lien')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(15,42,74,0.03) 0%, rgba(30,58,138,0.06) 100%)',
                  border: '1.5px dashed rgba(15,42,74,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Handshake size={18} color="var(--fct-blue-primary, #1e3a8a)" />
                  <div style={{ fontSize: 12.5, color: 'var(--text-sub, #475569)' }}>
                    <strong style={{ color: 'var(--fct-blue-dark, #0f2a4a)' }}>{isEn ? 'Partner Program: ' : 'Apporteur d\'affaires : '}</strong>
                    {isEn ? 'Earn cash commissions by sharing this car.' : 'Gagnez des commissions en partageant ce véhicule.'}
                  </div>
                </div>
                <a
                  href="#/partenaires"
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    background: 'var(--fct-blue-primary, #1e3a8a)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(30, 58, 138, 0.2)',
                  }}
                >
                  {isEn ? 'Join' : 'Rejoindre'}
                </a>
              </div>
            )}

            <div className="fct-showroom-action-card">
              {/* Onglets Location vs Achat si les deux sont disponibles */}
              {vehicle.isForRent && vehicle.isForSale && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--bg-surface-alt)', padding: 4, borderRadius: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rent')}
                    className={`btn-secondary ${activeTab === 'rent' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                  >
                    {isEn ? 'Rent this vehicle' : 'Louer ce véhicule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('buy')}
                    className={`btn-secondary ${activeTab === 'buy' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                  >
                    {isEn ? 'Buy this vehicle' : 'Acheter ce véhicule'}
                  </button>
                </div>
              )}

              {/* Cas 1 : Formulaire de Location Intégré */}
              {activeTab === 'rent' && vehicle.isForRent && (
                <form onSubmit={handleBookingSubmit}>
                  <div className="fct-showroom-price-box">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fct-blue-primary)', textTransform: 'uppercase' }}>
                      {isEn ? 'Daily Rental Rate' : 'Tarif Location Journalier'}
                    </span>
                    <div className="fct-showroom-price-val">
                      {formatXAF(vehicle.rentalDailyRate)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{isEn ? '/ day' : '/ jour'}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                      {isEn ? 'Refundable deposit:' : 'Caution remboursable :'} <strong>{formatXAF(vehicle.securityDepositRate)}</strong>
                    </span>
                  </div>

                  <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 14 }}>
                    {isEn ? 'Direct Vehicle Reservation' : 'Réserver directement ce véhicule'}
                  </h4>

                  <div className="fct-form-row">
                    <div className="fct-field">
                      <label className="fct-label">{isEn ? 'Pick-up Date' : 'Date de départ'}</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="fct-input"
                        required
                      />
                    </div>
                    <div className="fct-field">
                      <label className="fct-label">{isEn ? 'Return Date' : 'Date de restitution'}</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="fct-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Destination Area' : 'Zone de déplacement'}</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="fct-select"
                    >
                      <option value={isEn ? 'Douala City Center' : 'Douala intra-muros'}>
                        {isEn ? 'Douala City Center' : 'Douala intra-muros'}
                      </option>
                      <option value={isEn ? 'Douala - Yaoundé Highway' : 'Axe Douala - Yaoundé'}>
                        {isEn ? 'Douala - Yaoundé Highway' : 'Axe Douala - Yaoundé'}
                      </option>
                      <option value={isEn ? 'Douala - Kribi Seaside' : 'Axe Douala - Kribi'}>
                        {isEn ? 'Douala - Kribi Seaside' : 'Axe Douala - Kribi'}
                      </option>
                      <option value={isEn ? 'West Region / Bafoussam' : 'Région Ouest / Bafoussam'}>
                        {isEn ? 'West Region / Bafoussam' : 'Région Ouest / Bafoussam'}
                      </option>
                      <option value={isEn ? 'National Cameroon Mission' : 'Mission Nationale Cameroun'}>
                        {isEn ? 'National Cameroon Mission' : 'Mission Nationale Cameroun'}
                      </option>
                    </select>
                  </div>

                  <div className="fct-field">
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--fct-blue-dark)',
                        cursor: 'pointer',
                        padding: '10px 14px',
                        background: 'var(--fct-green-soft)',
                        border: '1px solid rgba(5, 150, 105, 0.2)',
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={withDriver}
                        onChange={(e) => setWithDriver(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#059669' }}
                      />
                      <span>{isEn ? 'Dedicated FCT Professional Chauffeur (+15,000 XAF/day)' : 'Option Chauffeur Professionnel FCT (+15 000 FCFA/j)'}</span>
                    </label>
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Full Name *' : 'Nom complet *'}</label>
                    <input
                      type="text"
                      placeholder={isEn ? 'e.g. Alain BIYIK' : 'Ex: Alain BIYIK'}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Phone / WhatsApp *' : 'Numéro Téléphone / WhatsApp *'}</label>
                    <input
                      type="tel"
                      placeholder="+237 6XX XX XX XX"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Email Address' : 'Adresse Courriel'}</label>
                    <input
                      type="email"
                      placeholder={isEn ? 'your.email@domain.com' : 'votre.email@domaine.cm'}
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="fct-input"
                    />
                  </div>

                  {/* Décompte Financier en Direct */}
                  <div
                    style={{
                      background: 'var(--bg-surface-alt)',
                      padding: 16,
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 20,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>{isEn ? `Rental (${totalDays} day${totalDays > 1 ? 's' : ''})` : `Location (${totalDays} jour${totalDays > 1 ? 's' : ''})`}</span>
                      <strong>{formatXAF(rentalTotal)}</strong>
                    </div>
                    {withDriver && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--fct-green-primary)' }}>
                        <span>{isEn ? `FCT Chauffeur (${totalDays} d)` : `Chauffeur FCT (${totalDays} j)`}</span>
                        <strong>{formatXAF(driverTotal)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-muted)' }}>
                      <span>{isEn ? 'Security deposit (refundable)' : 'Caution (restituée)'}</span>
                      <span>{formatXAF(vehicle.securityDepositRate)}</span>
                    </div>
                    <div
                      style={{
                        borderTop: '1.5px solid var(--border-medium)',
                        paddingTop: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 16,
                        fontWeight: 900,
                        color: 'var(--fct-blue-dark)',
                      }}
                    >
                      <span>{isEn ? 'Total Amount' : 'Montant Total'}</span>
                      <span>{formatXAF(totalRentalAmount)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
                  >
                    <KeyRound size={18} />
                    <span>{submitting ? (isEn ? 'Sending...' : 'Envoi...') : (isEn ? 'Confirm Reservation' : 'Confirmer ma Réservation')}</span>
                  </button>
                </form>
              )}

              {/* Cas 2 : Formulaire d'Achat & Devis Proforma Intégré */}
              {activeTab === 'buy' && vehicle.isForSale && (
                <form onSubmit={handlePurchaseSubmit}>
                  <div className="fct-showroom-price-box">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fct-blue-primary)', textTransform: 'uppercase' }}>
                      {isEn ? 'Certified Purchase Price' : "Prix d'Acquisition Certifié"}
                    </span>
                    <div className="fct-showroom-price-val">
                      {formatXAF(vehicle.salePrice)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                      {isEn ? 'All Taxes incl. · 110-point check · CEMAC papers included' : 'TTC · Contrôlé 110 points · Papiers CEMAC inclus'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 14 }}>
                    {isEn ? 'Request Official Proforma Invoice' : 'Demande de Devis Proforma Officiel'}
                  </h4>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Full Name *' : 'Nom et Prénom *'}</label>
                    <input
                      type="text"
                      placeholder={isEn ? 'e.g. Mrs. Chantal EWANE' : 'Ex: Mme. Chantal EWANE'}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Phone / WhatsApp *' : 'Téléphone / WhatsApp *'}</label>
                    <input
                      type="tel"
                      placeholder="+237 6XX XX XX XX"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Email Address' : 'Adresse Courriel'}</label>
                    <input
                      type="email"
                      placeholder={isEn ? 'director@company.cm' : 'direction@entreprise.cm'}
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="fct-input"
                    />
                  </div>

                  <div className="fct-field">
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--fct-blue-dark)',
                        cursor: 'pointer',
                        padding: '10px 14px',
                        background: 'var(--fct-blue-soft)',
                        border: '1px solid rgba(30, 58, 138, 0.2)',
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={financingNeeded}
                        onChange={(e) => setFinancingNeeded(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#1e3a8a' }}
                      />
                      <span>{isEn ? 'Hire Purchase / Corporate Lease Option' : 'Option Crédit-Bail / Leasing Société'}</span>
                    </label>
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">{isEn ? 'Specific requests or questions' : 'Précisions ou questions'}</label>
                    <textarea
                      rows={3}
                      placeholder={isEn ? 'Desired test drive in Douala, payment conditions...' : 'Essai routier souhaité à Bonamoussadi, modalité de paiement...'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="fct-textarea"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
                  >
                    <ShoppingBag size={18} />
                    <span>{submitting ? (isEn ? 'Sending...' : 'Envoi...') : (isEn ? 'Request Proforma Invoice' : 'Demander la Facture Proforma')}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lightbox Haute Définition Plein Écran */}
      {isLightboxOpen && photos.length > 0 && (
        <div className="fct-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <button
            type="button"
            className="fct-lightbox-close"
            onClick={() => setIsLightboxOpen(false)}
            aria-label={isEn ? 'Close full screen' : 'Fermer le plein écran'}
          >
            <X size={22} />
          </button>
          <div className="fct-lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[activePhotoIdx]}
              alt={`${vehicle.brand} ${vehicle.model} - ${isEn ? 'Full screen' : 'Plein écran'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

