# 意见反馈功能补丁

## 版本
v1.6.0

## 概述
添加意见反馈功能，包括用户提交反馈和管理后台处理。

## 后端文件

### 1. 新建 `/server/src/routes/feedbacks.ts`

```typescript
import { Router } from 'express';
import { pool } from '../config/database';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

// 用户提交反馈
router.post('/', async (req, res) => {
  try {
    const { type, content, contact } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '反馈内容不能为空' });
    }

    // 获取用户ID（如果已登录）
    let userId = null;
    const session = req.headers['x-session'];
    if (session && session !== 'anonymous') {
      try {
        const userResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
          headers: { Authorization: `Bearer ${session}` }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.id;
        }
      } catch (e) {}
    }

    const result = await pool.query(
      `INSERT INTO feedbacks (user_id, type, content, contact) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, type || 'suggestion', content, contact]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: '提交失败' });
  }
});

// 管理端：获取反馈列表
router.get('/admin/list', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, status, type } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status) {
      params.push(status);
      whereClause += ` AND f.status = $${params.length}`;
    }
    if (type) {
      params.push(type);
      whereClause += ` AND f.type = $${params.length}`;
    }

    params.push(limit, offset);
    const query = `
      SELECT f.*, u.nickname as user_nickname, u.avatar_url as user_avatar
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM feedbacks f WHERE ${whereClause}`,
      params.slice(0, -2)
    );

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: pageNum,
        limit
      }
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 管理端：回复反馈
router.put('/admin/:id/reply', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, status } = req.body;

    const result = await pool.query(
      `UPDATE feedbacks 
       SET reply = $1, status = $2, replied_at = NOW()
       WHERE id = $3 RETURNING *`,
      [reply, status || 'processed', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Reply feedback error:', error);
    res.status(500).json({ error: '回复失败' });
  }
});

// 初始化表（开发环境）
router.get('/init-table', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        type VARCHAR(32) NOT NULL DEFAULT 'suggestion',
        content TEXT NOT NULL,
        contact VARCHAR(100),
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        reply TEXT,
        replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id)`);
    res.json({ success: true, message: 'Table created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
```

### 2. 注册路由 `/server/src/index.ts`

在路由注册部分添加：
```typescript
import feedbacksRouter from './routes/feedbacks';

// ... 其他路由
app.use('/api/v1/feedbacks', feedbacksRouter);
```

## 前端文件

### 1. 新建 `/client/screens/feedback/index.tsx`

```tsx
import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

const FEEDBACK_TYPES = [
  { value: 'suggestion', label: '功能建议' },
  { value: 'bug', label: '问题反馈' },
  { value: 'other', label: '其他' },
];

export default function FeedbackScreen() {
  const [type, setType] = useState('suggestion');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }
    setLoading(true);
    try {
      const session = await AsyncStorage.getItem('session');
      const res = await fetch(`${API_BASE}/api/v1/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session': session || '' },
        body: JSON.stringify({ type, content, contact }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('成功', '感谢您的反馈！');
        setContent('');
        setContact('');
      } else {
        Alert.alert('失败', data.error);
      }
    } catch (e) {
      Alert.alert('错误', '提交失败');
    }
    setLoading(false);
  };

  return (
    <Screen title="意见反馈" back>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text className="text-lg font-bold mb-4">反馈类型</Text>
        <View className="flex-row gap-2 mb-4">
          {FEEDBACK_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setType(t.value)}
              className={`px-4 py-2 rounded-full ${type === t.value ? 'bg-primary' : 'bg-gray-100'}`}
            >
              <Text className={type === t.value ? 'text-white' : 'text-gray-600'}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-lg font-bold mb-2">反馈内容 *</Text>
        <TextInput
          multiline
          numberOfLines={5}
          placeholder="请详细描述您的建议或问题..."
          value={content}
          onChangeText={setContent}
          className="bg-gray-50 p-4 rounded-xl mb-4 h-32 text-base"
          textAlignVertical="top"
        />

        <Text className="text-lg font-bold mb-2">联系方式（选填）</Text>
        <TextInput
          placeholder="手机号或邮箱"
          value={contact}
          onChangeText={setContact}
          className="bg-gray-50 p-4 rounded-xl mb-6"
        />

        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          className="bg-primary p-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">{loading ? '提交中...' : '提交反馈'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
```

### 2. 新建 `/client/app/feedback.tsx`

```tsx
export { default } from "@/screens/feedback";
```

### 3. 新建 `/client/screens/about/index.tsx`

```tsx
import { View, Text, ScrollView, Linking } from 'react-native';
import { Screen } from '@/components/Screen';

const APP_VERSION = '1.0.0';
const COMPANY_NAME = '流痕江湖';
const WEBSITE = 'https://liuhenjianghu.com';

export default function AboutScreen() {
  return (
    <Screen title="关于我们" back>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-primary rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">痕</Text>
          </View>
          <Text className="text-2xl font-bold">{COMPANY_NAME}</Text>
          <Text className="text-gray-500 mt-1">版本 {APP_VERSION}</Text>
        </View>

        <View className="bg-gray-50 rounded-2xl p-5 mb-4">
          <Text className="font-bold text-lg mb-3">关于我们</Text>
          <Text className="text-gray-600 leading-6">
            {COMPANY_NAME}是一款专注于传统文化分享与交流的移动应用。
            我们致力于为用户提供优质的内容体验和社区交流平台。
          </Text>
        </View>

        <View className="bg-gray-50 rounded-2xl p-5 mb-4">
          <Text className="font-bold text-lg mb-3">联系方式</Text>
          <Text className="text-gray-600 mb-2">邮箱: contact@liuhenjianghu.com</Text>
          <Text className="text-gray-600">网站: {WEBSITE}</Text>
        </View>

        <View className="bg-gray-50 rounded-2xl p-5">
          <Text className="font-bold text-lg mb-3">版权信息</Text>
          <Text className="text-gray-500 text-sm">
            © 2026 {COMPANY_NAME} 版权所有
          </Text>
          <Text className="text-gray-400 text-xs mt-2">
            本应用及本应用内容包括的一切知识产权归流痕江湖所有。
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
```

### 4. 新建 `/client/app/about.tsx`

```tsx
export { default } from "@/screens/about";
```

### 5. 更新 `/client/app/_layout.tsx`

添加路由：
```tsx
<Stack.Screen name="feedback" />
<Stack.Screen name="about" />
```

### 6. 更新个人中心 `/client/screens/profile/ProfileScreen.tsx`

添加入口：
```tsx
// 意见反馈
<Link href="/feedback" className="flex-row items-center p-4 bg-white rounded-xl">
  <Text className="text-xl mr-3">💬</Text>
  <Text className="flex-1">意见反馈</Text>
  <Text className="text-gray-400">›</Text>
</Link>

// 关于我们
<Link href="/about" className="flex-row items-center p-4 bg-white rounded-xl">
  <Text className="text-xl mr-3">ℹ️</Text>
  <Text className="flex-1">关于我们</Text>
  <Text className="text-gray-400">›</Text>
</Link>
```

## 管理后台

### 新建 `/client/screens/admin/FeedbackManageScreen.tsx`

```tsx
import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function FeedbackManageScreen() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('all');
  const [replyText, setReplyText] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchFeedbacks = async () => {
    const token = await AsyncStorage.getItem('admin_token');
    const res = await fetch(
      `${API_BASE}/api/v1/feedbacks/admin/list?page=${page}&status=${filter === 'all' ? '' : filter}`,
      { headers: { 'x-admin-token': token || '' } }
    );
    const data = await res.json();
    if (data.success) {
      setFeedbacks(data.data.items);
      setTotal(data.data.total);
    }
  };

  useFocusEffect(useCallback(() => { fetchFeedbacks(); }, [page, filter]));

  const handleReply = async (id: number) => {
    if (!replyText.trim()) {
      Alert.alert('提示', '请输入回复内容');
      return;
    }
    const token = await AsyncStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/v1/feedbacks/admin/${id}/reply`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
      body: JSON.stringify({ reply: replyText, status: 'processed' }),
    });
    const data = await res.json();
    if (data.success) {
      Alert.alert('成功', '回复已发送');
      setSelectedId(null);
      setReplyText('');
      fetchFeedbacks();
    }
  };

  return (
    <Screen title="反馈管理" back>
      <View className="flex-row gap-2 p-4 bg-gray-50">
        {(['all', 'pending', 'processed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-full ${filter === f ? 'bg-primary' : 'bg-white'}`}
          >
            <Text className={filter === f ? 'text-white' : 'text-gray-600'}>
              {f === 'all' ? '全部' : f === 'pending' ? '待处理' : '已处理'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={feedbacks}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View className="m-4 p-4 bg-white rounded-xl shadow-sm">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 text-sm">{item.user_nickname || '游客'}</Text>
              <Text className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[item.status]}`}>
                {item.status === 'pending' ? '待处理' : item.status === 'processed' ? '已处理' : '已拒绝'}
              </Text>
            </View>
            <Text className="text-base mb-2">{item.content}</Text>
            {item.reply && (
              <View className="bg-blue-50 p-3 rounded-lg mb-2">
                <Text className="text-blue-600 text-sm">回复: {item.reply}</Text>
              </View>
            )}
            {item.status === 'pending' && (
              <View className="mt-2">
                {selectedId === item.id ? (
                  <View className="flex-row gap-2">
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="输入回复..."
                      className="flex-1 bg-gray-50 p-2 rounded"
                    />
                    <TouchableOpacity onPress={() => handleReply(item.id)} className="bg-primary px-4 rounded">
                      <Text className="text-white">发送</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedId(null)} className="px-4">
                      <Text>取消</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setSelectedId(item.id)}
                    className="bg-primary p-2 rounded items-center"
                  >
                    <Text className="text-white">回复</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text className="text-gray-400 text-xs mt-2">
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text className="text-center text-gray-400 mt-10">暂无反馈</Text>}
      />
    </Screen>
  );
}
```

### 新建 `/client/app/admin/feedbacks.tsx`

```tsx
export { default } from "@/screens/admin/FeedbackManageScreen";
```

### 更新 `/client/app/admin/_layout.tsx`

添加路由：
```tsx
<Tabs.Screen name="feedbacks" options={{ title: '反馈管理' }} />
```

## 数据库表

已在 `01_SCHEMA.sql` 中包含：

```sql
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type VARCHAR(32) NOT NULL DEFAULT 'suggestion',
    content TEXT NOT NULL,
    contact VARCHAR(100),
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 测试

```bash
# 提交反馈
curl -X POST -H "Content-Type: application/json" \
  -d '{"type":"suggestion","content":"测试反馈","contact":"test@test.com"}' \
  http://localhost:9091/api/v1/feedbacks

# 获取列表（需要管理员token）
curl -H "x-admin-token: admin_token_dev" \
  http://localhost:9091/api/v1/feedbacks/admin/list

# 回复反馈
curl -X PUT -H "Content-Type: application/json" \
  -H "x-admin-token: admin_token_dev" \
  -d '{"reply":"感谢反馈","status":"processed"}' \
  http://localhost:9091/api/v1/feedbacks/admin/1/reply
```
