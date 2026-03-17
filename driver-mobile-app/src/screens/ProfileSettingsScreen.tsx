import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileSettingsScreen = () => {
  const { state, logout } = useAuth();
  const user = state.user;
  const profile = state.driverProfile;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const score = profile?.currentScore ?? 100;
  const tier =
    score >= 90 ? { label: 'Priority', color: '#065f46', bg: '#d1fae5' } :
    score >= 70 ? { label: 'Normal', color: '#1e40af', bg: '#dbeafe' } :
    score >= 60 ? { label: 'Limited', color: '#92400e', bg: '#fef3c7' } :
                  { label: 'Restricted', color: '#991b1b', bg: '#fee2e2' };

  const statusColor: Record<string, string> = {
    active: '#059669', restricted: '#d97706', blocked: '#dc2626', under_review: '#6b7280',
  };
  const st = profile?.status ?? 'unknown';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: statusColor[st] ?? '#6b7280' }]}>
              <Text style={styles.badgeText}>{st.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: tier.bg }]}>
              <Text style={[styles.badgeText, { color: tier.color }]}>{tier.label} Driver</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Info</Text>
          <InfoRow icon="mail-outline"   label="Email" value={user?.email ?? '—'} />
          <InfoRow icon="call-outline"   label="Phone" value={user?.phone ?? '—'} />
          <InfoRow icon="shield-checkmark-outline" label="Role" value="Driver" last />
        </View>

        {/* Score Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Performance</Text>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Driver Score</Text>
              <Text style={styles.scoreValue}>{score} / 100</Text>
            </View>
            <View style={[styles.tierPill, { backgroundColor: tier.bg }]}>
              <Text style={[styles.tierPillText, { color: tier.color }]}>{tier.label}</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${score}%` as any, backgroundColor: score >= 70 ? '#059669' : score >= 60 ? '#f59e0b' : '#dc2626' }]} />
          </View>
        </View>

        {/* Log out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({
  icon, label, value, last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
    <View style={styles.infoIconBox}>
      <Ionicons name={icon} size={16} color="#6b7280" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },

  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  scoreValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  tierPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tierPillText: { fontSize: 13, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    backgroundColor: '#fff5f5',
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});

export default ProfileSettingsScreen;
