/**
 * IPFS 存储服务
 * 使用 Pinata 作为 IPFS 网关
 * 
 * 免费额度：1GB 存储
 * 申请地址：https://app.pinata.cloud/
 */

import { Readable } from 'stream';

// Pinata API 配置
// 请替换为你自己的 Pinata API Key
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_API_SECRET = process.env.PINATA_API_SECRET || '';

// IPFS 公开网关
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
const PUBLIC_IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

/**
 * 上传文件到 IPFS
 * @param buffer 文件 Buffer
 * @param filename 文件名
 * @param options 额外选项
 * @returns IPFS CID (Content Identifier)
 */
export async function uploadToIPFS(
  buffer: Buffer,
  filename: string,
  options?: {
    pinataMetadata?: Record<string, any>;
    pinataOptions?: Record<string, any>;
  }
): Promise<{ cid: string; ipfsUrl: string; gatewayUrl: string }> {
  // 如果没有配置 Pinata，使用备用的本地存储
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    console.warn('Pinata API 未配置，使用本地存储');
    return uploadToLocalFallback(buffer, filename);
  }

  try {
    const formData = new (await import('form-data')).default();
    
    // 创建可读流
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    
    // 添加文件
    const blob = new Blob([buffer]);
    const file = new File([blob], filename);
    formData.append('file', file);
    
    // 添加元数据
    const metadata = {
      name: filename,
      ...options?.pinataMetadata,
    };
    formData.append('pinataMetadata', JSON.stringify(metadata));
    
    // 添加选项
    if (options?.pinataOptions) {
      formData.append('pinataOptions', JSON.stringify(options.pinataOptions));
    }
    
    // 发送请求
    const response = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${error}`);
    }
    
    const result = await response.json();
    
    return {
      cid: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${IPFS_GATEWAY}${result.IpfsHash}`,
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * 从 IPFS 获取文件
 * @param cid IPFS CID
 * @returns 文件 Buffer
 */
export async function fetchFromIPFS(cid: string): Promise<Buffer> {
  const response = await fetch(`${IPFS_GATEWAY}${cid}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}

/**
 * 获取 IPFS 网关 URL
 * @param cidOrUrl CID 或 IPFS URL
 * @returns 公开可访问的 URL
 */
export function getIPFSGatewayUrl(cidOrUrl: string): string {
  // 如果已经是完整 URL，直接返回
  if (cidOrUrl.startsWith('http')) {
    return cidOrUrl;
  }
  
  // 移除 ipfs:// 前缀
  const cid = cidOrUrl.replace('ipfs://', '');
  
  return `${IPFS_GATEWAY}${cid}`;
}

/**
 * 本地备选存储（当 Pinata 未配置时使用）
 */
async function uploadToLocalFallback(
  buffer: Buffer,
  filename: string
): Promise<{ cid: string; ipfsUrl: string; gatewayUrl: string }> {
  // 生成唯一文件名
  const timestamp = Date.now();
  const ext = filename.split('.').pop() || 'jpg';
  const storedFilename = `${timestamp}_${Math.random().toString(36).slice(2)}.${ext}`;
  
  // 保存到本地 uploads 目录
  const fs = await import('fs');
  const path = await import('path');
  
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, storedFilename);
  fs.writeFileSync(filePath, buffer);
  
  // 生成本地 URL（实际部署时应该是 CDN 或对象存储）
  const baseUrl = process.env.BASE_URL || 'http://localhost:9091';
  const localUrl = `${baseUrl}/uploads/${storedFilename}`;
  
  return {
    cid: storedFilename, // 使用文件名作为"伪CID"
    ipfsUrl: localUrl,
    gatewayUrl: localUrl,
  };
}

/**
 * 删除 IPFS 上的文件（取消固定）
 * 注意：Pinata 免费版不支持此功能
 */
export async function unpinFromIPFS(cid: string): Promise<void> {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    console.warn('Pinata API 未配置，跳过 unpin');
    return;
  }
  
  const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
    method: 'DELETE',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_API_SECRET,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to unpin: ${response.statusText}`);
  }
}

/**
 * 获取 Pinata 存储使用情况
 */
export async function getPinataUsage(): Promise<{
  pinned: number;
  pinnedSize: number;
  maxSize: number;
}> {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    return {
      pinned: 0,
      pinnedSize: 0,
      maxSize: 1024 * 1024 * 1024, // 1GB
    };
  }
  
  const response = await fetch('https://api.pinata.cloud/data/userPinnedDataTotal', {
    method: 'GET',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_API_SECRET,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get usage: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    pinned: data.pin_count || 0,
    pinnedSize: data.pin_size || 0,
    maxSize: 1024 * 1024 * 1024, // 1GB
  };
}

export default {
  uploadToIPFS,
  fetchFromIPFS,
  getIPFSGatewayUrl,
  unpinFromIPFS,
  getPinataUsage,
};
