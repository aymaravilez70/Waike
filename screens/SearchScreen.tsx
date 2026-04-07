// screens/SearchScreen.tsx

import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SearchBar from '../components/SearchBar';
import { usePlayer } from '../context/PlayerContext';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useSongSearch } from '../hooks/useSongSearch';

export default function SearchScreen() {
  const { text, setText, suggestions, loading, error } = useSongSearch();
  const { play, currentSong, fetchStreamUrl } = usePlayer();
  const [fetchingAudio, setFetchingAudio] = useState(false);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();



  // Componente para un ítem de historial o sugerencia (reutilizado)
  function SongItem({ song }: { song: any }) {
    return (
      <Pressable
        onPress={async () => {
          if (currentSong && currentSong.id === song.id) {
            play(currentSong);
            return;
          }

          setFetchingAudio(true);
          const url = await fetchStreamUrl(song.title, song.artist);
          setFetchingAudio(false);

          if (!url) {
            Alert.alert('Error', 'No se pudo obtener la música.');
            return;
          }

          play({
            id: song.id,
            title: song.title,
            artist: song.artist,
            cover: song.cover,
            streamUrl: url,
          });
          addToHistory(song);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#181B2C',
          borderRadius: 11,
          padding: 8,
          marginBottom: 8,
        }}
        disabled={fetchingAudio}
      >
        <Image source={{ uri: song.cover }} style={{ width: 42, height: 42, borderRadius: 7, marginRight: 11 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e6e9ef', fontWeight: 'bold' }}>{song.title}</Text>
          <Text style={{ color: '#8ba1b7', fontSize: 13 }}>{song.artist}</Text>
        </View>
        {"id" in song && (
          <Pressable onPress={() => removeFromHistory(song.id)}>
            <Ionicons name="close" size={21} color="#b3b3b3" />
          </Pressable>
        )}
      </Pressable>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.background}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <SearchBar
          value={text}
          onChangeText={setText}
          onSubmit={() => { }}
        />

        {loading && (
          <View style={{ marginTop: 10, marginBottom: 6 }}>
            <ActivityIndicator color="#1f6feb" size="small" />
          </View>
        )}
        {!!error && (
          <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
        )}
        {fetchingAudio && (
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <ActivityIndicator color="#1f6feb" size="large" />
            <Text style={{ color: '#1f6feb', marginTop: 4 }}>Buscando audio...</Text>
          </View>
        )}

        {/* Historial de búsqueda visible solo si input vacío */}
        {!text && history.length > 0 && (
          <View style={{ width: '100%', marginTop: 8, marginBottom: 8 }}>
            <Text style={{ color: '#b3b3b3', marginBottom: 9, fontSize: 16, fontWeight: 'bold' }}>Buscado recientemente</Text>
            {history.map(song => (
              <SongItem key={song.id} song={song} />
            ))}
            <Pressable onPress={clearHistory} style={{ marginTop: 5 }}>
              <Text style={{ color: '#ff7a7a', textAlign: 'right', fontSize: 13 }}>Limpiar historial</Text>
            </Pressable>
          </View>
        )}

        {/* Sugerencias del hook */}
        {text && suggestions.length > 0 && (
          <View style={{ width: '100%', marginTop: 8, marginBottom: 8 }}>
            {suggestions.slice(0, 8).map((song: any) => (
              <SongItem key={song.id} song={song} />
            ))}
          </View>
        )}


      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#101016',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#17192c',
    borderRadius: 16,
    paddingVertical: 38,
    paddingHorizontal: 26,
    alignItems: 'center',
    marginTop: 36,
    width: '98%',
    shadowColor: '#1f6feb',
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 1,
  },
  iconCircle: {
    backgroundColor: '#1f6feb22',
    borderRadius: 48,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    tintColor: '#1f6feb',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f6feb',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#e8e9ea',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.83,
    marginBottom: 0,
  },
});
