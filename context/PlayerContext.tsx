// context/PlayerContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { getLocalFilePath } from '../services/downloadService';

export interface PlayerSong {
  id: string;
  title: string;
  artist: string;
  cover: string;
  streamUrl?: string;
}

interface PlayerContextType {
  currentSong: PlayerSong | null;
  setCurrentSong: (s: PlayerSong) => void;
  isExpanded: boolean;
  setIsExpanded: (b: boolean) => void;
  position: number;
  duration: number;
  setPlaybackState: (pos: number, dur: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  seekTo: (position: number) => void;
  seekPosition: number | null;
  setSeekPosition: (pos: number | null) => void;
  play: (song: PlayerSong, isNext?: boolean) => void;
  playPrev: () => void;
  playNextHistory: () => void;
  isLooping: boolean;
  setIsLooping: (looping: boolean) => void;
  fetchStreamUrl: (title: string, artist: string) => Promise<string | null>;
  playNextAuto: () => void;
  queue: PlayerSong[];
  playPlaylist: (songs: PlayerSong[], startIndex?: number) => Promise<void>;
  playNext: () => void;
  isShuffleOn: boolean;
  toggleShuffle: () => void;
  originalQueue: PlayerSong[];
  currentIndex: number;
  getPlayableUrl: (song: PlayerSong) => Promise<string | null>; // NUEVA
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<PlayerSong | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekPosition, setSeekPosition] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  const [songHistory, setSongHistory] = useState<PlayerSong[]>([]);
  const [futureSongs, setFutureSongs] = useState<PlayerSong[]>([]);

  const [queue, setQueue] = useState<PlayerSong[]>([]);
  const [originalQueue, setOriginalQueue] = useState<PlayerSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);

  const setPlaybackState = (pos: number, dur: number) => {
    setPosition(pos);
    setDuration(dur || 1);
  };

  const seekTo = (pos: number) => {
    setSeekPosition(pos);
  };

  const fetchStreamUrl = async (title: string, artist: string) => {
    try {
      const res = await fetch('http://192.168.1.16:5001/api/song-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      });
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error("Error fetching stream URL:", err);
      return null;
    }
  };

  // NUEVA FUNCIÓN: Obtener URL reproducible (local o stream)
  const getPlayableUrl = async (song: PlayerSong): Promise<string | null> => {
    // 1. Intentar obtener archivo local primero
    const localPath = await getLocalFilePath(song.id);
    if (localPath) {
      console.log(`🎵 Playing from local file: ${song.title}`);
      return localPath;
    }

    // 2. Si no hay local, usar streamUrl existente
    if (song.streamUrl) {
      console.log(`🌐 Playing from stream (cached): ${song.title}`);
      return song.streamUrl;
    }

    // 3. Si no hay streamUrl, obtener uno nuevo
    console.log(`🌐 Fetching stream URL for: ${song.title}`);
    const streamUrl = await fetchStreamUrl(song.title, song.artist);
    return streamUrl;
  };

  const playPlaylist = async (songs: PlayerSong[], startIndex: number = 0) => {
    if (!songs || songs.length === 0) return;

    setOriginalQueue(songs);
    setQueue(songs);
    setCurrentIndex(startIndex);
    setPlayedIndices([startIndex]);

    let song = songs[startIndex];

    // Obtener URL reproducible (local o stream)
    const playableUrl = await getPlayableUrl(song);
    if (playableUrl) {
      song = { ...song, streamUrl: playableUrl };
    } else {
      console.error("No playable URL found for song");
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);
    setSongHistory([]);
    setFutureSongs([]);
  };

  const toggleShuffle = () => {
    setIsShuffleOn(prev => !prev);
  };

  const playNext = async () => {
    if (queue.length === 0) return;

    let nextIndex: number;

    if (isShuffleOn) {
      const unplayedIndices = queue
        .map((_, idx) => idx)
        .filter(idx => !playedIndices.includes(idx));

      if (unplayedIndices.length === 0) {
        setPlayedIndices([]);
        nextIndex = Math.floor(Math.random() * queue.length);
        if (queue.length > 1 && nextIndex === currentIndex) {
          nextIndex = (nextIndex + 1) % queue.length;
        }
        setPlayedIndices([nextIndex]);
      } else {
        nextIndex = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
        setPlayedIndices(prev => [...prev, nextIndex]);
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (isLooping) {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    setCurrentIndex(nextIndex);
    let nextSong = queue[nextIndex];

    // Obtener URL reproducible
    const playableUrl = await getPlayableUrl(nextSong);
    if (playableUrl) {
      nextSong = { ...nextSong, streamUrl: playableUrl };
    } else {
      console.error("No playable URL found, skipping");
      return;
    }

    setCurrentSong(nextSong);
    setIsPlaying(true);
  };

  const play = (song: PlayerSong, isNext = false) => {
    if (!queue.find(s => s.id === song.id)) {
      if (currentSong && (song.id !== currentSong.id)) {
        setSongHistory(prev => [...prev, currentSong]);
        setFutureSongs([]);
      }
    }
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const playPrev = async () => {
    if (queue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      let prevSong = queue[prevIndex];
      const playableUrl = await getPlayableUrl(prevSong);
      if (playableUrl) {
        prevSong = { ...prevSong, streamUrl: playableUrl };
      }
      
      setCurrentSong(prevSong);
      setIsPlaying(true);

      if (isShuffleOn) {
        setPlayedIndices(prev => [...prev, prevIndex]);
      }
    } else {
      setSongHistory(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        setFutureSongs(future => currentSong ? [currentSong, ...future] : future);
        setCurrentSong(last);
        setIsPlaying(true);
        return prev.slice(0, prev.length - 1);
      });
    }
  };

  const playNextHistory = () => {
    setFutureSongs(future => {
      if (future.length === 0) return future;
      const next = future[0];
      setSongHistory(prev => currentSong ? [...prev, currentSong] : prev);
      setCurrentSong(next);
      setIsPlaying(true);
      return future.slice(1);
    });
  };

  const playNextAuto = async () => {
    console.log("playNextAuto called");

    if (queue.length > 0) {
      console.log("Playing next from queue");
      await playNext();
      return;
    }

    if (futureSongs.length > 0) {
      console.log("Playing from history (future)");
      playNextHistory();
      return;
    }

    if (currentSong) {
      console.log("Fetching similar songs for artist:", currentSong.artist);
      try {
        const query = `artist:"${currentSong.artist}"`;
        const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data && data.data && data.data.length > 0) {
          const candidates = data.data.filter((s: any) => String(s.id) !== String(currentSong.id));

          if (candidates.length > 0) {
            const randomSong = candidates[Math.floor(Math.random() * candidates.length)];
            const streamUrl = await fetchStreamUrl(randomSong.title, randomSong.artist.name);

            if (streamUrl) {
              const nextSong: PlayerSong = {
                id: String(randomSong.id),
                title: randomSong.title,
                artist: randomSong.artist.name,
                cover: randomSong.album.cover_medium,
                streamUrl: streamUrl
              };
              play(nextSong, true);
            }
          }
        }
      } catch (e) {
        console.error("Error auto-playing next song:", e);
      }
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, setCurrentSong, isExpanded, setIsExpanded,
      position, duration, setPlaybackState,
      isPlaying, setIsPlaying,
      seekTo, seekPosition, setSeekPosition,
      play, playPrev, playNextHistory,
      isLooping, setIsLooping,
      fetchStreamUrl, playNextAuto,
      queue, playPlaylist, playNext,
      isShuffleOn, toggleShuffle,
      originalQueue, currentIndex,
      getPlayableUrl // EXPORTAR
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be inside a PlayerProvider');
  return ctx;
};
