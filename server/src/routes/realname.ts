import { Router, Request, Response } from 'express';
import { getPool } from '../config/database.js';
import { optionalAuth } from '../middleware/auth';
import { verifyAdmin } from '../middleware/admin';

const router = Router();

// 阿里云实名核验接口（云市场「身份证二要素核验」）
// 通过 .env 注入 ALI_REALNAME_APPCODE，未配置则保持原有「人工审核」流程
const ALI_REALNAME_APPCODE = process.env.ALI_REALNAME_APPCODE || '';
const ALI_REALNAME_URL = 'https://lfeid.market.alicloudapi.com/idcheck/lifePost';

/**
 * 调用阿里云身份证二要素核验
 * @returns { matched: boolean | null } matched=true 匹配；false 不匹配；null 调用失败/无法判定（退回人工审核）
 */
async function aliRealNameCheck(realName: string, idCard: string): Promise<{ matched: boolean | null; reason?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(ALI_REALNAME_URL, {
      method: 'POST',
      headers: {
        'Authorization': `APPCODE ${ALI_REALNAME_APPCODE}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `cardNo=${encodeURIComponent(idCard)}&realName=${encodeURIComponent(realName)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = (await resp.json()) as any;
    // 返回结构: { error_code, reason, result:{ realname, idcard, isok, IdCardInfor }, sn }
    const isok = data?.result?.isok === true;
    const errCode = String(data?.error_code ?? '').trim();
    if (isok) return { matched: true };
    // error_code === '0' 且 result.isok === false → 明确不匹配
    if (errCode === '0') return { matched: false, reason: data?.reason || '姓名与身份证号不匹配' };
    return { matched: null, reason: data?.reason || '核验服务繁忙，请稍后重试' };
  } catch (e: any) {
    console.error('阿里云实名核验调用失败:', e?.message || e);
    return { matched: null, reason: '核验服务繁忙，请稍后重试' };
  }
}

// 初始化表结构
router.get('/init-table', async (req: Request, res: Response) => {
  try {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS realname_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        real_name VARCHAR(50) NOT NULL,
        id_card VARCHAR(18) NOT NULL,
        id_card_front TEXT,
        id_card_back TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        reject_reason TEXT,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.json({ success: true, message: '表创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建表失败' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：GET /api/v1/realname/status
 * 说明：获取当前用户实名认证状态
 */
router.get('/status', optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!(req as any).userId) {
      return res.json({ verified: false, status: null });
    }

    const result = await getPool().query(
      'SELECT status, real_name, reject_reason FROM realname_verifications WHERE user_id = $1',
      [(req as any).userId]
    );

    if (result.rows.length === 0) {
      return res.json({ verified: false, status: null });
    }

    const verification = result.rows[0];
    return res.json({
      verified: verification.status === 'approved',
      status: verification.status,
      real_name: verification.real_name ? verification.real_name.charAt(0) + '***' : null,
      reject_reason: verification.reject_reason,
    });
  } catch (error: any) {
    console.error('获取实名认证状态失败:', error);
    return res.status(500).json({ error: '获取认证状态失败' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：POST /api/v1/realname
 * Body 参数：realName: string, idCard: string, idCardFront?: string, idCardBack?: string
 * 说明：提交实名认证申请
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!(req as any).userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    const { idCardFront, idCardBack } = req.body;
    const realName = req.body.realName;
    const idCard = req.body.idCard;

    // 统一清洗：去空格、身份证转大写
    const cleanName = String(realName || '').trim();
    const cleanCard = String(idCard || '').trim().toUpperCase();

    if (!cleanName || !cleanCard) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 身份证格式：15 位或 18 位
    if (!/^(\d{15}|\d{17}[0-9X])$/.test(cleanCard)) {
      return res.status(400).json({ error: '身份证格式不正确' });
    }

    // 本地自动初审：18 位证件做校验位算法校验(GB 11643-1999)，并校验生日合法
    if (cleanCard.length === 18) {
      const check = isValidCNID18(cleanCard);
      if (!check.valid) {
        return res.status(400).json({ error: check.reason });
      }
    } else {
      // 15 位证件按出生日期补全后校验生日是否合法
      const birth = `19${cleanCard.substr(6, 6)}`;
      if (!isValidDate(birth)) {
        return res.status(400).json({ error: '身份证出生日期不正确' });
      }
    }

    // 检查是否有待审核或已通过的申请
    const existing = await getPool().query(
      'SELECT status FROM realname_verifications WHERE user_id = $1',
      [(req as any).userId]
    );

    if (existing.rows.length > 0) {
      const currentStatus = existing.rows[0].status;
      if (currentStatus === 'pending') {
        return res.status(400).json({ error: '您有待审核的申请，请等待审核结果' });
      }
      if (currentStatus === 'approved') {
        return res.status(400).json({ error: '您已完成实名认证' });
      }
      // rejected：允许重新提交
    }

    // 阿里云自动核验（未配置 AppCode 时跳过，走人工审核）
    let finalStatus = 'pending';
    let finalReason: string | null = null;
    let isAuto = false;
    if (ALI_REALNAME_APPCODE) {
      const check = await aliRealNameCheck(cleanName, cleanCard);
      if (check.matched === true) {
        finalStatus = 'approved';
        isAuto = true;
      } else if (check.matched === false) {
        finalStatus = 'rejected';
        finalReason = check.reason || '姓名与身份证号不匹配';
      }
      // matched === null：核验服务异常/无法判定 → 保留 pending，转人工复核
    }

    // 插入或更新认证申请
    const insertResult = await getPool().query(
      `INSERT INTO realname_verifications (user_id, real_name, id_card, id_card_front, id_card_back, status, reject_reason, reviewed_at, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) 
       DO UPDATE SET real_name = $2, id_card = $3, id_card_front = $4, id_card_back = $5, 
                     status = $6, reject_reason = $7, reviewed_at = $8, reviewed_by = $9`,
      [(req as any).userId, cleanName, cleanCard, idCardFront || null, idCardBack || null,
       finalStatus, finalReason, isAuto ? new Date() : null, isAuto ? 0 : null]
    );

    if (finalStatus === 'approved') {
      return res.json({ success: true, status: 'approved', message: '核验通过，已完成实名认证' });
    }
    if (finalStatus === 'rejected') {
      return res.status(400).json({ error: finalReason || '姓名与身份证号不匹配' });
    }
    return res.json({ success: true, status: 'pending', message: '提交成功，请等待审核' });
  } catch (error: any) {
    console.error('提交实名认证失败:', error);
    return res.status(500).json({ error: '提交失败，请稍后重试' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：GET /api/v1/realname/admin/list
 * 说明：管理后台获取认证列表
 */
router.get('/admin/list', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    
    if (status) {
      params.push(status);
      whereClause = `WHERE rv.status = $${params.length}`;
    }

    const countResult = await getPool().query(
      `SELECT COUNT(*) FROM realname_verifications rv ${whereClause}`,
      params
    );

    params.push(pageSize, offset);
    const result = await getPool().query(
      `SELECT rv.*, u.nickname, u.avatar 
       FROM realname_verifications rv 
       LEFT JOIN users u ON rv.user_id = u.id 
       ${whereClause}
       ORDER BY rv.created_at DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      list: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('获取认证列表失败:', error);
    return res.status(500).json({ error: '获取列表失败' });
  }
});

/**
 * 服务端文件：server/src/routes/realname.ts
 * 接口：PUT /api/v1/realname/admin/:id/review
 * Body 参数：status: 'approved' | 'rejected', rejectReason?: string
 * 说明：管理后台审核认证申请
 */
router.put('/admin/:id/review', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '状态参数错误' });
    }

    const result = await getPool().query(
      `UPDATE realname_verifications 
       SET status = $1, reject_reason = $2, reviewed_at = NOW(), reviewed_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, rejectReason || null, (req as any).adminUser?.id ?? 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '认证申请不存在' });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('审核认证申请失败:', error);
    return res.status(500).json({ error: '审核失败' });
  }
});

/** 判断 yyyymmdd/yyyy-mm-dd 是否为真实日期 */
function isValidDate(birth: string): boolean {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(birth);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (y < 1900 || y > new Date().getFullYear() || mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** 18 位身份证本地校验位校验(GB 11643-1999)，返回是否合法及原因 */
function isValidCNID18(id: string): { valid: boolean; reason?: string } {
  // 截取出生日期(第7-14位)
  const birth = `${id.substr(6, 4)}${id.substr(10, 2)}${id.substr(12, 2)}`;
  if (!isValidDate(birth)) {
    return { valid: false, reason: '身份证出生日期不正确' };
  }
  // 出生年份前后合理范围
  const y = +id.substr(6, 4);
  if (y < 1930 || y > new Date().getFullYear() - 14) {
    return { valid: false, reason: '身份证出生日期超出合理范围' };
  }
  // 前两位行政区划号段粗校验(11-82)
  const region = +id.substr(0, 2);
  if (region < 11 || region > 82) {
    return { valid: false, reason: '身份证行政区划不正确' };
  }
  // 校验位算法
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = '10X98765432';
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += +id[i] * weights[i];
  const expect = codes[sum % 11];
  const actual = id[17];
  if (expect !== actual) {
    return { valid: false, reason: '身份证校验位不正确，请核对证件号' };
  }
  return { valid: true };
}

export default router;
