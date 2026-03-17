import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES = [
  { icon: 'car-outline' as const,    text: 'Browse & book deployment slots' },
  { icon: 'star-outline' as const,   text: 'Track your driver score & tier' },
  { icon: 'wallet-outline' as const, text: 'Manage earnings & invoices' },
];

const WelcomeScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topSection}>
        <View style={styles.logoMark}>
          <Ionicons name="flash" size={32} color="#fff" />
        </View>
        <Text style={styles.logo}>FleetX</Text>
        <Text style={styles.tagline}>Smart deployments for{'\n'}professional drivers.</Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={16} color="#111827" />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>Get started</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryText}>Already have an account? </Text>
          <Text style={styles.secondaryLink}>Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  topSection: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    justifyContent: 'center',
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 17,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 36,
  },
  featureList: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 14, color: '#374151', fontWeight: '500' },

  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryText: { color: '#6b7280', fontSize: 14 },
  secondaryLink: { color: '#111827', fontSize: 14, fontWeight: '700' },
});

export default WelcomeScreen;
