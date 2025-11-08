// components/FileDropZone.tsx

import React, { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import styles from '../styles/FileDropZone.module.css';
import { FileUploadStatus, SUPPORTED_FILE_TYPES } from '../types/FileTypes';

// FileSystemEntry API type definitions (browser-specific)
interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
}

interface FileSystemFileEntry extends FileSystemEntry {
  isFile: true;
  file(successCallback: (file: File) => void, errorCallback?: (error: Error) => void): void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  isDirectory: true;
  createReader(): FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
  readEntries(successCallback: (entries: FileSystemEntry[]) => void, errorCallback?: (error: Error) => void): void;
}

interface FileDropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  uploadStatus: FileUploadStatus;
  disabled?: boolean;
  className?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ 
  onFilesSelected, 
  uploadStatus,
  disabled = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Ignored path kontrolü (node_modules, venv, .git vb. için)
  const shouldIgnoreEntry = useCallback((entryName: string, fullPath?: string): boolean => {
    const nameLower = entryName.toLowerCase();
    const pathLower = fullPath ? fullPath.toLowerCase() : nameLower;
    
    // Erken çıkış: node_modules, venv, .git, Pods içine girmeyi engelle
    if (pathLower.includes('node_modules') || 
        pathLower.includes('venv') || 
        pathLower.includes('.git') ||
        pathLower.includes('.next') ||
        pathLower.includes('dist') ||
        pathLower.includes('build') ||
        pathLower.includes('__pycache__') ||
        pathLower.includes('/pods/') ||
        pathLower.includes('pods/') ||
        entryName.toLowerCase() === 'pods') {
      return true;
    }
    
    // Ignored klasör isimleri ve build dosya uzantıları
    const ignoredNames = [
      'node_modules', 'venv', '.venv', 'env', '__pycache__',
      '.git', '.next', 'dist', 'build', 'out', '.cache',
      '.vscode', '.idea', '.DS_Store', 'Pods' // React Native Pods klasörü
    ];
    
    // Build dosya uzantılarını kontrol et
    const buildExtensions = ['.xcconfig', '.modulemap', '.pch', '.xcscheme', 
                             '.plist', '.asm', '.S', '.rc', '.meson', '.bak',
                             '.snap', '.tar.gz', '.dylib'];
    const fileExtension = entryName.toLowerCase().substring(entryName.lastIndexOf('.'));
    if (buildExtensions.includes(fileExtension)) {
      return true;
    }
    
    return ignoredNames.includes(nameLower);
  }, []);

  // Recursive klasör okuma fonksiyonu
  const readDirectoryEntries = useCallback(async (
    directoryEntry: FileSystemDirectoryEntry, 
    files: File[],
    parentPath = ''
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      // Klasör adını kontrol et - eğer ignored ise, bu klasöre hiç girmeyelim
      const entryName = directoryEntry.name;
      const currentPath = parentPath ? `${parentPath}/${entryName}` : entryName;
      
      if (shouldIgnoreEntry(entryName, currentPath)) {
        // Bu klasör ignored, içine girmeyelim
        resolve();
        return;
      }
      
      const directoryReader = directoryEntry.createReader();
      const entries: FileSystemEntry[] = [];
      
      const readEntries = () => {
        directoryReader.readEntries((newEntries) => {
          if (newEntries.length > 0) {
            entries.push(...newEntries);
            readEntries(); // Recursive - tüm alt klasörleri oku
          } else {
            // Tüm entries okundu, şimdi işle
            if (entries.length === 0) {
              resolve();
              return;
            }
            
            Promise.all(
              entries.map((entry) => {
                return new Promise<void>((entryResolve) => {
                  const entryName = entry.name;
                  const entryPath = `${currentPath}/${entryName}`;
                  
                  // Entry adını kontrol et - ignored ise atla
                  if (shouldIgnoreEntry(entryName, entryPath)) {
                    entryResolve();
                    return;
                  }
                  
                  if (entry.isDirectory) {
                    // Recursive: Alt klasöre gir, ama path'i ilete
                    readDirectoryEntries(entry as FileSystemDirectoryEntry, files, currentPath)
                      .then(() => entryResolve());
                  } else if (entry.isFile) {
                    // Dosya ise ekle
                    (entry as FileSystemFileEntry).file(
                      (file) => {
                        files.push(file);
                        entryResolve();
                      },
                      () => entryResolve() // Hata durumunda da devam et
                    );
                  } else {
                    entryResolve();
                  }
                });
              })
            ).then(() => resolve());
          }
        }, () => resolve()); // Hata durumunda da resolve
      };
      
      readEntries();
    });
  }, [shouldIgnoreEntry]);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled) return;

    const dataTransfer = e.dataTransfer;
    const items = dataTransfer?.items;
    
    if (items && items.length > 0) {
      // DataTransferItem API kullan (klasör içindeki dosyaları okumak için)
      const files: File[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // FileSystemEntry API (klasör desteği için)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((item as any).webkitGetAsEntry) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entry = (item as any).webkitGetAsEntry();
          
          if (entry && entry.isDirectory) {
            // Klasör tespit edildi - önce ignored kontrolü yap
            const entryName = entry.name;
            // Ignored kontrolü için shouldIgnoreEntry fonksiyonunu kullan
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const ignoredNames = ['node_modules', 'venv', '.venv', 'env', '__pycache__', '.git', '.next', 'dist', 'build', 'out', '.cache'];
            const isIgnored = ignoredNames.includes(entryName.toLowerCase()) || 
                             entryName.toLowerCase().includes('node_modules') ||
                             entryName.toLowerCase().includes('venv');
            
            if (!isIgnored) {
              // Klasör ignored değil - içindeki tüm dosyaları recursive oku
              await readDirectoryEntries(entry as FileSystemDirectoryEntry, files);
            }
            // Ignored ise hiçbir şey yapma
          } else if (entry && entry.isFile) {
            // Tek dosya
            (entry as FileSystemFileEntry).file(
              (file) => files.push(file),
              (error) => console.warn('Dosya okunamadı:', error)
            );
          }
        } else {
          // Fallback: Normal File API
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      
      if (files.length > 0) {
        onFilesSelected(files);
        return;
      }
    }
    
    // Fallback: Normal files API
    const { files: fileList } = dataTransfer || {};
    if (fileList && fileList.length > 0) {
      onFilesSelected(fileList);
    }
  }, [disabled, onFilesSelected, readDirectoryEntries]);

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Folder input kontrol - eğer klasör seçildiyse içindeki dosyaları kontrol et
      const files = Array.from(e.target.files);
      
      // Klasör seçildi mi kontrol et (webkitRelativePath var mı?)
      const hasFolderStructure = files.some(f => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (f as any).webkitRelativePath && (f as any).webkitRelativePath.length > 0;
      });
      
      if (!hasFolderStructure && files.length === 1) {
        // Sadece bir "dosya" geldi ve webkitRelativePath yok
        // Bu muhtemelen klasör adı, dosya değil
        const singleFile = files[0];
        if (!singleFile.name.includes('.')) {
          // Uzantı yok, muhtemelen klasör
          console.warn('Klasör seçildi ama içindeki dosyalar okunamadı. Lütfen tarayıcınızı kontrol edin.');
          return;
        }
      }
      
      onFilesSelected(e.target.files);
    }
  }, [onFilesSelected]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleFolderClick = useCallback(() => {
    if (!disabled) {
      folderInputRef.current?.click();
    }
  }, [disabled]);

  const isUploading = uploadStatus.status === 'uploading' || uploadStatus.status === 'processing';

  const containerClassName = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_FILE_TYPES.filter(t => t.startsWith('.')).join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error - webkitdirectory is not in the standard types
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        <div className={styles.content}>
          {isUploading ? (
            <>
              <div className={styles.spinner}></div>
              <p className={styles.message}>{uploadStatus.message || 'Yükleniyor...'}</p>
              {uploadStatus.progress > 0 && (
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${uploadStatus.progress}%` }}
                  ></div>
                </div>
              )}
            </>
          ) : uploadStatus.status === 'error' ? (
            <>
              <div className={styles.errorIcon}>⚠️</div>
              <p className={styles.errorMessage}>{uploadStatus.error}</p>
              <button 
                className={styles.retryButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                Tekrar Dene
              </button>
            </>
          ) : uploadStatus.status === 'completed' ? (
            <>
              <div className={styles.successIcon}>✓</div>
              <p className={styles.successMessage}>{uploadStatus.message}</p>
            </>
          ) : (
            <>
              <div className={styles.icon}>📁</div>
              <h3 className={styles.title}>Dosya veya Klasör Yükle</h3>
              <p className={styles.description}>
                Kod dosyalarını buraya sürükleyin veya tıklayarak seçin
              </p>
              <div className={styles.buttons}>
                <button 
                  className={styles.primaryButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  Dosya Seç
                </button>
                <button 
                  className={styles.secondaryButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFolderClick();
                  }}
                >
                  Klasör Seç
                </button>
              </div>
              <p className={styles.supportedTypes}>
                Desteklenen: {SUPPORTED_FILE_TYPES.filter(t => t.startsWith('.')).slice(0, 8).join(', ')}
                {SUPPORTED_FILE_TYPES.filter(t => t.startsWith('.')).length > 8 && ' ve daha fazlası'}
              </p>
              <p className={styles.ignoredPaths}>
                ⏭️ Otomatik atlanır: node_modules, venv, .git, .next, dist, build, .vscode, __pycache__, ...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

