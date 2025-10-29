# 📁 Kod Klasörü Analizi - Kullanım Kılavuzu

## ✨ Özellikler

Bu sistem size aşağıdakileri sağlar:

### 1. **Sürükle-Bırak Yükleme**
- Kod klasörlerini doğrudan arayüze sürükleyip bırakın
- Tek dosyaları da yükleyebilirsiniz
- Tüm klasör yapısı korunur
- **Node_modules, venv, .git vb. otomatik olarak atlanır** ⏭️

### 2. **Otomatik Filtreleme**
- `node_modules`, `venv`, `.git` gibi çalışma klasörleri atlanır
- Build çıktıları (`dist`, `build`, `.next`) görmezden gelinir
- IDE config'leri (`.vscode`, `.idea`) filtrele
- OS dosyaları (`.DS_Store`, `Thumbs.db`) hariç tutulur
- **Duplicate dosyalar filtrele** - aynı dosya 2+ kez seçilirse tek kez yüklenir

### 3. **Dosya Yönetimi**
- Yüklenen dosyaların listesini görün
- Her dosyaya ayrı ayrı tıklayarak içeriğini görüntüleyin
- Unwanted dosyaları silin
- Tüm dosyaları temizleyin

### 4. **Kod Görüntüleme**
- Syntax highlighting ile kod incelemesi
- Satır numaraları
- Dosya bilgileri (boyut, dil, yol)
- Tek tuşla kopyalama

### 5. **AI Analizi**
- Tüm dosyaları AI'ya gönderin
- Real-time streaming analizi
- Detaylı kod incelemesi
- İyileştirme önerileri

## 🚀 Nasıl Kullanılır?

### Adım 1: Tüm Proje Klasörünü Yükle
1. Ana sayfada **"📁 Kod Klasörü Analizi"** kartına tıklayın
2. **"Klasör Seç"** butonuna tıklayın
3. Projenizin **ana klasörünü** seçin (tüm proje otomatik yüklenecek)
4. Sistem gereksiz klasörleri atlarken işlemi tamamlayacak

**Alternatif**: Klasörü doğrudan modal'ın üzerine sürükleyip bırakın

### Adım 2: Otomatik Filtreleme
- ✅ `node_modules/` → Atlandı
- ✅ `venv/`, `.venv/`, `env/` → Atlandı
- ✅ `.git/` → Atlandı
- ✅ `dist/`, `build/`, `.next/` → Atlandı
- ✅ `__pycache__/`, `.pytest_cache/` → Atlandı
- ✅ `.vscode/`, `.idea/` → Atlandı

### Adım 3: Dosya İnceleme
1. Yüklenen dosyaların listesini göreceksiniz
2. Dosyaya tıklatarak içeriğini görüntüleyin
3. İsterseniz dosyaları silin (sağ üstteki X)

### Adım 4: Analiz
1. **"🔍 Analiz Et"** butonuna tıklayın
2. AI size kodunuzu analiz eder
3. Sonuçları chat'te görüntüleyin

## 🎯 Hangi Klasörler Otomatik Atlanır?

### Node.js Projeler
- `node_modules/` - Package dependencies
- `npm-debug.log`
- `yarn-error.log`
- `.pnpm-store/`

### Python Projeler
- `venv/`, `env/`, `.venv/` - Virtual environments
- `__pycache__/` - Python cache
- `.pytest_cache/` - Test cache
- `.egg-info/` - Egg metadata
- `*.egg` - Egg files

### Build & Çıktılar
- `dist/`, `build/`, `out/` - Derlenmiş dosyalar
- `.next/` - Next.js output
- `.nuxt/` - Nuxt output
- `.cache/` - Cache files
- `coverage/` - Test coverage

### Git & IDE
- `.git/` - Git repository
- `.vscode/`, `.idea/` - IDE config'leri
- `.DS_Store` - macOS metadata
- `Thumbs.db` - Windows metadata

### Diğer
- `pnpm-lock.yaml`, `yarn.lock` - Lock files (content checked)
- `.gitignore` - Git config
- `*.swp`, `*.swo` - Vim swap files

## 📊 Desteklenen Dosya Türleri

### Programlama Dilleri
- **JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`
- **Python**: `.py`, `.pyw`, `.pyx`
- **Java**: `.java`
- **Go**: `.go`
- **Rust**: `.rs`
- **C/C++**: `.c`, `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp`
- **C#**: `.cs`
- **Ruby**: `.rb`
- **PHP**: `.php`
- **Swift**: `.swift`
- **Kotlin**: `.kt`
- **Dart**: `.dart`
- **Scala**: `.scala`
- **R**: `.r`, `.R`
- **Lua**: `.lua`

### Web & Stil
- **HTML/CSS**: `.html`, `.css`, `.scss`, `.sass`, `.less`
- **Markdown**: `.md`, `.markdown`, `.mdx`

### Veri Formatları
- **JSON**: `.json`, `.json5`
- **XML**: `.xml`
- **YAML**: `.yaml`, `.yml`
- **TOML**: `.toml`
- **GraphQL**: `.graphql`
- **SQL**: `.sql`
- **Protobuf**: `.proto`

### Konfigürasyon Dosyaları
- `package.json`, `tsconfig.json`, `webpack.config.js`
- `.gitignore`, `.env`, `.env.local`
- `.eslintrc`, `.prettierrc`, `.babelrc`
- `Dockerfile`, `docker-compose.yml`
- `Makefile`, `.npmrc`, `.nvmrc`

### Diğer
- **Shell Scripts**: `.sh`, `.bash`, `.zsh`, `.fish`
- **Metin**: `.txt`, `.text`

## ⚠️ Sınırlamalar

- **Maksimum dosya boyutu**: 5MB/dosya
- **Maksimum toplam boyut**: 50MB
- **Maksimum dosya sayısı**: 100 dosya
- **Otomatik temizleme**: 1 saat sonra

## 🔧 Sorun Giderme

### "Klasördeki dosyaların çoğu okunamamadı" Mesajı
- **Sebep**: Tarayıcı File System Access API kısıtlaması
- **Çözüm**:
  - ✅ **Option 1**: Tarayıcı sekmesini yenileyin ve yeniden deneyin
  - ✅ **Option 2**: Root klasör yerine `src/`, `app/` gibi alt klasör seçin
  - ✅ **Option 3**: Birkaç dosyayı individual olarak seçin (Ctrl+Click)
  - ℹ️ Bu sorun tarayıcıya göre değişebilir (Chrome/Safari/Firefox)

### "Seçtiğiniz klasör sadece çalışma klasörleri içeriyor" Mesajı
- **Sebep**: Seçilen klasör yalnızca `node_modules`, `venv`, `.git` gibi ignored klasörler içeriyor
- **Çözüm**: 
  - Kod dosyaları da içeren bir klasör seçin
  - Örn: `src/`, `app/`, projenin root klasörü
  - Karışık klasörler (src + node_modules) iyidir, sistem kodları filtreler

### "Hiçbir uyumlu dosya bulunamadı" Hatası
- **Sebep**: Binary dosyaları veya desteklenmeyen türleri içeren klasör
- **Çözüm**: 
  - Kod dosyaları içeren bir klasör seçin
  - Proje klasörünü seçmek en iyisidir
  - System otomatik olarak ignored klasörleri filtreler

### "Dosya çok büyük" Hatası
- **Çözüm**: 5MB'den küçük dosyalar yükleyin
- Büyük dosyaları parçalayın veya silin

### "Sunucuya gönderilirken hata" 
- **Çözüm**: 
  - Tarayıcınızı yenileyin
  - Network bağlantısını kontrol edin
  - Daha az dosya yüklemeyi deneyin

## 💡 İpuçları

1. **Optimal Deneyim**: 10-50 kod dosyası
2. **Proje Analizi**: Tüm proje klasörünü direkt yükleyin, sistem kendisi filtreler
3. **Hızlı İşlem**: Önce küçük bir proje deneyin
4. **Config Dosyaları**: `package.json`, `tsconfig.json` vb. otomatik dahil

## 📋 Örnek Yükleme Senaryoları

### Senaryo 1: React Projesi
```
my-react-app/
├── src/              ✅ (içindeki tüm dosyalar yüklenir)
├── public/           ✅ (yüklenir)
├── package.json      ✅ (yüklenir)
├── tsconfig.json     ✅ (yüklenir)
├── node_modules/     ❌ (atlanır)
└── .next/            ❌ (atlanır)

Sonuç: ~20 dosya yüklenir
```

### Senaryo 2: Python Projesi
```
my-python-app/
├── src/              ✅ (içindeki tüm .py dosyaları)
├── tests/            ✅ (yüklenir)
├── requirements.txt  ✅ (yüklenir)
├── venv/             ❌ (atlanır)
├── __pycache__/      ❌ (atlanır)
└── .git/             ❌ (atlanır)

Sonuç: ~15 dosya yüklenir
```

## 🎯 Analiz Çıktısı

AI size sunacak şeyler:
- ✅ Kod kalitesi analizi
- ✅ Güvenlik açıkları tespiti
- ✅ Performans önerileri
- ✅ Mimari ve yapı değerlendirmesi
- ✅ Eksikliklerin belirlenmesi
- ✅ Adım adım iyileştirme planı

---

**Sonraki Adımlar**: Analiz sonuçlarını inceleyip önerileri kodunuza uygulayın! 🚀
