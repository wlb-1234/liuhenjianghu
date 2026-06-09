/**
 * 敏感词检测示例页面
 * 展示如何在发帖、评论、用户名等场景使用敏感词过滤
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { 
  checkSensitiveWords, 
  checkSensitiveWordsDebounced, 
  checkSensitiveWordsLocal,
  getSensitiveWarningMessage,
  SensitiveCheckResult 
} from '@/utils/sensitiveCheck';

export default function SensitiveCheckDemo() {
  const [postContent, setPostContent] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [username, setUsername] = useState('');
  const [checkResult, setCheckResult] = useState<SensitiveCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // 帖子内容检测（实时检测）
  const handlePostChange = useCallback((text: string) => {
    setPostContent(text);
    setIsChecking(true);
    
    checkSensitiveWordsDebounced(text, (result) => {
      setCheckResult(result);
      setIsChecking(false);
    }, 500); // 500ms 防抖
  }, []);

  // 评论内容检测（实时检测）
  const handleCommentChange = useCallback((text: string) => {
    setCommentContent(text);
  }, []);

  // 用户名检测（提交前检测）
  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
  }, []);

  // 检测用户名
  const checkUsername = async () => {
    if (!username.trim()) return;
    
    const result = await checkSensitiveWords(username);
    if (result.hasSensitive) {
      Alert.alert('敏感词提醒', getSensitiveWarningMessage(result.words));
    } else {
      Alert.alert('提示', '用户名检测通过');
    }
  };

  // 检测评论
  const checkComment = async () => {
    if (!commentContent.trim()) return;
    
    const result = await checkSensitiveWords(commentContent);
    setCheckResult(result);
    
    if (result.hasSensitive) {
      Alert.alert('敏感词提醒', getSensitiveWarningMessage(result.words));
    }
  };

  // 提交帖子
  const submitPost = async () => {
    if (!postContent.trim()) return;
    
    const result = await checkSensitiveWords(postContent);
    
    if (result.hasSensitive) {
      Alert.alert(
        '内容包含敏感词',
        getSensitiveWarningMessage(result.words),
        [
          { text: '修改', style: 'cancel' },
          { 
            text: '强制提交', 
            style: 'destructive',
            onPress: () => {
              // 调用实际发帖 API，使用过滤后的文本
              console.log('提交帖子（已过滤）:', result.filtered);
              Alert.alert('提示', '帖子已提交（敏感词已过滤）');
            }
          }
        ]
      );
    } else {
      // 调用实际发帖 API
      console.log('提交帖子:', postContent);
      Alert.alert('提示', '帖子提交成功');
    }
  };

  return (
    <Screen>
      <View className="flex-1 p-4 bg-gray-50">
        {/* 帖子发布 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">发布帖子</Text>
          
          <TextInput
            className="bg-gray-100 rounded-lg p-3 min-h-32 text-gray-800 mb-3"
            placeholder="分享你的江湖故事..."
            multiline
            value={postContent}
            onChangeText={handlePostChange}
          />
          
          {/* 敏感词检测结果 */}
          {checkResult && checkResult.hasSensitive && (
            <View className="bg-red-50 rounded-lg p-3 mb-3">
              <Text className="text-red-600 text-sm">
                ⚠️ 检测到敏感词：{checkResult.words.join('、')}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                过滤后：{checkResult.filtered}
              </Text>
            </View>
          )}
          
          {isChecking && (
            <Text className="text-gray-400 text-sm mb-3">检测中...</Text>
          )}
          
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-500 text-sm">
              {postContent.length}/2000
            </Text>
            <TouchableOpacity 
              className="bg-indigo-600 px-4 py-2 rounded-lg"
              onPress={submitPost}
            >
              <Text className="text-white font-medium">发布</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 评论输入 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">发表评论</Text>
          
          <TextInput
            className="bg-gray-100 rounded-lg p-3 min-h-20 text-gray-800 mb-3"
            placeholder="说点什么..."
            multiline
            value={commentContent}
            onChangeText={handleCommentChange}
          />
          
          <View className="flex-row justify-end gap-2">
            <TouchableOpacity 
              className="bg-gray-200 px-4 py-2 rounded-lg"
              onPress={checkComment}
            >
              <Text className="text-gray-700 font-medium">检测</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-indigo-600 px-4 py-2 rounded-lg"
              onPress={checkComment}
            >
              <Text className="text-white font-medium">评论</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 用户名设置 */}
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">设置用户名</Text>
          
          <TextInput
            className="bg-gray-100 rounded-lg p-3 text-gray-800 mb-3"
            placeholder="请输入用户名"
            value={username}
            onChangeText={handleUsernameChange}
          />
          
          <View className="flex-row justify-end gap-2">
            <TouchableOpacity 
              className="bg-gray-200 px-4 py-2 rounded-lg"
              onPress={checkUsername}
            >
              <Text className="text-gray-700 font-medium">检测</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-indigo-600 px-4 py-2 rounded-lg"
              onPress={checkUsername}
            >
              <Text className="text-white font-medium">保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Screen>
  );
}

// 简化版本，使用本地检测（无需网络请求）
function SimpleSensitiveCheck() {
  // 内置基础敏感词列表
  const basicWords = ['毒品', '赌博', '诈骗', '色情', '暴力'];

  const [text, setText] = useState('');
  const [result, setResult] = useState<{hasSensitive: boolean; words: string[]}>({
    hasSensitive: false,
    words: []
  });

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // 本地快速检测
    const lowerText = newText.toLowerCase();
    const found = basicWords.filter(word => 
      lowerText.includes(word.toLowerCase())
    );
    
    setResult({
      hasSensitive: found.length > 0,
      words: found
    });
  };

  return (
    <View>
      <TextInput
        value={text}
        onChangeText={handleTextChange}
        placeholder="输入内容检测敏感词"
      />
      
      {result.hasSensitive && (
        <Text style={{color: 'red'}}>
          检测到敏感词: {result.words.join(', ')}
        </Text>
      )}
    </View>
  );
}
