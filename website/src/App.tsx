import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { RentalPage } from './pages/RentalPage.tsx';
import { SalesPage } from './pages/SalesPage.tsx';
import { VehicleShowroomPage } from './pages/VehicleShowroomPage.tsx';
import { HealthPassportPage } from './pages/HealthPassportPage.tsx';
import { ClientPortalPage } from './pages/ClientPortalPage.tsx';
import { AgencyPage } from './pages/AgencyPage.tsx';
import { Vehicle } from './types/index.ts';
import { AppPage, RouteState } from './types/router.ts';
import { INITIAL_VEHICLES } from './data/defaultCatalog.ts';
import { subscribePublicVehicles } from './services/firebase.ts';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [route, setRoute] = useState<RouteState>({ page: 'home' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronisation base de données Firestore en direct
  useEffect(() => {
    const unsubscribe = subscribePublicVehicles((data) => {
      if (data && data.length > 0) {
        setVehicles(data);
      }
    });
    return () => unsubscribe();
  }, []);

  // Gestion du routage par hash URL pour l'historique du navigateur
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (!hash || hash === 'home') {
        setRoute({ page: 'home' });
      } else if (hash.startsWith('showroom/')) {
        const id = hash.replace('showroom/', '');
        setRoute({ page: 'showroom', vehicleId: id });
      } else if (hash === 'location') {
        setRoute({ page: 'location' });
      } else if (hash === 'vente') {
        setRoute({ page: 'vente' });
      } else if (hash.startsWith('carnet-sante')) {
        const plate = hash.split('/')[1];
        setRoute({ page: 'carnet-sante', initialPlate: plate });
      } else if (hash === 'espace-client') {
        setRoute({ page: 'espace-client' });
      } else if (hash === 'agence') {
        setRoute({ page: 'agence' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page: AppPage, vehicleId?: string, initialPlate?: string) => {
    let newHash = `#/${page}`;
    if (page === 'showroom' && vehicleId) {
      newHash = `#/showroom/${vehicleId}`;
    } else if (page === 'carnet-sante' && initialPlate) {
      newHash = `#/carnet-sante/${initialPlate}`;
    }
    window.location.hash = newHash;
    setRoute({ page, vehicleId, initialPlate });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Trouver le véhicule sélectionné pour le Showroom dédié
  const selectedVehicle = route.vehicleId
    ? vehicles.find((v) => v.id === route.vehicleId) || vehicles[0]
    : vehicles[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* Barre de Navigation Multi-Pages FCT */}
      <Navbar
        currentPage={route.page}
        onNavigate={(p) => navigate(p)}
      />

      {/* Rendu de la Page Dédiée Active (Chaque section est une vraie page) */}
      <main style={{ flex: 1 }}>
        {route.page === 'home' && (
          <HomePage
            vehicles={vehicles}
            onNavigate={(p, vId) => navigate(p, vId)}
          />
        )}

        {route.page === 'location' && (
          <RentalPage
            vehicles={vehicles}
            onOpenShowroom={(vId) => navigate('showroom', vId)}
          />
        )}

        {route.page === 'vente' && (
          <SalesPage
            vehicles={vehicles}
            onOpenShowroom={(vId) => navigate('showroom', vId)}
          />
        )}

        {route.page === 'showroom' && (
          <VehicleShowroomPage
            vehicle={selectedVehicle}
            onBack={() => navigate('location')}
            onNavigateToHealth={(plate) => navigate('carnet-sante', undefined, plate)}
            onToast={(msg) => showToast(msg)}
          />
        )}

        {route.page === 'carnet-sante' && (
          <HealthPassportPage
            initialPlate={route.initialPlate || 'LT-8841-CE'}
            onOpenShowroom={(vId) => navigate('showroom', vId)}
          />
        )}

        {route.page === 'espace-client' && (
          <ClientPortalPage onToast={(msg) => showToast(msg)} />
        )}

        {route.page === 'agence' && <AgencyPage />}
      </main>

      {/* Pied de Page Multi-Pages FCT */}
      <Footer onNavigate={(p) => navigate(p)} />

      {/* Toast Notification Visuel */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'white',
            border: '1.5px solid var(--fct-green-primary)',
            borderRadius: 14,
            padding: '16px 22px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--fct-blue-dark)',
          }}
        >
          <CheckCircle2 size={22} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
