import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineNotification from './src/components/OfflineNotification';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <OfflineNotification />
    </GestureHandlerRootView>
  );
}
