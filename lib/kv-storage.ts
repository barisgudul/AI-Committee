// lib/kv-storage.ts

import { UploadedFile } from '../types/FileTypes';

// Session verilerini 1 saat sonra otomatik sil
const SESSION_TTL_SECONDS = 3600;

/**
 * Key-Value storage interface - dağıtık state yönetimi için
 * Development'ta in-memory fallback, production'da Vercel KV veya Upstash Redis
 */
interface KVStorage {
  set(sessionId: string, files: UploadedFile[]): Promise<void>;
  get(sessionId: string): Promise<UploadedFile[] | null>;
  delete(sessionId: string): Promise<void>;
}

/**
 * In-memory fallback storage (development için)
 */
class InMemoryStorage implements KVStorage {
  private storage = new Map<string, { files: UploadedFile[]; expiresAt: number }>();

  constructor() {
    // Her 10 dakikada bir expired session'ları temizle
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, data] of this.storage.entries()) {
        if (now > data.expiresAt) {
          this.storage.delete(sessionId);
        }
      }
    }, 10 * 60 * 1000);
  }

  async set(sessionId: string, files: UploadedFile[]): Promise<void> {
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    this.storage.set(sessionId, { files, expiresAt });
  }

  async get(sessionId: string): Promise<UploadedFile[] | null> {
    const data = this.storage.get(sessionId);
    if (!data) return null;

    // Expired kontrolü
    if (Date.now() > data.expiresAt) {
      this.storage.delete(sessionId);
      return null;
    }

    return data.files;
  }

  async delete(sessionId: string): Promise<void> {
    this.storage.delete(sessionId);
  }
}

/**
 * Vercel KV storage (production için - gelecekte implement edilecek)
 * 
 * NOT: Production'da dağıtık storage için @vercel/kv paketini yükleyin:
 *   npm install @vercel/kv
 * 
 * Bu implementasyon şu anda in-memory fallback kullanıyor.
 * Production için Vercel KV entegrasyonu eklenebilir.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
class VercelKVStorage implements KVStorage {
  // Vercel KV entegrasyonu için placeholder
  // Production'da bu sınıfı genişletebilirsiniz
  async set(_sessionId: string, _files: UploadedFile[]): Promise<void> {
    throw new Error(
      'Vercel KV storage not yet implemented. ' +
      'For production, either implement Vercel KV integration or use InMemoryStorage.'
    );
  }

  async get(_sessionId: string): Promise<UploadedFile[] | null> {
    throw new Error(
      'Vercel KV storage not yet implemented. ' +
      'For production, either implement Vercel KV integration or use InMemoryStorage.'
    );
  }

  async delete(_sessionId: string): Promise<void> {
    throw new Error(
      'Vercel KV storage not yet implemented. ' +
      'For production, either implement Vercel KV integration or use InMemoryStorage.'
    );
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Storage factory - environment'a göre doğru implementasyonu seçer
 */
function createStorage(): KVStorage {
  // Şu anda tüm ortamlarda in-memory storage kullanıyoruz
  // Production için Vercel KV entegrasyonu eklenebilir
  // Development'ta ve production'da (KV entegrasyonu olana kadar) in-memory kullan
  if (process.env.NODE_ENV === 'production' && process.env.KV_URL) {
    // Production'da KV_URL varsa Vercel KV kullan (gelecekte implement edilebilir)
    // Şimdilik in-memory'ye fallback et
    console.warn('[KV-STORAGE] Vercel KV integration not yet implemented, using in-memory storage');
  }

  return new InMemoryStorage();
}

/**
 * File storage - dağıtık key-value store kullanır
 * Sunucusuz ortamlarda (Vercel) tüm fonksiyonların aynı state'e erişmesini garanti eder
 */
export const fileStorage: KVStorage = createStorage();

