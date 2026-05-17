import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 加载环境变量
loadEnv();

const dbUrl = getDbUrl();

// 解析数据库 URL
function parseDatabaseUrl(url: string) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@(.+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid database URL');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
}

const parsedConfig = parseDatabaseUrl(dbUrl);

// 导出数据库配置供直接使用
export const dbConfig = {
  host: parsedConfig.host,
  port: parsedConfig.port,
  database: parsedConfig.database,
  user: parsedConfig.user,
  password: parsedConfig.password
};

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }
  return pool;
}

export async function testConnection() {
  const p = getPool();
  try {
    const result = await p.query('SELECT NOW()');
    console.log('✅ 数据库连接成功:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

export default { getPool, testConnection, dbConfig };
