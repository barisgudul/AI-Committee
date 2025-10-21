// lib/schemas.ts

import { z } from 'zod';

/**
 * Nihai plan için Zod şeması
 * Bu şema hem tip güvenliği sağlar hem de Gemini'ye verilecek JSON şemasını üretmek için kullanılabilir
 */
export const FinalPlanSchema = z.object({
  finalDecision: z.string().describe("Nihai, öz ve net karar."),
  justification: z.string().describe("Kararın arkasındaki sentezlenmiş, detaylı ve rasyonel gerekçe."),
  implementationPlan: z.array(z.object({
    step: z.number().describe("Adım numarası."),
    title: z.string().describe("Adımın kısa başlığı."),
    details: z.string().describe("Adımın teknik detayları ve uygulanış şekli."),
  })).describe("Uygulama planının adımlara bölünmüş hali."),
});

export type FinalPlan = z.infer<typeof FinalPlanSchema>;

/**
 * Araç çağrısı sonuçları için şema
 */
export const ToolResultSchema = z.object({
  toolName: z.string().describe("Kullanılan araç adı"),
  query: z.string().describe("Araç için kullanılan sorgu"),
  result: z.string().describe("Araçtan dönen sonuç"),
  timestamp: z.number().describe("Araç çağrısı zamanı"),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

/**
 * Düşünce süreci için şema
 */
export const ThoughtProcessSchema = z.object({
  phase: z.enum(['analysis', 'critique', 'synthesis']).describe("Düşünce sürecinin aşaması"),
  content: z.string().describe("Düşünce içeriği"),
  timestamp: z.number().describe("Düşünce zamanı"),
});

export type ThoughtProcess = z.infer<typeof ThoughtProcessSchema>;
