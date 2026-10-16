import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function fctCmsSyncPlugin() {
  return {
    name: 'fct-cms-sync',
    configureServer(server: any) {
      server.middlewares.use('/__cms_sync', (req: any, res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              server.hot.send('fct-cms-update', data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        res.statusCode = 404;
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), fctCmsSyncPlugin()],
  resolve: {
    alias: {
      '@': path.resolve('src'),
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
});
