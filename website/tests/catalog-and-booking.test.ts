import { describe, it, expect } from 'vitest';
import { INITIAL_VEHICLES, CERTIFIED_HEALTH_RECORDS, FCT_AGENCY_INFO } from '../src/data/defaultCatalog.ts';
import { formatXAF, formatDateFR } from '../src/utils/formatters.ts';

describe('FCT Automobile Website - Integrity & Business Rules', () => {
  it('contient une flotte de véhicules officiels avec tarifs FCFA cohérents', () => {
    expect(INITIAL_VEHICLES.length).toBeGreaterThanOrEqual(4);

    INITIAL_VEHICLES.forEach((v) => {
      expect(v.brand).toBeTruthy();
      expect(v.model).toBeTruthy();
      expect(v.rentalDailyRate).toBeGreaterThan(0);
      expect(v.securityDepositRate).toBeGreaterThan(0);
      expect(v.licensePlate).toMatch(/^LT-\d{4}-[A-Z]{2}$/);
    });
  });

  it('formate correctement les devises FCFA (XAF)', () => {
    expect(formatXAF(85000)).toBe('85\u202f000 FCFA');
    expect(formatXAF(180000)).toBe('180\u202f000 FCFA');
    expect(formatXAF(0)).toBe('0 FCFA');
  });

  it('formate les dates en français', () => {
    const formatted = formatDateFR('2026-09-15');
    expect(formatted).toContain('2026');
    expect(formatted.toLowerCase()).toContain('septembre');
  });

  it('fournit des enregistrements certifiés pour le Carnet de Santé Numérique', () => {
    const pradoHealth = CERTIFIED_HEALTH_RECORDS['LT-8841-CE'];
    expect(pradoHealth).toBeDefined();
    expect(pradoHealth.records.length).toBeGreaterThan(0);
    expect(pradoHealth.records[0].isCertifiedFCT).toBe(true);
    expect(pradoHealth.records[0].partsReplaced.length).toBeGreaterThan(0);
  });

  it('définit les coordonnées physiques officielles de l’agence FCT à Bonamoussadi', () => {
    expect(FCT_AGENCY_INFO.address).toContain('Bonamoussadi');
    expect(FCT_AGENCY_INFO.phone1).toContain('+237');
    expect(FCT_AGENCY_INFO.driverDailyRateXAF).toBe(15000);
  });
});
