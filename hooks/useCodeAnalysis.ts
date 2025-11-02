// hooks/useCodeAnalysis.ts

import { useState, useCallback, useRef } from 'react';

export interface CodeAnalysisState {
  isAnalyzing: boolean;
  analysisText: string;
  error: string | null;
}

export interface CodeAnalysisReturn {
  state: CodeAnalysisState;
  analyzeCode: (
    sessionId: string,
    history: Array<{ role: string; parts: Array<{ text: string }> }>,
    analysisType?: 'full' | 'security' | 'performance' | 'structure' | 'custom',
    onUpdate?: (text: string) => void,
    onComplete?: (text: string) => void,
    onError?: (error: string) => void
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Kod analizi için custom hook
 * SSE stream'ini işler ve final_plan event'lerini özel olarak handle eder
 */
export function useCodeAnalysis(): CodeAnalysisReturn {
  const [state, setState] = useState<CodeAnalysisState>({
    isAnalyzing: false,
    analysisText: '',
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      analysisText: '',
      error: null
    });
  }, []);

  const analyzeCode = useCallback(async (
    sessionId: string,
    history: Array<{ role: string; parts: Array<{ text: string }> }>,
    analysisType: 'full' | 'security' | 'performance' | 'structure' | 'custom' = 'full',
    onUpdate?: (text: string) => void,
    onComplete?: (text: string) => void,
    onError?: (error: string) => void
  ) => {
    // Önceki işlemi iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch {
        // Ignore cleanup errors
      }
    }

    // State'i sıfırla
    setState({
      isAnalyzing: true,
      analysisText: '',
      error: null
    });

    // Yeni abort controller oluştur
    abortControllerRef.current = new AbortController();

    try {
      const requestBody = {
        sessionId,
        analysisType,
        history: history.map(msg => ({
          role: msg.role,
          parts: msg.parts
        }))
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // SSE stream'i işle
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      readerRef.current = reader;

      const decoder = new TextDecoder();
      let buffer = '';
      let analysisText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));

              // Stream control events'leri atla
              if (eventData.type === 'stream_start' || eventData.type === 'stream_end') {
                continue;
              }

              // Event tipine göre işle
              if (eventData.type === 'final_plan') {
                // Yapısal plan verisi geldi - ChiefArchitectAgent'dan
                const plan = eventData.payload;

                // Planı Markdown formatına dönüştür
                const formattedPlan = `### 🎯 Nihai Karar\n\n${plan.finalDecision || ''}\n\n### 💡 Gerekçe\n\n${plan.justification || ''}\n\n### 📋 Uygulama Planı\n\n${plan.implementationPlan?.map((p: { step: number; title: string; details: string }) =>
                  `**Adım ${p.step}: ${p.title}**\n\n${p.details}`
                ).join('\n\n') || ''}`;

                analysisText = formattedPlan;

                setState(prev => ({
                  ...prev,
                  analysisText
                }));

                if (onUpdate) {
                  onUpdate(analysisText);
                }

                // Plan alındı - stream devam edebilir (status event'i bekliyoruz)
              } else if (eventData.type === 'final_chunk') {
                // Streaming chunk'ı birleştir
                const chunk = eventData.payload?.chunk || '';
                if (chunk) {
                  analysisText += chunk;

                  setState(prev => ({
                    ...prev,
                    analysisText
                  }));

                  if (onUpdate) {
                    onUpdate(analysisText);
                  }
                }
              } else if (eventData.type === 'status') {
                // Status event'i - completed durumunda fullAnalysis var mı kontrol et
                if (eventData.payload?.status === 'completed') {
                  const fullAnalysis = eventData.payload?.fullAnalysis;
                  if (fullAnalysis && typeof fullAnalysis === 'string' && !analysisText) {
                    // Eğer henüz plan veya chunk gelmediyse fullAnalysis'ı kullan
                    analysisText = fullAnalysis;

                    setState(prev => ({
                      ...prev,
                      analysisText
                    }));

                    if (onUpdate) {
                      onUpdate(analysisText);
                    }
                  }

                  // Analiz tamamlandı
                  setState(prev => ({
                    ...prev,
                    isAnalyzing: false
                  }));

                  if (onComplete) {
                    onComplete(analysisText);
                  }
                }
              } else if (eventData.type === 'error') {
                // Hata durumu
                const errorMsg = eventData.payload?.error || 'Analiz sırasında bir hata oluştu';
                setState(prev => ({
                  ...prev,
                  isAnalyzing: false,
                  error: errorMsg
                }));

                if (onError) {
                  onError(errorMsg);
                }
              }
            } catch (e) {
              console.warn('[USE-CODE-ANALYSIS] Event parse error:', e, line);
            }
          }
        }
      }

      // Stream tamamlandı
      readerRef.current = null;

      // Final state güncelleme
      setState(prev => ({
        ...prev,
        isAnalyzing: false
      }));

      if (onComplete) {
        onComplete(analysisText);
      }

    } catch (error) {
      // Hata durumunda da reader'ı temizle
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch {
          // Ignore cleanup errors
        }
        readerRef.current = null;
      }

      const errorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'İşlem iptal edildi'
        : error instanceof Error
        ? error.message
        : 'Bilinmeyen hata';

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  }, []);

  return {
    state,
    analyzeCode,
    reset
  };
}

