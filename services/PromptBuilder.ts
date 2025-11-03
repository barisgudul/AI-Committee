// services/PromptBuilder.ts

import { UploadedFile, formatFileSize } from '../types/FileTypes';

export type AnalysisType = 'full' | 'security' | 'performance' | 'structure' | 'custom';

export class PromptBuilder {
  /**
   * Kod tabanı analizi için zengin prompt oluşturur
   * @param task Ana analiz görevi (opsiyonel)
   * @param files Yüklenen dosyalar
   * @param analysisType Analiz tipi (varsayılan: 'full')
   * @returns Oluşturulmuş prompt metni
   */
  build(task: string | undefined, files: UploadedFile[], analysisType: AnalysisType = 'full'): string {
    // --- Agresif boyut sınırları (Gemini 1M token limit + system prompt + history için güvenli) ---
    // Not: System prompt + history + prompt metni ≈ 50-100k token olabilir
    // Dosya içerikleri için ~150-200k token bırakıyoruz (≈ 80-120k karakter)
    const MAX_TOTAL_CHARS = 120_000; // toplam içerik karakteri (~30k token dosya içerikleri)
    const MAX_FILES = 40;            // içerik eklenen maksimum dosya sayısı
    const PER_FILE_MAX = 3_000;      // her dosya için maksimum karakter
    const MAX_FILE_SIZE = 50_000;    // 50KB üzeri dosyaları tamamen hariç bırak

    // Küçük ve orta boyutlu dosyaları öncele: boyuta göre artan sırala
    // Çok büyük dosyaları (50KB+) filtrelenmiş dosyalar listesine ekle
    const smallToMediumFiles = files.filter(f => f.size <= MAX_FILE_SIZE);
    const largeFiles = files.filter(f => f.size > MAX_FILE_SIZE);
    const sortedFiles = [...smallToMediumFiles].sort((a, b) => a.size - b.size);

    // Dosya listesi (tam liste) - UI için tüm dosyaları gösteriyoruz
    const fileList = files.map(f => 
      `- **${f.path}** (${f.type}, ${formatFileSize(f.size)})`
    ).join('\n');

    // İçerik dahil edilecek dosyaları kademeli topla
    const includedContents: string[] = [];
    const includedMeta: Array<{ path: string; language: string }> = [];
    const excludedMeta: Array<{ path: string; reason: string }> = [];
    let totalChars = 0;

    // Büyük dosyaları excluded listesine ekle
    for (const f of largeFiles) {
      excludedMeta.push({ path: f.path, reason: `file_too_large_${formatFileSize(f.size)}` });
    }

    for (const f of sortedFiles) {
      if (includedMeta.length >= MAX_FILES) {
        excludedMeta.push({ path: f.path, reason: 'max_files' });
        continue;
      }
      const raw = f.content || '';
      const clipped = raw.length > PER_FILE_MAX ? raw.slice(0, PER_FILE_MAX) + '\n\n... [içerik kısaltıldı]' : raw;
      const projected = totalChars + clipped.length + f.path.length + 64; // kaba başlık/fence payı
      if (projected > MAX_TOTAL_CHARS) {
        excludedMeta.push({ path: f.path, reason: 'total_limit' });
        continue;
      }
      includedContents.push(`\n\n\`\`\`${f.language || 'text'}:${f.path}\n${clipped}\n\`\`\``);
      includedMeta.push({ path: f.path, language: f.language || 'text' });
      totalChars = projected;
    }

    const fileContents = includedContents.join('');
    
    const analysisInstructions = {
      full: `Bu kod tabanını kapsamlı bir şekilde incele ve şunları değerlendir:
- **Kod Kalitesi**: Clean code prensipleri, okunabilirlik, maintainability
- **Mimari ve Yapı**: Klasör organizasyonu, modülerlik, separation of concerns
- **Güvenlik**: Potansiyel güvenlik açıkları, best practices
- **Performans**: Optimizasyon fırsatları, potansiyel bottleneck'ler
- **Eksiklikler**: Eksik özellikler, test coverage, dokümantasyon
- **İyileştirme Önerileri**: Öncelikli aksiyonlar ve uygulanabilir öneriler`,
      
      security: `Bu kod tabanında güvenlik açıklarını ve riskleri tespit et:
- SQL Injection, XSS, CSRF gibi yaygın güvenlik açıkları
- Hassas veri yönetimi (şifreler, API keys, tokens)
- Authentication ve authorization sorunları
- Input validation ve sanitization eksiklikleri
- Dependency güvenlik riskleri
- En kritik güvenlik sorunlarını önceliklendir`,
      
      performance: `Bu kod tabanının performans analizi:
- Potansiyel performans sorunları ve bottleneck'ler
- Algoritma karmaşıklığı (Big O) analizi
- Memory leak riskleri
- Database query optimizasyonları
- Network request optimizasyonları
- Caching stratejileri
- Öncelikli optimizasyon önerileri`,
      
      structure: `Bu kod tabanının mimari ve yapısal analizi:
- Proje organizasyonu ve klasör yapısı
- Design patterns kullanımı
- Modülerlik ve coupling analizi
- Code reusability ve DRY prensipleri
- Separation of concerns
- Scalability değerlendirmesi
- Refactoring önerileri`,
      
      custom: task || 'Genel kod analizi yap'
    };
    
    return `# Kod Tabanı Analiz Talebi

## Yüklenen Dosyalar (${files.length} dosya)

${fileList}

## Dosya İçerikleri

${fileContents}

${excludedMeta.length > 0 ? `\n\n> ⚠️ **Önemli Not**: ${excludedMeta.length} dosya token limiti nedeniyle içerik olarak dahil edilmedi (sadece dosya listesinde görünüyor). Bu dosyalar: ${excludedMeta.slice(0, 10).map(e => e.path.split('/').pop()).join(', ')}${excludedMeta.length > 10 ? ` ve ${excludedMeta.length - 10} dosya daha` : ''}. Analiz için en önemli dosyalara odaklanın.` : ''}

## Analiz Talebi

${analysisInstructions[analysisType]}

${task ? `\n### Ek Görev\n${task}` : ''}

## Beklenen Çıktı

Lütfen yukarıdaki kod tabanını incele ve:
1. **Nihai Değerlendirme**: Genel durum özeti
2. **Detaylı Analiz**: Her kategoride bulgular
3. **Öncelikli Aksiyonlar**: İlk yapılması gerekenler
4. **Uygulama Planı**: Adım adım iyileştirme planı

**NOT**: Kod içeriğini tekrar yazma, sadece analiz et ve önerilerde bulun.`;
  }
}

