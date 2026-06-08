import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export interface AdminStats {
  users: {
    total: number;
    today: number;
    thisMonth: number;
    active: number;
    activeToday: number;
  };
  posts: {
    total: number;
    today: number;
  };
  earnings: {
    total: number;
    thisMonth: number;
    today: number;
  };
  memberDistribution: Array<{
    name: string;
    level: number;
    user_count: string;
  }>;
}

export interface AdminInfo {
  id: number;
  username: string;
  role: string;
}

export interface UserInfo {
  id: number;
  phone: string;
  nickname: string;
  member_level: number;
  member_level_name?: string;
  member_expire_at?: string;
  created_at: string;
  updated_at?: string;
  post_count?: string;
}

export interface MemberLevel {
  id: number;
  level: number;
  name: string;
  price: string;
  region_limit: number;
  daily_limit: number;
  retention_days: number;
  can_pin: boolean;
  user_count: string;
}

class AdminService {
  token: string = '';

  async login(username: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.token = data.token;
        await AsyncStorage.setItem('admin_token', data.token);
        return { success: true, data: { admin: data.admin, token: data.token } };
      }
      return { success: false, error: data.error || '登录失败' };
    } catch (error) {
      return { success: false, error: '请求失败' };
    }
  }

  async checkAuth() {
    const token = await AsyncStorage.getItem('admin_token');
    if (token) {
      this.token = token;
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return data;
      } catch {
        return { success: false };
      }
    }
    return { success: false };
  }

  async logout() {
    this.token = '';
    await AsyncStorage.removeItem('admin_token');
  }

  private async request(url: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      return await res.json();
    } catch (error) {
      return { success: false, error: '请求失败' };
    }
  }

  // 获取统计数据
  async getStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/stats`);
  }

  // 获取用户列表
  async getUsers(params: {
    page?: number;
    limit?: number;
    keyword?: string;
    memberLevel?: number;
  } = {}): Promise<{ success: boolean; data?: { users: UserInfo[]; total: number }; error?: string }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.memberLevel !== undefined) query.set('memberLevel', String(params.memberLevel));
    return this.request(`${API_BASE}/api/v1/admin/users?${query}`);
  }

  // 获取单个用户详情
  async getUser(userId: number): Promise<{ success: boolean; data?: UserInfo; error?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/users/${userId}`);
  }

  // 调整用户会员等级
  async adjustLevel(userId: number, level: number, months: number = 1): Promise<{ success: boolean; message?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/users/${userId}/level`, {
      method: 'PUT',
      body: JSON.stringify({ level, months }),
    });
  }

  // 解禁用户
  async unbanUser(userId: number): Promise<{ success: boolean; message?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/users/${userId}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ banned: false }),
    });
  }

  // 获取会员等级列表
  async getMemberLevels(): Promise<{ success: boolean; data?: MemberLevel[]; error?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/member-levels`);
  }

  // 更新会员等级
  async updateMemberLevel(levelId: number, data: Partial<MemberLevel>): Promise<{ success: boolean; message?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/member-levels/${levelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 获取管理日志
  async getLogs(params: { page?: number; limit?: number } = {}): Promise<{ success: boolean; data?: any; error?: string }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return this.request(`${API_BASE}/api/v1/admin/logs?${query}`);
  }

  // 获取趋势数据
  async getTrend(days: number = 7): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/stats/trend?days=${days}`);
  }

  // ==================== 举报管理 ====================

  // 举报类型枚举
  static ReportType = {
    POST: 1,           // 帖子
    COMMENT: 2,        // 评论
    USER: 3,           // 用户
  };

  // 举报原因枚举
  static ReportReason = {
    SPAM: 1,           // 垃圾广告
    PORN: 2,           // 色情低俗
    VIOLENCE: 3,       // 暴力血腥
    FRAUD: 4,          // 诈骗欺诈
    COPYRIGHT: 5,       // 侵权抄袭
    OTHER: 99,         // 其他
  };

  // 举报状态枚举
  static ReportStatus = {
    PENDING: 1,        // 待处理
    PROCESSED: 2,      // 已处理
    DISMISSED: 3,      // 已驳回
  };

  // 获取举报列表
  async getReports(params: {
    page?: number;
    limit?: number;
    status?: number;
    type?: number;
  } = {}): Promise<{ success: boolean; data?: { reports: ReportInfo[]; total: number }; error?: string }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status !== undefined) query.set('status', String(params.status));
    if (params.type !== undefined) query.set('type', String(params.type));
    return this.request(`${API_BASE}/api/v1/admin/reports?${query}`);
  }

  // 处理举报
  async handleReport(reportId: number, action: 'dismiss' | 'delete' | 'ban', reason?: string): Promise<{ success: boolean; message?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/reports/${reportId}/handle`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  // 获取敏感词列表
  async getSensitiveWords(): Promise<{ success: boolean; data?: { words: SensitiveWord[]; total: number }; error?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/sensitive-words`);
  }

  // 添加敏感词
  async addSensitiveWord(word: string, level: number = 1): Promise<{ success: boolean; message?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/sensitive-words`, {
      method: 'POST',
      body: JSON.stringify({ word, level }),
    });
  }

  // 删除敏感词
  async deleteSensitiveWord(wordId: number): Promise<{ success: boolean; message?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/sensitive-words/${wordId}`, {
      method: 'DELETE',
    });
  }

  // 获取审核统计
  async getModerationStats(): Promise<{ success: boolean; data?: ModerationStats; error?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/moderation/stats`);
  }
}

// 举报信息
export interface ReportInfo {
  id: number;
  type: number;
  target_id: number;
  reporter_id: number;
  reporter_phone?: string;
  reason: number;
  reason_text?: string;
  content?: string;
  status: number;
  handler_id?: number;
  handler_username?: string;
  handle_result?: string;
  handle_reason?: string;
  created_at: string;
  updated_at?: string;
  // 关联对象
  target_user?: UserInfo;
  target_post?: PostInfo;
}

// 帖子信息（简化版）
export interface PostInfo {
  id: number;
  user_id: number;
  content: string;
  images?: string[];
  region_code: string;
  region_level: number;
  like_count: number;
  comment_count: number;
  status: number;
  created_at: string;
  user?: UserInfo;
}

// 敏感词信息
export interface SensitiveWord {
  id: number;
  word: string;
  level: number;
  created_at: string;
}

// 审核统计
export interface ModerationStats {
  pendingReports: number;
  todayReports: number;
  weekReports: number;
  sensitiveWordsCount: number;
}

export default new AdminService();
