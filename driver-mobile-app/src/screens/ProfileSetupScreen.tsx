import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import InputField from '../components/forms/InputField';
import { useAuth } from '../context/AuthContext';
import { updateProfileApi } from '../services/driver.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;

const ProfileSetupScreen = ({ navigation }: Props) => {
  const { state, refreshDriver } = useAuth();
  const [fullName, setFullName] = useState(state.user?.name ?? '');
  const [phone, setPhone] = useState(state.user?.phone ?? '');
  const [email, setEmail] = useState(state.user?.email ?? '');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [loading, setLoading] = useState(false);

  const alreadySubmitted = (state.driverProfile?.onboardingStep ?? 0) >= 3;

  const onContinue = async () => {
    if (!state.token) return;
    try {
      setLoading(true);
      await updateProfileApi(state.token, {
        fullName,
        phone,
        email,
        address,
        bankDetails: { bankName, accountName, iban },
      });
      await refreshDriver();
      // If editing after submission, go back to pending approval. Otherwise continue onboarding.
      if (alreadySubmitted) {
        navigation.navigate('PendingApproval');
      } else {
        navigation.navigate('DocumentUpload');
      }
    } catch (e: any) {
      Alert.alert('Profile update failed', e?.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {alreadySubmitted && (
          <TouchableOpacity onPress={() => navigation.navigate('PendingApproval')} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#374151', fontWeight: '600' }}>← Back to application status</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.stepLabel}>{alreadySubmitted ? 'Edit profile' : 'Step 1 of 3'}</Text>
        <Text style={styles.title}>{alreadySubmitted ? 'Update your details' : 'Complete your profile'}</Text>
        <InputField label="Full name" value={fullName} onChangeText={setFullName} />
        <InputField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <InputField label="Address" value={address} onChangeText={setAddress} />
        <Text style={styles.sectionTitle}>Bank details</Text>
        <InputField label="Bank name" value={bankName} onChangeText={setBankName} />
        <InputField label="Account holder" value={accountName} onChangeText={setAccountName} />
        <InputField label="IBAN" value={iban} onChangeText={setIban} autoCapitalize="characters" />
        <TouchableOpacity style={styles.primaryButton} onPress={onContinue} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? 'Saving...' : alreadySubmitted ? 'Save changes' : 'Save & continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stepLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileSetupScreen;

