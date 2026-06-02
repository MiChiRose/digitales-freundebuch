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
    backgroundColor: '#F8F6FF',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 20,
    color: '#4A4063',
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
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
    color: '#4A4063',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#8EE4AF', // Mint Green for adding
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8EE4AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#7C7392',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A09CAB',
    marginTop: 10,
  },
});

export default FriendsScreen;
