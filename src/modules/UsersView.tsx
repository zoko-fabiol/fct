/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Module Complet Utilisateurs, Rôles, Permissions & Matrice RBAC
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

import React, { useState, useMemo } from 'react';
import { dbStore, DatabaseState } from '../services/dbStore.ts';
import { authService } from '../services/firebase.ts';
import { Language, translations } from '../services/i18n.ts';
import {
  UserProfile,
  UserRole,
  AppModule,
  PermissionAction,
  UserAccountStatus,
  UserPermissionOverrides,
  SecurityAuditEvent,
} from '../../packages/shared-types/index.ts';
import {
  ALL_APP_MODULES,
  ALL_PERMISSION_ACTIONS,
  ROLE_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  calculateEffectivePermissions,
  hasEffectivePermission,
  getPermissionOrigin,
  compareRolePermissions,
} from '../../packages/business-rules/index.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Lock,
  Search,
  Filter,
  Plus,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  FileText,
  ArrowRight,
  Eye,
  Pencil,
  Trash2,
  Layers,
  ShieldAlert,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  Download,
  Check,
  Sliders,
  History,
  Info,
  ChevronRight,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react';

interface UsersViewProps {
  state: DatabaseState;
  lang: Language;
  onNavigate?: (module: AppModule, entityId?: string) => void;
}

type MainTab = 'USERS' | 'ROLES' | 'OVERRIDES' | 'AUDIT';
type UserDetailTab = 'OVERVIEW' | 'EFFECTIVE_RIGHTS' | 'OVERRIDES' | 'AUDIT';

export const UsersView: React.FC<UsersViewProps> = ({ state, lang, onNavigate }) => {
  const t = translations[lang];
  const currentUser = dbStore.getCurrentUser();

  // Navigation par sous-onglets du module
  const [activeTab, setActiveTab] = useState<MainTab>('USERS');

  // Alertes contextuelles
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setActionAlert({ type, message });
    setTimeout(() => setActionAlert(null), 5000);
  };

  // -------------------------------------------------------------
  // SECTION 1: UTILISATEURS (Recherche, Filtres, Liste, Fiche)
  // -------------------------------------------------------------
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Utilisateur sélectionné pour la Fiche Détaillée / Showroom
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetailTab, setUserDetailTab] = useState<UserDetailTab>('OVERVIEW');

  // Modal Création / Invitation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+237 6',
    jobTitle: '',
    role: 'sales_agent' as UserRole,
    status: 'ACTIVE' as UserAccountStatus,
  });

  // Modal Modification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Modal Suspension / Réactivation
  const [statusTargetUser, setStatusTargetUser] = useState<UserProfile | null>(null);
  const [statusTargetAction, setStatusTargetAction] = useState<UserAccountStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');

  // Modal Suppression
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);

  // Filtre utilisateurs
  const filteredUsers = useMemo(() => {
    return state.users.filter((usr) => {
      const q = userSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        usr.fullName.toLowerCase().includes(q) ||
        usr.email.toLowerCase().includes(q) ||
        (usr.phone && usr.phone.includes(q)) ||
        (usr.jobTitle && usr.jobTitle.toLowerCase().includes(q));

      const matchRole = roleFilter === 'ALL' || usr.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || usr.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [state.users, userSearch, roleFilter, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = state.users.length;
    const active = state.users.filter((u) => u.status === 'ACTIVE').length;
    const invited = state.users.filter((u) => u.status === 'INVITED').length;
    const suspended = state.users.filter((u) => u.status === 'SUSPENDED' || u.status === 'DISABLED').length;
    const superAdmins = state.users.filter((u) => u.role === 'super_admin' && u.isActive).length;
    const withOverrides = state.users.filter((u) => {
      const a = u.permissionsOverrides?.allow && Object.keys(u.permissionsOverrides.allow).length > 0;
      const d = u.permissionsOverrides?.deny && Object.keys(u.permissionsOverrides.deny).length > 0;
      return a || d;
    }).length;
    return { total, active, invited, suspended, superAdmins, withOverrides };
  }, [state.users]);

  // Handlers Utilisateurs
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = dbStore.addUser({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        fullName: `${createForm.firstName.trim()} ${createForm.lastName.trim()}`.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        jobTitle: createForm.jobTitle.trim() || undefined,
        role: createForm.role,
        status: createForm.status,
        isActive: createForm.status === 'ACTIVE' || createForm.status === 'INVITED',
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+237 6',
        jobTitle: '',
        role: 'sales_agent',
        status: 'ACTIVE',
      });
      // Synchronisation immédiate vers Firebase Firestore
      authService.syncUserProfile(newUser).catch((e) => console.warn('Sync Firestore collaborateur différée:', e));
      showAlert(`Compte collaborateur "${newUser.fullName}" créé avec succès.`);
    } catch (err: any) {
      showAlert(err.message || 'Erreur lors de la création du compte', 'error');
    }
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const updated = dbStore.updateUser(editingUser.id, {
        firstName: editingUser.firstName?.trim(),
        lastName: editingUser.lastName?.trim(),
        fullName: `${editingUser.firstName || ''} ${editingUser.lastName || ''}`.trim() || editingUser.fullName,
        email: editingUser.email.trim(),
        phone: editingUser.phone.trim(),
        jobTitle: editingUser.jobTitle?.trim(),
        role: editingUser.role,
      });
      setIsEditModalOpen(false);
      if (selectedUser?.id === updated.id) setSelectedUser(updated);
      // Synchronisation vers Firebase Firestore
      authService.syncUserProfile(updated).catch((e) => console.warn('Sync Firestore collaborateur différée:', e));
      showAlert(`Profil de "${updated.fullName}" mis à jour avec succès.`);
    } catch (err: any) {
      showAlert(err.message || 'Erreur de modification', 'error');
    }
  };

  const handleConfirmStatusToggle = () => {
    if (!statusTargetUser || !statusTargetAction) return;
    try {
      const updated = dbStore.toggleUserStatus(statusTargetUser.id, statusTargetAction, statusReason || undefined);
      setStatusTargetUser(null);
      setStatusTargetAction(null);
      setStatusReason('');
      if (selectedUser?.id === updated.id) setSelectedUser(updated);
      showAlert(`Statut du compte "${updated.fullName}" changé à "${statusTargetAction}".`);
    } catch (err: any) {
      showAlert(err.message || 'Action refusée', 'error');
    }
  };

  const handleConfirmDeleteUser = (reason: string) => {
    if (!deleteConfirmUser) return;
    try {
      const name = deleteConfirmUser.fullName;
      dbStore.updateUser(deleteConfirmUser.id, { status: 'DISABLED', isActive: false }, `Compte désactivé et archivé : ${reason}`);
      setDeleteConfirmUser(null);
      if (selectedUser?.id === deleteConfirmUser.id) setSelectedUser(null);
      showAlert(`Compte collaborateur "${name}" révoqué et archivé dans le journal d'audit.`);
    } catch (err: any) {
      showAlert(err.message || 'Suppression refusée', 'error');
    }
  };

  // -------------------------------------------------------------
  // SECTION 2: RÔLES & MATRICE DE PERMISSIONS
  // -------------------------------------------------------------
  const [selectedRole, setSelectedRole] = useState<UserRole>('director');
  const [compareRole, setCompareRole] = useState<UserRole | null>(null);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixCategory, setMatrixCategory] = useState<'ALL' | 'FLEET' | 'COMMERCIAL' | 'FINANCE' | 'SYSTEM'>('ALL');

  // Brouillon des modifications de la matrice pour le rôle actif
  const rolePermissionsMatrix = dbStore.getRolePermissionsMatrix();
  const currentRoleMatrix = rolePermissionsMatrix[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole] || {};

  const [draftRolePermissions, setDraftRolePermissions] = useState<Record<AppModule, PermissionAction[]>>(() => {
    return JSON.parse(JSON.stringify(currentRoleMatrix));
  });
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  // Synchronisation si changement de rôle
  React.useEffect(() => {
    const latest = (dbStore.getRolePermissionsMatrix()[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole]) || {};
    setDraftRolePermissions(JSON.parse(JSON.stringify(latest)));
    setIsDraftDirty(false);
  }, [selectedRole, state.rolePermissions]);

  const toggleDraftPermission = (module: AppModule, action: PermissionAction) => {
    setDraftRolePermissions((prev) => {
      const currentList = prev[module] || [];
      const updatedList = currentList.includes(action)
        ? currentList.filter((a) => a !== action)
        : [...currentList, action];
      setIsDraftDirty(true);
      return {
        ...prev,
        [module]: updatedList,
      };
    });
  };

  const setRowAll = (module: AppModule, selectAll: boolean) => {
    setDraftRolePermissions((prev) => {
      setIsDraftDirty(true);
      return {
        ...prev,
        [module]: selectAll ? [...ALL_PERMISSION_ACTIONS] : [],
      };
    });
  };

  const [showSaveImpactModal, setShowSaveImpactModal] = useState(false);
  const [showResetRoleModal, setShowResetRoleModal] = useState(false);
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<UserRole | null>(null);
  const impactedUsersCount = state.users.filter((u) => u.role === selectedRole).length;

  const handleSaveRolePermissions = () => {
    try {
      dbStore.updateRolePermissions(selectedRole, draftRolePermissions, `Mise à jour des privilèges du rôle ${selectedRole}`);
      setIsDraftDirty(false);
      setShowSaveImpactModal(false);
      showAlert(`Permissions du rôle "${t.roles[selectedRole]}" enregistrées et appliquées immédiatement à ${impactedUsersCount} utilisateur(s).`);
    } catch (err: any) {
      showAlert(err.message || 'Erreur lors de la sauvegarde des permissions', 'error');
    }
  };

  const handleConfirmResetRoleDefault = () => {
    try {
      dbStore.resetRolePermissionsToDefault(selectedRole);
      const resetMatrix = dbStore.getRolePermissionsMatrix()[selectedRole];
      setDraftRolePermissions(JSON.parse(JSON.stringify(resetMatrix)));
      setIsDraftDirty(false);
      setShowResetRoleModal(false);
      showAlert(`Permissions par défaut rétablies pour le rôle "${t.roles[selectedRole]}".`);
    } catch (err: any) {
      setShowResetRoleModal(false);
      showAlert(err.message || 'Erreur', 'error');
    }
  };

  // Comparateur de rôles
  const comparisonResult = useMemo(() => {
    if (!compareRole) return null;
    return compareRolePermissions(selectedRole, compareRole, state.rolePermissions);
  }, [selectedRole, compareRole, state.rolePermissions]);

  // Filtrage modules pour la matrice
  const categorizedModules = useMemo(() => {
    return ALL_APP_MODULES.filter((mod) => {
      if (matrixSearch && !mod.toLowerCase().includes(matrixSearch.toLowerCase())) {
        return false;
      }
      if (matrixCategory === 'FLEET') {
        return ['vehicles', 'stock', 'maintenance', 'drivers'].includes(mod);
      }
      if (matrixCategory === 'COMMERCIAL') {
        return ['rentals', 'sales', 'crm', 'reservations'].includes(mod);
      }
      if (matrixCategory === 'FINANCE') {
        return ['cash', 'billing', 'reports'].includes(mod);
      }
      if (matrixCategory === 'SYSTEM') {
        return ['dashboard', 'documents', 'notifications', 'users', 'settings', 'audit', 'help'].includes(mod);
      }
      return true;
    });
  }, [matrixSearch, matrixCategory]);

  // -------------------------------------------------------------
  // SECTION 3: PERMISSIONS INDIVIDUELLES & EXCEPTIONS
  // -------------------------------------------------------------
  const [overrideModalUser, setOverrideModalUser] = useState<UserProfile | null>(null);
  const [overrideDraft, setOverrideDraft] = useState<UserPermissionOverrides>({});

  const openOverrideModal = (user: UserProfile) => {
    setOverrideModalUser(user);
    setOverrideDraft({
      allow: user.permissionsOverrides?.allow ? JSON.parse(JSON.stringify(user.permissionsOverrides.allow)) : {},
      deny: user.permissionsOverrides?.deny ? JSON.parse(JSON.stringify(user.permissionsOverrides.deny)) : {},
    });
  };

  const handleSaveOverrides = () => {
    if (!overrideModalUser) return;
    try {
      const updated = dbStore.updateUserOverrides(overrideModalUser.id, overrideDraft, 'Mise à jour des exceptions individuelles');
      setOverrideModalUser(null);
      if (selectedUser?.id === updated.id) setSelectedUser(updated);
      showAlert(`Exceptions individuelles mises à jour pour "${updated.fullName}".`);
    } catch (err: any) {
      showAlert(err.message || 'Erreur', 'error');
    }
  };

  // -------------------------------------------------------------
  // SECTION 4: JOURNAL D'AUDIT SÉCURITÉ
  // -------------------------------------------------------------
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');

  const filteredSecurityLogs = useMemo(() => {
    const logs = state.securityAuditLogs || [];
    return logs.filter((log) => {
      const q = auditSearch.toLowerCase();
      const matchSearch =
        !q ||
        log.summary.toLowerCase().includes(q) ||
        log.performedByName.toLowerCase().includes(q) ||
        (log.targetUserName && log.targetUserName.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q));

      const matchAction = auditActionFilter === 'ALL' || log.actionType === auditActionFilter;

      return matchSearch && matchAction;
    });
  }, [state.securityAuditLogs, auditSearch, auditActionFilter]);

  const handleExportAuditCSV = () => {
    const logs = filteredSecurityLogs;
    if (logs.length === 0) {
      showAlert(lang === 'fr' ? 'Aucun événement à exporter.' : 'No security events to export.', 'warning');
      return;
    }
    const headers = ['ID', 'Date/Heure', 'Auteur', 'Rôle Auteur', 'Type Action', 'Cible', 'Rôle Cible', 'Résumé', 'Détails'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.performedByName}"`,
      l.performedByRole,
      l.actionType,
      `"${l.targetUserName || '-'}"`,
      l.targetRole || '-',
      `"${l.summary.replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FCT_Audit_Securite_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helpers de rendu visuel
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'director':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'accountant_cashier':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'fleet_manager':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'sales_agent':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'rental_agent':
        return 'bg-cyan-100 text-cyan-900 border-cyan-200';
      case 'driver':
        return 'bg-teal-100 text-teal-900 border-teal-200';
      case 'viewer':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: UserAccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Actif</span>;
      case 'INVITED':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">Invitation</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px]">Suspendu</span>;
      case 'DISABLED':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">Désactivé</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête principal & Navigation des 4 sections */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>Gestion des Utilisateurs, Rôles &amp; Sécurité RBAC</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administration des comptes collaborateurs, matrice granulaire des 18 modules, surcharges individuelles et journal d'audit immuable
          </p>
        </div>

        {/* Bouton création utilisateur */}
        {hasEffectivePermission(currentUser, 'users', 'create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Inviter / Créer Collaborateur</span>
          </button>
        )}
      </div>

      {/* Alerte contextuelle */}
      {actionAlert && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : actionAlert.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <span>{actionAlert.message}</span>
          <button
            onClick={() => setActionAlert(null)}
            className="cursor-pointer text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Onglets de navigation des 4 sections */}
      <div className="flex items-center border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'USERS'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Utilisateurs &amp; Collaborateurs</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {kpis.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ROLES')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'ROLES'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Rôles &amp; Matrice de Permissions</span>
          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
            8 Rôles
          </span>
        </button>

        <button
          onClick={() => setActiveTab('OVERRIDES')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'OVERRIDES'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>3. Exceptions &amp; Droits Individuels</span>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
            {kpis.withOverrides} actif(s)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'AUDIT'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>4. Journal de Sécurité &amp; Audit</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
            {(state.securityAuditLogs || []).length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1 : UTILISATEURS & COLLABORATEURS                 */}
      {/* ========================================================= */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          {/* Baromètre KPIs synthétiques */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Collaborateurs</div>
              <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Comptes Actifs</div>
              <div className="text-xl font-black text-emerald-600 mt-1">{kpis.active}</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Invitations en attente</div>
              <div className="text-xl font-black text-amber-600 mt-1">{kpis.invited}</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Suspendus / Révoqués</div>
              <div className="text-xl font-black text-rose-600 mt-1">{kpis.suspended}</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Super Administrateurs</div>
              <div className="text-xl font-black text-purple-600 mt-1 flex items-center gap-1.5">
                <span>{kpis.superAdmins}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Protégé</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Exceptions Actives</div>
              <div className="text-xl font-black text-blue-600 mt-1">{kpis.withOverrides}</div>
            </div>
          </div>

          {/* Barre de Recherche et Filtres */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, e-mail, téléphone ou fonction..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Filtre Rôle */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-bold">Rôle:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Tous les Rôles ({state.users.length})</option>
                  {ROLE_DEFINITIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Statut */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-bold">Statut:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Tous les Statuts</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="INVITED">Invitation</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="DISABLED">Désactivé</option>
                </select>
              </div>
            </div>

            {/* Toggle Affichage Grille / Tableau */}
            <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cartes
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tableau
              </button>
            </div>
          </div>

          {/* Affichage : Cartes ou Tableau */}
          {filteredUsers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-2">
              <UserX className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">Aucun utilisateur ne correspond à votre recherche.</div>
              <div className="text-xs text-slate-400">Modifiez vos filtres ou effectuez une recherche différente.</div>
            </div>
          ) : viewMode === 'CARDS' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((usr) => {
                const effectivePerms = calculateEffectivePermissions(usr, state.rolePermissions);
                const readableModulesCount = ALL_APP_MODULES.filter((m) => effectivePerms[m]?.includes('read')).length;
                const hasOverrides =
                  (usr.permissionsOverrides?.allow && Object.keys(usr.permissionsOverrides.allow).length > 0) ||
                  (usr.permissionsOverrides?.deny && Object.keys(usr.permissionsOverrides.deny).length > 0);

                return (
                  <div
                    key={usr.id}
                    onClick={() => {
                      setSelectedUser(usr);
                      setUserDetailTab('OVERVIEW');
                    }}
                    className="bg-white rounded-xl shadow-xs border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Header Carte : Rôle + Statut */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(usr.role)}`}>
                          {t.roles[usr.role] || usr.role}
                        </span>
                        {getStatusBadge(usr.status)}
                      </div>

                      {/* Identité */}
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#0f2a4a] text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          {usr.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                            {usr.fullName}
                          </h3>
                          <div className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{usr.jobTitle || 'Collaborateur FCT'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Coordonnées */}
                      <div className="space-y-1 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{usr.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{usr.phone}</span>
                        </div>
                      </div>

                      {/* Modules autorisés & exceptions */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Accès modules : <strong className="text-slate-900">{readableModulesCount} / 18</strong>
                        </span>
                        {hasOverrides && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Exceptions</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer : Bouton Showroom */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-bold group-hover:text-blue-800">
                      <span>Consulter la fiche détaillée</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Mode Tableau */
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Collaborateur</th>
                      <th className="py-3 px-4">Fonction</th>
                      <th className="py-3 px-4">E-mail Professionnel</th>
                      <th className="py-3 px-4">Téléphone</th>
                      <th className="py-3 px-4">Rôle</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((usr) => (
                      <tr
                        key={usr.id}
                        onClick={() => {
                          setSelectedUser(usr);
                          setUserDetailTab('OVERVIEW');
                        }}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-xs">
                            {usr.fullName.charAt(0)}
                          </div>
                          <span>{usr.fullName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{usr.jobTitle || 'Collaborateur'}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{usr.email}</td>
                        <td className="py-3 px-4 text-slate-600">{usr.phone}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeColor(usr.role)}`}>
                            {t.roles[usr.role] || usr.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(usr.status)}</td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUser(usr);
                                setUserDetailTab('OVERVIEW');
                              }}
                              className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition"
                              title="Voir la fiche détaillée"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {hasEffectivePermission(currentUser, 'users', 'update') && (
                              <button
                                onClick={() => {
                                  setEditingUser({ ...usr });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition"
                                title="Modifier"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2 : RÔLES & MATRICE DE PERMISSIONS GRANULAIRE     */}
      {/* ========================================================= */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          {/* Bandeau de sélection de rôle & description */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Configuration du Rôle : {t.roles[selectedRole]}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ROLE_DEFINITIONS.find((r) => r.id === selectedRole)?.description}
                </p>
              </div>

              {/* Rétablir les valeurs par défaut */}
              {currentUser.role === 'super_admin' && (
                <button
                  onClick={() => setShowResetRoleModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rétablir les valeurs par défaut</span>
                </button>
              )}
            </div>

            {/* Sélecteur des 8 rôles sous forme de pilules */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              {ROLE_DEFINITIONS.map((r) => {
                const count = state.users.filter((u) => u.role === r.id).length;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      if (isDraftDirty) {
                        setPendingRoleSwitch(r.id);
                        return;
                      }
                      setSelectedRole(r.id);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{r.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Barre de comparaison des rôles */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Comparer avec un autre rôle :</span>
                <select
                  value={compareRole || ''}
                  onChange={(e) => setCompareRole((e.target.value as UserRole) || null)}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                >
                  <option value="">-- Aucun (Vue standard) --</option>
                  {ROLE_DEFINITIONS.filter((r) => r.id !== selectedRole).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {compareRole && (
                  <button
                    onClick={() => setCompareRole(null)}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Fermer la comparaison
                  </button>
                )}
              </div>

              {isDraftDirty && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Modifications non enregistrées</span>
                  <button
                    onClick={() => setShowSaveImpactModal(true)}
                    className="ml-2 px-2.5 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold transition cursor-pointer"
                  >
                    Enregistrer ({impactedUsersCount} impacté(s))
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comparaison côte à côte si activée */}
          {compareRole && comparisonResult && (
            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs space-y-3">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>
                  Comparatif : {t.roles[selectedRole]} VS {t.roles[compareRole]}
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                Visualisation des différences de privilèges entre les deux profils de responsabilité
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 uppercase text-[10px] text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Uniquement {t.roles[selectedRole]}</th>
                      <th className="py-2.5 px-3">Droits Communs</th>
                      <th className="py-2.5 px-3">Uniquement {t.roles[compareRole]}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ALL_APP_MODULES.map((mod) => {
                      const comp = comparisonResult[mod];
                      return (
                        <tr key={mod} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900 uppercase text-[11px]">{mod}</td>
                          <td className="py-2 px-3">
                            {comp.onlyInA.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {comp.onlyInA.map((a) => (
                                  <span key={a} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                                    +{a}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {comp.inBoth.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {comp.inBoth.map((a) => (
                                  <span key={a} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">Aucun</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {comp.onlyInB.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {comp.onlyInB.map((a) => (
                                  <span key={a} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                    +{a}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Matrice Interactive 18 Modules x 7 Actions */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-4 p-4">
            {/* Filtre Modules et Catégories */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer les modules..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-500 mr-1">Catégorie :</span>
                {(['ALL', 'FLEET', 'COMMERCIAL', 'FINANCE', 'SYSTEM'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMatrixCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                      matrixCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL'
                      ? 'Tous (18)'
                      : cat === 'FLEET'
                      ? 'Flotte'
                      : cat === 'COMMERCIAL'
                      ? 'Commercial'
                      : cat === 'FINANCE'
                      ? 'Finance'
                      : 'Système'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Matrice */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-44">Module Métier</th>
                    <th className="py-3 px-3 text-center">Lire</th>
                    <th className="py-3 px-3 text-center">Créer</th>
                    <th className="py-3 px-3 text-center">Modifier</th>
                    <th className="py-3 px-3 text-center">Supprimer</th>
                    <th className="py-3 px-3 text-center">Approuver</th>
                    <th className="py-3 px-3 text-center">Exporter</th>
                    <th className="py-3 px-3 text-center">Données Sensibles</th>
                    <th className="py-3 px-4 text-center">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categorizedModules.map((mod) => {
                    const rowPerms = draftRolePermissions[mod] || [];
                    const isAllSelected = ALL_PERMISSION_ACTIONS.every((a) => rowPerms.includes(a));

                    return (
                      <tr key={mod} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 uppercase text-[11px] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{mod}</span>
                        </td>

                        {ALL_PERMISSION_ACTIONS.map((act) => {
                          const isChecked = rowPerms.includes(act);
                          return (
                            <td key={act} className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDraftPermission(mod, act)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                            </td>
                          );
                        })}

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setRowAll(mod, !isAllSelected)}
                            className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                          >
                            {isAllSelected ? 'Tout décocher' : 'Tout cocher'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3 : PERMISSIONS INDIVIDUELLES & EXCEPTIONS        */}
      {/* ========================================================= */}
      {activeTab === 'OVERRIDES' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-600" />
              <span>Gestion des Exceptions Individuelles (Surcharges Allow &amp; Deny)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Le principe d’attribution applique la règle de priorité stricte :
              <strong className="text-slate-800"> Invariant de sécurité &gt; Restriction individuelle (Deny) &gt; Rôle par défaut &gt; Autorisation individuelle (Allow)</strong>.
              Une exception permet d’octroyer un droit ponctuel (ex: lecture de Maintenance pour un commercial) ou de restreindre l’accès à des données confidentielles.
            </p>
          </div>

          {/* Liste des collaborateurs avec ou sans surcharges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {state.users.map((usr) => {
              const allows = usr.permissionsOverrides?.allow || {};
              const denies = usr.permissionsOverrides?.deny || {};
              const hasAllows = Object.keys(allows).length > 0;
              const hasDenies = Object.keys(denies).length > 0;

              return (
                <div
                  key={usr.id}
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeColor(usr.role)}`}>
                        {t.roles[usr.role] || usr.role}
                      </span>
                      {getStatusBadge(usr.status)}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">{usr.fullName}</h4>
                    <div className="text-xs text-slate-500 font-mono truncate">{usr.email}</div>

                    {/* Exceptions Allow */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Autorisations supplémentaires (Allow) :</span>
                      </div>
                      {hasAllows ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(allows).flatMap(([mod, acts]) =>
                            (acts || []).map((act) => (
                              <span key={`${mod}-${act}`} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[10px]">
                                +{mod}:{act}
                              </span>
                            ))
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Aucune autorisation spécifique</span>
                      )}
                    </div>

                    {/* Exceptions Deny */}
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        <span>Restrictions explicites (Deny) :</span>
                      </div>
                      {hasDenies ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(denies).flatMap(([mod, acts]) =>
                            (acts || []).map((act) => (
                              <span key={`${mod}-${act}`} className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-200 font-bold text-[10px]">
                                -{mod}:{act}
                              </span>
                            ))
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Aucune restriction spécifique</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    {hasEffectivePermission(currentUser, 'users', 'update') && (
                      <button
                        onClick={() => openOverrideModal(usr)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Gérer les Exceptions</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4 : JOURNAL DE SÉCURITÉ & AUDIT                   */}
      {/* ========================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par auteur, cible ou description..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium"
              >
                <option value="ALL">Tous les types d'événements</option>
                <option value="USER_CREATE">Création de compte</option>
                <option value="USER_INVITE">Invitation</option>
                <option value="USER_UPDATE">Modification de profil</option>
                <option value="USER_STATUS_CHANGE">Changement de statut</option>
                <option value="ROLE_CHANGE">Attribution de rôle</option>
                <option value="ROLE_PERMISSIONS_UPDATE">Mise à jour matrice RBAC</option>
                <option value="USER_OVERRIDE_UPDATE">Surcharge individuelle</option>
                <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Tentative non autorisée</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Append-Only Immuable</span>
              </span>
              <button
                onClick={handleExportAuditCSV}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f2a4a] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date &amp; Heure (DLA)</th>
                    <th className="py-3 px-4">Auteur</th>
                    <th className="py-3 px-4">Type Événement</th>
                    <th className="py-3 px-4">Cible</th>
                    <th className="py-3 px-4">Description de l'Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSecurityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Aucun événement de sécurité ne correspond aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredSecurityLogs.map((log) => {
                      const isAlert = log.actionType === 'UNAUTHORIZED_ACCESS_ATTEMPT';
                      return (
                        <tr key={log.id} className={`hover:bg-slate-50 ${isAlert ? 'bg-rose-50/50' : ''}`}>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {log.timestamp.replace('T', ' ').substring(0, 19)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{log.performedByName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">({log.performedByRole})</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAlert
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {log.actionType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {log.targetUserName || log.targetRole || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <div className="font-semibold text-slate-900">{log.summary}</div>
                            {log.details && <div className="text-[11px] text-slate-500 mt-0.5">{log.details}</div>}
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

      {/* ========================================================= */}
      {/* SHOWROOM / FICHE DÉTAILLÉE UTILISATEUR (MODAL ÉCRAN)     */}
      {/* ========================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header du Showroom Utilisateur */}
            <div className="bg-[#0f2a4a] text-white p-6 relative shrink-0">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-wrap items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white text-[#0f2a4a] font-black flex items-center justify-center text-2xl shadow-md">
                  {selectedUser.fullName.charAt(0)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                      {t.roles[selectedUser.role]}
                    </span>
                    {getStatusBadge(selectedUser.status)}
                    <span className="text-[11px] text-slate-300 font-mono">ID: {selectedUser.id}</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">{selectedUser.fullName}</h3>
                  <p className="text-xs text-slate-300">{selectedUser.jobTitle || 'Collaborateur FCT Automobile Douala'}</p>
                </div>
              </div>

              {/* Sous-onglets de la fiche */}
              <div className="flex items-center gap-2 mt-6 border-b border-white/10 text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => setUserDetailTab('OVERVIEW')}
                  className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                    userDetailTab === 'OVERVIEW'
                      ? 'border-emerald-400 text-emerald-400 font-black'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  Vue d'ensemble
                </button>
                <button
                  onClick={() => setUserDetailTab('EFFECTIVE_RIGHTS')}
                  className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                    userDetailTab === 'EFFECTIVE_RIGHTS'
                      ? 'border-emerald-400 text-emerald-400 font-black'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  Droits Effectifs &amp; Origine
                </button>
                <button
                  onClick={() => setUserDetailTab('OVERRIDES')}
                  className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                    userDetailTab === 'OVERRIDES'
                      ? 'border-emerald-400 text-emerald-400 font-black'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  Exceptions Individuelles
                </button>
                <button
                  onClick={() => setUserDetailTab('AUDIT')}
                  className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                    userDetailTab === 'AUDIT'
                      ? 'border-emerald-400 text-emerald-400 font-black'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  Historique d'Activité
                </button>
              </div>
            </div>

            {/* Corps défilable de la fiche */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Onglet 1 : Vue d'ensemble */}
              {userDetailTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coordonnées Professionnelles</div>
                      <div className="space-y-1.5 text-slate-700">
                        <div>E-mail professionnel : <span className="font-mono font-bold text-slate-900">{selectedUser.email}</span></div>
                        <div>Téléphone direct : <span className="font-bold text-slate-900">{selectedUser.phone}</span></div>
                        <div>Fonction : <span className="font-semibold text-slate-900">{selectedUser.jobTitle || 'Non renseignée'}</span></div>
                        <div>Rôle attribué : <span className="font-bold text-blue-900">{t.roles[selectedUser.role]}</span></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">État &amp; Traçabilité Compte</div>
                      <div className="space-y-1.5 text-slate-700">
                        <div>Statut du compte : {getStatusBadge(selectedUser.status)}</div>
                        <div>Date d'enregistrement : <span className="font-semibold text-slate-900">{selectedUser.createdAt ? selectedUser.createdAt.split('T')[0] : '2026-01-01'}</span></div>
                        <div>Dernière connexion : <span className="font-semibold text-slate-900">{selectedUser.lastLoginAt || 'Jamais connecté'}</span></div>
                        <div>Créé par : <span className="font-semibold text-slate-900">{selectedUser.createdByName || 'Directeur Systèmes'}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Responsabilités du rôle */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-1.5">
                    <div className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>Responsabilités rattachées au profil {t.roles[selectedUser.role]}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {ROLE_DEFINITIONS.find((r) => r.id === selectedUser.role)?.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Onglet 2 : Droits Effectifs & Origine */}
              {userDetailTab === 'EFFECTIVE_RIGHTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <p>
                      Synthèse des droits calculés pour <strong className="text-slate-900">{selectedUser.fullName}</strong> avec provenance de chaque permission :
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-300"></span> Rôle par défaut
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300"></span> Surcharge Allow (+)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300"></span> Restriction Deny (-)
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[650px]">
                      <thead className="bg-slate-100 uppercase text-[10px] text-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Module</th>
                          {ALL_PERMISSION_ACTIONS.map((a) => (
                            <th key={a} className="py-2.5 px-2 text-center">{a}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ALL_APP_MODULES.map((mod) => {
                          return (
                            <tr key={mod} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900 uppercase text-[11px]">{mod}</td>
                              {ALL_PERMISSION_ACTIONS.map((act) => {
                                const origin = getPermissionOrigin(selectedUser, mod, act, state.rolePermissions);
                                const isAllowed = origin === 'ROLE_DEFAULT' || origin === 'INDIVIDUAL_ALLOW';

                                return (
                                  <td key={act} className="py-2.5 px-2 text-center">
                                    {origin === 'INDIVIDUAL_DENY' ? (
                                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[9px] border border-rose-300" title="Interdiction explicite (Deny)">
                                        Deny
                                      </span>
                                    ) : origin === 'INDIVIDUAL_ALLOW' ? (
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] border border-emerald-300" title="Autorisation supplémentaire (Allow)">
                                        Allow
                                      </span>
                                    ) : origin === 'ROLE_DEFAULT' ? (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px] border border-blue-200" title="Droit hérité du rôle">
                                        Rôle
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 text-xs">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet 3 : Exceptions Individuelles */}
              {userDetailTab === 'OVERRIDES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Surcharges Actives</h4>
                      <p className="text-slate-500">Gérez les exceptions spécifiques à ce compte sans modifier le rôle</p>
                    </div>
                    {hasEffectivePermission(currentUser, 'users', 'update') && (
                      <button
                        onClick={() => openOverrideModal(selectedUser)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer"
                      >
                        Modifier les exceptions
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 space-y-2">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Autorisations Complémentaires (Allow)</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(selectedUser.permissionsOverrides?.allow || {}).map(([mod, acts]) => (
                          <div key={mod} className="text-slate-700">
                            <strong className="uppercase text-[11px] text-slate-900">{mod} :</strong>{' '}
                            {(acts || []).join(', ')}
                          </div>
                        ))}
                        {(!selectedUser.permissionsOverrides?.allow || Object.keys(selectedUser.permissionsOverrides.allow).length === 0) && (
                          <p className="text-slate-400 italic">Aucune autorisation supplémentaire active.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-200 space-y-2">
                      <div className="font-bold text-rose-900 flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-700" />
                        <span>Restrictions Explicites (Deny)</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(selectedUser.permissionsOverrides?.deny || {}).map(([mod, acts]) => (
                          <div key={mod} className="text-slate-700">
                            <strong className="uppercase text-[11px] text-slate-900">{mod} :</strong>{' '}
                            {(acts || []).join(', ')}
                          </div>
                        ))}
                        {(!selectedUser.permissionsOverrides?.deny || Object.keys(selectedUser.permissionsOverrides.deny).length === 0) && (
                          <p className="text-slate-400 italic">Aucune restriction individuelle active.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet 4 : Historique d'Activité */}
              {userDetailTab === 'AUDIT' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Événements liés à ce collaborateur</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {(state.securityAuditLogs || [])
                      .filter((l) => l.targetUserId === selectedUser.id || l.performedById === selectedUser.id)
                      .map((log) => (
                        <div key={log.id} className="p-3.5 hover:bg-slate-50 transition space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{log.summary}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.timestamp.replace('T', ' ').substring(0, 19)}
                            </span>
                          </div>
                          <div className="text-slate-500">
                            Par : <strong>{log.performedByName}</strong> ({log.performedByRole})
                            {log.details && <span> — {log.details}</span>}
                          </div>
                        </div>
                      ))}
                    {(state.securityAuditLogs || []).filter(
                      (l) => l.targetUserId === selectedUser.id || l.performedById === selectedUser.id
                    ).length === 0 && (
                      <div className="p-6 text-center text-slate-400 italic">
                        Aucun événement d'audit spécifique pour cet utilisateur.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer Showroom */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {hasEffectivePermission(currentUser, 'users', 'update') && (
                  <>
                    <button
                      onClick={() => {
                        setEditingUser({ ...selectedUser });
                        setIsEditModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      Modifier le profil
                    </button>

                    {selectedUser.status === 'ACTIVE' ? (
                      <button
                        onClick={() => {
                          setStatusTargetUser(selectedUser);
                          setStatusTargetAction('SUSPENDED');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-500 transition cursor-pointer"
                      >
                        Suspendre l'accès
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setStatusTargetUser(selectedUser);
                          setStatusTargetAction('ACTIVE');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition cursor-pointer"
                      >
                        Réactiver le compte
                      </button>
                    )}
                  </>
                )}

                {hasEffectivePermission(currentUser, 'users', 'delete') && selectedUser.role !== 'super_admin' && (
                  <button
                    onClick={() => setDeleteConfirmUser(selectedUser)}
                    className="px-3.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 font-bold hover:bg-rose-50 transition cursor-pointer"
                  >
                    Révoquer le compte
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-white transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CRÉATION / INVITATION UTILISATEUR                   */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Nouveau Collaborateur / Invitation</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nom *</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Mbarga"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">E-mail Professionnel *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-emerald-500"
                  placeholder="collaborateur@fct-automobile.cm"
                />
                <p className="text-[10px] text-slate-400">Normalisé en minuscules, vérification anti-doublon stricte.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                    placeholder="+237 6XX XX XX XX"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Fonction / Poste</label>
                  <input
                    type="text"
                    value={createForm.jobTitle}
                    onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Agent Commercial"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Rôle Principal *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {ROLE_DEFINITIONS.filter(
                      (r) => currentUser.role === 'super_admin' || r.id !== 'super_admin'
                    ).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Statut Initial *</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as UserAccountStatus })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">Actif immédiatement</option>
                    <option value="INVITED">Invitation en attente</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL MODIFICATION UTILISATEUR                            */}
      {/* ========================================================= */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <span>Modifier le Collaborateur</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Prénom</label>
                  <input
                    type="text"
                    value={editingUser.firstName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nom</label>
                  <input
                    type="text"
                    value={editingUser.lastName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">E-mail Professionnel *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Téléphone</label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Fonction</label>
                  <input
                    type="text"
                    value={editingUser.jobTitle || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Rôle Principal</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {ROLE_DEFINITIONS.filter(
                    (r) => currentUser.role === 'super_admin' || r.id !== 'super_admin'
                  ).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL GESTION DES SURCHARGES (ALLOW / DENY)               */}
      {/* ========================================================= */}
      {overrideModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-4 sm:p-6 space-y-4 my-auto max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-600" />
                  <span>Exceptions pour : {overrideModalUser.fullName}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rôle de base : <strong className="text-slate-800">{t.roles[overrideModalUser.role]}</strong>
                </p>
              </div>
              <button
                onClick={() => setOverrideModalUser(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 text-xs pr-1">
              <p className="text-slate-600">
                Cochez pour ajouter une autorisation exceptionnelle (<strong className="text-emerald-700">+Allow</strong>) ou appliquer une restriction stricte (<strong className="text-rose-700">-Deny</strong>).
              </p>

              <div className="space-y-3">
                {ALL_APP_MODULES.map((mod) => {
                  const allows = overrideDraft.allow?.[mod] || [];
                  const denies = overrideDraft.deny?.[mod] || [];

                  return (
                    <div key={mod} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-900 uppercase text-[11px] flex items-center justify-between">
                        <span>{mod}</span>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-emerald-700 font-bold">Allow (+)</span>
                          <span className="text-rose-700 font-bold">Deny (-)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                        {ALL_PERMISSION_ACTIONS.map((act) => {
                          const isAllow = allows.includes(act);
                          const isDeny = denies.includes(act);

                          return (
                            <div key={act} className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
                              <span className="font-medium text-slate-700 text-[11px]">{act}</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  title={`Allow ${act}`}
                                  checked={isAllow}
                                  onChange={(e) => {
                                    const nextAllows = e.target.checked
                                      ? [...allows, act]
                                      : allows.filter((a) => a !== act);
                                    setOverrideDraft({
                                      ...overrideDraft,
                                      allow: { ...overrideDraft.allow, [mod]: nextAllows },
                                      deny: { ...overrideDraft.deny, [mod]: denies.filter((d) => d !== act) },
                                    });
                                  }}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                                />
                                <input
                                  type="checkbox"
                                  title={`Deny ${act}`}
                                  checked={isDeny}
                                  onChange={(e) => {
                                    const nextDenies = e.target.checked
                                      ? [...denies, act]
                                      : denies.filter((a) => a !== act);
                                    setOverrideDraft({
                                      ...overrideDraft,
                                      deny: { ...overrideDraft.deny, [mod]: nextDenies },
                                      allow: { ...overrideDraft.allow, [mod]: allows.filter((a) => a !== act) },
                                    });
                                  }}
                                  className="w-3.5 h-3.5 text-rose-600 rounded border-slate-300"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setOverrideModalUser(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveOverrides}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs cursor-pointer"
              >
                Appliquer les Exceptions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL SUSPENSION / RÉACTIVATION STATUT                   */}
      {/* ========================================================= */}
      {statusTargetUser && statusTargetAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>
                {statusTargetAction === 'ACTIVE'
                  ? 'Réactiver le compte collaborateur'
                  : 'Suspendre l’accès du collaborateur'}
              </span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous sûr de vouloir changer le statut de{' '}
              <strong className="text-slate-900">{statusTargetUser.fullName}</strong> en{' '}
              <strong className="text-slate-900">"{statusTargetAction}"</strong> ?
              {statusTargetAction !== 'ACTIVE' && (
                <span className="block mt-1 text-rose-600">
                  L'utilisateur ne pourra plus se connecter ni effectuer d'opérations sur les modules de l'ERP.
                </span>
              )}
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Motif de l'action (consigné dans l'audit) :</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={2}
                placeholder="Ex: Fin de contrat, mission temporaire terminée, demande RH..."
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setStatusTargetUser(null);
                  setStatusTargetAction(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmStatusToggle}
                className={`px-4 py-2 rounded-lg text-white font-bold shadow-xs cursor-pointer ${
                  statusTargetAction === 'ACTIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-orange-600 hover:bg-orange-500'
                }`}
              >
                Confirmer le Changement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation de sauvegarde avec aperçu d'impact */}
      {showSaveImpactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Confirmation de la Matrice RBAC</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vous allez enregistrer les modifications apportées au rôle{' '}
              <strong className="text-slate-900">{t.roles[selectedRole]}</strong>.
            </p>

            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="font-bold text-blue-900">Conséquences immédiates :</div>
              <div className="text-slate-700">
                • <strong>{impactedUsersCount} utilisateur(s)</strong> actifs rattachés à ce rôle verront leurs permissions actualisées en temps réel.
              </div>
              <div className="text-slate-700">
                • Les exceptions individuelles (Allow / Deny) existantes restent préservées.
              </div>
              <div className="text-slate-700">
                • Un événement officiel sera inscrit dans le journal d'audit immuable.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowSaveImpactModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRolePermissions}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer"
              >
                Confirmer &amp; Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Sécurisée avec motif obligatoire */}
      {deleteConfirmUser && (
        <DeleteConfirmModal
          isOpen={true}
          title="Révoquer le compte collaborateur"
          itemName={deleteConfirmUser.fullName}
          itemDetails={`E-mail: ${deleteConfirmUser.email} (${deleteConfirmUser.role})`}
          warningMessage="Le collaborateur sera immédiatement désactivé et archivé dans le journal d'audit."
          onConfirm={handleConfirmDeleteUser}
          onCancel={() => setDeleteConfirmUser(null)}
        />
      )}

      {/* Modal Rétablissement des Droits par Défaut FCT */}
      {showResetRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              <span>Rétablir les Permissions d'Origine</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Voulez-vous vraiment rétablir les permissions par défaut officielles FCT pour le rôle{' '}
              <strong className="text-slate-900">{t.roles[selectedRole]}</strong> ? Toutes les modifications locales sur ce rôle seront réinitialisées.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowResetRoleModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmResetRoleDefault}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs cursor-pointer"
              >
                Confirmer &amp; Rétablir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changement de Rôle avec Brouillon non Sauvegardé */}
      {pendingRoleSwitch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Modifications Non Enregistrées</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vous avez des modifications non enregistrées pour le rôle{' '}
              <strong className="text-slate-900">{t.roles[selectedRole]}</strong>. Souhaitez-vous continuer sans sauvegarder ?
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPendingRoleSwitch(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Continuer l'Édition
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetRole = pendingRoleSwitch;
                  setPendingRoleSwitch(null);
                  setIsDraftDirty(false);
                  const matrix = dbStore.getRolePermissionsMatrix()[targetRole];
                  setDraftRolePermissions(JSON.parse(JSON.stringify(matrix)));
                  setSelectedRole(targetRole);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-xs cursor-pointer"
              >
                Ignorer &amp; Basculer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
