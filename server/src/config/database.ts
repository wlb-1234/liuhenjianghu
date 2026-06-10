import { Pool } from 'pg';

function getDatabaseUrl(): string {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
  
  // Supabase 连接格式：postgres.{project_ref}.supabase.co
  // 注意：这里使用 postgres. 前缀而不是 db. 前缀
  const supabaseHost = 'db.hmlqsbhbbclbzfuutrie.supabase.co';
  
  console.log(`🔍 使用 Supabase 直连: ${supabaseHost}`);
  
  return `postgresql://postgres.${supabaseHost.split('.')[1]}:${dbPassword}@${supabaseHost}:5432/postgres?sslmode=require`;
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
