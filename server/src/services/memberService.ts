import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';
import { Pool } from 'pg';

// 延迟初始化
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    try {
      loadEnv();
      const dbUrl = getDbUrl();
      pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });
    } catch (e) {
      console.error('数据库初始化失败:', e);
      throw e;
    }
  }
  return pool;
}

export async function getMemberLevel(level: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM member_levels WHERE level = $1',
    [level]
  );
  return result.rows[0];
}

export async function getAllMemberLevels() {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM member_levels ORDER BY level ASC'
  );
  return result.rows;
}

export async function updateMemberLevel(userId: number, level: number, expireAt?: Date) {
  const p = getPool();
  const result = await p.query(
    `UPDATE users SET member_level = $1, member_expire_at = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [level, expireAt || null, userId]
  );
  return result.rows[0];
}
