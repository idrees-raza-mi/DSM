import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { getApplicationStatusApi } from '../services/driver.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PendingApproval'>;

const PendingApprovalScreen = (_props: Props) => {
  const { state, refreshDriver } = useAuth();
  const [message, setMessage] = useState(
    'Your application has been submitted. Please wait while we review your documents. Approval usually takes 24–48 hours.'
  );

  const loadStatus = async () => {
    if (!state.token) return;
    const res = await getApplicationStatusApi(state.token);
    setMessage(res.data.data.message);
    await refreshDriver();
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Application under review</Text>
        <Text style={styles.body}>{message}</Text>
        <View style={styles.bullets}>
          <Text style={styles.bullet}>• We verify your identity and documents.</Text>
          <Text style={styles.bullet}>• We check your eligibility for deployments.</Text>
          <Text style={styles.bullet}>• You will receive a notification when approved.</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadStatus}>
          <Text style={styles.refreshText}>Refresh status</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 80,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
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
    marginBottom: 16,
  },
  bullet: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  refreshText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default PendingApprovalScreen;

