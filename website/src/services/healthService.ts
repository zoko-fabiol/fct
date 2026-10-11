/**
 * @license
 * FCT Automobile - Carnet de Santé Numérique & Passeport d'Entretien
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { firestore, collection, query, where, getDocs } from './firebase.ts';

export interface VehicleHealthPassport {
  licensePlate: string;
  brand: string;
  model: string;
  currentMileage: number;
  lastServiceDate?: string;
  nextInspectionDate?: string;
  insuranceValidUntil?: string;
  records: HealthServiceEntry[];
}

export interface HealthServiceEntry {
  id: string;
  recordNumber: string;
  date: string;
  mileage: number;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  typeLabel: string;
  description: string;
  garageName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
}

/**
 * Recherche l'historique d'entretien et le passeport santé d'un véhicule par son immatriculation
 */
export async function fetchVehicleHealthHistory(licensePlate: string): Promise<VehicleHealthPassport | null> {
  const plateClean = licensePlate.trim().toUpperCase().replace(/\s+/g, '-');
  if (!plateClean) return null;

  try {
    // 1. Recherche du véhicule correspondant dans les véhicules ou les véhicules publics
    let brand = 'FCT';
    let model = 'Véhicule Certifié';
    let currentMileage = 0;
    let nextInspectionDate: string | undefined;
    let insuranceValidUntil: string | undefined;

    // 2. Recherche des interventions terminées dans Firestore
    const maintenanceCol = collection(firestore, 'maintenance');
    const q = query(maintenanceCol, where('licensePlate', '==', plateClean));
    const snap = await getDocs(q);

    const records: HealthServiceEntry[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        id: docSnap.id,
        recordNumber: data.recordNumber || docSnap.id,
        date: data.completionDate || data.startDate || '',
        mileage: data.mileageAtService || 0,
        type: data.type || 'PREVENTIVE',
        typeLabel:
          data.type === 'PREVENTIVE'
            ? 'Entretien Préventif & Vidange'
            : data.type === 'CORRECTIVE'
            ? 'Réparation Garage'
            : 'Contrôle Technique & Sécurité',
        description: data.description || 'Intervention générale',
        garageName: data.garageName || 'Garage FCT Douala',
        status: data.status || 'COMPLETED',
      });
      if (data.vehicleName) {
        const parts = data.vehicleName.split(' ');
        brand = parts[0] || brand;
        model = parts.slice(1).join(' ') || model;
      }
      if (data.mileageAtService && data.mileageAtService > currentMileage) {
        currentMileage = data.mileageAtService;
      }
    });

    // Tri par date décroissante
    records.sort((a, b) => b.date.localeCompare(a.date));

    if (records.length === 0) {
      return null;
    }

    return {
      licensePlate: plateClean,
      brand,
      model,
      currentMileage,
      lastServiceDate: records[0]?.date,
      nextInspectionDate,
      insuranceValidUntil,
      records,
    };
  } catch (err) {
    console.error('[FCT Health Passport] Erreur de récupération du carnet de santé :', err);
    throw new Error('Impossible de consulter le carnet de santé actuellement. Réessayez.');
  }
}
