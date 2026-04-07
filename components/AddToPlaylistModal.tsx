//components/AddToPlaylistModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePlaylistRefresh } from '../context/PlaylistContext';
import { addSongToPlaylist, checkSongInPlaylists, getUserPlaylists, removeSongFromPlaylist } from '../services/playlistService';

interface AddToPlaylistModalProps {
    visible: boolean;
    onClose: () => void;
    song: any | null;
}

export default function AddToPlaylistModal({ visible, onClose, song }: AddToPlaylistModalProps) {
    const { user } = useAuth();
    const { triggerRefresh } = usePlaylistRefresh();
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playlistsWithSong, setPlaylistsWithSong] = useState<string[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (visible && user && song) {
            loadPlaylistsAndCheck();
        }
    }, [visible, user, song]);

    const loadPlaylistsAndCheck = async () => {
        if (!user || !song) return;
        try {
            const data = await getUserPlaylists(user.id);
            setPlaylists(data);

            const playlistIds = await checkSongInPlaylists(user.id, song.id.toString());
            setPlaylistsWithSong(playlistIds);
        } catch (e) {
            console.error("Error loading playlists:", e);
        }
    };

    const handleTogglePlaylist = async (playlistId: string, playlistName: string) => {
        if (!song) return;

        const isInPlaylist = playlistsWithSong.includes(playlistId);

        try {
            if (isInPlaylist) {
                // Quitar de la playlist
                await removeSongFromPlaylist(playlistId, song.id.toString());
                setPlaylistsWithSong(prev => prev.filter(id => id !== playlistId));
                
                // Actualizar el contador INMEDIATAMENTE en el estado local
                setPlaylists(prev => prev.map(p => 
                    p.id === playlistId 
                        ? { ...p, songsCount: Math.max(0, (p.songsCount || 0) - 1) }
                        : p
                ));
                
                showToast(`✗ Eliminada de ${playlistName}`);
            } else {
                // Agregar a la playlist
                await addSongToPlaylist(playlistId, song);
                setPlaylistsWithSong(prev => [...prev, playlistId]);
                
                // Actualizar el contador INMEDIATAMENTE en el estado local
                setPlaylists(prev => prev.map(p => 
                    p.id === playlistId 
                        ? { ...p, songsCount: (p.songsCount || 0) + 1 }
                        : p
                ));
                
                showToast(`✓ Agregada a ${playlistName}`);
            }
            
            // Notificar para actualizar otras pantallas
            triggerRefresh();
        } catch (e: any) {
            console.error("Error toggling song in playlist:", e);
            if (e.message === "La canción ya está en la playlist") {
                setPlaylistsWithSong(prev => [...prev, playlistId]);
            } else {
                showToast("Error al modificar la playlist");
            }
        }
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage(null);
        }, 2000);
    };

    const renderCollage = (playlist: any) => {
        const placeholderImage = 'https://via.placeholder.com/100x100/1f6feb/ffffff?text=♪';
        const images = [...(playlist.images || [])];
        
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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Agregar a Playlist</Text>
                    <Text style={styles.subtitle}>{song?.title} - {song?.artist}</Text>

                    <FlatList
                        data={playlists}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            const isInPlaylist = playlistsWithSong.includes(item.id);
                            
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        isInPlaylist && styles.itemSelected
                                    ]}
                                    onPress={() => handleTogglePlaylist(item.id, item.title)}
                                >
                                    {renderCollage(item)}
                                    
                                    <View style={styles.playlistInfo}>
                                        <Text style={styles.playlistName}>{item.title}</Text>
                                        <Text style={styles.songCount}>{item.songsCount || 0} canciones</Text>
                                    </View>

                                    {isInPlaylist && (
                                        <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        style={styles.list}
                    />

                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>Cerrar</Text>
                    </TouchableOpacity>
                </View>

                {toastMessage && (
                    <View style={styles.toast}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#161725',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '60%',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    list: {
        marginBottom: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2b3d',
        borderRadius: 8,
    },
    itemSelected: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
    },
    collageContainer: {
        width: 48,
        height: 48,
        marginRight: 12,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#1f6feb',
    },
    collageRow: {
        flexDirection: 'row',
        flex: 1,
    },
    collageImg: {
        width: 24,
        height: 24,
        flex: 1,
    },
    playlistInfo: {
        flex: 1,
    },
    playlistName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    songCount: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    closeBtn: {
        backgroundColor: '#2a2b3d',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    toast: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: '#2a2b3d',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});
