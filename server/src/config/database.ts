import { Pool } from 'pg';
import { execSync } from 'child_process';

function getIPv4Address(hostname: string): string | null {
  try {
    // 使用 nslookup 获取 IPv4 地址
    const output = execSync(`nslookup ${hostname}`, { encoding: 'utf-8', timeout: 5000 });
    // 解析输出找到 Address
    const lines = output.split('\n');
    for (const line of lines) {
      // 匹配 IPv4 地址格式
      if (line.includes('Address:') && !line.includes(':') && !line.includes('#')) {
        const parts = line.split(':');
        const addr = parts[parts.length - 1].trim();
        // 检查是否是 IPv4（不包含冒号）
        if (addr && !addr.includes(':')) {
          return addr;
        }
      }
    }
  } catch (e) {
    console.log('DNS 解析失败:', e);
  }
  return null;
}

function getDatabaseUrl(): string {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Liuhen2026App';
  const hostname = 'db.hmlqsbhbbclbzfuutrie.supabase.co';
  
  // 尝试获取 IPv4 地址
  const ipv4 = getIPv4Address(hostname);
  if (ipv4) {
    console.log(`🔍 获取到 IPv4 地址: ${ipv4}`);
    // 直接使用 IPv4 地址连接
    return `postgresql://postgres.hmlqsbhbbclbzfuutrie:${dbPassword}@${ipv4}:5432/postgres?sslmode=require`;
  }
  
  // 备用：使用主机名但禁用 IPv6
  console.log('🔍 使用 Supabase 直连地址（禁用 IPv6）');
  return `postgresql://postgres.hmlqsbhbbclbzfuutrie:${dbPassword}@${hostname}:5432/postgres?sslmode=require`;
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
