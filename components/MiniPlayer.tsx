// components/MiniPlayer.tsx

import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePlayer } from '../context/PlayerContext';

export default function MiniPlayer() {
  const { 
    currentSong, 
    isExpanded, 
    setIsExpanded, 
    setPlaybackState, 
    isPlaying, 
    setIsPlaying, 
    seekPosition, 
    setSeekPosition, 
    isLooping, 
    playNextAuto,
    getPlayableUrl // <-- NUEVA FUNCIÓN
  } = usePlayer();
  
  const [loadingAudio, setLoadingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cuando cambia la canción actual, carga y reproduce
  useEffect(() => {
    if (!currentSong) return;

    let isCancelled = false;

    async function playSong() {
      try {
        setLoadingAudio(true);

        // 1. Unload previous sound if it exists
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        // 2. OBTENER URL REPRODUCIBLE (local o stream)
        const playableUrl = await getPlayableUrl(currentSong);
        
        if (!playableUrl) {
          console.error("No playable URL found");
          setIsPlaying(false);
          setLoadingAudio(false);
          return;
        }

        // 3. Create new sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: playableUrl },
          { shouldPlay: true, isLooping: isLooping }
        );

        // 4. Check if we were cancelled while loading
        if (isCancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;

        // Sincronizar progreso
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.durationMillis) {
            setPlaybackState(status.positionMillis, status.durationMillis);
            // Si el audio termina, actualizar estado
            if (status.didJustFinish && !status.isLooping) {
              console.log("Song finished. Triggering playNextAuto...");
              setIsPlaying(false);
              playNextAuto(); // Auto-play siguiente canción
            }
          }
        });

        setIsPlaying(true);
      } catch (e) {
        console.error("Error playing song:", e);
        setIsPlaying(false);
      } finally {
        if (!isCancelled) setLoadingAudio(false);
      }
    }

    playSong();

    // Limpieza al cambiar/abandonar
    return () => {
      isCancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [currentSong]);

  // Efecto para pausar/reproducir cuando cambia isPlaying globalmente
  useEffect(() => {
    async function updatePlayback() {
      if (!soundRef.current) return;
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying && !status.isPlaying) {
            // Lógica de replay si terminó
            if (status.durationMillis && status.positionMillis >= status.durationMillis - 100 && !isLooping) {
              await soundRef.current.replayAsync();
            } else {
              await soundRef.current.playAsync();
            }
          } else if (!isPlaying && status.isPlaying) {
            await soundRef.current.pauseAsync();
          }
        }
      } catch (e) {
        console.error("Error updating playback:", e);
      }
    }
    updatePlayback();
  }, [isPlaying]);

  // Efecto para manejar el seek
  useEffect(() => {
    async function handleSeek() {
      if (seekPosition !== null && soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            await soundRef.current.setPositionAsync(seekPosition);
            setSeekPosition(null);
          }
        } catch (e) { console.error(e); }
      }
    }
    handleSeek();
  }, [seekPosition]);

  // Efecto para manejar cambios en isLooping
  useEffect(() => {
    async function updateLooping() {
      if (soundRef.current) {
        try {
          await soundRef.current.setIsLoopingAsync(isLooping);
        } catch (e) { console.error(e); }
      }
    }
    updateLooping();
  }, [isLooping]);

  // Play/Pause (solo cambia el estado global)
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!currentSong) return null;

  return (
    <Pressable
      style={styles.miniContainer}
      onPress={() => setIsExpanded(true)}
    >
      <Image source={{ uri: currentSong.cover }} style={styles.cover} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {currentSong.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {currentSong.artist}
        </Text>
      </View>
      <View style={styles.iconContainer}>
        {loadingAudio ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Pressable onPress={e => { e.stopPropagation(); togglePlay(); }}>
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={32}
              color="#fff"
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  miniContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 105,
    backgroundColor: '#212334ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 50,
  },
  cover: {
    width: 46,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#222',
  },
  songTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  songArtist: {
    color: '#b3b3b3',
    fontSize: 13,
  },
  iconContainer: {
    marginLeft: 12,
  },
});
