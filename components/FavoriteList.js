// /components/FavoriteList.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function FavoriteList() {
  const favoriteSongs = [
    { id: 'f1', name: 'Dreamy Night', image: 'https://via.placeholder.com/40' },
    { id: 'f2', name: 'Blue Sky', image: 'https://via.placeholder.com/40' },
  ];

  return (
    <View style={favStyles.container}>
      <Image source={{ uri: favoriteSongs[0].image }} style={favStyles.cover} />
      <View style={favStyles.info}>
        <Text style={favStyles.name}>Favoritos</Text>
        <Text style={favStyles.count}>{favoriteSongs.length} favoritos</Text>
      </View>
    </View>
  );
}

const favStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121C26',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    marginTop: 40, // <- Ajusta este valor para bajar más la carpeta Favoritos
  },
  cover: { width: 42, height: 42, borderRadius: 6, marginRight: 10 },
  info: {},
  name: { color: '#579AFF', fontWeight: '700', fontSize: 16 },
  count: { color: '#bbb', fontSize: 13 },
});
