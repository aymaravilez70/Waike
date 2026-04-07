//playlistService.ts
import { supabase } from './supabase';

export interface Playlist {
    id: string;
    user_id: string;
    title: string;
    cover_url: string | null;
    is_public: boolean;
    created_at: string;
    songsCount?: number;
    images?: string[];
    hasSong?: boolean; // Nuevo: para indicar si tiene una canción específica
}

export const createPlaylist = async (title: string, userId: string) => {
    console.log("Creating playlist:", title, "for user:", userId);
    const { data, error } = await supabase
        .from('playlists')
        .insert([
            { title, user_id: userId }
        ])
        .select()
        .single();

    if (error) {
        console.error("Supabase error creating playlist:", error);
        throw error;
    }
    console.log("Playlist created:", data);
    return data;
};

export const getUserPlaylists = async (userId: string) => {
    console.log("Fetching playlists for user:", userId);
    
    // 1. Obtener todas las playlists del usuario
    const { data: playlists, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (playlistsError) {
        console.error("Supabase error fetching playlists:", playlistsError);
        throw playlistsError;
    }

    if (!playlists || playlists.length === 0) {
        console.log("No playlists found");
        return [];
    }

    // 2. Para cada playlist, obtener las canciones y sus carátulas
    const playlistsWithDetails = await Promise.all(
        playlists.map(async (playlist) => {
            // Obtener canciones únicas de la playlist con sus carátulas
            const { data: playlistSongs, error: songsError } = await supabase
                .from('playlist_songs')
                .select(`
                    song_id,
                    song:songs (
                        id,
                        cover_url
                    )
                `)
                .eq('playlist_id', playlist.id)
                .order('added_at', { ascending: false });

            if (songsError) {
                console.error("Error fetching songs for playlist:", playlist.id, songsError);
                return {
                    ...playlist,
                    name: playlist.title,
                    images: [],
                    songsCount: 0
                };
            }

            // Eliminar duplicados por song_id
            const uniqueSongs = playlistSongs?.filter((item: any, index: number, self: any[]) => 
                index === self.findIndex((t: any) => t.song_id === item.song_id)
            ) || [];

            // Extraer las URLs de las primeras 4 carátulas únicas
            const images = uniqueSongs
                .slice(0, 4)
                .map((item: any) => item.song?.cover_url)
                .filter((url: string | null) => url !== null);

            return {
                ...playlist,
                name: playlist.title,
                images: images,
                songsCount: uniqueSongs.length
            };
        })
    );

    console.log("Playlists fetched with details:", playlistsWithDetails.length);
    return playlistsWithDetails;
};

// NUEVA FUNCIÓN: Verificar en qué playlists está una canción específica
export const checkSongInPlaylists = async (userId: string, songId: string) => {
    console.log("Checking which playlists contain song:", songId);
    
    // 1. Obtener las playlists del usuario
    const { data: userPlaylists, error: playlistsError } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', userId);

    if (playlistsError || !userPlaylists) {
        console.error("Error fetching user playlists:", playlistsError);
        return [];
    }

    const playlistIds = userPlaylists.map(p => p.id);

    if (playlistIds.length === 0) {
        return [];
    }

    // 2. Buscar en qué playlists está la canción
    const { data: songInPlaylists, error: songError } = await supabase
        .from('playlist_songs')
        .select('playlist_id')
        .eq('song_id', songId.toString())
        .in('playlist_id', playlistIds);

    if (songError) {
        console.error("Error checking song in playlists:", songError);
        return [];
    }

    // Devolver array de IDs de playlists que contienen la canción
    const playlistIdsWithSong = songInPlaylists?.map(item => item.playlist_id) || [];
    console.log("Song is in playlists:", playlistIdsWithSong);
    return playlistIdsWithSong;
};

export const addSongToPlaylist = async (playlistId: string, song: any) => {
    console.log("Adding song to playlist:", playlistId, song.title);

    // 1. Upsert song to ensure it exists in 'songs' table
    const songData = {
        id: song.id.toString(),
        title: song.title,
        artist: song.artist,
        album: song.album,
        cover_url: song.cover,
        duration: song.duration || 0,
        provider: 'deezer'
    };

    const { error: songError } = await supabase
        .from('songs')
        .upsert(songData, { onConflict: 'id' });

    if (songError) {
        console.error("Error upserting song:", songError);
        throw songError;
    }

    // 2. VALIDACIÓN: Check if song already exists in playlist
    const { data: existing, error: checkError } = await supabase
        .from('playlist_songs')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('song_id', song.id.toString())
        .maybeSingle();

    if (checkError) {
        console.error("Error checking for existing song:", checkError);
        throw checkError;
    }

    if (existing) {
        console.log("Song already in playlist, skipping.");
        throw new Error("La canción ya está en la playlist");
    }

    // 3. Insert into playlist_songs
    const { data, error } = await supabase
        .from('playlist_songs')
        .insert([
            { playlist_id: playlistId, song_id: song.id.toString() }
        ])
        .select()
        .single();

    if (error) {
        console.error("Error adding song to playlist:", error);
        throw error;
    }
    console.log("Song added successfully:", data);
    return data;
};

export const getPlaylistDetails = async (playlistId: string) => {
    console.log("getPlaylistDetails called with:", playlistId);
    
    // 1. Get playlist info
    const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

    if (playlistError) {
        console.error("Error fetching playlist metadata:", playlistError);
        throw playlistError;
    }
    console.log("Playlist metadata found:", playlist);

    // 2. Get songs in playlist
    const { data: songs, error: songsError } = await supabase
        .from('playlist_songs')
        .select(`
            added_at,
            song_id,
            song:songs (
                id,
                title,
                artist,
                album,
                cover_url,
                duration
            )
        `)
        .eq('playlist_id', playlistId)
        .order('added_at', { ascending: false });

    if (songsError) {
        console.error("Error fetching playlist songs:", songsError);
        throw songsError;
    }

    // Flatten the structure y eliminar duplicados
    const uniqueSongsMap = new Map();
    songs.forEach((item: any) => {
        if (item.song && !uniqueSongsMap.has(item.song_id)) {
            uniqueSongsMap.set(item.song_id, {
                ...item.song,
                added_at: item.added_at
            });
        }
    });

    const formattedSongs = Array.from(uniqueSongsMap.values());

    return { ...playlist, songs: formattedSongs };
};

export const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    console.log("Removing song:", songId, "from playlist:", playlistId);
    const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);

    if (error) {
        console.error("Error removing song:", error);
        throw error;
    }
    console.log("Song removed successfully");
};
