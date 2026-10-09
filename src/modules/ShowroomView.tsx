/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Showroom Virtuel & Fiche Commerciale Véhicule
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useEffect } from 'react';
import { Vehicle, UserRole } from '../../packages/shared-types/index.ts';
import { Language, translations } from '../services/i18n.ts';
import { formatXAF, hasPermission } from '../../packages/business-rules/index.ts';
import { dbStore } from '../services/dbStore.ts';
import { CloudinaryUploadDropzone } from '../components/ui/CloudinaryUploadDropzone.tsx';
import { printElementById } from '../utils/printDocument.ts';
import {
  Car,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  Printer,
  CheckCircle2,
  Fuel,
  Gauge,
  Calendar,
  Shield,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  Check,
  Eye,
  KeyRound,
  TrendingUp,
  CalendarCheck2,
  Plus,
  X,
  Trash2,
  Send,
  Settings2,
  Users,
  ShieldCheck,
  FileText,
  Layers,
} from 'lucide-react';

// Official SVG Brand Icons (monochrome/accented, zero emojis)
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.476-.15-.677.15-.2.302-.777.98-.953 1.181-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.787-1.677-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.3-.502.101-.2.05-.376-.025-.526-.075-.15-.677-1.632-.928-2.235-.245-.588-.494-.509-.678-.518l-.578-.01c-.2 0-.526.075-.802.376-.276.301-1.053 1.029-1.053 2.509s1.079 2.91 1.229 3.11c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.126-.276-.201-.577-.351zm-5.419 7.42c-2.015 0-3.99-.54-5.719-1.562l-.41-.243-4.251 1.115 1.135-4.143-.267-.425c-1.124-1.79-1.719-3.86-1.719-5.986 0-6.19 5.037-11.228 11.231-11.228 3.001 0 5.82 1.168 7.942 3.29 2.122 2.123 3.29 4.943 3.29 7.942 0 6.192-5.037 11.23-11.232 11.23z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
  </svg>
);

interface ShowroomViewProps {
  vehicle: Vehicle;
  lang: Language;
  currentUserRole: UserRole;
  onBack: () => void;
  onBookRental?: (vehicleId: string) => void;
  onCreateSale?: (vehicleId: string) => void;
  onReserve?: (vehicleId: string) => void;
}

export const ShowroomView: React.FC<ShowroomViewProps> = ({
  vehicle,
  lang,
  currentUserRole,
  onBack,
  onBookRental,
  onCreateSale,
  onReserve,
}) => {
  const t = translations[lang];
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<Array<{ id: string; url: string; angle: string }>>([]);

  // Always reset scroll to top when opening showroom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [vehicle.id]);

  const angleLabels = [
    lang === 'fr' ? '1. Face Avant 3/4' : '1. Front 3/4 Angle',
    lang === 'fr' ? '2. Profil Latéral' : '2. Side Profile',
    lang === 'fr' ? '3. Vue Arrière 3/4' : '3. Rear 3/4 Angle',
    lang === 'fr' ? '4. Cockpit & Sellerie' : '4. Cockpit & Interior',
    lang === 'fr' ? '5. Tableau de Bord' : '5. Dashboard & Steering',
    lang === 'fr' ? '6. Coffre & Bagages' : '6. Trunk & Cargo Space',
    lang === 'fr' ? '7. Compartiment Moteur' : '7. Engine Compartment',
  ];

  const PRESET_VIEW_ANGLES = [
    'Vue 3/4 Avant',
    'Face Avant Directe',
    'Profil Latéral Droit',
    'Profil Latéral Gauche',
    'Vue 3/4 Arrière',
    'Face Arrière Directe',
    'Intérieur Cockpit',
    'Tableau de Bord & Volant',
    'Sièges & Sellerie Arrière',
    'Coffre & Espace Bagages',
    'Compartiment Moteur & Châssis',
    'Jantes & Pneumatiques',
    'Détails Carrosserie',
  ];

  const shareText = `*FRANCHISE CONSEILS TRADING (FCT) - Douala Automobile*
*Véhicule :* ${vehicle.brand} ${vehicle.model} (${vehicle.year})
*Immatriculation :* ${vehicle.licensePlate}
*Catégorie :* ${vehicle.category} | *Boîte :* ${vehicle.transmission} | *Carburant :* ${vehicle.fuel}
*Kilométrage :* ${vehicle.mileage.toLocaleString()} km
*Tarif Location :* ${formatXAF(vehicle.rentalDailyRate)} / jour (Caution : ${formatXAF(vehicle.securityDepositRate)})
${vehicle.isForSale ? `*Prix de Vente :* ${formatXAF(vehicle.salePrice)}` : ''}

*Disponibilité :* Agence FCT - Carrefour Santa Barbara, Bonamoussadi, Douala
*Réservations & Informations :* +237 699 45 88 12 / +237 677 32 10 99`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const tweet = `FCT Automobile Douala : ${vehicle.brand} ${vehicle.model} (${vehicle.year}) disponible à Bonamoussadi. Location & Vente. Info : +237 699 45 88 12`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}#showroom-${vehicle.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % vehicle.photoUrls.length);
  };

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + vehicle.photoUrls.length) % vehicle.photoUrls.length);
  };

  const getSuggestedAngleForIndex = (offset: number) => {
    const totalCount = vehicle.photoUrls.length + offset;
    return PRESET_VIEW_ANGLES[totalCount % PRESET_VIEW_ANGLES.length] || 'Vue Showroom';
  };

  const handleAddPhotosToPending = (urls: string[], defaultAngle?: string) => {
    setPendingPhotos((prev) => {
      const existingUrls = new Set(prev.map((p) => p.url));
      const seenInBatch = new Set<string>();
      const uniqueNewUrls = urls
        .map((u) => u.trim())
        .filter((u) => {
          if (!u || existingUrls.has(u) || seenInBatch.has(u)) return false;
          seenInBatch.add(u);
          return true;
        });

      if (uniqueNewUrls.length === 0) return prev;

      const newItems = uniqueNewUrls.map((url, i) => ({
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`,
        url,
        angle: defaultAngle || getSuggestedAngleForIndex(prev.length + i),
      }));

      return [...prev, ...newItems];
    });
  };

  const handleUpdatePendingAngle = (id: string, angle: string) => {
    setPendingPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, angle } : item))
    );
  };

  const handleRemovePendingPhoto = (id: string) => {
    setPendingPhotos((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveAllPhotos = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingPhotos.length === 0) return;
    try {
      const newUrls = pendingPhotos.map((p) => p.url);
      const newAngles = pendingPhotos.map((p) => p.angle);

      const existingAngles =
        vehicle.photoAngles && vehicle.photoAngles.length === vehicle.photoUrls.length
          ? vehicle.photoAngles
          : vehicle.photoUrls.map((_, i) => angleLabels[i] || `Vue ${i + 1}`);

      const updatedPhotos = [...vehicle.photoUrls, ...newUrls];
      const updatedAngles = [...existingAngles, ...newAngles];

      dbStore.updateVehicle(vehicle.id, {
        photoUrls: updatedPhotos,
        photoAngles: updatedAngles,
      });

      vehicle.photoUrls = updatedPhotos;
      vehicle.photoAngles = updatedAngles;

      setSelectedPhotoIndex(updatedPhotos.length - 1);
      setPendingPhotos([]);
      setIsAddPhotoModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const [photoToDeleteIndex, setPhotoToDeleteIndex] = useState<number | null>(null);

  const handleDeletePhotoConfirm = () => {
    if (photoToDeleteIndex === null || !vehicle) return;
    try {
      if (vehicle.photoUrls.length <= 1) {
        alert(
          lang === 'fr'
            ? 'Le véhicule doit conserver au moins une photo dans sa galerie.'
            : 'The vehicle must keep at least one photo in its gallery.'
        );
        setPhotoToDeleteIndex(null);
        return;
      }
      const updatedPhotos = vehicle.photoUrls.filter((_, idx) => idx !== photoToDeleteIndex);
      const existingAngles =
        vehicle.photoAngles && vehicle.photoAngles.length === vehicle.photoUrls.length
          ? vehicle.photoAngles
          : vehicle.photoUrls.map((_, i) => angleLabels[i] || `Vue ${i + 1}`);
      const updatedAngles = existingAngles.filter((_, idx) => idx !== photoToDeleteIndex);

      dbStore.updateVehicle(vehicle.id, {
        photoUrls: updatedPhotos,
        photoAngles: updatedAngles,
      });
      vehicle.photoUrls = updatedPhotos;
      vehicle.photoAngles = updatedAngles;

      if (selectedPhotoIndex >= updatedPhotos.length) {
        setSelectedPhotoIndex(Math.max(0, updatedPhotos.length - 1));
      }
      setPhotoToDeleteIndex(null);
    } catch (err) {
      console.error(err);
    }
  };

  const canCreateRental = hasPermission(currentUserRole, 'rentals', 'create');
  const canCreateSale = hasPermission(currentUserRole, 'sales', 'create');
  const canReserve = hasPermission(currentUserRole, 'reservations', 'create');
  const canEditVehicle = hasPermission(currentUserRole, 'vehicles', 'update');

  return (
    <div id="fct-vehicle-showroom-printable" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Executive Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 no-print">
        {/* Left Side: Back button + Breadcrumb contextual trail */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{t.showroom.backToFleet}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-1">
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800">{vehicle.brand} {vehicle.model}</span>
            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {vehicle.licensePlate}
            </span>
          </div>
        </div>

        {/* Right Side: Professional Sharing & Export Suite (No bright rainbow clutter) */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Social Share Group */}
          <div className="inline-flex items-center gap-1.5">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              title={t.showroom.shareWhatsApp}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              title={t.showroom.shareFacebook}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
              <span className="hidden sm:inline">Facebook</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={handleShareTwitter}
              title={t.showroom.shareTwitter}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <XIcon className="w-3 h-3 text-slate-900" />
              <span className="hidden sm:inline">X</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleShareTelegram}
              title="Partager sur Telegram"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-900 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <TelegramIcon className="w-3.5 h-3.5 text-[#229ED9]" />
              <span className="hidden sm:inline">Telegram</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Copy Link & Print */}
          <div className="inline-flex items-center gap-1.5">
            <button
              onClick={handleCopyLink}
              title={t.showroom.copyLink}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{t.showroom.linkCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.showroom.copyLink}</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                printElementById(
                  'fct-vehicle-showroom-printable',
                  `Fiche_${vehicle.brand}_${vehicle.model}_${vehicle.licensePlate}`
                )
              }
              title="Imprimer la Fiche Showroom"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Imprimer Fiche</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Showroom Grid: Visual Gallery (Left) & Key Commercial Specs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Angle Visual Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Main High-Res Viewer */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/10] shadow-md border border-slate-850 group">
            <img
              src={vehicle.photoUrls[selectedPhotoIndex] || vehicle.photoUrls[0]}
              alt={`${vehicle.brand} ${vehicle.model} - ${vehicle.photoAngles?.[selectedPhotoIndex] || angleLabels[selectedPhotoIndex] || 'Photo'}`}
              className="w-full h-full object-cover transition duration-300 select-none"
            />

            {/* Top Badges */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-slate-950/85 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm">
                {vehicle.brand} {vehicle.model}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-white font-bold text-xs backdrop-blur-md border border-white/10">
                {vehicle.year}
              </span>
            </div>

            <div className="absolute top-3.5 right-3.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-md backdrop-blur-md ${
                  vehicle.status === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white'
                    : vehicle.status === 'RENTED'
                    ? 'bg-blue-600 text-white'
                    : vehicle.status === 'MAINTENANCE'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {t.vehicleStatus[vehicle.status]}
              </span>
            </div>

            {/* Navigation Arrows for direct sliding */}
            {vehicle.photoUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover:opacity-100 cursor-pointer border border-white/10"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover:opacity-100 cursor-pointer border border-white/10"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Bottom Floating Indicators */}
            <div className="absolute bottom-3.5 left-3.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-semibold border border-white/10 flex items-center gap-2 shadow">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>{vehicle.photoAngles?.[selectedPhotoIndex] || angleLabels[selectedPhotoIndex] || `Vue ${selectedPhotoIndex + 1}`}</span>
              <span className="text-slate-400 text-[10px]">({selectedPhotoIndex + 1}/{vehicle.photoUrls.length})</span>
            </div>

            {/* Delete current photo action on main view */}
            {canEditVehicle && vehicle.photoUrls.length > 1 && (
              <button
                type="button"
                onClick={() => setPhotoToDeleteIndex(selectedPhotoIndex)}
                title={lang === 'fr' ? 'Supprimer cette photo de la galerie' : 'Delete this photo from gallery'}
                className="absolute bottom-3.5 left-44 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white font-bold text-xs shadow-md backdrop-blur-md transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'fr' ? 'Supprimer cette vue' : 'Delete angle'}</span>
              </button>
            )}

            {/* Plate Number watermark */}
            <div className="absolute bottom-3.5 right-3.5 bg-white/95 px-3 py-1.5 rounded-lg font-mono font-bold text-xs text-slate-950 shadow border border-slate-300">
              {vehicle.licensePlate}
            </div>
          </div>

          {/* Thumbnails Angle Selector Strip */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.showroom.allAngles} ({vehicle.photoUrls.length} {lang === 'fr' ? 'vues disponibles' : 'available views'})</span>
              </div>
              {canEditVehicle && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingPhotos([]);
                    setIsAddPhotoModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'fr' ? 'Ajouter des Photos' : 'Add Photos'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
              {vehicle.photoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group"
                  title={vehicle.photoAngles?.[idx] || angleLabels[idx] || `Vue ${idx + 1}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-full relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition cursor-pointer block ${
                      selectedPhotoIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={vehicle.photoAngles?.[idx] || `Angle ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[9px] font-bold text-white leading-none truncate max-w-full">
                        {vehicle.photoAngles?.[idx] || `#${idx + 1}`}
                      </span>
                    </div>
                  </button>

                  {/* Bouton de suppression directe sur la vignette */}
                  {canEditVehicle && vehicle.photoUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoToDeleteIndex(idx);
                      }}
                      title={lang === 'fr' ? `Supprimer la photo #${idx + 1}` : `Delete photo #${idx + 1}`}
                      className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer border border-white"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Fast Booking & Core Specs (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>{vehicle.category} • {vehicle.color}</span>
                <span className="font-mono text-slate-500">{vehicle.vin}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{vehicle.currentLocation}</span>
              </div>
            </div>

            {/* Financial Highlights Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-[#0f2a4a] to-emerald-950 text-white space-y-3 shadow-sm border border-slate-800">
              <div className="flex items-baseline justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs text-slate-300 font-medium">{t.showroom.dailyRate} :</span>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  {formatXAF(vehicle.rentalDailyRate)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{t.showroom.deposit} :</span>
                <span className="font-bold text-white">{formatXAF(vehicle.securityDepositRate)}</span>
              </div>

              {vehicle.isForSale && (
                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/10">
                  <span className="text-amber-200 font-medium">{t.showroom.salePrice} :</span>
                  <span className="font-black text-lg text-amber-300">{formatXAF(vehicle.salePrice)}</span>
                </div>
              )}
            </div>

            {/* Quick Specs Quick-View Matrix */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                <Fuel className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">{t.showroom.fuel}</div>
                  <div className="font-bold text-slate-800">{vehicle.fuel}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">{t.showroom.transmission}</div>
                  <div className="font-bold text-slate-800">{vehicle.transmission}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                <Gauge className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">{t.showroom.mileage}</div>
                  <div className="font-bold text-slate-800">{vehicle.mileage.toLocaleString()} km</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">{t.showroom.seats}</div>
                  <div className="font-bold text-slate-800">{vehicle.seats} places</div>
                </div>
              </div>
            </div>

            {/* Agency Contact Box */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-3">
              <Phone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-900">Agence FCT Santa Barbara Douala</span>
                <span className="text-[11px] text-emerald-800 block mt-0.5">
                  +237 699 45 88 12 • +237 677 32 10 99 • Carrefour Santa Barbara, Bonamoussadi
                </span>
              </div>
            </div>

            {/* Action Buttons (Strictly RBAC Enforced) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {canCreateRental && vehicle.isForRent && vehicle.status === 'AVAILABLE' && (
                <button
                  onClick={() => onBookRental?.(vehicle.id)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{t.showroom.bookRentalCTA}</span>
                </button>
              )}

              {canCreateSale && vehicle.isForSale && vehicle.status !== 'SOLD' && (
                <button
                  onClick={() => onCreateSale?.(vehicle.id)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{t.showroom.createSaleCTA}</span>
                </button>
              )}

              {canReserve && vehicle.status === 'AVAILABLE' && (
                <button
                  onClick={() => onReserve?.(vehicle.id)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CalendarCheck2 className="w-4 h-4 text-emerald-700" />
                  <span>{t.showroom.reserveCTA}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Description & Technical Specifications Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              {lang === 'fr' ? 'Présentation Détaillée du Véhicule' : 'Detailed Vehicle Overview'}
            </h2>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {vehicle.description ||
              `Ce véhicule ${vehicle.brand} ${vehicle.model} (${vehicle.year}) a été rigoureusement sélectionné et inspecté par l'équipe technique de Franchise Conseils Trading Douala. Il bénéficie d'un carnet d'entretien à jour, d'une visite technique CEMAC valide et d'une assurance tous risques conforme aux normes du Ministère des Transports du Cameroun.`}
          </p>
        </div>

        {/* Equipment & Features List */}
        {vehicle.features && vehicle.features.length > 0 && (
          <div>
            <h3 className="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">
              {t.showroom.featuresTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {vehicle.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Data Sheet */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">
            {t.showroom.specs}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-medium block">{t.showroom.power}</span>
              <span className="font-bold text-slate-800">{vehicle.horsepower || 'Standard Constructeur'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-medium block">{t.showroom.displacement}</span>
              <span className="font-bold text-slate-800">{vehicle.engineDisplacement || 'Non spécifié'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-medium block">{t.showroom.condition}</span>
              <span className="font-bold text-emerald-700">{vehicle.conditionGrade || 'Certifié A+'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-medium block">{t.showroom.inspectionDate}</span>
              <span className="font-bold text-slate-800">{vehicle.nextTechnicalInspectionDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Ajouter des Photos Multi-Angles au Showroom */}
      {isAddPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col p-6 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {lang === 'fr' ? 'Ajouter des Photos au Showroom' : 'Add Photos to Showroom'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'fr'
                      ? 'Téléversez plusieurs photos à la fois et configurez l\'angle de vue de chacune individuellement.'
                      : 'Upload multiple photos at once and set each individual camera angle.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingPhotos([]);
                  setIsAddPhotoModalOpen(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveAllPhotos} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
              {/* Cloudinary Multi-Upload Dropzone */}
              <CloudinaryUploadDropzone
                folder="fct_automobile/vehicles"
                accept="image/*"
                multiple={true}
                label={lang === 'fr' ? 'Photos du véhicule (Téléversement Cloudinary Multiple Direct) :' : 'Vehicle Photos (Direct Multiple Cloudinary Upload):'}
                helperText={lang === 'fr' ? 'Glissez ou sélectionnez plusieurs photos simultanément (JPG, PNG, WEBP)' : 'Select or drop one or multiple vehicle photos (JPG, PNG, WEBP)'}
                onMultipleUploadSuccess={(urls) => handleAddPhotosToPending(urls)}
                onUploadSuccess={() => {}}
              />


              {/* Staged Pending Photos with Individual Angle Selector */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {lang === 'fr' ? 'Photos prêtes à être intégrées' : 'Photos ready to be added'} ({pendingPhotos.length})
                    </span>
                  </div>
                  {pendingPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPendingPhotos([])}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer font-semibold"
                    >
                      {lang === 'fr' ? 'Tout effacer' : 'Clear all'}
                    </button>
                  )}
                </div>

                {pendingPhotos.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200 text-xs">
                    <p>{lang === 'fr' ? 'Aucune photo en attente.' : 'No pending photos.'}</p>
                    <p className="text-[11px] mt-0.5">
                      {lang === 'fr'
                        ? 'Téléversez des fichiers ci-dessus ou cliquez sur une suggestion pour préparer les photos.'
                        : 'Upload files above or click suggestions to prepare photos.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {pendingPhotos.map((item, pIndex) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 transition"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{pIndex + 1}
                        </span>
                        <img
                          src={item.url}
                          alt={`Aperçu ${pIndex + 1}`}
                          className="w-16 h-12 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            {lang === 'fr' ? 'Angle de vue individuel :' : 'Individual Camera Angle:'}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={item.angle}
                              onChange={(e) => handleUpdatePendingAngle(item.id, e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                            >
                              {PRESET_VIEW_ANGLES.map((ang) => (
                                <option key={ang} value={ang}>
                                  {ang}
                                </option>
                              ))}
                              {!PRESET_VIEW_ANGLES.includes(item.angle) && (
                                <option value={item.angle}>{item.angle}</option>
                              )}
                            </select>
                            <input
                              type="text"
                              value={item.angle}
                              placeholder={lang === 'fr' ? 'Personnalisé...' : 'Custom...'}
                              onChange={(e) => handleUpdatePendingAngle(item.id, e.target.value)}
                              className="w-32 p-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 bg-white"
                              title={lang === 'fr' ? 'Personnaliser le libellé de l\'angle' : 'Customize angle label'}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePendingPhoto(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                          title={lang === 'fr' ? 'Retirer cette photo' : 'Remove this photo'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
                <span className="text-slate-500 text-[11px]">
                  {pendingPhotos.length > 0
                    ? lang === 'fr'
                      ? `${pendingPhotos.length} photo(s) prête(s) à être ajoutée(s)`
                      : `${pendingPhotos.length} photo(s) ready to add`
                    : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPhotos([]);
                      setIsAddPhotoModalOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={pendingPhotos.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold transition cursor-pointer shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {lang === 'fr'
                        ? `Ajouter ${pendingPhotos.length > 0 ? `(${pendingPhotos.length}) ` : ''}au Showroom`
                        : `Add ${pendingPhotos.length > 0 ? `(${pendingPhotos.length}) ` : ''}to Showroom`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmation de Suppression de Photo */}
      {photoToDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-slate-900 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">
                {lang === 'fr' ? 'Supprimer cette photo ?' : 'Delete this photo?'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'fr'
                  ? `Voulez-vous retirer la vue #${photoToDeleteIndex + 1} de la galerie de ce véhicule ?`
                  : `Are you sure you want to remove angle #${photoToDeleteIndex + 1} from this gallery?`}
              </p>
            </div>

            {vehicle.photoUrls[photoToDeleteIndex] && (
              <div className="rounded-xl overflow-hidden aspect-[16/10] border border-slate-200 shadow-inner">
                <img
                  src={vehicle.photoUrls[photoToDeleteIndex]}
                  alt="Aperçu avant suppression"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDeleteIndex(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeletePhotoConfirm}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-md"
              >
                {lang === 'fr' ? 'Oui, supprimer' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
