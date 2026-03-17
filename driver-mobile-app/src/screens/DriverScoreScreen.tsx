import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getScoreApi } from '../services/driver.api';

const POLL_INTERVAL = 30_000;

const RULES = [
  { label: 'Completed mission',        delta: '+2',  color: '#059669', icon: 'checkmark-circle-outline' as const },
  { label: 'Late cancellation (<24h)', delta: '−10', color: '#dc2626', icon: 'close-circle-outline' as const },
  { label: 'No-show',                  delta: '−20', color: '#dc2626', icon: 'ban-outline' as const },
];

const TIERS = [
  { range: '90–100', label: 'Priority Slots',   color: '#065f46', bg: '#d1fae5', min: 90 },
  { range: '70–89',  label: 'Normal Access',    color: '#1e40af', bg: '#dbeafe', min: 70 },
  { range: '60–69',  label: 'Limited Access',   color: '#92400e', bg: '#fef3c7', min: 60 },
  { range: '<60',    label: 'Restricted',        color: '#991b1b', bg: '#fee2e2', min: 0  },
];

const DriverScoreScreen = () => {
  const { state } = useAuth();
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScore = useCallback(async (silent = false) => {
    if (!state.token) return;
    if (!silent) setLoading(true);
    try {
      const res = await getScoreApi(state.token);
      setScoreData(res.data.data);
    } catch {
      setScoreData((prev: any) => prev ?? {
        currentScore: state.driverProfile?.currentScore ?? 100,
        tier: 'normal',
        history: [],
      });
    } finally {
      setLoading(false);
    }
  }, [state.token]);

  useFocusEffect(
    useCallback(() => {
      loadScore();
      const interval = setInterval(() => loadScore(true), POLL_INTERVAL);
      return () => clearInterval(interval);
    }, [loadScore])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScore(true);
    setRefreshing(false);
  }, [loadScore]);

  if (loading && !scoreData) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const score = scoreData?.currentScore ?? 100;
  const history = scoreData?.history ?? [];

  const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
    priority:   { label: 'Priority Slots', color: '#065f46', bg: '#d1fae5' },
    normal:     { label: 'Normal Access',  color: '#1e40af', bg: '#dbeafe' },
    limited:    { label: 'Limited Access', color: '#92400e', bg: '#fef3c7' },
    restricted: { label: 'Restricted',     color: '#991b1b', bg: '#fee2e2' },
  };

  const tier = scoreData?.tier ?? 'normal';
  const t = tierConfig[tier] || tierConfig.normal;

  const scoreBarColor = score >= 70 ? '#059669' : score >= 60 ? '#f59e0b' : '#dc2626';

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      no_show:          'No-show',
      late_cancel:      'Late cancellation',
      completed:        'Mission completed',
      admin_adjustment: 'Admin adjustment',
    };
    return labels[reason] || reason;
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <View style={[styles.historyDot, { backgroundColor: item.delta >= 0 ? '#d1fae5' : '#fee2e2' }]}>
        <Ionicons
          name={item.delta >= 0 ? 'arrow-up' : 'arrow-down'}
          size={12}
          color={item.delta >= 0 ? '#059669' : '#dc2626'}
        />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyReason}>{getReasonLabel(item.reason)}</Text>
        <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.historyDelta, { color: item.delta >= 0 ? '#059669' : '#dc2626' }]}>
        {item.delta >= 0 ? '+' : ''}{item.delta}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111827" />}
        ListHeaderComponent={
          <>
            {/* Page title */}
            <View style={styles.headerBar}>
              <Text style={styles.title}>Driver Score</Text>
            </View>

            {/* Score hero */}
            <View style={styles.heroCard}>
              <Text style={styles.scoreNum}>{score}</Text>
              <Text style={styles.scoreDenom}> / 100</Text>
              <View style={[styles.tierPill, { backgroundColor: t.bg }]}>
                <Text style={[styles.tierPillText, { color: t.color }]}>{t.label}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${score}%` as any, backgroundColor: scoreBarColor }]} />
              </View>
            </View>

            {/* Scoring rules */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Score Rules</Text>
              {RULES.map((r) => (
                <View key={r.label} style={styles.ruleRow}>
                  <View style={styles.ruleLeft}>
                    <Ionicons name={r.icon} size={16} color={r.color} />
                    <Text style={styles.ruleLabel}>{r.label}</Text>
                  </View>
                  <Text style={[styles.ruleValue, { color: r.color }]}>{r.delta}</Text>
                </View>
              ))}
            </View>

            {/* Tier table */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Access Tiers</Text>
              {TIERS.map((tier) => (
                <View key={tier.range} style={[styles.tierRow, { backgroundColor: score >= tier.min && (tier.min === 90 ? score >= 90 : score >= tier.min && score < (tier.min === 70 ? 90 : tier.min === 60 ? 70 : 60)) ? tier.bg : 'transparent' }]}>
                  <Text style={styles.tierRange}>{tier.range}</Text>
                  <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                </View>
              ))}
            </View>

            {history.length > 0 && (
              <Text style={styles.historyTitle}>Score History</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No score history yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },

  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },

  listContent: { paddingBottom: 30 },

  heroCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scoreNum: { fontSize: 64, fontWeight: '900', color: '#111827', lineHeight: 70 },
  scoreDenom: { fontSize: 18, color: '#9ca3af', fontWeight: '600', marginBottom: 10 },
  tierPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 14 },
  tierPillText: { fontSize: 14, fontWeight: '700' },
  progressBg: { width: '100%', height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  ruleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleLabel: { fontSize: 14, color: '#374151' },
  ruleValue: { fontSize: 15, fontWeight: '800' },

  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  tierRange: { fontSize: 13, fontWeight: '700', color: '#374151' },
  tierLabel: { fontSize: 13, fontWeight: '600' },

  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  historyDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: { flex: 1 },
  historyReason: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyDate: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  historyDelta: { fontSize: 18, fontWeight: '800' },

  emptyHistory: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  emptyHistoryText: { fontSize: 14, color: '#9ca3af' },
});

export default DriverScoreScreen;
