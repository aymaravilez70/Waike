// /styles/playlistStyles.js
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10151C', // Negro azul oscuro
    padding: 18,
  },
  playlistTitle: {
    marginTop: 4,
    marginBottom: 6,
    color: '#8FB1ED', // Azul claro
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  addButton: {
    backgroundColor: '#1B2941', // Azul oscuro
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  addButtonText: {
    color: '#579AFF', // Azul vibrante
    fontWeight: 'bold',
    fontSize: 15,
  },
  list: { marginTop: 6 },
});
