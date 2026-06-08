/**
 * 敏感词过滤服务
 * 使用 Trie 树实现高效匹配
 */

// 敏感词节点
class TrieNode {
  children: Map<string, TrieNode> = new Map()
  isEnd: boolean = false
  word: string = ''
  level: number = 1
}

// Trie 树
export class SensitiveWordTrie {
  private root: TrieNode = new TrieNode()

  // 添加敏感词
  insert(word: string, level: number = 1): void {
    let node = this.root
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode())
      }
      node = node.children.get(char)!
    }
    node.isEnd = true
    node.word = word
    node.level = level
  }

  // 批量添加敏感词
  insertMany(words: Array<{ word: string; level?: number }>): void {
    for (const { word, level = 1 } of words) {
      this.insert(word, level)
    }
  }

  // 查找敏感词（返回找到的第一个）
  find(text: string): { word: string; level: number } | null {
    let node = this.root
    let lastMatch: { word: string; level: number } | null = null
    let highestLevel = 0

    for (const char of text.toLowerCase()) {
      if (!node.children.has(char)) {
        // 重新从根节点开始
        node = this.root
        if (lastMatch) {
          return lastMatch
        }
        continue
      }
      node = node.children.get(char)!

      if (node.isEnd && node.level > highestLevel) {
        highestLevel = node.level
        lastMatch = { word: node.word, level: node.level }
      }
    }

    return lastMatch
  }

  // 查找所有敏感词
  findAll(text: string): Array<{ word: string; level: number }> {
    const results: Array<{ word: string; level: number }> = []
    let node = this.root
    let currentMatch: { word: string; level: number } | null = null

    for (const char of text.toLowerCase()) {
      if (!node.children.has(char)) {
        if (currentMatch) {
          results.push(currentMatch)
        }
        node = this.root
        currentMatch = null
        continue
      }
      node = node.children.get(char)!

      if (node.isEnd) {
        currentMatch = { word: node.word, level: node.level }
      }
    }

    if (currentMatch) {
      results.push(currentMatch)
    }

    return results
  }

  // 替换敏感词为 *（可配置替换字符）
  replace(text: string, replaceChar: string = '*'): string {
    let result = text
    const matches = this.findAll(text)

    // 按长度降序排列，从长词开始替换，避免短词替换影响长词匹配
    matches.sort((a, b) => b.word.length - a.word.length)

    for (const match of matches) {
      result = result.replace(
        new RegExp(this.escapeRegExp(match.word), 'gi'),
        replaceChar.repeat(match.word.length)
      )
    }

    return result
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

// 默认敏感词库（示例，实际使用时从数据库加载）
const DEFAULT_SENSITIVE_WORDS = [
  // 色情低危（level 2）
  { word: '色情', level: 2 },
  { word: '成人网站', level: 2 },
  { word: '一夜情', level: 2 },
  // 违法犯罪（level 3）
  { word: '毒品', level: 3 },
  { word: '赌博', level: 3 },
  { word: '枪支', level: 3 },
  { word: '假币', level: 3 },
  // 暴力血腥（level 3）
  { word: '杀人', level: 3 },
  { word: '恐怖', level: 3 },
  // 政治敏感（level 4）
  { word: '分裂', level: 4 },
  { word: '颠覆', level: 4 },
  // 广告推广（level 1）
  { word: '加我', level: 1 },
  { word: '私聊', level: 1 },
  { word: '微信号', level: 1 },
  { word: 'QQ号', level: 1 },
  { word: '网址', level: 1 },
  { word: '代理', level: 1 },
  { word: '招聘', level: 1 },
]

// 全局敏感词 trie 实例
let sensitiveWordTrie: SensitiveWordTrie | null = null

/**
 * 初始化敏感词库
 */
export function initSensitiveWords(words?: Array<{ word: string; level?: number }>): void {
  sensitiveWordTrie = new SensitiveWordTrie()
  sensitiveWordTrie.insertMany(DEFAULT_SENSITIVE_WORDS)
  if (words) {
    sensitiveWordTrie.insertMany(words)
  }
}

/**
 * 获取敏感词 trie 实例
 */
export function getSensitiveWordTrie(): SensitiveWordTrie {
  if (!sensitiveWordTrie) {
    initSensitiveWords()
  }
  return sensitiveWordTrie!
}

/**
 * 检查文本是否包含敏感词
 */
export function containsSensitiveWord(text: string): boolean {
  return getSensitiveWordTrie().find(text) !== null
}

/**
 * 查找文本中的敏感词
 */
export function findSensitiveWords(text: string): Array<{ word: string; level: number }> {
  return getSensitiveWordTrie().findAll(text)
}

/**
 * 检查并返回结果
 * @param text 待检测文本
 * @param minLevel 最小违规等级（>=此等级视为违规）
 */
export function checkText(
  text: string,
  minLevel: number = 2
): {
  passed: boolean
  found: Array<{ word: string; level: number }>
  highestLevel: number
} {
  const found = findSensitiveWords(text)
  const passed = found.length === 0 || found.every(f => f.level < minLevel)
  const highestLevel = found.reduce((max, f) => Math.max(max, f.level), 0)

  return {
    passed,
    found,
    highestLevel,
  }
}

/**
 * 过滤文本中的敏感词
 */
export function filterSensitiveWords(text: string): string {
  return getSensitiveWordTrie().replace(text)
}

// 举报原因枚举
export enum ReportReason {
  SENSITIVE_CONTENT = 'sensitive_content', // 敏感内容
  SPAM = 'spam', // 垃圾广告
  MALICIOUS = 'malicious', // 恶意攻击
  HARASSMENT = 'harassment', // 骚扰
  FALSE_INFO = 'false_info', // 虚假信息
  PIRACY = 'piracy', // 侵权盗版
  OTHER = 'other', // 其他
}

// 举报原因映射到中文
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.SENSITIVE_CONTENT]: '敏感内容',
  [ReportReason.SPAM]: '垃圾广告',
  [ReportReason.MALICIOUS]: '恶意攻击',
  [ReportReason.HARASSMENT]: '骚扰',
  [ReportReason.FALSE_INFO]: '虚假信息',
  [ReportReason.PIRACY]: '侵权盗版',
  [ReportReason.OTHER]: '其他',
}

// 获取原因描述
export function getReportReasonLabel(reason: string): string {
  return REPORT_REASON_LABELS[reason as ReportReason] || '未知原因'
}

// 兼容对象导出（供 sensitiveWords.ts 使用）
export const sensitiveWordService = {
  checkSensitiveWords,
  filterSensitiveWords,
  addToBlacklist,
  removeFromBlacklist,
  clearSensitiveWordsCache,
  getReportReasonLabel,
}
