import { cpSync, mkdirSync, rmSync } from 'node:fs';

// Keep the normal static-server layout, including dynamically loaded artwork.
// No asset CDN or bundled copy of Three.js is introduced.
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const path of ['index.html', 'main.js', 'void-orrery.js', 'vendor', 'assets']) {
  cpSync(path, `dist/${path}`, { recursive: true });
}
console.log('Static cathedral copied to dist/');
