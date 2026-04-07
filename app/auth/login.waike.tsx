import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import styles from '../../components/styles/LoginWaike.styles';

export default function LoginWaike() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const handleLogin = async () => {
    setPending(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error de login', error.message);
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
        <Text style={styles.title}>Bienvenido a Waike</Text>
        <Text style={styles.subtitle}>Ingresa para continuar</Text>
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
        <Pressable style={styles.button} onPress={handleLogin} disabled={pending || loading}>
          {pending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/auth/register.waike')}>
          <Text style={styles.secondaryButtonText}>No tienes cuenta? Regístrate</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
