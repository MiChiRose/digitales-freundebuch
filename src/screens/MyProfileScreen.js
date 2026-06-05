import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as Application from 'expo-application';
import * as Clipboard from 'expo-clipboard';
import NetInfo from '@react-native-community/netinfo';
import { db } from '../context/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const MyProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { theme, changeTheme, themes } = useTheme();
  const [profile, setProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [debugTaps, setDebugTaps] = useState(0);
  const [deviceId, setDeviceId] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      checkOwnerStatus();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected && !!state.isInternetReachable !== false);
    });
    return () => unsubscribe();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await AsyncStorage.getItem('my_profile');
      if (data) {
        setProfile(JSON.parse(data));
      }
    } catch (e) {
      console.error('Load error', e);
    }
  };

  const checkOwnerStatus = async () => {
    try {
      const id = await Application.getAndroidId();
      setDeviceId(id);
      
      if (!db) return;
      const configRef = doc(db, 'config', 'app_owner');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const ownerIds = configSnap.data()?.allowed_device_ids || [];
        if (ownerIds.includes(id)) {
          setIsOwner(true);
        }
      }
    } catch (e) {
      console.error("Owner check failed", e);
    }
  };

  const handleHeaderTap = () => {
    setDebugTaps(prev => prev + 1);
    if (debugTaps >= 9) { // 10 taps total
      Alert.alert(
        t('common.diagnosticTitle'),
        t('common.diagnosticMsg', { id: deviceId || 'Unknown' }),
        [
          { text: "Copy", onPress: () => Clipboard.setStringAsync(deviceId || '') },
          { text: "OK" }
        ]
      );
      setDebugTaps(0);
    }
  };

  const changeLanguage = (lng) => {
    i18n?.changeLanguage?.(lng);
  };

  const handleSOS = async () => {
    const unclePhoneNumber = process?.env?.EXPO_PUBLIC_UNCLE_PHONE;
    
    if (!unclePhoneNumber) {
      Alert.alert(t('common.error'), 'Telefonnummer nicht konfiguriert.');
      return;
    }

    const message = t('common.sosMessage');
    const url = `whatsapp://send?phone=${unclePhoneNumber}&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('common.noWhatsApp'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Ein Fehler ist aufgetreten.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme?.secondary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={1} onPress={handleHeaderTap}>
            <Text style={[styles.headerTitle, { color: theme?.text }]}>{t('freundebuch.myProfile')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme?.card, shadowColor: theme?.primary }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme?.secondary, borderColor: theme?.primary }]}>
            <Text style={styles.avatarText}>{profile?.mood || '👤'}</Text>
          </View>
          <Text style={[styles.name, { color: theme?.text }]}>{profile?.name || t('freundebuch.yourName')}</Text>
          
          <View style={[styles.infoContainer, { backgroundColor: theme?.secondary + '40' }]}>
            <Text style={[styles.infoText, { color: theme?.text }]}>🎂 {t('freundebuch.fields.age')}: {profile?.age || '?'}</Text>
            <Text style={[styles.infoText, { color: theme?.text }]}>🎨 {t('freundebuch.fields.hobby')}: {profile?.hobby || '?'}</Text>
            <Text style={[styles.infoText, { color: theme?.text }]}>🍕 {t('freundebuch.fields.food')}: {profile?.food || '?'}</Text>
            <Text style={[styles.infoText, { color: theme?.text }]}>🌈 {t('freundebuch.fields.dream')}: {profile?.dream || '?'}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme?.primary, shadowColor: theme?.primary }]}
            onPress={() => navigation?.navigate('Questionnaire', { isMyProfile: true })}
          >
            <Text style={[styles.editButtonText, { color: theme?.buttonText }]}>{t('common.edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* SOS Button for Owner only */}
        {isOwner && isConnected && (
          <TouchableOpacity 
            style={[styles.helpButton, { backgroundColor: theme?.text }]} 
            onPress={handleSOS}
          >
            <Text style={[styles.helpButtonText, { color: theme?.card }]}>🆘 {t('common.helpUncle')}</Text>
          </TouchableOpacity>
        )}

        {/* Theme Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme?.text }]}>{t('common.themeTitle')}</Text>
          <View style={styles.themeContainer}>
            {themes?.map((t) => (
              <TouchableOpacity
                key={t?.id}
                style={[
                  styles.themeButton,
                  { backgroundColor: t?.primary },
                  theme?.id === t?.id && styles.themeButtonActive
                ]}
                onPress={() => changeTheme?.(t?.id)}
              >
                <Text style={styles.themeIcon}>{t?.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme?.text }]}>{t('common.languageTitle')}</Text>
          <View style={styles.langContainer}>
            <TouchableOpacity 
              style={[
                styles.langButton, 
                { backgroundColor: theme?.accent + '40' },
                i18n?.language === 'de' && [styles.langButtonActive, { backgroundColor: theme?.accent, borderColor: theme?.primary }]
              ]} 
              onPress={() => changeLanguage('de')}
            >
              <Text style={[styles.langText, { color: theme?.text }]}>🇩🇪 DE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.langButton, 
                { backgroundColor: theme?.accent + '40' },
                i18n?.language === 'en' && [styles.langButtonActive, { backgroundColor: theme?.accent, borderColor: theme?.primary }]
              ]} 
              onPress={() => changeLanguage('en')}
            >
              <Text style={[styles.langText, { color: theme?.text }]}>🇺🇸 EN</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.langButton, 
                { backgroundColor: theme?.accent + '40' },
                i18n?.language === 'ru' && [styles.langButtonActive, { backgroundColor: theme?.accent, borderColor: theme?.primary }]
              ]} 
              onPress={() => changeLanguage('ru')}
            >
              <Text style={[styles.langText, { color: theme?.text }]}>🇷🇺 RU</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  editButton: {
    width: '100%',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  editButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
    padding: 18,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    width: '100%',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
  },
  themeButton: {
    width: 55,
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  themeButtonActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  themeIcon: {
    fontSize: 24,
  },
  langContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  langButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  langButtonActive: {
    borderWidth: 2,
  },
  langText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyProfileScreen;
