// services/agents/ChiefArchitectAgent.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, SchemaType, GenerateContentResult, SafetySetting, Tool } from "@google/generative-ai";
import { CHIEF_ARCHITECT_SYSTEM_PROMPT } from '../../lib/prompts/architect';
import { performSearch, searchCodeExamples } from '../tools';
import { Agent, AgentStreamEvent, AgentStatus } from '../../types/AgentTypes';
import { FinalPlanSchema, type FinalPlan } from '../../lib/schemas';
import { setTimeout } from 'timers/promises';

export class ChiefArchitectAgent implements Agent {
  readonly name = 'chief_architect';
  readonly description = 'Ana analizi yapan ve yapısal çıktı üreten chief architect agent';
  
  private genAI: GoogleGenerativeAI;
  private safetySettings: SafetySetting[];
  private toolSettings: Tool[];

  // --- 1. YENİ: Model isimlerini tanımla ---
  private primaryModelName = process.env.DEFAULT_AGENT_MODEL || "gemini-2.5-pro";
  private fallbackModelName = "gemini-2.5-flash";

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    
    // --- 2. DEĞİŞİKLİK: Ayarları constructor'da sakla ---
    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    this.toolSettings = [{
      functionDeclarations: [
        {
          name: 'submitFinalPlan',
          description: 'Submit the final structured plan',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              finalDecision: {
                type: SchemaType.STRING,
                description: 'Nihai, öz ve net karar.'
              },
              justification: {
                type: SchemaType.STRING,
                description: 'Kararın arkasındaki sentezlenmiş, detaylı ve rasyonel gerekçe.'
              },
              implementationPlan: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    step: { type: SchemaType.NUMBER, description: 'Adım numarası.' },
                    title: { type: SchemaType.STRING, description: 'Adımın kısa başlığı.' },
                    details: { type: SchemaType.STRING, description: 'Adımın teknik detayları ve uygulanış şekli.' }
                  },
                  required: ['step', 'title', 'details']
                },
                description: 'Uygulama planının adımlara bölünmüş hali.'
              }
            },
            required: ['finalDecision', 'justification', 'implementationPlan']
          }
        },
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
    // Model oluşturma işlemini buradan kaldırıyoruz, execute içinde dinamik olarak yapacağız.
  }

  // --- YENİ YARDIMCI FONKSİYON: Markdown'dan Plan Ayrıştırma ---
  private parsePlanFromMarkdown(text: string): FinalPlan | null {
    try {
      const finalDecisionMatch = text.match(/###\s*Nihai Karar\s*([\s\S]*?)(?=\n###|$)/i);
      const justificationMatch = text.match(/###\s*Gerekçe\s*([\s\S]*?)(?=\n###|$)/i);
      const implementationPlanMatch = text.match(/###\s*Uygulama Planı\s*([\s\S]*)/i);

      if (!finalDecisionMatch || !justificationMatch || !implementationPlanMatch) {
        return null; // Gerekli başlıklar yoksa ayrıştırma başarısız.
      }

      const finalDecision = finalDecisionMatch[1].trim();
      const justification = justificationMatch[1].trim();
      const implementationPlanText = implementationPlanMatch[1].trim();
      
      const implementationPlan: FinalPlan['implementationPlan'] = [];
      const stepRegex = /(?:\*\*Adım|\*Adım|Adım)\s*(\d+):?\s*\*?\*?\s*(.*?)\*?\*?\s*([\s\S]*?)(?=\n(?:\*\*Adım|\*Adım|Adım)|$)/gi;
      
      let match;
      while ((match = stepRegex.exec(implementationPlanText)) !== null) {
        const title = match[2].replace(/\*\*/g, '').trim(); // ** karakterlerini temizle
        implementationPlan.push({
          step: parseInt(match[1], 10),
          title: title,
          details: match[3].trim(),
        });
      }
      
      // Eğer regex ile adım bulunamazsa, bu formatta bir plan yoktur.
      if (implementationPlan.length === 0 && implementationPlanText.length > 10) {
        return null;
      }

      const plan: FinalPlan = { finalDecision, justification, implementationPlan };

      // Kendi ayrıştırdığımız objenin şemaya uyduğunu Zod ile tekrar kontrol edelim.
      const validation = FinalPlanSchema.safeParse(plan);
      return validation.success ? validation.data : null;

    } catch (e) {
      console.error("Markdown planı ayrıştırılırken hata oluştu:", e);
      return null;
    }
  }

  async *execute(input: Record<string, unknown>): AsyncIterable<AgentStreamEvent> {
    const startTime = Date.now();
    
    try {
      // Başlangıç durumu
      yield {
        source: 'chief_architect',
        type: 'status',
        payload: { status: AgentStatus.RUNNING, message: 'ChiefArchitectAI analizi başlatılıyor...' },
        timestamp: Date.now()
      };

      // Input'u doğru tipte cast et
      const { task, history } = input as { task: string; history: Content[] };
      
      // Geçmişi ve yeni görevi birleştir - Model'e function call yapması gerektiğini hatırlat
      const enhancedTask = `${task}\n\n**ÖNEMLİ HATIRLATMA:** Analizini tamamladıktan sonra, sonucu MUTLAKA 'submitFinalPlan' aracını kullanarak göndermelisin. Asla düz metin olarak cevap verme.`;
      
      const chatHistory = [
        ...history,
        { role: 'user' as const, parts: [{ text: enhancedTask }] }
      ];

      // Düşünce süreci başlıyor
      yield {
        source: 'chief_architect',
        type: 'thought',
        payload: { 
          phase: 'analysis',
          message: 'Görev analiz ediliyor...' 
        },
        timestamp: Date.now()
      };

      // --- 3. YENİ: YEDEKLEME (FALLBACK) MANTIĞI ---
      const modelsToTry = [this.primaryModelName, this.fallbackModelName];
      let architectResult: GenerateContentResult | null = null;
      let successfulModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

      for (const modelName of modelsToTry) {
        // Model deneme mesajını kaldırdık - performans için gereksiz

        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: CHIEF_ARCHITECT_SYSTEM_PROMPT,
          safetySettings: this.safetySettings,
          tools: this.toolSettings
        });
        
        const MAX_RETRIES = 2; // Her model için deneme sayısı
        let attempt = 0;
        
        while (attempt < MAX_RETRIES) {
          try {
            architectResult = await model.generateContent({ contents: chatHistory });
            successfulModel = model; // Başarılı modeli sakla
            break; // Başarılı olursa deneme döngüsünden çık
          } catch (error: unknown) {
            attempt++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            if ((errorMessage.includes('503') || errorMessage.includes('overloaded')) && attempt < MAX_RETRIES) {
              const delay = Math.pow(2, attempt) * 1000;
              yield {
                source: 'chief_architect',
                type: 'thought',
                payload: {
                  phase: 'analysis',
                  message: `Model (${modelName.split('/').pop()?.replace('gemini-', '') || modelName}) meşgul. ${delay / 1000}s sonra yeniden deneniyor... (${attempt}/${MAX_RETRIES})`
                },
                timestamp: Date.now()
              };
              await setTimeout(delay);
            } else {
              console.error(`Model (${modelName}) ile kalıcı hata:`, errorMessage);
              architectResult = null; // Bu modelin başarısız olduğunu işaretle
              break; // Bu model için denemeleri sonlandır
            }
          }
        }
        
        // Eğer sonuç başarılıysa, diğer modelleri deneme ve ana döngüden çık.
        if (architectResult && successfulModel) {
          // Başarı mesajını kaldırdık - performans için gereksiz
          break; 
        }
      }

      // Eğer tüm modeller denendikten sonra hala sonuç yoksa, hata fırlat.
      if (!architectResult) {
        throw new Error("Tüm denemelere rağmen AI modellerine ulaşılamadı. Lütfen daha sonra tekrar deneyin.");
      }
      // --- YEDEKLEME MANTIĞI SONU ---
      
      const response = architectResult.response;
      
      // Function calling kontrolü - candidates üzerinden kontrol et
      const hasFunctionCalls = response.candidates?.[0]?.content?.parts?.some(
        (part: {functionCall?: unknown}) => part.functionCall !== undefined
      );
      
      console.log("Has function calls:", hasFunctionCalls);
      
      if (hasFunctionCalls) {
        // Araç kullanım mesajını kaldırdık - tool_call eventi zaten gösterilecek

        // Function call'ları işle
        const functionCalls = architectResult.response.functionCalls();
        const functionResults: Array<{name: string; response: {result: string}}> = [];
        
        for (const functionCall of functionCalls || []) {
          const functionName = functionCall.name;
          const functionArgs = functionCall.args as {query: string};
          
          // submitFinalPlan kontrolü
          if (functionName === 'submitFinalPlan') {
            const planData = functionCall.args as FinalPlan;
            
            // Zod ile gelen veriyi doğrula
            const validationResult = FinalPlanSchema.safeParse(planData);
            if (!validationResult.success) {
              yield {
                source: 'chief_architect',
                type: 'error',
                payload: { 
                  error: 'Plan validation failed',
                  message: 'Gönderilen plan geçersiz format. Lütfen tekrar deneyin.',
                  validationErrors: validationResult.error.issues
                },
                timestamp: Date.now()
              };
              return;
            } else {
              // Doğrulanmış JSON verisini final_plan tipiyle yayınla
              yield {
                source: 'chief_architect',
                type: 'final_plan',
                payload: validationResult.data,
                timestamp: Date.now()
              };
              
              // Tamamlanma durumu
              yield {
                source: 'chief_architect',
                type: 'status',
                payload: { 
                  status: AgentStatus.COMPLETED, 
                  message: 'ChiefArchitectAI analizi tamamlandı',
                  duration: Date.now() - startTime
                },
                timestamp: Date.now()
              };
              return;
            }
          }
          
          // Diğer araç çağrıları
          // Araç çağrısı event'i
          yield {
            source: 'chief_architect',
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
            source: 'chief_architect',
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
        
        // İkinci generateContent çağrısı için de retry mekanizması (aynı başarılı modeli kullan)
        if (!successfulModel) {
          throw new Error("Başarılı model bulunamadı.");
        }
        
        let attempt = 0;
        const MAX_RETRIES = 2;
        architectResult = null;
        
        while (attempt < MAX_RETRIES) {
          try {
            architectResult = await successfulModel.generateContent({ contents: followUpContent });
            break;
          } catch (error: unknown) {
            attempt++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            if ((errorMessage.includes('503') || errorMessage.includes('overloaded')) && attempt < MAX_RETRIES) {
              const delay = Math.pow(2, attempt) * 1000;
              yield {
                source: 'chief_architect',
                type: 'thought',
                payload: {
                  phase: 'analysis',
                  message: `Model geçici olarak meşgul. ${delay / 1000} saniye sonra yeniden deneniyor... (Deneme ${attempt}/${MAX_RETRIES})`
                },
                timestamp: Date.now()
              };
              await setTimeout(delay);
            } else {
              throw error;
            }
          }
        }
        
        if (!architectResult) {
          throw new Error("Modelle iletişim kurulamadı.");
        }
      }
      
      // --- YENİ: KAPSAMLI RESPONSE KONTROLÜ VE PARSING FALLBACK ---
      // Safety check - response blocked olabilir
      if (response.promptFeedback?.blockReason) {
        yield {
          source: 'chief_architect',
          type: 'error',
          payload: { 
            error: 'Content Blocked',
            message: `Model cevabı engellenmiş: ${response.promptFeedback.blockReason}. Lütfen sorunuzu farklı şekilde sorun.`
          },
          timestamp: Date.now()
        };
        return;
      }

      // Candidates kontrolü
      if (!response.candidates || response.candidates.length === 0) {
        yield {
          source: 'chief_architect',
          type: 'error',
          payload: { 
            error: 'No candidates',
            message: 'Model hiçbir cevap adayı üretmedi. Lütfen tekrar deneyin.'
          },
          timestamp: Date.now()
        };
        return;
      }

      // Finish reason kontrolü
      const finishReason = response.candidates[0]?.finishReason;
      
      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        yield {
          source: 'chief_architect',
          type: 'error',
          payload: { 
            error: 'Unexpected finish reason',
            message: `Model beklenmedik şekilde durdu: ${finishReason}. Lütfen sorunuzu farklı şekilde sorun.`
          },
          timestamp: Date.now()
        };
        return;
      }
      
      // Text çıkarmayı dene
      let textResponse: string = '';
      
      try {
        textResponse = response.text();
      } catch (error) {
        console.error("Text extraction error:", error);
        yield {
          source: 'chief_architect',
          type: 'error',
          payload: { 
            error: 'Text extraction failed',
            message: `Model cevabı alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
          },
          timestamp: Date.now()
        };
        return;
      }

      if (textResponse && textResponse.trim().length > 0) {
        // ADIM 1: ÖNCE PARSING DENEYELİM (YEDEK YOL)
        const parsedPlan = this.parsePlanFromMarkdown(textResponse);
        
        if (parsedPlan) {
          // BAŞARILI! Plan başarıyla ayrıştırıldı - mesaj göstermeye gerek yok
          
          yield {
            source: 'chief_architect',
            type: 'final_plan',
            payload: parsedPlan,
            timestamp: Date.now()
          };
          
          yield {
            source: 'chief_architect',
            type: 'status',
            payload: { 
              status: AgentStatus.COMPLETED, 
              message: 'ChiefArchitectAI analizi tamamlandı',
              duration: Date.now() - startTime
            },
            timestamp: Date.now()
          };
          return; // BAŞARILI SON!
        }

        // ADIM 2: PARSING BAŞARISIZ, RETRY DENEYELİM - sessizce yeniden dene

        if (!successfulModel) {
          throw new Error("Başarılı model bulunamadı.");
        }

        const retryContent: Content[] = [
          ...chatHistory,
          { role: 'model' as const, parts: [{ text: textResponse }] },
          { 
            role: 'user' as const, 
            parts: [{ 
              text: `Bu analiz çok iyi, ancak lütfen şimdi bunu 'submitFinalPlan' aracını kullanarak yapılandırılmış formatta gönder. Analiz sonuçlarını şu formata uygun şekilde submitFinalPlan aracına göndermelisin:
- finalDecision: Nihai kararın
- justification: Gerekçelendirmen
- implementationPlan: Adım adım uygulama planı (her adımda step, title ve details olmalı)

Lütfen SADECE submitFinalPlan aracını çağır, başka bir şey yapma.` 
            }] 
          }
        ];

        let retryResult: GenerateContentResult | null = null;
        try {
          retryResult = await successfulModel.generateContent({ contents: retryContent });
        } catch (error) {
          console.error("Retry sırasında hata:", error);
          yield {
            source: 'chief_architect',
            type: 'error',
            payload: { 
              error: 'Retry failed',
              message: `Model ikinci denemede de başarısız oldu. Parsing de çalışmadı.`
            },
            timestamp: Date.now()
          };
          return;
        }

        // Retry sonucunu kontrol et
        if (retryResult && retryResult.response.functionCalls && retryResult.response.functionCalls.length > 0) {
          const retryCalls = retryResult.response.functionCalls();
          for (const functionCall of retryCalls || []) {
            if (functionCall.name === 'submitFinalPlan') {
              const planData = functionCall.args as FinalPlan;
              
              const validationResult = FinalPlanSchema.safeParse(planData);
              if (!validationResult.success) {
                yield {
                  source: 'chief_architect',
                  type: 'error',
                  payload: { 
                    error: 'Plan validation failed',
                    message: 'Retry sonucu geçersiz format.',
                    validationErrors: validationResult.error.issues
                  },
                  timestamp: Date.now()
                };
                return;
              }
              
              // Başarılı!
              yield {
                source: 'chief_architect',
                type: 'final_plan',
                payload: validationResult.data,
                timestamp: Date.now()
              };
              
              yield {
                source: 'chief_architect',
                type: 'status',
                payload: { 
                  status: AgentStatus.COMPLETED, 
                  message: 'ChiefArchitectAI analizi tamamlandı (retry ile)',
                  duration: Date.now() - startTime
                },
                timestamp: Date.now()
              };
              return;
            }
          }
        }
        
        // Son bir deneme: Retry'dan dönen metni de parse etmeyi dene
        if (retryResult) {
          const retryText = retryResult.response.text();
          const retryParsed = this.parsePlanFromMarkdown(retryText);
          
          if (retryParsed) {
            yield {
              source: 'chief_architect',
              type: 'final_plan',
              payload: retryParsed,
              timestamp: Date.now()
            };
            
            yield {
              source: 'chief_architect',
              type: 'status',
              payload: { 
                status: AgentStatus.COMPLETED, 
                message: 'ChiefArchitectAI analizi tamamlandı (retry parsing ile)',
                duration: Date.now() - startTime
              },
              timestamp: Date.now()
            };
            return;
          }
        }
        
        // Tüm denemeler başarısız
        yield {
          source: 'chief_architect',
          type: 'error',
          payload: { 
            error: 'Model Failure',
            message: `Model talimatlara uymadı ve geçerli bir plan formatı üretemedi.`
          },
          timestamp: Date.now()
        };
      } else {
        // Text response boş veya sadece whitespace
        console.log("Empty text response, raw response:", JSON.stringify(response.candidates?.[0]));
        yield {
          source: 'chief_architect',
          type: 'error',
          payload: { 
            error: 'Empty response',
            message: 'Model boş cevap döndürdü. Lütfen sorunuzu daha detaylı sorun.'
          },
          timestamp: Date.now()
        };
      }
      // --- KAPSAMLI RESPONSE KONTROLÜ VE HATA YÖNETİMİ SONU ---

    } catch (error) {
      console.error("ChiefArchitectAgent Hatası:", error);
      
      yield {
        source: 'chief_architect',
        type: 'error',
        payload: { 
          error: error instanceof Error ? error.message : String(error),
          message: 'ChiefArchitectAI analizi sırasında hata oluştu'
        },
        timestamp: Date.now()
      };
    }
  }
}
