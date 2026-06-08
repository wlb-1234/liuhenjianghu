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
  
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl || dbUrl.trim() === '' || dbUrl.startsWith('ppostgresql')) {
    // 优先使用 Supabase 直连 IP
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    if (supabaseUrl) {
      // 从 Supabase URL 提取项目引用 ID
      const refId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
      if (refId) {
        // 使用 Supabase 提供的直连信息
        dbUrl = `postgresql://postgres:${process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || 'demo'}@db.${refId}.supabase:5432/postgres`;
      }
    }
    
    // 如果没有有效的 Supabase URL，尝试使用 Railway 提供的连接
    if (!dbUrl || dbUrl.startsWith('ppostgresql') || !dbUrl.includes('supabase')) {
      dbUrl = process.env.DATABASE_URL || `postgresql://postgres.hmlqsbhbbclbzfuutrie:${process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App'}@13.114.6.6:5432/postgres?sslmode=disable`;
    }
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
    // 不启用 SSL，让连接使用纯 TCP
    ssl: false,
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
