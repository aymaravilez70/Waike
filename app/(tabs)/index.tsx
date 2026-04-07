import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeWaike() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido a Waike!</Text>
      <Text style={styles.subtitle}>
        Aquí verás tus playlists, canciones recientes y sugerencias personalizadas.
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f6feb',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 17,
    textAlign: 'center',
  },
});
