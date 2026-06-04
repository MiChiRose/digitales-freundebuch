import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Animated, Easing, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../context/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [setupTaps, setSetupTaps] = useState(0);
  const [complimentIndex, setComplimentIndex] = useState(-1);
  
  // Easter Egg State
  const [catTaps, setCatTaps] = useState(0);
  const [isCatRunning, setIsCatRunning] = useState(false);
  const [catVerticalPos, setCatVerticalPos] = useState('40%');
  const catPosition = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    checkAdminStatus();
    if (complimentIndex === -1) {
      const compliments = t('common.compliments', { returnObjects: true });
      if (Array.isArray(compliments) && compliments.length > 0) {
        setComplimentIndex(Math.floor(Math.random() * compliments.length));
      }
    }
  }, []);

  const dailyMessage = complimentIndex !== -1 
    ? t(`common.compliments.${complimentIndex}`) 
    : '';

  const checkAdminStatus = async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const currentUid = auth.currentUser?.uid;
      const storedAdminUid = await AsyncStorage.getItem('app_owner_uid');
      
      if (currentUid && storedAdminUid && currentUid === storedAdminUid) {
        setIsAdmin(true);
      }
    } catch (e) {
      console.error("Admin check failed", e);
    }
  };

  const handleSOS = async () => {
    const unclePhoneNumber = process.env.EXPO_PUBLIC_UNCLE_PHONE;
    
    if (!unclePhoneNumber) {
      console.warn("Uncle's phone number is not configured in .env");
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
      console.error('An error occurred', error);
      Alert.alert(t('common.error'), 'Ein Fehler ist наступил.');
    }
  };

  // Secret backdoor to assign THIS specific phone as the Owner
  const handleSetupTap = async () => {
    setSetupTaps(prev => prev + 1);
    if (setupTaps === 9) {
      Alert.alert(
        "Admin Setup",
        "Möchtest du dieses Gerät als Hauptgerät (Nichte) registrieren?",
        [
          { text: "Abbrechen", style: "cancel" },
          { 
            text: "Registrieren", 
            style: "destructive",
            onPress: async () => {
              if (auth.currentUser) {
                await AsyncStorage.setItem('app_owner_uid', auth.currentUser.uid);
                setIsAdmin(true);
                Alert.alert("Erfolg", "Dieses Gerät ist nun registriert. SOS-Button ist актив.");
              }
            } 
          }
        ]
      );
      setSetupTaps(0);
    }
  };

  const handleSecretChatAccess = async () => {
    try {
      const myData = await AsyncStorage.getItem('my_profile');
      if (myData) {
        const parsed = JSON.parse(myData);
        if (parsed.name && parsed.age && parsed.hobby && parsed.food && parsed.dream) {
          navigation.navigate('SecretUnlock');
          return;
        }
      }
      
      Alert.alert(
        t('secretChat.profileRequired'),
        t('secretChat.profileRequiredMsg'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.edit'), onPress: () => navigation.navigate('Questionnaire', { isMyProfile: true }) }
        ]
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCatTap = () => {
    if (isCatRunning) return;
    const newTaps = catTaps + 1;
    setCatTaps(newTaps);
    if (newTaps >= 10) {
      setCatTaps(0);
      runCatAnimation();
    }
  };

  const runCatAnimation = () => {
    const randomY = Math.floor(Math.random() * 75) + 10;
    setCatVerticalPos(`${randomY}%`);
    setIsCatRunning(true);
    catPosition.setValue(-100);
    Animated.timing(catPosition, {
      toValue: SCREEN_WIDTH + 100,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setIsCatRunning(false);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.secondary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={1} onPress={handleSetupTap}>
            <Text style={[styles.welcome, { color: theme.text + '80' }]}>{t('common.welcome')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onLongPress={handleSecretChatAccess}
            delayLongPress={2000}
          >
            <Text style={[styles.title, { color: theme.text }]}>{t('freundebuch.title')}</Text>
          </TouchableOpacity>
        </View>

        {dailyMessage ? (
          <View style={[styles.complimentCard, { backgroundColor: theme.card, borderColor: theme.accent, shadowColor: theme.accent }]}>
            <Text style={[styles.complimentText, { color: theme.text }]}>{dailyMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleCatTap}
          style={[styles.mainCard, { backgroundColor: theme.card, shadowColor: theme.primary }]}
        >
          <Ionicons name="book-outline" size={100} color={theme.primary} />
          <Text style={[styles.subtitle, { color: theme.text }]}>{t('freundebuch.tagline')}</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity style={[styles.helpButton, { backgroundColor: theme.text }]} onPress={handleSOS}>
            <Text style={[styles.helpButtonText, { color: theme.card }]}>🆘 {t('common.helpUncle')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Running Cat Easter Egg */}
      {isCatRunning && (
        <Animated.View style={[styles.runningCat, { top: catVerticalPos, transform: [{ translateX: catPosition }] }]}>
          <Text style={{ fontSize: 60 }}>🐈</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcome: {
    fontSize: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  complimentCard: {
    padding: 25, // Increased padding
    borderRadius: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  complimentText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
    paddingHorizontal: 10, // Extra horizontal padding for the text itself
  },
  mainCard: {
    width: '100%',
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
  helpButton: {
    padding: 15,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  runningCat: {
    position: 'absolute',
    zIndex: 999,
  },
});

export default HomeScreen;
