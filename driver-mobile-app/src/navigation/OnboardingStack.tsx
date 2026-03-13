import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';

export type OnboardingStackParamList = {
  ProfileSetup: undefined;
  DocumentUpload: undefined;
  PendingApproval: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;

