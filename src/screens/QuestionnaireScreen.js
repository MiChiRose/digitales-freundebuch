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

const QuestionnaireScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
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
      
      // If it's a new friend, we need to add them to the friends list too
      if (!isMyProfile && !profileId) {
        const friendsListRaw = await AsyncStorage.getItem('friends_list');
        let friendsList = friendsListRaw ? JSON.parse(friendsListRaw) : [];
        const newFriend = { id: Date.now().toString(), name: formData.name, mood: formData.mood };
        friendsList.push(newFriend);
        await AsyncStorage.setItem('friends_list', JSON.stringify(friendsList));
      } else if (!isMyProfile && profileId) {
        // Update existing friend in the list
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
      Alert.alert(t('common.save'), '✅ Done!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save data');
    }
  };

  const renderField = (field, labelKey, placeholderKey) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{t(`freundebuch.fields.${labelKey}`)}</Text>
      <TextInput
        style={styles.input}
        value={formData[field]}
        onChangeText={(text) => setFormData({ ...formData, [field]: text })}
        placeholder={t(`freundebuch.placeholders.${placeholderKey}`)}
        placeholderTextColor="#aaa"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('freundebuch.questionnaire')}</Text>
        <TouchableOpacity onPress={saveData}>
          <Ionicons name="checkmark" size={30} color="#4ecdc4" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderField('name', 'name', 'name')}
        {renderField('age', 'age', 'age')}
        {renderField('hobby', 'hobby', 'hobby')}
        {renderField('food', 'food', 'food')}
        {renderField('dream', 'dream', 'dream')}
        
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t('freundebuch.fields.mood')}</Text>
          <View style={styles.moodContainer}>
            {['😊', '😎', '🎨', '🐾', '🍦', '🎮'].map((m) => (
              <TouchableOpacity 
                key={m} 
                style={[styles.moodItem, formData.mood === m && styles.moodSelected]}
                onPress={() => setFormData({ ...formData, mood: m })}
              >
                <Text style={styles.moodText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveData}>
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#ff6b6b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  moodItem: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: '#f0f2f5',
  },
  moodSelected: {
    backgroundColor: '#ffe0e0',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  moodText: {
    fontSize: 24,
  },
  saveButton: {
    backgroundColor: '#ff6b6b',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QuestionnaireScreen;
