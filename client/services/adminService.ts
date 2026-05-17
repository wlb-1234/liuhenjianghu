import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export interface AdminStats {
  total: {
    total_amount: string;
    total_platform: string;
    total_creator: string;
    total_orders: string;
  };
  today: {
    today_amount: string;
    today_orders: string;
  };
  month: {
    month_amount: string;
    month_orders: string;
  };
  byLevel: Array<{
    level: number;
    orders: string;
    amount: string;
    platform_amount: string;
    creator_amount: string;
  }>;
  byMonth: Array<{
    month: string;
    orders: string;
    amount: string;
  }>;
}

export interface UserInfo {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  member_level: number;
  member_expire_at: string | null;
  province: string;
  city: string;
  district: string;
  town: string;
  created_at: string;
  total_posts: number;
  total_likes: number;
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
      if (data.code === 200 && data.data?.token) {
        this.token = data.data.token;
        await AsyncStorage.setItem('admin_token', data.data.token);
      }
      return data;
    } catch (error) {
      return { code: 500, message: '请求失败' };
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
        return { code: 401 };
      }
    }
    return { code: 401 };
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
      return { code: 500, message: '请求失败' };
    }
  }

  // 获取统计数据
  async getStats(): Promise<{ code: number; data?: AdminStats }> {
    return this.request(`${API_BASE}/api/v1/admin/stats`);
  }

  // 获取用户列表
  async getUsers(params: {
    page?: number;
    limit?: number;
    keyword?: string;
    level?: number;
  } = {}): Promise<{ code: number; data?: { users: UserInfo[]; total: number } }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.level !== undefined) query.set('level', String(params.level));
    return this.request(`${API_BASE}/api/v1/admin/users?${query}`);
  }

  // 获取单个用户详情
  async getUser(userId: number): Promise<{ code: number; data?: UserInfo }> {
    return this.request(`${API_BASE}/api/v1/admin/users/${userId}`);
  }

  // 调整用户会员等级
  async adjustLevel(
    userId: number,
    level: number,
    months: number = 1
  ): Promise<{ code: number; message?: string }> {
    return this.request(`${API_BASE}/api/v1/admin/users/${userId}/level`, {
      method: 'PUT',
      body: JSON.stringify({ level, months }),
    });
  }

  // 获取举报列表
  async getReports(params: {
    page?: number;
    limit?: number;
    status?: number;
  } = {}): Promise<{
    code: number;
    data?: { reports: any[]; total: number };
  }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status !== undefined) query.set('status', String(params.status));
    return this.request(`${API_BASE}/api/v1/moderation/reports?${query}`);
  }

  // 处理举报
  async handleReport(reportId: number, action: string, reason?: string): Promise<{ code: number }> {
    return this.request(`${API_BASE}/api/v1/moderation/reports/${reportId}/handle`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  // 获取敏感词列表
  async getSensitiveWords(): Promise<{ code: number; data?: { words: any[] } }> {
    return this.request(`${API_BASE}/api/v1/moderation/sensitive-words`);
  }

  // 添加敏感词
  async addSensitiveWord(word: string, level?: number, category?: string): Promise<{ code: number }> {
    return this.request(`${API_BASE}/api/v1/moderation/sensitive-words`, {
      method: 'POST',
      body: JSON.stringify({ word, level, category }),
    });
  }

  // 删除敏感词
  async deleteSensitiveWord(id: number): Promise<{ code: number }> {
    return this.request(`${API_BASE}/api/v1/moderation/sensitive-words/${id}`, {
      method: 'DELETE',
    });
  }

  // 获取违规用户列表
  async getViolationUsers(): Promise<{
    code: number;
    data?: { users: any[]; stats: any };
  }> {
    return this.request(`${API_BASE}/api/v1/moderation/violations`);
  }

  // 处罚用户
  async penalizeUser(userId: number, penalty: number, reason: string, days?: number): Promise<{ code: number }> {
    return this.request(`${API_BASE}/api/v1/moderation/violations/penalize`, {
      method: 'POST',
      body: JSON.stringify({ userId, penalty, reason, days }),
    });
  }
}

const adminService = new AdminService();
export default adminService;
