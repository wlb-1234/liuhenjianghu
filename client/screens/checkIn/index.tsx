/**
 * 签到页面
 * 用户每日签到获取经验值
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://liuhenjianghu.com';

interface CheckInStatus {
  checkedIn: boolean;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: string | null;
  canClaimReward: boolean;
}

interface Rewards {
  baseExp: number;
  streakBonus: number;
  maxStreakBonus: number;
  achievements: { days: number; name: string; bonus: number }[];
}

export default function CheckInScreen() {
  const router = useSafeRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [calendar, setCalendar] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 获取签到状态
  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/check-in/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('获取签到状态失败:', error);
    }
  }, [token]);

  // 获取奖励规则
  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/check-in/rewards`);
      const data = await res.json();
      if (data.success) {
        setRewards(data.data);
      }
    } catch (error) {
      console.error('获取奖励规则失败:', error);
    }
  }, []);

  // 获取签到日历
  const fetchCalendar = useCallback(async () => {
    if (!token) return;
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/check-in/calendar?year=${year}&month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setCalendar(data.data.dates);
      }
    } catch (error) {
      console.error('获取签到日历失败:', error);
    }
  }, [token, currentMonth]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchRewards(), fetchCalendar()]);
      setLoading(false);
    };
    init();
  }, [fetchStatus, fetchRewards, fetchCalendar]);

  // 签到
  const handleCheckIn = async () => {
    if (!token || checking) return;
    setChecking(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/check-in`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setStatus((prev) =>
          prev
            ? { ...prev, checkedIn: true, currentStreak: data.data.consecutiveDays, totalCheckIns: prev.totalCheckIns + 1 }
            : null
        );
        await fetchStatus();
        await fetchCalendar();
        alert(`签到成功！\n获得 ${data.data.expGained} 经验\n连续签到 ${data.data.consecutiveDays} 天`);
      } else {
        alert(data.message || '签到失败');
      }
    } catch (error) {
      console.error('签到失败:', error);
      alert('签到失败，请重试');
    } finally {
      setChecking(false);
    }
  };

  // 切换月份
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  // 渲染日历
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    const days = [];
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isChecked = calendar.includes(dateStr);
      const isToday = dateStr === today;
      days.push(
        <View key={d} style={[styles.dayCell, isChecked && styles.checkedDay, isToday && styles.todayDay]}>
          <Text style={[styles.dayText, isChecked && styles.checkedDayText]}>{d}</Text>
          {isChecked && <View style={styles.checkDot} />}
        </View>
      );
    }
    return days;
  };

  if (!user) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>请先登录</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>去登录</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.container}>
        {/* 签到卡片 */}
        <View style={styles.checkInCard}>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{status?.currentStreak || 0}</Text>
            <Text style={styles.streakLabel}>连续签到</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalInfo}>
            <Text style={styles.totalNumber}>{status?.totalCheckIns || 0}</Text>
            <Text style={styles.totalLabel}>累计签到</Text>
          </View>
        </View>

        {/* 签到按钮 */}
        <TouchableOpacity
          style={[styles.checkInBtn, status?.checkedIn && styles.checkedInBtn]}
          onPress={handleCheckIn}
          disabled={status?.checkedIn || checking}
        >
          {checking ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.checkInBtnText}>
              {status?.checkedIn ? '今日已签到 ✓' : '立即签到'}
            </Text>
          )}
        </TouchableOpacity>

        {/* 奖励说明 */}
        {rewards && (
          <View style={styles.rewardsCard}>
            <Text style={styles.sectionTitle}>奖励规则</Text>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>基础经验</Text>
              <Text style={styles.rewardValue}>+{rewards.baseExp}</Text>
            </View>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>连续签到奖励</Text>
              <Text style={styles.rewardValue}>+{rewards.streakBonus}/天</Text>
            </View>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>最高连续奖励</Text>
              <Text style={styles.rewardValue}>+{rewards.maxStreakBonus}</Text>
            </View>
            <Text style={styles.achievementTitle}>成就奖励</Text>
            {rewards.achievements.map((a, i) => (
              <View key={i} style={styles.achievementRow}>
                <Text style={styles.achievementLabel}>{a.name}</Text>
                <Text style={styles.achievementValue}>+{a.bonus}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 签到日历 */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Text style={styles.monthNav}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Text style={styles.monthNav}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekHeader}>
            {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
              <Text key={i} style={styles.weekText}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>{renderCalendar()}</View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, textAlign: 'center', marginTop: 40, color: '#666' },
  loginBtn: { margin: 20, backgroundColor: '#6366F1', padding: 15, borderRadius: 10, alignItems: 'center' },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  checkInCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakInfo: { alignItems: 'center' },
  streakNumber: { fontSize: 48, fontWeight: 'bold', color: '#F59E0B' },
  streakLabel: { fontSize: 14, color: '#666', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#E5E7EB' },
  totalInfo: { alignItems: 'center' },
  totalNumber: { fontSize: 48, fontWeight: 'bold', color: '#6366F1' },
  totalLabel: { fontSize: 14, color: '#666', marginTop: 4 },
  checkInBtn: {
    backgroundColor: '#6366F1',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkedInBtn: { backgroundColor: '#10B981' },
  checkInBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  rewardsCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rewardLabel: { fontSize: 15, color: '#666' },
  rewardValue: { fontSize: 15, color: '#10B981', fontWeight: '600' },
  achievementTitle: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 12 },
  achievementRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  achievementLabel: { fontSize: 14, color: '#F59E0B' },
  achievementValue: { fontSize: 14, color: '#F59E0B', fontWeight: '600' },
  calendarCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthNav: { fontSize: 18, color: '#6366F1', padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: 'bold' },
  weekHeader: { flexDirection: 'row', marginBottom: 8 },
  weekText: { flex: 1, textAlign: 'center', fontSize: 13, color: '#999' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  checkedDay: { backgroundColor: '#EEF2FF', borderRadius: 20 },
  todayDay: { borderWidth: 2, borderColor: '#6366F1', borderRadius: 20 },
  dayText: { fontSize: 15, color: '#333' },
  checkedDayText: { color: '#6366F1', fontWeight: 'bold' },
  checkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginTop: 2 },
  bottomPadding: { height: 40 },
});
