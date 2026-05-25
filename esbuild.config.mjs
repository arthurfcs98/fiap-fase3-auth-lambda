import * as esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

await esbuild.build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  minify: false,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/handler.js',
  sourcemap: false,
  minify: true,
  external: [
    // AWS SDK v3 está embutido no runtime nodejs20.x — não precisamos empacotar
    '@aws-sdk/*',
  ],
  logLevel: 'info',
});

console.log('✓ build complete: dist/handler.js');
