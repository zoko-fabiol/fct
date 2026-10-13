import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = 'C:\\Users\\Claus\\AppData\\Local\\Temp\\edge_cdp_profile';
const SCREENSHOTS_DIR = 'E:\\Telechargement\\fct-erp-&-crm-automobile---douala\\scripts\\presentation_pdf\\screenshots';
const PORT = 9222;

const MODULES = [
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWebSocketDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find(item => item.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          return page.webSocketDebuggerUrl;
        }
      }
    } catch {}
    await sleep(500);
  }
  throw new Error('Impossible de se connecter au port de débogage CDP');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.id && this.callbacks.has(data.id)) {
            const cb = this.callbacks.get(data.id);
            this.callbacks.delete(data.id);
            if (data.error) cb.reject(new Error(data.error.message));
            else cb.resolve(data.result);
          }
        } catch {}
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      this.id++;
      const msgId = this.id;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    return res?.result?.value;
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(1000);
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('🚀 Démarrage de Microsoft Edge Headless avec CDP...');
  const edgeProcess = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1600,1050',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000/'
  ]);

  try {
    const wsUrl = await getWebSocketDebuggerUrl();
    console.log(`🔌 Connecté au navigateur via CDP : ${wsUrl}`);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('⏳ Attente du chargement de l\'écran de connexion...');
    await sleep(2500);

    console.log('🔑 Saisie des identifiants officiels de Claus Ephwandji...');
    // Injection des valeurs et déclenchement du submit
    const loginResult = await cdp.eval(`
      (() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const form = document.querySelector('form');
        if (!emailInput || !passInput) return 'Formulaire non trouvé';

        // React controlled inputs nécessitent le prototype setter
        const setVal = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setVal(emailInput, 'clausephwandji044@gmail.com');
        setVal(passInput, '@#@Claus26');

        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        if (submitBtn) {
          submitBtn.click();
          return 'Submit cliqué';
        } else if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return 'Form submitted';
        }
        return 'Bouton non trouvé';
      })()
    `);
    console.log('Action de connexion :', loginResult);

    console.log('⏳ Attente de la validation et de l\'ouverture de session...');
    let loggedIn = false;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      const isSidebarPresent = await cdp.eval(`
        Boolean(document.querySelector('button[data-module="dashboard"]') || document.querySelector('aside'))
      `);
      if (isSidebarPresent) {
        loggedIn = true;
        break;
      }
    }

    if (loggedIn) {
      console.log('🎉 Session ouverte avec succès pour Claus Ephwandji !');
    } else {
      console.warn('⚠️ Sidebar non détectée directement après délai.');
    }

    // Capture des 19 modules connectés
    console.log('📸 Début de la capture HD des 19 modules connectés...');
    for (const mod of MODULES) {
      console.log(`   ➔ Capture du module : ${mod}...`);
      await cdp.eval(`
        (() => {
          if ('${mod}' === 'showroom') {
            // Aller sur véhicules puis cliquer sur Showroom
            const vehBtn = document.querySelector('button[data-module="vehicles"]');
            if (vehBtn) vehBtn.click();
            setTimeout(() => {
              const showroomBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Showroom'));
              if (showroomBtn) showroomBtn.click();
            }, 300);
          } else if ('${mod}' === 'users') {
            // Aller sur paramètres puis cliquer sur l'onglet Collaborateurs & Droits RBAC
            const setBtn = document.querySelector('button[data-module="settings"]');
            if (setBtn) setBtn.click();
            setTimeout(() => {
              const userTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Collaborateurs') || b.innerText.includes('RBAC'));
              if (userTab) userTab.click();
            }, 300);
          } else {
            const btn = document.querySelector('button[data-module="${mod}"]');
            if (btn) {
              btn.click();
            } else {
              const url = new URL(window.location.href);
              url.searchParams.set('module', '${mod}');
              window.history.pushState({}, '', url.toString());
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }
        })()
      `);
      
      // Laisser 1.8s à React pour monter le module et animer les statistiques
      await sleep(1800);

      const filePath = path.join(SCREENSHOTS_DIR, `${mod}.png`);
      await cdp.captureScreenshot(filePath);
      console.log(`      ✓ Enregistré : ${mod}.png`);
    }

    console.log('✅ Toutes les 19 captures ERP ont été réalisées avec la session active de Claus Ephwandji !');
    cdp.close();
  } catch (err) {
    console.error('❌ Erreur lors de la capture CDP :', err);
  } finally {
    edgeProcess.kill();
  }
}

main();
