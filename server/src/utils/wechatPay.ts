/**
 * 微信支付工具函数
 */
import crypto from 'crypto';
import WECHAT_PAY_CONFIG from '../config/wechat';

/**
 * 生成随机字符串
 */
export function generateNonceStr(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

/**
 * 生成订单号
 * 格式：MCHID + 时间戳 + 随机数
 */
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${WECHAT_PAY_CONFIG.MCHID}${timestamp}${random}`;
}

/**
 * 生成签名
 * @param params 要签名的参数对象
 * @param key API密钥
 */
export function generateSign(params: Record<string, string | number>, key: string): string {
  // 1. 按字典序排序参数
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 拼接字符串
  let signStr = '';
  for (const k of sortedKeys) {
    if (params[k] !== '' && params[k] !== undefined && params[k] !== null) {
      signStr += `${k}=${params[k]}&`;
    }
  }
  
  // 3. 拼接API密钥
  signStr += `key=${key}`;
  
  // 4. MD5签名并转大写
  return crypto
    .createHash('md5')
    .update(signStr, 'utf8')
    .digest('hex')
    .toUpperCase();
}

/**
 * 验证签名
 */
export function verifySign(params: Record<string, string>, sign: string, key: string): boolean {
  const calculatedSign = generateSign(params, key);
  return calculatedSign === sign;
}

/**
 * 将对象转换为XML
 */
export function objectToXml(obj: Record<string, string>): string {
  let xml = '<xml>';
  for (const [key, value] of Object.entries(obj)) {
    xml += `<${key}><![CDATA[${value}]]></${key}>`;
  }
  xml += '</xml>';
  return xml;
}

/**
 * 将XML转换为对象
 */
export function xmlToObject(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)><!\[CDATA\[([^\]]*)\]\]><\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

/**
 * 生成预支付订单参数（App端调起支付需要）
 */
export function generateAppPayParams(prepayId: string): {
  appid: string;
  partnerid: string;
  prepayid: string;
  package: string;
  noncestr: string;
  timestamp: string;
  sign: string;
} {
  const nonceStr = generateNonceStr();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const params: Record<string, string> = {
    appid: WECHAT_PAY_CONFIG.APPID,
    partnerid: WECHAT_PAY_CONFIG.MCHID,
    prepayid: prepayId,
    package: 'Sign=WXPay',
    noncestr: nonceStr,
    timestamp,
  };
  
  const sign = generateSign(params, WECHAT_PAY_CONFIG.API_KEY);
  
  return {
    ...params,
    sign,
  };
}

export default {
  generateNonceStr,
  generateOrderId,
  generateSign,
  verifySign,
  objectToXml,
  xmlToObject,
  generateAppPayParams,
};
