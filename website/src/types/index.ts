export type VehicleCategory = 'SUV' | '4X4' | 'BERLINE' | 'PICKUP' | 'UTILITAIRE' | 'LUXE';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  transmission: 'AUTOMATIQUE' | 'MANUELLE';
  fuel: 'DIESEL' | 'ESSENCE' | 'HYBRIDE';
  seats: number;
  mileage: number;
  rentalDailyRate: number; // en FCFA
  securityDepositRate: number; // en FCFA
  salePrice: number; // en FCFA
  isForRent: boolean;
  isForSale: boolean;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  currentLocation: string;
  color: string;
  photoUrls: string[];
  description: string;
  features: string[];
  engineDisplacement?: string;
  horsepower?: string;
  conditionGrade?: string;
  licensePlate?: string;
}

export interface BookingRequest {
  vehicleId: string;
  vehicleName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startDate: string;
  endDate: string;
  withDriver: boolean;
  destination: string;
  dailyRate: number;
  driverFee: number;
  totalDays: number;
  totalAmount: number;
  depositAmount: number;
  notes?: string;
}

export interface PurchaseRequest {
  vehicleId: string;
  vehicleName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  budgetOfferXAF?: number;
  financingNeeded: boolean;
  notes?: string;
}

export interface MaintenanceRecordItem {
  id: string;
  licensePlate: string;
  date: string;
  type: string;
  garageName: string;
  mileageKm: number;
  workDescription: string;
  partsReplaced: string[];
  certifiedBy: string;
  costTotalXAF: number;
  isCertifiedFCT: boolean;
}
