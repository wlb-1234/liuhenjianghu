import express from 'express';
import { supportedLocales, defaultLocale, t, detectLocale } from '../utils/i18n.js';

const router = express.Router();

// 获取支持的语言列表
router.get('/locales', (req, res) => {
  res.json({
    success: true,
    data: supportedLocales
  });
});

// 获取默认语言
router.get('/locale/default', (req, res) => {
  res.json({
    success: true,
    data: {
      locale: defaultLocale,
      ...supportedLocales.find(l => l.code === defaultLocale)
    }
  });
});

// 获取翻译文本
router.get('/translate', (req, res) => {
  const { key, locale } = req.query;
  
  if (!key) {
    return res.status(400).json({ error: '缺少翻译键' });
  }
  
  const targetLocale = (locale as string) || detectLocale(req.headers['accept-language']);
  const text = t(key as string, targetLocale);
  
  res.json({
    success: true,
    data: {
      key,
      locale: targetLocale,
      text
    }
  });
});

// 批量获取翻译文本
router.post('/translate/batch', (req, res) => {
  const { keys, locale } = req.body;
  
  if (!keys || !Array.isArray(keys)) {
    return res.status(400).json({ error: '缺少翻译键列表' });
  }
  
  const targetLocale = locale || detectLocale(req.headers['accept-language']);
  const translations: Record<string, string> = {};
  
  for (const key of keys) {
    translations[key] = t(key, targetLocale);
  }
  
  res.json({
    success: true,
    data: {
      locale: targetLocale,
      translations
    }
  });
});

// 获取完整翻译文件
router.get('/translations/:locale', (req, res) => {
  const { locale } = req.params;
  
  const supported = supportedLocales.find(l => l.code === locale);
  if (!supported) {
    return res.status(404).json({ error: '不支持该语言' });
  }
  
  // 返回翻译数据（简化版，实际可从i18n.ts导入完整数据）
  res.json({
    success: true,
    data: {
      locale,
      name: supported.name,
      translations: {} // 完整翻译数据
    }
  });
});

// 自动检测语言
router.get('/locale/detect', (req, res) => {
  const locale = detectLocale(req.headers['accept-language']);
  const supported = supportedLocales.find(l => l.code === locale);
  
  res.json({
    success: true,
    data: {
      locale,
      ...supported
    }
  });
});

export default router;
