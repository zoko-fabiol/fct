import React from 'react';
import { KeyRound, ShoppingBag, ShieldCheck, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { FCT_AGENCY_INFO } from '../data/defaultCatalog.ts';

interface HeroProps {
  onOpenHealth: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenHealth }) => {
  return (
    <section className="fct-hero">
      <div className="fct-hero-glow"></div>
      <div className="fct-container">
        <div className="fct-hero-content">
          {/* Badge Localisation Prestige */}
          <div className="fct-pill-badge">
            <MapPin size={14} color="#f59e0b" />
            <span>Douala · {FCT_AGENCY_INFO.address}</span>
          </div>

          {/* Titre Principal Impactant */}
          <h1 className="fct-hero-headline">
            L'Excellence Automobile à Douala,{' '}
            <span className="gold-text">en Location de Prestige</span> & Vente Certifiée.
          </h1>

          {/* Sous-titre / Promesse de Valeur */}
          <p className="fct-hero-lead">
            Franchise Conseils Trading met à votre disposition des 4x4, SUV et berlines de prestige
            soigneusement contrôlés dans nos ateliers. Louez avec ou sans chauffeur professionnel FCT,
            ou faites l'acquisition d'un véhicule certifié avec carnet d'entretien numérique infalsifiable.
          </p>

          {/* Boutons d'Action Rapide */}
          <div className="fct-hero-cta">
            <a href="#location" className="btn-gold">
              <KeyRound size={18} />
              <span>Réserver une Location</span>
            </a>

            <a href="#vente" className="btn-secondary">
              <ShoppingBag size={18} />
              <span>Voir les Véhicules en Vente</span>
            </a>

            <button onClick={onOpenHealth} className="btn-secondary" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <ShieldCheck size={18} color="#10b981" />
              <span>Consulter un Carnet de Santé</span>
            </button>
          </div>

          {/* Barre des Statistiques & Réassurance */}
          <div className="fct-hero-stats">
            <div className="fct-stat-item">
              <span className="fct-stat-value gold-text">100%</span>
              <span className="fct-stat-label">Contrôlés 110 Points</span>
            </div>
            <div className="fct-stat-item">
              <span className="fct-stat-value">500+</span>
              <span className="fct-stat-label">Clients Satisfaits</span>
            </div>
            <div className="fct-stat-item">
              <span className="fct-stat-value emerald-text">24/7</span>
              <span className="fct-stat-label">Assistance & Chauffeurs</span>
            </div>
            <div className="fct-stat-item">
              <span className="fct-stat-value">0 FCFA</span>
              <span className="fct-stat-label">Frais Cachés / Transparence</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
