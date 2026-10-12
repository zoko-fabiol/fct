/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Moteur d'Exportation Excel Stylisé Haute Définition (.xlsx)
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Utilise xlsx-js-style pour générer des fichiers Excel aux normes visuelles de FCT :
 * - En-tête officiel Bleu Nuit (#0F2A4A) avec texte blanc
 * - Alternance de lignes zébrées (#FFFFFF / #F8FAFC)
 * - Bordures fines professionnelles
 * - Formatage monétaire natif Excel (#,##0 "FCFA")
 * - Totaux surlignés en vert émeraude avec double soulignement comptable
 */

import XLSX from 'xlsx-js-style';
import type { DocumentPrintData } from '../components/DocumentModal.tsx';

export interface ExcelColumn<T = any> {
  header: string;
  key: keyof T | string;
  formatter?: (item: T) => string | number;
  width?: number;
  align?: 'left' | 'center' | 'right';
  isCurrency?: boolean;
}

export interface ExportCollectionOptions<T = any> {
  data: T[];
  columns: ExcelColumn<T>[];
  filename?: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
}

// Palette graphique FCT
const COLOR_BRAND_DARK = '0F2A4A';      // Bleu Marine Institutionnel FCT
const COLOR_BRAND_BLUE = '1E3A8A';      // Bleu Nuit Tableau
const COLOR_EMERALD_BG = 'ECFDF5';      // Fond vert succès
const COLOR_EMERALD_TXT = '065F46';     // Texte vert succès
const COLOR_BORDER = 'E2E8F0';          // Gris bordure fine
const COLOR_ZEBRA = 'F8FAFC';           // Gris alterné
const COLOR_WHITE = 'FFFFFF';           // Blanc pur

const thinBorder = {
  top: { style: 'thin', color: { rgb: COLOR_BORDER } },
  bottom: { style: 'thin', color: { rgb: COLOR_BORDER } },
  left: { style: 'thin', color: { rgb: COLOR_BORDER } },
  right: { style: 'thin', color: { rgb: COLOR_BORDER } },
};

/**
 * Exporte une collection d'objets vers un fichier Excel (.xlsx) stylisé aux couleurs de FCT
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
  let title: string;
  let subtitle: string;

  if (Array.isArray(dataOrOptions)) {
    data = dataOrOptions;
    columns = columnsArg || [];
    fileName = fileNameArg || 'FCT_Export';
    sheetName = sheetNameArg;
    title = 'FCT AUTOMOBILE DOUALA — RAPPORT D\'EXPLOITATION';
    subtitle = `Généré le ${new Date().toLocaleDateString('fr-FR')} • ${data.length} enregistrement(s)`;
  } else {
    data = dataOrOptions.data || [];
    columns = dataOrOptions.columns || [];
    fileName = dataOrOptions.filename || 'FCT_Export';
    sheetName = dataOrOptions.sheetName || 'FCT Automobile';
    title = dataOrOptions.title || 'FCT AUTOMOBILE DOUALA — RAPPORT D\'EXPLOITATION';
    subtitle = dataOrOptions.subtitle || `Généré le ${new Date().toLocaleDateString('fr-FR')} • ${data.length} enregistrement(s)`;
  }

  const wb = XLSX.utils.book_new();

  // 1. Lignes d'en-tête de marque FCT
  const rowsAOA: any[][] = [
    [title],
    ['FRANCHISE CONSEILS TRADING (FCT) — Bonamoussadi, Carrefour Santa Barbara, Douala Cameroun'],
    [subtitle],
    [], // Ligne vide
    columns.map((c) => c.header),
  ];

  // 2. Lignes de données
  data.forEach((item) => {
    const rowVals = columns.map((col) => {
      if (col.formatter) {
        return col.formatter(item);
      }
      const val = (item as any)[col.key];
      return val !== undefined && val !== null ? val : '';
    });
    rowsAOA.push(rowVals);
  });

  // 3. Pied de page
  rowsAOA.push([]);
  rowsAOA.push([`Document certifié conforme FCT Automobile • Total de ${data.length} ligne(s) exportée(s)`]);

  // Conversion en feuille Excel
  const ws = XLSX.utils.aoa_to_sheet(rowsAOA);

  // 4. Styles des cellules

  // Titre principal (Ligne 0)
  const colCount = Math.max(columns.length, 5);
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
    ws[cellRef].s = {
      font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: COLOR_WHITE } },
      fill: { fgColor: { rgb: COLOR_BRAND_DARK } },
      alignment: { horizontal: c === 0 ? 'left' : 'center', vertical: 'center' },
    };
  }

  // Sous-titre Agence (Ligne 1)
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
    ws[cellRef].s = {
      font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: '93C5FD' } },
      fill: { fgColor: { rgb: COLOR_BRAND_DARK } },
      alignment: { horizontal: c === 0 ? 'left' : 'center', vertical: 'center' },
    };
  }

  // Sous-titre date/contexte (Ligne 2)
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
    ws[cellRef].s = {
      font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: 'E2E8F0' } },
      fill: { fgColor: { rgb: COLOR_BRAND_DARK } },
      alignment: { horizontal: c === 0 ? 'left' : 'center', vertical: 'center' },
    };
  }

  // En-têtes de colonnes (Ligne 4)
  const headerRowIdx = 4;
  columns.forEach((col, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: COLOR_WHITE } },
        fill: { fgColor: { rgb: COLOR_BRAND_BLUE } },
        border: {
          top: { style: 'medium', color: { rgb: COLOR_BRAND_DARK } },
          bottom: { style: 'medium', color: { rgb: COLOR_BRAND_DARK } },
          left: { style: 'thin', color: { rgb: '3B82F6' } },
          right: { style: 'thin', color: { rgb: '3B82F6' } },
        },
        alignment: {
          horizontal: col.align || (col.isCurrency || typeof (data[0] as any)?.[col.key] === 'number' ? 'right' : 'center'),
          vertical: 'center',
          wrapText: true,
        },
      };
    }
  });

  // Lignes de données (Ligne 5 à 5 + data.length - 1)
  data.forEach((_, itemIdx) => {
    const rowIdx = headerRowIdx + 1 + itemIdx;
    const isEven = itemIdx % 2 === 0;
    const bgRgb = isEven ? COLOR_WHITE : COLOR_ZEBRA;

    columns.forEach((col, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const cell = ws[cellRef];
      if (cell) {
        const isNum = typeof cell.v === 'number';
        const isCur = col.isCurrency || (typeof cell.v === 'number' && /amount|rate|price|total|deposit|solde|cost|xaf/i.test(String(col.key)));

        cell.s = {
          font: { name: 'Segoe UI', sz: 9, color: { rgb: '1E293B' }, bold: isCur },
          fill: { fgColor: { rgb: bgRgb } },
          border: thinBorder,
          alignment: {
            horizontal: col.align || (isNum ? 'right' : 'left'),
            vertical: 'center',
          },
          numFmt: isCur ? '#,##0 "FCFA"' : isNum ? '#,##0' : undefined,
        };
      }
    });
  });

  // 5. Largeurs de colonnes optimisées
  ws['!cols'] = columns.map((col, idx) => {
    if (col.width) return { wch: col.width };
    const maxLen = data.reduce((max, item) => {
      const val = col.formatter ? String(col.formatter(item)) : String((item as any)[col.key] || '');
      return Math.max(max, val.length);
    }, col.header.length);
    return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
  });

  // 6. Hauteur des lignes
  ws['!rows'] = [
    { hpt: 26 }, // Titre 1
    { hpt: 16 }, // Agence
    { hpt: 18 }, // Sous-titre
    { hpt: 10 }, // Espace
    { hpt: 24 }, // En-têtes colonnes
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const safeFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, safeFileName);
}

/**
 * Exporte un contrat de location ou une facture au format Excel A4 professionnel et stylisé
 */
export function exportDocumentToExcel(docData: DocumentPrintData): void {
  const wb = XLSX.utils.book_new();

  // Tableau de contenu brut
  const aoa: any[][] = [
    ['FRANCHISE CONSEILS TRADING (FCT) AUTOMOBILE DOUALA', '', '', '', ''],
    ['Carrefour Santa Barbara, Bonamoussadi, Douala - Cameroun', '', '', '', ''],
    ['RC/DLA/2020/B/1458 | NIU : M052014587963P | Tél : +237 699 45 88 12', '', '', '', ''],
    [],
    [`DOCUMENT OFFICIEL : ${docData.title.toUpperCase()}`, '', '', '', ''],
    [`N° : ${docData.docNumber}`, '', '', `DATE : ${docData.date}`, ''],
    [],
    ['DESTINATAIRE / CLIENT :', '', '', 'LIEU D\'ÉMISSION :', ''],
    [docData.customerName, '', '', 'Agence FCT Bonamoussadi', ''],
    [docData.customerAddress || 'Douala, Cameroun', '', '', 'Devise : FCFA (XAF)', ''],
    [`Tél : ${docData.customerPhone || 'N/A'}${docData.customerNiu ? ` | NIU : ${docData.customerNiu}` : ''}`, '', '', '', ''],
    [],
    ['N°', 'Désignation de la prestation', 'Qté', 'Prix unitaire (FCFA)', 'Total (FCFA)'],
  ];

  const tableStartRow = 12;

  // Lignes de prestations
  docData.items.forEach((it, idx) => {
    aoa.push([
      idx + 1,
      it.description,
      it.qty,
      it.unitPrice,
      it.total,
    ]);
  });

  const subtotalRowIdx = aoa.length;
  aoa.push(['', '', '', 'Sous-total :', docData.subtotal]);

  if (docData.tax && docData.tax > 0) {
    aoa.push(['', '', '', 'TVA (19,25%) :', docData.tax]);
  }

  if (docData.depositAmount && docData.depositAmount > 0) {
    aoa.push(['', '', '', 'Caution consignée :', docData.depositAmount]);
  }

  const totalRowIdx = aoa.length;
  aoa.push(['', '', '', 'TOTAL NET (FCFA) :', docData.total]);

  // Observations & Signatures
  aoa.push([]);
  aoa.push(['OBSERVATIONS & MENTIONS LÉGALES :']);
  aoa.push([docData.notes || 'Caution consignée obligatoire. Le locataire s\'engage à respecter les conditions d\'utilisation du réseau FCT.']);
  aoa.push([]);
  aoa.push(['Pour le Client (Bon pour accord)', '', '', 'Pour FCT Automobile (Direction / Caissier)', '']);
  aoa.push(['Mention manuscrite "Lu et approuvé"', '', '', 'Cachet & signature certifiée', '']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Fusion de cellules pour les bandeaux
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
    { s: { r: 5, c: 3 }, e: { r: 5, c: 4 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 2 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 2 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 2 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } },
    { s: { r: 7, c: 3 }, e: { r: 7, c: 4 } },
    { s: { r: 8, c: 3 }, e: { r: 8, c: 4 } },
    { s: { r: 9, c: 3 }, e: { r: 9, c: 4 } },
  ];

  // Styling du header FCT
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c <= 4; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = {
        fill: { fgColor: { rgb: COLOR_BRAND_DARK } },
        font: {
          name: 'Segoe UI',
          sz: r === 0 ? 13 : 9,
          bold: r === 0,
          color: { rgb: r === 0 ? COLOR_WHITE : '93C5FD' },
        },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  // Type document (Ligne 4)
  for (let c = 0; c <= 4; c++) {
    const ref = XLSX.utils.encode_cell({ r: 4, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = {
      fill: { fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: COLOR_BRAND_DARK } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { bottom: { style: 'medium', color: { rgb: '059669' } } },
    };
  }

  // En-têtes du tableau (tableStartRow)
  for (let c = 0; c <= 4; c++) {
    const ref = XLSX.utils.encode_cell({ r: tableStartRow, c });
    if (ws[ref]) {
      ws[ref].s = {
        fill: { fgColor: { rgb: COLOR_BRAND_BLUE } },
        font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: COLOR_WHITE } },
        alignment: { horizontal: c === 0 ? 'center' : c >= 3 ? 'right' : 'left', vertical: 'center' },
        border: thinBorder,
      };
    }
  }

  // Lignes du tableau d'articles
  docData.items.forEach((_, idx) => {
    const r = tableStartRow + 1 + idx;
    const isEven = idx % 2 === 0;
    const bgRgb = isEven ? COLOR_WHITE : COLOR_ZEBRA;

    for (let c = 0; c <= 4; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (cell) {
        cell.s = {
          fill: { fgColor: { rgb: bgRgb } },
          font: { name: 'Segoe UI', sz: 9, color: { rgb: '1E293B' }, bold: c >= 3 },
          alignment: { horizontal: c === 0 ? 'center' : c >= 3 ? 'right' : 'left', vertical: 'center' },
          border: thinBorder,
          numFmt: c >= 3 ? '#,##0 "FCFA"' : c === 2 ? '#,##0' : undefined,
        };
      }
    }
  });

  // Total Net surligné
  for (let c = 3; c <= 4; c++) {
    const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c });
    if (ws[ref]) {
      ws[ref].s = {
        fill: { fgColor: { rgb: COLOR_EMERALD_BG } },
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: COLOR_EMERALD_TXT } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '059669' } },
          bottom: { style: 'double', color: { rgb: '059669' } },
        },
        numFmt: c === 4 ? '#,##0 "FCFA"' : undefined,
      };
    }
  }

  // Largeurs colonnes
  ws['!cols'] = [
    { wch: 6 },
    { wch: 48 },
    { wch: 10 },
    { wch: 22 },
    { wch: 24 },
  ];

  const cleanDocNum = docData.docNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, 'Facture FCT');
  XLSX.writeFile(wb, `FCT_${cleanDocNum}.xlsx`);
}
