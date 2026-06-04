import React, { useState, useEffect } from 'react';
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
  }, []);

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
      const storageKey = isMyProfile ? 'my_profile' : `friend_${profileId || Date.now()}`;
      
      if (!isMyProfile && !profileId) {
        const friendsListRaw = await AsyncStorage.getItem('friends_list');
        let friendsList = friendsListRaw ? JSON.parse(friendsListRaw) : [];
        const newFriend = { id: Date.now().toString(), name: formData.name, mood: formData.mood };
        friendsList.push(newFriend);
        await AsyncStorage.setItem('friends_list', JSON.stringify(friendsList));
      } else if (!isMyProfile && profileId) {
        const friendsListRaw = await AsyncStorage.getItem('friends_list');
        if (friendsListRaw) {
          let friendsList = JSON.parse(friendsListRaw);
          const index = friendsList.findIndex(f => f.id === profileId);
          if (index !== -1) {
            friendsList[index] = { ...friendsList[index], name: formData.name, mood: formData.mood };
            await AsyncStorage.setItem('friends_list', JSON.stringify(friendsList));
          }
        }
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(formData));
      Alert.alert(t('common.save'), t('common.done'));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), t('common.saveError'));
    }
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={30} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('freundebuch.questionnaire')}</Text>
        <TouchableOpacity onPress={saveData}>
          <Ionicons name="checkmark" size={30} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderField('name', 'name', 'name')}
        {renderField('age', 'age', 'age')}
        {renderField('hobby', 'hobby', 'hobby')}
        {renderField('food', 'food', 'food')}
        {renderField('dream', 'dream', 'dream')}
        
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.primary }]}>{t('freundebuch.fields.mood')}</Text>
          <View style={styles.moodScrollWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
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
            <View style={[styles.scrollIndicator, { backgroundColor: theme.card + 'CC' }]}>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </View>
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  moodScrollWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodScroll: {
    marginTop: 10,
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
  },
  scrollIndicator: {
    position: 'absolute',
    right: 5,
    top: 20,
    width: 24,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    pointerEvents: 'none',
  },
  moodScrollContent: {
    padding: 10,
    flexDirection: 'row',
  },
  moodItem: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: 'transparent',
    marginRight: 5,
  },
  moodSelected: {
    borderWidth: 1,
  },
  moodText: {
    fontSize: 28,
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
