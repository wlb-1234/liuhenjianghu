import * as esbuild from 'esbuild';
import { createRequire } from 'module';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const dependencies = pkg.dependencies || {};
const externalList = [
  '@supabase/supabase-js',
  '@pinata/sdk',
  'ali-oss',
  'bcryptjs',
  'cors',
  'coze-coding-dev-sdk',
  'dayjs',
  'dotenv',
  'drizzle-orm',
  'drizzle-zod',
  'express',
  'jsonwebtoken',
  'multer',
  'mysql2',
  'oss-sdk',
  'pg',
  'pinata-web3',
  'uuid',
  'zod',
];

try {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: 'dist',
    external: externalList,
    minify: false,
    sourcemap: false,
  });
  
  // 复制data目录到dist
  const dataDir = join(process.cwd(), 'src', 'data');
  const distDataDir = join(process.cwd(), 'dist', 'data');
  
  if (existsSync(dataDir)) {
    if (!existsSync(distDataDir)) {
      mkdirSync(distDataDir, { recursive: true });
    }
    
    const files = ['regions.json', 'provinces.json'];
    for (const file of files) {
      const src = join(dataDir, file);
      const dest = join(distDataDir, file);
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`Copied ${file} to dist/data/`);
      }
    }
  }
  
  console.log('⚡ Build complete!');
} catch (e) {
  console.error(e);
  process.exit(1);
}
