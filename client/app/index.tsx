console.log('>>> 简化版 index.tsx 开始加载');

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

console.log('>>> 简化版 index.tsx 导入完成');

export default function SimpleIndex() {
  console.log('>>> SimpleIndex 组件渲染');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>测试页面 - 如果你能看到这段文字，说明路由正常工作</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});
