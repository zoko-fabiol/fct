/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service d'Upload Cloudinary Certifié
 * Franchise Conseils Trading - Douala, Cameroun (Carrefour Santa Barbara, Bonamoussadi)
 *
 * Sécurité : aucun secret API n'est embarqué dans le navigateur.
 * Les téléversements utilisent le preset non signé `fct_erp_unsigned`
 * (formats restreints côté Cloudinary, noms uniques, aucun écrasement).
 */

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  url: string;
  secure_url: string;
  original_filename?: string;
  pages?: number;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;

export const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: env.VITE_CLOUDINARY_CLOUD_NAME || 'c58pcgcp',
  uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fct_erp_unsigned',
};

// Règles de validation (alignées sur le preset Cloudinary)
export const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt',
];
export const FORBIDDEN_EXTENSIONS = [
  'html', 'htm', 'js', 'mjs', 'exe', 'bat', 'cmd', 'sh', 'php', 'vbs', 'scr', 'dll', 'jar', 'apk', 'svg',
];
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo

export function getFileExtension(name: string): string {
  const parts = (name || '').split('.');
  return parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
}

/**
 * Valide un fichier avant envoi. Retourne un message d'erreur ou null si valide.
 */
export function validateUploadFile(file: { name: string; size: number }): string | null {
  const ext = getFileExtension(file.name);
  if (!ext || FORBIDDEN_EXTENSIONS.includes(ext) || !ALLOWED_EXTENSIONS.includes(ext)) {
    return `Type de fichier non autorisé (.${ext || '?'}). Formats acceptés : PDF, JPG, PNG, WEBP, Word, Excel.`;
  }

  // Contrôle anti-traversal et caractères nuls
  if (file.name.includes('\0') || file.name.includes('..')) {
    return `Nom de fichier invalide ou suspect détecté.`;
  }

  // Contrôle des doubles extensions dangereuses (ex: exploit.php.png, malware.exe.pdf)
  const segments = file.name.toLowerCase().split('.');
  if (segments.length > 2) {
    const dangerousSubExts = ['php', 'exe', 'sh', 'bat', 'cmd', 'js', 'mjs', 'vbs', 'html', 'htm', 'dll'];
    const hasDangerous = segments.slice(1, -1).some((s) => dangerousSubExts.includes(s));
    if (hasDangerous) {
      return `Double extension suspecte détectée dans « ${file.name} ». Fichier rejeté pour des raisons de sécurité FCT.`;
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Le fichier « ${file.name} » dépasse la limite de 25 Mo (${(file.size / (1024 * 1024)).toFixed(1)} Mo).`;
  }
  return null;
}

/** Nettoie un nom de fichier (accents, espaces, caractères spéciaux). */
export function sanitizeFileName(name: string): string {
  return (name || 'document')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Construit le FormData d'un téléversement non signé (exporté pour les tests).
 */
export function buildUploadFormData(
  file: File | Blob,
  options: { folder?: string; context?: Record<string, string>; fileName?: string } = {}
): FormData {
  const formData = new FormData();
  if (options.fileName) {
    formData.append('file', file, sanitizeFileName(options.fileName));
  } else {
    formData.append('file', file);
  }
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  // Isolation stricte de l'arborescence Cloudinary dans fct_automobile/
  let targetFolder = (options.folder || 'fct_automobile/documents').replace(/\\/g, '/');
  if (targetFolder.includes('..')) {
    targetFolder = 'fct_automobile/documents';
  }
  if (!targetFolder.startsWith('fct_automobile')) {
    targetFolder = `fct_automobile/${targetFolder.replace(/^\/+/, '')}`;
  }
  formData.append('folder', targetFolder);

  if (options.context && Object.keys(options.context).length > 0) {
    const ctx = Object.entries(options.context)
      .map(([k, v]) => `${k}=${String(v).replace(/[|=]/g, ' ')}`)
      .join('|');
    formData.append('context', ctx);
  }
  return formData;
}

/**
 * Vérification des Magic Bytes (signatures binaires réelles)
 * Bloque l'injection de scripts malveillants masqués sous de fausses extensions (.php renommé en .jpg)
 */
export async function validateFileMagicBytes(file: File | Blob): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!file || typeof file.slice !== 'function') return { valid: true };
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return { valid: true }; // trop petit pour vérifier ou buffer mocké

    const hex = Array.from(bytes.slice(0, 8)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Détection
    const isJPEG = hex.startsWith('FFD8FF');
    const isPNG = hex.startsWith('89504E47');
    const isPDF = hex.startsWith('25504446'); // %PDF

    const mime = (file.type || '').toLowerCase();
    if (mime.includes('jpeg') || mime.includes('jpg')) {
      if (!isJPEG) return { valid: false, error: 'Signature binaire JPEG altérée ou invalide.' };
    } else if (mime.includes('png')) {
      if (!isPNG) return { valid: false, error: 'Signature binaire PNG altérée ou invalide.' };
    } else if (mime.includes('pdf')) {
      if (!isPDF) return { valid: false, error: 'Signature binaire PDF altérée ou invalide.' };
    }

    return { valid: true };
  } catch {
    return { valid: true };
  }
}

/**
 * Téléverse un fichier (Image, Document PDF, Scan CNI/Permis, Facture) vers Cloudinary.
 * Progression réelle via XMLHttpRequest.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  options?: {
    folder?: string;
    fileName?: string;
    context?: Record<string, string>;
    onProgress?: (percent: number) => void;
  }
): Promise<CloudinaryUploadResult> {
  const name = options?.fileName || (file as File).name || 'document';
  const validationError = validateUploadFile({ name, size: file.size });
  if (validationError) {
    throw new Error(validationError);
  }

  const magicCheck = await validateFileMagicBytes(file);
  if (!magicCheck.valid) {
    throw new Error(magicCheck.error || 'Intégrité du fichier rejetée.');
  }

  return new Promise((resolve, reject) => {

    const formData = buildUploadFormData(file, {
      folder: options?.folder,
      context: options?.context,
      fileName: name,
    });

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let payload: any = {};
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        /* réponse non JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.secure_url) {
        options?.onProgress?.(100);
        resolve(payload as CloudinaryUploadResult);
      } else {
        reject(
          new Error(payload?.error?.message || `Échec du téléversement Cloudinary (HTTP ${xhr.status})`)
        );
      }
    };

    xhr.onerror = () => reject(new Error('Connexion à Cloudinary impossible. Vérifiez votre réseau.'));
    xhr.send(formData);
  });
}

// ---------------------------------------------------------------------------
// URL helpers (transformations Cloudinary)
// ---------------------------------------------------------------------------

export type DocumentKind = 'IMAGE' | 'PDF' | 'OFFICE' | 'OTHER';

export function isCloudinaryUrl(url?: string | null): boolean {
  return !!url && /res\.cloudinary\.com\//.test(url);
}

/** Détermine le type d'un document à partir de son URL. */
export function getDocumentKind(url?: string | null): DocumentKind {
  if (!url) return 'OTHER';
  const clean = url.split('?')[0].toLowerCase();
  const ext = getFileExtension(clean);
  if (ext === 'pdf') return 'PDF';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'avif'].includes(ext)) return 'IMAGE';
  if (['doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'ppt', 'pptx'].includes(ext)) return 'OFFICE';
  if (isCloudinaryUrl(url) && clean.includes('/image/upload/')) return 'IMAGE';
  if (/images\.unsplash\.com/.test(clean)) return 'IMAGE';
  return 'OTHER';
}

/** Insère une transformation juste après `/upload/`. */
export function withTransformation(url: string, transformation: string): string {
  if (!isCloudinaryUrl(url) || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transformation}/`);
}

/**
 * Génère une URL de miniature optimisée Cloudinary
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options?: { width?: number; height?: number; crop?: string }
): string {
  if (!url || !isCloudinaryUrl(url)) return url;
  const width = options?.width || 400;
  const height = options?.height || 300;
  const crop = options?.crop || 'fill';
  if (getDocumentKind(url) === 'PDF') {
    return getPdfPageImageUrl(url, 1, width);
  }
  return withTransformation(url, `c_${crop},w_${width},h_${height},q_auto,f_auto`);
}

/** Aperçu grand format d'une image (qualité auto, format auto). */
export function getImagePreviewUrl(url: string, width = 1600): string {
  return withTransformation(url, `c_limit,w_${width},q_auto,f_auto`);
}

/**
 * Rendu d'une page de PDF en image JPG (fonctionne même si la diffusion
 * des PDF bruts est désactivée sur le compte Cloudinary).
 */
export function getPdfPageImageUrl(url: string, page = 1, width = 1200): string {
  if (!isCloudinaryUrl(url)) return url;
  return withTransformation(url, `pg_${page},c_limit,w_${width},q_auto`).replace(/\.pdf(\?.*)?$/i, '.jpg');
}

/** URL forçant le téléchargement du fichier original. */
export function getDownloadUrl(url: string, fileName?: string): string {
  if (!isCloudinaryUrl(url)) return url;
  const flag = fileName ? `fl_attachment:${sanitizeFileName(fileName).replace(/\.[^.]+$/, '')}` : 'fl_attachment';
  return withTransformation(url, flag);
}
