/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Écran de Démarrage & Splash Screen Sécurisé
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React from 'react';
import { ShieldCheck, Car } from 'lucide-react';

interface AppLoaderProps {
  message?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  message = "Initialisation sécurisée de l'écosystème FCT...",
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#040e1b] via-[#091f38] to-[#040e1b] text-white p-6 select-none overflow-hidden">
      {/* Halo lumineux d'ambiance en arrière-plan */}
      <div className="absolute w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none -top-10 -right-10" />

      {/* Carte centrale branding */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-6 animate-fadeIn">
        {/* Blason / Logo Automobile FCT */}
        <div className="relative">
          <div className="bg-white p-3 rounded-2xl border-2 border-emerald-400/50 shadow-2xl shadow-emerald-950/50 flex items-center justify-center">
            <img
              src="/fct-logo.png"
              alt="FCT - Franchise Conseils Trading"
              className="h-14 w-auto max-w-[200px] object-contain animate-pulse"
            />
          </div>
          {/* Badge de sécurité */}
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-4 h-4 text-[#061524]" />
          </div>
        </div>

        {/* Titres & Prestige */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
            <span>Douala • Bonamoussadi</span>
          </div>
          <h1 className="text-xl font-black tracking-wide text-white">
            FRANCHISE CONSEILS TRADING
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">
            ERP &amp; CRM Automobile de Référence
          </p>
        </div>

        {/* Barre de progression & Spinner élégant */}
        <div className="w-full space-y-3 pt-2">
          <div className="relative w-48 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mx-auto border border-slate-700/60 shadow-inner">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 rounded-full animate-pulse w-full" />
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-tight animate-pulse">
            {message}
          </p>
        </div>

        {/* Note de pied de page sécurisée */}
        <div className="pt-8 text-[11px] text-slate-500">
          Système certifié • Chiffrement de session Firebase actif
        </div>
      </div>
    </div>
  );
};
