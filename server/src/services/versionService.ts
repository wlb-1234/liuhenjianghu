/**
 * 版本管理服务
 * 处理应用版本检查和更新提醒
 */

import { getPool } from '../config/database.js';

// 版本信息接口
export interface AppVersion {
  id: number;
  platform: 'ios' | 'android' | 'both';
  version: string;
  build_number: number;
  min_supported_version: string;
  update_type: 'optional' | 'required' | 'none';
  update_url: string;
  release_notes: string;
  force_update: boolean;
  published_at: string | null;
  created_at: string;
}

/**
 * 获取最新版本信息
 */
export async function getLatestVersion(platform: 'ios' | 'android'): Promise<AppVersion | null> {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM app_versions 
       WHERE (platform = $1 OR platform = 'both') 
       AND published_at IS NOT NULL 
       AND published_at <= NOW()
       ORDER BY build_number DESC 
       LIMIT 1`,
      [platform]
    );
    
    return result.rows[0] || null;
  } catch (error: any) {
    console.error('[版本管理] 获取版本信息失败:', error.message);
    return null;
  }
}

/**
 * 检查是否需要更新
 */
export async function checkUpdate(
  platform: 'ios' | 'android',
  currentVersion: string,
  currentBuildNumber: number
): Promise<{
  needUpdate: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  releaseNotes: string;
  updateUrl: string;
}> {
  const latest = await getLatestVersion(platform);
  
  if (!latest) {
    return {
      needUpdate: false,
      forceUpdate: false,
      latestVersion: currentVersion,
      releaseNotes: '',
      updateUrl: ''
    };
  }
  
  const needUpdate = latest.build_number > currentBuildNumber;
  
  return {
    needUpdate,
    forceUpdate: latest.force_update || latest.update_type === 'required',
    latestVersion: latest.version,
    releaseNotes: latest.release_notes || '',
    updateUrl: latest.update_url || ''
  };
}

/**
 * 发布新版本
 */
export async function publishVersion(versionData: {
  platform: 'ios' | 'android' | 'both';
  version: string;
  buildNumber: number;
  minSupportedVersion?: string;
  updateType?: 'optional' | 'required' | 'none';
  updateUrl?: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
}): Promise<{ success: boolean; message: string }> {
  try {
    const pool = getPool();
    
    await pool.query(
      `INSERT INTO app_versions 
       (platform, version, build_number, min_supported_version, update_type, update_url, release_notes, force_update, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        versionData.platform,
        versionData.version,
        versionData.buildNumber,
        versionData.minSupportedVersion || '1.0.0',
        versionData.updateType || 'optional',
        versionData.updateUrl || '',
        versionData.releaseNotes || '',
        versionData.forceUpdate || false
      ]
    );
    
    return { success: true, message: '版本发布成功' };
  } catch (error: any) {
    console.error('[版本管理] 发布版本失败:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * 比较版本号
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
