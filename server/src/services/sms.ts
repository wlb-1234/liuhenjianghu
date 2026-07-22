/**
 * 阿里云短信服务 - 使用 HTTP API 直接调用（避免 SDK 兼容性问题）
 */
import crypto from 'crypto';

const ALIYUN_ACCESS_KEY_ID = process.env.SMS_ACCESS_KEY_ID || process.env.ALIYUN_ACCESS_KEY_ID || '';
const ALIYUN_ACCESS_KEY_SECRET = process.env.SMS_ACCESS_KEY_SECRET || process.env.ALIYUN_ACCESS_KEY_SECRET || '';
const SMS_SIGN_NAME = process.env.SMS_SIGN_NAME || '';
const SMS_TEMPLATE_CODE = process.env.SMS_TEMPLATE_CODE || '';

/**
 * 生成阿里云 API 签名
 */
function sign(params: Record<string, string>, accessKeySecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;
  const hmac = crypto.createHmac('sha1', accessKeySecret + '&');
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

/**
 * 发送短信验证码
 * @param phone 手机号
 * @param code 验证码
 */
export async function sendVerificationSMS(phone: string, code: string): Promise<boolean> {
  if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET) {
    console.error('[SMS] 阿里云 AccessKey 未配置');
    return false;
  }

  if (!SMS_SIGN_NAME || !SMS_TEMPLATE_CODE) {
    console.error('[SMS] 短信签名或模板未配置');
    return false;
  }

  try {
    const nonce = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/\.\d{3}/, '');

    const params: Record<string, string> = {
      AccessKeyId: ALIYUN_ACCESS_KEY_ID,
      Action: 'SendSms',
      Format: 'JSON',
      PhoneNumbers: phone,
      RegionId: 'cn-hangzhou',
      SignName: SMS_SIGN_NAME,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: nonce,
      SignatureVersion: '1.0',
      TemplateCode: SMS_TEMPLATE_CODE,
      TemplateParam: JSON.stringify({ code }),
      Timestamp: timestamp,
      Version: '2017-05-25',
    };

    const signature = sign(params, ALIYUN_ACCESS_KEY_SECRET);
    params.Signature = signature;

    const queryString = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = `https://dysmsapi.aliyuncs.com/?${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await response.json() as any;

    if (result.Code === 'OK') {
      console.log(`[SMS] ✅ 验证码已发送至 ${phone}`);
      return true;
    } else {
      console.error(`[SMS] ❌ 发送失败:`, result);
      return false;
    }
  } catch (error: any) {
    console.error('[SMS] ❌ 发送异常:', error.message);
    return false;
  }
}

/**
 * 检查短信服务是否已配置
 */
export function isSMSConfigured(): boolean {
  return !!(ALIYUN_ACCESS_KEY_ID && ALIYUN_ACCESS_KEY_SECRET && SMS_SIGN_NAME && SMS_TEMPLATE_CODE);
}
