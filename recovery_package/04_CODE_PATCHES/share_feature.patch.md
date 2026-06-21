# 分享功能补丁

## 概述
帖子详情页添加分享功能，支持分享到其他应用和复制链接。

## 修改文件

### `client/screens/post-detail/index.tsx`

在帖子详情页添加分享按钮：

```typescript
// 导入Share
import { Share, TouchableOpacity, Text, View } from 'react-native';

// 添加分享函数
const handleShare = async () => {
  const shareUrl = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/post/${post?.id}`;
  const shareContent = `${post?.title}\n\n${shareUrl}`;
  
  try {
    await Share.share({
      title: post?.title,
      message: shareContent,
      url: post?.images?.[0] || undefined,
    });
  } catch (error) {
    // 复制到剪贴板
    await Clipboard.setStringAsync(shareContent);
    Alert.alert('已复制', '链接已复制到剪贴板');
  }
};

// 在操作栏添加分享按钮
<View style={styles.actions}>
  {/* 点赞按钮 */}
  {/* 评论按钮 */}
  {/* 收藏按钮 */}
  
  {/* 分享按钮 */}
  <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
    <Ionicons name="share-outline" size={22} color="#666" />
    <Text style={styles.actionText}>{post?.shares_count || 0}</Text>
  </TouchableOpacity>
</View>
```

### `client/assets/images/`

放置 App 图标文件：
- `icon.png` - 主图标 (1024x1024)
- `adaptive-icon.png` - Android 自适应图标
- `favicon.png` - 网页图标
- `splash-icon.png` - 启动图标

## 相关 API

无需后端 API，使用原生 `Share` API。

## 依赖

无需额外依赖，使用 React Native 内置 `Share` API。
