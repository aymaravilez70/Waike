// hooks/useSongSearch.ts

import { useState, useRef } from 'react';

// Tipado de una sugerencia de canción de Deezer
export interface SongSuggestion {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  preview: string; // URL de preview de Deezer por si quieres escuchar 30s
}

export function useSongSearch() {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Lógica de búsqueda con debounce
  const searchSongs = (query: string) => {
    setText(query);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!query || query.trim().length < 2) {
    setSuggestions([]);
    setLoading(false); // <-- SOLUCIÓN: al vaciar texto, también se desactiva loading
    return;
    }


    setLoading(true);
    setError(null);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data && Array.isArray(data.data)) {
          setSuggestions(data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            artist: item.artist.name,
            album: item.album.title,
            cover: item.album.cover_medium,
            preview: item.preview,
          })));
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setError('Error buscando canciones');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400); // debounce de 400ms
  };

  return {
    text,
    setText: searchSongs,
    suggestions,
    loading,
    error,
  };
}
