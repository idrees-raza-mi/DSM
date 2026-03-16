import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
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
      // In production, use device GPS. Using placeholder coords for now.
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reserved: '#f59e0b',
      confirmed: '#3b82f6',
      checked_in: '#059669',
      completed: '#059669',
      cancelled: '#dc2626',
      no_show: '#dc2626',
      withdrawn: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getHoursUntilStart = (startTime: string) => {
    return (new Date(startTime).getTime() - Date.now()) / (1000 * 60 * 60);
  };

  const renderBooking = ({ item }: { item: any }) => {
    const a = item.assignment;
    const loc = a?.location || {};
    const hoursUntil = a?.startTime ? getHoursUntilStart(a.startTime) : 999;
    const canConfirm = item.status === 'reserved' && hoursUntil <= 24 && hoursUntil > 0;
    const canCheckIn = item.status === 'confirmed' && hoursUntil <= 1;
    const canCancel = ['reserved', 'confirmed'].includes(item.status) && hoursUntil > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.locationName}>{loc.name || 'Assignment'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
        <Text style={styles.cityText}>{loc.city || ''}</Text>
        {a && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(a.date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Slot</Text>
              <Text style={styles.detailValue}>{slotLabel[a.timeSlot] || a.timeSlot}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pay</Text>
              <Text style={styles.detailValue}>{a.compensation} EUR</Text>
            </View>
            {hoursUntil > 0 && hoursUntil < 48 && (
              <Text style={styles.timeUntil}>
                {hoursUntil < 1 ? 'Starting soon' : `${Math.round(hoursUntil)}h until start`}
              </Text>
            )}
          </>
        )}

        {/* Confirmation timeline */}
        {item.status === 'reserved' && (
          <View style={styles.confirmInfo}>
            <Text style={styles.confirmInfoText}>
              Confirm before T-6h or slot will be auto-withdrawn
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {canConfirm && (
            <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(item._id)}>
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
          )}
          {canCheckIn && (
            <>
              {activeCheckIn === item._id ? (
                <View style={styles.checkInForm}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Check-in code"
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
                  <Text style={styles.btnText}>Check In</Text>
                </TouchableOpacity>
              )}
            </>
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

  return (
    <ScreenContainer>
      <Text style={styles.greeting}>Hi, {state.user?.name || 'driver'}</Text>
      <View style={styles.statusRow}>
        <View>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{state.driverProfile?.status ?? 'unknown'}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Assignments</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 30 }} />
      ) : bookings.length === 0 ? (
        <Text style={styles.emptyText}>No active assignments. Browse available deployments to book slots.</Text>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  statusLabel: { fontSize: 14, color: '#6b7280' },
  statusValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  scoreContainer: { alignItems: 'flex-end' },
  scoreLabel: { fontSize: 14, color: '#6b7280' },
  scoreValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cityText: { fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  timeUntil: { fontSize: 13, color: '#f59e0b', fontWeight: '600', marginTop: 6 },
  confirmInfo: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 10, marginTop: 10 },
  confirmInfoText: { fontSize: 12, color: '#92400e', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  confirmBtn: { backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  checkInBtn: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  cancelBtn: { borderWidth: 1, borderColor: '#dc2626', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  checkInForm: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 120,
    fontSize: 16,
  },
});

export default DriverDashboardScreen;
