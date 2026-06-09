import { getPool } from '../config/database';

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
    `UPDATE users SET member_level = $1, member_expire_at = $2
     WHERE id = $3 RETURNING *`,
    [level, expireAt || null, userId]
  );
  return result.rows[0];
}
