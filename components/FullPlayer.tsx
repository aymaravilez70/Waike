import Slider from '@react-native-community/slider';
import React, { useCallback, useState } from 'react';
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePlayer } from '../context/PlayerContext';
import { useRelatedSongs } from '../hooks/useRelatedSongs';
import AddToPlaylistModal from './AddToPlaylistModal';

const { width } = Dimensions.get('window');

export default function FullPlayer() {
  const {
    currentSong, isExpanded, setIsExpanded,
    position, duration, isPlaying, setIsPlaying,
    seekTo, isLooping, setIsLooping, play, playPrev,
    playNext, isShuffleOn, toggleShuffle, queue
  } = usePlayer();

  const { fetchRelatedByArtist } = useRelatedSongs();
  const [isFav, setIsFav] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);

  const togglePlay = () => setIsPlaying(!isPlaying);

  function formatTime(ms: number) {
    if (!ms) return "0:00";
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  }

  const handleNext = useCallback(async () => {
    if (!currentSong) return;
    if (loadingNext) return;
    setLoadingNext(true);
    
    try {
      if (queue.length > 0) {
        await playNext();
        setLoadingNext(false);
        return;
      }

      const tracks = await fetchRelatedByArtist(currentSong.artist);
      const filtered = tracks.filter((t: any) => t.id !== currentSong.id);
      if (filtered.length === 0) {
        setLoadingNext(false);
        return;
      }
      
      const next = filtered[Math.floor(Math.random() * filtered.length)];
      const res = await fetch('http://192.168.1.16:5001/api/song-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: next.title, artist: next.artist }),
      });
      const data = await res.json();
      
      if (!data.url) {
        setLoadingNext(false);
        return;
      }

      play({
        id: next.id,
        title: next.title,
        artist: next.artist,
        cover: next.cover,
        streamUrl: data.url
      });
    } catch (e) {
      console.error("Error in handleNext:", e);
    } finally {
      setLoadingNext(false);
    }
  }, [currentSong, fetchRelatedByArtist, play, loadingNext, queue, playNext]);

  const handlePrev = useCallback(() => {
    playPrev();
  }, [playPrev]);

  if (!currentSong || !isExpanded) return null;

  return (
    <Modal visible={isExpanded} animationType="slide" transparent onRequestClose={() => setIsExpanded(false)}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable style={styles.closeBtn} onPress={() => setIsExpanded(false)}>
            <Ionicons name="chevron-down" size={32} color="#fff" />
          </Pressable>
          <Image source={{ uri: currentSong.cover }} style={styles.cover} resizeMode="cover" />
          <Text style={styles.songTitle}>{currentSong.title}</Text>
          <Text style={styles.songArtist}>{currentSong.artist}</Text>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            minimumTrackTintColor="#1f6feb"
            maximumTrackTintColor="#343650"
            thumbTintColor="#fff"
            onSlidingComplete={val => seekTo(val)}
          />
          <View style={styles.progressTimes}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.controlsRow}>
            <Pressable
              onPress={handlePrev}
              android_ripple={{ color: "#333", borderless: false }}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="play-skip-back" size={36} color="#fff" />
            </Pressable>
            <Pressable
              onPress={togglePlay}
              android_ripple={{ color: "#333", borderless: false }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={75} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleNext}
              disabled={loadingNext}
              android_ripple={{ color: "#333", borderless: false }}
              style={({ pressed }) => [
                { opacity: loadingNext ? 0.4 : pressed ? 0.6 : 1 }
              ]}
            >
              <Ionicons name="play-skip-forward" size={36} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={() => setIsFav(!isFav)}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? "#ff7a7a" : "#fff"} />
            </Pressable>
            <Pressable style={styles.actionIcon} onPress={() => setAddToPlaylistVisible(true)}>
              <Ionicons name="add-circle-outline" size={28} color="#fff" />
            </Pressable>
            <Pressable style={styles.actionIcon}>
              <Ionicons name="ellipsis-horizontal" size={32} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.actionIcon}
              onPress={toggleShuffle}
            >
              <Ionicons
                name={isShuffleOn ? "shuffle" : "shuffle-outline"}
                size={28}
                color={isShuffleOn ? "#1f6feb" : "#fff"}
              />
            </Pressable>
            <Pressable style={styles.actionIcon} onPress={() => setIsLooping(!isLooping)}>
              <Ionicons name="repeat" size={28} color={isLooping ? "#1f6feb" : "#fff"} />
            </Pressable>
          </View>

          <AddToPlaylistModal
            visible={addToPlaylistVisible}
            onClose={() => setAddToPlaylistVisible(false)}
            song={currentSong}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#191A2Cee',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#232439',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    alignItems: 'center',
    minHeight: 520,
    paddingTop: 26,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    left: 12,
    zIndex: 10,
    padding: 6,
  },
  cover: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 24,
    marginTop: 22,
    marginBottom: 16,
    backgroundColor: '#333',
  },
  songTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 2,
  },
  songArtist: {
    color: '#b3b3b3',
    fontSize: 16,
    marginBottom: 11,
    textAlign: 'center',
    opacity: 0.96,
  },
  progressTimes: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignSelf: 'center',
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 13,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '95%',
    marginBottom: 20,
    marginTop: 6,
    gap: 9,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 0,
  },
  actionIcon: {
    marginHorizontal: 8,
  },
});
