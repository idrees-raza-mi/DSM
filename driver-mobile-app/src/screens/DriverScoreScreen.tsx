import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';

const DriverScoreScreen = () => {
  const { state } = useAuth();
  const score = state.driverProfile?.currentScore ?? 100;

  let level = 'Normal access';
  if (score >= 90) level = 'Priority slots';
  else if (score < 70 && score >= 60) level = 'Limited access';
  else if (score < 60) level = 'Restricted';

  return (
    <ScreenContainer>
      <Text style={styles.title}>Your driver score</Text>
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.level}>{level}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <Text style={styles.sectionBody}>Completed missions add small bonuses. Late cancellations and no-shows reduce your score.</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  score: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
  },
  level: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
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

export default DriverScoreScreen;

