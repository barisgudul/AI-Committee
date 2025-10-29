// components/FileList.tsx

import React, { useState, useMemo } from 'react';
import styles from '../styles/FileList.module.css';
import { UploadedFile, formatFileSize } from '../types/FileTypes';
import { CodeViewer } from './CodeViewer';

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
  onClearAll: () => void;
  getFileContent: (fileId: string) => string | null;
}

export const FileList: React.FC<FileListProps> = ({ 
  files, 
  onRemoveFile, 
  onClearAll,
  getFileContent 
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtreleme
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const term = searchTerm.toLowerCase();
    return files.filter(f => 
      f.name.toLowerCase().includes(term) || 
      f.path.toLowerCase().includes(term)
    );
  }, [files, searchTerm]);

  // Toplam boyut
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  // Seçili dosya
  const selectedFile = selectedFileId 
    ? files.find(f => f.id === selectedFileId) 
    : null;

  if (files.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📂</div>
        <p>Henüz dosya yüklenmedi</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h3>Yüklenen Dosyalar</h3>
            <span className={styles.badge}>
              {files.length} dosya • {formatFileSize(totalSize)}
            </span>
          </div>
          <button 
            className={styles.clearButton}
            onClick={onClearAll}
            title="Tümünü Temizle"
          >
            🗑️ Temizle
          </button>
        </div>

        {files.length > 5 && (
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Dosya ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        )}

        <div className={styles.fileList}>
          {filteredFiles.map((file) => (
            <div 
              key={file.id} 
              className={styles.fileItem}
              onClick={() => setSelectedFileId(file.id)}
            >
              <div className={styles.fileIcon}>
                {getFileIcon(file.type)}
              </div>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileMeta}>
                  {file.path !== file.name && (
                    <span className={styles.filePath}>{file.path}</span>
                  )}
                  <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                  {file.language && (
                    <span className={styles.fileLanguage}>{file.language}</span>
                  )}
                </div>
              </div>
              <button
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(file.id);
                }}
                title="Dosyayı Kaldır"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {filteredFiles.length === 0 && searchTerm && (
          <div className={styles.noResults}>
            <p>"{searchTerm}" için sonuç bulunamadı</p>
          </div>
        )}
      </div>

      {/* Code Viewer Modal */}
      {selectedFile && (
        <CodeViewer
          file={selectedFile}
          content={getFileContent(selectedFile.id) || ''}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </>
  );
};

/**
 * Dosya tipine göre emoji icon döndür
 */
function getFileIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    '.ts': '📘',
    '.tsx': '⚛️',
    '.js': '📜',
    '.jsx': '⚛️',
    '.py': '🐍',
    '.java': '☕',
    '.go': '🐹',
    '.rs': '🦀',
    '.c': '©️',
    '.cpp': '➕',
    '.cs': '#️⃣',
    '.rb': '💎',
    '.php': '🐘',
    '.swift': '🦅',
    '.kt': '🅺',
    '.html': '🌐',
    '.css': '🎨',
    '.json': '📋',
    '.md': '📝',
    '.yml': '⚙️',
    '.yaml': '⚙️',
  };
  
  return iconMap[fileType.toLowerCase()] || '📄';
}

