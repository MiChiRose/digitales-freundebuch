import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert
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
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_RUNTIME_CONFIG, loadRuntimeConfig } from '../services/appConfig';
import {
  checkMessageSafety,
  getActiveSafetyLock,
  getRemainingSeconds,
  registerBlockedMessage,
} from '../utils/chatSafety';

const ChatScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { roomCode } = route.params || { roomCode: 'default' };
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState('Anonymous');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [runtimeConfig, setRuntimeConfig] = useState(DEFAULT_RUNTIME_CONFIG);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);
  const flatListRef = React.useRef();

  const moderationConfig = runtimeConfig?.moderation || DEFAULT_RUNTIME_CONFIG.moderation;
  const chatConfig = moderationConfig?.chat || DEFAULT_RUNTIME_CONFIG.moderation.chat;
  const chatEnabled = runtimeConfig?.featureFlags?.secretChatEnabled !== false && chatConfig.enabled !== false;
  const isSafetyLocked = lockedUntil > Date.now();

  useEffect(() => {
    let isMounted = true;

    loadRuntimeConfig().then((config) => {
      if (isMounted) {
        setRuntimeConfig(config);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const userId = currentUserId || auth?.currentUser?.uid;

    if (!userId) return undefined;

    getActiveSafetyLock(roomCode, userId).then((activeLock) => {
      if (isMounted && activeLock) {
        setLockedUntil(activeLock);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, roomCode]);

  useEffect(() => {
    if (!isSafetyLocked) {
      setLockRemainingSeconds(0);
      return undefined;
    }

    setLockRemainingSeconds(getRemainingSeconds(lockedUntil));
    const interval = setInterval(() => {
      const remaining = getRemainingSeconds(lockedUntil);
      setLockRemainingSeconds(remaining);
      if (remaining <= 0) {
        setLockedUntil(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSafetyLocked, lockedUntil]);

  useEffect(() => {
    let isMounted = true;
    let scrollTimeout = null;
    let unsubscribeMessages = null;

    if (!auth) {
      setLoading(false);
      return;
    }

    const clearScrollTimeout = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
    };

    const checkIfCreator = async (uid) => {
      try {
        if (!db) return;
        const roomRef = doc(db, 'secret_rooms', roomCode);
        const roomSnap = await getDoc(roomRef);
        if (isMounted) {
          setIsCreator(roomSnap.exists() && roomSnap.data()?.creator === uid);
        }
      } catch (e) {
        console.error("Creator check error", e);
      }
    };

    const startListeningMessages = () => {
      if (unsubscribeMessages) {
        return;
      }

      if (!db) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "secret_messages"), 
        where("roomCode", "==", roomCode),
        orderBy("createdAt", "asc"),
        limit(100)
      );

      unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
        if (!isMounted) return;

        const msgs = [];
        querySnapshot?.forEach((doc) => {
          const data = doc.data();
          let timeStr = '...';
          if (data?.createdAt && typeof data?.createdAt?.toDate === 'function') {
            timeStr = data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          }
          msgs.push({ id: doc.id, ...data, time: timeStr });
        });
        setMessages(msgs);
        setLoading(false);
        clearScrollTimeout();
        scrollTimeout = setTimeout(() => {
          if (isMounted) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }, 200);
      }, (error) => {
        if (!isMounted) return;
        console.error("Snapshot error:", error);
        setLoading(false);
      });
    };

    const loadProfileName = async () => {
      try {
        const myData = await AsyncStorage.getItem('my_profile');
        if (!isMounted) return;
        if (myData) {
          const parsed = JSON.parse(myData);
          if (parsed?.name) setUserName(parsed.name);
        }
      } catch (e) {
        console.error("Load profile name error", e);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUserId(user.uid);
        checkIfCreator(user.uid);
        startListeningMessages();
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    });

    loadProfileName();

    return () => {
      isMounted = false;
      unsubscribeAuth?.();
      clearScrollTimeout();
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }
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
              if (!db) return;
              const q = query(collection(db, 'secret_messages'), where('roomCode', '==', roomCode));
              const snap = await getDocs(q);
              const deletes = [];
              snap?.forEach((msgDoc) => {
                deletes.push(deleteDoc(doc(db, 'secret_messages', msgDoc.id)));
              });
              await Promise.all(deletes);
              await deleteDoc(doc(db, 'secret_rooms', roomCode));
              navigation?.goBack();
            } catch (e) {
              console.error("Delete room error", e);
            }
          }
        }
      ]
    );
  };

  const getSafetyMessage = (reason, maxLength) => {
    if (reason === 'too_long') {
      return t('secretChat.safety.tooLong', { count: maxLength });
    }
    if (reason === 'personal_info') return t('secretChat.safety.personalInfo');
    if (reason === 'unsafe_topic') return t('secretChat.safety.unsafeTopic');
    if (reason === 'chat_disabled') return t('secretChat.safety.chatDisabled');
    return t('secretChat.safety.kindWords');
  };

  const sendMessage = async () => {
    const textToSend = message.trim();

    if (textToSend) {
      if (!chatEnabled) {
        Alert.alert(t('secretChat.safety.title'), t('secretChat.safety.chatDisabled'));
        return;
      }

      if (isSafetyLocked) {
        Alert.alert(
          t('secretChat.safety.breakTitle'),
          t('secretChat.safety.breakMessage', { seconds: lockRemainingSeconds })
        );
        return;
      }

      const minWaitMs = (chatConfig.minSecondsBetweenMessages || 0) * 1000;
      const waitMs = Math.max(0, minWaitMs - (Date.now() - lastSentAt));
      if (waitMs > 0) {
        Alert.alert(
          t('secretChat.safety.title'),
          t('secretChat.safety.tooFast', { seconds: Math.ceil(waitMs / 1000) })
        );
        return;
      }

      const decision = checkMessageSafety(textToSend, moderationConfig);
      if (!decision.allowed) {
        setMessage('');
        const userId = currentUserId || auth?.currentUser?.uid || 'unknown';
        const nextLock = await registerBlockedMessage(roomCode, userId, moderationConfig);
        if (nextLock > Date.now()) {
          setLockedUntil(nextLock);
        }

        Alert.alert(
          t('secretChat.safety.title'),
          getSafetyMessage(decision.reason, decision.maxLength)
        );
        return;
      }

      setMessage('');
      try {
        if (!db) return;
        addDoc(collection(db, "secret_messages"), {
          text: decision.text,
          sender: userName,
          senderId: auth?.currentUser?.uid || 'unknown',
          roomCode: roomCode,
          createdAt: serverTimestamp(),
          moderation: {
            status: 'visible',
            reasonCodes: [],
          },
        }).catch((e) => console.error("Send error", e));
        setLastSentAt(Date.now());
      } catch (e) {
        console.error("Send error", e);
      }
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item?.senderId === currentUserId;
    return (
      <View style={[
        styles.messageBubble, 
        isMe ? [styles.myMessage, { backgroundColor: theme?.primary }] : [styles.theirMessage, { backgroundColor: theme?.card, borderColor: theme?.accent }]
      ]}>
        <Text style={[styles.senderName, { color: isMe ? (theme?.buttonText + 'CC') : (theme?.text + '80') }]}>
          {isMe ? t('secretChat.me') : (item?.sender || 'Anonymous')}
        </Text>
        <Text style={isMe ? [styles.myMessageText, { color: theme?.buttonText }] : [styles.messageText, { color: theme?.text }]}>
          {item?.text}
        </Text>
        <Text style={[styles.messageTime, { color: isMe ? (theme?.buttonText + '99') : (theme?.text + '60') }]}>
          {item?.time}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.secondary }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.accent }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>{t('secretChat.title')} (#{roomCode}) 🕵️‍♀️</Text>
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
          <Text style={{ color: theme.text }}>{t('secretChat.loading')}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={{ color: theme.text }}>{t('secretChat.empty')}</Text>
            </View>
          }
        />
      )}

      {!chatEnabled ? (
        <View style={[styles.safetyBanner, { backgroundColor: theme?.accent + '40', borderColor: theme?.accent }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={theme?.text} />
          <Text style={[styles.safetyBannerText, { color: theme?.text }]}>{t('secretChat.safety.chatDisabled')}</Text>
        </View>
      ) : null}

      <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.accent }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.secondary,
              color: theme.text,
              opacity: chatEnabled && !isSafetyLocked ? 1 : 0.55,
            }
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder={t('secretChat.placeholder')}
          placeholderTextColor={theme.text + '60'}
          maxLength={chatConfig.maxMessageLength || 300}
          editable={chatEnabled && !isSafetyLocked}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: theme.primary,
              opacity: chatEnabled && !isSafetyLocked ? 1 : 0.5,
            }
          ]}
          onPress={sendMessage}
          disabled={!chatEnabled || isSafetyLocked}
        >
          <Ionicons name="send" size={24} color={theme.buttonText} />
        </TouchableOpacity>
      </View>

      {isSafetyLocked ? (
        <View style={[styles.safetyOverlay, { backgroundColor: theme?.secondary }]}>
          <View style={[styles.safetyCard, { backgroundColor: theme?.card, borderColor: theme?.accent }]}>
            <Text style={styles.safetyEmoji}>🌷</Text>
            <Text style={[styles.safetyTitle, { color: theme?.text }]}>{t('secretChat.safety.breakTitle')}</Text>
            <Text style={[styles.safetyText, { color: theme?.text + 'CC' }]}>
              {t('secretChat.safety.breakMessage', { seconds: lockRemainingSeconds })}
            </Text>
            <Text style={[styles.safetyCountdown, { color: theme?.primary }]}>
              {t('secretChat.safety.countdown', { seconds: lockRemainingSeconds })}
            </Text>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerButton: {
    padding: 5,
  },
  headerButtonPlaceholder: {
    width: 34,
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
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
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
    alignItems: 'center',
    borderTopWidth: 1,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 15,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  safetyBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    flex: 1,
    height: 45,
    borderRadius: 22,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  safetyCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  safetyEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  safetyText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  safetyCountdown: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});

export default ChatScreen;
