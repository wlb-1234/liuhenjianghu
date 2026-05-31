import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { loadEnv, getDbUrl } from 'coze-coding-dev-sdk';

const router = Router();

// 延迟初始化数据库连接
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    loadEnv();
    const dbUrl = getDbUrl();
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// 获取所有地域列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const result = await p.query(
      'SELECT id, name, description, parent_id as "parentId", level, sort_order as "sortOrder", created_at as "createdAt" FROM regions WHERE level = 1 ORDER BY sort_order'
    );
    res.json({ regions: result.rows });
  } catch (error) {
    console.error('获取地域列表失败:', error);
    res.status(500).json({ error: '获取地域列表失败' });
  }
});

// 获取子地域
router.get('/:parentId/children', async (req: Request, res: Response) => {
  try {
    const { parentId } = req.params;
    const p = getPool();
    const result = await p.query(
      'SELECT id, name, description, parent_id as "parentId", level, sort_order as "sortOrder", created_at as "createdAt" FROM regions WHERE parent_id = $1 ORDER BY sort_order',
      [parentId]
    );
    res.json({ regions: result.rows });
  } catch (error) {
    console.error('获取子地域失败:', error);
    res.status(500).json({ error: '获取子地域失败' });
  }
});

export default router;
