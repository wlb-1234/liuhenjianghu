import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, Modal, ScrollView, Image } from 'react-native';
import { Screen } from '@/components/Screen';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Content {
  id: number;
  title: string;
  content: string;
  cover_url: string;
  category: string;
  tags: string[];
  author_id: number;
  status: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function ContentManageScreen() {
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // 编辑弹窗
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const limit = 20;

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  }, []);

  const fetchContents = useCallback(async (pageNum: number = 1, search: string = keyword) => {
    try {
      let url = `${API_BASE}/api/v1/articles?page=${pageNum}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const list = data.data?.articles || data.articles || [];
        if (pageNum === 1) {
          setContents(list);
        } else {
          setContents(prev => [...prev, ...list]);
        }
        setTotal(data.data?.total || data.total || 0);
      }
    } catch (error) {
      console.error('获取内容失败:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchCategories();
    fetchContents();
  }, [fetchCategories, fetchContents]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    fetchContents(1, keyword);
  };

  const handleFilterChange = (category: string, status: string) => {
    setCategoryFilter(category);
    setStatusFilter(status);
    setPage(1);
    setLoading(true);
    fetchContents(1, keyword);
  };

  // 打开编辑
  const handleEdit = (item: Content) => {
    setEditingContent(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditCategory(item.category);
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSave = async () => {
    if (!editingContent) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/articles/${editingContent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          category: editCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('成功', '内容更新成功');
        setEditModalVisible(false);
        fetchContents(1, keyword);
      } else {
        Alert.alert('失败', data.message || '更新失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络请求失败');
    }
  };

  // 更新状态
  const handleStatusChange = async (item: Content, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/articles/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('成功', `已将状态更新为${newStatus === 'published' ? '已发布' : '草稿'}`);
        fetchContents(1, keyword);
      }
    } catch (error) {
      Alert.alert('错误', '网络请求失败');
    }
  };

  // 删除内容
  const handleDelete = (item: Content) => {
    Alert.alert('确认删除', `确定要删除 "${item.title}" 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/v1/articles/${item.id}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert('成功', '内容已删除');
              fetchContents(1, keyword);
            }
          } catch (error) {
            Alert.alert('错误', '网络请求失败');
          }
        },
      },
    ]);
  };

  // 状态映射
  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      draft: { label: '草稿', color: '#FF9800' },
      published: { label: '已发布', color: '#4CAF50' },
      archived: { label: '已归档', color: '#9E9E9E' },
    };
    return map[status] || { label: status, color: '#9E9E9E' };
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderContent = ({ item }: { item: Content }) => {
    const statusInfo = getStatusInfo(item.status);
    return (
      <View style={styles.contentCard}>
        {item.cover_url && (
          <Image source={{ uri: item.cover_url }} style={styles.coverImage} />
        )}
        <View style={styles.contentBody}>
          <Text style={styles.contentTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.contentMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
            <Text style={styles.category}>{item.category || '未分类'}</Text>
            <Text style={styles.views}>👁 {item.view_count || 0}</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
            <Text style={styles.actionText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, item.status === 'published' && styles.actionButtonDraft]}
            onPress={() => handleStatusChange(item, item.status === 'published' ? 'draft' : 'published')}
          >
            <Text style={styles.actionText}>
              {item.status === 'published' ? '下架' : '发布'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDelete]} onPress={() => handleDelete(item)}>
            <Text style={styles.actionTextDelete}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-stone-900">
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索标题..."
            placeholderTextColor="#666"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {[
              { key: '', label: '全部分类' },
              ...categories.map(c => ({ key: c.slug, label: c.name })),
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, categoryFilter === filter.key && styles.filterChipActive]}
                onPress={() => handleFilterChange(filter.key, statusFilter)}
              >
                <Text style={[styles.filterText, categoryFilter === filter.key && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 统计 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>总内容</Text>
        </View>
      </View>

      {/* 内容列表 */}
      {loading && contents.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#c9a96e" />
        </View>
      ) : (
        <FlatList
          data={contents}
          renderItem={renderContent}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无内容</Text>
            </View>
          }
        />
      )}

      {/* 编辑弹窗 */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑内容</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>标题</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="请输入标题"
                placeholderTextColor="#666"
              />
              <Text style={styles.inputLabel}>分类</Text>
              <TextInput
                style={styles.input}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder="请输入分类"
                placeholderTextColor="#666"
              />
              <Text style={styles.inputLabel}>内容</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editContent}
                onChangeText={setEditContent}
                placeholder="请输入内容"
                placeholderTextColor="#666"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#292524',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#c9a96e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#292524',
  },
  filterChipActive: {
    backgroundColor: '#c9a96e',
  },
  filterText: {
    fontSize: 13,
    color: '#a8a29e',
  },
  filterTextActive: {
    color: '#1a1a1a',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  statItem: {
    backgroundColor: '#292524',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c9a96e',
  },
  statLabel: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  contentCard: {
    backgroundColor: '#292524',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#3f3f46',
  },
  contentBody: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    color: '#a8a29e',
  },
  views: {
    fontSize: 12,
    color: '#78716c',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#3f3f46',
  },
  actionButtonDraft: {
    backgroundColor: '#292524',
  },
  actionButtonDelete: {
    borderRightWidth: 0,
  },
  actionText: {
    fontSize: 13,
    color: '#c9a96e',
  },
  actionTextDelete: {
    fontSize: 13,
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#292524',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalClose: {
    fontSize: 20,
    color: '#a8a29e',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    color: '#a8a29e',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1c1917',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  textArea: {
    minHeight: 150,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3f3f46',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#a8a29e',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#c9a96e',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '600',
  },
});
