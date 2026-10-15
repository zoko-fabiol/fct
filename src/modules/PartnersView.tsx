/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Module Partenaires & Affiliation
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { Language } from '../services/i18n.ts';
import {
  AppModule,
  PartnerProfile,
  PartnerCommission,
  PartnerShareLog,
  PartnerStatus,
  PartnerTier,
} from '../../packages/shared-types/index.ts';
import { formatXAF } from '../../packages/business-rules/index.ts';
import {
  Users,
  Award,
  TrendingUp,
  Wallet,
  Share2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Smartphone,
  AlertCircle,
  Car,
  Settings,
  ChevronRight,
  Receipt,
  Download,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../services/firebase.ts';

interface PartnersViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({ state, lang, onNavigate }) => {
  const isEn = lang === 'en';
  const [activeTab, setActiveTab] = useState<'partners' | 'activity' | 'commissions' | 'settings'>('partners');
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [shareLogs, setShareLogs] = useState<PartnerShareLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<PartnerProfile | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<PartnerCommission | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Écoute en temps réel des partenaires depuis Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, 'partners'),
      (snapshot) => {
        const loaded: PartnerProfile[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setPartners(loaded);
      },
      (err) => {
        console.warn('[FCT Partners] Erreur écoute partners Firestore :', err);
      }
    );
    return () => unsub();
  }, []);

  // 2. Écoute des commissions
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, 'partner_commissions'),
      (snapshot) => {
        const loaded: PartnerCommission[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setCommissions(loaded);
      },
      (err) => {
        console.warn('[FCT Partners] Erreur écoute commissions :', err);
      }
    );
    return () => unsub();
  }, []);

  // 3. Écoute des journaux de partages
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, 'partner_shares'),
      (snapshot) => {
        const loaded: PartnerShareLog[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // Trier par date décroissante
        loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setShareLogs(loaded.slice(0, 50));
      },
      (err) => {
        console.warn('[FCT Partners] Erreur écoute logs de partage :', err);
      }
    );
    return () => unsub();
  }, []);

  // Calcul des statistiques globales
  const todayStr = new Date().toISOString().split('T')[0];
  const totalSharesToday = useMemo(() => {
    return partners.reduce((sum, p) => sum + (p.stats?.dailySharesCount?.[todayStr] || 0), 0);
  }, [partners, todayStr]);

  const totalSharesAllTime = useMemo(() => {
    return partners.reduce((sum, p) => sum + (p.stats?.totalShares || 0), 0);
  }, [partners]);

  const totalClicksAllTime = useMemo(() => {
    return partners.reduce((sum, p) => sum + (p.stats?.totalClicks || 0), 0);
  }, [partners]);

  const totalCommissionsEarned = useMemo(() => {
    return partners.reduce((sum, p) => sum + (p.stats?.totalEarnedXAF || 0), 0);
  }, [partners]);

  const totalBalancePending = useMemo(() => {
    return partners.reduce((sum, p) => sum + (p.stats?.balanceAvailableXAF || 0), 0);
  }, [partners]);

  // Filtrage des partenaires par recherche
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners;
    const q = searchQuery.toLowerCase();
    return partners.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.partnerCode.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [partners, searchQuery]);

  // Validation et paiement d'une commission en Caisse FCT
  const handlePayCommission = async (partnerId: string, amountXAF: number, commId?: string) => {
    const partnerToPay = partners.find((p) => p.id === partnerId);
    if (!partnerToPay) return;

    setIsProcessing(true);
    try {
      const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Déduction du solde du partenaire
      const newBalance = Math.max(0, (partnerToPay.stats?.balanceAvailableXAF || 0) - amountXAF);
      const newPaidOut = (partnerToPay.stats?.paidOutXAF || 0) + amountXAF;

      await updateDoc(doc(firestore, 'partners', partnerId), {
        'stats.balanceAvailableXAF': newBalance,
        'stats.paidOutXAF': newPaidOut,
        updatedAt: new Date().toISOString(),
      });

      // 2. Si commission spécifique, marquer comme PAYÉE
      if (commId) {
        await updateDoc(doc(firestore, 'partner_commissions', commId), {
          status: 'PAID',
          receiptNumber,
          paidAt: new Date().toISOString(),
        });
      }

      // 3. Enregistrement de la sortie de caisse dans l'ERP si session active
      const activeSession = dbStore.getActiveCashSession();
      if (activeSession) {
        dbStore.recordCashMovement({
          sessionId: activeSession.id,
          type: 'OUTFLOW',
          category: 'OTHER',
          amountXAF,
          receivedFromOrPaidTo: `${partnerToPay.fullName} (${partnerToPay.partnerCode})`,
          reason: `Paiement commission apporteur d'affaires ${partnerToPay.partnerCode} - ${partnerToPay.payoutMethod}`,
        });
      }

      alert(
        isEn
          ? `Commission of ${formatXAF(amountXAF)} paid to ${partnerToPay.fullName}. Cash movement registered.`
          : `Commission de ${formatXAF(amountXAF)} versée à ${partnerToPay.fullName}. Sortie de caisse enregistrée avec succès.`
      );
      setIsPayModalOpen(false);
      setSelectedCommission(null);
    } catch (err: any) {
      console.error('[FCT Partners] Erreur règlement commission :', err);
      alert(isEn ? 'Payment failed.' : 'Erreur lors du versement de la commission.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE DU MODULE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
            <Sparkles size={16} />
            <span>{isEn ? 'Business Development & Affiliation' : 'Apporteurs d\'Affaires & Réseau Commercial'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Partners & Affiliate Network' : 'Partenaires & Affiliation FCT'}
          </h1>
          <p className="text-xs text-slate-500">
            {isEn
              ? 'Supervise commercial partners, track daily social shares, and validate cash commission payouts.'
              : 'Supervisez vos partenaires, mesurez leur volume de partages quotidiens et validez les commissions en caisse.'}
          </p>
        </div>

        {/* Boutons d'Action Rapide */}
        <div className="flex items-center gap-3">
          <a
            href="/#partenaires"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-orange-200"
          >
            <ExternalLink size={14} />
            <span>{isEn ? 'Open Public Partner Page' : 'Page Partenaire Publique'}</span>
          </a>
        </div>
      </div>

      {/* 2. KPI GLOBALES DU RÉSEAU PARTENAIRE */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Partenaires */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isEn ? 'Partners Count' : 'Partenaires Actifs'}</span>
            <Users size={16} className="text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{partners.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {partners.filter((p) => p.tier === 'GOLD').length} {isEn ? 'Gold tier' : 'Niveau Or'}
          </div>
        </div>

        {/* Partages Aujourd'hui */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isEn ? 'Shares Today' : 'Partages du Jour'}</span>
            <Share2 size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{totalSharesToday}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalSharesAllTime} {isEn ? 'total shares' : 'partages au total'}
          </div>
        </div>

        {/* Clics Visiteurs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isEn ? 'Tracked Clicks' : 'Clics & Visiteurs'}</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalClicksAllTime}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{isEn ? 'Direct traffic' : 'Trafic apporté'}</div>
        </div>

        {/* Commissions Totales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isEn ? 'Total Commissions' : 'Total Commissions'}</span>
            <Wallet size={16} className="text-purple-500" />
          </div>
          <div className="text-lg font-black text-purple-600">{formatXAF(totalCommissionsEarned)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{isEn ? 'Generated deals' : 'Affaires générées'}</div>
        </div>

        {/* Solde à Régler en Caisse */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isEn ? 'Pending Payouts' : 'À Verser (Caisse)'}</span>
            <DollarSign size={16} className="text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600">{formatXAF(totalBalancePending)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{isEn ? 'Available balances' : 'En attente de paiement'}</div>
        </div>
      </div>

      {/* 3. BARRE D'ONGLETS DU MODULE */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'partners'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isEn ? 'Partner Directory' : 'Annuaire des Partenaires'} ({partners.length})
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'activity'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isEn ? 'Live Social Shares' : 'Suivi des Partages en Direct'} ({shareLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'commissions'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isEn ? 'Commissions & Cash Payout' : 'Commissions & Règlement Caisse'} ({commissions.length})
        </button>
      </div>

      {/* 4. CONTENU PAR ONGLET */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          {/* Recherche & Filtre */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search partner by name, code, phone...' : 'Rechercher un partenaire par nom, code, téléphone...'}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-orange-500 bg-white"
              />
            </div>
          </div>

          {/* Tableau des Partenaires */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Partenaire</th>
                    <th className="py-3 px-4">Code Affilié</th>
                    <th className="py-3 px-4">Niveau / Tier</th>
                    <th className="py-3 px-4">Partages (Jour / Total)</th>
                    <th className="py-3 px-4">Clics / Leads</th>
                    <th className="py-3 px-4">Solde Disponible</th>
                    <th className="py-3 px-4">Mode de Retrait</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {isEn ? 'No partners found.' : 'Aucun partenaire enregistré pour le moment.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((p) => {
                      const sharesTodayP = p.stats?.dailySharesCount?.[todayStr] || 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{p.fullName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Phone size={12} />
                              <span>{p.phone}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-orange-600">{p.partnerCode}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.tier === 'GOLD'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : p.tier === 'SILVER'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-orange-50 text-orange-700'
                              }`}
                            >
                              {p.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">
                              <span className="text-blue-600">{sharesTodayP}</span> / {p.stats?.totalShares || 0}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {sharesTodayP > 0 ? (isEn ? 'Active today' : 'Actif aujourd\'hui') : (isEn ? 'No share today' : 'Aucun partage ce jour')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{p.stats?.totalClicks || 0} clics</div>
                            <div className="text-[11px] text-purple-600 font-semibold">{p.stats?.totalLeads || 0} prospects</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600">
                            {formatXAF(p.stats?.balanceAvailableXAF || 0)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {p.payoutMethod}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{p.payoutPhone}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPartner(p);
                                setIsPayModalOpen(true);
                              }}
                              disabled={(p.stats?.balanceAvailableXAF || 0) <= 0}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                              <DollarSign size={13} />
                              <span>{isEn ? 'Pay Cash' : 'Régler'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 2 : SUIVI DES PARTAGES EN DIRECT */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              {isEn ? 'Recent Social Media Shares Log' : 'Journal des Partages Sociaux en Temps Réel'}
            </div>
            <div className="text-xs text-slate-500">{shareLogs.length} partages récents</div>
          </div>

          <div className="divide-y divide-slate-100">
            {shareLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {isEn ? 'No share activity recorded yet.' : 'Aucun partage enregistré pour l\'instant.'}
              </div>
            ) : (
              shareLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Share2 size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {partners.find((p) => p.id === log.partnerId || p.partnerCode === log.partnerCode)?.fullName || log.partnerCode} <span className="font-mono text-orange-600 font-semibold">({log.partnerCode})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        A partagé : <strong className="text-slate-800">{log.vehicleName}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {log.platform}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Récemment'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ONGLET 3 : COMMISSIONS & PAIEMENT */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Affaire / Contrat</th>
                  <th className="py-3 px-4">Partenaire</th>
                  <th className="py-3 px-4">Véhicule</th>
                  <th className="py-3 px-4">Montant Affaire</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {isEn ? 'No commissions recorded yet.' : 'Aucune commission enregistrée.'}
                    </td>
                  </tr>
                ) : (
                  commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.dealReference}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.partnerName}</div>
                        <div className="text-[11px] text-orange-600 font-mono">{c.partnerCode}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{c.vehicleName}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{formatXAF(c.dealAmountXAF)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatXAF(c.commissionAmountXAF)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              handlePayCommission(c.partnerId, c.commissionAmountXAF, c.id);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                          >
                            {isEn ? 'Pay Cash' : 'Régler'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE RÈGLEMENT EN CAISSE */}
      {isPayModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Receipt size={20} className="text-orange-500" />
                <span>{isEn ? 'Cash Commission Payout' : 'Règlement Commission en Caisse'}</span>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Partenaire :</span>
                <strong className="text-slate-900">{selectedPartner.fullName}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Code Affilié :</span>
                <strong className="font-mono text-orange-600">{selectedPartner.partnerCode}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mode de Paiement :</span>
                <strong>{selectedPartner.payoutMethod} ({selectedPartner.payoutPhone})</strong>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Montant à Verser :</span>
                <span className="font-black text-emerald-600 text-base">
                  {formatXAF(selectedPartner.stats?.balanceAvailableXAF || 0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              En confirmant, cette sortie de caisse sera imputée à la session de caisse active avec génération d'un reçu officiel FCT.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPayModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {isEn ? 'Cancel' : 'Annuler'}
              </button>
              <button
                onClick={() => handlePayCommission(selectedPartner.id, selectedPartner.stats?.balanceAvailableXAF || 0)}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                {isProcessing ? <Clock size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{isEn ? 'Confirm Cash Payout' : 'Confirmer le Versement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
