import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DriverDashboardScreen from '../screens/DriverDashboardScreen';
import AvailableDeploymentsScreen from '../screens/AvailableDeploymentsScreen';
import DriverScoreScreen from '../screens/DriverScoreScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Deployments: undefined;
  Score: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DriverDashboardScreen} />
      <Tab.Screen name="Deployments" component={AvailableDeploymentsScreen} />
      <Tab.Screen name="Score" component={DriverScoreScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileSettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;

