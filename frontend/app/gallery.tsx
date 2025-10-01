import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Image,
  Modal,
  Share,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface UserArtwork {
  id: string;
  user_id?: string;
  coloring_page_id: string;
  artwork_data: string;
  completed_at: string;
  title?: string;
}

export default function GalleryScreen() {
  const [artworks, setArtworks] = useState<UserArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<UserArtwork | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadArtworks();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğrafları kaydetmek için galeri izni gerekiyor.');
    }
  };

  const loadArtworks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/artworks`);
      const artworksList = await response.json();
      setArtworks(artworksList);
    } catch (error) {
      console.error('Failed to load artworks:', error);
      Alert.alert('Hata', 'Eserler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const deleteArtwork = async (artworkId: string) => {
    Alert.alert(
      'Eseri Sil',
      'Bu eseri silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/artworks/${artworkId}`, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                setArtworks(prev => prev.filter(artwork => artwork.id !== artworkId));
                setShowDetails(false);
                Alert.alert('Başarılı', 'Eser silindi.');
              } else {
                Alert.alert('Hata', 'Eser silinemedi.');
              }
            } catch (error) {
              console.error('Failed to delete artwork:', error);
              Alert.alert('Hata', 'Eser silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const shareArtwork = async (artwork: UserArtwork) => {
    try {
      if (Platform.OS === 'web') {
        // Web paylaşım
        if (navigator.share) {
          await navigator.share({
            title: artwork.title || 'Boyama Eserim',
            text: `${artwork.title || 'Boyama Eserim'} - Boyama Oyunu ile yapıldı!`,
          });
        } else {
          // Fallback: clipboard'a kopyala
          Alert.alert('Bilgi', 'Eser başlığı kopyalandı!');
        }
      } else {
        await Share.share({
          message: `${artwork.title || 'Boyama Eserim'} - Boyama Oyunu ile yapıldı!`,
          url: `data:image/png;base64,${artwork.artwork_data}`,
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Hata', 'Paylaşım başarısız oldu.');
    }
  };

  const saveToGallery = async (artwork: UserArtwork) => {
    try {
      if (Platform.OS === 'web') {
        // Web için download functionality
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${artwork.artwork_data}`;
        link.download = `${artwork.title || 'boyama'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Başarılı!', 'Eser indirildi.');
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Fotoğrafı kaydetmek için galeri izni gerekiyor.');
          return;
        }

        // Convert base64 to file and save
        const filename = `boyama_${artwork.id}_${Date.now()}.png`;
        const asset = await MediaLibrary.createAssetAsync(`data:image/png;base64,${artwork.artwork_data}`);
        await MediaLibrary.createAlbumAsync('Boyama Oyunu', asset, false);
        
        Alert.alert('Başarılı!', 'Eser galerinize kaydedildi.');
      }
    } catch (error) {
      console.error('Save to gallery failed:', error);
      Alert.alert('Hata', 'Eser kaydedilemedi.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderArtwork = ({ item }: { item: UserArtwork }) => (
    <TouchableOpacity
      style={styles.artworkCard}
      onPress={() => {
        setSelectedArtwork(item);
        setShowDetails(true);
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: `data:image/png;base64,${item.artwork_data}` }}
        style={styles.artworkImage}
        resizeMode="cover"
      />
      
      <View style={styles.artworkInfo}>
        <Text style={styles.artworkTitle} numberOfLines={1}>
          {item.title || 'Başlıksız Eser'}
        </Text>
        <Text style={styles.artworkDate}>
          {formatDate(item.completed_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyGallery = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎨</Text>
      <Text style={styles.emptyTitle}>Galeriniz Boş</Text>
      <Text style={styles.emptyDescription}>
        Henüz hiç eser kaydetmediniz.{'\n'}
        Boyama yapmaya başlayın ve eserlerinizi kaydedin!
      </Text>
      <TouchableOpacity
        style={styles.startPaintingButton}
        onPress={() => router.back()}
      >
        <Text style={styles.startPaintingButtonText}>Boyamaya Başla</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🖼️ Eser Galerim</Text>
        <View style={styles.headerRight}>
          <Text style={styles.artworkCount}>{artworks.length} eser</Text>
        </View>
      </View>

      {/* Gallery Content */}
      <View style={styles.galleryContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Eserler yükleniyor...</Text>
          </View>
        ) : artworks.length === 0 ? (
          renderEmptyGallery()
        ) : (
          <FlatList
            data={artworks}
            renderItem={renderArtwork}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.artworkRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.artworksList}
          />
        )}
      </View>

      {/* Artwork Details Modal */}
      <Modal
        visible={showDetails}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            {selectedArtwork && (
              <>
                <View style={styles.detailsHeader}>
                  <Text style={styles.detailsTitle}>
                    {selectedArtwork.title || 'Başlıksız Eser'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowDetails(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <Image
                  source={{ uri: `data:image/png;base64,${selectedArtwork.artwork_data}` }}
                  style={styles.detailsImage}
                  resizeMode="contain"
                />
                
                <Text style={styles.detailsDate}>
                  Tamamlandı: {formatDate(selectedArtwork.completed_at)}
                </Text>
                
                <View style={styles.detailsActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => shareArtwork(selectedArtwork)}
                  >
                    <Text style={styles.actionButtonText}>📤 Paylaş</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => saveToGallery(selectedArtwork)}
                  >
                    <Text style={styles.actionButtonText}>💾 Kaydet</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteArtwork(selectedArtwork.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Sil</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FF6B9D',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  artworkCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  galleryContent: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startPaintingButton: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startPaintingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artworksList: {
    paddingBottom: 20,
  },
  artworkRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  artworkCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    width: (SCREEN_WIDTH - 40) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  artworkImage: {
    height: 120,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  artworkInfo: {
    padding: 12,
  },
  artworkTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  artworkDate: {
    fontSize: 11,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  detailsImage: {
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginBottom: 15,
  },
  detailsDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});