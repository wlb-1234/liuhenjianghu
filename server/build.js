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
  'redis',
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
  
  // 复制public目录到dist
  const publicDir = join(process.cwd(), 'public');
  const distPublicDir = join(process.cwd(), 'dist', 'public');
  
  if (existsSync(publicDir)) {
    if (!existsSync(distPublicDir)) {
      mkdirSync(distPublicDir, { recursive: true });
    }
    
    // 复制public目录下的所有文件
    const { readdirSync, copyFileSync: cpSync } = await import('fs');
    const publicFiles = readdirSync(publicDir);
    for (const file of publicFiles) {
      const src = join(publicDir, file);
      const dest = join(distPublicDir, file);
      cpSync(src, dest);
      console.log(`Copied ${file} to dist/public/`);
    }
  }
  
  console.log('⚡ Build complete!');
} catch (e) {
  console.error(e);
  process.exit(1);
}
