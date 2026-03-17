import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getMyAssignmentsApi, confirmAssignmentApi, checkInApi, cancelAssignmentApi } from '../services/driver.api';

const DriverDashboardScreen = () => {
  const { state, refreshDriver } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInCode, setCheckInCode] = useState('');
  const [activeCheckIn, setActiveCheckIn] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!state.token) return;
    setLoading(true);
    try {
      const res = await getMyAssignmentsApi(state.token);
      setBookings(res.data.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [state.token]);

  useEffect(() => {
    loadBookings();
    refreshDriver();
  }, [loadBookings]);

  const handleConfirm = async (bookingId: string) => {
    if (!state.token) return;
    try {
      await confirmAssignmentApi(state.token, bookingId);
      Alert.alert('Confirmed', 'Assignment confirmed successfully.');
      loadBookings();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to confirm');
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!state.token) return;
    Alert.alert('Cancel Booking', 'Are you sure? Late cancellations affect your score.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await cancelAssignmentApi(state.token!, bookingId);
            const type = res.data.data?.cancellationType;
            Alert.alert('Cancelled', type === 'late'
              ? 'Late cancellation — score penalty applied.'
              : 'Cancelled on time — no penalty.');
            loadBookings();
            refreshDriver();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const handleCheckIn = async (bookingId: string) => {
    if (!state.token || !checkInCode) {
      Alert.alert('Error', 'Please enter the check-in code.');
      return;
    }
    try {
      await checkInApi(state.token, bookingId, checkInCode, 0, 0);
      Alert.alert('Checked In', 'Mission completed! Score bonus applied.');
      setActiveCheckIn(null);
      setCheckInCode('');
      loadBookings();
      refreshDriver();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Check-in failed');
    }
  };

  const slotLabel: Record<string, string> = { morning: 'Morning', midday: 'Midday', evening: 'Evening' };
  const slotColor: Record<string, string> = { morning: '#fef3c7', midday: '#dbeafe', evening: '#ede9fe' };
  const slotTextColor: Record<string, string> = { morning: '#92400e', midday: '#1e40af', evening: '#5b21b6' };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const getStatusStyle = (status: string): { bg: string; color: string } => {
    const map: Record<string, { bg: string; color: string }> = {
      reserved:   { bg: '#fef3c7', color: '#92400e' },
      confirmed:  { bg: '#dbeafe', color: '#1e40af' },
      checked_in: { bg: '#d1fae5', color: '#065f46' },
      completed:  { bg: '#d1fae5', color: '#065f46' },
      cancelled:  { bg: '#fee2e2', color: '#991b1b' },
      no_show:    { bg: '#fee2e2', color: '#991b1b' },
      withdrawn:  { bg: '#f3f4f6', color: '#6b7280' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const getHoursUntilStart = (startTime: string) =>
    (new Date(startTime).getTime() - Date.now()) / (1000 * 60 * 60);

  const renderBooking = ({ item }: { item: any }) => {
    const a = item.assignment;
    const loc = a?.location || {};
    const hoursUntil = a?.startTime ? getHoursUntilStart(a.startTime) : 999;
    const canConfirm = item.status === 'reserved' && hoursUntil <= 24 && hoursUntil > 0;
    const canCheckIn = item.status === 'confirmed' && hoursUntil <= 1;
    const canCancel = ['reserved', 'confirmed'].includes(item.status) && hoursUntil > 0;
    const ss = getStatusStyle(item.status);
    const ts = a?.timeSlot ?? '';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.locationName}>{loc.name || 'Assignment'}</Text>
            <Text style={styles.cityText}>{loc.city || ''}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
            <Text style={[styles.statusPillText, { color: ss.color }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {a && (
          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={12} color="#6b7280" />
              <Text style={styles.metaText}>{formatDate(a.date)}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: slotColor[ts] ?? '#f3f4f6' }]}>
              <Text style={[styles.metaText, { color: slotTextColor[ts] ?? '#374151', fontWeight: '600' }]}>
                {slotLabel[ts] || ts}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="cash-outline" size={12} color="#059669" />
              <Text style={[styles.metaText, { color: '#059669', fontWeight: '700' }]}>{a.compensation} EUR</Text>
            </View>
          </View>
        )}

        {item.status === 'reserved' && hoursUntil > 0 && hoursUntil <= 24 && (
          <View style={styles.warningBanner}>
            <Ionicons name="time-outline" size={13} color="#92400e" />
            <Text style={styles.warningText}>
              {hoursUntil < 1 ? 'Starting very soon' : `${Math.round(hoursUntil)}h until start`} — confirm now
            </Text>
          </View>
        )}

        {item.status === 'reserved' && hoursUntil > 24 && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={13} color="#1e40af" />
            <Text style={styles.infoText}>Confirm before T-6h or slot will be auto-withdrawn</Text>
          </View>
        )}

        <View style={styles.actions}>
          {canConfirm && (
            <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(item._id)}>
              <Ionicons name="checkmark" size={15} color="#fff" />
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
          )}
          {canCheckIn && (
            activeCheckIn === item._id ? (
              <View style={styles.checkInForm}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Enter code"
                  placeholderTextColor="#9ca3af"
                  value={checkInCode}
                  onChangeText={setCheckInCode}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.checkInBtn} onPress={() => handleCheckIn(item._id)}>
                  <Text style={styles.btnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.checkInBtn} onPress={() => setActiveCheckIn(item._id)}>
                <Ionicons name="location" size={15} color="#fff" />
                <Text style={styles.btnText}>Check In</Text>
              </TouchableOpacity>
            )
          )}
          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item._id)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const score = state.driverProfile?.currentScore ?? 100;
  const st = state.driverProfile?.status ?? 'unknown';
  const statusColor: Record<string, string> = {
    active: '#059669', restricted: '#d97706', blocked: '#dc2626', under_review: '#6b7280',
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>Hi, {state.user?.name?.split(' ')[0] || 'Driver'}</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { loadBookings(); refreshDriver(); }}>
          <Ionicons name="refresh-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={[styles.statusDot, { backgroundColor: statusColor[st] ?? '#6b7280' }]} />
            <Text style={[styles.statValue, { textTransform: 'capitalize' }]}>{st.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={[styles.statValue, { color: score >= 70 ? '#059669' : score >= 60 ? '#f59e0b' : '#dc2626' }]}>
            {score}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Bookings</Text>
          <Text style={styles.statValue}>{bookings.filter(b => ['reserved','confirmed'].includes(b.status)).length}</Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>My Assignments</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={28} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>No assignments yet</Text>
          <Text style={styles.emptyText}>Browse available deployments to book your first slot.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },

  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827' },
  dateText: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb', marginVertical: 2 },

  sectionRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  listContent: { paddingHorizontal: 20, paddingBottom: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTopLeft: { flex: 1, marginRight: 10 },
  locationName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cityText: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: { fontSize: 12, color: '#6b7280' },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  warningText: { fontSize: 12, color: '#92400e', flex: 1 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  infoText: { fontSize: 12, color: '#1e40af', flex: 1 },

  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  checkInForm: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 110,
    fontSize: 15,
    color: '#111827',
  },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
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

export default DriverDashboardScreen;
