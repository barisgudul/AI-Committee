// pages/api/analyze.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { AnalysisService } from '../../services/AnalysisService';
import { Content } from '@google/generative-ai';
import { fileStorage } from '../../lib/kv-storage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // API key kontrolü
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ 
        error: 'GOOGLE_API_KEY environment variable is not set' 
      });
    }

    // Request body'den parametreleri al ve doğrula
    const { 
      sessionId, 
      analysisType = 'full',
      task,
      history = []
    }: { 
      sessionId: string; 
      analysisType?: 'full' | 'security' | 'performance' | 'structure' | 'custom';
      task?: string;
      history?: Content[];
    } = req.body;

    // Session ID kontrolü
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID gereklidir' });
    }

    // Session'dan dosyaları al (async)
    const files = await fileStorage.get(sessionId);

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        error: 'Bu session için dosya bulunamadı',
        message: `Session ID: ${sessionId}. Lütfen önce dosyaları yükleyin.`
      });
    }

    // Stream headers'ı ayarla
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // AnalysisService'i başlat ve analizi gerçekleştir
    const analysisService = new AnalysisService();

    try {
      // Stream başlangıç sinyali
      res.write('data: {"type":"stream_start"}\n\n');

      // AnalysisService'ten gelen event'leri stream et
      for await (const event of analysisService.performAnalysis({ 
        task, 
        files, 
        history,
        analysisType 
      })) {
        const eventData = `data: ${JSON.stringify(event)}\n\n`;
        res.write(eventData);
      }

      // Stream bitiş sinyali
      res.write('data: {"type":"stream_end"}\n\n');

    } catch (streamError) {
      console.error('Stream Hatası:', streamError);
      const errorMessage = streamError instanceof Error 
        ? streamError.message 
        : String(streamError);
      const errorData = `data: ${JSON.stringify({
        source: 'api',
        type: 'error',
        payload: { 
          error: errorMessage,
          message: 'Kod analizi sırasında hata oluştu'
        },
        timestamp: Date.now()
      })}\n\n`;
      res.write(errorData);
    } finally {
      res.end();
    }

  } catch (error: unknown) {
    console.error('API Handler Hatası:', error);

    if (!res.headersSent) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Sunucuda bilinmeyen bir hata oluştu.';
      res.status(500).json({ error: errorMessage });
    } else {
      res.end();
    }
  }
}

// Next.js body parser config
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Fotoğraflar base64 formatında büyük olabilir
    },
  },
};

