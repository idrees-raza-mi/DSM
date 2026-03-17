import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import MainTabs from './MainTabs';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { state } = useAuth();

  const isAuthenticated = !!state.token;
  const onboardingStep = state.driverProfile?.onboardingStep;
  const driverStatus = state.driverProfile?.status;

  // onboardingStep: 0=registered, 1=profile, 2=docs, 3=submitted, 4=approved
  const needsOnboarding =
    isAuthenticated &&
    (onboardingStep === undefined || onboardingStep < 4) &&
    driverStatus !== 'active';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;

