/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service Natif de Fichiers & Partage Mobile (PDF & Excel)
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Détecte intelligemment l'environnement d'exécution (Web Desktop vs APK Android Natif) :
 * - Sur Android : écrit le fichier temporaire et ouvre la feuille de partage native
 *   (Lecteur PDF, Impression sans fil Wi-Fi/Bluetooth, WhatsApp, Gmail, Drive).
 * - Sur Navigateur : utilise les téléchargements standards du navigateur.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Vérifie si l'application s'exécute dans l'APK natif Android */
export function isNativeMobile(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Sauvegarde et ouvre la feuille de partage pour un fichier PDF sur Android,
 * ou déclenche le téléchargement direct sur navigateur.
 */
export async function exportOrSharePdf(
  fileName: string,
  base64Data: string,
  title: string = 'Document FCT Automobile'
): Promise<void> {
  if (!isNativeMobile()) {
    // Navigateur standard : téléchargement via Blob URL
    const byteCharacters = atob(base64Data.replace(/^data:application\/pdf;filename=[^;]+;base64,|^data:application\/pdf;base64,/, ''));
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    return;
  }

  try {
    // Nettoyage de l'éventuel préfixe Data URI
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;filename=[^;]+;base64,|^data:application\/pdf;base64,/, '');

    // Écriture du fichier dans le cache de l'application
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: cleanBase64,
      directory: Directory.Cache,
    });

    // Ouverture immédiate de la feuille de partage Android
    await Share.share({
      title,
      text: `Document FCT Automobile — ${fileName}`,
      url: savedFile.uri,
      dialogTitle: 'Imprimer ou partager le document FCT',
    });
  } catch (error) {
    console.error('[mobileFileService] Erreur partage PDF natif:', error);
    // Secours : alerte visuelle si le partage est annulé ou indisponible
  }
}

/**
 * Sauvegarde et ouvre la feuille de partage pour un classeur Excel sur Android,
 * ou déclenche le téléchargement direct sur navigateur.
 */
export async function exportOrShareExcel(
  fileName: string,
  base64Data: string,
  title: string = 'Export Excel FCT Automobile'
): Promise<void> {
  if (!isNativeMobile()) {
    return;
  }

  try {
    const cleanBase64 = base64Data.replace(/^data:application\/[^;]+;base64,/, '');

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: cleanBase64,
      directory: Directory.Cache,
    });

    await Share.share({
      title,
      text: `Rapport Excel FCT Automobile — ${fileName}`,
      url: savedFile.uri,
      dialogTitle: 'Ouvrir ou partager le fichier Excel',
    });
  } catch (error) {
    console.error('[mobileFileService] Erreur partage Excel natif:', error);
  }
}
