import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { getAvailableAssignmentsApi, reserveAssignmentApi } from '../services/driver.api';

const AvailableDeploymentsScreen = () => {
  const { state } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    if (!state.token) return;
    setLoading(true);
    try {
      const res = await getAvailableAssignmentsApi(state.token);
      setAssignments(res.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [state.token]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleReserve = async (assignmentId: string) => {
    if (!state.token) return;
    setReserving(assignmentId);
    try {
      await reserveAssignmentApi(state.token, assignmentId);
      Alert.alert('Reserved', 'Slot reserved with binding agreement. Please confirm before T-6h.');
      loadAssignments();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reserve');
    } finally {
      setReserving(null);
    }
  };

  const slotLabel: Record<string, string> = { morning: 'Morning', midday: 'Midday', evening: 'Evening' };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }: { item: any }) => {
    const a = item.assignment;
    const loc = a.location || {};
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.locationName}>{loc.name || 'Unknown Location'}</Text>
          <Text style={styles.compensation}>{a.compensation} EUR</Text>
        </View>
        <Text style={styles.cityText}>{loc.city || ''}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatDate(a.date)}</Text>
          <Text style={styles.detailValue}>{slotLabel[a.timeSlot] || a.timeSlot}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Slots remaining</Text>
          <Text style={styles.detailValue}>{item.slotsRemaining}</Text>
        </View>
        <TouchableOpacity
          style={[styles.reserveBtn, reserving === a._id && styles.reserveBtnDisabled]}
          onPress={() => handleReserve(a._id)}
          disabled={reserving === a._id}
        >
          <Text style={styles.reserveBtnText}>
            {reserving === a._id ? 'Reserving...' : 'Make Binding Reservation'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Available Deployments</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
      ) : assignments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No available slots</Text>
          <Text style={styles.emptyText}>
            {state.driverProfile?.status !== 'active'
              ? 'Your account must be active to see deployments.'
              : 'Check back later for new deployments.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderItem}
          keyExtractor={(item) => item.assignment._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  compensation: { fontSize: 18, fontWeight: '800', color: '#059669' },
  cityText: { fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 10 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  reserveBtn: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  reserveBtnDisabled: { opacity: 0.6 },
  reserveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});

export default AvailableDeploymentsScreen;
