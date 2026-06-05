import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Alert, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineNotification from './src/components/OfflineNotification';
import { ThemeProvider } from './src/context/ThemeContext';

// Ignore specific warnings if needed
LogBox.ignoreLogs(['Setting a timer']);

// Global Error Handler for JS
const originalHandler = global.ErrorUtils.getGlobalHandler();
global.ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('GLOBAL ERROR:', error);
  Alert.alert(
    'Oops! Something went wrong',
    `${error.name}: ${error.message}\n${isFatal ? '(Fatal)' : ''}`,
    [{ text: 'OK' }]
  );
  if (originalHandler) {
    originalHandler(error, isFatal);
  }
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this error, safe to ignore */
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Heartbeat to check if JS thread is alive
    const heartbeat = setInterval(() => {
      console.log(`[HEARTBEAT] ${new Date().toLocaleTimeString()} - App is alive`);
    }, 10000);

    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    return () => clearInterval(heartbeat);
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <OfflineNotification />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
