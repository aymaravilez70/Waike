import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import styles from '../../components/styles/RegisterWaike.styles';
import { useAuth } from '../../context/AuthContext';

export default function RegisterWaike() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre de usuario');
      return;
    }
    setPending(true);
    try {
      await register(email, password, username);
      Alert.alert(
        'Registro exitoso',
        'Revisa tu correo para verificar tu cuenta antes de iniciar sesión.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login.waike') }],
      );
    } catch (error: any) {
      Alert.alert('Error al registrar', error.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <LinearGradient
      colors={['#111d2b', '#050505', '#132554']}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Crear cuenta en Waike</Text>
        <Text style={styles.subtitle}>Regístrate para guardar playlists y música</Text>

        <TextInput
          placeholder="Nombre de usuario"
          placeholderTextColor="#889"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#889"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#889"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={handleRegister} disabled={pending}>
          {pending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/auth/login.waike')}>
          <Text style={styles.secondaryButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
