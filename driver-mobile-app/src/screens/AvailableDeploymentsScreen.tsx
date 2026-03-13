import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';

const AvailableDeploymentsScreen = () => {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Available deployments</Text>
      <Text style={styles.body}>
        In a later phase this screen will list available assignments with location, time window, and payment, and
        allow you to make binding reservations.
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default AvailableDeploymentsScreen;

