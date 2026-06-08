import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Railway 会自动注入这些环境变量，直接使用即可
function getDatabaseUrl(): string {
  // Railway 注入的环境变量
  const dbUrl = process.env.DATABASE_URL;
  
  // 如果有 Railway 注入的 DATABASE_URL，直接使用
  if (dbUrl && dbUrl.startsWith('postgresql')) {
    try {
      const url = new URL(dbUrl);
      console.log('🔍 使用 Railway DATABASE_URL:');
      console.log('   - 主机:', url.hostname);
      console.log('   - 端口:', url.port || '5432');
      console.log('   - 数据库:', url.pathname.replace('/', ''));
    } catch (e) {
      console.log('🔍 DATABASE_URL:', dbUrl.substring(0, 50) + '...');
    }
    return dbUrl;
  }
  
  // 备用：使用 Supabase 直连地址
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
  const fallbackUrl = `postgresql://postgres.hmlqsbhbbclbzfuutrie:${dbPassword}@aws-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require`;
  
  console.log('🔍 使用 Supabase 直连地址');
  try {
    const url = new URL(fallbackUrl);
    console.log('   - 主机:', url.hostname);
  } catch (e) {}
  
  return fallbackUrl;
}

// 单例 Pool
let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }
  
  const dbUrl = getDatabaseUrl();
  
  console.log('🔍 创建数据库连接池...');
  
  poolInstance = new Pool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  });
  
  poolInstance.on('error', (err) => {
    console.error('❌ 数据库连接池错误:', err.message);
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
    const result = await pool.query('SELECT NOW(), current_database()');
    console.log('✅ 数据库连接成功:', result.rows[0]);
    return true;
  } catch (error: any) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

export default { getPool, query, testConnection };
