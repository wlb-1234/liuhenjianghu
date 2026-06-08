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
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }
  
  // 解析主机名
  try {
    const url = new URL(dbUrl);
    const hostname = url.hostname;
    
    console.log('🔍 数据库连接信息:');
    console.log('   - 原始主机名:', hostname);
    console.log('   - 原始 DATABASE_URL:', dbUrl.substring(0, 60) + '...');
    
    // 如果是 Supabase Pooler 域名，直接替换为 IPv4 地址
    if (hostname.includes('pooler.supabase.com')) {
      // IPv4 地址是 AWS 负载均衡器
      const ipv4 = '13.114.6.6';
      const port = url.port || '5432';
      const newDbUrl = `${url.protocol}//${url.username}:${url.password}@${ipv4}:${port}${url.pathname}${url.search || '?sslmode=require'}`;
      
      console.log('   - 替换为 IPv4:', ipv4);
      console.log('   - 新连接字符串:', newDbUrl.substring(0, 60) + '...');
      
      return newDbUrl;
    }
    
    console.log('   - 保持原连接字符串');
    return dbUrl;
  } catch (error) {
    console.error('❌ URL 解析失败:', error);
    return dbUrl;
  }
}

// 单例 Pool
let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }
  
  const dbUrl = getDatabaseUrl();
  
  poolInstance = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  });
  
  poolInstance.on('error', (err) => {
    console.error('❌ 数据库连接池错误:', err);
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
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

export default { getPool, query, testConnection };
