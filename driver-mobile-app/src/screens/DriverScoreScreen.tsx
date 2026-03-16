import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { getScoreApi } from '../services/driver.api';

const DriverScoreScreen = () => {
  const { state } = useAuth();
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!state.token) return;
      try {
        const res = await getScoreApi(state.token);
        setScoreData(res.data.data);
      } catch {
        // Use local fallback
        setScoreData({
          currentScore: state.driverProfile?.currentScore ?? 100,
          tier: 'normal',
          history: [],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [state.token]);

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 60 }} />
      </ScreenContainer>
    );
  }

  const score = scoreData?.currentScore ?? 100;
  const tier = scoreData?.tier ?? 'normal';
  const history = scoreData?.history ?? [];

  const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
    priority: { label: 'Priority Slots', color: '#065f46', bg: '#d1fae5' },
    normal: { label: 'Normal Access', color: '#1e40af', bg: '#dbeafe' },
    limited: { label: 'Limited Access', color: '#92400e', bg: '#fef3c7' },
    restricted: { label: 'Restricted', color: '#991b1b', bg: '#fee2e2' },
  };

  const t = tierConfig[tier] || tierConfig.normal;

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      no_show: 'No-show',
      late_cancel: 'Late cancellation',
      completed: 'Mission completed',
      admin_adjustment: 'Admin adjustment',
    };
    return labels[reason] || reason;
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyReason}>{getReasonLabel(item.reason)}</Text>
        <Text style={styles.historyDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.historyDelta, { color: item.delta >= 0 ? '#059669' : '#dc2626' }]}>
        {item.delta >= 0 ? '+' : ''}{item.delta}
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>Your Driver Score</Text>

      <View style={styles.scoreCard}>
        <Text style={styles.score}>{score}</Text>
        <View style={[styles.tierBadge, { backgroundColor: t.bg }]}>
          <Text style={[styles.tierText, { color: t.color }]}>{t.label}</Text>
        </View>
      </View>

      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>How it works</Text>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleLabel}>Completed mission</Text>
          <Text style={[styles.ruleValue, { color: '#059669' }]}>+2</Text>
        </View>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleLabel}>Late cancellation (&lt;24h)</Text>
          <Text style={[styles.ruleValue, { color: '#dc2626' }]}>-10</Text>
        </View>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleLabel}>No-show</Text>
          <Text style={[styles.ruleValue, { color: '#dc2626' }]}>-20</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.tierInfo}>90-100: Priority slots</Text>
        <Text style={styles.tierInfo}>70-89: Normal access</Text>
        <Text style={styles.tierInfo}>60-69: Limited (remaining slots only)</Text>
        <Text style={styles.tierInfo}>&lt;60: Restricted</Text>
      </View>

      {history.length > 0 && (
        <>
          <Text style={styles.historyTitle}>Score History</Text>
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  scoreCard: { alignItems: 'center', marginBottom: 24 },
  score: { fontSize: 56, fontWeight: '800', color: '#111827' },
  tierBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  tierText: { fontSize: 14, fontWeight: '700' },
  rulesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  rulesTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  ruleLabel: { fontSize: 14, color: '#6b7280' },
  ruleValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },
  tierInfo: { fontSize: 13, color: '#6b7280', paddingVertical: 2 },
  historyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  historyLeft: {},
  historyReason: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  historyDelta: { fontSize: 18, fontWeight: '800' },
});

export default DriverScoreScreen;
