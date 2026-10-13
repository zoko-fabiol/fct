/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Capture automatique HD de tous les écrans
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve('scripts/presentation_pdf/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const erpModules = [
  'dashboard',
  'vehicles',
  'showroom',
  'rentals',
  'sales',
  'billing',
  'cash',
  'maintenance',
  'drivers',
  'crm',
  'stock',
  'reservations',
  'documents',
  'reports',
  'notifications',
  'users',
  'audit',
  'help',
  'settings'
];

const webPages = [
  { name: 'web_home', path: '#/home' },
  { name: 'web_rentals', path: '#/location' },
  { name: 'web_sales', path: '#/vente' },
  { name: 'web_showroom', path: '#/showroom/veh_001' },
  { name: 'web_health', path: '#/carnet-sante' },
  { name: 'web_portal', path: '#/espace-client' },
  { name: 'web_agency', path: '#/agence' }
];

console.log('🚀 Démarrage de la capture HD des modules ERP...');

for (const mod of erpModules) {
  const outFile = path.join(OUTPUT_DIR, `${mod}.png`);
  const url = `http://localhost:3000/?demo=true&module=${mod}`;
  console.log(`📸 Capture module ERP [${mod}]...`);
  try {
    const cmd = `powershell -Command "Start-Process -FilePath '${EDGE_PATH}' -ArgumentList '--headless', '--user-data-dir=C:\\Users\\Claus\\AppData\\Local\\Temp\\edge_cap_${mod}', '--window-size=1600,1050', '--screenshot=\\\"${outFile}\\\"', '${url}' -Wait"`;
    execSync(cmd, { stdio: 'ignore', timeout: 25000 });
  } catch (err) {
    console.warn(`⚠️ Échec ou timeout sur ${mod}:`, err.message);
  }
}

console.log('🚀 Démarrage de la capture HD des pages Website...');

for (const p of webPages) {
  const outFile = path.join(OUTPUT_DIR, `${p.name}.png`);
  const url = `http://localhost:3001/${p.path}`;
  console.log(`📸 Capture page Web [${p.name}]...`);
  try {
    const cmd = `powershell -Command "Start-Process -FilePath '${EDGE_PATH}' -ArgumentList '--headless', '--user-data-dir=C:\\Users\\Claus\\AppData\\Local\\Temp\\edge_cap_${p.name}', '--window-size=1600,1050', '--screenshot=\\\"${outFile}\\\"', '${url}' -Wait"`;
    execSync(cmd, { stdio: 'ignore', timeout: 25000 });
  } catch (err) {
    console.warn(`⚠️ Échec ou timeout sur ${p.name}:`, err.message);
  }
}

console.log('✅ Toutes les captures ont été traitées dans scripts/presentation_pdf/screenshots/');
