import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const MyProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('freundebuch.myProfile')}</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{profile?.mood || '👤'}</Text>
        </View>
        <Text style={styles.name}>{profile?.name || 'Dein Name'}</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>🎂 {t('freundebuch.fields.age')}: {profile?.age || '?'}</Text>
          <Text style={styles.infoText}>🎨 {t('freundebuch.fields.hobby')}: {profile?.hobby || '?'}</Text>
          <Text style={styles.infoText}>🍕 {t('freundebuch.fields.food')}: {profile?.food || '?'}</Text>
          <Text style={styles.infoText}>🌈 {t('freundebuch.fields.dream')}: {profile?.dream || '?'}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => navigation.navigate('Questionnaire', { isMyProfile: true })}
      >
        <Text style={styles.editButtonText}>{t('common.welcome') === 'Welcome!' ? 'Edit Profile' : 'Profil bearbeiten'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10,
  },
  editButton: {
    marginTop: 40,
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MyProfileScreen;
