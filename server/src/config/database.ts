import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import dns from 'dns';

const lookup = promisify(dns.lookup);
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
      // 继续尝试
    }
  }
  console.warn('⚠️ 未找到 .env 文件，使用系统环境变量');
}

// 强制解析为 IPv4
async function resolveToIPv4(hostname: string): Promise<string> {
  try {
    const { address, family } = await lookup(hostname, { hints: dns.ADDRCONFIG });
    console.log(`🔍 DNS 解析: ${hostname} -> ${address} (IPv${family})`);
    
    if (family === 6) {
      // 如果解析到 IPv6，再尝试强制获取 IPv4
      console.log(`⚠️ 获取到 IPv6，尝试强制 IPv4...`);
      try {
        const { address: v4 } = await lookup(hostname, { family: 4 });
        console.log(`✅ 强制 IPv4 成功: ${hostname} -> ${v4}`);
        return v4;
      } catch {
        console.log(`⚠️ IPv4 解析失败，使用 IPv6: ${address}`);
        return address;
      }
    }
    return address;
  } catch (error) {
    console.error(`❌ DNS 解析失败: ${hostname}`, error);
    throw error;
  }
}

function getDatabaseUrl(): string {
  loadEnvFile();
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }
  
  console.log('🔍 数据库连接信息:');
  console.log('   - DATABASE_URL:', dbUrl.substring(0, 70) + '...');
  
  return dbUrl;
}

// 单例 Pool 实例
let poolInstance: Pool | null = null;
let poolInitPromise: Promise<Pool> | null = null;

export async function initPool(): Promise<Pool> {
  if (poolInstance) {
    return poolInstance;
  }
  
  if (poolInitPromise) {
    return poolInitPromise;
  }
  
  poolInitPromise = (async () => {
    const dbUrl = getDatabaseUrl();
    
    try {
      const url = new URL(dbUrl);
      const hostname = url.hostname;
      const port = url.port || '5432';
      
      // 解析主机名为 IPv4
      console.log(`🔍 正在解析 DNS: ${hostname}...`);
      const ipv4 = await resolveToIPv4(hostname);
      
      // 重建连接字符串，使用解析后的 IP
      const newDbUrl = `${url.protocol}//${url.username}:${url.password}@${ipv4}:${port}${url.pathname}${url.search || '?sslmode=require'}`;
      
      console.log(`✅ 数据库连接池初始化成功`);
      console.log(`   - 主机: ${hostname} -> ${ipv4}`);
      console.log(`   - 数据库: ${url.pathname.replace('/', '')}`);
      
      poolInstance = new Pool({
        connectionString: newDbUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });
      
      // 测试连接
      try {
        const client = await poolInstance.connect();
        const result = await client.query('SELECT current_database(), inet_server_addr()');
        console.log(`✅ 数据库连接测试成功:`, result.rows[0]);
        client.release();
      } catch (err) {
        console.error('❌ 数据库连接测试失败:', err);
      }
      
      return poolInstance;
    } catch (error) {
      console.error('❌ 数据库连接池初始化失败:', error);
      throw error;
    }
  })();
  
  return poolInitPromise;
}

// 同步版本 - 延迟初始化
export function getPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }
  
  // 同步调用时创建新 Pool（会在首次查询时初始化）
  const dbUrl = getDatabaseUrl();
  console.log('⚠️ 使用同步 getPool()，建议使用 initPool()');
  
  return new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });
}

// 导出带异步初始化的 query 函数
let poolPromise: Promise<Pool> | null = null;

export async function getPoolAsync(): Promise<Pool> {
  if (poolPromise) {
    return poolPromise;
  }
  
  poolPromise = initPool();
  return poolPromise;
}

export async function query(text: string, params?: any[]) {
  const pool = await getPoolAsync();
  return pool.query(text, params);
}

export async function testConnection() {
  try {
    const pool = await getPoolAsync();
    const result = await pool.query('SELECT NOW()');
    console.log('✅ 数据库连接成功:', result.rows[0].now);
    return true;
  } catch (error) {
    console.warn('⚠️ 数据库连接失败:', error);
    return false;
  }
}

export default { getPool, getPoolAsync, query, testConnection, initPool };
