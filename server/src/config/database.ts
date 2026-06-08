import { Pool } from 'pg';

// Railway 注入的数据库连接环境变量名
const DB_ENV_VARS = [
  'DATABASE_URL',
  'POSTGRES_URL', 
  'SUPABASE_DB_URL',
  'DB_URL'
];

function getDatabaseUrl(): string {
  // 尝试多个可能的数据库 URL 环境变量
  for (const envVar of DB_ENV_VARS) {
    const dbUrl = process.env[envVar];
    if (dbUrl && dbUrl.startsWith('postgresql')) {
      try {
        const url = new URL(dbUrl);
        console.log(`🔍 使用 ${envVar}:`);
        console.log('   - 主机:', url.hostname);
        console.log('   - 端口:', url.port || '5432');
      } catch (e) {}
      return dbUrl;
    }
  }
  
  // 备用：使用 Supabase 直接连接地址
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
  const fallbackUrl = `postgresql://postgres.hmlqsbhbbclbzfuutrie:${dbPassword}@db.hmlqsbhbbclbzfuutrie.supabase.co:5432/postgres?sslmode=require`;
  
  console.log('⚠️ 未检测到数据库 URL，使用备用连接...');
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
