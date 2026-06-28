/**
 * 微信支付配置
 * 
 * 配置说明：
 * 1. MCHID - 商户号（已获取）
 * 2. API密钥 - 需要从微信支付商户后台获取
 * 3. AppID - 微信开放平台移动应用ID（审核中）
 */

export const WECHAT_PAY_CONFIG = {
  // 商户号
  MCHID: process.env.WX_MCHID || '1114226626',
  
  // API密钥（32位）
  API_KEY: process.env.WX_API_KEY || '',
  
  // AppID（移动应用ID）
  APPID: process.env.WX_APPID || 'wxa39303f2ff21a87c',
  
  // 公众号AppID（如果有）
  PUBLIC_APPID: process.env.WX_PUBLIC_APPID || '',
  
  // 回调地址（需要公网可访问）
  NOTIFY_URL: process.env.WX_NOTIFY_URL || 'https://liuhenjianghu.com/api/v1/payment/notify',
  
  // 统一下单接口
  UNIFIED_ORDER_URL: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
  
  // 查询订单接口
  ORDER_QUERY_URL: 'https://api.mch.weixin.qq.com/pay/orderquery',
  
  // 申请退款接口
  REFUND_URL: 'https://api.mch.weixin.qq.com/secapi/pay/refund',
  
  // 交易类型：APP
  TRADE_TYPE_APP: 'APP',
  
  // 交易类型：NATIVE（扫码支付）
  TRADE_TYPE_NATIVE: 'NATIVE',
  
  // 交易类型：JSAPI（公众号支付）
  TRADE_TYPE_JSAPI: 'JSAPI',
};

export default WECHAT_PAY_CONFIG;
