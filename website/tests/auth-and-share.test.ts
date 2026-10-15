import { describe, it, expect, vi } from 'vitest';
import {
  sendEmailVerificationPin,
  verifyEmailPin,
  sendPasswordReset,
} from '../src/services/authSecurityService.ts';
import {
  generateAffiliateUrl,
  generateShareCopyText,
  calculatePartnerCommission,
} from '../src/services/partnerService.ts';
import { Vehicle } from '../src/types/index.ts';

describe('FCT 2FA & Authentification Tests', () => {
  it('devrait générer un code PIN à 6 chiffres pour une adresse email valide', async () => {
    const res = await sendEmailVerificationPin('test.user@fct-automobile.cm');
    expect(res.success).toBe(true);
    expect(res.pin).toBeDefined();
    expect(res.pin).toMatch(/^\d{6}$/);
  });

  it('devrait refuser une adresse email invalide lors de la génération PIN', async () => {
    const res = await sendEmailVerificationPin('adresse-sans-arobase');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('devrait valider un code PIN exact avec le fallback en mémoire', async () => {
    const email = 'client.test@fct.cm';
    const gen = await sendEmailVerificationPin(email);
    expect(gen.pin).toBeDefined();

    const verification = await verifyEmailPin(email, gen.pin!, gen.pin);
    expect(verification.valid).toBe(true);
  });

  it('devrait rejeter un code PIN erroné ou d’une mauvaise longueur', async () => {
    const email = 'client.test@fct.cm';
    const badLength = await verifyEmailPin(email, '1234');
    expect(badLength.valid).toBe(false);
    expect(badLength.error).toContain('6 chiffres');

    const wrongPin = await verifyEmailPin(email, '999999', '123456');
    expect(wrongPin.valid).toBe(false);
  });

  it('devrait refuser une adresse email vide ou invalide pour la réinitialisation de mot de passe', async () => {
    const res = await sendPasswordReset('');
    expect(res.success).toBe(false);
    expect(res.message).toContain('valide');
  });
});

describe('FCT Partage Universel & Affiliation', () => {
  const dummyVehicle: Vehicle = {
    id: 'veh_prado_txl',
    brand: 'Toyota',
    model: 'Land Cruiser Prado TXL',
    year: 2023,
    category: 'SUV Prestige',
    transmission: 'AUTOMATIQUE',
    fuel: 'DIESEL',
    seats: 7,
    mileage: 24500,
    rentalDailyRate: 75000,
    securityDepositRate: 300000,
    salePrice: 42000000,
    isAvailable: true,
    isForRent: true,
    isForSale: true,
    photoUrls: ['https://storage.googleapis.com/fct-assets/prado-front.jpg'],
  };

  it('devrait générer une URL affiliée contenant le code partenaire et l’ID du véhicule', () => {
    const url = generateAffiliateUrl(dummyVehicle.id, 'FCT-CLA-55');
    expect(url).toContain('ref=FCT-CLA-55');
    expect(url).toContain(dummyVehicle.id);
  });

  it('devrait générer un texte de partage complet avec le tarif, le modèle et le lien', () => {
    const affUrl = generateAffiliateUrl(dummyVehicle.id, 'FCT-CLA-55');
    const textRent = generateShareCopyText(dummyVehicle, affUrl, true);
    expect(textRent).toContain('LOCATION VÉHICULE CERTIFIÉ');
    expect(textRent).toContain('Toyota Land Cruiser Prado TXL');
    expect(textRent).toContain('75\u202f000 FCFA / jour');
    expect(textRent).toContain(affUrl);

    const textSale = generateShareCopyText(dummyVehicle, affUrl, false);
    expect(textSale).toContain('VÉHICULE CERTIFIÉ À VENDRE');
    expect(textSale).toContain('42\u202f000\u202f000 FCFA');
  });

  it('devrait calculer correctement les commissions (5% location et 100k fixe vente)', () => {
    const rentalCommission = calculatePartnerCommission('RENTAL', 500000, 5);
    expect(rentalCommission).toBe(25000);

    const saleCommission = calculatePartnerCommission('SALE', 42000000);
    expect(saleCommission).toBe(100000);
  });
});
