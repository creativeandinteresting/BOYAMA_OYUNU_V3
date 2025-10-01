import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert
} from 'react-native';
import { Svg, SvgXml } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ColoringPage {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  svg_content: string;
  thumbnail?: string;
}

const categories = [
  { key: 'all', name: 'Tümü', icon: '🎨' },
  { key: 'animals', name: 'Hayvanlar', icon: '🐱' },
  { key: 'vehicles', name: 'Taşıtlar', icon: '🚗' },
  { key: 'nature', name: 'Doğa', icon: '🌸' }
];

export default function HomeScreen() {
  const [coloringPages, setColoringPages] = useState<ColoringPage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    loadColoringPages();
  }, [selectedCategory]);

  const initializeApp = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/initialize-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      console.log('Initialization result:', result);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const loadColoringPages = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' 
        ? `${EXPO_PUBLIC_BACKEND_URL}/api/coloring-pages`
        : `${EXPO_PUBLIC_BACKEND_URL}/api/coloring-pages?category=${selectedCategory}`;
      
      const response = await fetch(url);
      const pages = await response.json();
      setColoringPages(pages);
    } catch (error) {
      console.error('Failed to load coloring pages:', error);
      Alert.alert('Hata', 'Boyama sayfaları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = (page: ColoringPage) => {
    router.push({
      pathname: '/coloring',
      params: { pageId: page.id, pageName: page.name }
    });
  };

  const renderColoringPage = ({ item }: { item: ColoringPage }) => (
    <TouchableOpacity
      style={styles.pageCard}
      onPress={() => handlePageSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.pagePreview}>
        <SvgXml
          xml={item.svg_content}
          width="100%"
          height="100%"
        />
      </View>
      <View style={styles.pageInfo}>
        <Text style={styles.pageName}>{item.name}</Text>
        <Text style={styles.pageCategory}>
          {categories.find(cat => cat.key === item.category)?.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.key && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(item.key)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.key && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Boyama Oyunu</Text>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => router.push('/gallery')}
        >
          <Text style={styles.galleryButtonText}>📱 Galerim</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Coloring Pages */}
      <View style={styles.pagesSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Boyama sayfaları yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={coloringPages}
            renderItem={renderColoringPage}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.pageRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pagesList}
          />
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FF6B9D',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  galleryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  galleryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    paddingVertical: 15,
  },
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  selectedCategoryButton: {
    backgroundColor: '#FF6B9D',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
  },
  pagesSection: {
    flex: 1,
    paddingHorizontal: 10,
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
  pagesList: {
    paddingBottom: 20,
  },
  pageRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  pageCard: {
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
  pagePreview: {
    height: 120,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 10,
  },
  pageInfo: {
    padding: 12,
  },
  pageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pageCategory: {
    fontSize: 12,
    color: '#888',
  }
});