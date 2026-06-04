import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const QuestionnaireScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { profileId, isMyProfile } = route.params || {};
  const scrollRef = useRef(null);
  const currentScrollX = useRef(0);
  const maxScrollWidth = useRef(0);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    hobby: '',
    food: '',
    dream: '',
    mood: '😊',
  });

  useEffect(() => {
    loadData();
  }, [profileId, isMyProfile]);

  const loadData = async () => {
    try {
      const storageKey = isMyProfile ? 'my_profile' : `friend_${profileId}`;
      const savedData = await AsyncStorage.getItem(storageKey);
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  };

  const saveData = async () => {
    try {
      // Use a consistent ID for new friends if profileId is missing
      const id = profileId || Date.now().toString();
      const storageKey = isMyProfile ? 'my_profile' : `friend_${id}`;
      
      if (!isMyProfile) {
        const friendsListRaw = await AsyncStorage.getItem('friends_list');
        let friendsList = friendsListRaw ? JSON.parse(friendsListRaw) : [];
        
        if (!profileId) {
          // Add new friend
          const newFriend = { id, name: formData.name, mood: formData.mood };
          friendsList.push(newFriend);
        } else {
          // Update existing friend
          const index = friendsList.findIndex(f => f.id === profileId);
          if (index !== -1) {
            friendsList[index] = { ...friendsList[index], name: formData.name, mood: formData.mood };
          }
        }
        await AsyncStorage.setItem('friends_list', JSON.stringify(friendsList));
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(formData));
      Alert.alert(t('common.save'), t('common.done'));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), t('common.saveError'));
    }
  };

  const deleteProfile = () => {
    Alert.alert(
      t('secretChat.deleteChat'), // Reuse delete chat title or add specific one
      t('secretChat.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.error') === 'Fehler' ? 'Löschen' : (t('common.error') === 'Ошибка' ? 'Удалить' : 'Delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove profile data
              await AsyncStorage.removeItem(`friend_${profileId}`);
              
              // Remove from friends list
              const friendsListRaw = await AsyncStorage.getItem('friends_list');
              if (friendsListRaw) {
                let friendsList = JSON.parse(friendsListRaw);
                const newList = friendsList.filter(f => f.id !== profileId);
                await AsyncStorage.setItem('friends_list', JSON.stringify(newList));
              }
              
              navigation.goBack();
            } catch (e) {
              console.error('Delete error', e);
            }
          }
        }
      ]
    );
  };

  const scrollRight = () => {
    if (currentScrollX.current + 10 >= maxScrollWidth.current) {
      currentScrollX.current = 0;
    } else {
      currentScrollX.current += 200;
      if (currentScrollX.current > maxScrollWidth.current) {
        currentScrollX.current = maxScrollWidth.current;
      }
    }
    scrollRef.current?.scrollTo({ x: currentScrollX.current, animated: true });
  };

  const renderField = (field, labelKey, placeholderKey) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: theme.primary }]}>{t(`freundebuch.fields.${labelKey}`)}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.accent }]}
        value={formData[field]}
        onChangeText={(text) => setFormData({ ...formData, [field]: text })}
        placeholder={t(`freundebuch.placeholders.${placeholderKey}`)}
        placeholderTextColor={theme.text + '60'}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.secondary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.accent }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="close" size={30} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('freundebuch.questionnaire')}</Text>
        <View style={styles.headerActions}>
          {!isMyProfile && profileId && (
            <TouchableOpacity onPress={deleteProfile} style={styles.headerIcon}>
              <Ionicons name="trash-outline" size={26} color="#ff6b6b" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={saveData} style={styles.headerIcon}>
            <Ionicons name="checkmark" size={30} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderField('name', 'name', 'name')}
        {renderField('age', 'age', 'age')}
        {renderField('hobby', 'hobby', 'hobby')}
        {renderField('food', 'food', 'food')}
        {renderField('dream', 'dream', 'dream')}
        
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.primary }]}>{t('freundebuch.fields.mood')}</Text>
          <View style={styles.moodSection}>
            <ScrollView 
              ref={scrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              onScroll={(e) => {
                currentScrollX.current = e.nativeEvent.contentOffset.x;
                maxScrollWidth.current = e.nativeEvent.contentSize.width - e.nativeEvent.layoutMeasurement.width;
              }}
              onContentSizeChange={(w, h) => {
                maxScrollWidth.current = w - 300;
              }}
              scrollEventThrottle={16}
              style={[styles.moodScroll, { backgroundColor: theme.card, borderColor: theme.accent }]}
              contentContainerStyle={styles.moodScrollContent}
            >
              {[
                '😊', '😎', '🎨', '🐾', '🍦', '🎮', '🦄', '🌈', '✨', '🌸', 
                '🍬', '🦋', '🐼', '🍕', '🍓', '🎸', '⛸️', '🛹', '🔭', '💌', 
                '🧸', '👑', '🎀', '🧁', '🐱', '🐶', '🐰', '🦊', '🌻', '🐚'
              ].map((m) => (
                <TouchableOpacity 
                  key={m} 
                  style={[
                    styles.moodItem, 
                    formData.mood === m && [styles.moodSelected, { backgroundColor: theme.accent, borderColor: theme.primary }]
                  ]}
                  onPress={() => setFormData({ ...formData, mood: m })}
                >
                  <Text style={styles.moodText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.scrollAction, { backgroundColor: theme.primary }]}
              onPress={scrollRight}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward" size={20} color={theme.buttonText} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
          onPress={saveData}
        >
          <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  moodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  moodScroll: {
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    height: 70,
  },
  moodScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  moodItem: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodSelected: {
    borderWidth: 1,
  },
  moodText: {
    fontSize: 32,
  },
  scrollAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QuestionnaireScreen;
