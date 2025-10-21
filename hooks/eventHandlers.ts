// hooks/eventHandlers.ts

import { v4 as uuidv4 } from 'uuid';
import { ProcessStep, EventHandler, ThoughtPayload, ToolCallPayload, ToolResultPayload, FinalAnswerPayload, FinalPlanPayload } from '../types/ProcessTypes';

/**
 * Düşünce olayını işleyen handler
 */
export const handleThoughtEvent: EventHandler = (steps: ProcessStep[], payload: Record<string, unknown>): ProcessStep[] => {
  // Önceki çalışan adımları tamamla
  const updatedSteps = steps.map(step => 
    step.status === 'running' ? { ...step, status: 'completed' as const } : step
  );
  
  const thoughtPayload: ThoughtPayload = {
    source: (payload.source as string) || 'unknown',
    message: (payload.message as string) || (payload.content as string) || 'Düşünüyor...',
    phase: payload.phase as 'analysis' | 'critique' | 'synthesis' | undefined
  };

  return [
    ...updatedSteps,
    {
      id: uuidv4(),
      type: 'THOUGHT',
      status: 'running',
      timestamp: Date.now(),
      payload: thoughtPayload,
    },
  ];
};

/**
 * Araç çağrısı olayını işleyen handler
 */
export const handleToolCallEvent: EventHandler = (steps: ProcessStep[], payload: Record<string, unknown>): ProcessStep[] => {
  // Önceki çalışan adımları tamamla
  const updatedSteps = steps.map(step => 
    step.status === 'running' ? { ...step, status: 'completed' as const } : step
  );

  const toolCallPayload: ToolCallPayload = {
    toolCallId: (payload.toolCallId as string) || uuidv4(), // Backend bu ID'yi sağlamalı
    functionName: (payload.functionName as string) || 'unknown',
    args: (payload.args as Record<string, unknown>) || {},
    message: payload.message as string | undefined
  };

  return [
    ...updatedSteps,
    {
      id: uuidv4(),
      type: 'TOOL_CALL',
      status: 'running',
      timestamp: Date.now(),
      payload: toolCallPayload,
    },
  ];
};

/**
 * Araç sonucu olayını işleyen handler
 */
export const handleToolResultEvent: EventHandler = (steps: ProcessStep[], payload: Record<string, unknown>): ProcessStep[] => {
  // toolCallId ile doğru adımı bul ve güncelle. Artık "son adım" varsayımı yok!
  return steps.map(step => {
    if (step.type === 'TOOL_CALL' && step.payload.toolCallId === payload.toolCallId) {
      // İlgili TOOL_CALL adımını tamamlanmış olarak işaretle
      return { ...step, status: 'completed' as const };
    }
    return step;
  }).concat([
    // Sonucu göstermek için yeni bir TOOL_RESULT adımı ekle
    {
      id: uuidv4(),
      type: 'TOOL_RESULT',
      status: 'completed',
      timestamp: Date.now(),
      payload: {
        toolCallId: payload.toolCallId || 'unknown',
        functionName: payload.functionName || 'unknown',
        result: payload.result || payload.content || 'Sonuç alındı',
        message: payload.message
      } as ToolResultPayload,
    }
  ]);
};

/**
 * Final answer olayını işleyen handler
 * Gelen parçaları (chunk) mevcut cevaba ekler veya yeni bir cevap başlatır.
 */
export const handleFinalAnswerEvent: EventHandler = (steps: ProcessStep[], payload: Record<string, unknown>): ProcessStep[] => {
  const contentChunk = (payload.content as string) || (payload.delta as string) || (payload.chunk as string) || '';
  const isComplete = (payload.isComplete as boolean) || false;

  const lastStep = steps[steps.length - 1];

  // Eğer son adım zaten bir FINAL_ANSWER ise, onu güncelle
  if (lastStep && lastStep.type === 'FINAL_ANSWER') {
    const updatedPayload: FinalAnswerPayload = {
      ...lastStep.payload,
      content: lastStep.payload.content + contentChunk,
      isComplete: isComplete || lastStep.payload.isComplete,
    };
    const updatedSteps = [...steps.slice(0, -1)];
    return [
      ...updatedSteps,
      {
        ...lastStep,
        status: isComplete ? 'completed' : 'running',
        payload: updatedPayload,
      },
    ];
  }

  // Yeni bir FINAL_ANSWER adımı oluştur
  // Önceki çalışan adımları tamamla
  const completedSteps = steps.map(step =>
    step.status === 'running' ? { ...step, status: 'completed' as const } : step
  );

  const finalAnswerPayload: FinalAnswerPayload = {
    content: contentChunk,
    isComplete: isComplete,
  };

  return [
    ...completedSteps,
    {
      id: uuidv4(),
      type: 'FINAL_ANSWER',
      status: isComplete ? 'completed' : 'running',
      timestamp: Date.now(),
      payload: finalAnswerPayload,
    },
  ];
};

/**
 * Final plan olayını işleyen handler
 */
export const handleFinalPlanEvent: EventHandler = (steps: ProcessStep[], payload: Record<string, unknown>): ProcessStep[] => {
  // Önceki çalışan adımları tamamla
  const updatedSteps = steps.map(step => 
    step.status === 'running' ? { ...step, status: 'completed' as const } : step
  );

  const finalPlanPayload: FinalPlanPayload = {
    plan: (payload.plan as FinalPlanPayload['plan']) || (payload as FinalPlanPayload['plan'])
  };

  return [
    ...updatedSteps,
    {
      id: uuidv4(),
      type: 'FINAL_PLAN',
      status: 'completed',
      timestamp: Date.now(),
      payload: finalPlanPayload,
    },
  ];
};

/**
 * Hata olayını işleyen handler
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleErrorEvent: EventHandler = (steps: ProcessStep[], _payload: Record<string, unknown>): ProcessStep[] => {
  // Son çalışan adımı hata olarak işaretle
  return steps.map((step, index) => {
    if (step.status === 'running' && index === steps.length - 1) {
      return { ...step, status: 'error' as const };
    }
    return step;
  });
};

/**
 * Status olayını işleyen handler - genellikle UI state'ini etkilemez
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleStatusEvent: EventHandler = (steps: ProcessStep[], _payload: Record<string, unknown>): ProcessStep[] => {
  return steps; // Status event'leri adımları değiştirmez
};

/**
 * Event handler map - yeni olay tipleri eklemek artık çok kolay
 */
export const eventHandlers = {
  'thought': handleThoughtEvent,
  'tool_call': handleToolCallEvent,
  'tool_result': handleToolResultEvent,
  'final_chunk': handleFinalAnswerEvent,
  'final_plan': handleFinalPlanEvent,
  'content': handleFinalAnswerEvent,
  'error': handleErrorEvent,
  'status': handleStatusEvent,
} as const;
