import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { RentalPage } from './pages/RentalPage.tsx';
import { SalesPage } from './pages/SalesPage.tsx';
import { VehicleShowroomPage } from './pages/VehicleShowroomPage.tsx';
import { HealthPassportPage } from './pages/HealthPassportPage.tsx';
import { ClientPortalPage } from './pages/ClientPortalPage.tsx';
import { PartnerPortalPage } from './pages/PartnerPortalPage.tsx';
import { AgencyPage } from './pages/AgencyPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { Vehicle } from './types/index.ts';
import { AppPage, RouteState } from './types/router.ts';
import { subscribePublicVehicles } from './services/firebase.ts';
import { trackPartnerLandingRef } from './services/partnerService.ts';
import { WebsiteLanguage, websiteTranslations, mergeLiveWebsiteTranslations } from './services/i18n.ts';
import { subscribeWebsiteTheme, subscribeWebsiteContent, applyWebsiteThemeToDOM } from './services/websiteCmsService.ts';
import { logWebsiteVisit } from './services/websiteAnalyticsService.ts';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [route, setRoute] = useState<RouteState>({ page: 'home' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cmsVersion, setCmsVersion] = useState(0);

  // Synchronisation en temps réel du thème graphique (couleurs CSS) et des textes CMS
  useEffect(() => {
    const unsubTheme = subscribeWebsiteTheme(() => {
      // CSS variables sont injectées directement dans document.documentElement
    });

    const unsubContentFr = subscribeWebsiteContent('fr', (content) => {
      if (content) {
        mergeLiveWebsiteTranslations('fr', content);
        setCmsVersion((v) => v + 1);
      }
    });

    const unsubContentEn = subscribeWebsiteContent('en', (content) => {
      if (content) {
        mergeLiveWebsiteTranslations('en', content);
        setCmsVersion((v) => v + 1);
      }
    });

    // Écouteur HMR Vite local instantané (Port 3000 ⇄ Port 3001)
    if (import.meta.hot) {
      import.meta.hot.on('fct-cms-update', (data: any) => {
        if (data?.type === 'CMS_CONTENT_UPDATE' && data.lang && data.content) {
          mergeLiveWebsiteTranslations(data.lang, data.content);
          setCmsVersion((v) => v + 1);
        } else if (data?.type === 'CMS_THEME_UPDATE' && data.theme) {
          applyWebsiteThemeToDOM(data.theme);
        }
      });
    }

    return () => {
      unsubTheme();
      unsubContentFr();
      unsubContentEn();
    };
  }, []);

  // Enregistrement anonyme de la visite dans Firestore Analytics
  useEffect(() => {
    const pageLabels: Record<string, string> = {
      home: 'Accueil Vitrine',
      location: 'Location SUV & Berlines',
      vente: 'Vente Véhicules Certifiés',
      showroom: 'Showroom Détail Véhicule',
      'carnet-sante': 'Carnet de Santé Numérique',
      'espace-client': 'Espace Adhérent Client',
      partenaires: 'Portail Partenaires & Apporteurs',
      agence: 'Agence Bonamoussadi Douala',
      profile: 'Mon Profil & Espace Compte',
    };
    logWebsiteVisit(pageLabels[route.page] || 'Page FCT');
  }, [route.page]);

  // État de la langue (mémorisé dans le navigateur)
  const [lang, setLang] = useState<WebsiteLanguage>(() => {
    try {
      const saved = localStorage.getItem('fct_website_lang');
      return saved === 'en' ? 'en' : 'fr';
    } catch {
      return 'fr';
    }
  });

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'fr' ? 'en' : 'fr';
      try {
        localStorage.setItem('fct_website_lang', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Synchronisation base de données Firestore en direct (Zéro fausse donnée)
  useEffect(() => {
    const unsubscribe = subscribePublicVehicles((data) => {
      setVehicles(data || []);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Détection automatique du lien affilié partenaire FCT (?ref=CODE ou ?partner=CODE)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref') || urlParams.get('partner');
        if (refCode) {
          trackPartnerLandingRef(refCode);
        }
      }
    } catch {
      /* ignore */
    }
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
      } else if (hash === 'partenaires') {
        setRoute({ page: 'partenaires' });
      } else if (hash === 'agence') {
        setRoute({ page: 'agence' });
      } else if (hash === 'profile' || hash === 'mon-profil') {
        setRoute({ page: 'profile' });
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
    ? vehicles.find((v) => v.id === route.vehicleId) || vehicles[0] || null
    : vehicles[0] || null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* Barre de Navigation Multi-Pages FCT avec sélecteur FR / EN */}
      <Navbar
        key={`nav-${lang}-${cmsVersion}`}
        currentPage={route.page}
        onNavigate={(p) => navigate(p)}
        lang={lang}
        onToggleLang={toggleLang}
      />

      {/* Rendu de la Page Dédiée Active */}
      <main key={`page-${lang}-${cmsVersion}-${route.page}`} style={{ flex: 1 }}>
        {route.page === 'home' && (
          <HomePage
            vehicles={vehicles}
            onNavigate={(p, vId) => navigate(p, vId)}
            lang={lang}
          />
        )}

        {route.page === 'location' && (
          <RentalPage
            vehicles={vehicles}
            onOpenShowroom={(vId) => navigate('showroom', vId)}
            lang={lang}
          />
        )}

        {route.page === 'vente' && (
          <SalesPage
            vehicles={vehicles}
            onOpenShowroom={(vId) => navigate('showroom', vId)}
            lang={lang}
          />
        )}

        {route.page === 'showroom' && (
          selectedVehicle ? (
            <VehicleShowroomPage
              vehicle={selectedVehicle}
              onBack={() => navigate('location')}
              onNavigateToHealth={(plate) => navigate('carnet-sante', undefined, plate)}
              onToast={(msg) => showToast(msg)}
              lang={lang}
            />
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fct-blue-dark)' }}>
                {lang === 'en' ? 'No vehicle selected or available' : 'Aucun véhicule sélectionné ou disponible'}
              </h3>
              <p style={{ color: 'var(--text-sub)', marginTop: 8 }}>
                {lang === 'en' ? 'The catalog is synchronized live with the Douala agency.' : 'Le catalogue en ligne est synchronisé en direct avec l\'agence.'}
              </p>
              <button onClick={() => navigate('location')} className="btn-primary" style={{ marginTop: 20 }}>
                {lang === 'en' ? 'Back to Fleet' : 'Retour au catalogue'}
              </button>
            </div>
          )
        )}

        {route.page === 'carnet-sante' && (
          <HealthPassportPage
            initialPlate={route.initialPlate || 'LT-8841-CE'}
            onOpenShowroom={(vId) => navigate('showroom', vId)}
            lang={lang}
          />
        )}

        {route.page === 'espace-client' && (
          <ClientPortalPage
            onToast={(msg) => showToast(msg)}
            onNavigate={(p) => navigate(p)}
            lang={lang}
          />
        )}

        {route.page === 'partenaires' && (
          <PartnerPortalPage
            vehicles={vehicles}
            onToast={(msg) => showToast(msg)}
            onNavigate={(p, vId) => navigate(p, vId)}
            lang={lang}
          />
        )}

        {route.page === 'agence' && <AgencyPage lang={lang} />}

        {route.page === 'profile' && (
          <ProfilePage
            lang={lang}
            onLogout={() => {
              navigate('home');
              showToast(lang === 'en' ? 'Logged out successfully' : 'Déconnexion effectuée avec succès.');
            }}
            onBack={() => navigate('home')}
            onToast={(msg) => showToast(msg)}
            onNavigateToAuth={(type) => navigate(type === 'client' ? 'espace-client' : 'partenaires')}
          />
        )}
      </main>

      {/* Pied de Page Multi-Pages FCT */}
      <Footer key={`foot-${lang}-${cmsVersion}`} onNavigate={(p) => navigate(p)} lang={lang} />

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
