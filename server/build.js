import * as esbuild from 'esbuild';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const dependencies = pkg.dependencies || {};
// 只把真正的外部依赖标记为 external，不要包含本地定义的函数
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
  console.log('⚡ Build complete!');
} catch (e) {
  console.error(e);
  process.exit(1);
}
