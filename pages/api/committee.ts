// pages/api/committee.ts 

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateAnalysis } from '../../services/ArbiterService';
import { Content } from "@google/generative-ai";

type ResponseData = { initialAnalysis: string; refinedAnalysis: string; };
type ErrorData = { error: string; };

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | ErrorData>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { task, history }: { task: string; history: Content[] } = req.body;
        
        if (!task || typeof task !== 'string') {
            return res.status(400).json({ error: 'Geçerli bir "task" alanı gereklidir.' });
        }
        if (!history || !Array.isArray(history)) {
             return res.status(400).json({ error: 'Geçerli bir "history" alanı gereklidir.' });
        }

        // Tüm iş mantığı servis katmanına devredildi.
        const finalDecisionObject = await generateAnalysis(task, history);

        // Artık gelen obje doğrudan JSON olarak gönderiliyor.
        res.status(200).json(finalDecisionObject);

    } catch (error: unknown) {
        console.error("API Handler Hatası:", error);
        const errorMessage = error instanceof Error ? error.message : 'Sunucuda bilinmeyen bir hata oluştu.';
        res.status(500).json({ error: errorMessage });
    }
}