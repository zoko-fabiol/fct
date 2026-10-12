import { describe, it, expect } from 'vitest';
import { translations } from '../src/services/i18n.ts';

describe('Internationalisation FCT - Parité Stricte FR / EN', () => {
  it('devrait posséder exactement les deux langues supportées "fr" et "en"', () => {
    expect(translations).toHaveProperty('fr');
    expect(translations).toHaveProperty('en');
  });

  const compareObjectsKeys = (frObj: any, enObj: any, path = '') => {
    const frKeys = Object.keys(frObj).sort();
    const enKeys = Object.keys(enObj).sort();

    expect(enKeys, `Différence de clés à ${path || 'racine'}`).toEqual(frKeys);

    for (const key of frKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const frVal = frObj[key];
      const enVal = enObj[key];

      if (typeof frVal === 'object' && frVal !== null) {
        expect(typeof enVal, `Le type de ${currentPath} doit être un objet en EN`).toBe('object');
        compareObjectsKeys(frVal, enVal, currentPath);
      } else {
        expect(typeof enVal, `Le type de ${currentPath} doit être string en EN`).toBe('string');
        expect(frVal.trim().length, `La clé FR ${currentPath} ne doit pas être vide`).toBeGreaterThan(0);
        expect(enVal.trim().length, `La clé EN ${currentPath} ne doit pas être vide`).toBeGreaterThan(0);
      }
    }
  };

  it('devrait avoir une parité stricte et aucune clé manquante ou vide entre FR et EN', () => {
    compareObjectsKeys(translations.fr, translations.en);
  });

  it('devrait avoir les traductions complètes pour le socle transverse (auth, lockScreen, securityModal, navbar, deleteModal)', () => {
    expect(translations.en.auth.submitLogin).toBe('Sign in to FCT Platform');
    expect(translations.fr.auth.submitLogin).toBe('Accéder à la Plateforme FCT');

    expect(translations.en.lockScreen.unlockDirect).toBe('Unlock Session');
    expect(translations.fr.lockScreen.unlockDirect).toBe('Déverrouiller la Session');

    expect(translations.en.securityModal.savePin).toBe('Save PIN Code');
    expect(translations.fr.securityModal.savePin).toBe('Enregistrer le Code PIN');

    expect(translations.en.navbar.logout).toBe('Secure Logout');
    expect(translations.fr.navbar.logout).toBe('Déconnexion Sécurisée');
  });
});
