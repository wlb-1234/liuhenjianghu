import { Pool } from 'pg';

// 单例 Pool
let poolInstance: Pool | null = null;

function getDatabaseUrl(): string {
  // 直接使用 .env 中的 DATABASE_URL
  const envUrl = process.env.DATABASE_URL;
  console.log('🔍 process.env.DATABASE_URL:', envUrl ? '已设置' : '未设置');
  if (envUrl) {
    console.log('🔍 使用 .env DATABASE_URL 配置:', envUrl.replace(/:[^:@]+@/, ':****@'));
    return envUrl;
  }
  
  console.log('🔍 .env DATABASE_URL 未设置，使用默认值');
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
  const customHost = process.env.DB_HOST || '13.114.6.6';
  const dbUser = process.env.DB_USER || 'postgres.hmlqsbhbbclbzfuutrie';
  
  console.log(`🔍 使用数据库地址: ${customHost}, 用户: ${dbUser}`);
  
  return `postgresql://${dbUser}:${dbPassword}@${customHost}:5432/postgres`;
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
