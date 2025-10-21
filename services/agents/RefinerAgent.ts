// services/agents/RefinerAgent.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerateContentResult, SafetySetting } from "@google/generative-ai";
import { REFINER_AI_PROMPT } from '../../lib/refiner_prompt';
import { Agent, AgentStreamEvent, AgentStatus } from '../../types/AgentTypes';
import { setTimeout as setTimeoutPromise } from 'timers/promises';

export class RefinerAgent implements Agent {
  readonly name = 'refiner';
  readonly description = 'Arbiter\'ın çıktısını rafine eden ve daha insani hale getiren agent';
  
  private genAI: GoogleGenerativeAI;
  private safetySettings: SafetySetting[];
  private primaryModelName = process.env.DEFAULT_AGENT_MODEL || "gemini-2.5-pro";
  private fallbackModelName = "gemini-2.5-flash";

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    
    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];
    // Model oluşturma işlemini execute içinde dinamik olarak yapacağız
  }

  async *execute(input: Record<string, unknown>): AsyncIterable<AgentStreamEvent> {
    const startTime = Date.now();
    
    try {
      // Başlangıç durumu
      yield {
        source: 'refiner',
        type: 'status',
        payload: { 
          status: AgentStatus.RUNNING, 
          message: 'RefinerAI analizi başlatılıyor...' 
        },
        timestamp: Date.now()
      };

      // Düşünce süreci
      yield {
        source: 'refiner',
        type: 'thought',
        payload: { 
          message: 'Analiz rafine ediliyor...' 
        },
        timestamp: Date.now()
      };

      // Input'u doğru tipte cast et
      const { initialAnalysis } = input as { initialAnalysis: string };
      
      // --- FALLBACK MANTIĞI ---
      const modelsToTry = [this.primaryModelName, this.fallbackModelName];
      let refinerResult: GenerateContentResult | null = null;

      for (const modelName of modelsToTry) {
        // Model deneme mesajını kaldırdık - performans için

        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: REFINER_AI_PROMPT,
          safetySettings: this.safetySettings
        });

        const MAX_RETRIES = 2;
        let attempt = 0;
        
        while (attempt < MAX_RETRIES) {
          try {
            refinerResult = await model.generateContent(initialAnalysis);
            break;
          } catch (error: unknown) {
            attempt++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            if ((errorMessage.includes('503') || errorMessage.includes('overloaded')) && attempt < MAX_RETRIES) {
              const delay = Math.pow(2, attempt) * 1000;
              yield {
                source: 'refiner',
                type: 'thought',
                payload: { 
                  message: `Model (${modelName.split('/').pop()?.replace('gemini-', '') || modelName}) meşgul. ${delay / 1000}s sonra yeniden deneniyor... (${attempt}/${MAX_RETRIES})` 
                },
                timestamp: Date.now()
              };
              await setTimeoutPromise(delay);
            } else {
              console.error(`Refiner Modeli (${modelName}) ile kalıcı hata:`, errorMessage);
              refinerResult = null;
              break;
            }
          }
        }
        
        if (refinerResult) {
          // Başarı mesajını kaldırdık - performans için
          break;
        }
      }
      
      if (!refinerResult) {
        throw new Error("Tüm denemelere rağmen RefinerAI modeline ulaşılamadı. Lütfen daha sonra tekrar deneyin.");
      }
      // --- FALLBACK MANTIĞI SONU ---
      
      // Response kontrolü
      const response = refinerResult.response;
      
      // Safety check
      if (response.promptFeedback?.blockReason) {
        throw new Error(`RefinerAI cevabı engellenmiş: ${response.promptFeedback.blockReason}`);
      }

      // Candidates kontrolü
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("RefinerAI hiçbir cevap adayı üretmedi.");
      }

      // Finish reason kontrolü
      const finishReason = response.candidates[0]?.finishReason;
      
      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        throw new Error(`RefinerAI beklenmedik şekilde durdu: ${finishReason}`);
      }
      
      // Text çıkarma
      let refinedAnalysis: string = '';
      
      try {
        refinedAnalysis = response.text();
      } catch (error) {
        console.error("Refiner - Text extraction error:", error);
        throw new Error(`RefinerAI cevabı alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      }

      if (!refinedAnalysis || refinedAnalysis.trim().length === 0) {
        throw new Error("RefinerAI boş bir cevap döndürdü.");
      }

      // Streaming kaldırıldı - performans için tüm analizi tek seferde gönder
      yield {
        source: 'refiner',
        type: 'final_chunk',
        payload: { 
          chunk: refinedAnalysis,
          progress: 100
        },
        timestamp: Date.now()
      };

      // Tamamlanma durumu
      yield {
        source: 'refiner',
        type: 'status',
        payload: { 
          status: AgentStatus.COMPLETED, 
          message: 'RefinerAI analizi tamamlandı',
          duration: Date.now() - startTime,
          fullAnalysis: refinedAnalysis
        },
        timestamp: Date.now()
      };

    } catch (error) {
      console.error("RefinerAgent Hatası:", error);
      
      yield {
        source: 'refiner',
        type: 'error',
        payload: { 
          error: error instanceof Error ? error.message : String(error),
          message: 'RefinerAI analizi sırasında hata oluştu'
        },
        timestamp: Date.now()
      };
    }
  }
}
