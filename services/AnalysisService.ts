// services/AnalysisService.ts

import { ChiefArchitectAgent } from './agents/ChiefArchitectAgent';
import { PromptBuilder } from './PromptBuilder';
import { UploadedFile } from '../types/FileTypes';
import { AgentStreamEvent } from '../types/AgentTypes';
import { Content } from '@google/generative-ai';

export interface AnalysisRequest {
  task?: string;
  files: UploadedFile[];
  history?: Content[];
  analysisType?: 'full' | 'security' | 'performance' | 'structure' | 'custom';
}

export class AnalysisService {
  private architect: ChiefArchitectAgent;

  constructor() {
    // API anahtarı burada, merkezi ve güvenli bir şekilde ajana enjekte edilir.
    // Bu, konfigürasyon yönetimini kolaylaştırır.
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }
    this.architect = new ChiefArchitectAgent(apiKey);
  }

  /**
   * Kod tabanı analizini gerçekleştirir ve stream event'leri döndürür
   * @param request Analiz isteği (task, files, history, analysisType)
   * @returns AsyncIterable<AgentStreamEvent> Stream event'leri
   */
  async *performAnalysis(request: AnalysisRequest): AsyncIterable<AgentStreamEvent> {
    const { task, files, history = [], analysisType = 'full' } = request;

    try {
      // 1. Prompt'u oluşturma sorumluluğu delege edilir.
      const promptBuilder = new PromptBuilder();
      const fullPrompt = promptBuilder.build(task, files, analysisType);

      // 2. Hangi ajanın kullanılacağına karar verilir (Gelecekte burası genişletilebilir).
      // MVP'de sadece ChiefArchitectAgent kullanılıyor.
      
      // 3. Ajan yürütülür ve stream event'leri yield edilir.
      yield* this.architect.execute({ task: fullPrompt, history });

    } catch (error) {
      // Hata durumunda stream event'i oluştur
      yield {
        source: 'orchestrator',
        type: 'error',
        payload: {
          error: error instanceof Error ? error.message : String(error),
          message: 'Analiz sırasında hata oluştu'
        },
        timestamp: Date.now()
      };
    }
  }
}

