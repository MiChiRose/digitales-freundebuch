import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let emoji;

          if (route.name === 'HomeTab') {
            emoji = '🏠';
          } else if (route.name === 'Friends') {
            emoji = '👯‍♀️';
          } else if (route.name === 'Profile') {
            emoji = '👤';
          }

          return (
            <View style={{ opacity: focused ? 1 : 0.5 }}>
              <Text style={{ fontSize: size }}>{emoji}</Text>
            </View>
          );
        },
        tabBarActiveTintColor: theme?.primary,
        tabBarInactiveTintColor: theme?.text + '80',
        tabBarStyle: {
          backgroundColor: theme?.card,
          borderTopColor: theme?.accent,
        },
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
