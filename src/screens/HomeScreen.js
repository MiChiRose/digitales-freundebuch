import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Animated, Easing, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../context/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import {
  DEFAULT_RUNTIME_CONFIG,
  getSeasonalEggRunKey,
  isSeasonalEasterEggActive,
  loadRuntimeConfig,
} from '../services/appConfig';

const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [complimentIndex, setComplimentIndex] = useState(-1);
  const [currentSeason, setCurrentSeason] = useState('winter');
  const [runtimeConfig, setRuntimeConfig] = useState(DEFAULT_RUNTIME_CONFIG);
  
  // Easter Egg State
  const [catTaps, setCatTaps] = useState(0);
  const [isCatRunning, setIsCatRunning] = useState(false);
  const [catVerticalPos, setCatVerticalPos] = useState('40%');
  const [seasonalTaps, setSeasonalTaps] = useState(0);
  const [isSeasonalEggVisible, setIsSeasonalEggVisible] = useState(false);
  const [seasonalVerticalPos, setSeasonalVerticalPos] = useState('32%');
  const catPosition = useRef(new Animated.Value(-100)).current;
  const seasonalAnimation = useRef(new Animated.Value(0)).current;
  const mainCardScale = useRef(new Animated.Value(1)).current;

  const seasonalEgg = runtimeConfig?.featureFlags?.seasonalEasterEgg || DEFAULT_RUNTIME_CONFIG.featureFlags.seasonalEasterEgg;
  const seasonalEggActive = isSeasonalEasterEggActive(runtimeConfig, i18n.language);

  useEffect(() => {
    ensureAuth();
    initializeDailyMessage();
  }, [i18n.language]);

  useEffect(() => {
    let isMounted = true;

    loadRuntimeConfig().then((config) => {
      if (isMounted) {
        setRuntimeConfig(config);
      }
    });

    return () => {
      isMounted = false;
      catPosition.stopAnimation();
      seasonalAnimation.stopAnimation();
      mainCardScale.stopAnimation();
    };
  }, [catPosition, mainCardScale, seasonalAnimation]);

  const ensureAuth = async () => {
    try {
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e) {
      console.error("Auth failed", e);
    }
  };

  const getSeason = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  const initializeDailyMessage = () => {
    const season = getSeason();
    setCurrentSeason(season);
    
    if (complimentIndex === -1) {
      const complimentsData = t('common.compliments', { returnObjects: true });
      if (complimentsData && complimentsData.general) {
        const generalPool = complimentsData.general || [];
        const seasonPool = complimentsData[season] || [];
        const poolSize = generalPool.length + seasonPool.length;
        if (poolSize > 0) {
          setComplimentIndex(Math.floor(Math.random() * poolSize));
        }
      }
    }
  };

  const getDailyMessage = () => {
    if (complimentIndex === -1) return '';
    
    const complimentsData = t('common.compliments', { returnObjects: true });
    if (!complimentsData) return '';
    
    const pool = [...(complimentsData.general || []), ...(complimentsData[currentSeason] || [])];
    
    if (pool.length > 0 && complimentIndex < pool.length) {
      return pool[complimentIndex];
    }
    return pool[0] || '';
  };

  const dailyMessage = getDailyMessage();

  const handleSecretChatAccess = async () => {
    try {
      if (runtimeConfig?.featureFlags?.secretChatEnabled === false) {
        Alert.alert(t('secretChat.safety.title'), t('secretChat.safety.chatDisabled'));
        return;
      }

      const myData = await AsyncStorage.getItem('my_profile');
      if (myData) {
        const parsed = JSON.parse(myData);
        if (parsed?.name && parsed?.age && parsed?.hobby && parsed?.food && parsed?.dream) {
          navigation.navigate('SecretUnlock');
          return;
        }
      }
      
      Alert.alert(
        t('secretChat.profileRequired'),
        t('secretChat.profileRequiredMsg'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.edit'), onPress: () => navigation?.navigate('Questionnaire', { isMyProfile: true }) }
        ]
      );
    } catch (e) {
      console.error(e);
    }
  };

  const getSeasonSticker = () => {
    if (currentSeason === 'spring') return '🌷';
    if (currentSeason === 'summer') return '🍦';
    if (currentSeason === 'autumn') return '🍁';
    return '❄️';
  };

  const tryRunSeasonalEgg = async (nextTaps) => {
    if (!seasonalEggActive || isSeasonalEggVisible) return;

    const triggerTapCount = seasonalEgg?.triggerTapCount || 7;
    if (nextTaps < triggerTapCount) return;

    setSeasonalTaps(0);

    const maxRunsPerDay = seasonalEgg?.maxRunsPerDay || 1;
    const runKey = getSeasonalEggRunKey(seasonalEgg);
    const currentRuns = Number(await AsyncStorage.getItem(runKey)) || 0;

    if (currentRuns >= maxRunsPerDay) return;

    await AsyncStorage.setItem(runKey, String(currentRuns + 1));
    runSeasonalEggAnimation();
  };

  const runSeasonalEggAnimation = () => {
    const randomY = Math.floor(Math.random() * 45) + 18;
    setSeasonalVerticalPos(`${randomY}%`);
    setIsSeasonalEggVisible(true);
    seasonalAnimation.setValue(0);

    Animated.timing(seasonalAnimation, {
      toValue: 1,
      duration: seasonalEgg?.durationMs || 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSeasonalEggVisible(false);
      seasonalAnimation.setValue(0);
    });
  };

  const handleCatTap = async () => {
    const newSeasonalTaps = seasonalTaps + 1;
    setSeasonalTaps(newSeasonalTaps);
    tryRunSeasonalEgg(newSeasonalTaps).catch(console.error);

    if (runtimeConfig?.featureFlags?.localCatEasterEggEnabled === false) return;
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
      toValue: screenWidth + 100,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setIsCatRunning(false);
    });
  };

  const animateMainCard = (toValue) => {
    Animated.spring(mainCardScale, {
      toValue,
      speed: 22,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
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
            <View style={[styles.stickerBadge, { backgroundColor: theme.secondary, borderColor: theme.accent }]}>
              <Text style={[styles.stickerText, { color: theme.text }]}>{getSeasonSticker()} {t('common.stickerOfDay')}</Text>
            </View>
            <Text style={[styles.complimentText, { color: theme.text }]}>{dailyMessage}</Text>
          </View>
        ) : null}

        <Animated.View style={[styles.mainCardWrap, { transform: [{ scale: mainCardScale }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleCatTap}
            onPressIn={() => animateMainCard(0.97)}
            onPressOut={() => animateMainCard(1)}
            style={[styles.mainCard, { backgroundColor: theme.card, shadowColor: theme.primary }]}
          >
            <Ionicons name="book-outline" size={100} color={theme.primary} />
            <Text style={[styles.subtitle, { color: theme.text }]}>{t('freundebuch.tagline')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Running Cat Easter Egg */}
      {isCatRunning && (
        <Animated.View style={[styles.runningCat, { top: catVerticalPos, transform: [{ translateX: catPosition }] }]}>
          <Text style={{ fontSize: 60 }}>🐈</Text>
        </Animated.View>
      )}

      {isSeasonalEggVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.seasonalEgg,
            {
              top: seasonalVerticalPos,
              opacity: seasonalAnimation.interpolate({
                inputRange: [0, 0.18, 0.82, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: seasonalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, -42],
                  }),
                },
                {
                  scale: seasonalAnimation.interpolate({
                    inputRange: [0, 0.25, 1],
                    outputRange: [0.65, 1.25, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.seasonalEggText, { color: theme.primary, textShadowColor: theme.card }]}>
            {seasonalEgg?.value || '67'}
          </Text>
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
  stickerBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  stickerText: {
    fontSize: 12,
    fontWeight: '700',
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
  mainCardWrap: {
    width: '100%',
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
  seasonalEgg: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 998,
    alignItems: 'center',
  },
  seasonalEggText: {
    fontSize: 72,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});

export default HomeScreen;
