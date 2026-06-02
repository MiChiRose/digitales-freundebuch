import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../screens/HomeScreen';
import FriendsScreen from '../screens/FriendsScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import SecretUnlockScreen from '../screens/SecretUnlockScreen';
import ChatScreen from '../screens/ChatScreen';
import QuestionnaireScreen from '../screens/QuestionnaireScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6b6b',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('common.welcome') }} />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: t('freundebuch.friends') }} />
      <Tab.Screen name="Profile" component={MyProfileScreen} options={{ title: t('freundebuch.myProfile') }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="SecretUnlock" component={SecretUnlockScreen} />
      <Stack.Screen name="SecretChat" component={ChatScreen} />
      <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
