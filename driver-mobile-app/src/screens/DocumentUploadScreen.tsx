import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { listDocumentsApi, submitApplicationApi, uploadDocumentApi } from '../services/driver.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DocumentUpload'>;

type DocType = 'driver_license' | 'id_document' | 'profile_photo' | 'bank_details';

const requiredDocs: { key: DocType; label: string }[] = [
  { key: 'driver_license', label: 'Driver license' },
  { key: 'id_document', label: 'Identification document' },
  { key: 'profile_photo', label: 'Profile photo' },
  { key: 'bank_details', label: 'Bank details proof' },
];

const DocumentUploadScreen = ({ navigation }: Props) => {
  const { state, refreshDriver } = useAuth();
  const [uploadedTypes, setUploadedTypes] = useState<DocType[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadDocs = async () => {
    if (!state.token) return;
    const res = await listDocumentsApi(state.token);
    const types = (res.data.data as any[]).map((d) => d.type) as DocType[];
    setUploadedTypes(types);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const fakeUpload = async (type: DocType) => {
    if (!state.token) return;
    try {
      await uploadDocumentApi(state.token, {
        type,
        fileUrl: `https://files.example.com/${type}.pdf`,
        fileName: `${type}.pdf`,
      });
      await loadDocs();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.response?.data?.message || 'Please try again.');
    }
  };

  const allRequiredUploaded = requiredDocs.every((d) => uploadedTypes.includes(d.key));

  const onSubmitApplication = async () => {
    if (!state.token) return;
    if (!allRequiredUploaded) {
      Alert.alert('Missing documents', 'Please upload all required documents before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      await submitApplicationApi(state.token);
      await refreshDriver();
      navigation.navigate('PendingApproval');
    } catch (e: any) {
      Alert.alert('Submission failed', e?.response?.data?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.stepLabel}>Step 2 of 3</Text>
      <Text style={styles.title}>Upload your documents</Text>
      {requiredDocs.map((doc) => {
        const uploaded = uploadedTypes.includes(doc.key);
        return (
          <View key={doc.key} style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{doc.label}</Text>
              <Text style={styles.cardSubtitle}>{uploaded ? 'Uploaded' : 'Required'}</Text>
            </View>
            <TouchableOpacity style={uploaded ? styles.cardButtonSecondary : styles.cardButton} onPress={() => fakeUpload(doc.key)}>
              <Text style={uploaded ? styles.cardButtonSecondaryText : styles.cardButtonText}>
                {uploaded ? 'Replace' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <TouchableOpacity
        style={[styles.primaryButton, !allRequiredUploaded && styles.primaryButtonDisabled]}
        onPress={onSubmitApplication}
        disabled={!allRequiredUploaded || submitting}
      >
        <Text style={styles.primaryText}>
          {submitting ? 'Submitting...' : 'Submit application for review'}
        </Text>
      </TouchableOpacity>
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
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  cardButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cardButtonSecondary: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardButtonSecondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentUploadScreen;

