/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Shared Types & Interfaces
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 */

export type UserRole =
  | 'super_admin'
  | 'director'
  | 'sales_agent'
  | 'rental_agent'
  | 'accountant_cashier'
  | 'fleet_manager'
  | 'driver'
  | 'viewer';

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'sensitiveData';

export type UserAccountStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';

export interface UserPermissionOverrides {
  allow?: Partial<Record<AppModule, PermissionAction[]>>;
  deny?: Partial<Record<AppModule, PermissionAction[]>>;
}

export type AppModule =
  | 'dashboard'
  | 'vehicles'
  | 'stock'
  | 'rentals'
  | 'sales'
  | 'crm'
  | 'reservations'
  | 'billing'
  | 'cash'
  | 'maintenance'
  | 'drivers'
  | 'documents'
  | 'notifications'
  | 'reports'
  | 'users'
  | 'settings'
  | 'audit'
  | 'help';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  jobTitle?: string;
  role: UserRole;
  status: UserAccountStatus;
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: string;
  createdById?: string;
  createdByName?: string;
  lastLoginAt?: string;
  assignedDriverId?: string;
  permissionsOverrides?: UserPermissionOverrides;
  customRestrictions?: string[];
  effectivePermissions?: Partial<Record<AppModule, PermissionAction[]>>;
}

export interface RoleDefinition {
  id: UserRole;
  name: string;
  description: string;
  permissions: Record<AppModule, PermissionAction[]>;
  userCount?: number;
  isSystem: boolean;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  performedById: string;
  performedByName: string;
  performedByRole: UserRole;
  targetUserId?: string;
  targetUserName?: string;
  targetRole?: UserRole;
  actionType:
    | 'USER_CREATE'
    | 'USER_INVITE'
    | 'USER_UPDATE'
    | 'USER_STATUS_CHANGE'
    | 'ROLE_CHANGE'
    | 'ROLE_PERMISSIONS_UPDATE'
    | 'USER_OVERRIDE_UPDATE'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT';
  summary: string;
  details?: string;
  ipAddress?: string;
}

export type VehicleCategory = 'SUV' | 'BERLINE' | '4X4' | 'PICKUP' | 'UTILITAIRE' | 'LUXE';
export type VehicleTransmission = 'AUTOMATIQUE' | 'MANUELLE';
export type VehicleFuel = 'DIESEL' | 'ESSENCE' | 'HYBRIDE';
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RESERVED' | 'SOLD';

export interface Vehicle {
  id: string;
  vin: string;
  licensePlate: string; // ex: LT-4589-AB
  brand: string; // ex: Toyota, Mitsubishi, Mercedes-Benz
  model: string; // ex: Land Cruiser Prado TX, Pajero Sport
  year: number;
  category: VehicleCategory;
  transmission: VehicleTransmission;
  fuel: VehicleFuel;
  seats: number;
  mileage: number; // km
  acquisitionCost: number; // Montant entier XAF
  rentalDailyRate: number; // XAF / jour
  securityDepositRate: number; // Caution par défaut XAF
  salePrice: number; // Prix de vente XAF (si en vente)
  isForSale: boolean;
  isForRent: boolean;
  status: VehicleStatus;
  currentLocation: string; // ex: Agence Bonamoussadi
  color: string;
  photoUrls: string[];
  photoAngles?: string[];
  documentsCount: number;
  nextTechnicalInspectionDate: string;
  insuranceExpiryDate: string;
  description?: string;
  features?: string[];
  engineDisplacement?: string;
  horsepower?: string;
  conditionGrade?: string;
  updatedAt: string;
}

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface Customer {
  id: string;
  type: CustomerType;
  fullName: string;
  companyName?: string;
  phone: string;
  email: string;
  address: string;
  city: string; // ex: Douala
  idCardNumber?: string; // CNI ou Passeport
  taxNumber?: string; // NIU (Numéro d'Identifiant Unique Cameroun)
  rccmNumber?: string;
  notes?: string;
  totalRentalsCount: number;
  totalSpentXAF: number;
  createdAt: string;
}

export type RentalStatus = 'DRAFT' | 'CONFIRMED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED' | 'OVERDUE';

export interface InspectionData {
  fuelLevel: number; // 0 to 8 (ex: 8/8 full tank)
  mileage: number;
  bodyConditionNotes: string;
  cleanlinessCondition: 'CLEAN' | 'DIRTY' | 'VERY_DIRTY';
  hasSpareWheel: boolean;
  hasJackAndTools: boolean;
  inspectorName: string;
  photos: string[];
  signatureDate: string;
}

export interface RentalContract {
  id: string;
  contractNumber: string; // ex: CTR-2026-0034 (généré serveur)
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  actualReturnDate?: string;
  dailyRateXAF: number;
  totalDays: number;
  totalAmountXAF: number;
  securityDepositXAF: number; // Caution consignée
  depositReturnedXAF: number;
  paidAmountXAF: number;
  remainingAmountXAF: number;
  driverIncluded: boolean;
  driverId?: string;
  driverName?: string;
  status: RentalStatus;
  inspectionDepart?: InspectionData;
  inspectionRetour?: InspectionData;
  penaltiesXAF: number;
  penaltyReason?: string;
  relatedReservationId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED';

export interface Reservation {
  id: string;
  reservationNumber: string; // ex: RES-2026-0089
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  estimatedTotalXAF: number;
  advanceDepositXAF: number;
  status: ReservationStatus;
  source: 'WALK_IN' | 'PHONE' | 'WEBSITE' | 'WHATSAPP';
  notes?: string;
  convertedContractId?: string;
  createdAt: string;
}

export type SalePipelineStage = 'PROSPECT' | 'OFFER' | 'NEGOTIATION' | 'ORDER' | 'SOLD' | 'DELIVERED';

export interface SaleOrder {
  id: string;
  orderNumber: string; // ex: COM-2026-0012
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  listedPriceXAF: number;
  negotiatedPriceXAF: number;
  paidAmountXAF: number;
  balanceXAF: number;
  stage: SalePipelineStage;
  deliveryDate?: string;
  deliveryCertificateNumber?: string;
  salesAgentId: string;
  salesAgentName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceType = 'PROFORMA' | 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceXAF: number;
  totalXAF: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // ex: FAC-2026-0105
  type: InvoiceType;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerNiu?: string;
  items: InvoiceItem[];
  subtotalXAF: number;
  taxAmountXAF: number; // TVA 19.25% si applicable
  totalAmountXAF: number;
  paidAmountXAF: number;
  balanceXAF: number;
  status: InvoiceStatus;
  relatedContractId?: string;
  relatedSaleOrderId?: string;
  issueDate: string;
  dueDate: string;
  createdById: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  sessionNumber: string; // ex: CS-2026-054
  openedById: string;
  openedByName: string;
  openedAt: string;
  closedById?: string;
  closedByName?: string;
  closedAt?: string;
  openingBalanceXAF: number;
  currentCashInXAF: number;
  currentCashOutXAF: number;
  calculatedExpectedBalanceXAF: number;
  countedClosingBalanceXAF?: number;
  discrepancyXAF?: number; // Ecart de caisse
  status: 'OPEN' | 'CLOSED';
  closingNotes?: string;
}

export type CashMovementType = 'INFLOW' | 'OUTFLOW';
export type CashMovementCategory =
  | 'RENTAL_PAYMENT'
  | 'SALE_PAYMENT'
  | 'DEPOSIT_IN'
  | 'DEPOSIT_REFUND'
  | 'FUEL_EXPENSE'
  | 'MAINTENANCE_EXPENSE'
  | 'OFFICE_EXPENSE'
  | 'SALARY_ADVANCE'
  | 'CONTRA_REVERSAL'
  | 'OTHER';

export interface CashMovement {
  id: string;
  receiptNumber: string; // ex: REC-2026-0245
  sessionId: string;
  type: CashMovementType;
  category: CashMovementCategory;
  amountXAF: number;
  relatedInvoiceId?: string;
  relatedContractId?: string;
  relatedSaleOrderId?: string;
  relatedCustomerId?: string;
  receivedFromOrPaidTo: string;
  paymentMethod: 'CASH'; // Espèces uniquement selon spécifications
  justificationReceiptUrl?: string;
  performedById: string;
  performedByName: string;
  createdAt: string;
  isReversal: boolean;
  reversalOfMovementId?: string;
  reversalOfReceiptNumber?: string;
  reversalReason?: string;
  reason?: string;
}

export interface StockItem {
  id: string;
  code: string; // ex: FL-OIL-5W40
  name: string;
  category: 'LUBRIFIANT' | 'PNEU' | 'FREINAGE' | 'FILTRE' | 'BATTERIE' | 'ACCESSOIRE';
  quantityInStock: number;
  minThresholdAlert: number;
  unitCostXAF: number;
  unit: string; // Litre, Pièce, Kit
  supplier: string;
  locationBin: string;
}

export type StockMovementType = 'INFLOW' | 'OUTFLOW' | 'ADJUSTMENT' | 'MAINTENANCE_USAGE';

export interface StockMovement {
  id: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  type: StockMovementType;
  quantityDelta: number; // + ou -
  quantityAfter: number;
  unitCostXAF: number;
  totalCostXAF: number;
  reason: string;
  relatedMaintenanceId?: string;
  relatedVehicleId?: string;
  performedById: string;
  performedByName: string;
  timestamp: string;
}

export type LeadStage = 'PROSPECT' | 'QUALIFIED' | 'OPPORTUNITY' | 'OFFER' | 'NEGOTIATION' | 'CONVERTED' | 'LOST';

export interface CrmLead {
  id: string;
  fullName: string;
  companyName?: string;
  phone: string;
  email: string;
  interestedCategory?: VehicleCategory;
  interestedVehicleId?: string;
  interestType: 'RENTAL' | 'PURCHASE';
  budgetXAF: number;
  stage: LeadStage;
  assignedAgentId?: string;
  assignedAgentName?: string;
  notes: string;
  convertedCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  recordNumber: string; // ex: MNT-2026-0045
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  garageName: string; // ex: Garage Moderne Akwa, CFAO Douala
  description: string;
  mileageAtService: number;
  partsUsed: {
    stockItemId?: string;
    name: string;
    quantity: number;
    unitPriceXAF: number;
    totalXAF: number;
  }[];
  laborCostXAF: number;
  totalCostXAF: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  startDate: string;
  completionDate?: string;
  technicianNotes?: string;
  invoiceAttachmentUrl?: string;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseCategories: string[]; // B, C, D
  licenseExpiryDate: string;
  medicalExamExpiryDate: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'LEAVE';
  currentAssignedVehicleId?: string;
  rating: number; // 1 to 5
  licenseDocumentUrl?: string;
  medicalCertificateUrl?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  category: 'VEHICLE_GREY_CARD' | 'INSURANCE' | 'TECHNICAL_INSPECTION' | 'CLIENT_ID' | 'CONTRACT' | 'INVOICE' | 'RECEIPT';
  cloudinaryPublicId: string;
  fileUrl: string;
  isPrivate: boolean; // Accessible uniquement avec permission
  mimeType: string;
  fileSizeBytes: number;
  relatedEntityType: 'VEHICLE' | 'CUSTOMER' | 'CONTRACT' | 'CASH_MOVEMENT';
  relatedEntityId: string;
  uploadedById: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVERSAL' | 'CLOSE_SESSION' | 'EXPORT';
  module: AppModule;
  recordId: string;
  details: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface SyncQueueItem {
  id: string;
  idempotencyKey: string;
  entityType: AppModule;
  entityId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  version: number;
  localTimestamp: string;
  serverConfirmedTimestamp?: string;
  errorMessage?: string;
}

export interface AgencySettings {
  // Identité officielle existante (préservée)
  agencyName: string;
  commercialRegistry: string; // RCCM
  taxIdNumber: string; // NIU
  address: string;
  landmark: string; // Carrefour Santa Barbara, Bonamoussadi
  city: string;
  country: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  currency: 'XAF' | string;
  timezone: 'Africa/Douala' | string;
  taxRatePercent: number; // 19.25% TVA
  defaultDepositXAF: number;
  rentalPrefix: string;
  invoicePrefix: string;
  receiptPrefix: string;
  salePrefix: string;

  // Extensions Entreprise & Image de marque
  tradeName?: string;
  logoUrl?: string;
  legalMention?: string;
  dateFormat?: string;
  timeFormat?: '24h' | '12h';

  // Apparence & Préférences
  theme?: 'light' | 'dark' | 'system';
  defaultLanguage?: 'fr' | 'en';
  density?: 'compact' | 'comfortable' | 'spacious';
  enableSoundAlerts?: boolean;
  enableDesktopNotifications?: boolean;

  // Numérotation avancée
  reservationPrefix?: string;
  maintenancePrefix?: string;
  quotePrefix?: string;
  expensePrefix?: string;
  numberPaddingDigits?: number;
  includeYearInDocNumber?: boolean;

  // Paramètres financiers & Caisse
  allowedPaymentMethods?: ('CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY')[];
  maxDiscountWithoutApprovalPercent?: number;
  expenseApprovalThresholdXAF?: number;
  cashDiscrepancyToleranceXAF?: number;
  mandatoryCashOpening?: boolean;

  // Paramètres Flotte & Alertes Parc
  insuranceAlertDays?: number;
  technicalInspectionAlertDays?: number;
  maintenanceAlertMileageKm?: number;
  requireVehicleInspectionPhotos?: boolean;

  // Paramètres Maintenance & Stocks
  defaultMaintenanceIntervalKm?: number;
  defaultGarageName?: string;
  lowStockThresholdGlobal?: number;
  strictStockDeductionOnWorkOrder?: boolean;

  // Paramètres Locations, Réservations & Contrats
  minRentalDurationDays?: number;
  maxAdvanceReservationDays?: number;
  hourlyLatePenaltyRateXAF?: number;
  mandatoryInspectionOnDeparture?: boolean;
  mandatoryInspectionOnReturn?: boolean;

  // Commutateurs et options de modules
  moduleToggles?: Partial<Record<AppModule, boolean>>;

  // Synchronisation & Cloudinary
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  cloudinaryFolderRoot?: string;
  autoSyncIntervalSeconds?: number;
}
