import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';

const DriverDashboardScreen = () => {
  const { state } = useAuth();

  return (
    <ScreenContainer>
      <Text style={styles.greeting}>Hi, {state.user?.name || 'driver'}</Text>
      <Text style={styles.statusLabel}>Status</Text>
      <Text style={styles.statusValue}>{state.driverProfile?.status ?? 'unknown'}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.sectionBody}>Your upcoming assignments and confirmations will appear here.</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default DriverDashboardScreen;

