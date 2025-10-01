# 📱 Play Store Deployment Guide

Bu guide, Çocuk Boyama Oyunu uygulamasını Google Play Store'a yüklemek için gereken adımları açıklar.

## 🔧 Gereksinimler

### Hesaplar ve Kayıtlar
- [ ] Google Play Console hesabı ($25 bir kerelik ücret)
- [ ] Expo hesabı (ücretsiz)
- [ ] Android geliştirici sertifikası

### Teknik Gereksinimler
- [ ] Node.js 18+ 
- [ ] Expo CLI (`npm install -g @expo/cli`)
- [ ] EAS CLI (`npm install -g eas-cli`)

## 📋 Deployment Adımları

### 1. Expo Hesabına Giriş
```bash
npx expo login
```

### 2. EAS Build Kurulumu
```bash
cd frontend
eas login
eas build:configure
```

### 3. Deployment Ready Status ✅
- ✅ Hardcoded URLs removed (external sound URL fixed)
- ✅ Cross-platform compatibility (Web: SVG, Native: Skia)  
- ✅ Environment variables properly configured
- ✅ Backend API fully functional (10/10 endpoints working)
- ✅ Build configurations ready (app.json, eas.json)

### 4. Android Build Oluşturma

#### Production Build (AAB for Play Store)
```bash
eas build --platform android --profile production
```

#### Preview Build (APK for Testing)
```bash
eas build --platform android --profile preview
```

### 4. Build Durumunu Kontrol Etme
```bash
eas build:list
```

## 🎨 Play Store Assets

### App Icons (Gerekli)
- **App Icon**: 512x512px, PNG format
- **Adaptive Icon**: Foreground + Background
- **Feature Graphic**: 1024x500px

### Screenshots (Gerekli)
- **Phone Screenshots**: En az 2 adet, 16:9 veya 9:16 aspect ratio
- **Tablet Screenshots**: 7" ve 10" tablet için

### Store Listing

#### Başlık
```
Çocuk Boyama Oyunu - Eğlenceli Boyama
```

#### Kısa Açıklama (80 karakter)
```
Çocuklar için boyama, sticker ve yaratıcılık oyunu!
```

#### Uzun Açıklama
```
🎨 Çocuğunuzun yaratıcılığını geliştiren boyama oyunu!

✨ ÖZELLİKLER:
🖌️ Kolay boyama sistemi - Parmakla dokunarak boyayın
🌈 18 canlı renk paleti
🎯 3 kategori: Hayvanlar, Taşıtlar, Doğa
🏆 Eser galeriniz - Boyamalarınızı kaydedin
⭐ Eğlenceli sticker'lar
🎵 Ses efektleri
📱 Offline çalışma

🎯 YAŞA UYGUN:
• 6-8 yaş arası çocuklar için özel tasarım
• Orta seviye detaylı çizimler
• Güvenli ve reklamsız

🛡️ GÜVENLİK:
• İnternet bağlantısı gerektirmez
• Kişisel veri toplamaz
• Çocuk dostu arayüz

Çocuğunuzun sanatsal yeteneklerini keşfetsin!

#boyama #çocuk #oyun #eğitim #yaratıcılık #sanat
```

## 🔐 Android Signing

### 1. Keystore Oluşturma
```bash
keytool -genkey -v -keystore boyama-oyunu.keystore \
  -alias boyama-oyunu -keyalg RSA -keysize 2048 \
  -validity 10000
```

### 2. EAS Secrets Ayarlama
```bash
eas secret:create --scope project --name ANDROID_KEYSTORE_PASSWORD --value YOUR_PASSWORD
eas secret:create --scope project --name ANDROID_KEY_PASSWORD --value YOUR_KEY_PASSWORD
```

## 📊 App Store Optimization (ASO)

### Anahtar Kelimeler
- Birincil: boyama, çocuk, oyun
- İkincil: eğitim, yaratıcılık, sanat
- Uzun kuyruk: çocuk boyama oyunu, boyama uygulaması

### Kategori
- **Ana Kategori**: Eğitim
- **Alt Kategori**: Aile

### İçerik Derecelendirmesi
- **Hedef Kitle**: 6-8 yaş arası
- **ESRB**: E for Everyone
- **PEGI**: 3+

## 🚀 Release Strategysi

### 1. Internal Testing (1. hafta)
- EAS build ile APK oluştur
- Aile ve arkadaşlarla test et
- Bug'ları düzelt

### 2. Closed Testing (2. hafta)
- Play Console'da closed testing
- 20-50 test kullanıcısı ekle
- Feedback topla

### 3. Open Testing (3. hafta)
- Sınırlı kullanıcıya açık beta
- Analytics ekle
- Performans optimize et

### 4. Production Release (4. hafta)
- Final build oluştur
- Store listing tamamla
- Release!

## 📈 Post-Release

### Monitoring
- Google Play Console analytics
- Crash reports takibi
- User reviews monitoring
- Rating ve review'lara yanıt

### Updates
- Bug fix releases: Hemen
- Feature updates: Aylık
- Major versions: 3-6 ayda bir

## 🔍 Store Compliance

### Google Play Policies
- [ ] Spam and minimum functionality
- [ ] User data collection disclosure
- [ ] Content rating appropriate
- [ ] Target API level compliance
- [ ] 64-bit support

### Privacy Policy (Gerekli)
```
Bu uygulama:
- Kişisel veri toplamaz
- İnternet bağlantısı gerektirmez
- Reklam içermez
- Çocuklar için güvenlidir
```

## 🛠️ Build Commands Özeti

```bash
# Development build
eas build --platform android --profile development

# Preview build (APK)
eas build --platform android --profile preview

# Production build (AAB)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## 📞 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache
expo r -c
eas build --clear-cache
```

#### Signing Issues
```bash
# Check keystore
keytool -list -keystore boyama-oyunu.keystore
```

#### Upload Issues
- AAB dosyası 150MB'dan küçük olmalı
- Version code artmalı
- Signing certificate tutmalı

## 📝 Checklist

### Pre-Launch
- [ ] All features working
- [ ] No crash issues
- [ ] Performance optimized
- [ ] Icons and assets ready
- [ ] Store listing complete
- [ ] Screenshots captured
- [ ] Privacy policy updated

### Launch Day
- [ ] Final build uploaded
- [ ] Release notes written
- [ ] Social media ready
- [ ] Monitoring setup
- [ ] Support channels ready

---

**🎉 Başarılar! Play Store'da görüşmek üzere!**