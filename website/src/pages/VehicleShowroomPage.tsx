import React, { useState, useMemo } from 'react';
import {
  Car,
  ChevronLeft,
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
} from 'lucide-react';
import { Vehicle } from '../types/index.ts';
import { FCT_AGENCY_INFO, CERTIFIED_HEALTH_RECORDS } from '../data/defaultCatalog.ts';
import { formatXAF, formatDateFR } from '../utils/formatters.ts';
import { submitBooking, submitPurchaseLead } from '../services/firebase.ts';

interface VehicleShowroomPageProps {
  vehicle: Vehicle;
  onBack: () => void;
  onNavigateToHealth: (plate: string) => void;
  onToast: (msg: string) => void;
}

export const VehicleShowroomPage: React.FC<VehicleShowroomPageProps> = ({
  vehicle,
  onBack,
  onNavigateToHealth,
  onToast,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'rent' | 'buy'>(vehicle.isForRent ? 'rent' : 'buy');

  // Dates par défaut pour réservation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 4);

  const [startDate, setStartDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(inThreeDays.toISOString().split('T')[0]);
  const [withDriver, setWithDriver] = useState(false);
  const [destination, setDestination] = useState('Douala intra-muros');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [financingNeeded, setFinancingNeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Photos réelles ou aperçu stylisé
  const photos = vehicle.photoUrls && vehicle.photoUrls.length > 0 ? vehicle.photoUrls : [];

  // Données de maintenance certifiée associées
  const healthData = vehicle.licensePlate ? CERTIFIED_HEALTH_RECORDS[vehicle.licensePlate] : null;

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
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
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
      onToast(`Demande de réservation enregistrée pour ${vehicle.brand} ${vehicle.model} ! Nos équipes vous contactent sans délai.`);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
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
      onToast(`Votre demande de devis proforma pour ${vehicle.brand} ${vehicle.model} a été reçue !`);
    }
  };

  return (
    <div className="fct-showroom-page">
      <div className="fct-container">
        {/* Fil d'Ariane & Bouton Retour */}
        <div className="fct-breadcrumb">
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: 13, gap: 4 }}
          >
            <ChevronLeft size={16} />
            <span>Retour au catalogue</span>
          </button>
          <span>/</span>
          <span>Showroom Véhicule</span>
          <span>/</span>
          <strong style={{ color: 'var(--fct-blue-dark)' }}>
            {vehicle.brand} {vehicle.model}
          </strong>
        </div>

        {/* Titre & Badges d'En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span className="fct-badge fct-badge-blue">{vehicle.category}</span>
              {vehicle.conditionGrade && (
                <span className="fct-badge fct-badge-green">
                  <Award size={12} />
                  {vehicle.conditionGrade}
                </span>
              )}
              {vehicle.licensePlate && (
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    fontWeight: 700,
                  }}
                >
                  Plaque : {vehicle.licensePlate}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--fct-blue-dark)', lineHeight: 1.15 }}>
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: 14, marginTop: 4 }}>
              Couleur : <strong>{vehicle.color}</strong> · Emplacement : <strong>{vehicle.currentLocation}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={`https://wa.me/${FCT_AGENCY_INFO.whatsapp}?text=Bonjour%20FCT%20Automobile,%20je%20suis%20intéressé%20par%20le%20showroom%20du%20véhicule%20${encodeURIComponent(
                vehicle.brand + ' ' + vehicle.model
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
              <span>Appeler l'Agence</span>
            </a>
          </div>
        </div>

        {/* Grille Principale Showroom (Galerie Gauche + Action Droite) */}
        <div className="fct-showroom-grid">
          {/* Colonne de Gauche : Galerie & Spécifications & Carnet */}
          <div>
            {/* Galerie d'Images Showroom */}
            <div className="fct-showroom-gallery">
              <div className="fct-gallery-main">
                {photos.length > 0 ? (
                  <img src={photos[activePhotoIdx]} alt={`${vehicle.brand} ${vehicle.model}`} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--fct-blue-primary)' }}>
                    <Car size={80} strokeWidth={1.4} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)' }}>
                      Showroom Officiel FCT Automobile Douala
                    </span>
                  </div>
                )}
              </div>

              {/* Miniatures cliquables si plusieurs photos */}
              {photos.length > 1 && (
                <div className="fct-gallery-thumbs">
                  {photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`fct-thumb-btn ${idx === activePhotoIdx ? 'active' : ''}`}
                    >
                      <img src={p} alt={`Vue ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Détaillée */}
            <div className="fct-showroom-specs-box" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                Présentation du Véhicule
              </h3>
              <p style={{ marginTop: 12, fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7 }}>
                {vehicle.description}
              </p>

              {/* Équipements de Série */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: 'var(--fct-blue-dark)', marginBottom: 12 }}>
                    Équipements & Options de Prestige
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
                Fiche Technique Homologuée
              </h3>
              <div className="fct-specs-grid-full">
                <div className="fct-spec-box">
                  <strong>Transmission</strong>
                  <span>{vehicle.transmission === 'AUTOMATIQUE' ? 'Boîte Automatique' : 'Boîte Manuelle'}</span>
                </div>
                <div className="fct-spec-box">
                  <strong>Carburation</strong>
                  <span>{vehicle.fuel}</span>
                </div>
                <div className="fct-spec-box">
                  <strong>Capacité d'Accueil</strong>
                  <span>{vehicle.seats} Places Assises</span>
                </div>
                <div className="fct-spec-box">
                  <strong>Kilométrage Compteur</strong>
                  <span>{vehicle.mileage.toLocaleString('fr-FR')} km certifiés</span>
                </div>
                <div className="fct-spec-box">
                  <strong>Motorisation</strong>
                  <span>{vehicle.engineDisplacement || 'Conforme fiche constructeur'}</span>
                </div>
                <div className="fct-spec-box">
                  <strong>Puissance</strong>
                  <span>{vehicle.horsepower || 'Tropicalisé'}</span>
                </div>
              </div>
            </div>

            {/* Historique du Carnet de Santé Associé */}
            {healthData && (
              <div className="fct-showroom-specs-box" style={{ borderLeft: '4px solid var(--fct-green-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={24} color="#059669" />
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                        Passeport d'Entretien Garanti
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Interventions certifiées réalisées au garage FCT Central Bassa
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateToHealth(vehicle.licensePlate!)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    Voir carnet complet
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  {healthData.records.map((rec) => (
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
                        Validé par : <strong>{rec.certifiedBy}</strong> ({rec.mileageKm.toLocaleString('fr-FR')} km)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne de Droite : Bloc d'Action Intégré dans la Page (Zéro Popup) */}
          <div>
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
                    Louer ce véhicule
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('buy')}
                    className={`btn-secondary ${activeTab === 'buy' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                  >
                    Acheter ce véhicule
                  </button>
                </div>
              )}

              {/* Cas 1 : Formulaire de Location Intégré */}
              {activeTab === 'rent' && vehicle.isForRent && (
                <form onSubmit={handleBookingSubmit}>
                  <div className="fct-showroom-price-box">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fct-blue-primary)', textTransform: 'uppercase' }}>
                      Tarif Location Journalier
                    </span>
                    <div className="fct-showroom-price-val">
                      {formatXAF(vehicle.rentalDailyRate)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ jour</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                      Caution remboursable : <strong>{formatXAF(vehicle.securityDepositRate)}</strong>
                    </span>
                  </div>

                  <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 14 }}>
                    Réserver directement ce véhicule
                  </h4>

                  <div className="fct-form-row">
                    <div className="fct-field">
                      <label className="fct-label">Date de départ</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="fct-input"
                        required
                      />
                    </div>
                    <div className="fct-field">
                      <label className="fct-label">Date de restitution</label>
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
                    <label className="fct-label">Zone de déplacement</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="fct-select"
                    >
                      <option value="Douala intra-muros">Douala intra-muros</option>
                      <option value="Axe Douala - Yaoundé">Axe Douala - Yaoundé</option>
                      <option value="Axe Douala - Kribi">Axe Douala - Kribi</option>
                      <option value="Région Ouest / Bafoussam">Région Ouest / Bafoussam</option>
                      <option value="Mission Nationale Cameroun">Mission Nationale Cameroun</option>
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
                      <span>Option Chauffeur Professionnel FCT (+15 000 FCFA/j)</span>
                    </label>
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">Nom complet *</label>
                    <input
                      type="text"
                      placeholder="Ex: Alain BIYIK"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">Numéro Téléphone / WhatsApp *</label>
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
                    <label className="fct-label">Adresse Courriel</label>
                    <input
                      type="email"
                      placeholder="votre.email@domaine.cm"
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
                      <span>Location ({totalDays} jour{totalDays > 1 ? 's' : ''})</span>
                      <strong>{formatXAF(rentalTotal)}</strong>
                    </div>
                    {withDriver && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--fct-green-primary)' }}>
                        <span>Chauffeur FCT ({totalDays} j)</span>
                        <strong>{formatXAF(driverTotal)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-muted)' }}>
                      <span>Caution (restituée)</span>
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
                      <span>Montant Total</span>
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
                    <span>{submitting ? 'Envoi...' : 'Confirmer ma Réservation'}</span>
                  </button>
                </form>
              )}

              {/* Cas 2 : Formulaire d'Achat & Devis Proforma Intégré */}
              {activeTab === 'buy' && vehicle.isForSale && (
                <form onSubmit={handlePurchaseSubmit}>
                  <div className="fct-showroom-price-box">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fct-blue-primary)', textTransform: 'uppercase' }}>
                      Prix d'Acquisition Certifié
                    </span>
                    <div className="fct-showroom-price-val">
                      {formatXAF(vehicle.salePrice)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                      TTC · Contrôlé 110 points · Papiers CEMAC inclus
                    </span>
                  </div>

                  <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fct-blue-dark)', marginBottom: 14 }}>
                    Demande de Devis Proforma Officiel
                  </h4>

                  <div className="fct-field">
                    <label className="fct-label">Nom et Prénom *</label>
                    <input
                      type="text"
                      placeholder="Ex: Mme. Chantal EWANE"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="fct-input"
                      required
                    />
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">Téléphone / WhatsApp *</label>
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
                    <label className="fct-label">Adresse Courriel</label>
                    <input
                      type="email"
                      placeholder="direction@entreprise.cm"
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
                      <span>Option Crédit-Bail / Leasing Société</span>
                    </label>
                  </div>

                  <div className="fct-field">
                    <label className="fct-label">Précisions ou questions</label>
                    <textarea
                      rows={3}
                      placeholder="Essai routier souhaité à Bonamoussadi, modalité de paiement..."
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
                    <span>{submitting ? 'Envoi...' : 'Demander la Facture Proforma'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
