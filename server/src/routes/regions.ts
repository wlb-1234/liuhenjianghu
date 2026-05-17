import { Router, Request, Response } from 'express';
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

const router = Router();

// 获取省份列表
router.get('/provinces', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT code, name FROM regions WHERE level = 1 ORDER BY code ASC'
    );
    res.json({ regions: rows });
  } catch (error) {
    console.error('获取省份列表错误:', error);
    res.status(500).json({ error: '获取省份列表失败' });
  }
});

// 获取城市列表
router.get('/cities/:provinceCode', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT code, name FROM regions WHERE level = 2 AND parent_code = $1 ORDER BY code ASC',
      [req.params.provinceCode]
    );
    res.json({ regions: rows });
  } catch (error) {
    console.error('获取城市列表错误:', error);
    res.status(500).json({ error: '获取城市列表失败' });
  }
});

// 获取区县列表
router.get('/districts/:cityCode', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT code, name FROM regions WHERE level = 3 AND parent_code = $1 ORDER BY code ASC',
      [req.params.cityCode]
    );
    res.json({ regions: rows });
  } catch (error) {
    console.error('获取区县列表错误:', error);
    res.status(500).json({ error: '获取区县列表失败' });
  }
});

// 获取乡镇列表
router.get('/towns/:districtCode', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT code, name FROM regions WHERE level = 4 AND parent_code = $1 ORDER BY code ASC',
      [req.params.districtCode]
    );
    res.json({ regions: rows });
  } catch (error) {
    console.error('获取乡镇列表错误:', error);
    res.status(500).json({ error: '获取乡镇列表失败' });
  }
});

// 获取区域名称
router.get('/name/:code', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT code, name, level, parent_code FROM regions WHERE code = $1',
      [req.params.code]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '区域不存在' });
    }
    
    const region = rows[0];
    const names: string[] = [region.name];
    
    // 递归获取上级区域名称
    if (region.level > 1 && region.parent_code) {
      let parentCode = region.parent_code;
      while (parentCode) {
        const { rows: parentRows } = await pool.query(
          'SELECT code, name, parent_code FROM regions WHERE code = $1',
          [parentCode]
        );
        if (parentRows.length > 0) {
          names.unshift(parentRows[0].name);
          parentCode = parentRows[0].parent_code;
        } else {
          break;
        }
      }
    }
    
    res.json({
      code: region.code,
      name: region.name,
      full_name: names.join(''),
      level: region.level
    });
  } catch (error) {
    console.error('获取区域名称错误:', error);
    res.status(500).json({ error: '获取区域名称失败' });
  }
});

export default router;
