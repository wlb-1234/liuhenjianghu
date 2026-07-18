// API 服务层
// 生产环境通过 server.js 代理 /api/* 到后端，使用相对路径即可
// 开发环境通过 EXPO_PUBLIC_BACKEND_BASE_URL 指定后端地址
// 构建时间戳：2026-07-18T21:45:00+08:00
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? '';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, requireAuth = true } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requireAuth && this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}/api/v1${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  }

  // ============ 认证相关 ============
  
  // 发送验证码
  async sendCode(phone: string): Promise<{ success: boolean; code?: string }> {
    return this.request('/auth/send-code', {
      method: 'POST',
      body: { phone },
      requireAuth: false,
    });
  }

  // 注册
  async register(data: {
    phone: string;
    code: string;
    password: string;
    nickname: string;
    province_code?: string;
    city_code?: string;
    district_code?: string;
    town_code?: string;
  }): Promise<{ token: string; user: any }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: data,
      requireAuth: false,
    });
  }

  // 登录
  async login(phone: string, password: string): Promise<{ token: string; user: any }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: { phone, password },
      requireAuth: false,
    });
  }

  // 获取当前用户
  async getMe(): Promise<{ user: any }> {
    return this.request('/auth/me');
  }

  // 更新用户信息
  async updateMe(data: { nickname?: string; avatar?: string }): Promise<{ user: any }> {
    return this.request('/auth/me', { method: 'PUT', body: data });
  }

  // 更新用户区域
  async updateRegion(data: {
    province_code?: string;
    city_code?: string;
    district_code?: string;
    town_code?: string;
  }): Promise<{ user: any }> {
    return this.request('/auth/region', { method: 'PUT', body: data });
  }

  // ============ 区域相关 ============
  
  // 获取省份
  async getProvinces(): Promise<{ data: any[] }> {
    return this.request('/regions/provinces', { requireAuth: false });
  }

  // 获取城市
  async getCities(provinceCode: string): Promise<{ data: any[] }> {
    return this.request(`/regions/cities/${provinceCode}`, { requireAuth: false });
  }

  // 获取区县
  async getDistricts(cityCode: string): Promise<{ data: any[] }> {
    return this.request(`/regions/districts/${cityCode}`, { requireAuth: false });
  }

  // 获取乡镇/街道
  async getTowns(districtCode: string): Promise<{ data: any[] }> {
    return this.request(`/regions/streets/${districtCode}`, { requireAuth: false });
  }

  // 获取区域信息
  async getRegionInfo(code: string): Promise<{ data: { region: any; path: any[] } }> {
    return this.request(`/regions/info/${code}`, { requireAuth: false });
  }

  // ============ 帖子相关 ============
  
  // 创建帖子
  async createPost(data: {
    content: string;
    images?: string[];
    region_code: string;
    region_level: number;
  }): Promise<{ post: any; remaining: number }> {
    return this.request('/posts', { method: 'POST', body: data });
  }

  // 获取帖子列表
  async getPosts(page = 1, pageSize = 20): Promise<{
    posts: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return this.request(`/posts?page=${page}&pageSize=${pageSize}`);
  }

  // 获取帖子详情
  async getPost(id: number): Promise<{ post: any }> {
    return this.request(`/posts/${id}`);
  }

  // 点赞/取消点赞
  async toggleLike(postId: number): Promise<{ liked: boolean; like_count: number }> {
    return this.request(`/posts/${postId}/like`, { method: 'POST' });
  }

  // 获取评论
  async getComments(postId: number): Promise<{ comments: any[] }> {
    return this.request(`/posts/${postId}/comments`);
  }

  // 添加评论
  async addComment(postId: number, content: string, parentId?: number): Promise<{ comment_id: number }> {
    return this.request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: { content, parent_id: parentId },
    });
  }

  // 举报帖子
  async reportPost(postId: number, reason: string): Promise<{ success: boolean }> {
    return this.request(`/posts/${postId}/report`, {
      method: 'POST',
      body: { reason },
    });
  }

  // 删除帖子
  async deletePost(postId: number): Promise<{ success: boolean }> {
    return this.request(`/posts/${postId}`, { method: 'DELETE' });
  }

  // ============ 社交相关 ============
  
  // 关注用户
  async followUser(userId: number): Promise<{ success: boolean }> {
    return this.request(`/social/follow/${userId}`, { method: 'POST' });
  }

  // 取消关注
  async unfollowUser(userId: number): Promise<{ success: boolean }> {
    return this.request(`/social/follow/${userId}`, { method: 'DELETE' });
  }

  // 获取关注列表
  async getFollowing(): Promise<{ following: any[] }> {
    return this.request('/social/following');
  }

  // 获取粉丝列表
  async getFollowers(): Promise<{ followers: any[] }> {
    return this.request('/social/followers');
  }

  // 添加好友
  async addFriend(userId: number): Promise<{ success: boolean }> {
    return this.request(`/social/friend/${userId}`, { method: 'POST' });
  }

  // 接受好友请求
  async acceptFriend(userId: number): Promise<{ success: boolean }> {
    return this.request(`/social/friend/accept/${userId}`, { method: 'POST' });
  }

  // 获取好友列表
  async getFriends(): Promise<{ friends: any[] }> {
    return this.request('/social/friends');
  }

  // 获取会话列表
  async getConversations(): Promise<{ conversations: any[] }> {
    return this.request('/messages/conversations');
  }

  // 发送私信
  async sendMessage(userId: number, content: string): Promise<{ message_id: number }> {
    return this.request(`/social/message/${userId}`, {
      method: 'POST',
      body: { content },
    });
  }

  // 获取聊天记录
  async getMessages(userId: number, page = 1): Promise<{ messages: any[] }> {
    return this.request(`/social/messages/${userId}?page=${page}`);
  }

  // 获取用户资料
  async getUserProfile(userId: number): Promise<{ user: any }> {
    return this.request(`/social/user/${userId}`);
  }

  // 搜索用户
  async searchUsers(query: string): Promise<{ users: any[] }> {
    return this.request(`/social/search?q=${encodeURIComponent(query)}`);
  }

  // ============ 会员相关 ============
  
  // 获取会员等级列表
  async getMemberLevels(): Promise<{ levels: any[] }> {
    return this.request('/member/levels', { requireAuth: false });
  }

  // 获取我的会员信息
  async getMyMember(): Promise<{ member: any }> {
    return this.request('/member/me');
  }

  // 升级会员（模拟）
  async upgradeMember(level: number, months = 1): Promise<{ member: any }> {
    return this.request('/member/upgrade', {
      method: 'POST',
      body: { level, months },
    });
  }

  // ============ 搜索 ============
  
  async searchUsers(keyword: string): Promise<{ users: any[] }> {
    return this.request(`/search/users?keyword=${encodeURIComponent(keyword)}`);
  }

  async searchPosts(keyword: string): Promise<{ posts: any[] }> {
    return this.request(`/search/posts?keyword=${encodeURIComponent(keyword)}`);
  }

  // ============ 文件上传 ============
  
  async uploadImages(formData: FormData): Promise<{ files: any[] }> {
    const response = await fetch(`${API_BASE}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }
    return data;
  }

  // ============ 收藏相关 ============

  // 添加收藏
  async addCollection(postId: number): Promise<{ success: boolean; message: string }> {
    return this.request('/collections', {
      method: 'POST',
      body: { postId },
    });
  }

  // 取消收藏
  async removeCollection(postId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/collections/${postId}`, { method: 'DELETE' });
  }

  // 获取收藏列表
  async getCollections(page = 1, pageSize = 20): Promise<{ 
    data: any[]; 
    pagination: { page: number; pageSize: number; total: number; totalPages: number } 
  }> {
    return this.request(`/collections?page=${page}&pageSize=${pageSize}`);
  }

  // 检查是否已收藏
  async checkCollection(postId: number): Promise<{ isCollected: boolean }> {
    return this.request(`/collections/check/${postId}`);
  }
}

export const api = new ApiService();
export default api;
