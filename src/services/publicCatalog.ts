/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Catalogue Public (Projection sécurisée)
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Le site web public ne lit JAMAIS la collection `vehicles` (données internes :
 * VIN, plaque, coût d'acquisition...). Il lit uniquement `public_vehicles`,
 * une projection assainie alimentée automatiquement par l'ERP.
 */

import { Vehicle } from '../../packages/shared-types/index.ts';

export const PUBLIC_VEHICLES_COLLECTION = 'public_vehicles';

export interface PublicVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: Vehicle['category'];
  transmission: Vehicle['transmission'];
  fuel: Vehicle['fuel'];
  seats: number;
  mileage: number;
  rentalDailyRate: number;
  securityDepositRate: number;
  salePrice: number;
  isForSale: boolean;
  isForRent: boolean;
  status: Vehicle['status'];
  currentLocation: string;
  color: string;
  photoUrls: string[];
  photoAngles?: string[];
  description?: string;
  features?: string[];
  engineDisplacement?: string;
  horsepower?: string;
  conditionGrade?: string;
  updatedAt: string;
}

/** Un véhicule n'est publiable que s'il est disponible et proposé à la location ou à la vente. */
export function isVehiclePublishable(vehicle: Vehicle): boolean {
  return vehicle.status === 'AVAILABLE' && (vehicle.isForRent || vehicle.isForSale);
}

/** Projection assainie : exclut VIN, plaque, coût d'acquisition, dates de conformité, etc. */
export function toPublicVehicle(vehicle: Vehicle): PublicVehicle {
  const projection: PublicVehicle = {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    category: vehicle.category,
    transmission: vehicle.transmission,
    fuel: vehicle.fuel,
    seats: vehicle.seats,
    mileage: vehicle.mileage,
    rentalDailyRate: vehicle.rentalDailyRate,
    securityDepositRate: vehicle.securityDepositRate,
    salePrice: vehicle.salePrice,
    isForSale: vehicle.isForSale,
    isForRent: vehicle.isForRent,
    status: vehicle.status,
    currentLocation: vehicle.currentLocation,
    color: vehicle.color,
    photoUrls: [...(vehicle.photoUrls || [])],
    updatedAt: vehicle.updatedAt,
  };
  if (vehicle.photoAngles) projection.photoAngles = [...vehicle.photoAngles];
  if (vehicle.description) projection.description = vehicle.description;
  if (vehicle.features) projection.features = [...vehicle.features];
  if (vehicle.engineDisplacement) projection.engineDisplacement = vehicle.engineDisplacement;
  if (vehicle.horsepower) projection.horsepower = vehicle.horsepower;
  if (vehicle.conditionGrade) projection.conditionGrade = vehicle.conditionGrade;
  return projection;
}
