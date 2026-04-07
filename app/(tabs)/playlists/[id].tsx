// app/playlist/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlayer } from '../../../context/PlayerContext';
import {
    downloadPlaylist,
    getPlaylistDownloads
} from '../../../services/downloadService';
import { getPlaylistDetails } from '../../../services/playlistService';

interface DownloadState {
    [songId: string]: {
        status: 'not_downloaded' | 'downloading' | 'completed' | 'failed';
        progress: number;
    };
}

export default function PlaylistDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { playPlaylist, isShuffleOn, toggleShuffle } = usePlayer();
    const [playlist, setPlaylist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloadStates, setDownloadStates] = useState<DownloadState>({});
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(false);

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        console.log("Loading details for playlist ID:", id);
        if (!id) return;
        try {
            const data = await getPlaylistDetails(id as string);
            console.log("Playlist details loaded:", data);

            if (data.songs) {
                const uniqueSongs = Array.from(new Map(data.songs.map(song => [song.id, song])).values());
                data.songs = uniqueSongs;
            }

            setPlaylist(data);

            // Cargar estados de descargas
            loadDownloadStates(data.songs);
        } catch (e) {
            console.error("Error loading playlist details:", e);
        } finally {
            setLoading(false);
        }
    };

    const loadDownloadStates = async (songs: any[]) => {
        const states: DownloadState = {};
        const downloads = getPlaylistDownloads(songs.map(s => s.id));

        for (const song of songs) {
            const download = downloads.find((d: any) => d.song_id === song.id.toString());
            if (download) {
                states[song.id] = {
                    status: download.status,
                    progress: download.progress
                };
            } else {
                states[song.id] = {
                    status: 'not_downloaded',
                    progress: 0
                };
            }
        }
        setDownloadStates(states);
    };

    const handlePlaySong = async (song: any) => {
        if (playlist && playlist.songs) {
            const playerSongs = playlist.songs.map((s: any) => ({
                id: s.id,
                title: s.title,
                artist: s.artist,
                cover: s.cover_url,
                streamUrl: s.streamUrl
            }));

            const startIndex = playerSongs.findIndex((s: any) => s.id === song.id);
            await playPlaylist(playerSongs, startIndex !== -1 ? startIndex : 0);
        }
    };

    const handlePlayAll = async () => {
        if (!playlist || !playlist.songs || playlist.songs.length === 0) return;

        const playerSongs = playlist.songs.map((s: any) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            cover: s.cover_url,
            streamUrl: s.streamUrl
        }));

        if (isShuffleOn) {
            const randomIndex = Math.floor(Math.random() * playerSongs.length);
            await playPlaylist(playerSongs, randomIndex);
        } else {
            await playPlaylist(playerSongs, 0);
        }
    };

    const handleShuffleToggle = () => {
        toggleShuffle();
    };

    // Descargar toda la playlist
    const handleDownloadAll = async () => {
        if (!playlist || !playlist.songs) return;

        // Activar auto-download
        setAutoDownloadEnabled(true);
        setIsDownloadingAll(true);

        try {
            await downloadPlaylist(
                playlist.songs.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    artist: s.artist,
                    cover_url: s.cover_url
                })),
                (songId, progress) => {
                    setDownloadStates(prev => ({
                        ...prev,
                        [songId]: { status: 'downloading', progress }
                    }));
                },
                (songId) => {
                    setDownloadStates(prev => ({
                        ...prev,
                        [songId]: { status: 'completed', progress: 1 }
                    }));
                }
            );

            Alert.alert('✅ Éxito', 'Playlist descargada completamente');
        } catch (error) {
            console.error('Error downloading playlist:', error);
            Alert.alert('❌ Error', 'Hubo un error descargando la playlist');
        } finally {
            setIsDownloadingAll(false);
        }
    };

    const renderCollage = () => {
        const placeholderImage = 'https://via.placeholder.com/100x100/1f6feb/ffffff?text=♪';
        const images = [];

        if (playlist?.songs) {
            playlist.songs.slice(0, 4).forEach((song: any) => {
                if (song.cover_url) {
                    images.push(song.cover_url);
                }
            });
        }

        while (images.length < 4) {
            images.push(placeholderImage);
        }

        return (
            <View style={styles.collageContainer}>
                <View style={styles.collageRow}>
                    <Image source={{ uri: images[0] }} style={styles.collageImg} />
                    <Image source={{ uri: images[1] }} style={styles.collageImg} />
                </View>
                <View style={styles.collageRow}>
                    <Image source={{ uri: images[2] }} style={styles.collageImg} />
                    <Image source={{ uri: images[3] }} style={styles.collageImg} />
                </View>
            </View>
        );
    };

    const renderDownloadIndicator = (songId: string) => {
        const state = downloadStates[songId];
        if (!state) return null;

        if (state.status === 'completed') {
            return (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            );
        }

        if (state.status === 'downloading') {
            return (
                <ActivityIndicator size="small" color="#1f6feb" />
            );
        }

        return null;
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1f6feb" />
            </View>
        );
    }

    if (!playlist) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Playlist no encontrada</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1f6feb', '#121212']} style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {renderCollage()}

                <Text style={styles.title}>{playlist.title}</Text>
                <Text style={styles.songCount}>{playlist.songs?.length || 0} canciones</Text>
            </LinearGradient>

            <View style={styles.actionsContainer}>
                <View style={styles.secondaryActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="heart-outline" size={26} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconButton, autoDownloadEnabled && styles.activeButton]}
                        onPress={handleDownloadAll}
                        disabled={isDownloadingAll}
                    >
                        <Ionicons
                            name={autoDownloadEnabled ? "download" : "download-outline"}
                            size={26}
                            color={autoDownloadEnabled ? "#1f6feb" : "#fff"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} onPress={handleShuffleToggle}>
                        <Ionicons
                            name={isShuffleOn ? "shuffle" : "shuffle-outline"}
                            size={26}
                            color={isShuffleOn ? "#1f6feb" : "#fff"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="ellipsis-horizontal" size={26} color="#fff" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
                    <Ionicons name="play" size={32} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={playlist.songs}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.songItem}
                        onPress={() => handlePlaySong(item)}
                    >
                        <Image source={{ uri: item.cover_url }} style={styles.songCover} />
                        <View style={styles.songInfo}>
                            <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
                        </View>

                        {/* Indicador de descarga o 3 puntos */}
                        {renderDownloadIndicator(item.id) || (
                            <TouchableOpacity>
                                <Ionicons name="ellipsis-vertical" size={20} color="#aaa" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
    headerContainer: {
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
        padding: 8,
    },
    collageContainer: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    collageRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    collageImg: {
        width: 90,
        height: 90,
        marginHorizontal: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    songCount: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 8,
        borderRadius: 50,
    },
    activeButton: {
        backgroundColor: 'rgba(31, 111, 235, 0.2)',
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 50,
        backgroundColor: '#1f6feb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    songItemWrapper: {
        marginBottom: 12,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    songCover: {
        width: 48,
        height: 48,
        borderRadius: 4,
        marginRight: 12,
    },
    songInfo: {
        flex: 1,
    },
    songTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    songArtist: {
        fontSize: 12,
        color: '#aaa',
    },
    downloadControlContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 12,
    },
    downloadStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    progressText: {
        fontSize: 10,
        color: '#1f6feb',
        fontWeight: '600',
    },
    downloadButton: {
        padding: 6,
    },
    errorText: {
        fontSize: 16,
        color: '#ff6b6b',
        textAlign: 'center',
    },
});