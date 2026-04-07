// /components/PlaylistItem.js
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PlaylistItem({ playlist }) {
  const router = useRouter();

  // Asegurar que tenemos 4 imágenes (rellenar con placeholder si faltan)
  const placeholderImage = 'https://via.placeholder.com/100x100/1f6feb/ffffff?text=♪';
  const images = [...(playlist.images || [])];
  while (images.length < 4) {
    images.push(placeholderImage);
  }

  return (
    <TouchableOpacity
      style={itemStyles.container}
      onPress={() => router.push(`/playlists/${playlist.id}`)}
    >
      {/* Collage 2x2 como una sola imagen cuadrada */}
      <View style={itemStyles.collageContainer}>
        <View style={itemStyles.collageRow}>
          <Image source={{ uri: images[0] }} style={itemStyles.collageImg} />
          <Image source={{ uri: images[1] }} style={itemStyles.collageImg} />
        </View>
        <View style={itemStyles.collageRow}>
          <Image source={{ uri: images[2] }} style={itemStyles.collageImg} />
          <Image source={{ uri: images[3] }} style={itemStyles.collageImg} />
        </View>
      </View>
      
      <View style={itemStyles.info}>
        <Text style={itemStyles.name}>{playlist.name}</Text>
        <Text style={itemStyles.count}>{playlist.songsCount} canciones</Text>
      </View>
    </TouchableOpacity>
  );
}

const itemStyles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 18 
  },
  collageContainer: {
    width: 64,
    height: 64,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1f6feb',
  },
  collageRow: {
    flexDirection: 'row',
    flex: 1,
  },
  collageImg: {
    width: 32,
    height: 32,
    flex: 1,
  },
  info: {
    flex: 1,
  },
  name: { 
    color: '#579AFF', 
    fontWeight: '600', 
    fontSize: 15 
  },
  count: { 
    color: '#bbb', 
    fontSize: 12,
    marginTop: 2,
  },
});
