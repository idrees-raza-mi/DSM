import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';
import { useAuth } from '../context/AuthContext';

export type OnboardingStackParamList = {
  ProfileSetup: undefined;
  DocumentUpload: undefined;
  PendingApproval: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  const { state } = useAuth();
  const step = state.driverProfile?.onboardingStep ?? 0;

  // Jump directly to the correct screen based on how far the user has progressed
  const initialRoute: keyof OnboardingStackParamList =
    step >= 3 ? 'PendingApproval' :
    step >= 1 ? 'DocumentUpload' :
    'ProfileSetup';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;

