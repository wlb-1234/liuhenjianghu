import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User, FileText } from "lucide-react-native";

interface SearchResult {
  type: "user" | "post";
  id: number;
  nickname?: string;
  avatar?: string;
  bio?: string;
  title?: string;
  content?: string;
  images?: string;
  likesCount?: number;
  commentsCount?: number;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "posts">("users");

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "users") {
        const data = await apiService.searchUsers(keyword);
        setUsers(data.users || []);
      } else {
        const data = await apiService.searchPosts(keyword);
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("搜索失败:", error);
    } finally {
      setLoading(false);
    }
  }, [keyword, activeTab]);

  const renderUserItem = ({ item }: { item: any }) => (
    <Link href={`/user/${item.id}`} asChild>
      <TouchableOpacity style={styles.userItem}>
        <Image
          source={{
            uri: item.avatar || "https://picsum.photos/100",
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
        </View>
      </TouchableOpacity>
    </Link>
  );

  const renderPostItem = ({ item }: { item: any }) => {
    const images = item.images ? JSON.parse(item.images) : [];
    return (
      <Link href={`/post-detail/${item.id}`} asChild>
        <TouchableOpacity style={styles.postItem}>
          {images.length > 0 && (
            <Image
              source={{ uri: images[0] }}
              style={styles.postImage}
            />
          )}
          <View style={styles.postContent}>
            <Text style={styles.postTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.postText} numberOfLines={2}>
              {item.content}
            </Text>
            <View style={styles.postMeta}>
              <Text style={styles.metaText}>赞 {item.likesCount || 0}</Text>
              <Text style={styles.metaText}>评论 {item.commentsCount || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>搜索</Text>
      </View>

      {/* 搜索框 */}
      <View style={styles.searchBox}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="搜索用户/帖子..."
          placeholderTextColor="#999"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Tab切换 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "users" && styles.activeTab]}
          onPress={() => setActiveTab("users")}
        >
          <User size={18} color={activeTab === "users" ? "#C9A962" : "#999"} />
          <Text style={[styles.tabText, activeTab === "users" && styles.activeTabText]}>
            用户
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <FileText size={18} color={activeTab === "posts" ? "#C9A962" : "#999"} />
          <Text style={[styles.tabText, activeTab === "posts" && styles.activeTabText]}>
            帖子
          </Text>
        </TouchableOpacity>
      </View>

      {/* 结果列表 */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#C9A962" />
        </View>
      ) : (
        <FlatList
          data={activeTab === "users" ? users : posts}
          keyExtractor={(item) => `${item.type || 'post'}-${item.id}`}
          renderItem={activeTab === "users" ? renderUserItem : renderPostItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {keyword ? "未找到结果" : "输入关键词搜索"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C9A962",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: "#1a1a24",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2a2a34",
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  tabs: {
    flexDirection: "row",
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#2a2a34",
  },
  tabText: {
    fontSize: 14,
    color: "#999",
  },
  activeTabText: {
    color: "#C9A962",
  },
  list: {
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  bio: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  postItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    marginBottom: 8,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  postContent: {
    flex: 1,
    marginLeft: 12,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  postText: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  postMeta: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
});
