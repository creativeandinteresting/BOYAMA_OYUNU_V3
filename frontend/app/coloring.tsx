import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
  PanResponder,
  Modal,
  FlatList,
  TextInput,
  Platform
} from 'react-native';
import { Svg, SvgXml, Circle, Path as SvgPath } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
// Mobile-specific imports removed for web deployment

// For web deployment, we'll use SVG exclusively
// Remove Skia dependency for Kubernetes deployment

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ColoringPage {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  svg_content: string;
}

interface Sticker {
  id: string;
  name: string;
  category: string;
  svg_content: string;
}

const colors = [
  '#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0000FF', '#8800FF',
  '#FF0088', '#00FFFF', '#88FF00', '#FF8888', '#8888FF', '#FFFF88',
  '#FFFFFF', '#CCCCCC', '#888888', '#444444', '#000000', '#8B4513'
];

const brushSizes = [5, 10, 15, 20, 25];

export default function ColoringScreen() {
  const params = useLocalSearchParams();
  const { pageId, pageName } = params;
  const canvasRef = useRef();
  
  const [coloringPage, setColoringPage] = useState<ColoringPage | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [selectedBrushSize, setSelectedBrushSize] = useState(10);
  const [paths, setPaths] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<any>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [placedStickers, setPlacedStickers] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [artworkTitle, setArtworkTitle] = useState('');
  // Sound removed for web deployment
  const [svgPaths, setSvgPaths] = useState<string[]>([]);

  useEffect(() => {
    loadColoringPage();
    loadStickers();
    loadSounds();
  }, []);

  const loadSounds = async () => {
    try {
      // Note: In production, you would include local sound files in assets
      // For now, we'll skip sound loading to avoid external dependencies
      console.log('Sound loading skipped for production build');
    } catch (error) {
      console.log('Sound loading failed:', error);
    }
  };

  const playPaintSound = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Sound play failed:', error);
    }
  };

  const loadColoringPage = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/coloring-pages/${pageId}`);
      const page = await response.json();
      setColoringPage(page);
    } catch (error) {
      console.error('Failed to load coloring page:', error);
      Alert.alert('Hata', 'Boyama sayfası yüklenemedi.');
    }
  };

  const loadStickers = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/stickers`);
      const stickersList = await response.json();
      setStickers(stickersList);
    } catch (error) {
      console.error('Failed to load stickers:', error);
    }
  };

  const createPanResponder = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        // Web platform: use SVG paths
        const pathString = `M${locationX},${locationY}`;
        setCurrentPath({
          pathString,
          color: selectedColor,
          strokeWidth: selectedBrushSize,
        });
        playPaintSound();
      },
      onPanResponderMove: (evt) => {
        if (currentPath) {
          const { locationX, locationY } = evt.nativeEvent;
          
          // Web platform: extend SVG path
          currentPath.pathString += ` L${locationX},${locationY}`;
          setCurrentPath({ ...currentPath });
        }
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          setPaths(prev => [...prev, currentPath]);
          setCurrentPath(null);
        }
      },
    });
  };

  const panResponder = createPanResponder();

  const clearCanvas = () => {
    Alert.alert(
      'Temizle',
      'Tüm boyaları silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Evet', 
          onPress: () => {
            setPaths([]);
            setPlacedStickers([]);
          }
        }
      ]
    );
  };

  const undoLastAction = () => {
    if (paths.length > 0) {
      setPaths(prev => prev.slice(0, -1));
    } else if (placedStickers.length > 0) {
      setPlacedStickers(prev => prev.slice(0, -1));
    }
  };

  const addSticker = (sticker: Sticker, x: number = 100, y: number = 100) => {
    const newSticker = {
      id: Date.now().toString(),
      sticker,
      x,
      y,
      size: 40,
    };
    setPlacedStickers(prev => [...prev, newSticker]);
    setShowStickers(false);
  };

  const saveArtwork = async () => {
    try {
      // Web platform: create a simple base64 image for demo purposes
      let imageData = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';
      
      const artworkData = {
        coloring_page_id: pageId,
        artwork_data: imageData,
        title: artworkTitle || `${pageName} - ${new Date().toLocaleString()}`
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(artworkData)
      });

      if (response.ok) {
        setShowSaveModal(false);
        setArtworkTitle('');
        Alert.alert(
          'Başarılı!', 
          'Eseriniz galerinize kaydedildi!',
          [
            { text: 'Tamam' },
            { text: 'Galeriye Git', onPress: () => router.push('/gallery') }
          ]
        );
      } else {
        Alert.alert('Hata', 'Eser kaydedilemedi.');
      }
    } catch (error) {
      console.error('Failed to save artwork:', error);
      Alert.alert('Hata', 'Eser kaydedilirken bir hata oluştu.');
    }
  };

  const renderSticker = ({ item }: { item: Sticker }) => (
    <TouchableOpacity
      style={styles.stickerItem}
      onPress={() => addSticker(item)}
    >
      <SvgXml xml={item.svg_content} width="40" height="40" />
      <Text style={styles.stickerName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (!coloringPage) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Boyama sayfası yükleniyor...</Text>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.title}>{coloringPage.name}</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => setShowSaveModal(true)}
        >
          <Text style={styles.saveButtonText}>💾</Text>
        </TouchableOpacity>
      </View>

      {/* Color Palette */}
      <View style={styles.colorPalette}>
        <FlatList
          data={colors}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.colorButton,
                { backgroundColor: item },
                selectedColor === item && styles.selectedColorButton
              ]}
              onPress={() => setSelectedColor(item)}
            />
          )}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorList}
        />
      </View>

      {/* Canvas Area */}
      <View style={styles.canvasContainer}>
        <View style={styles.canvasBackground}>
          <SvgXml
            xml={coloringPage.svg_content}
            width="100%"
            height="100%"
          />
        </View>
        
        <View style={styles.canvasOverlay} {...panResponder.panHandlers}>
          {/* Web Canvas using SVG */}
          <Svg height="100%" width="100%" style={styles.canvas}>
            {paths.map((pathData, index) => (
              <SvgPath
                key={index}
                d={pathData.pathString}
                stroke={pathData.color}
                strokeWidth={pathData.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {currentPath && (
              <SvgPath
                d={currentPath.pathString}
                stroke={currentPath.color}
                strokeWidth={currentPath.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
        </View>

        {/* Placed Stickers */}
        {placedStickers.map((stickerData) => (
          <View
            key={stickerData.id}
            style={[
              styles.placedSticker,
              {
                left: stickerData.x,
                top: stickerData.y,
              }
            ]}
          >
            <SvgXml
              xml={stickerData.sticker.svg_content}
              width={stickerData.size}
              height={stickerData.size}
            />
          </View>
        ))}
      </View>

      {/* Tools */}
      <View style={styles.toolbar}>
        {/* Brush Size */}
        <View style={styles.toolGroup}>
          <Text style={styles.toolLabel}>Fırça:</Text>
          <FlatList
            data={brushSizes}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.brushSizeButton,
                  selectedBrushSize === item && styles.selectedBrushButton
                ]}
                onPress={() => setSelectedBrushSize(item)}
              >
                <View
                  style={[
                    styles.brushSizeIndicator,
                    { 
                      width: item / 2 + 8,
                      height: item / 2 + 8,
                      borderRadius: (item / 2 + 8) / 2
                    }
                  ]}
                />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowStickers(true)}
          >
            <Text style={styles.actionButtonText}>🎨</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={undoLastAction}
          >
            <Text style={styles.actionButtonText}>↶</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={clearCanvas}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stickers Modal */}
      <Modal
        visible={showStickers}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStickers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sticker Seç</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStickers(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={stickers}
              renderItem={renderSticker}
              keyExtractor={item => item.id}
              numColumns={4}
              contentContainerStyle={styles.stickerGrid}
            />
          </View>
        </View>
      </Modal>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <Text style={styles.modalTitle}>Eserini Kaydet</Text>
            
            <TextInput
              style={styles.titleInput}
              placeholder="Eser adı (isteğe bağlı)"
              value={artworkTitle}
              onChangeText={setArtworkTitle}
              maxLength={50}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveArtwork}
              >
                <Text style={styles.confirmButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    color: '#666',
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
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 20,
  },
  colorPalette: {
    backgroundColor: 'white',
    paddingVertical: 10,
  },
  colorList: {
    paddingHorizontal: 10,
  },
  colorButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorButton: {
    borderColor: '#333',
    borderWidth: 3,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  canvasBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  canvasOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  canvas: {
    flex: 1,
  },
  placedSticker: {
    position: 'absolute',
  },
  toolbar: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 10,
  },
  brushSizeButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 17.5,
  },
  selectedBrushButton: {
    backgroundColor: '#FFE4E1',
  },
  brushSizeIndicator: {
    backgroundColor: '#FF6B9D',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  stickerGrid: {
    paddingBottom: 20,
  },
  stickerItem: {
    width: (SCREEN_WIDTH * 0.9 - 60) / 4,
    alignItems: 'center',
    padding: 10,
    margin: 5,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
  },
  stickerName: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  saveModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: SCREEN_WIDTH * 0.8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginVertical: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#FF6B9D',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});