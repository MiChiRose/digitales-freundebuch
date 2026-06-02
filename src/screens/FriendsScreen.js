import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const FriendsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [friends, setFriends] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [])
  );

  const loadFriends = async () => {
    try {
      const savedFriends = await AsyncStorage.getItem('friends_list');
      if (savedFriends) {
        setFriends(JSON.parse(savedFriends));
      }
    } catch (e) {
      console.error('Failed to load friends list', e);
    }
  };

  const handleAddFriend = async () => {
    try {
      const myData = await AsyncStorage.getItem('my_profile');
      if (myData) {
        const parsed = JSON.parse(myData);
        if (parsed.name && parsed.age && parsed.hobby && parsed.food && parsed.dream) {
          navigation.navigate('Questionnaire', { isMyProfile: false });
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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendCard}
      onPress={() => navigation.navigate('Questionnaire', { profileId: item.id, isMyProfile: false })}
    >
      <Text style={styles.friendEmoji}>{item.mood}</Text>
      <Text style={styles.friendName}>{item.name || t('common.noName')}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{t('freundebuch.friends')}</Text>
      <FlatList
        data={friends}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('common.emptyFriends')}</Text>
            <Text style={styles.emptySubtext}>{t('common.addFriendHint')}</Text>
          </View>
        }
      />
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddFriend}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 20,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendEmoji: {
    fontSize: 30,
    marginRight: 15,
  },
  friendName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#ff6b6b',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
  },
});

export default FriendsScreen;
