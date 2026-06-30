/**
 * 阿里云 OSS 服务
 * 用于上传文件和生成签名URL
 * 支持配置缺失时优雅降级
 */

import OSS from 'ali-oss';

// OSS 配置（请替换为你的真实信息）
const OSS_CONFIG = {
  region: process.env.OSS_REGION || 'YOUR_REGION',                    // 例如：oss-cn-beijing
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'YOUR_ACCESS_KEY_SECRET',
  bucket: process.env.OSS_BUCKET || 'YOUR_BUCKET_NAME',
};

// 检查OSS是否已配置
const isOSSConfigured = () => {
  const configured = (
    OSS_CONFIG.region !== 'YOUR_REGION' &&
    OSS_CONFIG.accessKeyId !== 'YOUR_ACCESS_KEY_ID' &&
    OSS_CONFIG.accessKeySecret !== 'YOUR_ACCESS_KEY_SECRET' &&
    OSS_CONFIG.bucket !== 'YOUR_BUCKET_NAME'
  );
  console.log('[OSS] 配置检查:', {
    region: OSS_CONFIG.region,
    bucket: OSS_CONFIG.bucket,
    hasAccessKeyId: !!OSS_CONFIG.accessKeyId && OSS_CONFIG.accessKeyId !== 'YOUR_ACCESS_KEY_ID',
    hasAccessKeySecret: !!OSS_CONFIG.accessKeySecret && OSS_CONFIG.accessKeySecret !== 'YOUR_ACCESS_KEY_SECRET',
    configured
  });
  return configured;
};

// 仅在配置完整时初始化客户端
let client: OSS | null = null;
if (isOSSConfigured()) {
  client = new OSS({
    region: OSS_CONFIG.region,
    accessKeyId: OSS_CONFIG.accessKeyId,
    accessKeySecret: OSS_CONFIG.accessKeySecret,
    bucket: OSS_CONFIG.bucket,
  });
}

/**
 * 上传文件到 OSS
 * @param {Buffer} fileBuffer - 文件数据
 * @param {string} fileName - 文件名
 * @param {string} folder - 存储路径，例如 'posts/'、'avatars/'
 * @returns {Promise<{url: string, name: string, objectName: string}>}
 */
export async function uploadToOSS(fileBuffer: Buffer, fileName: string, folder: string = 'posts/'): Promise<{url: string; name: string; objectName: string}> {
  // 如果OSS未配置，抛出错误让调用方使用备选方案
  if (!client) {
    throw new Error('OSS未配置');
  }
  
  // 生成唯一文件名：时间戳+随机数+原文件名
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${getFileExtension(fileName)}`;
  const objectName = `${folder}${uniqueName}`;

  try {
    // 上传到 OSS
    const result = await client.put(objectName, fileBuffer);
    
    return {
      url: result.url,
      name: uniqueName,
      objectName: objectName
    };
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw new Error('文件上传失败');
  }
}

/**
 * 生成签名URL（用于私有文件的临时访问）
 * @param {string} objectName - OSS对象名
 * @param {number} expires - 有效期（秒），默认3600秒=1小时
 * @returns {Promise<string>}
 */
export async function generateSignedUrl(objectName: string, expires: number = 3600): Promise<string> {
  // 如果OSS未配置，返回空字符串
  if (!client) {
    console.warn('OSS未配置，无法生成签名URL');
    return '';
  }
  
  try {
    const url = await client.signatureUrl(objectName, { expires });
    return url;
  } catch (error) {
    console.error('生成签名URL失败:', error);
    throw new Error('生成访问链接失败');
  }
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop();
  return ext ? `.${ext.toLowerCase()}` : '';
}

/**
 * 判断是否为图片类型
 */
export function isImageType(mimeType: string): boolean {
  return Boolean(mimeType && mimeType.startsWith('image/'));
}

/**
 * 判断是否为视频类型
 */
export function isVideoType(mimeType: string): boolean {
  return Boolean(mimeType && mimeType.startsWith('video/'));
}
