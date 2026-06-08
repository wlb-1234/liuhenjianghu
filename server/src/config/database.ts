import { Pool } from 'pg';

function getDatabaseUrl(): string {
  // 直接使用 Supabase 直连地址（固定）
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
  
  // 使用 Supabase 的直接数据库连接地址
  const directUrl = `postgresql://postgres.hmlqsbhbbclbzfuutrie:${dbPassword}@db.hmlqsbhbbclbzfuutrie.supabase.co:5432/postgres?sslmode=require`;
  
  console.log('🔍 使用 Supabase 直连地址');
  return directUrl;
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
