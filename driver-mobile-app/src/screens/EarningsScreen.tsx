import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getBillingPeriodsApi, generateBillingPeriodApi, submitInvoiceApi } from '../services/driver.api';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const POLL_INTERVAL = 30_000;

const EarningsScreen = () => {
  const { state } = useAuth();
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadPeriods = useCallback(async (silent = false) => {
    if (!state.token) return;
    if (!silent) setLoading(true);
    try {
      const res = await getBillingPeriodsApi(state.token);
      setPeriods(res.data.data || []);
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [state.token]);

  useFocusEffect(
    useCallback(() => {
      loadPeriods();
      const interval = setInterval(() => loadPeriods(true), POLL_INTERVAL);
      return () => clearInterval(interval);
    }, [loadPeriods])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPeriods(true);
    setRefreshing(false);
  }, [loadPeriods]);

  const handleGenerate = async () => {
    if (!state.token) return;
    const now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();
    if (month === 0) { month = 12; year -= 1; }

    setGenerating(true);
    try {
      await generateBillingPeriodApi(state.token, month, year);
      Alert.alert('Generated', `Billing period for ${MONTH_NAMES[month]} ${year} created.`);
      loadPeriods();
    } catch (err: any) {
      Alert.alert('Info', err.response?.data?.message || 'Could not generate billing period.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadInvoice = async (periodId: string, amount: number) => {
    if (!state.token) return;
    try {
      await submitInvoiceApi(state.token, periodId, 'invoice-upload-placeholder.pdf', amount);
      Alert.alert('Submitted', 'Invoice submitted for admin review.');
      loadPeriods();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit invoice');
    }
  };

  const totalEarnings = periods.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const renderPeriod = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.periodLabel}>{MONTH_NAMES[item.month]} {item.year}</Text>
          <Text style={styles.missionCount}>{item.totalMissions} mission{item.totalMissions !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.periodAmount}>{item.totalAmount.toFixed(2)} EUR</Text>
      </View>

      {item.missions && item.missions.length > 0 && (
        <View style={styles.missionList}>
          {item.missions.slice(0, 3).map((m: any, i: number) => (
            <View key={i} style={styles.missionRow}>
              <View style={styles.missionLeft}>
                <Ionicons name="location-outline" size={12} color="#9ca3af" />
                <Text style={styles.missionLocation}>{m.location} — {m.timeSlot}</Text>
              </View>
              <Text style={styles.missionPay}>{m.compensation} EUR</Text>
            </View>
          ))}
          {item.missions.length > 3 && (
            <Text style={styles.moreText}>+{item.missions.length - 3} more missions</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.invoiceBtn}
        onPress={() => handleUploadInvoice(item._id, item.totalAmount)}
        activeOpacity={0.85}
      >
        <Ionicons name="document-attach-outline" size={16} color="#111827" />
        <Text style={styles.invoiceBtnText}>Upload Invoice</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={periods}
        renderItem={renderPeriod}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111827" />}
        ListHeaderComponent={
          <>
            {/* Header bar */}
            <View style={styles.headerBar}>
              <Text style={styles.title}>Earnings</Text>
            </View>

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryAmount}>{totalEarnings.toFixed(2)}</Text>
              <Text style={styles.summaryUnit}>EUR</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{periods.length}</Text>
                  <Text style={styles.summaryStatLabel}>Periods</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>
                    {periods.reduce((s, p) => s + (p.totalMissions || 0), 0)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Missions</Text>
                </View>
              </View>
            </View>

            {/* Section header */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Billing Periods</Text>
              <TouchableOpacity
                style={[styles.generateBtn, generating && { opacity: 0.5 }]}
                onPress={handleGenerate}
                disabled={generating}
              >
                {generating
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Ionicons name="add-outline" size={14} color="#fff" />
                      <Text style={styles.generateBtnText}>Generate</Text>
                    </>
                }
              </TouchableOpacity>
            </View>

            {loading && (
              <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="wallet-outline" size={28} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No billing periods</Text>
              <Text style={styles.emptyText}>Complete missions and tap Generate to create your monthly summary.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { paddingBottom: 30 },

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

  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  summaryAmount: { color: '#fff', fontSize: 44, fontWeight: '900', marginTop: 4 },
  summaryUnit: { color: '#6b7280', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  summaryStat: { alignItems: 'center' },
  summaryStatValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  summaryStatLabel: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  summaryStatDivider: { width: 1, height: 30, backgroundColor: '#374151' },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  generateBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  periodLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  missionCount: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  periodAmount: { fontSize: 20, fontWeight: '800', color: '#059669' },

  missionList: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginBottom: 12,
    gap: 6,
  },
  missionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  missionLocation: { fontSize: 13, color: '#6b7280' },
  missionPay: { fontSize: 13, fontWeight: '700', color: '#111827' },
  moreText: { fontSize: 12, color: '#9ca3af' },

  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 11,
  },
  invoiceBtnText: { color: '#111827', fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', marginTop: 20, paddingHorizontal: 40 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});

export default EarningsScreen;
