# 流痕江湖 - 完整项目文件

本文件包含项目所有代码，请按顺序复制到对应文件中。

---

## 文件1: 根目录/package.json
复制到: liuhen-jianghu/package.json

```json
{
  "name": "liuhen-jianghu",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "pnpm -r dev",
    "build": "pnpm -r build",
    "dev:client": "cd client && pnpm start",
    "dev:server": "cd server && pnpm dev",
    "deploy:web": "cd client && pnpm export:web",
    "lint:client": "cd client && pnpm lint",
    "lint:server": "cd server && pnpm lint",
    "lint:all": "pnpm lint:client && pnpm lint:server"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

---

## 文件2: client/package.json
复制到: liuhen-jianghu/client/package.json

```json
{
  "name": "liuhen-jianghu-client",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "private": true,
  "scripts": {
    "check-deps": "npx depcheck",
    "postinstall": "npm run install-missing",
    "install-missing": "node ./scripts/install-missing-deps.js",
    "lint": "tsc --noEmit",
    "start": "expo start --web --clear",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "export:web": "expo export --platform web"
  },
  "dependencies": {
    "@expo/metro-runtime": "~6.1.2",
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "2.2.0",
    "expo": "54.0.33",
    "expo-constants": "~18.0.13",
    "expo-crypto": "~15.0.8",
    "expo-file-system": "~19.0.21",
    "expo-font": "~14.0.11",
    "expo-image": "~3.0.11",
    "expo-image-picker": "~17.0.11",
    "expo-linear-gradient": "~15.0.8",
    "expo-linking": "~8.0.11",
    "expo-router": "~6.0.23",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "expo-symbols": "~1.0.8",
    "js-base64": "^3.7.8",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-svg": "15.12.1",
    "react-native-web": "~0.21.0",
    "zod": "^4.2.1"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~19.1.0",
    "babel-preset-expo": "^54.0.9",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.0.0"
  }
}
```

---

## 文件3: client/app.json
复制到: liuhen-jianghu/client/app.json

```json
{
  "expo": {
    "name": "流痕江湖",
    "slug": "liuhen-jianghu",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "liuhenjianghu",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.liuhen.jianghu",
      "infoPlist": {
        "NSCameraUsageDescription": "允许流痕江湖访问您的相机",
        "NSPhotoLibraryUsageDescription": "允许流痕江湖访问您的相册",
        "NSLocationWhenInUseUsageDescription": "允许流痕江湖获取您的位置"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      },
      "package": "com.liuhen.jianghu",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/icon.png",
      "meta": {
        "themeColor": "#1a1a2e"
      }
    },
    "plugins": [
      "expo-router",
      [
        "expo-image-picker",
        {
          "photosPermission": "允许流痕江湖访问您的相册"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 文件4: client/app.config.ts
复制到: liuhen-jianghu/client/app.config.ts

```typescript
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ ctx }: ConfigContext): ExpoConfig => ({
  ...ctx,
  extra: {
    eas: {
      projectId: 'liuhen-jianghu',
    },
    cozeProjectName: process.env.EXPO_PUBLIC_COZE_PROJECT_NAME || '流痕江湖',
    backendBaseUrl: process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091',
  },
});
```

---

## 文件5: client/tsconfig.json
复制到: liuhen-jianghu/client/tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

---

## 文件6: client/global.css
复制到: liuhen-jianghu/client/global.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #c9a96e;
  --color-primary-dark: #8b6914;
  --color-background: #1a1a2e;
  --color-surface: rgba(255, 255, 255, 0.08);
  --color-surface-elevated: rgba(255, 255, 255, 0.12);
  --color-text: #f5f5f5;
  --color-text-secondary: #a0a0a0;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-accent: #ff6b4a;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-error: #ef4444;
  --color-muted: #6b7280;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--color-background);
  color: var(--color-text);
}

input, textarea {
  color: inherit;
}

.placeholder-text::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

---

## 文件7: client/app/_layout.tsx
复制到: liuhen-jianghu/client/app/_layout.tsx

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#1a1a2e' },
            animation: 'slide_from_right',
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
```

---

## 文件8: client/app/index.tsx
复制到: liuhen-jianghu/client/app/index.tsx

```tsx
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
```

---

## 文件9: client/app/(tabs)/_layout.tsx
复制到: liuhen-jianghu/client/app/(tabs)/_layout.tsx

```tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Foundation, Comments, User, Home } from '@expo/vector-icons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          borderTopWidth: 0,
          height: Platform.OS === 'web' ? 'auto' : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'web' ? 8 : insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#c9a96e',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <Foundation name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '发现',
          tabBarIcon: ({ color }) => <Foundation name="magnifying-glass" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '消息',
          tabBarIcon: ({ color }) => <Comments name="comments" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <User name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## 文件10: client/app/(tabs)/index.tsx
复制到: liuhen-jianghu/client/app/(tabs)/index.tsx

```tsx
export { default } from "@/screens/home";
```

---

## 文件11: client/screens/home/index.tsx
复制到: liuhen-jianghu/client/screens/home/index.tsx

```tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/utils/config';

interface Post {
  id: number;
  user_id: number;
  user_nickname: string;
  user_avatar: string;
  content: string;
  images: string[];
  region_path: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
}

const MEMBER_LEVELS = ['江湖散人', '镇帮帮众', '县帮帮主', '市盟盟主', '省派掌门'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    fetchPosts();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    } catch (e) {}
  };

  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (e) {
      Alert.alert('错误', '获取动态失败');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      selectionLimit: 9 - postImages.length,
    });
    if (!result.canceled) {
      setPostImages([...postImages, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setPostImages(postImages.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!postContent.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }
    setPosting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', postContent);
      postImages.forEach((uri, i) => {
        const filename = uri.split('/').pop() || `image${i}.jpg`;
        formData.append('images', {
          uri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      });
      const res = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowPostModal(false);
        setPostContent('');
        setPostImages([]);
        fetchPosts();
      } else {
        Alert.alert('错误', data.error || '发布失败');
      }
    } catch (e) {
      Alert.alert('错误', '发布失败');
    }
    setPosting(false);
  };

  const handleLike = async (postId: number, isLiked: boolean) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const method = isLiked ? 'DELETE' : 'POST';
      await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch (e) {}
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.user_avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + item.user_id }}
          style={styles.avatar}
        />
        <View style={styles.postHeaderInfo}>
          <Text style={styles.nickname}>{item.user_nickname}</Text>
          <Text style={styles.region}>{item.region_path}</Text>
        </View>
        <Text style={styles.time}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.images?.length > 0 && (
        <View style={styles.imagesGrid}>
          {item.images.slice(0, 9).map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.postImage} />
          ))}
        </View>
      )}
      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => handleLike(item.id, item.is_liked)}>
          <Text style={[styles.actionText, item.is_liked && styles.liked]}>
            ♥ {item.likes_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
          <Text style={styles.actionText}>💬 {item.comments_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>流痕江湖</Text>
        <TouchableOpacity onPress={() => router.push('/vip')}>
          <Text style={styles.vipBadge}>VIP</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>暂无动态，快来发布第一条吧</Text>}
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: 90 + insets.bottom }]}
        onPress={() => setShowPostModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showPostModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>发布动态</Text>
              <TouchableOpacity onPress={handlePost} disabled={posting}>
                <Text style={[styles.postBtn, posting && styles.disabled]}>
                  {posting ? '发布中...' : '发布'}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.textInput}
                placeholder="说点什么..."
                placeholderTextColor="#666"
                multiline
                value={postContent}
                onChangeText={setPostContent}
              />
              <View style={styles.imagesPreview}>
                {postImages.map((uri, i) => (
                  <View key={i} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                      <Text style={styles.removeBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {postImages.length < 9 && (
                  <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                    <Text style={styles.addImageText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#c9a96e' },
  vipBadge: {
    backgroundColor: '#c9a96e',
    color: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 12,
    overflow: 'hidden',
  },
  list: { padding: 16 },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' },
  postHeaderInfo: { flex: 1, marginLeft: 12 },
  nickname: { fontSize: 16, fontWeight: '600', color: '#fff' },
  region: { fontSize: 12, color: '#888', marginTop: 2 },
  time: { fontSize: 12, color: '#666' },
  postContent: { fontSize: 15, color: '#f0f0f0', lineHeight: 22, marginBottom: 12 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  postImage: { width: '31%', aspectRatio: 1, marginRight: '2%', marginBottom: '2%', borderRadius: 8 },
  postActions: { flexDirection: 'row', gap: 24 },
  actionText: { color: '#888', fontSize: 14 },
  liked: { color: '#ff6b4a' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#c9a96e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#c9a96e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize: 32, color: '#1a1a2e', fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  cancelText: { color: '#888', fontSize: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  postBtn: { color: '#c9a96e', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  modalBody: { padding: 16 },
  textInput: { fontSize: 16, color: '#fff', minHeight: 120, textAlignVertical: 'top' },
  imagesPreview: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  imageWrapper: { width: 80, height: 80, marginRight: 8, marginBottom: 8 },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#ff4444', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addImageBtn: { width: 80, height: 80, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed' },
  addImageText: { fontSize: 32, color: '#666' },
});
```

---

## 文件12: client/utils/config.ts
复制到: liuhen-jianghu/client/utils/config.ts

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export { API_BASE_URL };
```

---

## 文件13: server/package.json
复制到: liuhen-jianghu/server/package.json

```json
{
  "name": "liuhen-jianghu-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0",
    "pinata-web3": "^1.0.0",
    "@pinata/sdk": "^2.1.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11",
    "@types/pg": "^8.10.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.0.0",
    "tsx": "^4.7.0"
  }
}
```

---

## 文件14: server/src/index.ts
复制到: liuhen-jianghu/server/src/index.ts

```typescript
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import uploadRoutes from './routes/upload.js';
import memberRoutes from './routes/member.js';
import adminRoutes from './routes/admin.js';
import moderationRoutes from './routes/moderation.js';
import paymentRoutes from './routes/payment.js';
import friendRoutes from './routes/friend.js';
import messageRoutes from './routes/message.js';
import { initDatabase } from './services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9091;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, '../../uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/friends', friendRoutes);
app.use('/api/v1/messages', messageRoutes);

app.get('/api/v1/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Database init failed:', err);
  process.exit(1);
});
```

---

## 文件15: server/src/services/database.ts
复制到: liuhen-jianghu/server/src/services/database.ts

```typescript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(500),
        bio VARCHAR(200),
        region_code VARCHAR(20),
        region_path VARCHAR(200),
        member_level INTEGER DEFAULT 0,
        member_expire_at TIMESTAMP,
        daily_post_limit INTEGER DEFAULT 10,
        is_banned INTEGER DEFAULT 0,
        ban_expire_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS regions (
        code VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        parent_code VARCHAR(20),
        level INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        images TEXT[],
        region_path VARCHAR(200),
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT FALSE,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      );

      CREATE TABLE IF NOT EXISTS member_levels (
        level INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        region_limit INTEGER NOT NULL,
        daily_limit INTEGER NOT NULL,
        retention_days INTEGER NOT NULL,
        can_pin BOOLEAN DEFAULT FALSE
      );

      INSERT INTO member_levels (level, name, price, region_limit, daily_limit, retention_days, can_pin) VALUES
        (0, '江湖散人', 0, 4, 10, 7, false),
        (1, '镇帮帮众', 9.9, 3, 30, 30, false),
        (2, '县帮帮主', 29.9, 2, 100, 90, true),
        (3, '市盟盟主', 99.9, 1, 300, 180, true),
        (4, '省派掌门', 299.9, 1, 1000, 365, true)
      ON CONFLICT (level) DO NOTHING;

      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(50) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sensitive_words (
        id SERIAL PRIMARY KEY,
        word VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        level INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payment_orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(64) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_level INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL DEFAULT 'test',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        pay_time TIMESTAMP,
        expire_time TIMESTAMP NOT NULL,
        transaction_id VARCHAR(128),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO admin_users (username, password, role) VALUES
        ('admin', '$2a$10$8K1p/a0dR1xqM8K9Q6Y5aOQZQYqGxqK9Q6Y5aOQZQYqGxqK', 'super_admin')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

export { pool };
```

---

## 文件16: server/src/routes/auth.ts
复制到: liuhen-jianghu/server/src/routes/auth.ts

```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../services/database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liuhen-jianghu-secret-2024';

router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname, code } = req.body;
    if (!phone || !password) return res.status(400).json({ success: false, error: '缺少必填项' });

    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, error: '手机号已注册' });

    const hashed = await bcrypt.hash(password, 10);
    let regionPath = '全部江湖';
    if (code) {
      const region = await pool.query('SELECT name, (SELECT name FROM regions WHERE code = parent_code) as parent_name FROM regions WHERE code = $1', [code]);
      if (region.rows[0]) {
        regionPath = `${region.rows[0].parent_name || ''}${region.rows[0].name}`;
      }
    }

    const result = await pool.query(
      `INSERT INTO users (phone, password, nickname, region_code, region_path) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, phone, nickname, avatar, member_level`,
      [phone, hashed, nickname || `江湖客${phone.slice(-4)}`, code, regionPath]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: '用户不存在' });

    const user = result.rows[0];
    if (user.is_banned) return res.status(403).json({ success: false, error: '账号已被封禁' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: '密码错误' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    delete user.password;
    res.json({ success: true, user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, error: '未登录' });

    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const result = await pool.query('SELECT id, phone, nickname, avatar, bio, region_code, region_path, member_level, member_expire_at, daily_post_limit, created_at FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: '用户不存在' });
    res.json({ success: true, user: result.rows[0] });
  } catch (e) {
    res.status(401).json({ success: false, error: '无效的token' });
  }
});

export default router;
```

---

## 文件17: server/src/routes/posts.ts
复制到: liuhen-jianghu/server/src/routes/posts.ts

```typescript
import { Router } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { pool } from '../services/database.js';
import { uploadToIPFS } from '../services/ipfsService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liuhen-jianghu-secret-2024';
const upload = multer({ storage: multer.memoryStorage() });

const authenticate = async (req: any, res: any, next: any) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, error: '未登录' });
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: '无效的token' });
  }
};

router.get('/', authenticate, async (req, res) => {
  try {
    const { region } = req.query;
    let query = `SELECT p.*, u.nickname as user_nickname, u.avatar as user_avatar, u.member_level as user_member_level,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked
      FROM posts p JOIN users u ON p.user_id = u.id WHERE p.status = 1`;
    const params: any[] = [req.userId];
    
    if (region) {
      query += ` AND p.region_path LIKE $2`;
      params.push(`${region}%`);
    }
    query += ` ORDER BY p.created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json({ success: true, posts: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: '获取动态失败' });
  }
});

router.post('/', authenticate, upload.array('images'), async (req: any, res: any) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, error: '内容不能为空' });

    const userResult = await pool.query('SELECT region_path, daily_post_limit FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    const todayPosts = await pool.query(
      `SELECT COUNT(*) as count FROM posts WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [req.userId]
    );
    if (parseInt(todayPosts.rows[0].count) >= user.daily_post_limit) {
      return res.status(403).json({ success: false, error: '今日发布次数已用完' });
    }

    let images: string[] = [];
    if (req.files?.length > 0) {
      for (const file of req.files as Express.Multer.File[]) {
        const result = await uploadToIPFS(file.buffer, file.originalname);
        images.push(result.url);
      }
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, images, region_path) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, content, images.length > 0 ? images : null, user.region_path]
    );
    res.json({ success: true, post: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: '发布失败' });
  }
});

router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT id FROM likes WHERE user_id = $1 AND post_id = $2', [req.userId, id]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [req.userId, id]);
      await pool.query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [id]);
    } else {
      await pool.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2)', [req.userId, id]);
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [id]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

router.get('/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, u.nickname, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = $1 ORDER BY c.created_at`,
      [id]
    );
    res.json({ success: true, comments: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: '获取评论失败' });
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    await pool.query('INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3)', [id, req.userId, content]);
    await pool.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: '评论失败' });
  }
});

export default router;
```

---

## 文件18: server/src/services/ipfsService.ts
复制到: liuhen-jianghu/server/src/services/ipfsService.ts

```typescript
import PinataClient from '@pinata/sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pinataClient: PinataClient | null = null;

const initPinata = () => {
  if (!pinataClient && process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET) {
    pinataClient = new PinataClient(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);
  }
  return pinataClient;
};

export async function uploadToIPFS(buffer: Buffer, filename: string): Promise<{ url: string; cid: string }> {
  const pinata = initPinata();
  const uploadsDir = path.join(__dirname, '../../../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  if (pinata) {
    try {
      const tempPath = path.join(uploadsDir, `${uuidv4()}-${filename}`);
      fs.writeFileSync(tempPath, buffer);
      const result = await pinata.pinFileToIPFS(fs.createReadStream(tempPath), {
        pinataMetadata: { name: filename },
        pinataOptions: { cidVersion: 1 },
      });
      fs.unlinkSync(tempPath);
      return {
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        cid: result.IpfsHash,
      };
    } catch (e) {
      console.error('Pinata upload failed:', e);
    }
  }

  const localFilename = `${uuidv4()}-${filename}`;
  const localPath = path.join(uploadsDir, localFilename);
  fs.writeFileSync(localPath, buffer);
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 9091}`;
  return {
    url: `${baseUrl}/uploads/${localFilename}`,
    cid: localFilename,
  };
}
```

---

## 文件19: server/.env.example
复制到: liuhen-jianghu/server/.env.example

```bash
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/liuhenjianghu

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-change-this

# Pinata IPFS (可选，免费1GB)
PINATA_API_KEY=your-pinata-api-key
PINATA_API_SECRET=your-pinata-api-secret

# 服务端口
PORT=9091
BASE_URL=http://localhost:9091
```

---

## 安装和运行步骤

### 1. 安装依赖
```bash
cd liuhen-jianghu
pnpm install
```

### 2. 配置后端环境
```bash
cd server
cp .env.example .env
# 编辑 .env，填写数据库连接信息
```

### 3. 启动后端
```bash
cd server
pnpm dev
```

### 4. 启动前端
```bash
cd client
pnpm start
```

---

## 获取 Supabase 数据库

1. 访问 https://supabase.com 注册账号
2. 创建新项目
3. 在 Settings -> Connection String 获取 DATABASE_URL
4. 将 DATABASE_URL 填入 server/.env
