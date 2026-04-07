// components/SearchBar.tsx

import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Image } from 'react-native';

export default function SearchBar({ value, onChangeText, onSubmit }) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://img.icons8.com/ios-filled/50/1f6feb/search--v1.png' }}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder="Buscar canciones, artistas, playlists..."
        placeholderTextColor="#b3b3b3"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value?.length > 0 && (
        <Pressable onPress={() => onChangeText('')}>
          <Image
            source={{ uri: 'https://img.icons8.com/ios-glyphs/30/1f6feb/close-window.png' }}
            style={styles.clearIcon}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#20222b',
    borderRadius: 16,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 21,
    width: '100%',
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#1f6feb',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#f7faff',
    paddingVertical: 0,
  },
  clearIcon: {
    width: 18,
    height: 18,
    marginLeft: 8,
    tintColor: '#1f6feb',
  },
});
