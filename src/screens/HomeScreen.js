import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSOS = async () => {
    // Note: Replace with the actual phone number including country code, e.g., '4915112345678'
    const unclePhoneNumber = '491234567890'; // Dummy number
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
      Alert.alert(t('common.error'), 'Ein Fehler ist aufgetreten.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcome}>{t('common.welcome')}</Text>
          <TouchableOpacity 
            onLongPress={() => navigation.navigate('SecretUnlock')}
            delayLongPress={2000}
          >
            <Text style={styles.title}>{t('freundebuch.title')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainCard}>
          <Ionicons name="book-outline" size={100} color="#ff6b6b" />
          <Text style={styles.subtitle}>{t('freundebuch.tagline')}</Text>
        </View>

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

        <TouchableOpacity style={styles.helpButton} onPress={handleSOS}>
          <Text style={styles.helpButtonText}>🆘 {t('common.helpUncle')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    color: '#666',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
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
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  langButtonActive: {
    backgroundColor: '#ffe0e0',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  langText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpButton: {
    backgroundColor: '#333',
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
});

export default HomeScreen;
