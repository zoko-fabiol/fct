import React from 'react';
import { UserCheck, Wrench, FileSpreadsheet, ShieldAlert, Sparkles } from 'lucide-react';

export const ServicesSection: React.FC = () => {
  return (
    <section id="services" className="fct-section fct-section-alt">
      <div className="fct-container">
        <div className="fct-section-head">
          <div className="fct-section-title-wrap">
            <div className="fct-pill-badge">
              <Sparkles size={13} />
              <span>Services Premium Automobile</span>
            </div>
            <h2 className="fct-section-title">L'Écosystème FCT Automobile Douala</h2>
            <p className="fct-section-desc">
              Bien plus qu'un loueur de voitures : une franchise complète de mobilité haut de gamme,
              d'ingénierie mécanique et de gestion de flotte pour particuliers et entreprises.
            </p>
          </div>
        </div>

        <div className="fct-features-grid">
          {/* Service 1 */}
          <div className="fct-feature-item">
            <div className="fct-feature-icon">
              <UserCheck size={26} />
            </div>
            <h3>Chauffeurs Professionnels FCT</h3>
            <p>
              Chauffeurs certifiés, discrets et expérimentés sur les corridors Douala-Yaoundé, Kribi et Ouest.
              Option disponible sur l'ensemble de notre flotte pour vos missions VIP et déplacements officiels.
            </p>
          </div>

          {/* Service 2 */}
          <div className="fct-feature-item">
            <div className="fct-feature-icon">
              <Wrench size={26} />
            </div>
            <h3>Atelier & Maintenance Certifiée</h3>
            <p>
              Notre atelier central à Bassa Douala assure un protocole de contrôle rigoureux en 110 points
              avant chaque départ de location, avec exclusivement des fluides et pièces d'origine constructeur.
            </p>
          </div>

          {/* Service 3 */}
          <div className="fct-feature-item">
            <div className="fct-feature-icon">
              <FileSpreadsheet size={26} />
            </div>
            <h3>Facturation Entreprise & Devis Proforma</h3>
            <p>
              Émission immédiate de devis proforma, contrats de location d'entreprise (LLD / LCD) avec conformité
              fiscale camerounaise (TVA 19.25%, RC/DLA, NIU officiel).
            </p>
          </div>

          {/* Service 4 */}
          <div className="fct-feature-item">
            <div className="fct-feature-icon">
              <ShieldAlert size={26} />
            </div>
            <h3>Assistance 24/7 & Véhicule Relais</h3>
            <p>
              Équipe d'intervention mobile active jour et nuit à Douala et sur les grands axes. En cas d'aléa mécanique,
              un véhicule de remplacement équivalent est déployé sans frais.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
