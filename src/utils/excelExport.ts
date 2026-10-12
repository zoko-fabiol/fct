/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Moteur d'Exportation Excel Professionnel (.xlsx)
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Remplace tous les exports CSV bruts par de véritables classeurs Excel stylisés
 * avec colonnes auto-ajustées, en-têtes corporatifs et formatage monétaire XAF.
 */

import * as XLSX from 'xlsx';
import type { DocumentPrintData } from '../components/DocumentModal.tsx';
import { formatAmountPlain } from './invoiceFormat.ts';

export interface ExcelColumn<T = any> {
  header: string;
  key: keyof T | string;
  formatter?: (item: T) => string | number;
  width?: number;
}

export interface ExportCollectionOptions<T = any> {
  data: T[];
  columns: ExcelColumn<T>[];
  filename?: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Exporte une collection d'objets vers un fichier Excel (.xlsx) stylisé
 * Supporte soit un objet de configuration unique, soit des arguments positionnels.
 */
export function exportCollectionToExcel<T>(
  dataOrOptions: T[] | ExportCollectionOptions<T>,
  columnsArg?: ExcelColumn<T>[],
  fileNameArg?: string,
  sheetNameArg = 'FCT Automobile'
): void {
  let data: T[];
  let columns: ExcelColumn<T>[];
  let fileName: string;
  let sheetName: string;

  if (Array.isArray(dataOrOptions)) {
    data = dataOrOptions;
    columns = columnsArg || [];
    fileName = fileNameArg || 'FCT_Export';
    sheetName = sheetNameArg;
  } else {
    data = dataOrOptions.data || [];
    columns = dataOrOptions.columns || [];
    fileName = dataOrOptions.filename || 'FCT_Export';
    sheetName = dataOrOptions.sheetName || 'FCT Automobile';
  }

  // 1. Préparation des lignes de données
  const rows = data.map((item) => {
    const row: Record<string, string | number> = {};
    columns.forEach((col) => {
      if (col.formatter) {
        row[col.header] = col.formatter(item);
      } else {
        const val = (item as any)[col.key];
        row[col.header] = val !== undefined && val !== null ? val : '';
      }
    });
    return row;
  });

  // 2. Création de la feuille de calcul
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 3. Calcul automatique des largeurs de colonnes
  const colWidths = columns.map((col) => {
    if (col.width) return { wch: col.width };
    const maxDataLen = data.reduce((max, item) => {
      const val = col.formatter ? String(col.formatter(item)) : String((item as any)[col.key] || '');
      return Math.max(max, val.length);
    }, col.header.length);
    return { wch: Math.min(Math.max(maxDataLen + 3, 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  // 4. Création du classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 5. Téléchargement du fichier .xlsx
  const safeFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, safeFileName);
}

/**
 * Exporte un contrat de location ou une facture au format Excel A4 professionnel
 */
export function exportDocumentToExcel(docData: DocumentPrintData): void {
  const wb = XLSX.utils.book_new();

  // En-tête institutionnel
  const headerRows = [
    ['FRANCHISE CONSEILS TRADING (FCT) AUTOMOBILE DOUALA'],
    ['Carrefour Santa Barbara, Bonamoussadi, Douala - Cameroun'],
    ['RC/DLA/2020/B/1458 | NIU : M052014587963P | Tél : +237 699 45 88 12'],
    [],
    [`DOCUMENT OFFICIEL : ${docData.title.toUpperCase()}`],
    [`N° DOCUMENT : ${docData.docNumber}`, `DATE : ${docData.date}`],
    [],
    ['INFORMATIONS CLIENT / DESTINATAIRE :'],
    ['Client / Société :', docData.customerName],
    ['Adresse :', docData.customerAddress || 'Douala'],
    ['Téléphone :', docData.customerPhone || 'N/A'],
    ['NIU Client :', docData.customerNiu || 'N/A'],
    [],
    ['DÉSIGNATION & LIGNES DE FACTURATION :'],
  ];

  // Tableau des lignes de prestations
  const tableHeaders = ['N°', 'Désignation de la prestation', 'Quantité', 'Prix Unitaire (FCFA)', 'Total (FCFA)'];
  const tableRows = docData.items.map((it, idx) => [
    idx + 1,
    it.description,
    it.qty,
    it.unitPrice,
    it.total,
  ]);

  // Totaux financiers
  const totalRows = [
    [],
    ['', '', '', 'SOUS-TOTAL :', docData.subtotal],
  ];

  if (docData.tax && docData.tax > 0) {
    totalRows.push(['', '', '', 'TVA (19.25%) :', docData.tax]);
  }

  if (docData.depositAmount && docData.depositAmount > 0) {
    totalRows.push(['', '', '', 'CAUTION CONSIGNÉE :', docData.depositAmount]);
  }

  totalRows.push(['', '', '', 'TOTAL NET À PAYER (FCFA) :', docData.total]);

  // Notes et conditions
  const footerRows = [
    [],
    ['OBSERVATIONS & MENTIONS LÉGALES :'],
    [docData.notes || 'Conditions générales de location FCT Douala applicables.'],
    [],
    ['Arrêté le présent document à la somme conforme.'],
    ['Cachet & Signature Direction FCT Automobile Douala'],
  ];

  const allSheetData = [
    ...headerRows,
    tableHeaders,
    ...tableRows,
    ...totalRows,
    ...footerRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allSheetData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 12 },
    { wch: 22 },
    { wch: 22 },
  ];

  const cleanDocNum = docData.docNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, 'Document FCT');
  XLSX.writeFile(wb, `FCT_${cleanDocNum}.xlsx`);
}
