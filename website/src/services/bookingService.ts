/**
 * @license
 * FCT Automobile - Service de Réservation en Ligne & Demandes d'Achat
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Les demandes sont déposées dans `web_bookings` / `web_leads` (statut PENDING / NEW)
 * et validées par le personnel FCT dans l'ERP. Aucune erreur n'est étouffée :
 * en cas d'échec, l'appelant reçoit l'exception et l'affiche à l'utilisateur.
 */

import { firestore, doc, setDoc, auth } from './firebase.ts';
import { PublicVehicle } from './vehicleService.ts';
import { calculateRentalTotal } from '../utils/currency.ts';
import {
  bookingFormSchema,
  purchaseFormSchema,
  firstError,
  BookingFormInput,
  PurchaseFormInput,
} from '../utils/validation.ts';

function newId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}_${Date.now()}_${random[0].toString(36)}${random[1].toString(36)}`;
}

export interface BookingReceipt {
  bookingId: string;
  estimatedTotalXAF: number;
  securityDepositXAF: number;
  days: number;
}

export async function createRentalBooking(
  vehicle: PublicVehicle,
  form: BookingFormInput
): Promise<BookingReceipt> {
  const parsed = bookingFormSchema.safeParse(form);
  if (!parsed.success) throw new Error(firstError(parsed.error));
  const data = parsed.data;

  if (!vehicle.isForRent || vehicle.status !== 'AVAILABLE') {
    throw new Error("Ce véhicule n'est plus disponible à la location.");
  }

  const calc = calculateRentalTotal(vehicle.rentalDailyRate, data.startDate, data.endDate, data.withDriver);
  const bookingId = newId('web');

  const payload: Record<string, unknown> = {
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.brand} ${vehicle.model}`,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    startDate: data.startDate,
    endDate: data.endDate,
    withDriver: data.withDriver,
    status: 'PENDING',
    source: 'WEBSITE',
    estimatedTotalXAF: Math.round(calc.grandTotal),
    createdAt: new Date().toISOString(),
  };
  if (data.notes) payload.notes = data.notes;
  if (auth.currentUser) payload.customerUid = auth.currentUser.uid;

  await setDoc(doc(firestore, 'web_bookings', bookingId), payload);

  return {
    bookingId,
    estimatedTotalXAF: Math.round(calc.grandTotal),
    securityDepositXAF: vehicle.securityDepositRate,
    days: calc.days,
  };
}

export async function submitPurchaseInquiry(
  vehicle: PublicVehicle,
  form: PurchaseFormInput
): Promise<{ leadId: string }> {
  const parsed = purchaseFormSchema.safeParse(form);
  if (!parsed.success) throw new Error(firstError(parsed.error));
  const data = parsed.data;

  if (!vehicle.isForSale || vehicle.status !== 'AVAILABLE') {
    throw new Error("Ce véhicule n'est plus disponible à la vente.");
  }

  const leadId = newId('weblead');
  const payload: Record<string, unknown> = {
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.brand} ${vehicle.model}`,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    interestType: 'PURCHASE',
    financingNeeded: data.financingNeeded,
    status: 'NEW',
    source: 'WEBSITE',
    createdAt: new Date().toISOString(),
  };
  if (data.notes) payload.notes = data.notes;
  if (auth.currentUser) payload.customerUid = auth.currentUser.uid;

  await setDoc(doc(firestore, 'web_leads', leadId), payload);
  return { leadId };
}
