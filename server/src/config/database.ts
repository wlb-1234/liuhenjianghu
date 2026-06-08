import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile(): void {
  const possiblePaths = [
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../.env'),
    resolve(process.cwd(), '.env'),
    '/workspace/projects/server/.env',
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
      // 继续
    }
  }
}

function getDatabaseUrl(): string {
  loadEnvFile();
  
  // 优先使用环境变量
  let dbUrl = process.env.DATABASE_URL;
  
  // 如果没有设置，或者 URL 无效，使用硬编码的 Supabase 连接
  if (!dbUrl || dbUrl.startsWith('p')) {
    // 硬编码 Supabase PostgreSQL 连接（使用 IPv4）
    dbUrl = 'postgresql://postgres.hmlqsbhbbclbzfuutrie:Liuhen2026App@13.114.6.6:5432/postgres?sslmode=disable';
    console.log('⚠️ 环境变量无效，使用硬编码的 Supabase 连接');
  }
  
  console.log('🔍 数据库连接信息:');
  console.log('   - DATABASE_URL:', dbUrl.substring(0, 60) + '...');
  
  return dbUrl;
}

// 单例 Pool
let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }
  
  const dbUrl = getDatabaseUrl();
  
  console.log('🔍 创建数据库连接池...');
  console.log('   - 连接字符串:', dbUrl);
  
  poolInstance = new Pool({
    connectionString: dbUrl,
    ssl: false, // 禁用 SSL 以简化连接
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  });
  
  poolInstance.on('error', (err) => {
    console.error('❌ 数据库连接池错误:', err.message);
  });
  
  poolInstance.on('connect', () => {
    console.log('✅ 新数据库连接已建立');
  });
  
  console.log('✅ 数据库连接池已创建');
  return poolInstance;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  return pool.query(text, params);
}

export async function testConnection() {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW(), current_database(), inet_server_addr()');
    console.log('✅ 数据库连接成功:', result.rows[0]);
    return true;
  } catch (error: any) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

export default { getPool, query, testConnection };
