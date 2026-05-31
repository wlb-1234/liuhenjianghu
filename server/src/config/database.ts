import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 延迟加载环境变量和数据库连接
let dbUrl: string | null = null;

function loadDatabaseConfig() {
  if (!dbUrl) {
    try {
      loadEnv();
      dbUrl = getDbUrl();
    } catch (e) {
      console.warn('⚠️ 数据库配置加载失败:', e);
      dbUrl = '';
    }
  }
  return dbUrl;
}

export function getPool(): Pool {
  const config = loadDatabaseConfig();
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
