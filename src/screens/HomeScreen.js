import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Animated, Easing, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../context/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSOS = async () => {
    // Read the phone number from environment variables securely
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
    if (setupTaps === 9) { // 10 taps total
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
                Alert.alert("Erfolg", "Dieses Gerät ist nun registriert. SOS-Button ist aktiv.");
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
    // Generate a random vertical position between 10% and 85% to keep it within the screen
    const randomY = Math.floor(Math.random() * 75) + 10;
    setCatVerticalPos(`${randomY}%`);
    
    setIsCatRunning(true);
    catPosition.setValue(-100); // Start off-screen left
    
    Animated.timing(catPosition, {
      toValue: SCREEN_WIDTH + 100, // Move off-screen right
      duration: 2500, // 2.5 seconds to run across
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setIsCatRunning(false); // Reset when done
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={1} onPress={handleSetupTap}>
            <Text style={styles.welcome}>{t('common.welcome')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onLongPress={handleSecretChatAccess}
            delayLongPress={2000}
          >
            <Text style={styles.title}>{t('freundebuch.title')}</Text>
          </TouchableOpacity>
        </View>

        {dailyMessage ? (
          <View style={styles.complimentCard}>
            <Text style={styles.complimentText}>{dailyMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleCatTap}
          style={styles.mainCard}
        >
          <Ionicons name="book-outline" size={100} color="#A78BFA" />
          <Text style={styles.subtitle}>{t('freundebuch.tagline')}</Text>
        </TouchableOpacity>

        <View style={styles.langContainer}>
          <TouchableOpacity 
            style={[styles.langButton, i18n.language === 'de' && styles.langButtonActive]} 
            onPress={() => changeLanguage('de')}
          >
            <Text style={styles.langText}>🇩🇪 DE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langButton, i18n.language === 'en' && styles.langButtonActive]} 
            onPress={() => changeLanguage('en')}
          >
            <Text style={styles.langText}>🇺🇸 EN</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langButton, i18n.language === 'ru' && styles.langButtonActive]} 
            onPress={() => changeLanguage('ru')}
          >
            <Text style={styles.langText}>🇷🇺 RU</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <TouchableOpacity style={styles.helpButton} onPress={handleSOS}>
            <Text style={styles.helpButtonText}>🆘 {t('common.helpUncle')}</Text>
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
    backgroundColor: '#F8F6FF', // Soft ivory lavender
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
    color: '#7C7392', // Soft dark grey/purple
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A4063', // Deep plum/grey
    textAlign: 'center',
  },
  complimentCard: {
    backgroundColor: '#FFF5F8', // Very light pink
    padding: 20,
    borderRadius: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD1DC',
    alignItems: 'center',
    shadowColor: '#FFD1DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  complimentText: {
    fontSize: 16,
    color: '#8B5E83', // Muted rose
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  mainCard: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#4A4063',
    marginTop: 20,
    fontWeight: '500',
  },
  langContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  langButton: {
    backgroundColor: '#E9E3FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  langButtonActive: {
    backgroundColor: '#C3B1E1', // Richer lavender for active
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  langText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4063',
  },
  helpButton: {
    backgroundColor: '#4A4063',
    padding: 15,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  runningCat: {
    position: 'absolute',
    zIndex: 999,
  },
});


export default HomeScreen;
