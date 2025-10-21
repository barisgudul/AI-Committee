// types/ProcessTypes.ts


export type StepStatus = 'running' | 'completed' | 'error';
export type StepType = 'THOUGHT' | 'TOOL_CALL' | 'TOOL_RESULT' | 'FINAL_ANSWER' | 'FINAL_PLAN';

// Her adım türü için özel veri yükü (payload)
export interface ThoughtPayload {
  source: string;
  message: string;
  phase?: 'analysis' | 'critique' | 'synthesis';
}

export interface ToolCallPayload {
  toolCallId: string; // Paralel çağrıları izlemek için kritik
  functionName: string;
  args: Record<string, unknown>;
  message?: string;
}

export interface ToolResultPayload {
  toolCallId: string;
  functionName: string;
  result: string;
  message?: string;
}

export interface FinalAnswerPayload {
  content: string;
  isComplete: boolean;
}

export interface FinalPlanPayload {
  plan: {
    finalDecision: string;
    justification: string;
    implementationPlan: Array<{
      step: number;
      title: string;
      details: string;
    }>;
  };
}

// Ayrık birleşim (Discriminated Union) ile ana adım tipini tanımla
export type ProcessStep = {
  id: string; // UUID
  status: StepStatus;
  timestamp: number;
} & (
  | { type: 'THOUGHT'; payload: ThoughtPayload }
  | { type: 'TOOL_CALL'; payload: ToolCallPayload }
  | { type: 'TOOL_RESULT'; payload: ToolResultPayload }
  | { type: 'FINAL_ANSWER'; payload: FinalAnswerPayload }
  | { type: 'FINAL_PLAN'; payload: FinalPlanPayload }
);

// Backend'den gelen olayların yapısı
export interface AgentStreamEvent {
  source: 'arbiter' | 'refiner' | 'tool_executor' | 'orchestrator' | 'chief_architect';
  type: 'thought' | 'tool_call' | 'tool_result' | 'final_chunk' | 'final_plan' | 'content' | 'error' | 'status';
  payload: Record<string, unknown>;
  timestamp: number;
}

// State yönetimi için ana interface
export interface OrchestrationState {
  processSteps: ProcessStep[];
  isComplete: boolean;
  error: string | null;
  totalDuration: number;
}

// Event handler fonksiyon tipi
export type EventHandler = (steps: ProcessStep[], payload: Record<string, unknown>) => ProcessStep[];

// Event handler map tipi
export type EventHandlerMap = {
  [K in AgentStreamEvent['type']]?: EventHandler;
};
