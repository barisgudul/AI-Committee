// pages/api/analyze-codebase.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { OrchestratorService } from '../../services/OrchestratorService';
import { Content } from "@google/generative-ai";
import { UploadedFile, formatFileSize } from '../../types/FileTypes';
import { fileStorage } from './upload-files';

// Debug: FileStorage kontrolü (module load zamanında)
console.log('[ANALYZE-API-INIT] fileStorage reference check:', fileStorage);
console.log('[ANALYZE-API-INIT] fileStorage size on import:', fileStorage.size);

/**
 * Dosyaları analiz için prompt oluştur
 */
function createCodebaseAnalysisPrompt(
  files: UploadedFile[], 
  task?: string,
  analysisType: 'full' | 'security' | 'performance' | 'structure' | 'custom' = 'full'
): string {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    // Check if API key is set
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY environment variable is not set' });
    }
    
    // Request body'den parametreleri al
    const { 
      sessionId, 
      analysisType = 'full',
      task,
      history = []
    }: { 
      sessionId: string; 
      analysisType?: 'full' | 'security' | 'performance' | 'structure' | 'custom';
      task?: string;
      history?: Content[];
    } = req.body;
    
    // Debug: SessionId kontrolü
    console.log('[ANALYZE-API] Received sessionId:', sessionId);
    console.log('[ANALYZE-API] fileStorage keys:', Array.from(fileStorage.keys()));
    console.log('[ANALYZE-API] fileStorage size:', fileStorage.size);
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID gereklidir' });
    }
    
    // Session'dan dosyaları al
    const files = fileStorage.get(sessionId);
    
    console.log('[ANALYZE-API] Files found for session:', files ? files.length : 0);
    
    if (!files || files.length === 0) {
      // Debug: Tüm session'ları göster
      const allSessions = Array.from(fileStorage.entries()).map(([id, files]) => ({
        id,
        fileCount: files.length
      }));
      console.log('[ANALYZE-API] Available sessions:', allSessions);
      
      return res.status(400).json({ 
        error: 'Bu session için dosya bulunamadı',
        message: `Session ID: ${sessionId}. Lütfen önce dosyaları yükleyin.`,
        debug: {
          requestedSessionId: sessionId,
          availableSessions: allSessions.map(s => s.id),
          storageSize: fileStorage.size
        }
      });
    }
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    // Analiz prompt'u oluştur
    const analysisPrompt = createCodebaseAnalysisPrompt(files, task, analysisType);
    
    // OrchestratorService'i başlat
    const orchestrator = new OrchestratorService();
    
    try {
      // Stream başlangıç sinyali
      res.write('data: {"type":"stream_start"}\n\n');
      
      // Orchestrator'ı çalıştır ve event'leri stream et
      for await (const event of orchestrator.run(analysisPrompt, history)) {
        const eventData = `data: ${JSON.stringify(event)}\n\n`;
        res.write(eventData);
      }
      
      // Stream bitiş sinyali
      res.write('data: {"type":"stream_end"}\n\n');
      
    } catch (streamError) {
      console.error("Stream Hatası:", streamError);
      const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
      const errorData = `data: ${JSON.stringify({
        source: 'orchestrator',
        type: 'error',
        payload: { 
          error: errorMessage,
          message: 'Kod analizi sırasında hata oluştu'
        },
        timestamp: Date.now()
      })}\n\n`;
      res.write(errorData);
    } finally {
      res.end();
    }
    
  } catch (error: unknown) {
    console.error("API Handler Hatası:", error);
    
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : 'Sunucuda bilinmeyen bir hata oluştu.';
      res.status(500).json({ error: errorMessage });
    } else {
      res.end();
    }
  }
}

