// pages/api/upload-files.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { 
  UploadedFile, 
  SUPPORTED_FILE_TYPES, 
  FILE_SIZE_LIMITS,
  getLanguageFromFileType 
} from '../../types/FileTypes';

// Session-based storage (geçici - production'da Redis/Memory cache kullanılabilir)
// Global object kullanarak hot reload'dan koruma
declare global {
  var __fileStorage: Map<string, UploadedFile[]> | undefined;
}

// Hot reload'dan korumak için global object kullan
const fileStorage = global.__fileStorage || new Map<string, UploadedFile[]>();
if (!global.__fileStorage) {
  global.__fileStorage = fileStorage;
}

// Session timeout - 1 saat
const SESSION_TIMEOUT = 60 * 60 * 1000;

// Session cleanup fonksiyonu
const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [sessionId, files] of fileStorage.entries()) {
    if (files.length > 0 && now - files[0].uploadedAt > SESSION_TIMEOUT) {
      fileStorage.delete(sessionId);
    }
  }
};

// Her 10 dakikada bir cleanup çalıştır
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

/**
 * Dosya tipinin desteklenip desteklenmediğini kontrol et
 */
function isFileTypeSupported(fileName: string): boolean {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const nameOnly = fileName.toLowerCase();
  
  // Extension ile kontrol
  if (SUPPORTED_FILE_TYPES.includes(ext as never)) {
    return true;
  }
  
  // Tam dosya adı ile kontrol (dockerfile, makefile, vb.)
  if (SUPPORTED_FILE_TYPES.includes(nameOnly as never)) {
    return true;
  }
  
  // Özel durum: Uzantısız config dosyaları
  const configFiles = ['dockerfile', 'makefile', 'cmakefile', 'gemfile', 'rakefile', 'procfile'];
  if (configFiles.includes(nameOnly)) {
    return true;
  }
  
  // Başında nokta olan config dosyaları (.gitignore, .env, .eslintrc vb.)
  if (nameOnly.startsWith('.') && nameOnly.length > 1) {
    return true; // Tüm .* dosyalarını kabul et (config dosyaları)
  }
  
  // Genel kurallar: Config/text tabanlı dosyaları kabul et
  const textExtensions = ['.ini', '.conf', '.cfg', '.config', '.yaml', '.yml', '.toml', '.lock'];
  if (textExtensions.includes(ext)) {
    return true;
  }
  
  // README, LICENSE vb. uzantısız standart dosyalar
  const standardFiles = ['readme', 'license', 'license.md', 'changelog', 'changelog.md', 'contributing', 'authors', 'contributors', 'code_of_conduct'];
  if (standardFiles.includes(nameOnly)) {
    return true;
  }
  
  return false;
}

/**
 * Dosya boyutunu kontrol et
 */
function validateFileSize(size: number, currentTotalSize: number): { valid: boolean; error?: string } {
  if (size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Dosya boyutu ${Math.round(size / 1024 / 1024)}MB. Maksimum ${FILE_SIZE_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB olabilir.` 
    };
  }
  
  if (currentTotalSize + size > FILE_SIZE_LIMITS.MAX_TOTAL_SIZE) {
    return { 
      valid: false, 
      error: `Toplam dosya boyutu limiti aşıldı. Maksimum ${FILE_SIZE_LIMITS.MAX_TOTAL_SIZE / 1024 / 1024}MB.` 
    };
  }
  
  return { valid: true };
}

/**
 * File input'tan gelen dosyaları parse et
 */
async function parseFilesFromRequest(req: NextApiRequest): Promise<UploadedFile[]> {
  // Body'den dosya verilerini al (client tarafında FileReader ile base64 encode edilmiş)
  const { files } = req.body as { files: Array<{ name: string; path: string; content: string; size: number }> };
  
  if (!files || !Array.isArray(files)) {
    throw new Error('Geçersiz dosya verisi');
  }
  
  const uploadedFiles: UploadedFile[] = [];
  let totalSize = 0;
  
  // Duplicate dosyaları takip et (path ile)
  const seenPaths = new Set<string>();
  let duplicateCount = 0;
  
  for (const file of files) {
    // Duplicate kontrol - aynı path'i daha önce gördük mü?
    if (seenPaths.has(file.path)) {
      console.warn(`Duplicate dosya atlanıyor: ${file.path}`);
      duplicateCount++;
      continue;
    }
    
    // Dosya tipi kontrolü
    if (!isFileTypeSupported(file.name)) {
      console.warn(`Desteklenmeyen dosya tipi atlanıyor: ${file.name}`);
      continue;
    }
    
    // Boyut kontrolü
    const sizeValidation = validateFileSize(file.size, totalSize);
    if (!sizeValidation.valid) {
      throw new Error(sizeValidation.error);
    }
    
    totalSize += file.size;
    
    // Dosya limitini kontrol et
    if (uploadedFiles.length >= FILE_SIZE_LIMITS.MAX_FILE_COUNT) {
      throw new Error(`Maksimum ${FILE_SIZE_LIMITS.MAX_FILE_COUNT} dosya yüklenebilir`);
    }
    
    // SeenPaths'e ekle (duplicate'i engelle)
    seenPaths.add(file.path);
    
    // UploadedFile oluştur
    const uploadedFile: UploadedFile = {
      id: uuidv4(),
      name: file.name,
      path: file.path || file.name,
      type: file.name.substring(file.name.lastIndexOf('.')),
      size: file.size,
      content: file.content,
      uploadedAt: Date.now(),
      language: getLanguageFromFileType(file.name)
    };
    
    uploadedFiles.push(uploadedFile);
  }
  
  if (duplicateCount > 0) {
    console.info(`Backend: ${duplicateCount} duplicate dosya filtrelendi`);
  }
  
  return uploadedFiles;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    // Request body size kontrolü (JSON string uzunluğu)
    // Not: Next.js config ile 10MB limit ayarlandı, bu kontrol ek güvenlik için
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = parseInt(contentLength, 10) / (1024 * 1024);
      if (sizeInMB > 9) { // 9MB limit (Next.js config 10MB, biraz güvenlik payı)
        return res.status(413).json({ 
          error: 'Request çok büyük',
          message: `Request boyutu ${sizeInMB.toFixed(2)}MB. Maksimum 9MB. Lütfen daha küçük batch'ler gönderin.`
        });
      }
    }
    
    // Session ID al veya oluştur (basit implementasyon - production'da JWT kullanılabilir)
    const sessionId = req.headers['x-session-id'] as string || uuidv4();
    
    // Dosyaları parse et
    const uploadedFiles = await parseFilesFromRequest(req);
    
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Hiçbir geçerli dosya yüklenmedi',
        message: 'Lütfen desteklenen dosya tiplerini yükleyin'
      });
    }
    
    // Session'a MERGE et (önceki dosyaları koru, yeni dosyaları ekle)
    const existingFiles = fileStorage.get(sessionId) || [];
    
    // Duplicate kontrol: Existing files'dan gelen path'leri tanı
    const existingPaths = new Set(existingFiles.map(f => f.path));
    let finalDuplicateCount = 0;
    
    // Yeni dosyalardan duplicate'leri filtrele
    const filteredNewFiles = uploadedFiles.filter(file => {
      if (existingPaths.has(file.path)) {
        console.warn(`Duplicate dosya atlanıyor (backend final): ${file.path}`);
        finalDuplicateCount++;
        return false;
      }
      return true;
    });
    
    // Birleştir
    const mergedFiles = [...existingFiles, ...filteredNewFiles];
    
    // TOPLAM dosya sayısı kontrolü (merge sonrası)
    if (mergedFiles.length > FILE_SIZE_LIMITS.MAX_FILE_COUNT) {
      return res.status(400).json({
        error: `Maksimum dosya sayısı aşıldı`,
        message: `Session'da ${existingFiles.length} dosya var, ${filteredNewFiles.length} yeni dosya eklenmek isteniyor. Toplam ${mergedFiles.length} dosya olur. Maksimum ${FILE_SIZE_LIMITS.MAX_FILE_COUNT} dosya yüklenebilir.`,
        currentCount: existingFiles.length,
        newCount: filteredNewFiles.length,
        totalCount: mergedFiles.length,
        limit: FILE_SIZE_LIMITS.MAX_FILE_COUNT
      });
    }
    
    // TOPLAM dosya boyutu kontrolü (merge sonrası)
    const totalSize = mergedFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > FILE_SIZE_LIMITS.MAX_TOTAL_SIZE) {
      return res.status(400).json({
        error: `Maksimum toplam dosya boyutu aşıldı`,
        message: `Toplam dosya boyutu ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maksimum ${(FILE_SIZE_LIMITS.MAX_TOTAL_SIZE / 1024 / 1024).toFixed(2)}MB olabilir.`,
        currentSize: totalSize,
        limit: FILE_SIZE_LIMITS.MAX_TOTAL_SIZE
      });
    }
    
    // Session'a kaydet (SET ile REPLACE, değil MERGE!)
    fileStorage.set(sessionId, mergedFiles);
    
    // Debug: Storage kaydı
    console.log(`[UPLOAD-API] SessionId: ${sessionId}`);
    console.log(`[UPLOAD-API] Files saved: ${mergedFiles.length} (${filteredNewFiles.length} new)`);
    console.log(`[UPLOAD-API] Storage size after save: ${fileStorage.size}`);
    console.log(`[UPLOAD-API] Storage keys:`, Array.from(fileStorage.keys()));
    
    if (finalDuplicateCount > 0) {
      console.info(`Final: ${finalDuplicateCount} duplicate session'dan filtrelendi`);
    }
    
    // Başarılı response - sadece yeni dosyaları döndür (UI'da göstermek için)
    return res.status(200).json({
      success: true,
      sessionId,
      files: filteredNewFiles.map(f => ({
        id: f.id,
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.size,
        language: f.language,
        uploadedAt: f.uploadedAt
      })),
      totalSize: filteredNewFiles.reduce((sum, f) => sum + f.size, 0),
      count: filteredNewFiles.length,
      allFilesCount: mergedFiles.length,  // Session'daki toplam
      duplicateCount: finalDuplicateCount
    });
    
  } catch (error: unknown) {
    console.error('File upload error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Dosya yükleme sırasında hata oluştu' 
    });
  }
}

// Export storage for other API routes
export { fileStorage };

// Next.js body parser config - request body size limit'ini artır
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 10MB limit (chunked upload için yeterli)
    },
  },
};

