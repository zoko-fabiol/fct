/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Générateur PDF vectoriel des factures
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Inspiré de CGA SPE (`officialPdfGenerator.js`) : le PDF est dessiné avec jsPDF +
 * jspdf-autotable (texte net et sélectionnable, pagination automatique, en-tête de
 * tableau répété). Aucune capture d'écran : pas de problème avec les couleurs
 * `oklch()` de Tailwind v4 que `html2canvas` ne sait pas lire.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocumentPrintData } from '../components/DocumentModal.tsx';
import { amountInWordsFCFA, buildPdfFileName, formatAmountPlain } from './invoiceFormat.ts';

export const FCT_COMPANY = {
  name: 'FRANCHISE CONSEILS TRADING (FCT)',
  tagline: 'Vente & Location Automobile - Gestion de Flotte - Douala',
  address: 'Carrefour Santa Barbara, Bonamoussadi, Douala, Cameroun',
  legal: 'RC/DLA/2020/B/1458 | NIU : M052014587963P | Tél : +237 699 45 88 12',
  agency: 'Agence FCT Bonamoussadi',
};

const NAVY: [number, number, number] = [15, 42, 74];
const EMERALD: [number, number, number] = [5, 150, 105];
const SLATE: [number, number, number] = [71, 85, 105];
const LIGHT: [number, number, number] = [248, 250, 252];
const BORDER: [number, number, number] = [226, 232, 240];

export interface InvoicePdfOptions {
  /** Image PNG (data URL) du QR code de vérification */
  qrDataUrl?: string;
  /** Image PNG / JPEG (data URL) du logo officiel FCT */
  logoDataUrl?: string;
}

/**
 * Construit le document jsPDF d'une facture / d'un document commercial FCT.
 */
export function buildInvoicePdf(data: DocumentPrintData, options: InvoicePdfOptions = {}): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  let y = M;

  // --- En-tête société ---------------------------------------------------
  if (options.logoDataUrl) {
    try {
      doc.addImage(options.logoDataUrl, 'PNG', M, y, 22, 14, undefined, 'FAST');
    } catch {
      doc.setFillColor(...NAVY);
      doc.roundedRect(M, y, 18, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('FCT', M + 9, y + 11.5, { align: 'center' });
    }
  } else {
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, 18, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('FCT', M + 9, y + 11.5, { align: 'center' });
  }

  doc.setTextColor(...NAVY);
  doc.setFontSize(12.5);
  doc.text(FCT_COMPANY.name, M + 22, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(FCT_COMPANY.tagline, M + 22, y + 9.5);
  doc.text(FCT_COMPANY.address, M + 22, y + 13.5);
  doc.setFontSize(7.5);
  doc.text(FCT_COMPANY.legal, M + 22, y + 17.5);

  // Bloc titre / numéro à droite
  const rightX = pageW - M;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const title = (data.title || 'DOCUMENT').toUpperCase();
  const titleW = doc.getTextWidth(title) + 6;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(rightX - titleW, y, titleW, 6.5, 1, 1, 'FD');
  doc.setTextColor(...NAVY);
  doc.text(title, rightX - titleW / 2, y + 4.4, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.docNumber, rightX, y + 12.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(`Date : ${data.date}`, rightX, y + 17, { align: 'right' });

  y += 22;
  doc.setDrawColor(...EMERALD);
  doc.setLineWidth(0.7);
  doc.line(M, y, pageW - M, y);
  y += 6;

  // --- Bloc client -------------------------------------------------------
  const clientLines = [
    data.customerAddress,
    data.customerPhone ? `Tél : ${data.customerPhone}` : undefined,
    data.customerNiu ? `NIU : ${data.customerNiu}` : undefined,
  ].filter(Boolean) as string[];
  const boxH = 12 + clientLines.length * 4;
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, pageW - 2 * M, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('CLIENT / DESTINATAIRE', M + 4, y + 5);
  doc.text("LIEU D'ÉMISSION & DEVISE", rightX - 4, y + 5, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(data.customerName || '-', M + 4, y + 10);
  doc.setFontSize(8.5);
  doc.text(FCT_COMPANY.agency, rightX - 4, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text('Devise : FCFA (XAF)', rightX - 4, y + 14, { align: 'right' });
  clientLines.forEach((line, i) => doc.text(line, M + 4, y + 14 + i * 4));
  y += boxH + 6;

  // --- Tableau des lignes (pagination automatique) ------------------------
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 18 },
    head: [['Désignation', 'Qté', 'Prix unitaire', 'Total (FCFA)']],
    body: data.items.map((it) => [
      it.description,
      String(it.qty),
      formatAmountPlain(it.unitPrice, false),
      formatAmountPlain(it.total, false),
    ]),
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: BORDER,
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 34, halign: 'right' },
      3: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
    },
  });
  y = ((doc as any).lastAutoTable?.finalY ?? y) + 6;

  // --- Totaux, montant en lettres, notes, signatures ----------------------
  const totEffective = data.total ?? data.totalAmountXAF ?? 0;
  const subTotEffective = data.subtotal ?? totEffective;
  const taxEffective = data.tax ?? 0;
  const totals: [string, string, boolean?][] = [['Sous-total', formatAmountPlain(subTotEffective)]];
  if (taxEffective > 0) totals.push(['TVA (19,25 %)', formatAmountPlain(taxEffective)]);
  if (data.depositAmount && data.depositAmount > 0) {
    totals.push(['Caution consignée', formatAmountPlain(data.depositAmount)]);
  }
  totals.push(['TOTAL NET', formatAmountPlain(totEffective), true]);

  const words = `Arrêté le présent document à la somme de : ${amountInWordsFCFA(totEffective)}.`;
  doc.setFontSize(8);
  const wordsLines = doc.splitTextToSize(words, pageW - 2 * M);
  const notesLines = data.notes ? doc.splitTextToSize(`Observations : ${data.notes}`, pageW - 2 * M - 6) : [];
  const blockH = totals.length * 6 + 6 + wordsLines.length * 4 + (notesLines.length ? notesLines.length * 4 + 8 : 0) + 42;
  if (y + blockH > pageH - 18) {
    doc.addPage();
    y = M;
  }

  const tx = pageW - M - 80;
  totals.forEach(([label, value, strong]) => {
    if (strong) {
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.6);
      doc.line(tx, y - 1, pageW - M, y - 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...NAVY);
      doc.text(`${label} :`, tx, y + 4);
      doc.setTextColor(4, 120, 87);
      doc.text(value, pageW - M, y + 4, { align: 'right' });
      y += 8;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...SLATE);
      doc.text(`${label} :`, tx, y + 3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(value, pageW - M, y + 3, { align: 'right' });
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.line(tx, y + 5, pageW - M, y + 5);
      y += 6;
    }
  });
  y += 3;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(wordsLines, M, y + 3);
  y += wordsLines.length * 4 + 3;

  if (notesLines.length) {
    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(M, y, pageW - 2 * M, notesLines.length * 4 + 4, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(notesLines, M + 3, y + 5);
    y += notesLines.length * 4 + 8;
  }

  // Signatures + QR
  y += 4;
  doc.setDrawColor(...BORDER);
  doc.line(M, y, pageW - M, y);
  y += 6;
  const colW = (pageW - 2 * M - 30) / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(data.signatureRole1 || 'Pour le Client (Bon pour accord)', M + colW / 2, y, { align: 'center' });
  doc.text(data.signatureRole2 || 'Pour FCT Automobile (Direction / Caissier)', M + colW * 1.5, y, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Signature & mention manuscrite', M + colW / 2, y + 22, { align: 'center' });
  doc.text('Cachet & signature certifiée', M + colW * 1.5, y + 22, { align: 'center' });

  if (options.qrDataUrl) {
    doc.addImage(options.qrDataUrl, 'PNG', pageW - M - 24, y - 3, 24, 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Vérification FCT', pageW - M - 12, y + 24, { align: 'center' });
  }

  // --- Pied de page sur chaque page --------------------------------------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(M, pageH - 12, pageW - M, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${FCT_COMPANY.name} - ${data.docNumber}`, M, pageH - 7.5);
    doc.text(`Page ${p} / ${pages}`, pageW - M, pageH - 7.5, { align: 'right' });
  }

  return doc;
}

/** Télécharge directement le PDF. */
export function downloadInvoicePdf(data: DocumentPrintData, options: InvoicePdfOptions = {}): void {
  buildInvoicePdf(data, options).save(buildPdfFileName(data.title, data.docNumber));
}

/** Retourne le PDF sous forme de Blob (pour l'archivage Cloudinary). */
export function getInvoicePdfBlob(data: DocumentPrintData, options: InvoicePdfOptions = {}): Blob {
  return buildInvoicePdf(data, options).output('blob');
}
