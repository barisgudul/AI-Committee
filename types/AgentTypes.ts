// types/AgentTypes.ts

/**
 * Agent'lardan gelen stream event'lerinin yapısı
 */
export interface AgentStreamEvent {
  source: 'arbiter' | 'refiner' | 'tool_executor' | 'orchestrator' | 'chief_architect';
  type: 'thought' | 'tool_call' | 'tool_result' | 'final_chunk' | 'final_plan' | 'content' | 'error' | 'status';
  payload: Record<string, unknown>; // Düşünce metni, araç çağrısı JSON'u, nihai metin parçası, yapısal plan vb.
  timestamp: number;
}

/**
 * Her Agent'ın implement etmesi gereken temel arayüz
 */
export interface Agent {
  readonly name: string;
  readonly description: string;
  
  /**
   * Agent'ı çalıştırır ve stream event'leri döndürür
   * @param input Girdi verisi
   * @param context Ek bağlam bilgisi
   * @returns AsyncIterable<AgentStreamEvent>
   */
  execute(input: Record<string, unknown>, context?: Record<string, unknown>): AsyncIterable<AgentStreamEvent>;
}

/**
 * Agent'ların çalışma durumları
 */
export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Orkestratör için görev tanımı
 */
export interface Task {
  id: string;
  description: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  requiredAgents: string[];
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

/**
 * Agent çalıştırma sonucu
 */
export interface AgentResult {
  agentName: string;
  status: AgentStatus;
  output?: Record<string, unknown>;
  error?: string;
  duration: number;
  events: AgentStreamEvent[];
}
