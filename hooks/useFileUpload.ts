// hooks/useFileUpload.ts

import { useState, useCallback, useRef } from 'react';
import { UploadedFile, FileUploadStatus, FILE_SIZE_LIMITS } from '../types/FileTypes';
import { v4 as uuidv4 } from 'uuid';

interface UseFileUploadReturn {
  files: UploadedFile[];
  uploadStatus: FileUploadStatus;
  sessionId: string | null;
  uploadFiles: (fileList: FileList | File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  clearAllFiles: () => void;
  getFileContent: (fileId: string) => string | null;
  totalSize: number;
}

/**
 * Yüklemede görmezden gelinecek klasörler ve dosyalar
 */
const IGNORED_PATHS = [
  // Node.js
  'node_modules',
  'npm-debug.log',
  'yarn-error.log',
  '.pnpm-store',
  
  // Python
  'venv',
  'env',
  '.venv',
  '__pycache__',
  '.pytest_cache',
  '.egg-info',
  '*.egg',
  'dist',
  'build',
  
  // Git
  '.git',
  // .gitignore yüklenebilir (config dosyası)
  
  // Build outputs
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
  
  // IDEs
  '.vscode',
  '.idea',
  '.DS_Store',
  'Thumbs.db',
  '*.swp',
  '*.swo',
  
  // Dependencies
  '.yarn',
  // Lock dosyaları yüklenebilir (bazen analiz için gerekli)
  
  // React Native / iOS
  'Pods', // CocoaPods dependencies
  'ios', // iOS build klasörü (genelde build çıktıları içerir)
  'android/build', // Android build çıktıları
  'android/app/build',
  
  // OS
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  
  // iOS/React Native build files
  '*.xcconfig',
  '*.modulemap',
  '*.pch',
  '*.xcscheme',
  '*.plist', // Info.plist hariç, ama genelde build dosyaları
  '*.asm',
  '*.S', // Assembly files
  '*.rc',
  '*.rc.in',
  '*.manifest',
  '*.meson',
  '*.bak',
  '*.snap', // Jest snapshots
  '*.tar.gz',
  '*.dylib', // Dynamic libraries
  '*.dylib.*',
  'hermes', // Binary executables
  'hermesc',
  'hermes-lit',
  'vlog_is_on.h.in',
  'logging.h.in',
  'stl_logging.h.in',
  'raw_logging.h.in',
  'version.h.in',
  'vcs_version.h.in',
  'Doxyfile.in.in',
  'config.h.in',
  'config.h.cmake.in',
];

/**
 * Bir path'in ignored olup olmadığını kontrol et
 */
function shouldIgnorePath(filePath: string): boolean {
  const pathLower = filePath.toLowerCase();
  const pathParts = pathLower.split('/').filter(p => p.length > 0);
  
  // Erken çıkış: Eğer path çok uzunsa veya node_modules içindeyse direkt ignore
  if (pathLower.includes('node_modules') || 
      pathLower.includes('venv') || 
      pathLower.includes('.git') ||
      pathLower.includes('/pods/') ||
      pathLower.includes('pods/') ||
      pathParts[0] === 'pods') {
    return true;
  }
  
  for (const ignoredPath of IGNORED_PATHS) {
    const ignoredLower = ignoredPath.toLowerCase().replace(/\/+$/, ''); // Trailing slash temizle
    
    // Tam klasör adı eşleştir - pathParts içinde VAR mı?
    if (pathParts.includes(ignoredLower)) {
      return true;
    }
    
    // Path içinde ignored klasör var mı? (daha agresif)
    // "src/node_modules/file.js" → "node_modules" bulunur
    if (pathLower.includes('/' + ignoredLower + '/') || 
        pathLower.startsWith(ignoredLower + '/') ||
        pathLower === ignoredLower) {
      return true;
    }
    
    // Wildcard dosyalar (*.xcconfig, *.modulemap, vb.)
    if (ignoredPath.includes('*')) {
      const pattern = ignoredPath.replace(/\*/g, '').toLowerCase();
      // Extension kontrolü - dosya adı pattern ile bitiyor mu?
      if (pathLower.endsWith(pattern)) {
        return true;
      }
      // Veya path içinde pattern var mı? (daha geniş kontrol)
      if (pathLower.includes(pattern)) {
        return true;
      }
    }
    
    // Exact match - belirli dosya adları (hermes, hermesc, vb.)
    const exactIgnoreNames = ['hermes', 'hermesc', 'hermes-lit'];
    if (exactIgnoreNames.includes(pathLower.split('/').pop() || '')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Dosya içeriğini okuma fonksiyonu
 */
async function readFileContent(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    // Dosya yolunu kontrol et
    // @ts-expect-error - webkitRelativePath standart değil ama çoğu tarayıcıda var
    const filePath = (file.webkitRelativePath || file.name) as string;
    
    // Klasör kontrolü: Eğer dosya boyutu 0 ise ve uzantı yoksa muhtemelen klasör
    if (file.size === 0 && !file.name.includes('.')) {
      console.warn(`Klasör atlanıyor (dosya değil): ${file.name}`);
      resolve(null);
      return;
    }
    
    // Ignored path'i kontrol et
    if (shouldIgnorePath(filePath)) {
      console.warn(`Ignored path atlanıyor: ${filePath}`);
      resolve(null);
      return;
    }

    // Dosya boyutu limiti kontrol et (çok büyük dosyaları atla)
    if (file.size > 5 * 1024 * 1024) {
      console.warn(`Dosya çok büyük, atlanıyor: ${file.name} (${file.size} bytes)`);
      resolve(null);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // İçeriği kontrol et - çok uzun NULL karakterleri atla (binary dosya)
        if (content && content.length > 0) {
          // UTF-8 olmayan karakterleri filtrele
          const cleanedContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
          if (cleanedContent.length > 0) {
            resolve(cleanedContent);
          } else {
            console.warn(`Dosya okundu ama içeriği boş/binary: ${file.name}`);
            resolve(null);
          }
        } else {
          console.warn(`Dosya boş: ${file.name}`);
          resolve(null);
        }
      } catch (error) {
        console.warn(`İçerik işleme hatası (${file.name}):`, error);
        resolve(null);
      }
    };

    reader.onerror = () => {
      console.warn(`Dosya okunamadı: ${file.name}`);
      resolve(null);
    };

    reader.onabort = () => {
      console.warn(`Dosya okuma iptal edildi: ${file.name}`);
      resolve(null);
    };

    try {
      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      console.warn(`ReadAsText hatası (${file.name}):`, error);
      resolve(null);
    }
  });
}

/**
 * Klasör yapısını koru - File.webkitRelativePath kullan
 */
function getRelativePath(file: File): string {
  // @ts-expect-error - webkitRelativePath standart değil ama çoğu tarayıcıda var
  const webkitPath = file.webkitRelativePath as string | undefined;
  
  if (webkitPath && webkitPath.length > 0) {
    // webkitRelativePath varsa onu kullan (klasör seçildiğinde bu olur)
    // Örnek: "components/FileList.tsx" veya "src/app/main.ts"
    return webkitPath;
  }
  
  // Tek dosya seçildiğinde sadece dosya adını kullan
  // Örnek: "FileList.tsx"
  return file.name;
}

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({
    status: 'idle',
    progress: 0
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    setUploadStatus({ status: 'uploading', progress: 0, message: 'Dosyalar okunuyor...' });
    
    try {
      const filesArray = Array.from(fileList);
      const uploadedFiles: Array<{ name: string; path: string; content: string; size: number }> = [];
      let skippedCount = 0;
      let ignoredCount = 0;
      let duplicateCount = 0;
      
      // Duplicate dosyaları takip et (relative path ile - backend'e gönderilecek path)
      const seenPaths = new Set<string>();
      
      // Folder seçimi kontrolü - eğer klasör seçildiyse loglama yap
      const folderSelected = filesArray.some(f => {
        // @ts-expect-error - webkitRelativePath
        return f.webkitRelativePath && f.webkitRelativePath.length > 0;
      });
      
      if (folderSelected && process.env.NODE_ENV === 'development') {
        console.log(`[FOLDER] Klasör seçildi, ${filesArray.length} dosya bulundu`);
      }
      
      // İlk geçiş: Tüm dosyaları filtrele (okumadan önce)
      const validFiles: File[] = [];
      for (const file of filesArray) {
        // @ts-expect-error - webkitRelativePath
        const webkitPath = file.webkitRelativePath as string | undefined;
        const filePath = webkitPath || file.name;
        
        // 1. Ignored path kontrolü (en önce - node_modules, venv, .git)
        if (shouldIgnorePath(filePath)) {
          ignoredCount++;
          continue;
        }
        
        // 2. Relative path'i al
        const relativePath = getRelativePath(file);
        
        // 3. Duplicate kontrolü (relative path ile)
        if (seenPaths.has(relativePath)) {
          duplicateCount++;
          continue;
        }
        
        // 4. Valid dosya - seenPaths'e ekle ve işleme listesine ekle
        seenPaths.add(relativePath);
        validFiles.push(file);
      }
      
      // İkinci geçiş: Sadece geçerli dosyaları oku
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const progress = Math.round((i / validFiles.length) * 50); // İlk %50 okuma
        
        setUploadStatus({ 
          status: 'uploading', 
          progress,
          message: `Okunuyor: ${file.name}... (${i + 1}/${validFiles.length})` 
        });
        
        try {
          const content = await readFileContent(file);
          
          // Dosya okunamamışsa veya boşsa atla
          if (!content) {
            skippedCount++;
            continue;
          }
          
          const relativePath = getRelativePath(file);
          
          uploadedFiles.push({
            name: file.name,
            path: relativePath,
            content,
            size: file.size
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`Dosya işleme hatası (${file.name}):`, error);
          }
          skippedCount++;
        }
      }
      
      if (uploadedFiles.length === 0) {
        // Eğer sadece ignored klasörler seçildiyse, bilgilendirme mesajı göster
        if (ignoredCount > 0 && skippedCount === 0 && duplicateCount === 0) {
          // Sadece ignored klasörler var, hata vermek yerine kullanıcıyı bilgilendir
          console.info(`Seçilen klasör sadece ignored dosyalar içeriyor: ${ignoredCount} klasör`);
          
          setUploadStatus({ 
            status: 'error', 
            progress: 0,
            error: `⏭️ Seçtiğiniz klasör sadece çalışma klasörleri içeriyor (node_modules, venv, .git vb.). Lütfen kod dosyaları içeren bir klasör seçin.` 
          });
          
          // 5 saniye sonra idle'a dön
          setTimeout(() => {
            setUploadStatus({ status: 'idle', progress: 0 });
          }, 5000);
          return;
        }
        
        // Eğer çok az dosya skip edildiyse (1-3 dosya), yeniden deneme öner
        if ((ignoredCount > 0 || skippedCount > 0) && (ignoredCount + skippedCount + duplicateCount) <= 3) {
          // Tarayıcı File API sınırlaması yaşanıyor veya klasör seçimi başarısız
          console.warn(`Dosya okuma sorunu: ${ignoredCount} ignored, ${skippedCount} skip, ${duplicateCount} duplicate`);
          
          // Eğer sadece 1 dosya skip edildiyse ve bu bir klasör adıysa, özel mesaj
          if (skippedCount === 1 && ignoredCount === 0) {
            setUploadStatus({ 
              status: 'error', 
              progress: 0,
              error: `⚠️ Klasör seçimi başarısız oldu. Tarayıcı klasör içeriğini okuyamadı.

**Çözüm:**
1. **Sürükle-Bırak kullanın**: Klasörü doğrudan buraya sürükleyip bırakın (daha güvenilir)
2. **Alt klasör seçin**: "Klasör Seç" yerine "Dosya Seç" ile birkaç dosyayı manuel seçin
3. **Chrome/Safari kullanın**: Firefox'ta klasör seçimi sınırlı olabilir` 
            });
          } else {
            setUploadStatus({ 
              status: 'error', 
              progress: 0,
              error: `⚠️ Klasördeki dosyaların çoğu okunamamadı. Tarayıcı kısıtlaması olabilir. Deneyin:
1. **Sürükle-Bırak**: Klasörü doğrudan buraya sürükleyin (daha güvenilir)
2. Tarayıcı sekmesini yenileyin ve yeniden deneyin
3. Proje root klasörü yerine 'src/' gibi alt klasör seçin` 
            });
          }
          
          // 5 saniye sonra idle'a dön
          setTimeout(() => {
            setUploadStatus({ status: 'idle', progress: 0 });
          }, 5000);
          return;
        }
        
        // Normal hata durumu
        const details = [];
        if (ignoredCount > 0) details.push(`${ignoredCount} klasör/dosya göz ardı`);
        if (duplicateCount > 0) details.push(`${duplicateCount} duplicate atlandı`);
        if (skippedCount > 0) details.push(`${skippedCount} dosya filtrele`);
        
        throw new Error(
          details.length > 0
            ? `Hiçbir uyumlu dosya bulunamadı (${details.join(', ')}).` 
            : 'Hiçbir dosya seçilmedi'
        );
      }
      
      // Uyarı göster eğer bazı dosyalar atlandıysa (sadece development)
      if (process.env.NODE_ENV === 'development') {
        if (skippedCount > 0 || ignoredCount > 0 || duplicateCount > 0) {
          const warnings = [];
          if (ignoredCount > 0) warnings.push(`${ignoredCount} ignored path`);
          if (duplicateCount > 0) warnings.push(`${duplicateCount} duplicate`);
          if (skippedCount > 0) warnings.push(`${skippedCount} dosya atlandı`);
          console.log(`[UPLOAD] Filtreleme: ${warnings.join(', ')}`);
        }
      }
      
      // Chunked upload: Çok fazla dosya varsa batch'ler halinde gönder
      // Batch boyutu küçük tut (dosyalar büyük olabilir - JSON encoding ile)
      const BATCH_SIZE = 50; // Her batch'te maksimum 50 dosya (1MB limit için güvenli)
      const allNewFiles: UploadedFile[] = [];
      let currentSessionId = sessionIdRef.current;
      
      // Dosyaları batch'lere böl
      for (let i = 0; i < uploadedFiles.length; i += BATCH_SIZE) {
        const batch = uploadedFiles.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(uploadedFiles.length / BATCH_SIZE);
        
        setUploadStatus({ 
          status: 'processing', 
          progress: 50 + Math.round((i / uploadedFiles.length) * 40),
          message: `Sunucuya gönderiliyor... (${batchNumber}/${totalBatches})` 
        });
        
        try {
          const response = await fetch('/api/upload-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(currentSessionId && { 'x-session-id': currentSessionId })
            },
            body: JSON.stringify({ files: batch })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Sunucu hatası' }));
            const errorMessage = errorData.error || `Batch ${batchNumber} yükleme başarısız`;
            
            // Eğer batch'te hiç geçerli dosya yoksa, bu normal bir durum (skip)
            // "Hiçbir geçerli dosya yüklenmedi" hatası = Batch'teki tüm dosyalar desteklenmiyor
            if (errorMessage.includes('Hiçbir geçerli dosya') || 
                errorMessage.includes('geçerli dosya bulunamadı')) {
              // Bu batch'te geçerli dosya yok, normal - skip et
              console.log(`[UPLOAD] Batch ${batchNumber} skip edildi (geçerli dosya yok)`);
              continue;
            }
            
            // Diğer hatalar için throw et
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          // Backend'den dosya gelmediyse (boş batch), skip et
          if (!data.files || data.files.length === 0) {
            console.log(`[UPLOAD] Batch ${batchNumber} skip edildi (backend dosya döndürmedi)`);
            continue;
          }
          
          // Session ID'yi sakla (her batch'ten - backend her zaman döndürmeli)
          if (data.sessionId) {
            // SessionId her zaman güncelle (çünkü backend her batch'te aynı sessionId'yi döndürür)
            if (!currentSessionId || currentSessionId !== data.sessionId) {
              console.log(`[UPLOAD] SessionId set from batch ${batchNumber}:`, data.sessionId);
              setSessionId(data.sessionId);
              currentSessionId = data.sessionId;
              sessionIdRef.current = data.sessionId;
            }
          }
          
          // Dosyaları topla
          const batchFiles: UploadedFile[] = data.files.map((f: UploadedFile) => ({
            ...f,
            content: batch.find(uf => uf.name === f.name)?.content || ''
          }));
          
          allNewFiles.push(...batchFiles);
          
        } catch (error) {
          console.error(`Batch ${batchNumber} hatası:`, error);
          // Bir batch başarısız olsa bile diğerlerini denemeye devam et
          if (batchNumber === 1) {
            // İlk batch başarısızsa tüm işlemi durdur
            throw error;
          }
        }
      }
      
      // Tüm dosyaları state'e ekle
      setFiles(prevFiles => [...prevFiles, ...allNewFiles]);
      
      // Detaylı mesaj oluştur
      const messageParts = [`${allNewFiles.length} dosya yüklendi`];
      if (ignoredCount > 0) messageParts.push(`${ignoredCount} klasör atlandı`);
      if (duplicateCount > 0) messageParts.push(`${duplicateCount} duplicate filtrele`);
      if (skippedCount > 0) messageParts.push(`${skippedCount} dosya filtrele`);
      
      const message = messageParts.join(', ');
      
      setUploadStatus({ 
        status: 'completed', 
        progress: 100,
        message
      });
      
      // 2 saniye sonra idle'a dön
      setTimeout(() => {
        setUploadStatus({ status: 'idle', progress: 0 });
      }, 2000);
      
    } catch (error) {
      console.error('File upload error:', error);
      setUploadStatus({ 
        status: 'error', 
        progress: 0,
        error: error instanceof Error ? error.message : 'Dosya yükleme hatası' 
      });
      
      // 5 saniye sonra idle'a dön
      setTimeout(() => {
        setUploadStatus({ status: 'idle', progress: 0 });
      }, 5000);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setSessionId(null);
    sessionIdRef.current = null;
    setUploadStatus({ status: 'idle', progress: 0 });
  }, []);

  const getFileContent = useCallback((fileId: string): string | null => {
    const file = files.find(f => f.id === fileId);
    return file?.content || null;
  }, [files]);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return {
    files,
    uploadStatus,
    sessionId,
    uploadFiles,
    removeFile,
    clearAllFiles,
    getFileContent,
    totalSize
  };
}

