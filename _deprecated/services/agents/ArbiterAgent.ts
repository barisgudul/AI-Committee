// services/agents/ArbiterAgent.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, SchemaType, GenerateContentResult, SafetySetting, Tool } from "@google/generative-ai";
import { ARBITER_AI_PROMPT } from '../../../lib/prompts';
import { performSearch, searchCodeExamples } from '../../../services/tools';
import { Agent, AgentStreamEvent, AgentStatus } from '../../../types/AgentTypes';
import { setTimeout as setTimeoutPromise } from 'timers/promises';

export class ArbiterAgent implements Agent {
  readonly name = 'arbiter';
  readonly description = 'İlk analizi yapan ve araç kullanımını yöneten agent';
  
  private genAI: GoogleGenerativeAI;
  private safetySettings: SafetySetting[];
  private toolSettings: Tool[];
  private primaryModelName = "gemini-2.5-pro";
  private fallbackModelName = "gemini-2.5-flash";

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    
    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    this.toolSettings = [{
      functionDeclarations: [
        {
          name: 'performSearch',
          description: 'En güncel teknoloji bilgilerini, kütüphaneleri, API\'ları ve trendleri araştırmak için kullanılır.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              query: {
                type: SchemaType.STRING,
                description: 'Arama yapılacak teknoloji veya konu'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'searchCodeExamples',
          description: 'Belirli teknolojiler için kod örnekleri ve implementasyon detayları arar.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              query: {
                type: SchemaType.STRING,
                description: 'Kod örneği aranacak teknoloji veya konu'
              }
            },
            required: ['query']
          }
        }
      ]
    }];
    // Model oluşturma işlemini execute içinde dinamik olarak yapacağız
  }

  async *execute(input: Record<string, unknown>): AsyncIterable<AgentStreamEvent> {
    const startTime = Date.now();
    
    try {
      // Başlangıç durumu
      yield {
        source: 'arbiter',
        type: 'status',
        payload: { status: AgentStatus.RUNNING, message: 'ArbiterAI analizi başlatılıyor...' },
        timestamp: Date.now()
      };

      // Input'u doğru tipte cast et
      const { task, history } = input as { task: string; history: Content[] };
      
      // Geçmişi ve yeni görevi birleştir
      const chatHistory = [
        ...history,
        { role: 'user' as const, parts: [{ text: task }] }
      ];

      // Düşünce süreci başlıyor
      yield {
        source: 'arbiter',
        type: 'thought',
        payload: { message: 'Görev analiz ediliyor...' },
        timestamp: Date.now()
      };

      // --- FALLBACK MANTIĞI ---
      const modelsToTry = [this.primaryModelName, this.fallbackModelName];
      let arbiterResult: GenerateContentResult | null = null;
      let successfulModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

      for (const modelName of modelsToTry) {
        // Model deneme mesajını kaldırdık - performans için

        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: ARBITER_AI_PROMPT,
          safetySettings: this.safetySettings,
          tools: this.toolSettings
        });

        const MAX_RETRIES = 2;
        let attempt = 0;
        
        while (attempt < MAX_RETRIES) {
          try {
            arbiterResult = await model.generateContent({ contents: chatHistory });
            successfulModel = model;
            break;
          } catch (error: unknown) {
            attempt++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            if ((errorMessage.includes('503') || errorMessage.includes('overloaded')) && attempt < MAX_RETRIES) {
              const delay = Math.pow(2, attempt) * 1000;
              yield {
                source: 'arbiter',
                type: 'thought',
                payload: { 
                  message: `Model (${modelName.split('/').pop()?.replace('gemini-', '') || modelName}) meşgul. ${delay / 1000}s sonra yeniden deneniyor... (${attempt}/${MAX_RETRIES})` 
                },
                timestamp: Date.now()
              };
              await setTimeoutPromise(delay);
            } else {
              console.error(`Arbiter Modeli (${modelName}) ile kalıcı hata:`, errorMessage);
              arbiterResult = null;
              break;
            }
          }
        }
        
        if (arbiterResult && successfulModel) {
          // Başarı mesajını kaldırdık - performans için
          break;
        }
      }
      
      if (!arbiterResult) {
        throw new Error("Tüm denemelere rağmen ArbiterAI modeline ulaşılamadı. Lütfen daha sonra tekrar deneyin.");
      }
      // --- FALLBACK MANTIĞI SONU ---
      
      // Function calling kontrolü
      if (arbiterResult.response.functionCalls && arbiterResult.response.functionCalls.length > 0) {
        // Araç kullanım mesajını kaldırdık - tool_call eventi zaten gösterilecek

        // Function call'ları işle
        const functionCalls = arbiterResult.response.functionCalls();
        const functionResults: Array<{name: string; response: {result: string}}> = [];
        
        for (const functionCall of functionCalls || []) {
          const functionName = functionCall.name;
          const functionArgs = functionCall.args as {query: string};
          
          // Araç çağrısı event'i
          yield {
            source: 'arbiter',
            type: 'tool_call',
            payload: { 
              functionName, 
              args: functionArgs,
              message: `${functionName} çalıştırılıyor...`
            },
            timestamp: Date.now()
          };
          
          let result: string;
          switch (functionName) {
            case 'performSearch':
              result = await performSearch(functionArgs.query);
              break;
            case 'searchCodeExamples':
              result = await searchCodeExamples(functionArgs.query);
              break;
            default:
              result = `Bilinmeyen fonksiyon: ${functionName}`;
          }
          
          // Araç sonucu event'i
          yield {
            source: 'arbiter',
            type: 'tool_result',
            payload: { 
              functionName, 
              result: result.substring(0, 200) + (result.length > 200 ? '...' : ''),
              message: `${functionName} tamamlandı`
            },
            timestamp: Date.now()
          };
          
          functionResults.push({
            name: functionName,
            response: { result }
          });
        }
        
        // Function sonuçlarını modele gönder ve final cevabı al
        const followUpContent: Content[] = [
          ...chatHistory,
          {
            role: 'function',
            parts: functionResults.map(fr => ({
              functionResponse: {
                name: fr.name,
                response: fr.response
              }
            }))
          }
        ];
        
        // İkinci generateContent çağrısı için retry mekanizması (aynı başarılı modeli kullan)
        if (!successfulModel) {
          throw new Error("Başarılı model bulunamadı.");
        }
        
        let attempt = 0;
        const MAX_RETRIES = 2;
        arbiterResult = null;
        
        while (attempt < MAX_RETRIES) {
          try {
            arbiterResult = await successfulModel.generateContent({ contents: followUpContent });
            break;
          } catch (error: unknown) {
            attempt++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            if ((errorMessage.includes('503') || errorMessage.includes('overloaded')) && attempt < MAX_RETRIES) {
              const delay = Math.pow(2, attempt) * 1000;
              yield {
                source: 'arbiter',
                type: 'thought',
                payload: { 
                  message: `Model geçici olarak meşgul. ${delay / 1000} saniye sonra yeniden deneniyor... (Deneme ${attempt}/${MAX_RETRIES})` 
                },
                timestamp: Date.now()
              };
              await setTimeoutPromise(delay);
            } else {
              throw error;
            }
          }
        }
        
        if (!arbiterResult) {
          throw new Error("Modelle iletişim kurulamadı.");
        }
      }
      
      const initialAnalysis = arbiterResult.response.text();
      
      if (!initialAnalysis) {
        throw new Error("ArbiterAI boş bir cevap döndürdü.");
      }

      // Streaming kaldırıldı - performans için tüm analizi tek seferde gönder
      yield {
        source: 'arbiter',
        type: 'final_chunk',
        payload: { 
          chunk: initialAnalysis,
          progress: 100
        },
        timestamp: Date.now()
      };

      // Tamamlanma durumu
      yield {
        source: 'arbiter',
        type: 'status',
        payload: { 
          status: AgentStatus.COMPLETED, 
          message: 'ArbiterAI analizi tamamlandı',
          duration: Date.now() - startTime,
          fullAnalysis: initialAnalysis
        },
        timestamp: Date.now()
      };

    } catch (error) {
      console.error("ArbiterAgent Hatası:", error);
      
      yield {
        source: 'arbiter',
        type: 'error',
        payload: { 
          error: error instanceof Error ? error.message : String(error),
          message: 'ArbiterAI analizi sırasında hata oluştu'
        },
        timestamp: Date.now()
      };
    }
  }
}
