import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../context/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, query, collection, where, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

const SecretUnlockScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleUnlock = async () => {
    if (code?.length === 4) {
      setIsChecking(true);
      try {
        if (!auth) {
          Alert.alert(t('common.error') || 'Error', 'Firebase not initialized');
          setIsChecking(false);
          return;
        }

        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        const myUid = auth?.currentUser?.uid;
        if (!myUid) throw new Error("No user UID");

        if (!db) {
          Alert.alert(t('common.error') || 'Error', 'Database not initialized');
          setIsChecking(false);
          return;
        }

        const roomsQuery = query(
          collection(db, 'secret_rooms'),
          where('participants', 'array-contains', myUid)
        );
        const myRoomsSnap = await getDocs(roomsQuery);
        
        let existingRoomId = null;
        myRoomsSnap?.forEach((doc) => {
          if (doc.id !== code) {
            existingRoomId = doc.id;
          }
        });

        if (existingRoomId) {
          Alert.alert(t('common.error') || 'Error', t('secretChat.alreadyInRoom', { code: existingRoomId }));
          setCode('');
          setIsChecking(false);
          return;
        }

        const roomRef = doc(db, 'secret_rooms', code);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          await setDoc(roomRef, { participants: [myUid], creator: myUid });
          const currentCode = code;
          setCode('');
          navigation?.replace('SecretChat', { roomCode: currentCode });
        } else {
          const data = roomSnap.data();
          const participants = data?.participants || [];

          if (participants.includes(myUid)) {
            const currentCode = code;
            setCode('');
            navigation?.replace('SecretChat', { roomCode: currentCode });
          } else if (participants.length < 2) {
            await updateDoc(roomRef, {
              participants: arrayUnion(myUid)
            });
            const currentCode = code;
            setCode('');
            navigation?.replace('SecretChat', { roomCode: currentCode });
          } else {
            Alert.alert(t('common.error') || 'Error', t('secretChat.roomFull'));
            setCode('');
          }
        }
      } catch (error) {
        console.error("Room lock error:", error);
        Alert.alert(t('common.error') || 'Error', 'Verbindung fehlgeschlagen');
      } finally {
        setIsChecking(false);
      }
    } else {
      Alert.alert(t('secretChat.wrongCode'), t('secretChat.tryAgain'));
      setCode('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme?.secondary }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation?.goBack()}
        disabled={isChecking}
      >
        <Ionicons name="arrow-back" size={24} color={theme?.text} />
      </TouchableOpacity>

      <Ionicons name="lock-closed" size={80} color={theme?.primary} style={styles.icon} />
      <Text style={[styles.title, { color: theme?.text }]}>{t('secretChat.enterCode')}</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: theme?.card, borderColor: theme?.accent, color: theme?.text }]}
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        secureTextEntry
        placeholder="****"
        placeholderTextColor={theme?.text + '60'}
        maxLength={4}
        editable={!isChecking}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme?.primary, shadowColor: theme?.primary }, isChecking && styles.buttonDisabled]} 
        onPress={handleUnlock}
        disabled={isChecking}
      >
        {isChecking ? (
          <ActivityIndicator color={theme?.buttonText} />
        ) : (
          <Text style={[styles.buttonText, { color: theme?.buttonText }]}>{t('secretChat.unlock')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '60%',
    height: 60,
    borderWidth: 2,
    borderRadius: 15,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 10,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SecretUnlockScreen;
