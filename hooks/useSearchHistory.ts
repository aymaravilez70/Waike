//hooks/useSearchHistory.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { SongSuggestion } from './useSongSearch';

const HISTORY_KEY = 'waike_search_history';
const MAX_HISTORY = 20;

export function useSearchHistory() {
    const [history, setHistory] = useState<SongSuggestion[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
            if (jsonValue != null) {
                setHistory(JSON.parse(jsonValue));
            }
        } catch (e) {
            console.error('Error loading search history', e);
        }
    };

    const addToHistory = async (song: SongSuggestion) => {
        try {
            const newHistory = [song, ...history.filter(item => item.id !== song.id)].slice(0, MAX_HISTORY);
            setHistory(newHistory);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Error saving search history', e);
        }
    };

    const removeFromHistory = async (id: string) => {
        try {
            const newHistory = history.filter(item => item.id !== id);
            setHistory(newHistory);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Error removing from search history', e);
        }
    };

    const clearHistory = async () => {
        try {
            setHistory([]);
            await AsyncStorage.removeItem(HISTORY_KEY);
        } catch (e) {
            console.error('Error clearing search history', e);
        }
    };

    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
    };
}
