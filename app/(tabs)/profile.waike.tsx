// /app/(tabs)/ProfileWaike.tsx
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileWaike() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Lógica de cierre de sesión con confirmación
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/auth/login.waike');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
      <Text style={styles.logout} onPress={handleLogout}>
        Cerrar sesión
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111a22',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1f6feb',
    marginBottom: 14,
    textAlign: 'center',
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 22,
  },
  logout: {
    color: '#ff4e6d',
    fontWeight: 'bold',
    fontSize: 17,
    padding: 13,
    borderRadius: 11,
    marginTop: 12,
    backgroundColor: '#1c2733',
    textAlign: 'center',
  },
});
