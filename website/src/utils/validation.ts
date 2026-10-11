/**
 * @license
 * FCT Automobile - Validation des formulaires publics (Zod)
 * Doit rester strictement alignée avec les règles Firestore (web_bookings / web_leads).
 */

import { z } from 'zod';

// Numéro camerounais ou international : 8 à 20 chiffres/espaces, + optionnel
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{8,20}$/, 'Numéro de téléphone invalide (ex: +237 6 90 00 00 00)');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, 'Adresse e-mail trop longue')
  .regex(/^[^@ ]+@[^@ ]+\.[^@ ]+$/, 'Adresse e-mail invalide');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Veuillez saisir votre nom complet')
  .max(120, 'Nom trop long');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide');

export const bookingFormSchema = z
  .object({
    customerName: nameSchema,
    customerPhone: phoneSchema,
    customerEmail: emailSchema,
    startDate: isoDate,
    endDate: isoDate,
    withDriver: z.boolean(),
    notes: z.string().trim().max(500, 'Message limité à 500 caractères').optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'La date de retour doit être postérieure ou égale à la date de départ',
    path: ['endDate'],
  });

export type BookingFormInput = z.infer<typeof bookingFormSchema>;

export const purchaseFormSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  financingNeeded: z.boolean(),
  notes: z.string().trim().max(500, 'Message limité à 500 caractères').optional(),
});

export type PurchaseFormInput = z.infer<typeof purchaseFormSchema>;

/** Retourne le premier message d'erreur lisible d'un résultat Zod. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Formulaire invalide';
}
