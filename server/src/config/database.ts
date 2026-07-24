import { Pool } from 'pg';

// 单例 Pool
let poolInstance: Pool | null = null;

function getDatabaseUrl(): string {
  // 直接使用 .env 中的 DATABASE_URL
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    throw new Error('DATABASE_URL 环境变量未设置，请在 .env 文件中配置数据库连接地址');
  }
  
  console.log('🔍 使用 DATABASE_URL 配置:', envUrl.replace(/:[^:@]+@/, ':****@'));
  return envUrl;
}

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
    ssl: { rejectUnauthorized: false }
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
