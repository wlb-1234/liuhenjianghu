import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface OtherUser {
  id: number;
  nickname: string;
  avatar: string | null;
}

export default function ChatRoomScreen() {
  const router = useSafeRouter();
  const { userId: otherUserId } = useSafeSearchParams<{ userId: string }>();
  const { user } = useAuth();
  
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!otherUserId) return;
    
    try {
      const res = await api.get<{
        otherUser: OtherUser;
        messages: Message[];
        conversationId: number;
      }>(`/messages/${otherUserId}`);
      setOtherUser(res.otherUser);
      setMessages(res.messages || []);
    } catch (error) {
      console.error('获取聊天记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    
    setSending(true);
    try {
      const res = await api.post<{ message: Message }>('/messages', {
        receiverId: parseInt(otherUserId),
        content: inputText.trim(),
      });
      setMessages(prev => [...prev, res.message]);
      setInputText('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <TouchableOpacity onPress={() => router.push('/user', { userId: otherUserId })}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{otherUser?.nickname?.[0] || '?'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeOther]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        
        {isMe && (
          <TouchableOpacity onPress={() => router.push('/user', { userId: user?.id?.toString() || '' })}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{user?.nickname?.[0] || '?'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>开始和 {otherUser?.nickname || '对方'} 聊天吧</Text>
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{otherUser?.nickname || '加载中...'}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* 消息列表 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          ListEmptyComponent={!loading ? renderEmpty : null}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* 输入框 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="输入消息..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Text style={styles.sendText}>发送</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 169, 110, 0.2)',
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#C9A96E',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8D5B7',
  },
  headerRight: {
    width: 40,
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: '#C9A96E',
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#C9A96E',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textMe: {
    color: '#1a1a1a',
  },
  textOther: {
    color: '#E8D5B7',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  timeMe: {
    color: 'rgba(26, 26, 26, 0.6)',
    textAlign: 'right',
  },
  timeOther: {
    color: 'rgba(232, 213, 183, 0.6)',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 169, 110, 0.2)',
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#E8D5B7',
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 12,
    backgroundColor: '#C9A96E',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
