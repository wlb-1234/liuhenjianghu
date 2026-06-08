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
  
  // Railway 会自动注入 DATABASE_URL 环境变量
  let dbUrl = process.env.DATABASE_URL;
  
  // 如果没有，使用 Supabase 直连地址
  if (!dbUrl || dbUrl.trim() === '') {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
    dbUrl = `postgresql://postgres.hmlqsbhbbclbzfuutrie:${dbPassword}@aws-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require`;
    console.log('⚠️ 使用 Supabase Pooler 直连地址');
  }
  
  // 确保 URL 有效
  if (!dbUrl || !dbUrl.startsWith('postgresql')) {
    console.error('❌ 无法获取有效的数据库连接字符串');
    throw new Error('DATABASE_URL not configured');
  }
  
  // 提取主机名用于日志
  try {
    const url = new URL(dbUrl);
    console.log('🔍 数据库连接信息:');
    console.log('   - 主机:', url.hostname);
    console.log('   - 端口:', url.port || '5432');
    console.log('   - 数据库:', url.pathname.replace('/', ''));
  } catch (e) {
    console.log('🔍 数据库连接字符串:', dbUrl.substring(0, 50) + '...');
  }
  
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
