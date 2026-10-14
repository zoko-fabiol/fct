/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Page Publique de Présentation & Inscription Partenaire
 * Franchise Conseils Trading - Douala, Cameroun
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  TrendingUp,
  Car,
  Smartphone,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Users,
  Wallet,
  Clock,
  ChevronLeft,
  X,
  Share2,
} from 'lucide-react';
import { dbStore } from '../../services/dbStore.ts';
import { Language } from '../../services/i18n.ts';
import { registerPartnerAccount, PartnerAccount } from '../../../website/src/services/partnerService.ts';

interface PartnerProgramPublicViewProps {
  onBack: () => void;
  lang?: Language;
}

export const PartnerProgramPublicView: React.FC<PartnerProgramPublicViewProps> = ({
  onBack,
  lang = 'fr',
}) => {
  const isEn = lang === 'en';
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH'>('ORANGE_MONEY');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [city, setCity] = useState('Douala');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPartner, setCreatedPartner] = useState<PartnerAccount | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg(isEn ? 'Please fill in all mandatory fields.' : 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await registerPartnerAccount({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        payoutMethod,
        payoutPhone: payoutPhone.trim() || phone.trim(),
      });

      if (res.success && res.partner) {
        setCreatedPartner(res.partner);
      } else {
        setErrorMsg(res.error || (isEn ? 'Registration error.' : "Erreur lors de l'enregistrement."));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isEn ? 'Connection error.' : 'Erreur de connexion au serveur.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{isEn ? 'Back' : 'Retour'}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xs shadow">
            FCT
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white hidden sm:inline">
            FCT AUTOMOBILE DOUALA
          </span>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('partner-form-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isEn ? 'Join Program' : 'Devenir Partenaire'}</span>
        </button>
      </header>

      {/* 2. Grand Hero Banner */}
      <section className="relative overflow-hidden py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{isEn ? 'Official Partner & Affiliate Program • Douala' : 'Programme Partenaires & Affiliation Officiel • Douala'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Devenez Partenaire FCT Automobile <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              Touchez des Commissions en Cash XAF
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Vous avez un réseau de contacts à Douala, sur WhatsApp, Facebook ou LinkedIn ? Recommandez nos véhicules de prestige certifiés et recevez vos commissions dès la signature client.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('partner-form-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>S'enregistrer comme Partenaire (Gratuit)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Les 6 Avantages Exclusifs */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
            <Award className="w-7 h-7 text-amber-400" />
            <span>Pourquoi Devenir Partenaire FCT ?</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Tous les avantages financiers et opérationnels pour monétiser vos recommandations sans contrainte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Avantage 1 */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 hover:border-amber-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Commissions Attractives</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Touchez <strong className="text-amber-400">5% sur chaque location</strong> conclue et un forfait garanti de <strong className="text-amber-400">100 000 FCFA</strong> sur chaque véhicule vendu.
            </p>
          </div>

          {/* Avantage 2 */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 hover:border-amber-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Paiement Mobile Money sous 24h</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Vos gains sont virés directement sur votre compte <strong className="text-white">Orange Money</strong> ou <strong className="text-white">MTN MoMo</strong>, ou retirables en espèces à l'agence de Bonamoussadi.
            </p>
          </div>

          {/* Avantage 3 */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 hover:border-amber-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">0 FCFA d'Investissement</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aucun apport financier exigé. Vous profitez de la notoriété et de toute la flotte certifiée FCT (Toyota Prado, Pajero, Mercedes, etc.).
            </p>
          </div>

          {/* Avantage 4 */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 hover:border-amber-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Partage 1-Clic WhatsApp</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Des fiches véhicules prêtes avec photos multi-angles et textes optimisés pour publication directe sur votre statut WhatsApp et vos groupes.
            </p>
          </div>

          {/* Avantage 5 */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 hover:border-amber-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Suivi Transparent des Clics</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Votre tableau de bord vous montre chaque vue, chaque partage du jour et l'évolution de vos gains en temps réel avec votre code affilié.
            </p>
          </div>

          {/* Avantage 6 */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 hover:border-amber-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Paliers VIP Bronze, Argent & Or</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Montez en grade selon votre régularité et débloquez des primes de volume supplémentaires accordées par la Direction FCT.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Les 3 Étapes Simples */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800">
        <h2 className="text-xl sm:text-2xl font-black text-center text-white mb-8">
          Comment Ça Marche ? (En 3 Étapes)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mx-auto shadow-md">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Enregistrez-vous</h4>
            <p className="text-xs text-slate-400">Remplissez le formulaire ci-dessous en 30 secondes sans engagement.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-slate-950 font-black text-lg flex items-center justify-center mx-auto shadow-md">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Compte Activé Immédiatement</h4>
            <p className="text-xs text-slate-400">Votre compte est activé et votre code affilié officiel vous est attribué.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center mx-auto shadow-md">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Partagez & Encaissez</h4>
            <p className="text-xs text-slate-400">Partagez sur votre statut WhatsApp et touchez votre commission en FCFA.</p>
          </div>
        </div>
      </section>

      {/* 5. Formulaire d'Enregistrement / Activation de Compte */}
      <section id="partner-form-section" className="py-14 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        <div className="bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          {createdPartner ? (
            /* Confirmation Succès & Activation */
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  🎉 Félicitations, Votre Compte Partenaire est Activé !
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Bienvenue dans le réseau d'affaires FCT Automobile Douala.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-2 text-left">
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Votre Code Partenaire Officiel :</div>
                <div className="text-2xl font-black font-mono text-white tracking-widest">{createdPartner.partnerCode}</div>
                <div className="text-xs text-slate-400">
                  Partenaire : <strong className="text-slate-200">{createdPartner.fullName}</strong> • Mode de règlement : <strong className="text-slate-200">{createdPartner.payoutMethod} ({createdPartner.payoutPhone})</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs leading-relaxed">
                ✓ Votre compte est enregistré et certifié actif. Vos commissions vous seront automatiquement versées dès la conclusion de vos affaires.
              </div>

              <button
                onClick={onBack}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg transition cursor-pointer"
              >
                Accéder au Showroom & Partager des Véhicules
              </button>
            </div>
          ) : (
            /* Formulaire d'Enregistrement */
            <>
              <div className="text-center space-y-1 pb-2 border-b border-slate-700">
                <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>S'enregistrer comme Partenaire</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Remplissez ce formulaire pour activer votre profil et recevoir votre code affilié.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nom Complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ex: Kevin Tagne"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Numéro WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ex: 699 90 28 89"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Adresse Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre-email@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Mode de Retrait des Commissions
                    </label>
                    <select
                      value={payoutMethod}
                      onChange={(e: any) => setPayoutMethod(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="ORANGE_MONEY">Orange Money Cameroun</option>
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                      <option value="CASH">Retrait Caisse (Bonamoussadi)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Numéro Mobile Money (pour paiements)
                    </label>
                    <input
                      type="tel"
                      value={payoutPhone}
                      onChange={(e) => setPayoutPhone(e.target.value)}
                      placeholder="ex: 690 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ville de Résidence
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Douala"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Activation de votre compte...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>S'enregistrer comme Partenaire & Activer mon Compte</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* 6. Footer de Confiance */}
      <footer className="mt-auto py-8 text-center text-xs text-slate-500 border-t border-slate-800">
        <p>Franchise Conseils Trading (FCT) Automobile • Bonamoussadi, Carrefour Santa Barbara, Douala, Cameroun</p>
        <p className="mt-1">Contact Partenariats : (+237) 674 38 68 81 / 699 90 28 89</p>
      </footer>
    </div>
  );
};
