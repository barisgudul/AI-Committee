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
    const fileList = files.map(f => 
      `- **${f.path}** (${f.type}, ${formatFileSize(f.size)})`
    ).join('\n');
    
    // Token limiti yok - TÜM dosyalar detaylı inceleniyor
    // Her dosyanın tam içeriği prompt'a dahil edilecek
    const fileContents = files.map(f => 
      `\`\`\`${f.language || 'text'}:${f.path}\n${f.content}\n\`\`\``
    ).join('\n\n');
    
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

