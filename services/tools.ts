// services/tools.ts

// Google Custom Search API'sini doğrudan fetch ile çağırıyoruz

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

/**
 * Google Programmable Search Engine kullanarak internette CANLI arama yapar.
 * Bu fonksiyon artık sahte veri yerine gerçek sonuçlar döndürür.
 * @param query Arama sorgusu
 * @returns Arama sonuçlarının işlenmiş metin hali
 */
export async function performSearch(query: string): Promise<string> {
    console.log(`🔍 Gerçek zamanlı arama yapılıyor: "${query}"`);

    // 2. .env.local dosyasından API anahtarımızı ve Arama Motoru ID'mizi alıyoruz.
    const apiKey = process.env.CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.SEARCH_ENGINE_ID;

    // Anahtarların eksik olup olmadığını kontrol ediyoruz. Eksikse hata fırlatır.
    if (!apiKey || !searchEngineId) {
        console.error("HATA: Google Search API anahtarı veya Search Engine ID .env.local dosyasında eksik!");
        throw new Error("Google Search API anahtarı veya Search Engine ID bulunamadı.");
    }

    try {
        // Google Custom Search API'sini doğrudan fetch ile çağır
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`;
        
        const response = await fetch(url);
        const data = await response.json();

        const items = data.items;

        // 4. Eğer Google'dan bir sonuç gelmezse, AI'a bunu bildiriyoruz.
        if (!items || items.length === 0) {
            return `"${query}" için internette anlamlı bir sonuç bulunamadı.`;
        }

        // 5. Gelen sonuçları AI'ın en iyi anlayacağı temiz ve basit bir metne dönüştürüyoruz.
        const formattedResults = items
            .map((item: SearchResult, index: number) => 
                `Sonuç ${index + 1}:\nBaşlık: ${item.title}\nÖzet: ${item.snippet}\nLink: ${item.link}`
            )
            .join('\n\n---\n\n'); // Her sonucu arasına ayraç koyarak ayırıyoruz.

        return formattedResults;

    } catch (error) {
        console.error("Google Custom Search API hatası:", error);
        return `Arama sırasında bir hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
    }
}

/**
 * Kod örnekleri için arama yapan araç (Bu fonksiyon şimdilik aynı kalıyor)
 * @param query Kod örneği sorgusu
 * @returns Kod örnekleri
 */
export async function searchCodeExamples(query: string): Promise<string> {
    console.log(`💻 Kod örneği aranıyor: "${query}"`);
    
    // Bu fonksiyonu daha sonra GitHub API'sine veya başka bir servise bağlayabilirsin.
    // Şimdilik sahte verilerle çalışmaya devam etmesi sorun değil.
    const codeExamples: Record<string, string> = {
        "react hook": `// Custom Hook Örneği: useLocalStorage
import { useState, useEffect } from 'react';

export function useLocalStorage(key: string, initialValue: any) {
    const [value, setValue] = useState(() => {
        if (typeof window === 'undefined') return initialValue;
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}`,
        "nextjs api": `// Next.js API Route Örneği
// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    
    if (req.method === 'GET') {
        // Kullanıcı getir
        const user = await getUserById(id as string);
        return res.status(200).json(user);
    }
    
    if (req.method === 'PUT') {
        // Kullanıcı güncelle
        const updatedUser = await updateUser(id as string, req.body);
        return res.status(200).json(updatedUser);
    }
    
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
}`,
        "tailwind responsive": `/* TailwindCSS Responsive Design */
<div className="
    w-full 
    px-4 py-2 
    sm:px-6 sm:py-3 
    md:px-8 md:py-4 
    lg:px-12 lg:py-6
    text-sm 
    sm:text-base 
    md:text-lg 
    lg:text-xl
    bg-blue-500 
    hover:bg-blue-600 
    md:hover:bg-blue-700
    transition-colors 
    duration-200
">
    Responsive Button
</div>`,
    };

    const normalizedQuery = query.toLowerCase();
    for (const [key, value] of Object.entries(codeExamples)) {
        if (normalizedQuery.includes(key)) {
            return value;
        }
    }
    return `"${query}" için kod örneği bulunamadı.`;
}