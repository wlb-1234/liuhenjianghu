import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

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

// 用户相关操作
export async function getUserByPhone(phone: string) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM users WHERE phone = $1',
    [phone]
  );
  return result.rows[0];
}

export async function createUser(data: {
  phone: string;
  nickname: string;
  password_hash: string;
  province_code?: string;
  city_code?: string;
  district_code?: string;
  town_code?: string;
}) {
  const p = getPool();
  const result = await p.query(
    `INSERT INTO users (phone, nickname, password_hash, province_code, city_code, district_code, town_code, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [data.phone, data.nickname, data.password_hash, data.province_code || null, data.city_code || null, data.district_code || null, data.town_code || null]
  );
  return result.rows[0];
}

export async function getUserById(id: number) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function updateUser(id: number, data: any) {
  const p = getPool();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await p.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function verifyCode(phone: string, code: string) {
  const p = getPool();
  // 验证码5分钟内有效
  const result = await p.query(
    `SELECT * FROM verification_codes 
     WHERE phone = $1 AND code = $2 AND type = 'login'
     AND created_at > NOW() - INTERVAL '5 minutes'
     ORDER BY created_at DESC LIMIT 1`,
    [phone, code]
  );
  return result.rows[0];
}

export async function createCode(phone: string, code: string) {
  const p = getPool();
  // 删除旧验证码
  await p.query('DELETE FROM verification_codes WHERE phone = $1 AND type = $2', [phone, 'login']);
  // 创建新验证码
  const result = await p.query(
    `INSERT INTO verification_codes (phone, code, type, created_at)
     VALUES ($1, $2, 'login', NOW()) RETURNING *`,
    [phone, code]
  );
  return result.rows[0];
}

export async function verifyAdmin(username: string, password: string) {
  const p = getPool();
  const result = await p.query(
    'SELECT * FROM admins WHERE username = $1',
    [username]
  );
  if (result.rows.length === 0) return null;
  
  const admin = result.rows[0];
  const isValid = await bcrypt.compare(password, admin.password_hash);
  if (!isValid) return null;
  
  return admin;
}

export async function createAdmin(username: string, password: string) {
  const p = getPool();
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await p.query(
    `INSERT INTO admins (username, password_hash, created_at)
     VALUES ($1, $2, NOW()) RETURNING *`,
    [username, passwordHash]
  );
  return result.rows[0];
}
