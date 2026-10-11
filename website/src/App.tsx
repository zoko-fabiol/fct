import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { CatalogSection } from './components/CatalogSection.tsx';
import { HealthPassport } from './components/HealthPassport.tsx';
import { ServicesSection } from './components/ServicesSection.tsx';
import { AgencySection } from './components/AgencySection.tsx';
import { Footer } from './components/Footer.tsx';
import { BookingModal, PurchaseModal, AuthModal } from './components/Modals.tsx';
import { Vehicle } from './types/index.ts';
import { INITIAL_VEHICLES } from './data/defaultCatalog.ts';
import { subscribePublicVehicles } from './services/firebase.ts';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [selectedBookingVehicle, setSelectedBookingVehicle] = useState<Vehicle | null>(null);
  const [selectedPurchaseVehicle, setSelectedPurchaseVehicle] = useState<Vehicle | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [healthPlate, setHealthPlate] = useState<string>('LT-8841-CE');

  useEffect(() => {
    // Abonnement temps réel avec fallback robuste automatique
    const unsubscribe = subscribePublicVehicles((data) => {
      if (data && data.length > 0) {
        setVehicles(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenHealth = (plate?: string) => {
    if (plate) {
      setHealthPlate(plate);
    }
    const el = document.getElementById('carnet-sante');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fct-app-root">
      {/* Barre de Navigation */}
      <Navbar
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenHealth={() => handleOpenHealth()}
      />

      {/* Hero Prestige */}
      <Hero onOpenHealth={() => handleOpenHealth()} />

      {/* Section Location */}
      <CatalogSection
        id="location"
        title="Flotte Disponible à la Location"
        subtitle="Tarifs journaliers transparents en FCFA, options avec chauffeur certifié FCT et disponibilité immédiate à Bonamoussadi."
        mode="rent"
        vehicles={vehicles}
        onSelectVehicle={(v) => setSelectedBookingVehicle(v)}
        onOpenHealth={(plate) => handleOpenHealth(plate)}
      />

      {/* Section Vente */}
      <CatalogSection
        id="vente"
        title="Véhicules Vente & Certifiés FCT"
        subtitle="4x4, SUV et pick-ups certifiés après inspection complète en 110 points. Papiers en règle et devis proforma immédiat."
        mode="sale"
        vehicles={vehicles}
        onSelectVehicle={(v) => setSelectedPurchaseVehicle(v)}
        onOpenHealth={(plate) => handleOpenHealth(plate)}
      />

      {/* Module Phare : Carnet de Santé Numérique */}
      <HealthPassport initialPlate={healthPlate} />

      {/* Services & Chauffeurs FCT */}
      <ServicesSection />

      {/* Agence Physique & Localisation */}
      <AgencySection />

      {/* Pied de Page */}
      <Footer onOpenHealth={() => handleOpenHealth()} />

      {/* Modale de Réservation */}
      {selectedBookingVehicle && (
        <BookingModal
          vehicle={selectedBookingVehicle}
          onClose={() => setSelectedBookingVehicle(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Modale d'Achat / Devis Proforma */}
      {selectedPurchaseVehicle && (
        <PurchaseModal
          vehicle={selectedPurchaseVehicle}
          onClose={() => setSelectedPurchaseVehicle(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Modale Espace Client */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fct-toast-container">
          <div className="fct-toast success">
            <CheckCircle2 size={20} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
