/**
 * 阿里云短信服务
 */
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

// 阿里云短信配置
const SMS_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  endpoint: 'dysmsapi.aliyuncs.com',
  signName: process.env.ALIYUN_SMS_SIGN_NAME || '', // 短信签名
  templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || '', // 短信模板Code
};

// 验证码存储（临时存储，生产环境应使用 Redis）
const verificationCodes = new Map<string, { code: string; expires: number }>();

/**
 * 创建短信客户端
 */
function createClient(): Dysmsapi20170525 {
  const config = new $OpenApi.Config({
    accessKeyId: SMS_CONFIG.accessKeyId,
    accessKeySecret: SMS_CONFIG.accessKeySecret,
  });
  config.endpoint = SMS_CONFIG.endpoint;
  return new Dysmsapi20170525(config);
}

/**
 * 发送短信验证码
 * @param phone 手机号
 * @returns 验证码（用于测试）
 */
export async function sendVerificationCode(phone: string): Promise<{ success: boolean; code?: string; error?: string }> {
  // 检查是否配置了阿里云短信
  if (!SMS_CONFIG.accessKeyId || !SMS_CONFIG.accessKeySecret || !SMS_CONFIG.signName || !SMS_CONFIG.templateCode) {
    // 未配置短信服务，使用模拟模式
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SMS] 模拟模式 - 验证码 ${code} 发送至 ${phone}`);
    
    // 存储验证码（5分钟有效）
    verificationCodes.set(phone, {
      code,
      expires: Date.now() + 5 * 60 * 1000,
    });
    
    return { success: true, code };
  }

  try {
    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 创建客户端
    const client = createClient();
    
    // 构建请求
    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: SMS_CONFIG.signName,
      templateCode: SMS_CONFIG.templateCode,
      templateParam: JSON.stringify({ code }),
    });
    
    // 发送短信
    const runtime = new $Util.RuntimeOptions({});
    const result = await client.sendSmsWithOptions(sendSmsRequest, runtime);
    
    if (result.body?.code === 'OK') {
      // 存储验证码（5分钟有效）
      verificationCodes.set(phone, {
        code,
        expires: Date.now() + 5 * 60 * 1000,
      });
      
      console.log(`[SMS] 验证码 ${code} 已发送至 ${phone}`);
      return { success: true, code };
    } else {
      console.error(`[SMS] 发送失败: ${result.body?.message}`);
      return { success: false, error: result.body?.message || '发送失败' };
    }
  } catch (error: any) {
    console.error('[SMS] 发送短信错误:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 验证验证码
 * @param phone 手机号
 * @param code 验证码
 * @returns 是否有效
 */
export function verifyCode(phone: string, code: string): boolean {
  const stored = verificationCodes.get(phone);
  
  if (!stored) {
    return false;
  }
  
  // 检查是否过期
  if (Date.now() > stored.expires) {
    verificationCodes.delete(phone);
    return false;
  }
  
  // 验证验证码
  if (stored.code === code) {
    verificationCodes.delete(phone);
    return true;
  }
  
  return false;
}

/**
 * 检查短信服务是否已配置
 */
export function isSmsConfigured(): boolean {
  return !!(SMS_CONFIG.accessKeyId && SMS_CONFIG.accessKeySecret && SMS_CONFIG.signName && SMS_CONFIG.templateCode);
}
