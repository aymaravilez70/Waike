// hooks/useRelatedSongs.ts

import { useState } from 'react';

export interface RelatedSong {
  id: string;
  title: string;
  artist: string;
  cover: string;
}

export function useRelatedSongs() {
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState<RelatedSong[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Busca canciones relacionadas por artista (puedes ampliar luego por género)
  const fetchRelatedByArtist = async (artistName: string) => {
    setLoading(true);
    setError(null);
    try {
      // Busca el artista exacto primero
      const artistRes = await fetch(
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&output=jsonp`
      );
      const artistText = await artistRes.text();
      const artistJson = JSON.parse(artistText.replace(/^[^(]*\(([\s\S]*)\);?$/, '$1'));
      const artistId = artistJson.data[0]?.id;
      if (!artistId) throw new Error('Artista no encontrado.');

      // Top tracks del artista
      const tracksRes = await fetch(
        `https://api.deezer.com/artist/${artistId}/top?limit=20&output=jsonp`
      );
      const tracksText = await tracksRes.text();
      const tracksJson = JSON.parse(tracksText.replace(/^[^(]*\(([\s\S]*)\);?$/, '$1'));
      const tracks = tracksJson.data.map((track: any) => ({
        id: String(track.id),
        title: track.title,
        artist: track.artist.name,
        cover: track.album.cover_big || track.album.cover,
      }));
      setRelated(tracks);
      setLoading(false);
      return tracks;
    } catch (e: any) {
      setError(e.message || 'Error al buscar relacionados');
      setLoading(false);
      setRelated([]);
      return [];
    }
  };

  return {
    related,
    loading,
    error,
    fetchRelatedByArtist,
    setRelated, // Opción si quieres controlar manualmente
  };
}
