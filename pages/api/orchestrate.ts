// pages/api/orchestrate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { OrchestratorService } from '../../services/OrchestratorService';
import { Content } from "@google/generative-ai";

// The config for the edge runtime is commented out, so we use Node.js runtime syntax.
// export const config = {
//   runtime: 'edge',
// };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Check if API key is set
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY environment variable is not set' });
    }

    // Access body from req.body instead of req.json()
    const { task, history }: { task: string; history: Content[] } = req.body;
    
    if (!task || typeof task !== 'string') {
      return res.status(400).json({ error: 'Geçerli bir "task" alanı gereklidir.' });
    }
    
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: 'Geçerli bir "history" alanı gereklidir.' });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    // OrchestratorService'i başlat
    const orchestrator = new OrchestratorService();
    
    // Write events directly to the response object
    try {
      // Stream başlangıç sinyali
      res.write('data: {"type":"stream_start"}\n\n');
      
      // Orchestrator'ı çalıştır ve event'leri stream et
      for await (const event of orchestrator.run(task, history)) {
        const eventData = `data: ${JSON.stringify(event)}\n\n`;
        res.write(eventData);
      }
      
      // Stream bitiş sinyali
      res.write('data: {"type":"stream_end"}\n\n');
      
    } catch (error) {
      console.error("Stream Hatası:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorData = `data: ${JSON.stringify({
        source: 'orchestrator',
        type: 'error',
        payload: { 
          error: errorMessage,
          message: 'Stream sırasında hata oluştu'
        },
        timestamp: Date.now()
      })}\n\n`;
      res.write(errorData);
    } finally {
      // End the response when the stream is finished
      res.end();
    }

  } catch (error: unknown) {
    console.error("API Handler Hatası:", error);
    // Note: If headers are already sent, this error response might not reach the client.
    // The error is logged on the server.
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : 'Sunucuda bilinmeyen bir hata oluştu.';
      res.status(500).json({ error: errorMessage });
    } else {
        res.end();
    }
  }
}
