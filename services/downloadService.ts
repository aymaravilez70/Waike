// services/downloadService.ts
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy'; // <-- CAMBIO AQUÍ
import { API_BASE_URL } from '../constants/config';

const db = SQLite.openDatabaseSync('downloads.db');

// Inicializar la base de datos
export const initDownloadsDB = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS downloads (
            id TEXT PRIMARY KEY,
            song_id TEXT NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            cover_url TEXT,
            file_path TEXT,
            status TEXT DEFAULT 'pending',
            progress REAL DEFAULT 0,
            downloaded_at TEXT,
            file_size INTEGER
        );
    `);
    console.log('✅ Downloads DB initialized');
};

// Verificar si una canción está descargada
export const isSongDownloaded = async (songId: string): Promise<boolean> => {
    try {
        const result = db.getFirstSync(
            'SELECT id FROM downloads WHERE song_id = ? AND status = "completed"',
            [songId.toString()]
        );
        return !!result;
    } catch (error) {
        console.error('Error checking download status:', error);
        return false;
    }
};

// Obtener ruta del archivo local
export const getLocalFilePath = async (songId: string): Promise<string | null> => {
    try {
        const result = db.getFirstSync<{ file_path: string }>(
            'SELECT file_path FROM downloads WHERE song_id = ? AND status = "completed"',
            [songId.toString()]
        );
        
        if (result?.file_path) {
            // Verificar que el archivo realmente existe
            const fileInfo = await FileSystem.getInfoAsync(result.file_path);
            if (fileInfo.exists) {
                return result.file_path;
            } else {
                // Si no existe, limpiar de la DB
                db.runSync('DELETE FROM downloads WHERE song_id = ?', [songId.toString()]);
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error('Error getting local file path:', error);
        return null;
    }
};

// Guardar download en la DB
export const saveDownload = (songId: string, data: any) => {
    try {
        db.runSync(
            `INSERT OR REPLACE INTO downloads 
            (id, song_id, title, artist, cover_url, file_path, status, progress, downloaded_at, file_size) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                `download_${songId}`,
                songId.toString(),
                data.title,
                data.artist,
                data.cover_url,
                data.file_path,
                data.status,
                data.progress,
                new Date().toISOString(),
                data.file_size || 0
            ]
        );
    } catch (error) {
        console.error('Error saving download:', error);
    }
};

// Actualizar progreso
export const updateDownloadProgress = (songId: string, progress: number, status: string) => {
    try {
        db.runSync(
            'UPDATE downloads SET progress = ?, status = ? WHERE song_id = ?',
            [progress, status, songId.toString()]
        );
    } catch (error) {
        console.error('Error updating progress:', error);
    }
};

// Obtener todas las descargas de una playlist
export const getPlaylistDownloads = (songIds: string[]) => {
    try {
        if (songIds.length === 0) return [];
        
        const placeholders = songIds.map(() => '?').join(',');
        const results = db.getAllSync<any>(
            `SELECT * FROM downloads WHERE song_id IN (${placeholders})`,
            songIds.map(id => id.toString())
        );
        return results;
    } catch (error) {
        console.error('Error getting playlist downloads:', error);
        return [];
    }
};

// Obtener estado de descarga de una canción
export const getDownloadStatus = (songId: string) => {
    try {
        const result = db.getFirstSync<any>(
            'SELECT status, progress FROM downloads WHERE song_id = ?',
            [songId.toString()]
        );
        return result || { status: 'not_downloaded', progress: 0 };
    } catch (error) {
        console.error('Error getting download status:', error);
        return { status: 'not_downloaded', progress: 0 };
    }
};

// Eliminar descarga
export const deleteDownload = async (songId: string) => {
    try {
        const filePath = await getLocalFilePath(songId);
        if (filePath) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
        db.runSync('DELETE FROM downloads WHERE song_id = ?', [songId.toString()]);
        console.log('✅ Download deleted:', songId);
    } catch (error) {
        console.error('Error deleting download:', error);
    }
};

// Descargar una canción - USANDO FETCH MANUAL
export const downloadSong = async (
    song: { id: string; title: string; artist: string; cover_url: string },
    onProgress?: (progress: number) => void
) => {
    try {
        const fileName = `${song.id}.mp3`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        console.log(`📥 Starting download: ${song.title}`);

        // Actualizar estado a "downloading"
        saveDownload(song.id, {
            title: song.title,
            artist: song.artist,
            cover_url: song.cover_url,
            file_path: fileUri,
            status: 'downloading',
            progress: 0,
        });

        // Hacer request al backend
        const response = await fetch(`${API_BASE_URL}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: song.title,
                artist: song.artist,
                songId: song.id
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Obtener el blob
        const blob = await response.blob();
        
        // Convertir blob a base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const base64Data = await base64Promise;

        // Guardar archivo
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Verificar que se guardó
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

        // Actualizar a completado
        saveDownload(song.id, {
            title: song.title,
            artist: song.artist,
            cover_url: song.cover_url,
            file_path: fileUri,
            status: 'completed',
            progress: 1,
            file_size: fileSize,
        });

        console.log(`✅ Download completed: ${song.title} (${fileSize} bytes)`);
        
        if (onProgress) {
            onProgress(1);
        }
        
        return fileUri;
    } catch (error) {
        console.error('Download error:', error);
        updateDownloadProgress(song.id, 0, 'failed');
        throw error;
    }
};

// Descargar todas las canciones de una playlist
export const downloadPlaylist = async (
    songs: Array<{ id: string; title: string; artist: string; cover_url: string }>,
    onSongProgress?: (songId: string, progress: number) => void,
    onComplete?: (songId: string) => void
) => {
    console.log(`📥 Starting playlist download: ${songs.length} songs`);
    
    for (const song of songs) {
        try {
            // Verificar si ya está descargada
            const isDownloaded = await isSongDownloaded(song.id);
            if (isDownloaded) {
                console.log(`⏭️ Skipping already downloaded: ${song.title}`);
                if (onComplete) onComplete(song.id);
                continue;
            }

            // Marcar como downloading
            if (onSongProgress) onSongProgress(song.id, 0);

            // Descargar
            await downloadSong(song);

            // Marcar como completado
            if (onSongProgress) onSongProgress(song.id, 1);
            if (onComplete) onComplete(song.id);
        } catch (error) {
            console.error(`❌ Failed to download: ${song.title}`, error);
        }
    }
    
    console.log('✅ Playlist download completed');
};
