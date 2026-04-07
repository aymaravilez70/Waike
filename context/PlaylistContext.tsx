// context/PlaylistContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface PlaylistContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <PlaylistContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylistRefresh = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylistRefresh must be used within PlaylistProvider');
  }
  return context;
};
