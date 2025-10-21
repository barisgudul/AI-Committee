// services/ArbiterService.ts 

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, SchemaType } from "@google/generative-ai";
import { ARBITER_AI_PROMPT } from '../lib/prompts';
import { REFINER_AI_PROMPT } from '../lib/refiner_prompt';
import { performSearch, searchCodeExamples } from './tools';

// Bu kısım projenin bir kerelik başlangıcında çalışır.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ArbiterAI Modeli - İlk analizi yapar (Function Calling ile)
const arbiterModel = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: ARBITER_AI_PROMPT,
    safetySettings,
    tools: [{
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
    }]
});

// RefinerAI Modeli - Arbiter'ın çıktısını rafine eder
const refinerModel = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: REFINER_AI_PROMPT,
    safetySettings
});

/**
 * Verilen bir görev ve konuşma geçmişi için ArbiterAI'dan bir analiz oluşturur.
 * @param task Kullanıcının son isteği/görevi.
 * @param history Önceki konuşma geçmişi.
 * @returns Yapay zeka modelinden gelen analiz metni.
 */
export async function generateAnalysis(task: string, history: Content[]): Promise<{ initialAnalysis: string; refinedAnalysis: string }> {
    try {
        // Geçmişi ve yeni görevi birleştirerek tek bir prompt içeriği oluşturuyoruz.
        const chatHistory = [
            ...history,
            { role: 'user' as const, parts: [{ text: task }] }
        ];

        console.log("🧠 ArbiterAI analizi başlatılıyor...");
        
        // ADIM 1: ArbiterAI ile ilk analizi oluştur (Function Calling ile)
        let arbiterResult = await arbiterModel.generateContent({ contents: chatHistory });
        
        // Function calling kontrolü
        if (arbiterResult.response.functionCalls && arbiterResult.response.functionCalls.length > 0) {
            console.log("🔧 Araçlar kullanılıyor...");
            
            // Function call'ları işle
            const functionCalls = arbiterResult.response.functionCalls();
            const functionResults: Array<{name: string; response: {result: string}}> = [];
            
            for (const functionCall of functionCalls || []) {
                const functionName = functionCall.name;
                const functionArgs = functionCall.args as {query: string};
                
                console.log(`⚙️ ${functionName} çalıştırılıyor:`, functionArgs);
                
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
            
            arbiterResult = await arbiterModel.generateContent({ contents: followUpContent });
        }
        
        const initialAnalysis = arbiterResult.response.text();
        
        if (!initialAnalysis) {
            throw new Error("ArbiterAI boş bir cevap döndürdü.");
        }

        console.log("✨ RefinerAI ile analiz rafine ediliyor...");

        // ADIM 2: RefinerAI ile analizi rafine et
        const refinerResult = await refinerModel.generateContent(initialAnalysis);
        const refinedAnalysis = refinerResult.response.text();

        console.log("🎯 Analiz tamamlandı!");
        
        // Hem ilk analizi hem de rafine edilmiş analizi bir obje olarak döndür
        return {
            initialAnalysis: initialAnalysis,
            refinedAnalysis: refinedAnalysis || initialAnalysis // Refiner boş dönerse ilkini kullan
        };
        
    } catch (error) {
        console.error("ArbiterService Hatası:", error);
        throw new Error(`AI modeliyle iletişim hatası: ${error instanceof Error ? error.message : String(error)}`);
    }
}
