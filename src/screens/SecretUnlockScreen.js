import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const SecretUnlockScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const SECRET_CODE = '1234'; // In real app, this could be synced via Firebase

  const handleUnlock = () => {
    if (code === SECRET_CODE) {
      navigation.navigate('SecretChat');
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
      />

      <TouchableOpacity style={styles.button} onPress={handleUnlock}>
        <Text style={styles.buttonText}>{t('secretChat.unlock')}</Text>
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SecretUnlockScreen;
