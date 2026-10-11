import React, { useEffect, useMemo, useState } from 'react';
import { Car, KeyRound, Tag, MapPin, ShieldCheck, Wrench, UserRound, Loader2, WifiOff, Menu, X } from 'lucide-react';
import { ToastProvider } from './components/Toast.tsx';
import { VehicleCard } from './components/VehicleCard.tsx';
import { BookingModal, PurchaseModal } from './components/Modals.tsx';
import { AuthModal, AccountPanel } from './components/Account.tsx';
import { HealthPassportModal } from './components/HealthPassportModal.tsx';
import { auth, onAuthStateChanged, FirebaseUser } from './services/firebase.ts';
import { subscribeToVehicles, PublicVehicle } from './services/vehicleService.ts';

type CatalogState = 'loading' | 'ready' | 'error';
const CATEGORIES = ['ALL', 'SUV', '4X4', 'BERLINE', 'PICKUP', 'UTILITAIRE', 'LUXE'] as const;

function Catalog({
  id,
  title,
  subtitle,
  mode,
  vehicles,
  state,
  onAction,
}: {
  id: string;
  title: string;
  subtitle: string;
  mode: 'rent' | 'sale';
  vehicles: PublicVehicle[];
  state: CatalogState;
  onAction: (v: PublicVehicle) => void;
}) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('ALL');
  const list = useMemo(
    () =>
      vehicles
        .filter((v) => (mode === 'rent' ? v.isForRent : v.isForSale))
        .filter((v) => category === 'ALL' || v.category === category),
    [vehicles, mode, category]
  );

  return (
    <section id={id} className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-white">{title}</h2>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                category === c ? 'bg-amber-500 text-slate-950 border-amber-500' : 'border-white/10 text-slate-300 hover:border-amber-500/40'
              }`}
            >
              {c === 'ALL' ? 'Tous' : c}
            </button>
          ))}
        </div>
      </div>

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /> Chargement du catalogue en direct…</div>
      )}
      {state === 'error' && (
        <div className="luxury-card p-8 text-center space-y-2">
          <WifiOff className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-slate-200 font-semibold">Le catalogue est momentanément indisponible.</p>
          <p className="text-xs text-slate-400">Vérifiez votre connexion internet puis rechargez la page.</p>
        </div>
      )}
      {state === 'ready' && list.length === 0 && (
        <div className="luxury-card p-10 text-center space-y-2">
          <Car className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-200 font-semibold">Aucun véhicule disponible dans cette sélection pour le moment.</p>
          <p className="text-xs text-slate-400">Notre flotte est mise à jour en temps réel par l'agence.</p>
        </div>
      )}
      {state === 'ready' && list.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((v) => (
            <VehicleCard key={v.id} vehicle={v} mode={mode} onAction={onAction} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>('loading');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showHealthPassport, setShowHealthPassport] = useState(false);
  const [booking, setBooking] = useState<PublicVehicle | null>(null);
  const [purchase, setPurchase] = useState<PublicVehicle | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(
    () =>
      subscribeToVehicles(
        (list) => {
          setVehicles(list);
          setCatalogState('ready');
        },
        () => setCatalogState('error')
      ),
    []
  );

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  const nav = [
    { href: '#location', label: 'Location' },
    { href: '#vente', label: 'Vente' },
    { href: '#services', label: 'Services' },
    { href: '#agence', label: 'Agence' },
  ];

  return (
    <ToastProvider>
      <header className="fixed top-0 inset-x-0 z-40 luxury-glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl gold-gradient-btn flex items-center justify-center"><Car className="w-5 h-5" /></span>
            <span className="font-display font-extrabold text-white tracking-tight">FCT <span className="gold-gradient-text">Automobile</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-7">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition">{n.label}</a>
            ))}
            <button
              onClick={() => setShowHealthPassport(true)}
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Carnet de Santé</span>
            </button>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <a href="#espace-client" className="hidden sm:flex px-4 py-2 rounded-xl border border-amber-500/30 text-xs font-bold text-amber-300 items-center gap-2"><UserRound className="w-4 h-4" /> Mon espace</a>
            ) : (
              <button id="open-auth" onClick={() => setShowAuth(true)} className="hidden sm:flex gold-gradient-btn px-4 py-2 text-xs items-center gap-2 cursor-pointer"><UserRound className="w-4 h-4" /> Espace client</button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" className="md:hidden text-slate-200 cursor-pointer">{menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-3 border-t border-white/5 pt-3">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-slate-200">{n.label}</a>
            ))}
            {user ? (
              <a href="#espace-client" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-amber-300">Mon espace client</a>
            ) : (
              <button onClick={() => { setMenuOpen(false); setShowAuth(true); }} className="text-left text-sm font-semibold text-amber-300 cursor-pointer">Espace client</button>
            )}
          </div>
        )}
      </header>

      <main id="top" className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(10,38,74,0.9),transparent_60%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 space-y-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300"><MapPin className="w-3.5 h-3.5" /> Carrefour Santa Barbara, Bonamoussadi · Douala</span>
            <h1 className="font-display text-4xl sm:text-6xl font-black text-white leading-[1.05] max-w-3xl">
              L'automobile de prestige,<br /><span className="gold-gradient-text">louée ou acquise en toute confiance.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Franchise Conseils Trading met à votre disposition une flotte entretenue au garage FCT : location avec ou sans chauffeur, vente de véhicules certifiés, réservation en ligne.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#location" className="gold-gradient-btn px-6 py-3.5 text-sm flex items-center gap-2"><KeyRound className="w-4 h-4" /> Louer un véhicule</a>
              <a href="#vente" className="px-6 py-3.5 rounded-[0.875rem] border border-white/15 text-sm font-bold text-white hover:bg-white/5 transition flex items-center gap-2"><Tag className="w-4 h-4" /> Acheter un véhicule</a>
            </div>
          </div>
        </section>

        <Catalog id="location" title="Location de véhicules" subtitle="Disponibilité et tarifs synchronisés en temps réel avec l'agence." mode="rent" vehicles={vehicles} state={catalogState} onAction={setBooking} />
        <Catalog id="vente" title="Véhicules en vente" subtitle="Véhicules contrôlés et certifiés FCT, prêts à être livrés." mode="sale" vehicles={vehicles} state={catalogState} onAction={setPurchase} />

        {user && (
          <AccountPanel
            user={user}
            onOpenHealthPassport={() => setShowHealthPassport(true)}
          />
        )}

        <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, t: 'Véhicules certifiés', d: 'Chaque véhicule est contrôlé et suivi par notre équipe avant sa mise en location ou en vente.' },
            { icon: Wrench, t: 'Entretien au garage FCT', d: "Révisions, vidanges et réparations réalisées et tracées par l'agence." },
            { icon: UserRound, t: 'Chauffeurs professionnels', d: 'Option chauffeur FCT pour vos déplacements professionnels et événements.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="luxury-card p-6 space-y-3">
              <span className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"><Icon className="w-5 h-5 text-amber-400" /></span>
              <h3 className="font-display font-bold text-white">{t}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer id="agence" className="border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
          <div>
            <p className="font-display font-bold text-white">Franchise Conseils Trading (FCT)</p>
            <p className="flex items-center gap-2 mt-1"><MapPin className="w-4 h-4 text-amber-400" /> Carrefour Santa Barbara, Bonamoussadi, Douala, Cameroun</p>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} FCT Automobile. Tous droits réservés.</p>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showHealthPassport && <HealthPassportModal onClose={() => setShowHealthPassport(false)} />}
      {booking && <BookingModal vehicle={booking} onClose={() => setBooking(null)} defaultEmail={user?.email ?? ''} />}
      {purchase && <PurchaseModal vehicle={purchase} onClose={() => setPurchase(null)} defaultEmail={user?.email ?? ''} />}
    </ToastProvider>
  );
}
