import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared-types': path.resolve(__dirname, '../packages/shared-types'),
      '@business-rules': path.resolve(__dirname, '../packages/business-rules'),
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
});
