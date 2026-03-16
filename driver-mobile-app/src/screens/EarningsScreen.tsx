import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { getBillingPeriodsApi, generateBillingPeriodApi, submitInvoiceApi } from '../services/driver.api';

const EarningsScreen = () => {
  const { state } = useAuth();
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadPeriods = async () => {
    if (!state.token) return;
    setLoading(true);
    try {
      const res = await getBillingPeriodsApi(state.token);
      setPeriods(res.data.data || []);
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, [state.token]);

  const handleGenerate = async () => {
    if (!state.token) return;
    const now = new Date();
    // Generate for previous month
    let month = now.getMonth(); // 0-indexed, so current month -1
    let year = now.getFullYear();
    if (month === 0) {
      month = 12;
      year -= 1;
    }

    setGenerating(true);
    try {
      await generateBillingPeriodApi(state.token, month, year);
      Alert.alert('Generated', `Billing period for ${month}/${year} created.`);
      loadPeriods();
    } catch (err: any) {
      Alert.alert('Info', err.response?.data?.message || 'Could not generate billing period.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadInvoice = async (periodId: string, amount: number) => {
    if (!state.token) return;
    // In production, this would open a file picker. Using placeholder URL.
    try {
      await submitInvoiceApi(state.token, periodId, 'invoice-upload-placeholder.pdf', amount);
      Alert.alert('Submitted', 'Invoice submitted for admin review.');
      loadPeriods();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit invoice');
    }
  };

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const totalEarnings = periods.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const renderPeriod = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.periodLabel}>
          {monthNames[item.month]} {item.year}
        </Text>
        <Text style={styles.periodAmount}>{item.totalAmount.toFixed(2)} EUR</Text>
      </View>
      <Text style={styles.missionCount}>{item.totalMissions} mission(s)</Text>

      {item.missions && item.missions.length > 0 && (
        <View style={styles.missionList}>
          {item.missions.slice(0, 3).map((m: any, i: number) => (
            <View key={i} style={styles.missionRow}>
              <Text style={styles.missionLocation}>{m.location} - {m.timeSlot}</Text>
              <Text style={styles.missionPay}>{m.compensation} EUR</Text>
            </View>
          ))}
          {item.missions.length > 3 && (
            <Text style={styles.moreText}>+{item.missions.length - 3} more</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.invoiceBtn}
        onPress={() => handleUploadInvoice(item._id, item.totalAmount)}
      >
        <Text style={styles.invoiceBtnText}>Upload Invoice</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>{totalEarnings.toFixed(2)} EUR</Text>
        <Text style={styles.summaryPeriods}>{periods.length} billing period(s)</Text>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Billing Periods</Text>
        <TouchableOpacity
          style={[styles.generateBtn, generating && { opacity: 0.6 }]}
          onPress={handleGenerate}
          disabled={generating}
        >
          <Text style={styles.generateBtnText}>
            {generating ? 'Generating...' : 'Generate Last Month'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 30 }} />
      ) : periods.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No billing periods yet. Complete missions and generate your monthly summary.
          </Text>
        </View>
      ) : (
        <FlatList
          data={periods}
          renderItem={renderPeriod}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: { color: '#9ca3af', fontSize: 14 },
  summaryAmount: { color: '#fff', fontSize: 32, fontWeight: '800', marginVertical: 4 },
  summaryPeriods: { color: '#6b7280', fontSize: 13 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  generateBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  generateBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  periodAmount: { fontSize: 18, fontWeight: '800', color: '#059669' },
  missionCount: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  missionList: { marginTop: 10 },
  missionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  missionLocation: { fontSize: 13, color: '#374151' },
  missionPay: { fontSize: 13, fontWeight: '600', color: '#111827' },
  moreText: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  invoiceBtn: {
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  invoiceBtnText: { color: '#111827', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 30 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});

export default EarningsScreen;
