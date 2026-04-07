import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CreatePlaylistModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
}

export default function CreatePlaylistModal({ visible, onClose, onSubmit }: CreatePlaylistModalProps) {
    const [name, setName] = useState('');

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit(name);
            setName('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Nueva Playlist</Text>
                    <Text style={styles.subtitle}>Ponle un nombre a tu lista</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Mi Playlist #1"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} style={styles.createBtn}>
                            <Text style={styles.createText}>Crear</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        backgroundColor: '#232439',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#b3b3b3',
        fontSize: 14,
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#191A2C',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#343650',
    },
    buttons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    createBtn: {
        flex: 1,
        backgroundColor: '#1f6feb',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    createText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
