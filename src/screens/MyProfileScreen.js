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
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{profile?.mood || '👤'}</Text>
        </View>
        <Text style={styles.name}>{profile?.name || t('freundebuch.yourName')}</Text>
        
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
        <Text style={styles.editButtonText}>{t('common.edit')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
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
    color: '#4A4063',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#A78BFA',
  },
  avatarText: {
    fontSize: 55,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4A4063',
    marginBottom: 25,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'flex-start',
    backgroundColor: '#FDFBF7', // Very warm ivory background for info items
    padding: 15,
    borderRadius: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#5D576B',
    marginBottom: 12,
    fontWeight: '500',
  },
  editButton: {
    marginTop: 40,
    backgroundColor: '#A78BFA',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MyProfileScreen;
