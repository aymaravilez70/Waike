// app/_layout.tsx
import { Slot } from 'expo-router';
import React, { useEffect } from 'react';
import FullPlayer from '../components/FullPlayer';
import MiniPlayer from '../components/MiniPlayer';
import { AuthProvider } from '../context/AuthContext';
import { PlayerProvider } from '../context/PlayerContext';
import { PlaylistProvider } from '../context/PlaylistContext';
import { initDownloadsDB } from '../services/downloadService';

export default function RootLayout() {
  useEffect(() => {
    initDownloadsDB();
  }, []);

  return (
    <AuthProvider>
      <PlaylistProvider>
        <PlayerProvider>
          <Slot />
          <MiniPlayer />
          <FullPlayer />
        </PlayerProvider>
      </PlaylistProvider>
    </AuthProvider>
  );
}
