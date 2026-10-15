/**
 * Utilitaire de partage de médias FCT Automobile Douala
 * Permet d'extraire la vraie photo du véhicule et de l'envoyer en premier sur WhatsApp (avec le texte en légende)
 */

export async function fetchVehicleImageFile(imageUrl: string, filename: string): Promise<File | null> {
  if (!imageUrl) return null;

  // 1. Essai de récupération directe par fetch
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const type = blob.type || 'image/jpeg';
      return new File([blob], filename, { type });
    }
  } catch (err) {
    console.info('[FCT Image Share] Fetch direct CORS non disponible, passage au rendu Canvas', err);
  }

  // 2. Fallback via élément Image + Canvas pour contourner les restrictions
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      return await new Promise<File | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 800;
            canvas.height = img.naturalHeight || 600;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(new File([blob], filename, { type: 'image/jpeg' }));
                } else {
                  resolve(null);
                }
              },
              'image/jpeg',
              0.92
            );
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = imageUrl;
      });
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Tente de copier l'image dans le presse-papier pour que l'utilisateur puisse la coller directement
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  if (!imageUrl || typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) return false;
    const blob = await res.blob();
    // Clipboard API requiert généralement image/png
    if (typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (e) {
    console.info('[FCT Image Share] Copie presse-papier image non supportée :', e);
  }
  return false;
}

/**
 * Déclenche le téléchargement direct de la photo pour WhatsApp Web
 */
export function downloadVehiclePhoto(imageUrl: string, filename: string): void {
  if (!imageUrl || typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
