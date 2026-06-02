import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
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
          <Text style={styles.subtitle}>Halte deine Erinnerungen fest!</Text>
        </View>

        <View style={styles.langContainer}>
          <TouchableOpacity style={styles.langButton} onPress={() => changeLanguage('de')}>
            <Text style={styles.langText}>🇩🇪 DE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.langButton} onPress={() => changeLanguage('en')}>
            <Text style={styles.langText}>🇺🇸 EN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.langButton} onPress={() => changeLanguage('ru')}>
            <Text style={styles.langText}>🇷🇺 RU</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>🆘 Hilfe von Onkel rufen</Text>
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
