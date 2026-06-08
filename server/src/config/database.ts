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
  
  // 使用 Supabase Pooler 地址（端口 65432）和 SSL
  // Pooler 负责连接池管理
  const dbUrl = 'postgresql://postgres.hmlqsbhbbclbzfuutrie:Liuhen2026App@aws-1-ap-northeast-1.pooler.supabase.com:65432/postgres?sslmode=require';
  
  console.log('🔍 数据库连接信息:');
  console.log('   - 主机: aws-1-ap-northeast-1.pooler.supabase.com');
  console.log('   - 端口: 65432 (PgBouncer)');
  console.log('   - 数据库: postgres');
  console.log('   - SSL: require');
  console.log('   - 连接字符串: postgresql://postgres.hmlqsbhbbclbzfuutrie:***@pooler.supabase.com:65432/postgres');
  
  return dbUrl;
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
    ssl: {
      rejectUnauthorized: false, // 允许自签名证书
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000, // 增加超时时间
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
    const result = await pool.query('SELECT NOW(), current_database(), inet_server_addr()');
    console.log('✅ 数据库连接成功:', result.rows[0]);
    return true;
  } catch (error: any) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

export default { getPool, query, testConnection };
