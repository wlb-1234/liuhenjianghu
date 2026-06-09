// 敏感词过滤服务（简化版）
const words: Map<string, { category: string; level: number }> = new Map();

// 预置敏感词（不含广告类词汇）
const builtInWords = [
  { word: '毒品', category: '违法犯罪', level: 3 },
  { word: '赌博', category: '违法犯罪', level: 3 },
  { word: '诈骗', category: '违法犯罪', level: 3 },
  { word: '黑客', category: '违法犯罪', level: 3 },
  { word: '枪支', category: '违法犯罪', level: 3 },
  { word: '政治敏感', category: '敏感内容', level: 3 },
  { word: '分裂', category: '敏感内容', level: 3 },
  { word: '暴力', category: '不良内容', level: 2 },
  { word: '恐怖', category: '不良内容', level: 2 },
  { word: '血腥', category: '不良内容', level: 2 },
  { word: '色情', category: '不良内容', level: 3 },
  { word: '低俗', category: '不良内容', level: 2 },
  { word: '造谣', category: '虚假信息', level: 2 },
  { word: '诽谤', category: '侵权内容', level: 2 },
];

// 初始化敏感词
builtInWords.forEach(({ word, category, level }) => {
  words.set(word, { category, level });
});

// DFA 算法：构建状态机
class DFAMatcher {
  private next: Map<string, number> = new Map();
  private fail: number = 0;
  private output: string[] = [];

  insert(word: string): void {
    let node = 0;
    for (const char of word) {
      const nextNode = this.next.get(`${node}:${char}`);
      if (nextNode === undefined) {
        this.next.set(`${node}:${char}`, ++node);
      } else {
        node = nextNode;
      }
    }
  }
}

class SensitiveWordService {
  private wordSet: string[] = [];

  constructor() {
    // 初始化敏感词
    builtInWords.forEach(({ word }) => {
      this.wordSet.push(word);
    });
  }

  // 过滤文本，返回过滤后的文本和敏感词列表
  filter(text: string): { filtered: string; words: string[]; blocked: boolean } {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const word of this.wordSet) {
      if (lowerText.includes(word.toLowerCase())) {
        found.push(word);
      }
    }

    let filtered = text;
    found.forEach(word => {
      filtered = filtered.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
    });

    return {
      filtered,
      words: found,
      blocked: found.length > 0
    };
  }

  // 检查是否包含敏感词
  contains(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.wordSet.some(word => lowerText.includes(word.toLowerCase()));
  }

  // 检查文本，返回详细结果
  checkText(text: string): { hasSensitive: boolean; words: string[]; filtered: string } {
    const lowerText = text.toLowerCase();
    const found: string[] = [];
    
    for (const word of this.wordSet) {
      if (lowerText.includes(word.toLowerCase())) {
        found.push(word);
      }
    }
    
    let filtered = text;
    found.forEach(word => {
      filtered = filtered.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
    });
    
    return {
      hasSensitive: found.length > 0,
      words: found,
      filtered
    };
  }

  // 获取所有敏感词
  getWords(): Array<{ word: string; category: string; level: number }> {
    return builtInWords;
  }

  // 添加敏感词
  addWord(word: string, category: string = '自定义', level: number = 1): void {
    if (!this.wordSet.includes(word)) {
      this.wordSet.push(word);
      builtInWords.push({ word, category, level });
    }
  }

  // 删除敏感词
  removeWord(word: string): void {
    this.wordSet = this.wordSet.filter(w => w !== word);
  }
}

export const sensitiveWordService = new SensitiveWordService();
