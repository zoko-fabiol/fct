/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Moteur d'impression A4 isolé
 * Franchise Conseils Trading - Douala, Cameroun
 *
 * Inspiré de CGA SPE (`printDocument.js`) : le document est imprimé seul dans une
 * iframe cachée, jamais la page complète de l'application.
 * Différences : les feuilles de style de l'application (Tailwind v4 compilé) sont
 * recopiées dans l'iframe au lieu du CDN Tailwind, l'impression attend le chargement
 * réel des polices et des images, et les factures longues sont paginées proprement.
 */

/** CSS dédié à l'impression A4 (exporté pour les tests). */
export const A4_PRINT_CSS = `
  @page { size: A4 portrait; margin: 0; }
  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #0f172a;
  }
  body { width: 210mm; }
  .fct-print-root {
    width: 210mm;
    padding: 12mm 12mm 14mm 12mm;
  }
  .fct-print-root > * {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    transform: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
    max-height: none !important;
  }
  .no-print { display: none !important; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr, img, svg, .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
`;

function collectStyles(): string {
  if (typeof document === 'undefined') return '';
  return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

async function waitForAssets(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
    )
  );
  const fonts = (doc as any).fonts;
  if (fonts?.ready) {
    try {
      await fonts.ready;
    } catch {
      /* ignore */
    }
  }
  // Laisse au moteur le temps de calculer la mise en page finale
  await new Promise((r) => setTimeout(r, 150));
}

/**
 * Imprime un élément DOM seul, au format A4, sans l'interface de l'application.
 * @param elementId id de l'élément à imprimer
 * @param documentTitle titre (utilisé comme nom de fichier par « Enregistrer en PDF »)
 */
export async function printElementById(elementId: string, documentTitle = 'Document FCT'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[printElementById] Élément #${elementId} introuvable`);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '210mm',
    height: '297mm',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  } as CSSStyleDeclaration);
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <base href="${escapeHtml(window.location.origin + '/')}" />
    <title>${escapeHtml(documentTitle)}</title>
    ${collectStyles()}
    <style>${A4_PRINT_CSS}</style>
  </head>
  <body>
    <div class="fct-print-root">${element.outerHTML}</div>
  </body>
</html>`);
  doc.close();

  // Attendre le chargement des feuilles de style recopiées
  await new Promise<void>((resolve) => {
    if (doc.readyState === 'complete') resolve();
    else iframe.addEventListener('load', () => resolve(), { once: true });
    setTimeout(resolve, 1500);
  });
  await waitForAssets(doc);

  const cleanup = () => setTimeout(() => iframe.remove(), 300);
  win.addEventListener('afterprint', cleanup, { once: true });
  // Sécurité si `afterprint` n'est pas émis (certains navigateurs mobiles)
  setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);

  win.focus();
  win.print();
}
