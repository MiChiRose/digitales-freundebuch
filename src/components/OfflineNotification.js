import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const OfflineNotification = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!state.isConnected && !!state.isInternetReachable !== false;
      
      if (!connected) {
        showNotification();
      } else {
        hideNotification();
      }
    });

    return () => unsubscribe();
  }, []);

  const showNotification = () => {
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: Constants.statusBarHeight + 10,
      useNativeDriver: true,
      tension: 20,
      friction: 7
    }).start();
  };

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-offline-outline" size={24} color="#4A4063" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('common.offlineTitle')}</Text>
            <Text style={styles.message}>{t('common.offlineMsg')}</Text>
          </View>
          <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#7C7392" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    marginHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    // iOS shadow
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Android shadow
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E9E3FF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4063',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#7C7392',
    lineHeight: 18,
  },
  closeButton: {
    padding: 5,
    marginLeft: 5,
  },
});

export default OfflineNotification;
