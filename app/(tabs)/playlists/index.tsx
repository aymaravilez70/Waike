// /app/(tabs)/playlist.waike.tsx
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import CreatePlaylistModal from '../../../components/CreatePlaylistModal';
import FavoriteList from '../../../components/FavoriteList.js';
import PlaylistItem from '../../../components/PlaylistItem.js';
import { useAuth } from '../../../context/AuthContext';
import { usePlaylistRefresh } from '../../../context/PlaylistContext';
import { createPlaylist, getUserPlaylists } from '../../../services/playlistService';
import { styles } from '../../../styles/playlistStyles';

export default function PlaylistScreen() {
  const { user, loading } = useAuth();
  const { refreshTrigger } = usePlaylistRefresh(); // Escucha cambios en tiempo real
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    console.log("PlaylistScreen mounted. User:", user?.id, "Loading:", loading);
  }, [user, loading]);

  const loadPlaylists = async () => {
    if (loading) return;
    if (!user) {
      console.log("No user logged in (and not loading), skipping loadPlaylists");
      return;
    }
    console.log("Loading playlists for user:", user.id);
    try {
      const data = await getUserPlaylists(user.id);
      setPlaylists(data);
    } catch (e) {
      console.error("Error loading playlists:", e);
    }
  };

  // Recargar cuando cambia el refreshTrigger (cuando se agrega/quita canción)
  useEffect(() => {
    loadPlaylists();
  }, [user, loading, refreshTrigger]);

  // BACKUP: Recargar cuando vuelves a la pestaña de playlists
  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [user, loading])
  );

  const handleCreatePlaylist = async (name: string) => {
    if (loading) {
      console.warn("Cannot create playlist: Auth is loading");
      return;
    }
    if (!user) {
      console.error("Cannot create playlist: No user object in context", { user, loading });
      alert("Error: No se detecta sesión de usuario. Por favor recarga la app o inicia sesión nuevamente.");
      return;
    }
    try {
      await createPlaylist(name, user.id);
      console.log("Playlist created successfully, reloading list...");
      await loadPlaylists(); // Refresh list
    } catch (e) {
      console.error("Error creating playlist:", e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Carpeta Favoritos */}
      <FavoriteList />

      {/* Título "Playlists" */}
      <Text style={styles.playlistTitle}>Playlists</Text>

      {/* Botón para crear playlist */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Nueva playlist</Text>
      </TouchableOpacity>

      {/* Lista vertical de playlists */}
      <FlatList
        data={playlists}
        renderItem={({ item }) => <PlaylistItem playlist={item} />}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <CreatePlaylistModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreatePlaylist}
      />
    </View>
  );
}
