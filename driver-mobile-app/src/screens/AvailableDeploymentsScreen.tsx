import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getAvailableAssignmentsApi, reserveAssignmentApi } from '../services/driver.api';

const POLL_INTERVAL = 30_000;

const AvailableDeploymentsScreen = () => {
  const { state } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reserving, setReserving] = useState<string | null>(null);

  const loadAssignments = useCallback(async (silent = false) => {
    if (!state.token) return;
    if (!silent) setLoading(true);
    try {
      const res = await getAvailableAssignmentsApi(state.token);
      setAssignments(res.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [state.token]);

  // Refresh on every tab focus + poll every 30s while on screen
  useFocusEffect(
    useCallback(() => {
      loadAssignments();
      const interval = setInterval(() => loadAssignments(true), POLL_INTERVAL);
      return () => clearInterval(interval);
    }, [loadAssignments])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssignments(true);
    setRefreshing(false);
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
  const slotColor: Record<string, string>  = { morning: '#fef3c7', midday: '#dbeafe', evening: '#ede9fe' };
  const slotTextColor: Record<string, string> = { morning: '#92400e', midday: '#1e40af', evening: '#5b21b6' };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const renderItem = ({ item }: { item: any }) => {
    const a = item.assignment;
    const loc = a.location || {};
    const ts = a.timeSlot ?? '';
    const isReserving = reserving === a._id;
    const slots = item.slotsRemaining ?? 0;

    return (
      <View style={styles.card}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.locationName}>{loc.name || 'Unknown Location'}</Text>
            <Text style={styles.cityText}>{loc.city || ''}</Text>
          </View>
          <Text style={styles.compensation}>{a.compensation} EUR</Text>
        </View>

        {/* Meta chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="calendar-outline" size={12} color="#6b7280" />
            <Text style={styles.chipText}>{formatDate(a.date)}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: slotColor[ts] ?? '#f3f4f6' }]}>
            <Ionicons name="time-outline" size={12} color={slotTextColor[ts] ?? '#6b7280'} />
            <Text style={[styles.chipText, { color: slotTextColor[ts] ?? '#374151', fontWeight: '600' }]}>
              {slotLabel[ts] || ts}
            </Text>
          </View>
          <View style={[styles.chip, slots <= 3 && { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="people-outline" size={12} color={slots <= 3 ? '#92400e' : '#6b7280'} />
            <Text style={[styles.chipText, slots <= 3 && { color: '#92400e', fontWeight: '600' }]}>
              {slots} slot{slots !== 1 ? 's' : ''} left
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.reserveBtn, isReserving && styles.reserveBtnDisabled]}
          onPress={() => handleReserve(a._id)}
          disabled={isReserving}
          activeOpacity={0.85}
        >
          {isReserving
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="bookmark-outline" size={16} color="#fff" />
                <Text style={styles.reserveBtnText}>Reserve Slot</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.title}>Deployments</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading...' : `${assignments.length} available slot${assignments.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadAssignments}>
          <Ionicons name="refresh-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 60 }} />
      ) : assignments.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="car-outline" size={30} color="#9ca3af" />
          </View>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111827" />}
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
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  listContent: { padding: 20, paddingBottom: 30 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
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
  cardTopLeft: { flex: 1, marginRight: 10 },
  locationName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cityText: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  compensation: { fontSize: 20, fontWeight: '800', color: '#059669' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: { fontSize: 12, color: '#6b7280' },

  reserveBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  reserveBtnDisabled: { opacity: 0.5 },
  reserveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});

export default AvailableDeploymentsScreen;
