import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, Easing, Dimensions } from 'react-native';
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
  const [complimentIndex, setComplimentIndex] = useState(-1);
  
  // Easter Egg State
  const [catTaps, setCatTaps] = useState(0);
  const [isCatRunning, setIsCatRunning] = useState(false);
  const [catVerticalPos, setCatVerticalPos] = useState('40%');
  const catPosition = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    ensureAuth();
    if (complimentIndex === -1) {
      const compliments = t('common.compliments', { returnObjects: true });
      if (Array.isArray(compliments) && compliments.length > 0) {
        setComplimentIndex(Math.floor(Math.random() * compliments.length));
      }
    }
  }, []);

  const ensureAuth = async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e) {
      console.error("Auth failed", e);
    }
  };

  const dailyMessage = complimentIndex !== -1 
    ? t(`common.compliments.${complimentIndex}`) 
    : '';

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
          <View>
            <Text style={[styles.welcome, { color: theme.text + '80' }]}>{t('common.welcome')}</Text>
          </View>
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
    padding: 25,
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
    paddingHorizontal: 10,
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
  runningCat: {
    position: 'absolute',
    zIndex: 999,
  },
});

export default HomeScreen;
