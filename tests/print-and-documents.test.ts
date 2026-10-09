/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests d'Intégration Impression, Visualisation & Cloudinary
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatAmountPlain,
  numberToFrenchWords,
  amountInWordsFCFA,
  buildVerificationPayload,
  buildPdfFileName,
} from '../src/utils/invoiceFormat.ts';
import {
  validateUploadFile,
  getDocumentKind,
  isCloudinaryUrl,
  getPdfPageImageUrl,
  getDownloadUrl,
  sanitizeFileName,
} from '../src/services/cloudinaryService.ts';
import { buildInvoicePdf, getInvoicePdfBlob } from '../src/utils/invoicePdf.ts';
import { dbStore } from '../src/services/dbStore.ts';
import type { DocumentPrintData } from '../src/components/DocumentModal.tsx';

describe('Formatage des Factures & Documents FCT (invoiceFormat)', () => {
  it('formate les montants en FCFA avec des espaces normaux (sans U+202F)', () => {
    expect(formatAmountPlain(150000)).toBe('150 000 FCFA');
    expect(formatAmountPlain(0)).toBe('0 FCFA');
    expect(formatAmountPlain(25000000)).toBe('25 000 000 FCFA');
    expect(formatAmountPlain(150000, false)).toBe('150 000');
  });

  it('convertit les entiers en toutes lettres en français', () => {
    expect(numberToFrenchWords(0)).toBe('zéro');
    expect(numberToFrenchWords(1)).toBe('un');
    expect(numberToFrenchWords(21)).toBe('vingt et un');
    expect(numberToFrenchWords(80)).toBe('quatre-vingts');
    expect(numberToFrenchWords(100)).toBe('cent');
    expect(numberToFrenchWords(1000)).toBe('mille');
    expect(numberToFrenchWords(1250000)).toContain('un million');
    expect(amountInWordsFCFA(150000)).toMatch(/Cent cinquante mille francs CFA/i);
  });

  it('construit un payload de QR code complet et infalsifiable', () => {
    const payload = buildVerificationPayload({
      docNumber: 'FAC-2026-0106',
      date: '2026-10-09',
      total: 350000,
      customerName: 'SOCTRAN SA',
    });
    expect(payload).toContain('FCT-AUTOMOBILE-DOUALA');
    expect(payload).toContain('DOC:FAC-2026-0106');
    expect(payload).toContain('SOCTRAN SA');
    expect(payload).toContain('TOTAL:350000 XAF');
  });

  it('génère un nom de fichier PDF sans caractères spéciaux ni accents', () => {
    const fileName = buildPdfFileName('Facture Règlements & Caution', 'FAC-2026/01');
    expect(fileName).toMatch(/^Facture_Reglements_Caution_FAC-2026_01\.pdf$/);
    expect(fileName.endsWith('.pdf')).toBe(true);
  });
});

describe('Sécurité & Transformations Cloudinary (cloudinaryService)', () => {
  it('valide les extensions autorisées et rejette les fichiers dangereux', () => {
    expect(validateUploadFile({ name: 'facture.pdf', size: 1024 })).toBeNull();
    expect(validateUploadFile({ name: 'photo_vehicule.jpg', size: 1024 })).toBeNull();
    expect(validateUploadFile({ name: 'bilan_excel.xlsx', size: 1024 })).toBeNull();

    expect(validateUploadFile({ name: 'script.exe', size: 1024 })).not.toBeNull();
    expect(validateUploadFile({ name: 'malware.js', size: 1024 })).not.toBeNull();
    expect(validateUploadFile({ name: 'page.html', size: 1024 })).not.toBeNull();
  });

  it('rejette les fichiers dépassant 25 Mo', () => {
    const error = validateUploadFile({ name: 'gros_fichier.pdf', size: 26 * 1024 * 1024 });
    expect(error).toContain('dépasse la limite de 25 Mo');
  });

  it('nettoie les noms de fichiers', () => {
    expect(sanitizeFileName('Carte Grise Électrique #1.pdf')).toBe('Carte_Grise_Electrique__1.pdf');
  });

  it('détecte le type de document pour le visualiseur universel', () => {
    expect(getDocumentKind('https://res.cloudinary.com/c58pcgcp/image/upload/v1/test.pdf')).toBe('PDF');
    expect(getDocumentKind('https://res.cloudinary.com/c58pcgcp/image/upload/v1/car.png')).toBe('IMAGE');
    expect(getDocumentKind('https://res.cloudinary.com/c58pcgcp/image/upload/v1/contrat.docx')).toBe('OFFICE');
    expect(getDocumentKind('https://res.cloudinary.com/c58pcgcp/image/upload/v1/tableur.xlsx')).toBe('OFFICE');
  });

  it('construit des URL de pages PDF et de téléchargement Cloudinary', () => {
    const rawPdf = 'https://res.cloudinary.com/c58pcgcp/image/upload/v1791555435/fct_automobile/test.pdf';
    expect(isCloudinaryUrl(rawPdf)).toBe(true);

    const page1Thumb = getPdfPageImageUrl(rawPdf, 1, 600);
    expect(page1Thumb).toContain('pg_1');
    expect(page1Thumb.endsWith('.jpg')).toBe(true);

    const downloadLink = getDownloadUrl(rawPdf, 'Facture FCT');
    expect(downloadLink).toContain('fl_attachment');
  });
});

describe('Génération de PDF Vectoriel des Factures (invoicePdf)', () => {
  const sampleInvoice: DocumentPrintData = {
    title: 'Facture Commerciale',
    docNumber: 'FAC-2026-0042',
    date: '2026-10-09',
    customerName: 'ENTREPRISE CAMEROUNAISE DE BTP',
    customerAddress: 'Akwa, Boulevard de la Liberté, Douala',
    customerPhone: '+237 699 00 11 22',
    customerNiu: 'M012015243890X',
    items: [
      {
        description: 'Location Toyota Prado TX (5 jours avec chauffeur)',
        qty: 1,
        unitPrice: 400000,
        total: 400000,
      },
      {
        description: 'Carburant forfaitaire transfert aéroport Douala',
        qty: 1,
        unitPrice: 50000,
        total: 50000,
      },
    ],
    subtotal: 450000,
    tax: 86625,
    total: 536625,
    depositAmount: 150000,
    notes: 'Règlement par virement bancaire sous 15 jours.',
  };

  it('génère un objet jsPDF valide avec pagination', () => {
    const doc = buildInvoicePdf(sampleInvoice);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('génère un Blob PDF pour archivage direct sur Cloudinary', () => {
    const blob = getInvoicePdfBlob(sampleInvoice);
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe('application/pdf');
  });
});

describe('Persistance Documentaire dans DatabaseStore (dbStore)', () => {
  it('ajoute et archive un document dans le store FCT', () => {
    const initialCount = dbStore.getState().documents.length;
    const added = dbStore.addDocument({
      title: 'Facture Test Automatisée',
      category: 'FACTURE_OFFICIELLE',
      fileUrl: 'https://res.cloudinary.com/c58pcgcp/image/upload/v1/facture_test.pdf',
      relatedEntityName: 'Test Suite',
      relatedModule: 'billing',
    });

    expect(added.id).toMatch(/^doc_/);
    expect(dbStore.getState().documents.length).toBe(initialCount + 1);
    expect(dbStore.getState().documents[0].id).toBe(added.id);

    // Suppression
    const deleted = dbStore.deleteDocument(added.id);
    expect(deleted).toBe(true);
    expect(dbStore.getState().documents.length).toBe(initialCount);
  });
});
