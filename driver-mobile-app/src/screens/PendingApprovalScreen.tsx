import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { getApplicationStatusApi } from '../services/driver.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PendingApproval'>;

const PendingApprovalScreen = ({ navigation }: Props) => {
  const { state, refreshDriver } = useAuth();
  const [status, setStatus] = useState<string>('under_review');
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = async () => {
    if (!state.token) return;
    try {
      setRefreshing(true);
      const res = await getApplicationStatusApi(state.token);
      const data = res.data.data;
      setStatus(data.status);
      await refreshDriver();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const statusLabel: Record<string, string> = {
    under_review: 'Under Review',
    active: 'Approved',
    restricted: 'Restricted',
    blocked: 'Blocked',
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, status === 'active' && styles.badgeApproved]}>
            <Text style={styles.badgeText}>{statusLabel[status] ?? status}</Text>
          </View>
        </View>
        <Text style={styles.title}>Application under review</Text>
        <Text style={styles.body}>
          Your application has been submitted. We are reviewing your documents and details.
          Approval usually takes 24–48 hours.
        </Text>
        <View style={styles.bullets}>
          <Text style={styles.bullet}>• We verify your identity and documents.</Text>
          <Text style={styles.bullet}>• We check your eligibility for deployments.</Text>
          <Text style={styles.bullet}>• You will be notified once approved.</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.refreshButton} onPress={loadStatus} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator color="#ffffff" size="small" />
              : <Text style={styles.refreshText}>Refresh status</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('DocumentUpload')}>
            <Text style={styles.editText}>Edit documents</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('ProfileSetup')}>
          <Text style={styles.editProfileText}>Edit profile details</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 60,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  badgeRow: {
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeApproved: {
    backgroundColor: '#d1fae5',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 12,
  },
  bullets: {
    marginBottom: 20,
  },
  bullet: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  refreshButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  refreshText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
  },
  editText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  editProfileButton: {
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9c9c9e',
    alignItems: 'center',
  },
  editProfileText: {
    color: '#000000',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default PendingApprovalScreen;

