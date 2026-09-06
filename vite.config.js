import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { three: fileURLToPath(new URL('./vendor/three.module.js', import.meta.url)) },
  },
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
});
