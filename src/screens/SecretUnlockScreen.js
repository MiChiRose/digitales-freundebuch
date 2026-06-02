import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../context/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, query, collection, where, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const SecretUnlockScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleUnlock = async () => {
    if (code.length === 4) {
      setIsChecking(true);
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        const myUid = auth.currentUser.uid;

        // Anti-spam: Check if I already belong to a DIFFERENT room
        const roomsQuery = query(
          collection(db, 'secret_rooms'),
          where('participants', 'array-contains', myUid)
        );
        const myRoomsSnap = await getDocs(roomsQuery);
        
        let existingRoomId = null;
        myRoomsSnap.forEach((doc) => {
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
          // Room does not exist, claim it. Mark myself as creator.
          await setDoc(roomRef, { participants: [myUid], creator: myUid });
          const currentCode = code;
          setCode('');
          navigation.replace('SecretChat', { roomCode: currentCode });
        } else {
          const data = roomSnap.data();
          const participants = data.participants || [];

          if (participants.includes(myUid)) {
            // Already a member
            const currentCode = code;
            setCode('');
            navigation.replace('SecretChat', { roomCode: currentCode });
          } else if (participants.length < 2) {
            // Room has space for one more friend
            await updateDoc(roomRef, {
              participants: arrayUnion(myUid)
            });
            const currentCode = code;
            setCode('');
            navigation.replace('SecretChat', { roomCode: currentCode });
          } else {
            // Room is full (2 people max)
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
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        disabled={isChecking}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Ionicons name="lock-closed" size={80} color="#ff6b6b" style={styles.icon} />
      <Text style={styles.title}>{t('secretChat.enterCode')}</Text>
      
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        secureTextEntry
        placeholder="****"
        maxLength={4}
        editable={!isChecking}
      />

      <TouchableOpacity 
        style={[styles.button, isChecking && styles.buttonDisabled]} 
        onPress={handleUnlock}
        disabled={isChecking}
      >
        {isChecking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('secretChat.unlock')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#333',
  },
  input: {
    width: '60%',
    height: 60,
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: 15,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 10,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ffb3b3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SecretUnlockScreen;
