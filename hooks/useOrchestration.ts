// hooks/useOrchestration.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentStreamEvent, AgentStatus } from '../types/AgentTypes';
import { OrchestrationState } from '../types/ProcessTypes';
import { eventHandlers } from './eventHandlers';

// Event batching için yardımcı değişkenler
const BATCH_INTERVAL = 300; // ms - Event'leri 300ms'de bir toplu işle (performans için optimize edildi)

const MAX_STEPS = 50; // Bellek optimizasyonu için maksimum step sayısı

export function useOrchestration() {
  const [state, setState] = useState<OrchestrationState>({
    processSteps: [],
    isComplete: false,
    error: null,
    totalDuration: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  
  // Event batching için ref'ler
  const eventBatchRef = useRef<AgentStreamEvent[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setState({
      processSteps: [],
      isComplete: false,
      error: null,
      totalDuration: 0
    });
  }, []);

  // Batch'deki event'leri toplu işle
  const processBatch = useCallback(() => {
    if (eventBatchRef.current.length === 0) return;
    
    const eventsToProcess = [...eventBatchRef.current];
    eventBatchRef.current = [];
    
    setState(prevState => {
      let currentState = prevState;
      
      // Tüm event'leri sırayla işle ama sadece bir kez render et
      for (const event of eventsToProcess) {
        const handler = eventHandlers[event.type];
        if (handler) {
          let newSteps = handler(currentState.processSteps, event.payload);
          
          // Bellek optimizasyonu: Step sayısını sınırla
          if (newSteps.length > MAX_STEPS) {
            const finalSteps = newSteps.filter(s => s.type === 'FINAL_ANSWER' || s.type === 'FINAL_PLAN');
            const otherSteps = newSteps.filter(s => s.type !== 'FINAL_ANSWER' && s.type !== 'FINAL_PLAN');
            const trimmedOtherSteps = otherSteps.slice(-(MAX_STEPS - finalSteps.length));
            newSteps = [...trimmedOtherSteps, ...finalSteps];
          }
          
          currentState = {
            ...currentState,
            processSteps: newSteps
          };

          if (event.type === 'status' && event.payload.status === AgentStatus.COMPLETED) {
            currentState = {
              ...currentState,
              isComplete: true,
              totalDuration: (event.payload.totalDuration as number) || 0
            };
          } else if (event.type === 'error') {
            currentState = {
              ...currentState,
              error: event.payload.error as string
            };
          }
        }
      }
      
      return currentState;
    });
  }, []);

  const processEvent = useCallback((event: AgentStreamEvent) => {
    // Event'i batch'e ekle
    eventBatchRef.current.push(event);
    
    // Önceki timeout'u iptal et
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Yeni timeout ayarla - batch'i işle
    batchTimeoutRef.current = setTimeout(() => {
      processBatch();
    }, BATCH_INTERVAL);
  }, [processBatch]);

  const submit = useCallback(async (task: string, history: Record<string, unknown>[]) => {
    // Önceki reader'ı temizle (kritik bellek sızıntısı düzeltmesi!)
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.warn('Reader cancel hatası:', e);
      }
      readerRef.current = null;
    }

    // Önceki işlemi iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Yeni abort controller oluştur
    abortControllerRef.current = new AbortController();
    
    // State'i sıfırla
    reset();

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, history }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      // Reader'ı ref'e kaydet (cleanup için)
      readerRef.current = reader;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Buffer'daki satırları işle
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Son satır tamamlanmamış olabilir
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              
              if (eventData.type === 'stream_start') {
                console.log('Stream başladı');
              } else if (eventData.type === 'stream_end') {
                console.log('Stream tamamlandı');
              } else {
                // AgentStreamEvent olarak işle
                processEvent(eventData as AgentStreamEvent);
              }
            } catch (parseError) {
              console.warn('Event parse hatası:', parseError, 'Line:', line);
            }
          }
        }
      }

      // Stream tamamlandı, reader'ı temizle
      readerRef.current = null;

    } catch (error) {
      // Hata durumunda da reader'ı temizle
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch {
          // İgnore cleanup errors
        }
        readerRef.current = null;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('İşlem iptal edildi');
      } else {
        console.error('Orchestration hatası:', error);
        setState(prevState => ({
          ...prevState,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  }, [processEvent, reset]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Component unmount cleanup - kritik bellek sızıntısı düzeltmesi!
  useEffect(() => {
    return () => {
      // Component unmount olduğunda tüm kaynakları temizle
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {
          // İgnore cleanup errors
        });
        readerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Batch timeout'u da temizle
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      // Bekleyen batch'i işle (unmount sırasında)
      if (eventBatchRef.current.length > 0) {
        processBatch();
      }
    };
  }, [processBatch]);

  return {
    processSteps: state.processSteps,
    isComplete: state.isComplete,
    error: state.error,
    totalDuration: state.totalDuration,
    submit,
    abort,
    reset
  };
}
