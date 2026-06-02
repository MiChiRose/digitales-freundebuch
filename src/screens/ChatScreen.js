import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../context/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  limit,
  where,
  deleteDoc,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { roomCode } = route.params || { roomCode: 'default' };
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState('Anonymous');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const flatListRef = React.useRef();

  useEffect(() => {
    let unsubscribeMessages = () => {};
    
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        checkIfCreator(user.uid);
        startListeningMessages();
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    });

    const checkIfCreator = async (uid) => {
      try {
        const roomRef = doc(db, 'secret_rooms', roomCode);
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists() && roomSnap.data().creator === uid) {
          setIsCreator(true);
        }
      } catch (e) {
        console.error("Creator check error", e);
      }
    };

    const startListeningMessages = () => {
      // Query messages ONLY for this roomCode
      const q = query(
        collection(db, "secret_messages"), 
        where("roomCode", "==", roomCode),
        orderBy("createdAt", "asc"), // Normal order: old top, new bottom
        limit(100)
      );

      unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
        const msgs = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let timeStr = '...';
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            timeStr = data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          }
          msgs.push({ id: doc.id, ...data, time: timeStr });
        });
        setMessages(msgs);
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
      }, (error) => {
        console.error("Snapshot error:", error);
        setLoading(false);
      });
    };

    const loadProfileName = async () => {
      const myData = await AsyncStorage.getItem('my_profile');
      if (myData) {
        const parsed = JSON.parse(myData);
        if (parsed.name) setUserName(parsed.name);
      }
    };

    loadProfileName();

    return () => {
      unsubscribeAuth();
      unsubscribeMessages();
    };
  }, [roomCode]);

  const handleDeleteRoom = () => {
    Alert.alert(
      t('secretChat.deleteChat'),
      t('secretChat.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.save') === 'Save' ? 'Delete' : (t('common.save') === 'Сохранить' ? 'Удалить' : 'Löschen'), 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete room document
              await deleteDoc(doc(db, 'secret_rooms', roomCode));
              
              // Optional: Delete messages for this room to clean up DB
              const q = query(collection(db, 'secret_messages'), where('roomCode', '==', roomCode));
              const snap = await getDocs(q);
              snap.forEach(async (msgDoc) => {
                await deleteDoc(doc(db, 'secret_messages', msgDoc.id));
              });

              navigation.goBack();
            } catch (e) {
              console.error("Delete room error", e);
            }
          }
        }
      ]
    );
  };

  const sendMessage = async () => {
    if (message.trim()) {
      const textToSend = message;
      setMessage('');
      try {
        await addDoc(collection(db, "secret_messages"), {
          text: textToSend,
          sender: userName,
          senderId: auth.currentUser?.uid || 'unknown',
          roomCode: roomCode, // Attach room code to message
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Send error", e);
      }
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('secretChat.title')} (#{roomCode}) 🕵️‍♀️</Text>
        {isCreator ? (
          <TouchableOpacity onPress={handleDeleteRoom} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButtonPlaceholder} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>{t('secretChat.loading')}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text>{t('secretChat.empty')}</Text>
            </View>
          }
        />
      )}

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
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    padding: 5,
  },
  headerButtonPlaceholder: {
    width: 34, // Approximate width of the icon button to keep title centered
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
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
