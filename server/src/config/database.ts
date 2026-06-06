import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile(): void {
  // 尝试多个可能的 .env 文件位置
  const possiblePaths = [
    resolve(__dirname, '../../.env'),      // 从 dist/config/ 向上两级
    resolve(__dirname, '../.env'),          // 从 dist/config/ 向上一级
    resolve(process.cwd(), '.env'),        // 当前工作目录
    '/workspace/projects/server/.env',      // 绝对路径
  ];
  
  for (const envPath of possiblePaths) {
    try {
      const content = readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
      console.log(`✅ 已加载环境变量: ${envPath}`);
      return;
    } catch (e) {
      // 继续尝试下一个路径
    }
  }
  console.warn('⚠️ 未找到 .env 文件，使用系统环境变量');
}

function getDatabaseUrl(): string {
  loadEnvFile();
  const dbUrl = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }
  return dbUrl;
}

export function getPool(): Pool {
  const config = getDatabaseUrl();
  if (!config) {
    throw new Error('数据库未配置');
  }

  return new Pool({
    connectionString: config,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
}

export async function testConnection() {
  try {
    const p = getPool();
    const result = await p.query('SELECT NOW()');
    console.log('✅ 数据库连接成功:', result.rows[0].now);
    return true;
  } catch (error) {
    console.warn('⚠️ 数据库连接失败:', error);
    return false;
  }
}

export default { getPool, testConnection };
