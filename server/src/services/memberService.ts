import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

// 加载环境变量
loadEnv();
const dbUrl = getDbUrl();

// 创建连接池
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

export interface MemberLevel {
  level: number;
  name: string;
  price: number;
  region_limit: number;
  daily_limit: number;
  retention_days: number;
  can_pin: boolean;
}

// 获取会员等级信息
export async function getMemberLevel(level: number): Promise<MemberLevel> {
  const { rows } = await pool.query(
    'SELECT * FROM member_levels WHERE level = $1',
    [level]
  );
  
  if (rows.length === 0) {
    // 返回默认的L0等级
    return {
      level: 0,
      name: '江湖散人',
      price: 0,
      region_limit: 4,
      daily_limit: 10,
      retention_days: 7,
      can_pin: false
    };
  }
  
  return rows[0];
}

// 获取所有会员等级
export async function getAllMemberLevels(): Promise<MemberLevel[]> {
  const { rows } = await pool.query(
    'SELECT * FROM member_levels ORDER BY level ASC'
  );
  return rows;
}

// 获取用户信息（带会员等级）
export async function getUserWithMemberLevel(userId: number) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (rows.length === 0) {
    return null;
  }
  
  const user = rows[0];
  const memberLevel = await getMemberLevel(user.member_level);
  
  return {
    ...user,
    member_info: memberLevel
  };
}
