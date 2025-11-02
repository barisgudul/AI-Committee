// services/OrchestratorService.ts

import { ArbiterAgent } from './agents/ArbiterAgent';
import { RefinerAgent } from './agents/RefinerAgent';
import { AgentStreamEvent, AgentStatus } from '../../types/AgentTypes';
import { Content } from "@google/generative-ai";

export class OrchestratorService {
  private arbiterAgent: ArbiterAgent;
  private refinerAgent: RefinerAgent;

  constructor() {
    this.arbiterAgent = new ArbiterAgent();
    this.refinerAgent = new RefinerAgent();
  }

  /**
   * Ana orkestrasyon fonksiyonu - Agent'ları yönetir ve stream'leri birleştirir
   */
  async *run(task: string, history: Content[]): AsyncIterable<AgentStreamEvent> {
    const startTime = Date.now();
    
    try {
      // Orkestratör başlangıç durumu
      yield {
        source: 'orchestrator',
        type: 'status',
        payload: { 
          status: AgentStatus.RUNNING, 
          message: 'Orkestratör başlatılıyor, görev analiz ediliyor...' 
        },
        timestamp: Date.now()
      };

      // Hafıza optimizasyonu - son 10 mesajı al
      const recentHistory = history.slice(-10);

      // Arbiter'ı başlat (VisionaryDev + LazyDev + CriticalDev analizlerini yapar)
      const arbiterStream = this.arbiterAgent.execute({ task, history: recentHistory });
      
      let arbiterAnalysis: string | null = null;
      let arbiterCompleted = false;
      
      // Arbiter stream'ini işle
      for await (const event of arbiterStream) {
        // Hata kontrolü
        if (event.type === 'error') {
          console.error(`Orchestrator: Agent '${event.source}' reported an error. Halting execution.`);
          yield event;
          return;
        }

        // Arbiter tamamlanma durumunu yakala
        if (event.source === 'arbiter' && event.type === 'status' && event.payload.status === AgentStatus.COMPLETED) {
          arbiterAnalysis = (event.payload as {fullAnalysis?: string}).fullAnalysis || null;
          arbiterCompleted = true;
        }
        
        // Tüm event'leri (status, tool_call, thought, final_chunk vb.) doğrudan ilet
        yield event;
      }

      // Arbiter analizi başarısız olduysa
      if (!arbiterCompleted || !arbiterAnalysis) {
        throw new Error('ArbiterAI analizi tamamlanamadı veya boş cevap döndü.');
      }

      // Refiner'ı başlat (Arbiter tamamlandıktan sonra)
      // Mesaj kaldırıldı - performans için

      // Refiner için Arbiter'ın analizini gönder
      const refinerStream = this.refinerAgent.execute({ initialAnalysis: arbiterAnalysis });
      
      // Refiner stream'ini işle
      for await (const event of refinerStream) {
        // Refiner'dan gelen hataları da yakala
        if (event.type === 'error') {
          console.error(`Orchestrator: Agent '${event.source}' reported an error. Halting execution.`);
          yield event; // Hata olayını olduğu gibi frontend'e gönder
          return;      // Fonksiyondan tamamen çıkarak işlemi bitir.
        }
        yield event;
      }

      // Orkestratör tamamlanma durumu
      yield {
        source: 'orchestrator',
        type: 'status',
        payload: { 
          status: AgentStatus.COMPLETED, 
          message: 'Tüm analiz süreci tamamlandı',
          totalDuration: Date.now() - startTime
        },
        timestamp: Date.now()
      };

    } catch (error) {
      console.error("OrchestratorService Hatası:", error);
      
      yield {
        source: 'orchestrator',
        type: 'error',
        payload: { 
          error: error instanceof Error ? error.message : String(error),
          message: 'Orkestrasyon sırasında hata oluştu'
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * Paralel çalıştırma için gelecekteki optimizasyon
   * Şu an için seri çalışır, Faz 4'te paralel hale getirilecek
   */
  async *runParallel(task: string, history: Content[]): AsyncIterable<AgentStreamEvent> {
    // Bu fonksiyon Faz 4'te implement edilecek
    // Şimdilik seri versiyonu kullan
    yield* this.run(task, history);
  }
}
