/**
 * IP白名单管理
 */

export interface WhitelistRule {
  id: string;
  pattern: string;       // IP地址或CIDR格式
  description?: string;
  createdAt: string;
}

export interface IPWhitelistConfig {
  enabled: boolean;
  rules: WhitelistRule[];
  allowPrivate: boolean;  // 是否允许私有IP访问
}

// 内存存储
let whitelistConfig: IPWhitelistConfig = {
  enabled: false,
  rules: [],
  allowPrivate: true
};

// 默认允许的私有IP范围
const PRIVATE_IP_PATTERNS = [
  /^127\./,           // localhost
  /^10\./,            // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
  /^192\.168\./,       // 192.168.0.0/16
  /^::1$/,            // IPv6 localhost
  /^fe80:/i,          // IPv6 link-local
];

/**
 * 检查IP是否为私有IP
 */
export function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(ip));
}

/**
 * 检查IP是否匹配规则
 */
export function matchIP(ip: string, pattern: string): boolean {
  // 支持CIDR格式 (如 192.168.1.0/24)
  if (pattern.includes('/')) {
    return matchCIDR(ip, pattern);
  }
  // 支持通配符 (如 192.168.1.*)
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '\\d{1,3}') + '$');
    return regex.test(ip);
  }
  // 精确匹配
  return ip === pattern;
}

/**
 * 检查IP是否在CIDR范围内
 */
function matchCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = parseInt(bits, 10);
  
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  const maskNum = (0xFFFFFFFF << (32 - mask)) >>> 0;
  
  return (ipNum & maskNum) === (rangeNum & maskNum);
}

/**
 * IP转数字
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

/**
 * 检查IP是否在白名单中
 */
export function isIPWhitelisted(ip: string): boolean {
  // 如果未启用白名单，允许所有IP
  if (!whitelistConfig.enabled) {
    return true;
  }
  
  // 检查私有IP
  if (whitelistConfig.allowPrivate && isPrivateIP(ip)) {
    return true;
  }
  
  // 检查白名单规则
  return whitelistConfig.rules.some(rule => matchIP(ip, rule.pattern));
}

/**
 * 获取白名单配置
 */
export function getWhitelistConfig(): IPWhitelistConfig {
  return { ...whitelistConfig };
}

/**
 * 设置白名单配置
 */
export function setWhitelistConfig(config: Partial<IPWhitelistConfig>): void {
  if (config.enabled !== undefined) {
    whitelistConfig.enabled = config.enabled;
  }
  if (config.allowPrivate !== undefined) {
    whitelistConfig.allowPrivate = config.allowPrivate;
  }
  if (config.rules !== undefined) {
    whitelistConfig.rules = config.rules;
  }
}

/**
 * 添加白名单规则
 */
export function addWhitelistRule(rule: Omit<WhitelistRule, 'id' | 'createdAt'>): WhitelistRule {
  const newRule: WhitelistRule = {
    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    pattern: rule.pattern,
    description: rule.description,
    createdAt: new Date().toISOString()
  };
  whitelistConfig.rules.push(newRule);
  return newRule;
}

/**
 * 删除白名单规则
 */
export function removeWhitelistRule(id: string): boolean {
  const index = whitelistConfig.rules.findIndex(r => r.id === id);
  if (index !== -1) {
    whitelistConfig.rules.splice(index, 1);
    return true;
  }
  return false;
}
