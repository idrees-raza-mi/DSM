import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';

const EarningsScreen = () => {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Earnings</Text>
      <Text style={styles.body}>
        Your completed missions and monthly earnings summaries will appear here, together with invoice status.
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

export default EarningsScreen;

