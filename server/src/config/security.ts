/**
 * 统一安全配置模块
 * 集中管理 JWT 密钥等敏感配置，避免各文件散落硬编码兜底弱密钥
 */

// JWT 签名密钥
// 生产环境必须通过环境变量 JWT_SECRET 提供强密钥；
// 若未配置则抛错拒绝启动，杜绝使用弱密钥兜底导致的伪造风险
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // 仅在非生产环境允许使用开发用密钥（仅用于本地联调）
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '✋ 生产环境必须设置强 JWT_SECRET（长度至少 32 位）。请在 .env 或环境变量中配置。'
      );
    }
    console.warn('⚠️  未设置 JWT_SECRET 或过短，使用开发密钥（仅限非生产环境）');
    return 'liuhen-jianghu-development-only-secret-2024!';
  }
  return secret;
}

export const JWT_SECRET = getJwtSecret();

// 验证码有效时长（毫秒）
export const SMS_CODE_TTL_MS = 5 * 60 * 1000;

// 全局限流默认配置
export const GLOBAL_RATE_LIMIT = {
  // 默认：每 IP 每分钟 120 次
  windowMs: 60 * 1000,
  limit: 120,
};

// 短信发送防刷配置
export const SMS_LIMIT = {
  // 同一手机号每 60 秒最多 1 次
  perPhoneWindowMs: 60 * 1000,
  perPhoneLimit: 1,
  // 同一 IP 每 10 分钟最多 5 次
  perIpWindowMs: 10 * 60 * 1000,
  perIpLimit: 5,
  // 同一手机号每日最多 10 次
  perPhoneDailyLimit: 10,
};

// 登录防刷配置
export const LOGIN_LIMIT = {
  // 同一 IP 每 10 分钟最多 20 次登录尝试
  perIpWindowMs: 10 * 60 * 1000,
  perIpLimit: 20,
};

// Admin 登录失败锁定配置
export const ADMIN_LOGIN_LIMIT = {
  // 同一 IP：10 分钟内失败 5 次锁定
  failWindowMs: 10 * 60 * 1000,
  failLimit: 5,
  lockDurationMs: 10 * 60 * 1000,
};