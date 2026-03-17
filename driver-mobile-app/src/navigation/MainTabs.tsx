import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard:   { active: 'grid',        inactive: 'grid-outline' },
  Deployments: { active: 'car',         inactive: 'car-outline' },
  Score:       { active: 'star',        inactive: 'star-outline' },
  Earnings:    { active: 'wallet',      inactive: 'wallet-outline' },
  Profile:     { active: 'person',      inactive: 'person-outline' },
};

const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard"   component={DriverDashboardScreen} />
      <Tab.Screen name="Deployments" component={AvailableDeploymentsScreen} />
      <Tab.Screen name="Score"       component={DriverScoreScreen} />
      <Tab.Screen name="Earnings"    component={EarningsScreen} />
      <Tab.Screen name="Profile"     component={ProfileSettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
