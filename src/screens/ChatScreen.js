import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey! 👋', sender: 'Emma', time: '10:00' },
    { id: '2', text: 'Hallo!', sender: 'Me', time: '10:01' },
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: Date.now().toString(), text: message, sender: 'Me', time: '10:05' }]);
      setMessage('');
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender === 'Me';
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.senderName}>{isMe ? t('secretChat.me') : item.sender}</Text>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('secretChat.title')} 🕵️‍♀️</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={t('secretChat.placeholder')}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  chatList: {
    padding: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff6b6b',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 45,
    backgroundColor: '#f0f2f5',
    borderRadius: 22,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#ff6b6b',
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
