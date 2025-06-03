const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

// Build server
build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  external: ['express', 'ws'],
  target: 'node18',
}).then(() => {
  console.log('Server build complete');
}).catch(() => process.exit(1));

// Copy client files for production
const clientDir = path.join(__dirname, 'client');
const distClientDir = path.join(__dirname, 'dist', 'client');

if (fs.existsSync(clientDir)) {
  fs.cpSync(clientDir, distClientDir, { recursive: true });
  console.log('Client files copied');
}