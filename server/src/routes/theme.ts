import express from 'express';
import { query } from '../config/database.js';
import { lightTheme, darkTheme, getTheme, ThemeMode } from '../utils/theme.js';

const router = express.Router();

// 获取用户主题设置
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.json({ success: true, data: { mode: 'system', colors: lightTheme } });
    }

    const result = await query('SELECT theme_mode FROM user_settings WHERE user_id = $1', [userId]);
    const mode = (result.rows[0]?.theme_mode || 'system') as ThemeMode;
    const colors = getTheme(mode);

    res.json({ success: true, data: { mode, colors } });
  } catch (error) {
    res.json({ success: true, data: { mode: 'system', colors: lightTheme } });
  }
});

// 设置用户主题
router.post('/', async (req, res) => {
  try {
    const { userId, mode } = req.body;

    if (!userId) return res.status(400).json({ error: '缺少用户ID' });
    if (!['light', 'dark', 'system'].includes(mode)) {
      return res.status(400).json({ error: '无效的主题模式' });
    }

    await query(
      `INSERT INTO user_settings (user_id, theme_mode, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (user_id) DO UPDATE SET theme_mode = $2, updated_at = NOW()`,
      [userId, mode]
    );

    const colors = getTheme(mode as ThemeMode);
    res.json({ success: true, message: '主题已更新', data: { mode, colors } });
  } catch (error) {
    res.status(500).json({ error: '保存失败' });
  }
});

// 获取主题CSS
router.get('/css', (req, res) => {
  const { mode } = req.query;
  const themeMode = (mode as ThemeMode) || 'light';
  const colors = getTheme(themeMode);

  const css = `:root {
  --color-primary: ${colors.primary};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-secondary: ${colors.textSecondary};
  --color-border: ${colors.border};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
}
:root { color-scheme: ${themeMode === 'dark' ? 'dark' : 'light'}; }`;

  res.setHeader('Content-Type', 'text/css');
  res.send(css);
});

// 获取所有主题预览
router.get('/previews', (req, res) => {
  res.json({ success: true, data: { light: lightTheme, dark: darkTheme } });
});

export default router;
