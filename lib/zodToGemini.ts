// lib/zodToGemini.ts

import { z } from 'zod';
import { SchemaType } from '@google/generative-ai';

/**
 * Zod şemasını Gemini FunctionDeclaration formatına çeviren yardımcı fonksiyon
 */
export function zodToGeminiTool(schema: z.ZodSchema, functionName: string, description?: string) {
  const zodToGeminiType = (zodType: z.ZodTypeAny): Record<string, unknown> => {
    if (zodType instanceof z.ZodString) {
      return { type: SchemaType.STRING };
    }
    if (zodType instanceof z.ZodNumber) {
      return { type: SchemaType.NUMBER };
    }
    if (zodType instanceof z.ZodBoolean) {
      return { type: SchemaType.BOOLEAN };
    }
    if (zodType instanceof z.ZodArray) {
      return {
        type: SchemaType.ARRAY,
        items: zodToGeminiType(zodType.element as z.ZodTypeAny)
      };
    }
    if (zodType instanceof z.ZodObject) {
      const shape = zodType.shape;
      const properties: Record<string, Record<string, unknown>> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToGeminiType(value);
        if (value instanceof z.ZodType && !value.isOptional()) {
          required.push(key);
        }
      }
      
      return {
        type: SchemaType.OBJECT,
        properties,
        required
      };
    }
    if (zodType instanceof z.ZodEnum) {
      return {
        type: SchemaType.STRING,
        enum: zodType.options
      };
    }
    if (zodType instanceof z.ZodOptional) {
      return zodToGeminiType(zodType.unwrap() as z.ZodTypeAny);
    }
    
    // Fallback to string for unknown types
    return { type: SchemaType.STRING };
  };

  const zodShape = schema instanceof z.ZodObject ? schema.shape : {};
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(zodShape)) {
    properties[key] = zodToGeminiType(value);
    if (value instanceof z.ZodType && !value.isOptional()) {
      required.push(key);
    }
  }

  return {
    functionDeclarations: [
      {
        name: functionName,
        description: description || `Function to submit ${functionName}`,
        parameters: {
          type: SchemaType.OBJECT,
          properties,
          required
        }
      }
    ]
  };
}

/**
 * Zod şemasından description'ları çıkaran yardımcı fonksiyon
 */
export function extractDescriptions(schema: z.ZodSchema): Record<string, string> {
  const descriptions: Record<string, string> = {};
  
  const extractFromShape = (shape: Record<string, z.ZodTypeAny>, prefix = '') => {
    for (const [key, value] of Object.entries(shape)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value instanceof z.ZodObject) {
        extractFromShape(value.shape, fullKey);
      } else if (value instanceof z.ZodArray && value.element instanceof z.ZodObject) {
        extractFromShape(value.element.shape, `${fullKey}[]`);
      } else if (value instanceof z.ZodOptional) {
        const unwrapped = value.unwrap() as z.ZodTypeAny;
        if (unwrapped instanceof z.ZodObject) {
          extractFromShape(unwrapped.shape, fullKey);
        }
      } else if (value.description) {
        descriptions[fullKey] = value.description;
      }
    }
  };

  if (schema instanceof z.ZodObject) {
    extractFromShape(schema.shape);
  }

  return descriptions;
}
